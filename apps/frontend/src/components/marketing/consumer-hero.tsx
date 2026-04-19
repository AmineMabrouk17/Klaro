'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { InteractiveDots } from './interactive-dots';
import { PhoneMockup } from './phone-mockup';
import { RotatingWord } from './rotating-word';

const EASE_OUT_QUART = [0.22, 1, 0.36, 1] as const;

const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT_QUART } },
};

export function ConsumerHero() {
  return (
    <section className="relative">
      <InteractiveDots className="z-0" />
      <div className="relative z-10 mx-auto max-w-[1480px] pl-4 pr-4 sm:pl-8 sm:pr-6 lg:pl-12 lg:pr-6 pt-20 pb-24 sm:pt-28 sm:pb-28">
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="grid gap-10 lg:grid-cols-[1.65fr_0.7fr] lg:items-center"
        >
          <div className="space-y-9">
            <motion.div
              variants={heroItem}
              className="inline-flex items-center gap-2 hairline rounded-full px-3 py-1.5 bg-white/[0.03]"
            >
              <span className="status-dot" />
              <span className="mono text-[10.5px] tracking-[0.18em] uppercase text-white/65">
                Alternative credit scoring · Tunisia
              </span>
            </motion.div>

            <motion.h1
              variants={heroItem}
              className="text-[48px] leading-[0.98] sm:text-[64px] lg:text-[80px] xl:text-[92px] font-semibold tracking-[-0.025em] text-white lg:whitespace-nowrap"
            >
              Your real
              <br />
              financial story.
              <br />
              <span className="text-white/45">Scored </span>
              <RotatingWord
                className="mono italic accent-text font-normal"
                words={[
                  'fairly',
                  'instantly',
                  'honestly',
                  'openly',
                ]}
              />
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="text-[16px] sm:text-[17px] text-white/55 max-w-lg leading-relaxed"
            >
              Klaro builds a transparent credit score from your KYC, bank activity, and
              payment behavior — without the bureau gatekeeping. Open-source pipeline.
              Your data stays yours.
            </motion.p>

            <motion.div variants={heroItem} className="flex flex-wrap items-center gap-3">
              <HoverLink>
                <Link
                  href="/register"
                  className="btn-mark-primary inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium"
                >
                  Get my score
                  <ArrowRight />
                </Link>
              </HoverLink>
              <HoverLink>
                <Link
                  href="/partners"
                  className="btn-mark-ghost inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium"
                >
                  I&apos;m a bank
                </Link>
              </HoverLink>
            </motion.div>

            <motion.div
              variants={heroItem}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mono text-[11px] tracking-[0.12em] uppercase text-white/40 pt-4"
            >
              <span>1000-pt scale</span>
              <span className="text-white/15">·</span>
              <span>4 layers</span>
              <span className="text-white/15">·</span>
              <span>Self-hosted KYC</span>
              <span className="text-white/15">·</span>
              <span>5 min to first score</span>
            </motion.div>
          </div>

          <motion.div
            variants={heroItem}
            className="relative flex justify-center lg:justify-end lg:-mr-4 xl:mr-0"
          >
            <PhoneMockup />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function HoverLink({ children }: { children: React.ReactNode }) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
      {children}
    </motion.div>
  );
}

function ArrowRight() {
  return (
    <motion.span
      aria-hidden
      className="inline-block"
      initial={{ x: 0 }}
      whileHover={{ x: 3 }}
    >
      →
    </motion.span>
  );
}
