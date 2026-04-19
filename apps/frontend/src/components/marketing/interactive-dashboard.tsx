'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useInView,
  type Variants,
} from 'framer-motion';
import { cn } from '@klaro/ui';

const EASE = [0.22, 1, 0.36, 1] as const;

type Tab = 'distribution' | 'habits' | 'cohort';

const TAB_LABEL: Record<Tab, string> = {
  distribution: 'Score distribution',
  habits: 'Habit signals',
  cohort: 'Cohort timeline',
};

const TABS: Tab[] = ['distribution', 'habits', 'cohort'];

type DashboardProps = {
  className?: string;
};

export function InteractiveDashboard({ className }: DashboardProps) {
  const [tab, setTab] = useState<Tab>('distribution');
  const [manualAt, setManualAt] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: false, margin: '-10% 0px' });

  // Auto-advance through tabs every ~5.5s, but pause for ~9s after a manual pick.
  useEffect(() => {
    if (!inView) return;
    const cooldown = 9000;
    const interval = 5500;
    const id = window.setInterval(() => {
      if (Date.now() - manualAt < cooldown) return;
      setTab((t) => TABS[(TABS.indexOf(t) + 1) % TABS.length] ?? TABS[0]!);
    }, interval);
    return () => window.clearInterval(id);
  }, [manualAt, inView]);

  function pickTab(t: Tab) {
    setTab(t);
    setManualAt(Date.now());
  }

  return (
    <div
      ref={wrapRef}
      className={cn('marketing-card overflow-hidden', className)}
    >
      <DashboardHeader />

      <DashboardTabs tab={tab} onChange={pickTab} />

      <div className="bg-[hsl(var(--marketing-bg))] min-h-[260px]">
        <AnimatePresence mode="wait">
          {tab === 'distribution' && (
            <motion.div
              key="distribution"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <DistributionPanel active={inView} />
            </motion.div>
          )}
          {tab === 'habits' && (
            <motion.div
              key="habits"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <HabitsPanel active={inView} />
            </motion.div>
          )}
          {tab === 'cohort' && (
            <motion.div
              key="cohort"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <CohortPanel active={inView} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ClientFeed />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Header — live ticker
─────────────────────────────────────────────── */

function DashboardHeader() {
  const [scoredToday, setScoredToday] = useState(2841);

  useEffect(() => {
    const id = window.setInterval(() => {
      setScoredToday((n) => n + Math.floor(Math.random() * 3) + 1);
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between px-5 py-3 hairline-b">
      <div className="flex items-center gap-3">
        <span className="mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          klaro · partner console
        </span>
        <span className="hidden sm:flex items-center gap-1.5 mono text-[10px] uppercase tracking-[0.18em] text-white/35">
          <span className="text-white/25">·</span>
          <span>scored today</span>
          <motion.span
            key={scoredToday}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-white/65 tabular-nums"
          >
            {scoredToday.toLocaleString()}
          </motion.span>
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <motion.span
          className="status-dot"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-white/45">
          live
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Tabs
─────────────────────────────────────────────── */

function DashboardTabs({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div className="flex hairline-b bg-[hsl(var(--marketing-bg))]">
      {TABS.map((t) => {
        const active = t === tab;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={cn(
              'relative px-5 py-3 text-[12px] transition-colors',
              active ? 'text-white' : 'text-white/45 hover:text-white/75',
            )}
          >
            <span className="relative">{TAB_LABEL[t]}</span>
            {active && (
              <motion.span
                layoutId="dash-tab-underline"
                aria-hidden
                className="absolute inset-x-3 -bottom-px h-px bg-white"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Distribution panel — hoverable histogram + tooltip
─────────────────────────────────────────────── */

const DISTRIBUTION = [
  { range: '0–80', n: 24 },
  { range: '80–160', n: 56 },
  { range: '160–240', n: 112 },
  { range: '240–320', n: 198 },
  { range: '320–400', n: 312 },
  { range: '400–480', n: 388 },
  { range: '480–560', n: 412 },
  { range: '560–640', n: 386 },
  { range: '640–720', n: 322 },
  { range: '720–800', n: 248 },
  { range: '800–880', n: 192 },
  { range: '880–1000', n: 91 },
];

function DistributionPanel({ active }: { active: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...DISTRIBUTION.map((d) => d.n));
  const total = DISTRIBUTION.reduce((acc, d) => acc + d.n, 0);

  return (
    <div className="p-5 space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 className="text-[12px] font-medium text-white">Score distribution</h4>
        <div className="flex items-center gap-3 mono text-[10px] text-white/35">
          <span>N = {total.toLocaleString()}</span>
          <span className="text-white/15">·</span>
          <span>μ ≈ 514</span>
          <span className="text-white/15">·</span>
          <span>σ ≈ 168</span>
        </div>
      </div>

      <div className="relative h-32">
        <AnimatePresence>
          {hover !== null && (
            <motion.div
              key={`tip-${hover}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="absolute -top-1 left-1/2 -translate-x-1/2 hairline rounded-md bg-black/85 backdrop-blur-sm px-2.5 py-1.5 mono text-[10px] text-white pointer-events-none z-10"
              style={{
                left: `${((hover + 0.5) / DISTRIBUTION.length) * 100}%`,
              }}
            >
              <span className="text-white/55">{DISTRIBUTION[hover]?.range}</span>
              <span className="ml-2 tabular-nums">
                {DISTRIBUTION[hover]?.n.toLocaleString()}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 flex items-end gap-1">
          {DISTRIBUTION.map((d, i) => {
            const h = (d.n / max) * 100;
            const isHover = hover === i;
            return (
              <motion.div
                key={d.range}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                initial={{ height: 0 }}
                animate={{ height: active ? `${h}%` : 0 }}
                transition={{
                  duration: 0.7,
                  ease: EASE,
                  delay: 0.05 + i * 0.025,
                }}
                className={cn(
                  'flex-1 cursor-pointer transition-colors origin-bottom',
                  isHover ? 'bg-[hsl(var(--marketing-accent))]' : 'bg-white/55',
                )}
                style={{ minHeight: 4 }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex justify-between mono text-[10px] text-white/35">
        <span>0</span>
        <span>250</span>
        <span>500</span>
        <span>750</span>
        <span>1000</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Habits panel — animated metrics with sparklines
─────────────────────────────────────────────── */

const HABITS: {
  label: string;
  to: number;
  format: (n: number) => string;
  trend: 'up' | 'down' | 'flat';
  spark: number[];
}[] = [
  {
    label: 'On-time bills',
    to: 94,
    format: (n) => `${Math.round(n)}%`,
    trend: 'up',
    spark: [70, 74, 78, 81, 85, 88, 90, 92, 94],
  },
  {
    label: 'Income variance',
    to: 0.18,
    format: (n) => n.toFixed(2),
    trend: 'down',
    spark: [0.32, 0.3, 0.27, 0.26, 0.24, 0.21, 0.2, 0.19, 0.18],
  },
  {
    label: 'Cash buffer · days',
    to: 23,
    format: (n) => Math.round(n).toString(),
    trend: 'up',
    spark: [12, 14, 16, 17, 18, 20, 21, 22, 23],
  },
  {
    label: 'Debt-to-income',
    to: 0.31,
    format: (n) => n.toFixed(2),
    trend: 'flat',
    spark: [0.32, 0.31, 0.32, 0.31, 0.3, 0.31, 0.31, 0.31, 0.31],
  },
];

function HabitsPanel({ active }: { active: boolean }) {
  return (
    <div className="p-5">
      <h4 className="text-[12px] font-medium text-white">Habit signals · 30d</h4>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.06]">
        {HABITS.map((h, i) => (
          <HabitCard key={h.label} habit={h} active={active} delay={i * 0.05} />
        ))}
      </div>
    </div>
  );
}

function HabitCard({
  habit,
  active,
  delay,
}: {
  habit: (typeof HABITS)[number];
  active: boolean;
  delay: number;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const duration = 1100;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 4);
      setN(habit.to * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay * 1000);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [active, habit.to, delay]);

  return (
    <motion.div
      whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.035)' }}
      transition={{ duration: 0.18 }}
      className="bg-[hsl(var(--marketing-bg))] p-4 space-y-2"
    >
      <div className="text-[10px] uppercase tracking-wider text-white/40">
        {habit.label}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="mono text-2xl font-semibold text-white tabular-nums leading-none">
            {habit.format(n)}
          </span>
          <TrendArrow trend={habit.trend} />
        </div>
        <Sparkline values={habit.spark} active={active} delay={delay} />
      </div>
    </motion.div>
  );
}

function Sparkline({
  values,
  active,
  delay,
}: {
  values: number[];
  active: boolean;
  delay: number;
}) {
  const path = useMemo(() => buildPath(values, 64, 22), [values]);
  return (
    <svg width="64" height="22" viewBox="0 0 64 22" className="overflow-visible">
      <motion.path
        d={path}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: delay + 0.1 }}
      />
    </svg>
  );
}

function buildPath(values: number[], w: number, h: number): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const dx = w / (values.length - 1 || 1);
  return values
    .map((v, i) => {
      const x = i * dx;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <span className="mono text-[11px] text-emerald-300/85">↑</span>;
  if (trend === 'down') return <span className="mono text-[11px] text-rose-300/85">↓</span>;
  return <span className="mono text-[11px] text-white/35">→</span>;
}

/* ──────────────────────────────────────────────
   Cohort timeline — animated curve
─────────────────────────────────────────────── */

const COHORT = [
  { week: 'W1', avg: 432 },
  { week: 'W2', avg: 448 },
  { week: 'W3', avg: 461 },
  { week: 'W4', avg: 474 },
  { week: 'W5', avg: 485 },
  { week: 'W6', avg: 497 },
  { week: 'W7', avg: 508 },
  { week: 'W8', avg: 514 },
];

function CohortPanel({ active }: { active: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 460;
  const h = 120;
  const path = useMemo(() => buildPath(COHORT.map((p) => p.avg), w, h), []);
  const areaPath = useMemo(() => {
    const min = Math.min(...COHORT.map((p) => p.avg));
    const max = Math.max(...COHORT.map((p) => p.avg));
    const range = max - min || 1;
    const dx = w / (COHORT.length - 1);
    let d = `M 0 ${h}`;
    COHORT.forEach((p, i) => {
      const x = i * dx;
      const y = h - ((p.avg - min) / range) * h;
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    });
    d += ` L ${w} ${h} Z`;
    return d;
  }, []);

  return (
    <div className="p-5 space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 className="text-[12px] font-medium text-white">
          Average score · 8 wks
        </h4>
        <div className="flex items-center gap-2 mono text-[10px] text-white/35">
          <span>Δ from W1</span>
          <span className="text-emerald-300/85 tabular-nums">+82</span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-32 overflow-visible"
          preserveAspectRatio="none"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="cohort-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.18" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>

          <motion.path
            d={areaPath}
            fill="url(#cohort-grad)"
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
          />

          <motion.path
            d={path}
            fill="none"
            stroke="white"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={active ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.1 }}
          />

          {COHORT.map((p, i) => {
            const x = (i / (COHORT.length - 1)) * w;
            const min = Math.min(...COHORT.map((q) => q.avg));
            const max = Math.max(...COHORT.map((q) => q.avg));
            const y = h - ((p.avg - min) / (max - min || 1)) * h;
            const isHover = hover === i;
            return (
              <g key={p.week}>
                <rect
                  x={x - w / COHORT.length / 2}
                  y={0}
                  width={w / COHORT.length}
                  height={h}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  className="cursor-pointer"
                />
                <motion.circle
                  cx={x}
                  cy={y}
                  r={isHover ? 4 : 2.5}
                  fill={isHover ? 'hsl(var(--marketing-accent))' : 'white'}
                  initial={{ opacity: 0 }}
                  animate={active ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                />
                {isHover && (
                  <g>
                    <line
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={h}
                      stroke="rgba(255,255,255,0.15)"
                      strokeDasharray="2 3"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {hover !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-2 hairline rounded-md bg-black/85 backdrop-blur-sm px-2.5 py-1.5 mono text-[10px] text-white pointer-events-none"
            style={{ left: `${(hover / (COHORT.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
          >
            <span className="text-white/55">{COHORT[hover]?.week}</span>
            <span className="ml-2 tabular-nums">{COHORT[hover]?.avg}</span>
          </motion.div>
        )}
      </div>

      <div className="flex justify-between mono text-[10px] text-white/35">
        {COHORT.map((p) => (
          <span key={p.week}>{p.week}</span>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Client feed — auto-prepending rows
─────────────────────────────────────────────── */

type ClientRow = {
  id: string;
  name: string;
  score: number;
  band: string;
  delta: string;
};

const SEED_CLIENTS: ClientRow[] = [
  { id: 'KLR-7421', name: 'M. Ben Salah', score: 712, band: 'GOOD', delta: '+12' },
  { id: 'KLR-7409', name: 'A. Trabelsi', score: 488, band: 'FAIR', delta: '−4' },
  { id: 'KLR-7388', name: 'L. Karoui', score: 814, band: 'EXC.', delta: '+6' },
  { id: 'KLR-7361', name: 'S. Hamdi', score: 561, band: 'FAIR', delta: '+2' },
];


function ClientFeed() {
  const [rows] = useState<ClientRow[]>(SEED_CLIENTS);

  return (
    <div className="hairline-t bg-[hsl(var(--marketing-bg))]">
      <div className="px-5 py-3 flex items-center justify-between">
        <h4 className="text-[12px] font-medium text-white">Recent clients</h4>
        <span className="mono text-[10px] text-white/35">last 4</span>
      </div>
      <div className="hairline-t">
        <div className="grid grid-cols-[1.3fr_1.6fr_0.8fr_0.8fr_0.8fr] mono text-[10px] tracking-wider text-white/35 px-5 py-2">
          <span>ID</span>
          <span>CLIENT</span>
          <span>SCORE</span>
          <span>BAND</span>
          <span className="text-right">Δ 30D</span>
        </div>
        <div className="relative">
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: -8, backgroundColor: 'rgba(255,122,69,0.08)' }}
                animate={{
                  opacity: 1,
                  y: 0,
                  backgroundColor: 'rgba(255,122,69,0)',
                  transition: {
                    opacity: { duration: 0.4, ease: EASE },
                    y: { duration: 0.4, ease: EASE },
                    backgroundColor: { duration: 1.6, ease: EASE, delay: 0.4 },
                  },
                }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
                className="grid grid-cols-[1.3fr_1.6fr_0.8fr_0.8fr_0.8fr] items-center text-[12px] text-white/80 px-5 py-2.5 border-t border-white/[0.05]"
              >
                <span className="mono text-white/45">{r.id}</span>
                <span>{r.name}</span>
                <span className="mono tabular-nums">{r.score}</span>
                <span className="mono text-[10px] tracking-wider text-white/55">
                  {r.band}
                </span>
                <span
                  className={cn(
                    'mono tabular-nums text-right',
                    r.delta.startsWith('−')
                      ? 'text-rose-300/85'
                      : 'text-emerald-300/85',
                  )}
                >
                  {r.delta}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
