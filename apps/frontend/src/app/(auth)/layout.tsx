import Link from 'next/link';
import { GridBackground } from '@/components/marketing/grid-background';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell relative min-h-screen flex flex-col overflow-hidden">
      <GridBackground />

      <header className="relative z-10 hairline-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-white"
          >
            <span
              aria-hidden
              className="grid h-6 w-6 place-items-center rounded-md hairline bg-white/[0.04]"
            >
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="square"
              >
                <path d="M3 13V3" />
                <path d="M3 8 L13 3" />
                <path d="M3 8 L13 13" />
              </svg>
            </span>
            <span>Klaro</span>
          </Link>
          <Link
            href="/"
            className="mono text-[11px] tracking-[0.16em] uppercase text-white/45 hover:text-white transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="relative z-10 hairline-t">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between text-[11px] text-white/35">
          <span className="mono tracking-[0.14em]">© {new Date().getFullYear()} KLARO PROTOCOL</span>
          <span className="mono tracking-[0.14em]">v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}
