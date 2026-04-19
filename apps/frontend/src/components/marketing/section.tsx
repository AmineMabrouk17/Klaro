import { cn } from '@klaro/ui';
import type { ReactNode } from 'react';

type SectionProps = {
  id?: string;
  index?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  children?: ReactNode;
};

export function Section({
  id,
  index,
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  children,
}: SectionProps) {
  return (
    <section id={id} className={cn('relative py-20 sm:py-24', className)}>
      <div
        className={cn(
          'mx-auto max-w-6xl px-6',
          align === 'center' && 'text-center',
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-3',
            align === 'center' ? 'items-center' : 'items-start',
          )}
        >
          {(index || eyebrow) && (
            <div className="flex items-center gap-3">
              {index && (
                <span className="mono text-[11px] tracking-[0.18em] text-white/35">
                  {index}
                </span>
              )}
              {eyebrow && (
                <span className="eyebrow text-white/55">{eyebrow}</span>
              )}
            </div>
          )}
          <h2
            className={cn(
              'text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white max-w-2xl',
              align === 'center' && 'mx-auto',
            )}
          >
            {title}
          </h2>
          {description && (
            <p
              className={cn(
                'text-base text-white/55 max-w-xl leading-relaxed',
                align === 'center' && 'mx-auto',
              )}
            >
              {description}
            </p>
          )}
        </div>
        {children && <div className="mt-12">{children}</div>}
      </div>
    </section>
  );
}
