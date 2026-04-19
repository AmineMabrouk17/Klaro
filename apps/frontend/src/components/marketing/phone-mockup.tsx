'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { cn } from '@klaro/ui';
import { PhoneShell } from './phone-frame';

const STEPS = ['register', 'connect', 'score'] as const;
type Step = (typeof STEPS)[number];

const EASE = [0.22, 1, 0.36, 1] as const;

const screenVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.35, ease: EASE } },
};

type PhoneMockupProps = {
  className?: string;
  /** Auto-advance interval in ms. */
  interval?: number;
};

const TITLES: Record<Step, string> = {
  register: 'klaro · sign up',
  connect: 'klaro · banks',
  score: 'klaro · home',
};

/**
 * 3D iPhone-style mockup that auto-cycles through a short Klaro flow:
 * 1. Create account
 * 2. Connect bank
 * 3. Score reveal
 */
export function PhoneMockup({ className, interval = 3600 }: PhoneMockupProps) {
  const [step, setStep] = useState<Step>('register');

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => STEPS[(STEPS.indexOf(s) + 1) % STEPS.length] ?? STEPS[0]);
    }, interval);
    return () => window.clearInterval(id);
  }, [interval]);

  return (
    <div className={cn('relative', className)}>
      <PhoneShell title={TITLES[step]}>
        <AnimatePresence mode="wait">
          {step === 'register' && (
            <motion.div
              key="register"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 px-5 pt-5 pb-4 flex flex-col"
            >
              <RegisterScreen />
            </motion.div>
          )}
          {step === 'connect' && (
            <motion.div
              key="connect"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 px-5 pt-5 pb-4 flex flex-col"
            >
              <ConnectScreen />
            </motion.div>
          )}
          {step === 'score' && (
            <motion.div
              key="score"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 px-5 pt-5 pb-4 flex flex-col"
            >
              <ScoreScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </PhoneShell>

      <StepDots step={step} onPick={setStep} />
    </div>
  );
}

function StepDots({ step, onPick }: { step: Step; onPick: (s: Step) => void }) {
  return (
    <div className="mt-5 flex justify-center gap-1.5">
      {STEPS.map((s) => (
        <button
          key={s}
          aria-label={`Show ${s} step`}
          onClick={() => onPick(s)}
          className={cn(
            'h-[3px] rounded-full transition-all',
            s === step ? 'w-7 bg-white' : 'w-3 bg-white/20 hover:bg-white/40',
          )}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Screens
─────────────────────────────────────────────── */

function RegisterScreen() {
  return (
    <>
      <div className="pt-3">
        <div className="mono text-[8.5px] tracking-[0.18em] uppercase text-white/45">
          Step 01 · Account
        </div>
        <h3 className="mt-1 text-[19px] font-semibold leading-tight text-white">
          Create your
          <br /> Klaro profile.
        </h3>
      </div>

      <div className="mt-5 space-y-3">
        <PhoneField label="Full name" value="Amen Dhahri" delay={0.1} />
        <PhoneField label="Email" value="amen@klaro.tn" delay={0.2} />
        <PhoneField label="Password" value="••••••••••" delay={0.3} />
      </div>

      <div className="mt-auto space-y-2.5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.4 } }}
          className="flex h-10 items-center justify-center rounded-lg bg-white text-black text-[12.5px] font-semibold"
        >
          Create account
          <span className="ml-1.5">→</span>
        </motion.div>
        <p className="mono text-[9px] tracking-[0.14em] uppercase text-white/30 text-center">
          Free · No credit card
        </p>
      </div>
    </>
  );
}

function PhoneField({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0, transition: { delay, duration: 0.4 } }}
      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 pt-2 pb-2.5"
    >
      <div className="mono text-[8.5px] tracking-[0.16em] uppercase text-white/40">
        {label}
      </div>
      <div className="mt-0.5 text-[13px] text-white">{value}</div>
    </motion.div>
  );
}

function ConnectScreen() {
  const banks = [
    { name: 'Banque de Tunisie', code: 'BT', accent: 'rgb(98,140,255)' },
    { name: 'Attijari Bank', code: 'AB', accent: 'rgb(255,170,80)' },
    { name: 'BIAT', code: 'BI', accent: 'rgb(115,200,140)' },
    { name: 'Amen Bank', code: 'AM', accent: 'rgb(208,108,255)' },
  ];
  return (
    <>
      <div className="pt-3">
        <div className="mono text-[8.5px] tracking-[0.18em] uppercase text-white/45">
          Step 02 · Bank link
        </div>
        <h3 className="mt-1 text-[19px] font-semibold leading-tight text-white">
          Connect your
          <br /> bank, securely.
        </h3>
      </div>

      <div className="mt-5 space-y-2">
        {banks.map((b, i) => (
          <motion.div
            key={b.code}
            initial={{ opacity: 0, y: 6 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: 0.1 + i * 0.07, duration: 0.4 },
            }}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2.5',
              i === 1
                ? 'border-white/30 bg-white/[0.06]'
                : 'border-white/8 bg-white/[0.02]',
            )}
          >
            <div
              className="grid h-7 w-7 place-items-center rounded-md mono text-[10px] font-bold text-white"
              style={{ background: b.accent }}
            >
              {b.code}
            </div>
            <div className="flex-1">
              <div className="text-[12.5px] font-medium text-white leading-tight">
                {b.name}
              </div>
              <div className="mono text-[9px] tracking-[0.14em] uppercase text-white/35">
                Read-only access
              </div>
            </div>
            {i === 1 ? <ConnectingDots /> : <Chevron />}
          </motion.div>
        ))}
      </div>

      <div className="mt-auto">
        <p className="mono text-[9px] tracking-[0.14em] uppercase text-white/30 text-center">
          Encrypted · revoke anytime
        </p>
      </div>
    </>
  );
}

function ConnectingDots() {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-[3.5px] w-[3.5px] rounded-full bg-white"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-white/30">
      <path
        d="M3 1.5 L7 5 L3 8.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScoreScreen() {
  const signals = [
    { label: 'Income stability', pct: 72 },
    { label: 'Payment behavior', pct: 64 },
    { label: 'Document quality', pct: 88 },
    { label: 'Cash-flow', pct: 51 },
  ];
  return (
    <>
      <div className="pt-3">
        <div className="mono text-[8.5px] tracking-[0.18em] uppercase text-white/45">
          Step 03 · Your score
        </div>
        <h3 className="mt-1 text-[19px] font-semibold leading-tight text-white">
          Hello, Amen.
        </h3>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <div className="relative h-32 w-32">
          <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1.6"
            />
            <motion.circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="butt"
              initial={{ strokeDasharray: '0 100' }}
              animate={{ strokeDasharray: '64.2 100' }}
              transition={{ duration: 1.4, ease: EASE, delay: 0.15 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <CountUpNumber to={642} />
            <span className="mono text-[9px] tracking-[0.18em] text-white/40">
              / 1000
            </span>
          </div>
        </div>
        <div className="mt-1.5 mono text-[9.5px] tracking-[0.18em] text-white/55">
          BAND · GOOD
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {signals.map((sig, i) => (
          <motion.div
            key={sig.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{
              opacity: 1,
              x: 0,
              transition: { delay: 0.4 + i * 0.07, duration: 0.4 },
            }}
            className="space-y-1"
          >
            <div className="flex justify-between text-[10px]">
              <span className="text-white/65">{sig.label}</span>
              <span className="mono text-white/45 tabular-nums">
                {sig.pct.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="h-px w-full bg-white/8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${sig.pct}%` }}
                transition={{
                  duration: 0.9,
                  ease: EASE,
                  delay: 0.45 + i * 0.07,
                }}
                className="h-full bg-white/55"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}

function CountUpNumber({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 1100;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 4);
      setN(Math.round(to * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return (
    <span className="mono text-[28px] font-semibold tabular-nums text-white leading-none">
      {n}
    </span>
  );
}
