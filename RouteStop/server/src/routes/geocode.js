const express = require('express');
const { search } = require('../services/nominatim');

const router = express.Router();

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.json([]);
  try {
    const results = await search(q.trim(), 5);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
