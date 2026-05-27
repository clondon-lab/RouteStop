import { useState } from 'react';
import NominatimAutocomplete from './NominatimAutocomplete';
import VehicleProfile from './VehicleProfile';
import LifestyleStops from './LifestyleStops';

const FUEL_TYPES = ['regular', 'midgrade', 'premium', 'diesel'];
const OPT_OPTIONS = [
  { key: 'cheapest', label: 'Cheapest', icon: '💰' },
  { key: 'balanced', label: 'Balanced', icon: '⚖️' },
  { key: 'fastest', label: 'Fastest', icon: '⚡' },
];

const inputCls = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

export default function InputPanel({ onPlan, loading, plan, onRescoreChange }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [milesRemaining, setMilesRemaining] = useState('');
  const [fuelType, setFuelType] = useState('regular');
  const [optimizationPreference, setOptimizationPreference] = useState('balanced');
  const [departureTime, setDepartureTime] = useState('');
  const [vehicleProfile, setVehicleProfile] = useState({ makeModel: '', year: '', mpg: '', tankSize: '' });
  const [foodStops, setFoodStops] = useState([]);
  const [hotelStops, setHotelStops] = useState([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const getGeolocation = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`/api/geocode?q=${lat},${lng}`);
          const data = await res.json();
          const loc = data[0] || { lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
          setOrigin({ lat, lng, name: loc.name });
        } catch {
          setOrigin({ lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
        }
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        alert('Could not get your location. Please enter it manually.');
      }
    );
  };

  const validate = () => {
    const errs = {};
    if (!origin) errs.origin = 'Required';
    if (!destination) errs.destination = 'Required';
    if (!milesRemaining || parseFloat(milesRemaining) <= 0) errs.milesRemaining = 'Enter a positive number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onPlan({
      origin,
      destination,
      milesRemaining: parseFloat(milesRemaining),
      fuelType,
      optimizationPreference,
      vehicleProfile,
      foodStops: foodStops.filter((s) => s.atMile),
      hotelStops: hotelStops.filter((s) => s.atMile),
      departureTime: departureTime || null,
    });
  };

  const handleOptChange = (key) => {
    setOptimizationPreference(key);
    if (plan) onRescoreChange?.(key);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Route */}
      <section>
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs flex items-center justify-center font-bold">1</div>
          <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-widest">Your Route</h3>
        </div>
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <div className="flex-1">
              <NominatimAutocomplete
                label="Origin"
                value={origin}
                onChange={setOrigin}
                placeholder="Starting point"
                onSelect={(r) => setOrigin(r)}
              />
            </div>
            <button
              type="button"
              onClick={getGeolocation}
              disabled={geoLoading}
              title="Use my location"
              className="mt-6 px-2.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              {geoLoading ? '…' : '📍'}
            </button>
          </div>
          {errors.origin && <div className="text-red-400 text-xs">{errors.origin}</div>}

          <NominatimAutocomplete
            label="Destination"
            value={destination}
            onChange={setDestination}
            placeholder="Where are you going?"
            onSelect={(r) => setDestination(r)}
          />
          {errors.destination && <div className="text-red-400 text-xs">{errors.destination}</div>}

          <div>
            <label className={labelCls}>Departure Time <span className="text-slate-600">(optional)</span></label>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className={inputCls + ' [color-scheme:dark]'}
            />
          </div>
        </div>
      </section>

      {/* Step 2: Your Car */}
      <section>
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs flex items-center justify-center font-bold">2</div>
          <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-widest">Your Car</h3>
        </div>
        <div className="space-y-2.5">
          <div>
            <label className={labelCls}>
              Miles Remaining in Tank <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={milesRemaining}
              onChange={(e) => setMilesRemaining(e.target.value)}
              placeholder="e.g. 280"
              min="1"
              className={inputCls + (errors.milesRemaining ? ' border-red-500/50 ring-1 ring-red-500/30' : '')}
            />
            <div className="text-xs text-slate-600 mt-1">Check your dashboard for miles-to-empty</div>
            {errors.milesRemaining && <div className="text-red-400 text-xs mt-0.5">{errors.milesRemaining}</div>}
          </div>

          <div>
            <label className={labelCls}>Fuel Type</label>
            <div className="flex gap-1.5">
              {FUEL_TYPES.map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setFuelType(ft)}
                  className={`flex-1 py-2 text-xs rounded-xl border transition-all capitalize font-medium ${
                    fuelType === ft
                      ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20'
                      : 'border-white/10 text-slate-400 hover:border-green-500/40 hover:text-slate-300 bg-white/3'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Optimization</label>
            <div className="flex gap-1.5">
              {OPT_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => handleOptChange(o.key)}
                  className={`flex-1 py-2.5 text-xs rounded-xl border transition-all flex flex-col items-center gap-1 font-medium ${
                    optimizationPreference === o.key
                      ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20'
                      : 'border-white/10 text-slate-400 hover:border-green-500/40 hover:text-slate-300 bg-white/3'
                  }`}
                >
                  <span>{o.icon}</span>
                  <span>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <VehicleProfile value={vehicleProfile} onChange={setVehicleProfile} />
        </div>
      </section>

      {/* Step 3: Extra Stops */}
      <section>
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs flex items-center justify-center font-bold">3</div>
          <h3 className="font-semibold text-slate-300 text-xs uppercase tracking-widest">Extra Stops</h3>
        </div>
        <LifestyleStops
          foodStops={foodStops}
          hotelStops={hotelStops}
          onChange={({ food, hotel }) => { setFoodStops(food); setHotelStops(hotel); }}
        />
      </section>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3.5 bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 ${loading ? 'btn-glow-pulse' : ''}`}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Planning your trip…
          </>
        ) : (
          '🗺️  Plan My Trip'
        )}
      </button>
    </form>
  );
}
