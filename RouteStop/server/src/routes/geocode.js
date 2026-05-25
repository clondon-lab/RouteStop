const express = require('express');
const { search, reverse } = require('../services/nominatim');
const { geocodeAddress } = require('../services/googlePlaces');

const router = express.Router();

const COORD_RE = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);

  // Reverse geocode when query is "lat,lng"
  const coords = q.trim().match(COORD_RE);
  if (coords) {
    try {
      const result = await reverse(parseFloat(coords[1]), parseFloat(coords[2]));
      return res.json(result ? [result] : []);
    } catch {
      return res.json([]);
    }
  }

  // Text search: Google first (reliable from Vercel), Nominatim as fallback
  try {
    const googleResults = await geocodeAddress(q.trim());
    if (googleResults.length > 0) return res.json(googleResults);
    res.json(await search(q.trim(), 5));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
