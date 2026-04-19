'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@klaro/ui';
import { PhoneShell } from './phone-frame';

const EASE = [0.22, 1, 0.36, 1] as const;

type Bubble =
  | { from: 'user'; text: string; id: string }
  | { from: 'ai'; text: string; id: string }
  | { from: 'ai-card'; id: string }
  | { from: 'ai-tips'; id: string };

const SCRIPT: Bubble[] = [
  { id: 'u1', from: 'user', text: 'Why is my score 642?' },
  {
    id: 'a1',
    from: 'ai',
    text: 'Three things are pulling you down right now. The biggest is cash-flow.',
  },
  { id: 'a-card', from: 'ai-card' },
  { id: 'u2', from: 'user', text: 'How do I fix the cash-flow part?' },
  {
    id: 'a2',
    from: 'ai',
    text: 'Two simple moves get you to ~710 in 60 days:',
  },
  { id: 'a-tips', from: 'ai-tips' },
];

type AdvisorPhoneProps = {
  className?: string;
};

/**
 * Centered iPhone mockup featuring the Klaro AI advisor in a chat thread.
 * Messages stream in with typing indicators between bubbles, then the
 * conversation softly resets so the screen feels alive.
 */
export function AdvisorPhone({ className }: AdvisorPhoneProps) {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Streaming logic: typing indicator → reveal next bubble → repeat.
  useEffect(() => {
    if (shown >= SCRIPT.length) {
      const reset = window.setTimeout(() => {
        setShown(0);
      }, 6000);
      return () => window.clearTimeout(reset);
    }

    const next = SCRIPT[shown];
    const isAi = next?.from.startsWith('ai');
    const typingDelay = isAi ? 900 : 350;
    const settleDelay = isAi ? 250 : 200;

    setTyping(isAi ?? false);
    const tId = window.setTimeout(() => {
      setTyping(false);
      const sId = window.setTimeout(() => {
        setShown((n) => n + 1);
      }, settleDelay);
      return () => window.clearTimeout(sId);
    }, typingDelay);

    return () => window.clearTimeout(tId);
  }, [shown]);

  // Scroll to bottom as bubbles appear.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [shown, typing]);

  const visible = useMemo(() => SCRIPT.slice(0, shown), [shown]);

  return (
    <div className={cn('relative', className)}>
      <PhoneShell title="klaro · advisor">
        <div className="absolute inset-0 flex flex-col">
          {/* Advisor header */}
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 pt-4 pb-3">
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-white/15 to-white/5 ring-1 ring-white/10">
              <span className="absolute inset-0 grid place-items-center mono text-[10px] font-semibold text-white">
                K
              </span>
              <span className="absolute -right-px -bottom-px h-2.5 w-2.5 rounded-full bg-emerald-400 ring-[1.5px] ring-[#0b0b0b]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium leading-tight text-white">
                Klaro Advisor
              </div>
              <div className="mono text-[9px] tracking-[0.16em] uppercase text-white/40">
                Online · personalized
              </div>
            </div>
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-full text-white/40 hover:bg-white/[0.04]"
              aria-label="More"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="3" cy="7" r="1.2" fill="currentColor" />
                <circle cx="7" cy="7" r="1.2" fill="currentColor" />
                <circle cx="11" cy="7" r="1.2" fill="currentColor" />
              </svg>
            </button>
          </div>

          {/* Thread */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <AnimatePresence initial={false}>
              {visible.map((b) => (
                <BubbleRow key={b.id} bubble={b} />
              ))}
              {typing && <TypingBubble key="typing" />}
            </AnimatePresence>
          </div>

          {/* Composer (decorative) */}
          <div className="border-t border-white/[0.06] px-3.5 py-2.5">
            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
              <div className="flex-1 mono text-[10.5px] tracking-wide text-white/35">
                Ask anything…
              </div>
              <div className="grid h-6 w-6 place-items-center rounded-full bg-white text-black">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path
                    d="M1 5.5 L9.5 5.5 M6 2 L9.5 5.5 L6 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </PhoneShell>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Bubbles
─────────────────────────────────────────────── */

function BubbleRow({ bubble }: { bubble: Bubble }) {
  const isUser = bubble.from === 'user';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.35, ease: EASE },
      }}
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      {bubble.from === 'user' && <UserBubble text={bubble.text} />}
      {bubble.from === 'ai' && <AiBubble text={bubble.text} />}
      {bubble.from === 'ai-card' && <ScoreCardBubble />}
      {bubble.from === 'ai-tips' && <TipsBubble />}
    </motion.div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="max-w-[78%] rounded-2xl rounded-br-md bg-white px-3 py-1.5 text-[12px] leading-snug text-black">
      {text}
    </div>
  );
}

function AiBubble({ text }: { text: string }) {
  return (
    <div className="max-w-[82%] rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[12px] leading-snug text-white/85">
      {text}
    </div>
  );
}

function TypingBubble() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex"
    >
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.04] px-3 py-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-white/55"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -1.5, 0] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function ScoreCardBubble() {
  const breakdown = [
    { label: 'Income stability', pct: 72, tone: 'good' },
    { label: 'Document quality', pct: 88, tone: 'good' },
    { label: 'Payment behavior', pct: 64, tone: 'mid' },
    { label: 'Cash-flow', pct: 41, tone: 'low' },
  ] as const;

  return (
    <div className="w-full max-w-[88%] rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.03] p-3">
      <div className="flex items-center justify-between">
        <div className="mono text-[8.5px] tracking-[0.18em] uppercase text-white/45">
          Score · 642
        </div>
        <div className="mono text-[8.5px] tracking-[0.18em] uppercase text-white/55">
          Band · GOOD
        </div>
      </div>
      <div className="mt-2.5 space-y-1.5">
        {breakdown.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, x: -4 }}
            animate={{
              opacity: 1,
              x: 0,
              transition: { delay: 0.1 + i * 0.06, duration: 0.3 },
            }}
            className="space-y-0.5"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span
                className={cn(
                  'truncate',
                  b.tone === 'low'
                    ? 'text-[hsl(var(--marketing-accent))]'
                    : 'text-white/70',
                )}
              >
                {b.label}
              </span>
              <span className="mono tabular-nums text-white/45">
                {b.pct.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="h-px w-full overflow-hidden bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${b.pct}%` }}
                transition={{
                  duration: 0.8,
                  ease: EASE,
                  delay: 0.15 + i * 0.06,
                }}
                className={cn(
                  'h-full',
                  b.tone === 'low'
                    ? 'bg-[hsl(var(--marketing-accent))]'
                    : 'bg-white/55',
                )}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TipsBubble() {
  const tips = [
    'Receive your salary in 1 account, consistently.',
    'Keep a small buffer (~50 TND) at month-end.',
    'Pay your phone & utility bills on time, every time.',
  ];
  return (
    <div className="w-full max-w-[88%] rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.03] p-3">
      <div className="mono text-[8.5px] tracking-[0.18em] uppercase text-white/45">
        Plan · 60 days
      </div>
      <ul className="mt-2 space-y-1.5">
        {tips.map((t, i) => (
          <motion.li
            key={t}
            initial={{ opacity: 0, y: 4 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: 0.08 + i * 0.08, duration: 0.3 },
            }}
            className="flex items-start gap-2 text-[11.5px] leading-snug text-white/85"
          >
            <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--marketing-accent))]" />
            <span>{t}</span>
          </motion.li>
        ))}
      </ul>
      <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2">
        <span className="mono text-[9px] tracking-[0.16em] uppercase text-white/40">
          Projected
        </span>
        <span className="mono text-[10px] tabular-nums text-white">
          642 → <span className="text-emerald-300">710</span>
        </span>
      </div>
    </div>
  );
}
