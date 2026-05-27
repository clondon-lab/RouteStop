import { useState } from 'react';

const inputCls = 'w-full px-2 py-1.5 bg-white/5 border border-white/8 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-colors';

function StopEntry({ stop, index, type, onUpdate, onRemove, totalDistance }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border ${
      type === 'food'
        ? 'bg-orange-500/5 border-orange-500/15'
        : 'bg-purple-500/5 border-purple-500/15'
    }`}>
      <span className="text-base">{type === 'food' ? '🍽️' : '🏨'}</span>
      <div className="flex-1 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-0.5">At mile</label>
          <input
            type="number"
            value={stop.atMile || ''}
            onChange={(e) => onUpdate(index, 'atMile', e.target.value)}
            placeholder="150"
            min="1"
            max={totalDistance || 9999}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-0.5">Around time</label>
          <input
            type="time"
            value={stop.timeWindow || ''}
            onChange={(e) => onUpdate(index, 'timeWindow', e.target.value)}
            className={inputCls + ' [color-scheme:dark]'}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-slate-600 hover:text-red-400 transition-colors text-lg leading-none"
        title="Remove stop"
      >
        ×
      </button>
    </div>
  );
}

export default function LifestyleStops({ foodStops, hotelStops, onChange, totalDistance }) {
  const addFood = () => onChange({ food: [...foodStops, { atMile: '', timeWindow: '' }], hotel: hotelStops });
  const addHotel = () => onChange({ food: foodStops, hotel: [...hotelStops, { atMile: '', timeWindow: '' }] });

  const updateFood = (i, field, val) => {
    const updated = foodStops.map((s, idx) => (idx === i ? { ...s, [field]: val } : s));
    onChange({ food: updated, hotel: hotelStops });
  };
  const updateHotel = (i, field, val) => {
    const updated = hotelStops.map((s, idx) => (idx === i ? { ...s, [field]: val } : s));
    onChange({ food: foodStops, hotel: updated });
  };
  const removeFood = (i) => onChange({ food: foodStops.filter((_, idx) => idx !== i), hotel: hotelStops });
  const removeHotel = (i) => onChange({ food: foodStops, hotel: hotelStops.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={addFood}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 border border-dashed border-orange-500/30 rounded-xl text-sm text-orange-400 hover:bg-orange-500/8 transition-colors font-medium"
        >
          + Food Stop
        </button>
        <button
          type="button"
          onClick={addHotel}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 border border-dashed border-purple-500/30 rounded-xl text-sm text-purple-400 hover:bg-purple-500/8 transition-colors font-medium"
        >
          + Hotel Stop
        </button>
      </div>
      {foodStops.map((s, i) => (
        <StopEntry key={`food-${i}`} stop={s} index={i} type="food" onUpdate={updateFood} onRemove={removeFood} totalDistance={totalDistance} />
      ))}
      {hotelStops.map((s, i) => (
        <StopEntry key={`hotel-${i}`} stop={s} index={i} type="hotel" onUpdate={updateHotel} onRemove={removeHotel} totalDistance={totalDistance} />
      ))}
    </div>
  );
}
