function scoreStations(stations, wPrice = 0.5, wDetour = 0.5) {
  if (!stations.length) return [];

  const withPrice = stations.filter((s) => s.price !== null && s.price !== undefined);
  const prices = withPrice.map((s) => s.price);
  const pMin = Math.min(...prices);
  const pMax = Math.max(...prices);

  const detours = stations.map((s) => s.detour ?? 0);
  const dMin = Math.min(...detours);
  const dMax = Math.max(...detours);

  return stations
    .map((s) => {
      const priceNorm =
        s.price !== null && pMax !== pMin ? (s.price - pMin) / (pMax - pMin) : null;
      const detourNorm = dMax !== dMin ? ((s.detour ?? 0) - dMin) / (dMax - dMin) : 0;

      let score;
      if (priceNorm !== null) {
        score = wPrice * priceNorm + wDetour * detourNorm;
      } else {
        // No price: score only on detour, slight penalty so priced stations rank first
        score = 0.5 + wDetour * detourNorm;
      }

      return { ...s, score, priceNorm, detourNorm, noPriceData: priceNorm === null };
    })
    .sort((a, b) => a.score - b.score);
}

module.exports = { scoreStations };
