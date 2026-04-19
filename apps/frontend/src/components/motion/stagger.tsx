'use client';

import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

const EASE_OUT_QUART = [0.22, 1, 0.36, 1] as const;

type StaggerProps = HTMLMotionProps<'div'> & {
  stagger?: number;
  delay?: number;
  once?: boolean;
  children: ReactNode;
};

const containerVariants: Variants = {
  hidden: {},
  show: (custom: { stagger: number; delay: number }) => ({
    transition: { staggerChildren: custom.stagger, delayChildren: custom.delay },
  }),
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT_QUART } },
};

/**
 * Stagger entrance for a list of children. Wrap each child in <StaggerItem>.
 */
export function Stagger({
  stagger = 0.07,
  delay = 0,
  once = true,
  children,
  ...rest
}: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-10% 0px -10% 0px' }}
      variants={containerVariants}
      custom={{ stagger, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  ...rest
}: HTMLMotionProps<'div'> & { children: ReactNode }) {
  return (
    <motion.div variants={itemVariants} {...rest}>
      {children}
    </motion.div>
  );
}
