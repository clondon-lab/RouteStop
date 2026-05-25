import { useState } from 'react';
import { fmtPrice, fmtMiles, fmtEta } from '../utils/format';

const STOP_CONFIG = {
  gas: {
    icon: '⛽',
    color: 'green',
    bgClass: 'bg-green-50 border-green-200',
    badgeClass: 'bg-green-100 text-green-800',
    label: 'Gas Stop',
  },
  food: {
    icon: '🍽️',
    color: 'orange',
    bgClass: 'bg-orange-50 border-orange-200',
    badgeClass: 'bg-orange-100 text-orange-800',
    label: 'Food Stop',
  },
  hotel: {
    icon: '🏨',
    color: 'purple',
    bgClass: 'bg-purple-50 border-purple-200',
    badgeClass: 'bg-purple-100 text-purple-800',
    label: 'Hotel Stop',
  },
};

function GasStopContent({ stop, expanded, onSelectStation }) {
  const station = stop.selected;
  if (stop.noStationsFound) {
    return (
      <div className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1.5 mt-1">
        ⚠️ No stations found in this zone. Consider refueling earlier.
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {station && (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm text-gray-800">{station.name || station.brand || 'Gas Station'}</div>
            {station.price ? (
              <div className="text-lg font-bold text-green-700">{fmtPrice(station.price)}<span className="text-xs font-normal text-gray-500">/gal</span></div>
            ) : (
              <div className="text-xs text-gray-400 italic">Price unavailable</div>
            )}
          </div>
          {station.detour != null && station.detour > 0.05 && (
            <div className="text-xs text-gray-500 text-right">
              +{station.detour.toFixed(1)} mi detour
            </div>
          )}
        </div>
      )}
      {stop.widened && (
        <div className="text-xs text-amber-600">
          ↔ Corridor widened to {stop.radiusUsed.toFixed(1)} mi
        </div>
      )}
      {expanded && stop.stations.length > 1 && (
        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
          <div className="text-xs text-gray-500 font-medium mb-1">All stations in zone</div>
          {stop.stations.slice(0, 10).map((s, i) => (
            <button
              key={s.id || i}
              type="button"
              onClick={() => onSelectStation(s)}
              className={`w-full text-left px-2 py-1.5 rounded border text-xs transition-colors ${
                s.id === station?.id
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{s.name || s.brand || 'Station'}</span>
                <span className={s.price ? 'text-green-700 font-semibold' : 'text-gray-400'}>
                  {s.price ? fmtPrice(s.price) : 'No price'}
                </span>
              </div>
              {s.detour != null && (
                <div className="text-gray-400">+{s.detour.toFixed(1)} mi detour</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FoodStopContent({ stop, onSelectStation }) {
  const place = stop.selected;
  return (
    <div>
      {place ? (
        <div>
          <div className="font-medium text-sm text-gray-800">{place.name || 'Restaurant'}</div>
          <div className="text-xs text-gray-500 capitalize">
            {place.cuisine?.replace(/_/g, ' ') || place.amenityType || 'Restaurant'}
          </div>
          {place.hours && <div className="text-xs text-gray-400">{place.hours}</div>}
        </div>
      ) : (
        <div className="text-sm text-gray-400 italic">No restaurants found nearby</div>
      )}
      {stop.candidates?.length > 1 && (
        <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
          {stop.candidates.slice(0, 8).map((c, i) => (
            <button
              key={c.id || i}
              type="button"
              onClick={() => onSelectStation(c)}
              className={`w-full text-left px-2 py-1.5 rounded border text-xs transition-colors ${
                c.id === place?.id ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-gray-400 capitalize">{c.cuisine?.replace(/_/g, ' ') || c.amenityType}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HotelStopContent({ stop, onSelectStation }) {
  const place = stop.selected;
  return (
    <div>
      {place ? (
        <div>
          <div className="font-medium text-sm text-gray-800">{place.name || 'Hotel'}</div>
          <div className="text-xs text-gray-500 capitalize">{place.tourismType || 'Hotel'}</div>
          {place.stars && <div className="text-xs text-yellow-600">{'★'.repeat(parseInt(place.stars, 10))}</div>}
        </div>
      ) : (
        <div className="text-sm text-gray-400 italic">No hotels found nearby</div>
      )}
      {stop.candidates?.length > 1 && (
        <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
          {stop.candidates.slice(0, 8).map((c, i) => (
            <button
              key={c.id || i}
              type="button"
              onClick={() => onSelectStation(c)}
              className={`w-full text-left px-2 py-1.5 rounded border text-xs transition-colors ${
                c.id === place?.id ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{c.name}</div>
              {c.stars && <div className="text-yellow-600 text-xs">{'★'.repeat(parseInt(c.stars, 10))}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StopCard({ stop, index, locked, onSelectStation, onStopFocus }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STOP_CONFIG[stop.type] || STOP_CONFIG.gas;
  const eta = stop.eta ? fmtEta(stop.eta) : null;
  const dist = stop.distanceAlongRoute ?? stop.requestedAtMile ?? stop.sortKey;

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${cfg.bgClass} ${locked ? 'opacity-50' : ''}`}
      onClick={() => !locked && onStopFocus?.(stop)}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${cfg.badgeClass}`}>
          {index + 1}
        </div>
        <div className="flex-1">
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
        {stop.type === 'gas' && stop.stations?.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded((x) => !x); }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-1"
          >
            {expanded ? 'Less' : `${stop.stations.length} options`}
          </button>
        )}
      </div>

      {stop.type === 'gas' && (
        <GasStopContent stop={stop} expanded={expanded} onSelectStation={(s) => onSelectStation?.(stop.zoneIndex, s)} />
      )}
      {stop.type === 'food' && (
        <FoodStopContent stop={stop} onSelectStation={(s) => onSelectStation?.(stop, s)} />
      )}
      {stop.type === 'hotel' && (
        <HotelStopContent stop={stop} onSelectStation={(s) => onSelectStation?.(stop, s)} />
      )}
    </div>
  );
}
