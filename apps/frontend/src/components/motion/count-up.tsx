'use client';

import { animate, useInView, useMotionValue, useTransform, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

type CountUpProps = {
  to: number;
  from?: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
};

/**
 * Animates a number from `from` to `to` once it scrolls into view.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1.4,
  format,
  className,
  prefix,
  suffix,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20% 0px' });
  const value = useMotionValue(from);
  const display = useTransform(value, (v) =>
    format ? format(v) : Math.round(v).toString(),
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, {
      duration,
      ease: [0.22, 1, 0.36, 1] as const,
    });
    return controls.stop;
  }, [inView, value, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}
