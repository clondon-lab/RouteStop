const EARTH_MILES = 3958.8;

function haversine(lat1, lng1, lat2, lng2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildCumDist(coords) {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    cum.push(cum[i - 1] + haversine(lat1, lng1, lat2, lng2));
  }
  return cum;
}

function getPointAtDistance(coords, cum, target) {
  const total = cum[cum.length - 1];
  if (target >= total) {
    const last = coords[coords.length - 1];
    return { lat: last[1], lng: last[0] };
  }
  let lo = 0;
  let hi = coords.length - 1;
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (cum[mid] <= target) lo = mid;
    else hi = mid;
  }
  const t = (target - cum[lo]) / (cum[hi] - cum[lo]);
  const [lng1, lat1] = coords[lo];
  const [lng2, lat2] = coords[hi];
  return { lat: lat1 + t * (lat2 - lat1), lng: lng1 + t * (lng2 - lng1) };
}

// Approximate detour as 2× perpendicular distance to nearest route point.
function approxDetour(stationLat, stationLng, coords) {
  let minDist = Infinity;
  for (const [lng, lat] of coords) {
    const d = haversine(lat, lng, stationLat, stationLng);
    if (d < minDist) minDist = d;
  }
  return minDist * 2;
}

function calcStopZones(geometry, milesRemaining, fullRangeMiles) {
  const coords = geometry.coordinates; // [lng, lat]
  const cum = buildCumDist(coords);
  const totalDistance = cum[cum.length - 1];

  const safeFirst = milesRemaining * 0.85;
  if (safeFirst >= totalDistance) return [];

  const zones = [];
  let next = safeFirst;
  const safeSubsequent = fullRangeMiles * 0.85;

  while (next < totalDistance) {
    const center = getPointAtDistance(coords, cum, next);
    zones.push({ distanceAlongRoute: next, center, radiusMiles: 1 });
    next += safeSubsequent;
  }

  return zones;
}

module.exports = { calcStopZones, getPointAtDistance, buildCumDist, approxDetour, haversine };
