import { cn } from '@klaro/ui';

type Signal = { label: string; pct: number };

type ScoreCardProps = {
  score?: number;
  band?: string;
  signals?: Signal[];
  className?: string;
};

const DEFAULT_SIGNALS: Signal[] = [
  { label: 'Income stability', pct: 72 },
  { label: 'Payment behavior', pct: 64 },
  { label: 'Document quality', pct: 88 },
  { label: 'Cash-flow consistency', pct: 51 },
];

export function ScoreCard({
  score = 642,
  band = 'GOOD',
  signals = DEFAULT_SIGNALS,
  className,
}: ScoreCardProps) {
  const pct = Math.min(100, Math.max(0, (score / 1000) * 100));

  return (
    <div className={cn('marketing-card overflow-hidden', className)}>
      <div className="flex items-center justify-between px-5 py-3 hairline-b">
        <span className="mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          klaro_score.json
        </span>
        <span className="flex items-center gap-1.5 mono text-[10px] uppercase tracking-[0.18em] text-white/45">
          <span className="status-dot" />
          live
        </span>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-5 p-5">
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="hsl(var(--marketing-fg))"
                strokeWidth="1.5"
                strokeDasharray={`${pct} 100`}
                strokeLinecap="butt"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="mono text-3xl font-semibold tabular-nums text-white">
                {score}
              </span>
              <span className="mono text-[10px] tracking-[0.2em] text-white/45">
                / 1000
              </span>
            </div>
          </div>
          <span className="mono text-[10px] tracking-[0.18em] text-white/55">
            BAND · {band}
          </span>
        </div>

        <div className="space-y-2.5">
          {signals.map((sig) => (
            <div key={sig.label} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/65">{sig.label}</span>
                <span className="mono text-white/45 tabular-nums">
                  {sig.pct.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="h-px w-full bg-white/8 overflow-hidden">
                <div
                  className="h-full bg-white/55"
                  style={{ width: `${sig.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hairline-t px-5 py-3 flex items-center justify-between">
        <span className="mono text-[10px] tracking-[0.18em] text-white/40">
          UPDATED · 14:02 UTC
        </span>
        <span className="mono text-[10px] tracking-[0.18em] text-white/40">
          + 18 PTS · 30D
        </span>
      </div>
    </div>
  );
}
