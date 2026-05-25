const axios = require('axios');

const BASE = 'https://nominatim.openstreetmap.org';
const HEADERS = { 'User-Agent': 'RouteStop/1.0 (clondonpw@gmail.com)' };

async function search(q, limit = 5) {
  const response = await axios.get(`${BASE}/search`, {
    params: { q, format: 'json', limit, addressdetails: 1 },
    headers: HEADERS,
    timeout: 8000,
  });
  return response.data.map((r) => ({
    name: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    type: r.type,
    importance: r.importance,
  }));
}

async function geocode(q) {
  const results = await search(q, 1);
  if (!results.length) throw new Error(`Geocode failed: ${q}`);
  return results[0];
}

module.exports = { search, geocode };
