export function fmtPrice(price) {
  if (price == null) return null;
  return `$${parseFloat(price).toFixed(3)}`;
}

export function fmtMiles(miles) {
  if (miles == null) return '—';
  return `${Math.round(miles).toLocaleString()} mi`;
}

export function fmtDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function fmtEta(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function fmtCost(cost) {
  if (cost == null) return null;
  return `$${cost.toFixed(2)}`;
}
