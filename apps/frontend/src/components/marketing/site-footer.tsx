import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="relative z-10 hairline-t mt-24">
      <div className="mx-auto max-w-6xl px-6 py-10 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-[13px] text-white">
            <span className="status-dot" />
            <span className="mono text-[11px] tracking-[0.18em] text-white/55">
              KLARO · API OPERATIONAL
            </span>
          </div>
          <p className="text-[13px] text-white/45 max-w-sm leading-relaxed">
            Alternative credit scoring infrastructure for Tunisia. Built on open-source
            KYC, transparent signals, and an AI advisor.
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            { href: '/', label: 'For Users' },
            { href: '/partners', label: 'For Banks' },
            { href: '/#how', label: 'How it works' },
            { href: '/partners#api', label: 'API' },
          ]}
        />

        <FooterCol
          title="Company"
          links={[
            { href: '/login', label: 'Sign in' },
            { href: '/register', label: 'Get started' },
            { href: 'mailto:partners@klaro.tn', label: 'Contact' },
            { href: 'https://github.com', label: 'GitHub' },
          ]}
        />
      </div>

      <div className="hairline-t">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between text-[11px] text-white/35">
          <span className="mono tracking-[0.14em]">
            © {new Date().getFullYear()} KLARO PROTOCOL · TUNIS
          </span>
          <span className="mono tracking-[0.14em]">v0.1.0</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="space-y-3">
      <h4 className="eyebrow text-white/55">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-[13px] text-white/55 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
