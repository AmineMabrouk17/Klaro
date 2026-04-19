'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@klaro/ui';

type RotatingWordProps = {
  words: string[];
  /** Per-word dwell time in ms. Default 2200ms. */
  interval?: number;
  className?: string;
  trailing?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Inline word that swaps between values with a vertical slide+fade.
 * Reserves its widest width to avoid layout shift.
 */
export function RotatingWord({
  words,
  interval = 2200,
  className,
  trailing = '.',
}: RotatingWordProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [interval, words.length]);

  const widest = words.reduce((a, b) => (a.length > b.length ? a : b), '');
  const current = words[index] ?? widest;

  return (
    <span
      className={cn('relative inline-block align-baseline', className)}
      aria-live="polite"
    >
      {/* Width-reserving phantom — invisible but takes layout space */}
      <span aria-hidden className="invisible whitespace-nowrap">
        {widest}
        {trailing}
      </span>

      <span className="absolute inset-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={current}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-110%', opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="block whitespace-nowrap"
          >
            {current}
            {trailing}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
