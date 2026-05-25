import { useState } from 'react';

function StopEntry({ stop, index, type, onUpdate, onRemove, totalDistance }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
      <span>{type === 'food' ? '🍽️' : '🏨'}</span>
      <div className="flex-1 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">At mile</label>
          <input
            type="number"
            value={stop.atMile || ''}
            onChange={(e) => onUpdate(index, 'atMile', e.target.value)}
            placeholder="150"
            min="1"
            max={totalDistance || 9999}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Around time</label>
          <input
            type="time"
            value={stop.timeWindow || ''}
            onChange={(e) => onUpdate(index, 'timeWindow', e.target.value)}
            className="w-full px-2 py-1 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
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
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-orange-300 rounded-lg text-sm text-orange-600 hover:bg-orange-50 transition-colors"
        >
          + Food Stop
        </button>
        <button
          type="button"
          onClick={addHotel}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-purple-300 rounded-lg text-sm text-purple-600 hover:bg-purple-50 transition-colors"
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
