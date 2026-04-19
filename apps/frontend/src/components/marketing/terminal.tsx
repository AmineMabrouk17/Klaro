import { cn } from '@klaro/ui';
import type { ReactNode } from 'react';

type TerminalProps = {
  title?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Reusable terminal/code block. Children should be the literal lines.
 * Use the helper components below for inline coloring.
 */
export function Terminal({ title = 'terminal', className, children }: TerminalProps) {
  return (
    <div className={cn('terminal-block overflow-hidden', className)}>
      <div className="flex items-center justify-between px-4 py-2.5 hairline-b">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </div>
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-white/35">
          {title}
        </span>
        <span className="w-10" />
      </div>
      <pre className="overflow-x-auto px-5 py-4 text-[12.5px] leading-[1.7]">
        {children}
      </pre>
    </div>
  );
}

export function TerminalPrompt({ children }: { children: ReactNode }) {
  return (
    <span className="text-white/35 select-none">
      <span className="text-emerald-400/80">$</span> {children}
    </span>
  );
}

export function TerminalComment({ children }: { children: ReactNode }) {
  return <span className="text-white/30">{children}</span>;
}

export function TerminalKey({ children }: { children: ReactNode }) {
  return <span className="text-sky-300/85">{children}</span>;
}

export function TerminalString({ children }: { children: ReactNode }) {
  return <span className="text-amber-200/85">{children}</span>;
}

export function TerminalNumber({ children }: { children: ReactNode }) {
  return <span className="text-emerald-300/85">{children}</span>;
}
