import StopCard from './StopCard';
import { fmtMiles, fmtDuration, fmtCost } from '../utils/format';

export default function ItineraryPanel({ plan, onSelectStation, onStopFocus, midTripMileMarker }) {
  if (!plan) return null;
  const { itinerary, summary } = plan;

  return (
    <div className="space-y-3">
      {/* Trip summary card */}
      <div className="rounded-xl border border-green-500/20 bg-green-500/8 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-0.5">Distance</div>
            <div className="font-bold text-white">{fmtMiles(summary.totalDistance)}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-0.5">Drive Time</div>
            <div className="font-bold text-white">{fmtDuration(summary.totalDuration)}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-0.5">Gas Stops</div>
            <div className="font-bold text-white">{summary.noGasNeeded ? 'None needed' : summary.gasStopCount}</div>
          </div>
          {summary.estimatedFuelCost && (
            <div>
              <div className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-0.5">Est. Fuel Cost</div>
              <div className="font-bold text-green-400">{fmtCost(summary.estimatedFuelCost)}</div>
            </div>
          )}
        </div>

        {summary.noGasNeeded && (
          <div className="mt-3 text-sm text-green-300 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            You have enough range to reach your destination.
          </div>
        )}

        {!summary.hasGooglePrices && !summary.noGasNeeded && (
          <div className="mt-2 text-xs text-slate-500">
            Add a Google Places API key to see live fuel prices.
          </div>
        )}
      </div>

      {itinerary.length === 0 && (
        <div className="text-center text-slate-500 text-sm py-6">
          No stops needed — you have enough range!
        </div>
      )}
      {itinerary.map((stop, i) => (
        <StopCard
          key={`${stop.type}-${i}`}
          stop={stop}
          index={i}
          locked={midTripMileMarker != null && (stop.distanceAlongRoute ?? stop.requestedAtMile ?? stop.sortKey) < midTripMileMarker}
          onSelectStation={onSelectStation}
          onStopFocus={onStopFocus}
        />
      ))}
    </div>
  );
}
