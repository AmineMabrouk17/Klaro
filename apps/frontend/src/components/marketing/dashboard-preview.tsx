import { cn } from '@klaro/ui';

type DashboardPreviewProps = {
  className?: string;
};

const DISTRIBUTION = [4, 8, 14, 22, 31, 28, 22, 17, 12, 8, 5, 3];
const HABITS: { label: string; value: string; trend: 'up' | 'down' | 'flat' }[] = [
  { label: 'On-time bills', value: '94%', trend: 'up' },
  { label: 'Income variance', value: '0.18', trend: 'down' },
  { label: 'Cash buffer · days', value: '23', trend: 'up' },
  { label: 'Debt-to-income', value: '0.31', trend: 'flat' },
];
const CLIENTS = [
  { id: 'KLR-7421', name: 'M. Ben Salah', score: 712, band: 'GOOD', delta: '+12' },
  { id: 'KLR-7409', name: 'A. Trabelsi', score: 488, band: 'FAIR', delta: '−4' },
  { id: 'KLR-7388', name: 'L. Karoui', score: 814, band: 'EXC.', delta: '+6' },
  { id: 'KLR-7361', name: 'S. Hamdi', score: 561, band: 'FAIR', delta: '+2' },
];

export function DashboardPreview({ className }: DashboardPreviewProps) {
  const max = Math.max(...DISTRIBUTION);

  return (
    <div className={cn('marketing-card overflow-hidden', className)}>
      <div className="flex items-center justify-between px-5 py-3 hairline-b">
        <div className="flex items-center gap-3">
          <span className="mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            klaro · partner console
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="status-dot" />
          <span className="mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/[0.06]">
        <div className="bg-[hsl(var(--marketing-bg))] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[12px] font-medium text-white">
              Score distribution
            </h4>
            <span className="mono text-[10px] text-white/35">N = 2,841</span>
          </div>
          <div className="flex items-end gap-1 h-24">
            {DISTRIBUTION.map((v, i) => (
              <div
                key={i}
                className="flex-1 bg-white/55 hover:bg-white transition-colors"
                style={{ height: `${(v / max) * 100}%`, minHeight: '4px' }}
              />
            ))}
          </div>
          <div className="flex justify-between mono text-[10px] text-white/35">
            <span>0</span>
            <span>250</span>
            <span>500</span>
            <span>750</span>
            <span>1000</span>
          </div>
        </div>

        <div className="bg-[hsl(var(--marketing-bg))] p-5 space-y-3">
          <h4 className="text-[12px] font-medium text-white">Habit signals</h4>
          <div className="grid grid-cols-2 gap-3">
            {HABITS.map((h) => (
              <div key={h.label} className="space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-white/40">
                  {h.label}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="mono text-lg font-semibold text-white tabular-nums">
                    {h.value}
                  </span>
                  <TrendArrow trend={h.trend} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hairline-t bg-[hsl(var(--marketing-bg))]">
        <div className="px-5 py-3 flex items-center justify-between">
          <h4 className="text-[12px] font-medium text-white">Recent clients</h4>
          <span className="mono text-[10px] text-white/35">latest · 4 of 2,841</span>
        </div>
        <div className="hairline-t">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-white/35">
                <th className="px-5 py-2 mono text-[10px] tracking-wider font-normal">
                  ID
                </th>
                <th className="py-2 mono text-[10px] tracking-wider font-normal">
                  CLIENT
                </th>
                <th className="py-2 mono text-[10px] tracking-wider font-normal">
                  SCORE
                </th>
                <th className="py-2 mono text-[10px] tracking-wider font-normal">
                  BAND
                </th>
                <th className="px-5 py-2 mono text-[10px] tracking-wider font-normal text-right">
                  Δ 30D
                </th>
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((c, i) => (
                <tr
                  key={c.id}
                  className={cn('text-white/75', i !== 0 && 'border-t border-white/[0.05]')}
                >
                  <td className="px-5 py-2.5 mono text-white/45">{c.id}</td>
                  <td className="py-2.5">{c.name}</td>
                  <td className="py-2.5 mono tabular-nums">{c.score}</td>
                  <td className="py-2.5 mono text-[10px] tracking-wider text-white/55">
                    {c.band}
                  </td>
                  <td
                    className={cn(
                      'px-5 py-2.5 mono tabular-nums text-right',
                      c.delta.startsWith('−') ? 'text-rose-300/85' : 'text-emerald-300/85',
                    )}
                  >
                    {c.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') {
    return <span className="mono text-[10px] text-emerald-300/85">↑</span>;
  }
  if (trend === 'down') {
    return <span className="mono text-[10px] text-rose-300/85">↓</span>;
  }
  return <span className="mono text-[10px] text-white/35">→</span>;
}
