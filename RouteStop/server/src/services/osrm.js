const axios = require('axios');

const OSRM_BASE = 'https://router.project-osrm.org';

async function getRoute(originLat, originLng, destLat, destLng) {
  const url = `${OSRM_BASE}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}`;
  const response = await axios.get(url, {
    params: { overview: 'full', geometries: 'geojson' },
    timeout: 15000,
  });
  if (response.data.code !== 'Ok') throw new Error('OSRM: no route found');
  const route = response.data.routes[0];
  return {
    geometry: route.geometry,
    distance: route.distance * 0.000621371, // meters → miles
    duration: route.duration,               // seconds
  };
}

async function getDetourDistance(originLat, originLng, waypointLat, waypointLng, destLat, destLng, directMiles) {
  const url = `${OSRM_BASE}/route/v1/driving/${originLng},${originLat};${waypointLng},${waypointLat};${destLng},${destLat}`;
  try {
    const response = await axios.get(url, {
      params: { overview: 'false' },
      timeout: 8000,
    });
    if (response.data.code !== 'Ok') return null;
    const routedMiles = response.data.routes[0].distance * 0.000621371;
    return Math.max(0, routedMiles - directMiles);
  } catch {
    return null;
  }
}

module.exports = { getRoute, getDetourDistance };
