'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@klaro/ui';

type PhoneFrameProps = {
  title: string;
  className?: string;
  children: React.ReactNode;
  /** Width × height of the device in px. Default 286 × 600. */
  width?: number;
  height?: number;
  /** Disable cursor-driven micro-tilt. */
  staticTilt?: boolean;
};

/**
 * Reusable iPhone-style 3D frame with status bar + home indicator.
 * Children are rendered inside the screen area.
 */
export function PhoneShell({
  title,
  className,
  children,
  width = 286,
  height = 600,
  staticTilt = false,
}: PhoneFrameProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotY = useSpring(useTransform(mouseX, [-1, 1], [4, -4]), {
    stiffness: 120,
    damping: 16,
  });
  const rotX = useSpring(useTransform(mouseY, [-1, 1], [-3, 3]), {
    stiffness: 120,
    damping: 16,
  });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (staticTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  }

  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div
      className={cn('relative select-none', className)}
      style={{ perspective: 1600 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-white/[0.05] via-[hsl(var(--marketing-accent)/0.06)] to-transparent blur-2xl"
      />

      <motion.div
        className="relative mx-auto"
        style={{
          width,
          height,
          rotateX: staticTilt ? 0 : rotX,
          rotateY: staticTilt ? 0 : rotY,
          transformStyle: 'preserve-3d',
          transformOrigin: 'center center',
        }}
        initial={{ rotateY: -14, rotateX: 6 }}
        animate={{ rotateY: -14, rotateX: 6 }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      >
        <PhoneFrameOuter>
          <StatusBar title={title} />
          <div className="relative flex-1 overflow-hidden bg-[#0b0b0b]">
            {children}
          </div>
          <HomeIndicator />
        </PhoneFrameOuter>
      </motion.div>
    </div>
  );
}

function PhoneFrameOuter({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[44px] bg-[#050505]"
      style={{
        boxShadow:
          '0 0 0 1.5px rgba(255,255,255,0.06), 0 0 0 9px #1a1a1a, 0 0 0 10px rgba(255,255,255,0.05), 0 40px 80px -20px rgba(0,0,0,0.8), 0 20px 40px -10px rgba(255,122,69,0.08)',
      }}
    >
      <div
        aria-hidden
        className="absolute -left-[10px] top-[110px] h-7 w-[3px] rounded-l bg-[#1a1a1a]"
      />
      <div
        aria-hidden
        className="absolute -left-[10px] top-[160px] h-12 w-[3px] rounded-l bg-[#1a1a1a]"
      />
      <div
        aria-hidden
        className="absolute -left-[10px] top-[220px] h-12 w-[3px] rounded-l bg-[#1a1a1a]"
      />
      <div
        aria-hidden
        className="absolute -right-[10px] top-[170px] h-20 w-[3px] rounded-r bg-[#1a1a1a]"
      />

      <div className="relative pt-3.5 px-6 pb-1.5 z-20 flex justify-center">
        <div className="h-[26px] w-[100px] rounded-full bg-black ring-1 ring-white/[0.04]" />
      </div>

      {children}
    </div>
  );
}

function HomeIndicator() {
  return (
    <div className="flex justify-center pt-1.5 pb-2 bg-[#0b0b0b]">
      <div className="h-[5px] w-[110px] rounded-full bg-white/40" />
    </div>
  );
}

function StatusBar({ title }: { title: string }) {
  return (
    <div className="absolute top-3 left-0 right-0 px-7 z-30 flex items-center justify-between mono text-[9px] font-semibold tracking-wider text-white/85">
      <span>9:41</span>
      <span className="text-white/35 tracking-[0.16em] uppercase truncate max-w-[140px] text-center">
        {title}
      </span>
      <span className="flex items-center gap-1">
        <SignalIcon />
        <BatteryIcon />
      </span>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
      <rect x="0" y="6" width="2" height="2" rx="0.4" fill="currentColor" />
      <rect x="3" y="4" width="2" height="4" rx="0.4" fill="currentColor" />
      <rect x="6" y="2" width="2" height="6" rx="0.4" fill="currentColor" />
      <rect
        x="9"
        y="0"
        width="2"
        height="8"
        rx="0.4"
        fill="currentColor"
        opacity="0.4"
      />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="18" height="9" viewBox="0 0 18 9" fill="none">
      <rect
        x="0.5"
        y="0.5"
        width="14"
        height="8"
        rx="2"
        stroke="currentColor"
        opacity="0.55"
      />
      <rect x="2" y="2" width="9" height="5" rx="0.8" fill="currentColor" />
      <rect
        x="15.5"
        y="3"
        width="1.5"
        height="3"
        rx="0.5"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}
