const express = require('express');
const { getRoute } = require('../services/osrm');
const { getGasStations, getRestaurants, getHotels } = require('../services/overpass');
const { getFuelPrices, getGasStationsWithPrices } = require('../services/googlePlaces');
const { scoreStations } = require('../services/scoring');
const {
  calcStopZones,
  getPointAtDistance,
  buildCumDist,
  approxDetour,
} = require('../services/stopZoneCalc');

const router = express.Router();

const WEIGHTS = {
  cheapest: { p: 1.0, d: 0.0 },
  balanced: { p: 0.5, d: 0.5 },
  fastest: { p: 0.0, d: 1.0 },
};

function mergeWithPrices(overpassStations, googleStations) {
  return overpassStations.map((station) => {
    const nearby = googleStations
      .map((gs) => {
        const dx = (gs.lat - station.lat) * 111000;
        const dy = (gs.lng - station.lng) * 111000;
        return { gs, dist: Math.sqrt(dx * dx + dy * dy) };
      })
      .filter(({ dist }) => dist < 200)
      .sort((a, b) => a.dist - b.dist)[0];

    return {
      ...station,
      price: nearby?.gs.price ?? null,
      priceUpdated: nearby?.gs.priceUpdated ?? null,
      googlePlaceId: nearby?.gs.googlePlaceId ?? null,
    };
  });
}

function addDetours(stations, routeCoords) {
  return stations.map((s) => ({
    ...s,
    detour: approxDetour(s.lat, s.lng, routeCoords),
  }));
}

function calcEta(departureMs, distanceAlongRoute, totalDistance, totalDurationSec) {
  if (!departureMs || !totalDurationSec) return null;
  const frac = distanceAlongRoute / totalDistance;
  const elapsedSec = frac * totalDurationSec;
  return new Date(departureMs + elapsedSec * 1000).toISOString();
}

// Search for gas stations at a given point, expanding radius if needed.
// Returns { stations, radiusUsed, widened }.
async function searchGasAtPoint(lat, lng, startRadius, maxRadius, fuelType, coords) {
  let radius = startRadius;
  while (radius <= maxRadius) {
    const [overpass, google] = await Promise.all([
      getGasStations(lat, lng, radius).catch(() => []),
      getGasStationsWithPrices(lat, lng, radius, fuelType).catch(() => []),
    ]);
    if (overpass.length > 0) {
      return { stations: addDetours(mergeWithPrices(overpass, google), coords), radiusUsed: radius, widened: radius > startRadius };
    }
    if (google.length > 0) {
      return { stations: addDetours(google, coords), radiusUsed: radius, widened: false };
    }
    radius += 0.5;
  }
  return { stations: [], radiusUsed: maxRadius, widened: true };
}

// Find gas stations for a zone, falling back to nearby corridor points if the center is empty.
async function findGasStationsInZone(zone, corridorRadius, fuelType, coords, cum, totalDistance) {
  // Phase 1: search at zone center with expanding radius up to 5 mi
  const primary = await searchGasAtPoint(
    zone.center.lat, zone.center.lng,
    corridorRadius, 5, fuelType, coords
  );
  if (primary.stations.length > 0) {
    return { ...primary, noStationsFound: false };
  }

  // Phase 2: walk along the route ±15, ±30, ±45 miles from the zone center
  const shifts = [15, -15, 30, -30, 45, -45];
  for (const shift of shifts) {
    const shiftedDist = Math.max(0, Math.min(zone.distanceAlongRoute + shift, totalDistance - 1));
    const pt = getPointAtDistance(coords, cum, shiftedDist);
    const result = await searchGasAtPoint(pt.lat, pt.lng, 2, 4, fuelType, coords);
    if (result.stations.length > 0) {
      return { ...result, widened: true, noStationsFound: false };
    }
  }

  return { stations: [], radiusUsed: 5, widened: true, noStationsFound: true };
}

router.post('/', async (req, res) => {
  try {
    const {
      origin,
      destination,
      milesRemaining,
      fuelType = 'regular',
      optimizationPreference = 'balanced',
      vehicleProfile = null,
      foodStopCount = 0,
      hotelStopCount = 0,
      corridorRadius = 1,
      departureTime = null,
    } = req.body;

    if (!origin || !destination || !milesRemaining) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const mr = parseFloat(milesRemaining);
    if (isNaN(mr) || mr <= 0) {
      return res.status(400).json({ error: 'Miles remaining must be a positive number' });
    }

    // 1. Route
    const routeData = await getRoute(origin.lat, origin.lng, destination.lat, destination.lng);
    const { geometry, distance: totalDistance, duration: totalDuration } = routeData;
    const coords = geometry.coordinates;
    const cum = buildCumDist(coords);

    // 2. Full range — when no vehicle profile, assume a realistic full-tank default
    // so stop spacing stays reasonable regardless of how low the current tank is.
    let fullRangeMiles = mr;
    if (vehicleProfile?.mpg && vehicleProfile?.tankSize) {
      fullRangeMiles = parseFloat(vehicleProfile.mpg) * parseFloat(vehicleProfile.tankSize);
    } else {
      fullRangeMiles = Math.max(mr, 300);
    }

    // 3. Stop zones (cap at 7)
    const zones = calcStopZones(geometry, mr, fullRangeMiles).slice(0, 7);
    const noGasNeeded = zones.length === 0;

    const weights = WEIGHTS[optimizationPreference] || WEIGHTS.balanced;
    const departureMs = departureTime ? new Date(departureTime).getTime() : null;

    // 4. Gas stops — corridor-aware search
    const gasStops = await Promise.all(
      zones.map(async (zone, idx) => {
        const found = await findGasStationsInZone(
          zone, corridorRadius, fuelType, coords, cum, totalDistance
        );
        const scored = scoreStations(found.stations, weights.p, weights.d);
        const eta = calcEta(departureMs, zone.distanceAlongRoute, totalDistance, totalDuration);

        return {
          type: 'gas',
          zoneIndex: idx,
          distanceAlongRoute: zone.distanceAlongRoute,
          center: zone.center,
          radiusUsed: found.radiusUsed,
          widened: found.widened,
          noStationsFound: found.noStationsFound,
          stations: scored,
          selected: scored[0] || null,
          eta,
        };
      })
    );

    // 5. Auto-place food stops evenly along the route based on count
    const foodStopMiles = Array.from({ length: foodStopCount }, (_, i) =>
      (totalDistance * (i + 1)) / (foodStopCount + 1)
    );
    const foodStopResults = await Promise.all(
      foodStopMiles.map(async (atMile) => {
        const point = getPointAtDistance(coords, cum, atMile);
        const candidates = await getRestaurants(point.lat, point.lng, 1).catch(() => []);
        const eta = calcEta(departureMs, atMile, totalDistance, totalDuration);
        return {
          type: 'food',
          requestedAtMile: atMile,
          point,
          candidates,
          selected: candidates[0] || null,
          eta,
        };
      })
    );

    // 6. Auto-place hotel stops evenly along the route based on count
    const hotelStopMiles = Array.from({ length: hotelStopCount }, (_, i) =>
      (totalDistance * (i + 1)) / (hotelStopCount + 1)
    );
    const hotelStopResults = await Promise.all(
      hotelStopMiles.map(async (atMile) => {
        const point = getPointAtDistance(coords, cum, atMile);
        const candidates = await getHotels(point.lat, point.lng, 1).catch(() => []);
        const eta = calcEta(departureMs, atMile, totalDistance, totalDuration);
        return {
          type: 'hotel',
          requestedAtMile: atMile,
          point,
          candidates,
          selected: candidates[0] || null,
          eta,
        };
      })
    );

    // 7. Itinerary: all stops sorted by distance along route
    const allStops = [
      ...gasStops.map((s) => ({ ...s, sortKey: s.distanceAlongRoute })),
      ...foodStopResults.map((s) => ({ ...s, sortKey: s.requestedAtMile })),
      ...hotelStopResults.map((s) => ({ ...s, sortKey: s.requestedAtMile })),
    ].sort((a, b) => a.sortKey - b.sortKey);

    // 8. Fuel cost estimate
    let estimatedFuelCost = null;
    if (vehicleProfile?.mpg) {
      const mpg = parseFloat(vehicleProfile.mpg);
      const gallonsNeeded = totalDistance / mpg;
      const pricedStops = gasStops.filter((s) => s.selected?.price);
      if (pricedStops.length > 0) {
        const avgPrice = pricedStops.reduce((s, gs) => s + gs.selected.price, 0) / pricedStops.length;
        estimatedFuelCost = gallonsNeeded * avgPrice;
      }
    }

    res.json({
      route: { geometry, distance: totalDistance, duration: totalDuration },
      gasStops,
      foodStops: foodStopResults,
      hotelStops: hotelStopResults,
      itinerary: allStops,
      summary: {
        totalDistance,
        totalDuration,
        gasStopCount: gasStops.length,
        noGasNeeded,
        estimatedFuelCost,
        fullRangeMiles,
        hasGooglePrices: !!process.env.GOOGLE_PLACES_KEY,
      },
    });
  } catch (err) {
    console.error('[Plan]', err.message);
    if (err.message?.includes('OSRM')) {
      return res.status(502).json({ error: "Couldn't calculate a route. Check your origin and destination." });
    }
    res.status(500).json({ error: err.message || 'Failed to plan trip' });
  }
});

module.exports = router;
