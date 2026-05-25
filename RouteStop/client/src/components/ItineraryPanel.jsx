import StopCard from './StopCard';
import { fmtMiles, fmtDuration, fmtCost } from '../utils/format';

export default function ItineraryPanel({ plan, onSelectStation, onStopFocus, midTripMileMarker }) {
  if (!plan) return null;
  const { itinerary, summary } = plan;

  return (
    <div className="space-y-3">
      {/* Trip summary */}
      <div className="bg-blue-600 rounded-xl p-4 text-white">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-blue-200 text-xs uppercase tracking-wide">Distance</div>
            <div className="font-semibold">{fmtMiles(summary.totalDistance)}</div>
          </div>
          <div>
            <div className="text-blue-200 text-xs uppercase tracking-wide">Drive Time</div>
            <div className="font-semibold">{fmtDuration(summary.totalDuration)}</div>
          </div>
          <div>
            <div className="text-blue-200 text-xs uppercase tracking-wide">Gas Stops</div>
            <div className="font-semibold">{summary.noGasNeeded ? 'None needed' : summary.gasStopCount}</div>
          </div>
          {summary.estimatedFuelCost && (
            <div>
              <div className="text-blue-200 text-xs uppercase tracking-wide">Est. Fuel Cost</div>
              <div className="font-semibold">{fmtCost(summary.estimatedFuelCost)}</div>
            </div>
          )}
        </div>

        {summary.noGasNeeded && (
          <div className="mt-2 text-sm bg-blue-500 rounded-lg px-3 py-1.5">
            You have enough range to reach your destination.
          </div>
        )}

        {!summary.hasGooglePrices && !summary.noGasNeeded && (
          <div className="mt-2 text-xs text-blue-200">
            Add a Google Places API key to see live fuel prices.
          </div>
        )}
      </div>

      {/* Stop cards */}
      {itinerary.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-4">
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
