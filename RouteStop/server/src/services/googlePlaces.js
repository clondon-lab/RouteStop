const axios = require('axios');

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchNearby';

const FUEL_TYPE_MAP = {
  regular: 'REGULAR_UNLEADED',
  midgrade: 'MIDGRADE',
  premium: 'PREMIUM',
  diesel: 'DIESEL',
};

async function getFuelPrices(lat, lng, radiusMiles = 1, fuelType = 'regular') {
  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) return [];

  const radiusMeters = Math.min(radiusMiles * 1609.34, 50000);
  const targetType = FUEL_TYPE_MAP[fuelType] || 'REGULAR_UNLEADED';

  try {
    const response = await axios.post(
      PLACES_URL,
      {
        includedTypes: ['gas_station'],
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
        },
        maxResultCount: 20,
      },
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.fuelOptions',
        },
        timeout: 10000,
      }
    );

    return (response.data.places || []).map((place) => {
      const fuelPrices = place.fuelOptions?.fuelPrices || [];
      const match = fuelPrices.find((fp) => fp.type === targetType);
      const priceValue =
        match?.price ? match.price.units + (match.price.nanos || 0) / 1e9 : null;

      return {
        googlePlaceId: place.id,
        name: place.displayName?.text || null,
        lat: place.location.latitude,
        lng: place.location.longitude,
        price: priceValue,
        priceUpdated: match?.updateTime || null,
        allPrices: fuelPrices.map((fp) => ({
          type: fp.type,
          price: fp.price ? fp.price.units + (fp.price.nanos || 0) / 1e9 : null,
          updated: fp.updateTime,
        })),
      };
    });
  } catch (err) {
    console.error('[Google Places]', err.response?.data?.error?.message || err.message);
    return [];
  }
}

// Returns gas stations with price data AND their location — used as Overpass fallback.
async function getGasStationsWithPrices(lat, lng, radiusMiles = 1, fuelType = 'regular') {
  const results = await getFuelPrices(lat, lng, radiusMiles, fuelType);
  return results.map((r) => ({
    id: r.googlePlaceId,
    lat: r.lat,
    lng: r.lng,
    name: r.name,
    brand: null,
    price: r.price,
    priceUpdated: r.priceUpdated,
    googlePlaceId: r.googlePlaceId,
    source: 'google',
  }));
}

module.exports = { getFuelPrices, getGasStationsWithPrices };
