// Client-side re-scoring when the user changes their optimization preference.
// Mirrors the server algorithm so we avoid a re-fetch.
export function rescoreStations(stations, optimizationPreference) {
  const weights = { cheapest: [1, 0], balanced: [0.5, 0.5], fastest: [0, 1] };
  const [wP, wD] = weights[optimizationPreference] || [0.5, 0.5];

  if (!stations.length) return stations;

  const withPrice = stations.filter((s) => s.price !== null);
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
      const score =
        priceNorm !== null
          ? wP * priceNorm + wD * detourNorm
          : 0.5 + wD * detourNorm;
      return { ...s, score, priceNorm, detourNorm };
    })
    .sort((a, b) => a.score - b.score);
}

export function rescoreTripPlan(plan, optimizationPreference) {
  if (!plan) return plan;
  return {
    ...plan,
    gasStops: plan.gasStops.map((gs) => {
      const stations = rescoreStations(gs.stations, optimizationPreference);
      return { ...gs, stations, selected: stations[0] || null };
    }),
  };
}
