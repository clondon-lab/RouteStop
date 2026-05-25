require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/geocode', require('./routes/geocode'));
app.use('/api/plan', require('./routes/plan'));
app.get('/api/health', (_, res) => res.json({ ok: true }));

module.exports = app;
