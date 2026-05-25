const axios = require('axios');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

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
  const b = bbox(lat, lng, radiusMiles);
  const ql = `[out:json][timeout:25];node["amenity"="fuel"](${b});out body;`;
  const elements = await query(ql);
  return elements.map(normalizeNode);
}

async function getRestaurants(lat, lng, radiusMiles = 1) {
  const b = bbox(lat, lng, radiusMiles);
  const ql = `[out:json][timeout:25];(node["amenity"="restaurant"](${b});node["amenity"="fast_food"](${b});node["amenity"="cafe"](${b}););out body;`;
  const elements = await query(ql);
  return elements.map((n) => ({
    ...normalizeNode(n),
    cuisine: n.tags?.cuisine || null,
    amenityType: n.tags?.amenity,
    hours: n.tags?.opening_hours || null,
    website: n.tags?.website || null,
  }));
}

async function getHotels(lat, lng, radiusMiles = 1) {
  const b = bbox(lat, lng, radiusMiles);
  const ql = `[out:json][timeout:25];(node["tourism"="hotel"](${b});node["tourism"="motel"](${b});node["tourism"="hostel"](${b}););out body;`;
  const elements = await query(ql);
  return elements.map((n) => ({
    ...normalizeNode(n),
    stars: n.tags?.stars || null,
    tourismType: n.tags?.tourism,
    website: n.tags?.website || null,
    phone: n.tags?.phone || null,
  }));
}

module.exports = { getGasStations, getRestaurants, getHotels };
