import { useState } from 'react';

const inputCls = 'w-full px-2.5 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-colors';

export default function VehicleProfile({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const update = (field, val) => onChange({ ...value, [field]: val });

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-slate-300 hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>🚗</span>
          <span className="font-medium">Vehicle Profile</span>
          <span className="text-xs text-slate-600">(optional)</span>
        </span>
        <span className="text-slate-600 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-3.5 pb-3.5 border-t border-white/5 bg-white/2 space-y-2.5 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Make / Model</label>
              <input
                type="text"
                value={value.makeModel || ''}
                onChange={(e) => update('makeModel', e.target.value)}
                placeholder="Toyota Camry"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Year</label>
              <input
                type="number"
                value={value.year || ''}
                onChange={(e) => update('year', e.target.value)}
                placeholder="2022"
                min="1990"
                max="2026"
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">MPG</label>
              <input
                type="number"
                value={value.mpg || ''}
                onChange={(e) => update('mpg', e.target.value)}
                placeholder="30"
                min="5"
                max="150"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tank Size (gal)</label>
              <input
                type="number"
                value={value.tankSize || ''}
                onChange={(e) => update('tankSize', e.target.value)}
                placeholder="14"
                min="3"
                max="100"
                className={inputCls}
              />
            </div>
          </div>
          {value.mpg && value.tankSize && (
            <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-2.5 py-1.5">
              Full range ≈ {Math.round(value.mpg * value.tankSize)} miles
            </div>
          )}
        </div>
      )}
    </div>
  );
}
