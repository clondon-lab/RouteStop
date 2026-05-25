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

// Merge Overpass stations with Google Places price data by proximity
function mergeWithPrices(overpassStations, googleStations) {
  return overpassStations.map((station) => {
    const nearby = googleStations
      .map((gs) => {
        const dx = (gs.lat - station.lat) * 111000;
        const dy = (gs.lng - station.lng) * 111000;
        return { gs, dist: Math.sqrt(dx * dx + dy * dy) };
      })
      .filter(({ dist }) => dist < 200) // within ~200m
      .sort((a, b) => a.dist - b.dist)[0];

    return {
      ...station,
      price: nearby?.gs.price ?? null,
      priceUpdated: nearby?.gs.priceUpdated ?? null,
      googlePlaceId: nearby?.gs.googlePlaceId ?? null,
    };
  });
}

// Add detour approximation (avoid OSRM per-station calls for speed)
function addDetours(stations, routeCoords) {
  return stations.map((s) => ({
    ...s,
    detour: approxDetour(s.lat, s.lng, routeCoords),
  }));
}

// Calculate ETA at a given distance along route
function calcEta(departureMs, distanceAlongRoute, totalDistance, totalDurationSec) {
  if (!departureMs || !totalDurationSec) return null;
  const frac = distanceAlongRoute / totalDistance;
  const elapsedSec = frac * totalDurationSec;
  return new Date(departureMs + elapsedSec * 1000).toISOString();
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
      foodStops = [],
      hotelStops = [],
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

    // 2. Full range
    let fullRangeMiles = mr;
    if (vehicleProfile?.mpg && vehicleProfile?.tankSize) {
      fullRangeMiles = parseFloat(vehicleProfile.mpg) * parseFloat(vehicleProfile.tankSize);
    }

    // 3. Stop zones
    const zones = calcStopZones(geometry, mr, fullRangeMiles);
    const noGasNeeded = zones.length === 0;

    const weights = WEIGHTS[optimizationPreference] || WEIGHTS.balanced;
    const departureMs = departureTime ? new Date(departureTime).getTime() : null;

    // 4. Gas stops (parallel zones)
    const gasStops = await Promise.all(
      zones.map(async (zone, idx) => {
        let radius = corridorRadius;
        let stations = [];
        let widened = false;

        while (radius <= 5 && stations.length === 0) {
          if (radius > corridorRadius) widened = true;
          const [overpassStations, googleStations] = await Promise.all([
            getGasStations(zone.center.lat, zone.center.lng, radius).catch(() => []),
            getGasStationsWithPrices(zone.center.lat, zone.center.lng, radius, fuelType).catch(() => []),
          ]);

          if (overpassStations.length > 0) {
            const merged = mergeWithPrices(overpassStations, googleStations);
            stations = addDetours(merged, coords);
          } else if (googleStations.length > 0) {
            // Overpass unavailable — use Google Places as station source
            stations = addDetours(googleStations, coords);
            break;
          } else {
            radius += 0.5;
          }
        }

        const scored = scoreStations(stations, weights.p, weights.d);
        const eta = calcEta(departureMs, zone.distanceAlongRoute, totalDistance, totalDuration);

        return {
          type: 'gas',
          zoneIndex: idx,
          distanceAlongRoute: zone.distanceAlongRoute,
          center: zone.center,
          radiusUsed: radius,
          widened,
          noStationsFound: scored.length === 0,
          stations: scored,
          selected: scored[0] || null,
          eta,
        };
      })
    );

    // 5. Food stops
    const foodStopResults = await Promise.all(
      foodStops.map(async (fs) => {
        const point = getPointAtDistance(coords, cum, parseFloat(fs.atMile));
        const candidates = await getRestaurants(point.lat, point.lng, 1).catch(() => []);
        const eta = calcEta(departureMs, parseFloat(fs.atMile), totalDistance, totalDuration);
        return {
          type: 'food',
          requestedAtMile: parseFloat(fs.atMile),
          requestedTime: fs.timeWindow || null,
          point,
          candidates,
          selected: candidates[0] || null,
          eta,
        };
      })
    );

    // 6. Hotel stops
    const hotelStopResults = await Promise.all(
      hotelStops.map(async (hs) => {
        const point = getPointAtDistance(coords, cum, parseFloat(hs.atMile));
        const candidates = await getHotels(point.lat, point.lng, 1).catch(() => []);
        const eta = calcEta(departureMs, parseFloat(hs.atMile), totalDistance, totalDuration);
        return {
          type: 'hotel',
          requestedAtMile: parseFloat(hs.atMile),
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
