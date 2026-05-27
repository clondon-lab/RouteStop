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
  const [tab, setTab] = useState('plan');

  const [midTrip, setMidTrip] = useState(false);
  const [midTripOrigin, setMidTripOrigin] = useState(null);
  const [midTripMiles, setMidTripMiles] = useState('');
  const [lastPlanParams, setLastPlanParams] = useState(null);

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
    saveTrip(saveName || undefined, { ...plan, origin: currentOrigin, destination: currentDest });
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

  const itineraryActions = (
    <div className="space-y-3 pt-2 pb-4">
      <div className="flex gap-2">
        {!showSaveInput ? (
          <button
            onClick={() => setShowSaveInput(true)}
            className="flex-1 py-2 text-sm border border-white/10 rounded-xl hover:bg-white/5 text-slate-400 transition-colors"
          >
            💾 Save Trip
          </button>
        ) : (
          <div className="flex-1 flex gap-1.5">
            <input
              autoFocus
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Trip name…"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTrip()}
              className="flex-1 px-2.5 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 text-white placeholder-slate-500"
            />
            <button onClick={handleSaveTrip} className="px-3 py-1.5 bg-green-500 text-white text-xs rounded-lg font-semibold">Save</button>
            <button onClick={() => setShowSaveInput(false)} className="px-2 py-1.5 text-slate-500 text-xs">✕</button>
          </div>
        )}
        <button
          onClick={() => setMidTrip(true)}
          className="flex-1 py-2 text-sm border border-green-500/30 rounded-xl hover:bg-green-500/10 text-green-400 transition-colors"
        >
          📍 Update Position
        </button>
      </div>

      {midTrip && (
        <div className="border border-green-500/20 rounded-xl p-3 bg-green-500/5 space-y-2">
          <div className="text-sm font-semibold text-green-300">Update Your Position</div>
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
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500 text-white placeholder-slate-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleMidTripReplan}
              disabled={!midTripOrigin || !midTripMiles || loading}
              className="flex-1 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-400 disabled:opacity-40 transition-colors font-semibold"
            >
              Replan from Here
            </button>
            <button onClick={() => setMidTrip(false)} className="px-3 py-2 text-slate-500 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900">
      {/* Thin top loading bar */}
      <div className={`absolute top-0 left-0 right-0 z-50 h-0.5 overflow-hidden transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="progress-indeterminate h-full bg-green-500 rounded-full" />
      </div>

      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        <MapView
          plan={plan}
          origin={currentOrigin}
          destination={currentDest}
          focusedStop={focusedStop}
        />
      </div>

      {/* ── DESKTOP ── */}

      {/* Left sidebar */}
      <div className="absolute top-0 left-0 bottom-0 z-20 hidden md:flex flex-col w-[400px] glass-panel">
        <div className="flex-shrink-0 px-5 py-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center text-base">🗺️</div>
            <div>
              <h1 className="font-bold text-white text-sm leading-tight tracking-tight">RouteStop</h1>
              <p className="text-slate-500 text-xs">Gas, Food & Rest — planned</p>
            </div>
          </div>
          <button
            onClick={() => setShowSavedTrips(true)}
            className="text-xs bg-white/5 hover:bg-white/10 border border-white/8 transition-colors px-2.5 py-1.5 rounded-lg text-slate-400"
          >
            Saved ({savedTrips.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto panel-scroll p-5 space-y-4 min-h-0">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-300 flex items-start gap-2">
              <span>⚠️</span>
              <div>
                <div className="font-semibold">Error</div>
                <div className="text-red-400 text-xs mt-0.5">{error}</div>
                <button onClick={() => setError(null)} className="text-xs text-red-500 mt-1 underline">Dismiss</button>
              </div>
            </div>
          )}

          {loading && <PlanningLoader />}
          {!loading && (
            <InputPanel
              onPlan={handlePlan}
              loading={loading}
              plan={plan}
              onRescoreChange={handleRescore}
            />
          )}

          {plan && !loading && (
            <button
              onClick={() => setTab('itinerary')}
              className="w-full py-2.5 text-sm font-semibold text-green-400 border border-green-500/25 rounded-xl hover:bg-green-500/10 transition-colors flex items-center justify-center gap-1.5"
            >
              View Itinerary <span className="text-xs">→</span>
            </button>
          )}
        </div>
      </div>

      {/* Right itinerary drawer */}
      <div
        className={`absolute top-0 right-0 bottom-0 z-20 hidden md:flex flex-col w-[380px] glass-panel-right transition-transform duration-300 ease-out ${
          plan && tab === 'itinerary' ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex-shrink-0 px-5 py-4 flex items-center justify-between border-b border-white/5">
          <h2 className="font-bold text-white text-sm tracking-tight">Your Itinerary</h2>
          <button
            onClick={() => setTab('plan')}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto panel-scroll p-4 space-y-3 min-h-0">
          <ItineraryPanel
            plan={plan}
            onSelectStation={handleSelectStation}
            onStopFocus={setFocusedStop}
          />
          {itineraryActions}
        </div>
      </div>

      {/* ── MOBILE ── */}

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-20 md:hidden glass-panel-bottom rounded-t-2xl flex flex-col" style={{ maxHeight: '72vh' }}>
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-white/15 rounded-full" />
        </div>

        <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🗺️</span>
            <h1 className="font-bold text-white text-sm">RouteStop</h1>
          </div>
          <button onClick={() => setShowSavedTrips(true)} className="text-xs text-slate-500">
            Saved ({savedTrips.length})
          </button>
        </div>

        {plan && (
          <div className="flex border-b border-white/5 flex-shrink-0">
            <button
              onClick={() => setTab('plan')}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                tab === 'plan' ? 'text-green-400 border-b-2 border-green-500' : 'text-slate-500'
              }`}
            >
              Edit Trip
            </button>
            <button
              onClick={() => setTab('itinerary')}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                tab === 'itinerary' ? 'text-green-400 border-b-2 border-green-500' : 'text-slate-500'
              }`}
            >
              Itinerary
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto panel-scroll p-4 space-y-4 min-h-0">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-300">
              ⚠️ {error}
              <button onClick={() => setError(null)} className="text-xs text-red-500 ml-2 underline">Dismiss</button>
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
              {itineraryActions}
            </>
          )}
        </div>
      </div>

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
