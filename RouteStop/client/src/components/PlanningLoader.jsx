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
    <div className="flex flex-col items-center justify-center py-8 px-2 space-y-5">
      <div className="relative w-14 h-14">
        <div className="w-14 h-14 border-4 border-white/5 rounded-full" />
        <div className="absolute inset-0 w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <div className="w-full space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span className="text-slate-300 font-medium">{STEPS[stepIdx].msg}</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-[1200ms] ease-out shadow-sm shadow-green-500/50"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="w-full space-y-1.5">
        {STEPS.slice(0, stepIdx + 1).map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
              i < stepIdx ? 'bg-green-500/20 text-green-400' : 'bg-white/8 text-slate-300'
            }`}>
              {i < stepIdx ? '✓' : '·'}
            </div>
            <span className={i < stepIdx ? 'text-slate-600' : 'text-slate-300 font-medium'}>{s.msg}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 text-center">
        Takes 5–20 sec · faster on repeat searches (cached)
      </p>
    </div>
  );
}
