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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Step 1: Route */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</div>
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Your Route</h3>
        </div>
        <div className="space-y-2">
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
              title="Use my current location"
              className="mt-5 px-2.5 py-2 border border-gray-200 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
            >
              {geoLoading ? '…' : '📍'}
            </button>
          </div>
          {errors.origin && <div className="text-red-500 text-xs">{errors.origin}</div>}

          <NominatimAutocomplete
            label="Destination"
            value={destination}
            onChange={setDestination}
            placeholder="Where are you going?"
            onSelect={(r) => setDestination(r)}
          />
          {errors.destination && <div className="text-red-500 text-xs">{errors.destination}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Departure Time (optional)</label>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Step 2: Your Car */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</div>
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Your Car</h3>
        </div>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Miles Remaining <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={milesRemaining}
              onChange={(e) => setMilesRemaining(e.target.value)}
              placeholder="e.g. 280"
              min="1"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.milesRemaining ? 'border-red-400' : 'border-gray-200'}`}
            />
            <div className="text-xs text-gray-400 mt-0.5">Check your dashboard for miles-to-empty</div>
            {errors.milesRemaining && <div className="text-red-500 text-xs">{errors.milesRemaining}</div>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fuel Type</label>
            <div className="flex gap-1">
              {FUEL_TYPES.map((ft) => (
                <button
                  key={ft}
                  type="button"
                  onClick={() => setFuelType(ft)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors capitalize ${
                    fuelType === ft
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Optimization</label>
            <div className="flex gap-1">
              {OPT_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => handleOptChange(o.key)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors flex flex-col items-center gap-0.5 ${
                    optimizationPreference === o.key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
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
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</div>
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Extra Stops</h3>
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
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Planning your trip…
          </>
        ) : (
          '🗺️ Plan My Trip'
        )}
      </button>
    </form>
  );
}
