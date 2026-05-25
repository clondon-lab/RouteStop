import { useState } from 'react';

export default function VehicleProfile({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const update = (field, val) => onChange({ ...value, [field]: val });

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>🚗</span>
          <span className="font-medium">Vehicle Profile</span>
          <span className="text-xs text-gray-400">(optional — unlocks cost estimate)</span>
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50 space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Make / Model</label>
              <input
                type="text"
                value={value.makeModel || ''}
                onChange={(e) => update('makeModel', e.target.value)}
                placeholder="e.g. Toyota Camry"
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Year</label>
              <input
                type="number"
                value={value.year || ''}
                onChange={(e) => update('year', e.target.value)}
                placeholder="2022"
                min="1990"
                max="2026"
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">MPG</label>
              <input
                type="number"
                value={value.mpg || ''}
                onChange={(e) => update('mpg', e.target.value)}
                placeholder="30"
                min="5"
                max="150"
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tank Size (gal)</label>
              <input
                type="number"
                value={value.tankSize || ''}
                onChange={(e) => update('tankSize', e.target.value)}
                placeholder="14"
                min="3"
                max="100"
                className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          {value.mpg && value.tankSize && (
            <div className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
              Full range ≈ {Math.round(value.mpg * value.tankSize)} miles
            </div>
          )}
        </div>
      )}
    </div>
  );
}
