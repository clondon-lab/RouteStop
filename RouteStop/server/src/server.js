const app = require('./app');
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`RouteStop server running on http://localhost:${PORT}`);
  if (!process.env.GOOGLE_PLACES_KEY) {
    console.warn('[!] GOOGLE_PLACES_KEY not set — fuel prices will be unavailable');
  }
});
