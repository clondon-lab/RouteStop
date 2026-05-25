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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Saved Trips</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {trips.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8">
              No saved trips yet. Plan a trip and save it!
            </div>
          )}
          {trips.map((trip) => (
            <div key={trip.id} className="border border-gray-200 rounded-xl p-3 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                {renaming === trip.id ? (
                  <div className="flex gap-1">
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitRename(trip.id)}
                      className="flex-1 text-sm border border-blue-400 rounded px-2 py-0.5 focus:outline-none"
                    />
                    <button onClick={() => submitRename(trip.id)} className="text-xs text-blue-600 font-medium">Save</button>
                    <button onClick={() => setRenaming(null)} className="text-xs text-gray-400">Cancel</button>
                  </div>
                ) : (
                  <div className="font-medium text-sm text-gray-800 truncate">{trip.name}</div>
                )}
                <div className="text-xs text-gray-400 mt-0.5">
                  {new Date(trip.savedAt).toLocaleDateString()} · {trip.plan?.summary?.totalDistance ? Math.round(trip.plan.summary.totalDistance) + ' mi' : ''}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { onLoad(trip); onClose(); }}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Load
                </button>
                <button
                  onClick={() => startRename(trip)}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(trip.id)}
                  className="text-xs px-2 py-1 border border-red-200 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
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
