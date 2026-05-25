const KEY = 'routestop_trips';

export function loadTrips() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveTrip(name, plan) {
  const trips = loadTrips();
  const trip = {
    id: Date.now().toString(),
    name: name || `Trip ${new Date().toLocaleDateString()}`,
    savedAt: new Date().toISOString(),
    plan,
  };
  trips.unshift(trip);
  localStorage.setItem(KEY, JSON.stringify(trips.slice(0, 20))); // keep last 20
  return trip;
}

export function deleteTrip(id) {
  const trips = loadTrips().filter((t) => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(trips));
  return trips;
}

export function renameTrip(id, name) {
  const trips = loadTrips().map((t) => (t.id === id ? { ...t, name } : t));
  localStorage.setItem(KEY, JSON.stringify(trips));
  return trips;
}
