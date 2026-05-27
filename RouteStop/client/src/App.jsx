import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import MapView from './components/MapView';
import InputPanel from './components/InputPanel';
import ItineraryPanel from './components/ItineraryPanel';
import SavedTrips from './components/SavedTrips';
import NominatimAutocomplete from './components/NominatimAutocomplete';
import PlanningLoader from './components/PlanningLoader';
import { rescoreTripPlan } from './utils/scoring';
import { loadTrips, saveTrip } from './utils/storage';

export default function App() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusedStop, setFocusedStop] = useState(null);
  const [savedTrips, setSavedTrips] = useState([]);
  const [showSavedTrips, setShowSavedTrips] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [tab, setTab] = useState('plan'); // 'plan' | 'itinerary'

  // Mid-trip recalculation state
  const [midTrip, setMidTrip] = useState(false);
  const [midTripOrigin, setMidTripOrigin] = useState(null);
  const [midTripMiles, setMidTripMiles] = useState('');
  const [lastPlanParams, setLastPlanParams] = useState(null);

  // Current origin/destination for the map
  const [currentOrigin, setCurrentOrigin] = useState(null);
  const [currentDest, setCurrentDest] = useState(null);

  useEffect(() => {
    setSavedTrips(loadTrips());
  }, []);

  const handlePlan = async (params) => {
    setLoading(true);
    setError(null);
    setLastPlanParams(params);
    setCurrentOrigin(params.origin);
    setCurrentDest(params.destination);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Planning failed');
      setPlan(data);
      setTab('itinerary');
      setFocusedStop(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRescore = (preference) => {
    setPlan((p) => rescoreTripPlan(p, preference));
  };

  const handleSelectStation = (stop, candidate) => {
    setPlan((p) => {
      const newItinerary = p.itinerary.map((s) => {
        if (s.type === 'gas' && stop.type === 'gas' && s.zoneIndex === stop.zoneIndex)
          return { ...s, selected: candidate };
        if (s.type === 'food' && stop.type === 'food' && s.requestedAtMile === stop.requestedAtMile)
          return { ...s, selected: candidate };
        if (s.type === 'hotel' && stop.type === 'hotel' && s.requestedAtMile === stop.requestedAtMile)
          return { ...s, selected: candidate };
        return s;
      });
      if (stop.type === 'gas') {
        return {
          ...p,
          gasStops: p.gasStops.map((gs, i) => i === stop.zoneIndex ? { ...gs, selected: candidate } : gs),
          itinerary: newItinerary,
        };
      }
      if (stop.type === 'food') {
        return {
          ...p,
          foodStops: p.foodStops.map((fs) =>
            fs.requestedAtMile === stop.requestedAtMile ? { ...fs, selected: candidate } : fs
          ),
          itinerary: newItinerary,
        };
      }
      if (stop.type === 'hotel') {
        return {
          ...p,
          hotelStops: p.hotelStops.map((hs) =>
            hs.requestedAtMile === stop.requestedAtMile ? { ...hs, selected: candidate } : hs
          ),
          itinerary: newItinerary,
        };
      }
      return p;
    });
  };

  const handleSaveTrip = () => {
    if (!plan) return;
    const trip = saveTrip(saveName || undefined, { ...plan, origin: currentOrigin, destination: currentDest });
    setSavedTrips(loadTrips());
    setShowSaveInput(false);
    setSaveName('');
  };

  const handleLoadTrip = (trip) => {
    setPlan(trip.plan);
    setCurrentOrigin(trip.plan.origin);
    setCurrentDest(trip.plan.destination);
    setTab('itinerary');
  };

  const handleMidTripReplan = async () => {
    if (!midTripOrigin || !midTripMiles || !lastPlanParams) return;
    const params = {
      ...lastPlanParams,
      origin: midTripOrigin,
      milesRemaining: parseFloat(midTripMiles),
    };
    setMidTrip(false);
    setMidTripOrigin(null);
    setCurrentOrigin(midTripOrigin);
    await handlePlan(params);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Left panel */}
      <div className="w-full md:w-[420px] md:min-w-[420px] flex flex-col bg-white shadow-lg z-10 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <div>
              <h1 className="font-bold text-base leading-tight">RouteStop</h1>
              <p className="text-blue-200 text-xs">Gas, Food & Rest — planned</p>
            </div>
          </div>
          <button
            onClick={() => setShowSavedTrips(true)}
            className="text-xs bg-blue-700 hover:bg-blue-800 transition-colors px-2.5 py-1.5 rounded-lg"
          >
            Saved Trips ({savedTrips.length})
          </button>
        </div>

        {/* Tabs */}
        {plan && (
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab('plan')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === 'plan' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Edit Trip
            </button>
            <button
              onClick={() => setTab('itinerary')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === 'itinerary' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Itinerary
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto panel-scroll p-4 space-y-4">
          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
              <span>⚠️</span>
              <div>
                <div className="font-medium">Error</div>
                <div>{error}</div>
                <button onClick={() => setError(null)} className="text-xs text-red-500 mt-1 underline">Dismiss</button>
              </div>
            </div>
          )}

          {loading && <PlanningLoader />}

          {!loading && (!plan || tab === 'plan') && (
            <InputPanel
              onPlan={handlePlan}
              loading={loading}
              plan={plan}
              onRescoreChange={handleRescore}
            />
          )}

          {plan && tab === 'itinerary' && (
            <>
              <ItineraryPanel
                plan={plan}
                onSelectStation={handleSelectStation}
                onStopFocus={setFocusedStop}
              />

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 pb-4">
                {!showSaveInput ? (
                  <button
                    onClick={() => setShowSaveInput(true)}
                    className="flex-1 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    💾 Save Trip
                  </button>
                ) : (
                  <div className="flex-1 flex gap-1">
                    <input
                      autoFocus
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="Trip name…"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTrip()}
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button onClick={handleSaveTrip} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">Save</button>
                    <button onClick={() => setShowSaveInput(false)} className="px-2 py-1.5 text-gray-400 text-xs">✕</button>
                  </div>
                )}
                <button
                  onClick={() => setMidTrip(true)}
                  className="flex-1 py-2 text-sm border border-blue-200 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors"
                >
                  📍 Update Position
                </button>
              </div>

              {/* Mid-trip recalculation UI */}
              {midTrip && (
                <div className="border border-blue-200 rounded-xl p-3 bg-blue-50 space-y-2">
                  <div className="text-sm font-medium text-blue-800">Update Your Position</div>
                  <NominatimAutocomplete
                    placeholder="Where are you now?"
                    onSelect={(r) => setMidTripOrigin(r)}
                    onChange={() => setMidTripOrigin(null)}
                  />
                  <input
                    type="number"
                    value={midTripMiles}
                    onChange={(e) => setMidTripMiles(e.target.value)}
                    placeholder="Miles remaining in tank"
                    min="1"
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleMidTripReplan}
                      disabled={!midTripOrigin || !midTripMiles || loading}
                      className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Replan from Here
                    </button>
                    <button
                      onClick={() => setMidTrip(false)}
                      className="px-3 py-2 text-gray-500 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Map panel */}
      <div className="flex-1 relative hidden md:block">
        <MapView
          plan={plan}
          origin={currentOrigin}
          destination={currentDest}
          focusedStop={focusedStop}
        />
      </div>

      {/* Saved trips modal */}
      {showSavedTrips && (
        <SavedTrips
          trips={savedTrips}
          onLoad={handleLoadTrip}
          onClose={() => setShowSavedTrips(false)}
          onChange={setSavedTrips}
        />
      )}
    </div>
  );
}
