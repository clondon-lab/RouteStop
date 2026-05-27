import { useState } from 'react';
import { deleteTrip, renameTrip } from '../utils/storage';

export default function SavedTrips({ trips, onLoad, onClose, onChange }) {
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const handleDelete = (id) => {
    const updated = deleteTrip(id);
    onChange(updated);
  };

  const startRename = (trip) => {
    setRenaming(trip.id);
    setRenameVal(trip.name);
  };

  const submitRename = (id) => {
    if (renameVal.trim()) {
      const updated = renameTrip(id, renameVal.trim());
      onChange(updated);
    }
    setRenaming(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="font-bold text-white text-sm tracking-tight">Saved Trips</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center transition-colors">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {trips.length === 0 && (
            <div className="text-center text-slate-500 text-sm py-10">
              No saved trips yet.<br />Plan a trip and save it!
            </div>
          )}
          {trips.map((trip) => (
            <div key={trip.id} className="border border-white/8 rounded-xl p-3 flex items-start gap-2 bg-white/2 hover:bg-white/4 transition-colors">
              <div className="flex-1 min-w-0">
                {renaming === trip.id ? (
                  <div className="flex gap-1.5">
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitRename(trip.id)}
                      className="flex-1 text-sm bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <button onClick={() => submitRename(trip.id)} className="text-xs text-green-400 font-semibold">Save</button>
                    <button onClick={() => setRenaming(null)} className="text-xs text-slate-500">Cancel</button>
                  </div>
                ) : (
                  <div className="font-semibold text-sm text-white truncate">{trip.name}</div>
                )}
                <div className="text-xs text-slate-500 mt-0.5">
                  {new Date(trip.savedAt).toLocaleDateString()} · {trip.plan?.summary?.totalDistance ? Math.round(trip.plan.summary.totalDistance) + ' mi' : ''}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => { onLoad(trip); onClose(); }}
                  className="text-xs px-2.5 py-1 bg-green-500 text-white rounded-lg hover:bg-green-400 transition-colors font-semibold"
                >
                  Load
                </button>
                <button
                  onClick={() => startRename(trip)}
                  className="text-xs px-2 py-1 border border-white/10 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(trip.id)}
                  className="text-xs px-2 py-1 border border-red-500/20 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
