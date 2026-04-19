'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

const EASE_OUT_QUART = [0.22, 1, 0.36, 1] as const;

type FadeInProps = HTMLMotionProps<'div'> & {
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
  children: ReactNode;
};

/**
 * Drop-in scroll-reveal wrapper. Fades + lifts on enter.
 * Default: triggers once when 30% in view.
 */
export function FadeIn({
  delay = 0,
  y = 12,
  duration = 0.55,
  once = true,
  children,
  ...rest
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-10% 0px -10% 0px' }}
      transition={{ duration, delay, ease: EASE_OUT_QUART }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
