import { useState } from 'react';
import { fmtPrice, fmtMiles, fmtEta } from '../utils/format';

const STOP_CONFIG = {
  gas: {
    icon: '⛽',
    borderClass: 'border-l-green-500',
    badgeClass: 'bg-green-500/15 text-green-400 border border-green-500/25',
    label: 'Gas Stop',
    selectedBorder: 'border-green-500 bg-green-500/10',
    hoverBorder: 'hover:border-green-500/40',
    activeDot: 'bg-green-500',
  },
  food: {
    icon: '🍽️',
    borderClass: 'border-l-orange-400',
    badgeClass: 'bg-orange-500/15 text-orange-400 border border-orange-500/25',
    label: 'Food Stop',
    selectedBorder: 'border-orange-400 bg-orange-500/10',
    hoverBorder: 'hover:border-orange-400/40',
    activeDot: 'bg-orange-400',
  },
  hotel: {
    icon: '🏨',
    borderClass: 'border-l-purple-400',
    badgeClass: 'bg-purple-500/15 text-purple-400 border border-purple-500/25',
    label: 'Hotel Stop',
    selectedBorder: 'border-purple-400 bg-purple-500/10',
    hoverBorder: 'hover:border-purple-400/40',
    activeDot: 'bg-purple-400',
  },
};

function detourLabel(detour) {
  if (!detour || detour < 0.1) return 'On route';
  const mins = Math.max(1, Math.round(detour * 1.5));
  return `+${detour.toFixed(1)} mi · ~${mins} min`;
}

function GasStopContent({ stop, onSelectStation, cfg }) {
  const [showAll, setShowAll] = useState(false);

  if (stop.noStationsFound) {
    return (
      <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mt-2">
        ⚠️ No stations found in this zone. Refuel before this point.
      </div>
    );
  }

  const visible = showAll ? stop.stations : stop.stations.slice(0, 2);

  return (
    <div className="space-y-1.5 mt-2">
      {stop.widened && (
        <div className="text-xs text-amber-400/70">
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
                ? `${cfg.selectedBorder} shadow-md`
                : `border-white/8 bg-white/3 ${cfg.hoverBorder}`
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {s.name || s.brand || 'Gas Station'}
                </div>
                {s.price ? (
                  <div className="text-base font-bold text-green-400 leading-tight">
                    {fmtPrice(s.price)}
                    <span className="text-xs font-normal text-slate-500">/gal</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 italic">Price unavailable</div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-slate-500">{detourLabel(s.detour)}</div>
                {isSelected && (
                  <div className="text-xs text-green-400 font-semibold mt-0.5">✓ Selected</div>
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
          className="text-xs text-slate-600 hover:text-slate-400 w-full text-center py-0.5 transition-colors"
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

function FoodStopContent({ stop, onSelectStation, cfg }) {
  const [showAll, setShowAll] = useState(false);
  const candidates = stop.candidates || [];

  if (candidates.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic mt-2">No restaurants found nearby</div>
    );
  }

  const visible = showAll ? candidates : candidates.slice(0, 4);

  return (
    <div className="space-y-1.5 mt-2">
      {visible.map((c, i) => {
        const isSelected = c.id === stop.selected?.id;
        return (
          <button
            key={c.id || i}
            type="button"
            onClick={() => onSelectStation(c)}
            className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
              isSelected
                ? `${cfg.selectedBorder} shadow-md`
                : `border-white/8 bg-white/3 ${cfg.hoverBorder}`
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {c.name || 'Restaurant'}
                </div>
                <div className="text-xs text-slate-500 capitalize">{cuisineLabel(c)}</div>
                {c.hours && (
                  <div className="text-xs text-slate-600 truncate">{c.hours}</div>
                )}
              </div>
              {isSelected && (
                <div className="text-xs text-orange-400 font-semibold flex-shrink-0">✓ Selected</div>
              )}
            </div>
          </button>
        );
      })}
      {candidates.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll((x) => !x)}
          className="text-xs text-slate-600 hover:text-slate-400 w-full text-center py-0.5 transition-colors"
        >
          {showAll ? 'Show fewer' : `+ ${candidates.length - 4} more options`}
        </button>
      )}
    </div>
  );
}

function HotelStopContent({ stop, onSelectStation, cfg }) {
  const [showAll, setShowAll] = useState(false);
  const candidates = stop.candidates || [];

  if (candidates.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic mt-2">No hotels found nearby</div>
    );
  }

  const visible = showAll ? candidates : candidates.slice(0, 3);

  return (
    <div className="space-y-1.5 mt-2">
      {visible.map((c, i) => {
        const isSelected = c.id === stop.selected?.id;
        return (
          <button
            key={c.id || i}
            type="button"
            onClick={() => onSelectStation(c)}
            className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
              isSelected
                ? `${cfg.selectedBorder} shadow-md`
                : `border-white/8 bg-white/3 ${cfg.hoverBorder}`
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {c.name || 'Hotel'}
                </div>
                <div className="text-xs text-slate-500 capitalize">{c.tourismType || 'Hotel'}</div>
                {c.stars && (
                  <div className="text-xs text-yellow-400">
                    {'★'.repeat(Math.min(parseInt(c.stars, 10), 5))}
                  </div>
                )}
              </div>
              {isSelected && (
                <div className="text-xs text-purple-400 font-semibold flex-shrink-0">✓ Selected</div>
              )}
            </div>
          </button>
        );
      })}
      {candidates.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((x) => !x)}
          className="text-xs text-slate-600 hover:text-slate-400 w-full text-center py-0.5 transition-colors"
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
      className={`rounded-xl border-l-4 border border-white/6 bg-white/3 p-3.5 transition-all cursor-pointer hover:bg-white/5 ${cfg.borderClass} ${locked ? 'opacity-40' : ''}`}
      onClick={() => !locked && onStopFocus?.(stop)}
    >
      <div className="flex items-center gap-2.5 mb-0.5">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${cfg.badgeClass}`}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{cfg.icon}</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{cfg.label}</span>
            {locked && <span className="text-xs text-slate-600">(completed)</span>}
          </div>
          <div className="text-xs text-slate-600 flex gap-2 mt-0.5">
            {dist != null && <span>{fmtMiles(dist)} along route</span>}
            {eta && <span>· ETA {eta}</span>}
          </div>
        </div>
      </div>

      {stop.type === 'gas' && <GasStopContent stop={stop} onSelectStation={selectWithStop} cfg={cfg} />}
      {stop.type === 'food' && <FoodStopContent stop={stop} onSelectStation={selectWithStop} cfg={cfg} />}
      {stop.type === 'hotel' && <HotelStopContent stop={stop} onSelectStation={selectWithStop} cfg={cfg} />}
    </div>
  );
}
