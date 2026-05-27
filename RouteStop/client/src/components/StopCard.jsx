import { useState } from 'react';
import { fmtPrice, fmtMiles, fmtEta } from '../utils/format';

const STOP_CONFIG = {
  gas: {
    icon: '⛽',
    bgClass: 'bg-green-50 border-green-200',
    badgeClass: 'bg-green-100 text-green-800',
    selectedBorder: 'border-green-500 bg-green-50',
    activeDot: 'bg-green-500',
    label: 'Gas Stop',
  },
  food: {
    icon: '🍽️',
    bgClass: 'bg-orange-50 border-orange-200',
    badgeClass: 'bg-orange-100 text-orange-800',
    selectedBorder: 'border-orange-400 bg-orange-50',
    activeDot: 'bg-orange-400',
    label: 'Food Stop',
  },
  hotel: {
    icon: '🏨',
    bgClass: 'bg-purple-50 border-purple-200',
    badgeClass: 'bg-purple-100 text-purple-800',
    selectedBorder: 'border-purple-400 bg-purple-50',
    activeDot: 'bg-purple-400',
    label: 'Hotel Stop',
  },
};

function detourLabel(detour) {
  if (!detour || detour < 0.1) return 'On route';
  const mins = Math.max(1, Math.round(detour * 1.5));
  return `+${detour.toFixed(1)} mi · ~${mins} min`;
}

function GasStopContent({ stop, onSelectStation }) {
  const [showAll, setShowAll] = useState(false);

  if (stop.noStationsFound) {
    return (
      <div className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-1">
        ⚠️ No stations found in this zone. Refuel before this point.
      </div>
    );
  }

  const visible = showAll ? stop.stations : stop.stations.slice(0, 2);

  return (
    <div className="space-y-2 mt-1">
      {stop.widened && (
        <div className="text-xs text-amber-600">
          ↔ Search widened to {stop.radiusUsed.toFixed(1)} mi radius
        </div>
      )}
      {visible.map((s, i) => {
        const isSelected = s.id === stop.selected?.id;
        return (
          <button
            key={s.id || i}
            type="button"
            onClick={() => onSelectStation(s)}
            className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-green-500 bg-green-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-green-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {s.name || s.brand || 'Gas Station'}
                </div>
                {s.price ? (
                  <div className="text-base font-bold text-green-700 leading-tight">
                    {fmtPrice(s.price)}
                    <span className="text-xs font-normal text-gray-500">/gal</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">Price unavailable</div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-500">{detourLabel(s.detour)}</div>
                {isSelected && (
                  <div className="text-xs text-green-600 font-medium mt-0.5">✓ Selected</div>
                )}
              </div>
            </div>
          </button>
        );
      })}
      {stop.stations.length > 2 && (
        <button
          type="button"
          onClick={() => setShowAll((x) => !x)}
          className="text-xs text-gray-400 hover:text-gray-600 w-full text-center py-0.5"
        >
          {showAll ? 'Show fewer' : `+ ${stop.stations.length - 2} more options`}
        </button>
      )}
    </div>
  );
}

function cuisineLabel(candidate) {
  const raw = candidate.cuisine || candidate.amenityType || '';
  return raw.replace(/_/g, ' ').replace(/;.*/, '').trim() || 'Restaurant';
}

function FoodStopContent({ stop, onSelectStation }) {
  const [showAll, setShowAll] = useState(false);
  const candidates = stop.candidates || [];

  if (candidates.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic mt-1">No restaurants found nearby</div>
    );
  }

  const visible = showAll ? candidates : candidates.slice(0, 4);

  return (
    <div className="space-y-2 mt-1">
      {visible.map((c, i) => {
        const isSelected = c.id === stop.selected?.id;
        return (
          <button
            key={c.id || i}
            type="button"
            onClick={() => onSelectStation(c)}
            className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-orange-400 bg-orange-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-orange-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {c.name || 'Restaurant'}
                </div>
                <div className="text-xs text-gray-500 capitalize">{cuisineLabel(c)}</div>
                {c.hours && (
                  <div className="text-xs text-gray-400 truncate">{c.hours}</div>
                )}
              </div>
              {isSelected && (
                <div className="text-xs text-orange-500 font-medium flex-shrink-0">✓ Selected</div>
              )}
            </div>
          </button>
        );
      })}
      {candidates.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll((x) => !x)}
          className="text-xs text-gray-400 hover:text-gray-600 w-full text-center py-0.5"
        >
          {showAll ? 'Show fewer' : `+ ${candidates.length - 4} more options`}
        </button>
      )}
    </div>
  );
}

function HotelStopContent({ stop, onSelectStation }) {
  const [showAll, setShowAll] = useState(false);
  const candidates = stop.candidates || [];

  if (candidates.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic mt-1">No hotels found nearby</div>
    );
  }

  const visible = showAll ? candidates : candidates.slice(0, 3);

  return (
    <div className="space-y-2 mt-1">
      {visible.map((c, i) => {
        const isSelected = c.id === stop.selected?.id;
        return (
          <button
            key={c.id || i}
            type="button"
            onClick={() => onSelectStation(c)}
            className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-purple-400 bg-purple-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {c.name || 'Hotel'}
                </div>
                <div className="text-xs text-gray-500 capitalize">{c.tourismType || 'Hotel'}</div>
                {c.stars && (
                  <div className="text-xs text-yellow-500">
                    {'★'.repeat(Math.min(parseInt(c.stars, 10), 5))}
                  </div>
                )}
              </div>
              {isSelected && (
                <div className="text-xs text-purple-500 font-medium flex-shrink-0">✓ Selected</div>
              )}
            </div>
          </button>
        );
      })}
      {candidates.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((x) => !x)}
          className="text-xs text-gray-400 hover:text-gray-600 w-full text-center py-0.5"
        >
          {showAll ? 'Show fewer' : `+ ${candidates.length - 3} more options`}
        </button>
      )}
    </div>
  );
}

export default function StopCard({ stop, index, locked, onSelectStation, onStopFocus }) {
  const cfg = STOP_CONFIG[stop.type] || STOP_CONFIG.gas;
  const eta = stop.eta ? fmtEta(stop.eta) : null;
  const dist = stop.distanceAlongRoute ?? stop.requestedAtMile ?? stop.sortKey;
  const selectWithStop = (candidate) => onSelectStation?.(stop, candidate);

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${cfg.bgClass} ${locked ? 'opacity-50' : ''}`}
      onClick={() => !locked && onStopFocus?.(stop)}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${cfg.badgeClass}`}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span>{cfg.icon}</span>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{cfg.label}</span>
            {locked && <span className="text-xs text-gray-400">(completed)</span>}
          </div>
          <div className="text-xs text-gray-400 flex gap-2">
            {dist != null && <span>{fmtMiles(dist)} along route</span>}
            {eta && <span>· ETA {eta}</span>}
          </div>
        </div>
      </div>

      {stop.type === 'gas' && <GasStopContent stop={stop} onSelectStation={selectWithStop} />}
      {stop.type === 'food' && <FoodStopContent stop={stop} onSelectStation={selectWithStop} />}
      {stop.type === 'hotel' && <HotelStopContent stop={stop} onSelectStation={selectWithStop} />}
    </div>
  );
}
