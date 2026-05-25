const express = require('express');
const { search } = require('../services/nominatim');
const { geocodeAddress } = require('../services/googlePlaces');

const router = express.Router();

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);
  try {
    const results = await search(q.trim(), 5);
    if (results.length > 0) return res.json(results);
    // Nominatim found nothing (common for US residential addresses) — try Google
    const googleResults = await geocodeAddress(q.trim());
    res.json(googleResults);
  } catch (err) {
    // Nominatim failed entirely — try Google before giving up
    try {
      res.json(await geocodeAddress(q.trim()));
    } catch {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
