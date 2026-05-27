const axios = require('axios');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const cache = new Map();

function cacheKey(lat, lng, radiusMiles, type) {
  return `${lat.toFixed(2)},${lng.toFixed(2)},${radiusMiles},${type}`;
}

function fromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}

function toCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

function bbox(lat, lng, radiusMiles) {
  const deg = radiusMiles / 69.0;
  return `${lat - deg},${lng - deg},${lat + deg},${lng + deg}`;
}

async function query(ql) {
  const response = await axios.post(OVERPASS_URL, `data=${encodeURIComponent(ql)}`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 25000,
  });
  return response.data.elements || [];
}

function normalizeNode(node) {
  return {
    id: String(node.id),
    lat: node.lat,
    lng: node.lon,
    name: node.tags?.name || null,
    brand: node.tags?.brand || null,
    tags: node.tags || {},
  };
}

async function getGasStations(lat, lng, radiusMiles = 1) {
  const key = cacheKey(lat, lng, radiusMiles, 'gas');
  const cached = fromCache(key);
  if (cached) return cached;

  const b = bbox(lat, lng, radiusMiles);
  const ql = `[out:json][timeout:25];node["amenity"="fuel"](${b});out body;`;
  const elements = await query(ql);
  const result = elements.map(normalizeNode);
  toCache(key, result);
  return result;
}

async function getRestaurants(lat, lng, radiusMiles = 1) {
  const key = cacheKey(lat, lng, radiusMiles, 'food');
  const cached = fromCache(key);
  if (cached) return cached;

  const b = bbox(lat, lng, radiusMiles);
  const ql = `[out:json][timeout:25];(node["amenity"="restaurant"](${b});node["amenity"="fast_food"](${b});node["amenity"="cafe"](${b}););out body;`;
  const elements = await query(ql);
  const result = elements.map((n) => ({
    ...normalizeNode(n),
    cuisine: n.tags?.cuisine || null,
    amenityType: n.tags?.amenity,
    hours: n.tags?.opening_hours || null,
    website: n.tags?.website || null,
  }));
  toCache(key, result);
  return result;
}

async function getHotels(lat, lng, radiusMiles = 1) {
  const key = cacheKey(lat, lng, radiusMiles, 'hotel');
  const cached = fromCache(key);
  if (cached) return cached;

  const b = bbox(lat, lng, radiusMiles);
  const ql = `[out:json][timeout:25];(node["tourism"="hotel"](${b});node["tourism"="motel"](${b});node["tourism"="hostel"](${b}););out body;`;
  const elements = await query(ql);
  const result = elements.map((n) => ({
    ...normalizeNode(n),
    stars: n.tags?.stars || null,
    tourismType: n.tags?.tourism,
    website: n.tags?.website || null,
    phone: n.tags?.phone || null,
  }));
  toCache(key, result);
  return result;
}

module.exports = { getGasStations, getRestaurants, getHotels };
