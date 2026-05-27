import { useState, useEffect } from 'react';

const STEPS = [
  { msg: 'Calculating your route…', pct: 12 },
  { msg: 'Searching for gas stations…', pct: 30 },
  { msg: 'Checking live fuel prices…', pct: 55 },
  { msg: 'Finding food & hotel options…', pct: 75 },
  { msg: 'Ranking your best options…', pct: 90 },
  { msg: 'Almost there…', pct: 97 },
];

const STEP_DELAYS = [0, 1500, 6000, 14000, 20000, 26000];

export default function PlanningLoader() {
  const [stepIdx, setStepIdx] = useState(0);
  const [pct, setPct] = useState(5);

  useEffect(() => {
    const timers = STEPS.map((step, i) =>
      setTimeout(() => {
        setStepIdx(i);
        setPct(step.pct);
      }, STEP_DELAYS[i])
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 space-y-5">
      <div className="relative w-16 h-16">
        <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>

      <div className="w-full space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{STEPS[stepIdx].msg}</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-[1200ms] ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="w-full space-y-1.5">
        {STEPS.slice(0, stepIdx + 1).map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
              i < stepIdx ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {i < stepIdx ? '✓' : '·'}
            </div>
            <span className={i < stepIdx ? 'text-gray-400' : 'text-gray-700 font-medium'}>{s.msg}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Takes 5–20 sec · faster on repeat searches (cached)
      </p>
    </div>
  );
}
