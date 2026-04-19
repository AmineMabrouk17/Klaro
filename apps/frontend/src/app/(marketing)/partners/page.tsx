import type { Metadata } from 'next';
import Link from 'next/link';
import { PartnerHero } from '@/components/marketing/partner-hero';
import { Section } from '@/components/marketing/section';
import {
  Terminal,
  TerminalKey,
  TerminalNumber,
  TerminalPrompt,
  TerminalString,
} from '@/components/marketing/terminal';
import { FadeIn } from '@/components/motion/fade-in';
import { Stagger, StaggerItem } from '@/components/motion/stagger';
import { CountUp } from '@/components/motion/count-up';

export const metadata: Metadata = {
  title: 'For Banks · Klaro',
  description:
    'Klaro for Banks — score Tunisian users beyond the bureau. API access, real-time habits & cash-flow signals, and a partner dashboard built for credit teams.',
};

const PARTNER_EMAIL = 'mailto:partners@klaro.tn?subject=Klaro%20Partner%20API%20access';

export default function PartnersPage() {
  return (
    <>
      <PartnerHero />
      <PartnerStats />
      <WhatYouGet />
      <ApiBlock />
      <DashboardSurfaces />
      <ComplianceStrip />
      <PricingTeaser />
      <PartnerCTA />
    </>
  );
}

function PartnerStats() {
  const stats = [
    { kind: 'count' as const, to: 60, suffix: '%', label: 'Tunisians outside the bureau' },
    { kind: 'count' as const, to: 4, label: 'Signal layers' },
    { kind: 'static' as const, value: '< 200ms', label: 'Score API latency' },
    { kind: 'static' as const, value: '99.9%', label: 'Target uptime' },
  ];
  return (
    <div className="hairline-t hairline-b">
      <div className="mx-auto max-w-6xl px-6">
        <Stagger
          stagger={0.06}
          className="grid grid-cols-2 gap-px bg-white/[0.06] sm:grid-cols-4"
        >
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <div className="bg-[hsl(var(--marketing-bg))] py-7 px-4 h-full">
                <div className="mono text-2xl sm:text-3xl font-semibold tracking-tight text-white tabular-nums">
                  {s.kind === 'count' ? (
                    <CountUp to={s.to} suffix={s.suffix} />
                  ) : (
                    s.value
                  )}
                </div>
                <div className="mt-1 mono text-[10px] tracking-[0.18em] uppercase text-white/40">
                  {s.label}
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  );
}

function WhatYouGet() {
  const items = [
    {
      tag: 'API',
      title: 'Programmable score',
      body: 'GET /v1/score/:user returns score, band, and per-layer signals. POST /v1/score/batch for bulk underwriting. JSON in. JSON out.',
    },
    {
      tag: 'Console',
      title: 'Partner dashboard',
      body: 'Score distribution across your portfolio, habit cohorts, and per-client deep-dive. Built for credit analysts, not engineers.',
    },
    {
      tag: 'Events',
      title: 'Webhook delivery',
      body: 'Subscribe to score.changed, kyc.completed, and signal.alert. HMAC-signed, retryable, replayable.',
    },
  ];
  return (
    <Section
      index="01"
      eyebrow="What you get"
      title="An API and a console — wired to the same engine."
      description="Underwrite from your own stack, or hand the dashboard to your credit team. Same data, two surfaces."
      className="hairline-b"
    >
      <Stagger
        stagger={0.08}
        className="grid gap-px bg-white/[0.06] hairline sm:grid-cols-3"
      >
        {items.map((it) => (
          <StaggerItem key={it.title}>
            <article className="bg-[hsl(var(--marketing-bg))] p-7 marketing-card-hover h-full">
              <div className="mono text-[10.5px] tracking-[0.18em] uppercase text-white/45">
                {it.tag}
              </div>
              <h3 className="mt-4 text-xl font-medium text-white">{it.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">{it.body}</p>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

function ApiBlock() {
  return (
    <Section
      id="api"
      index="02"
      eyebrow="The API"
      title="One endpoint per decision."
      description="No SDK lock-in. No proprietary identifiers. Auth with your bank-scoped key, score with the user's Klaro ID."
      className="hairline-b"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-stretch">
        <Stagger stagger={0.06} className="space-y-3">
          <StaggerItem>
            <EndpointRow
              method="GET"
              path="/v1/score/:user_id"
              note="Latest score, band, and signal breakdown for a single user."
            />
          </StaggerItem>
          <StaggerItem>
            <EndpointRow
              method="POST"
              path="/v1/score/batch"
              note="Bulk score up to 1,000 users in a single request."
            />
          </StaggerItem>
          <StaggerItem>
            <EndpointRow
              method="GET"
              path="/v1/users/:user_id/habits"
              note="Cash-flow habits, on-time ratio, income variance, debt-to-income."
            />
          </StaggerItem>
          <StaggerItem>
            <EndpointRow
              method="POST"
              path="/v1/webhooks"
              note="Register an HMAC-signed endpoint for score & KYC events."
            />
          </StaggerItem>
          <StaggerItem>
            <EndpointRow
              method="GET"
              path="/v1/usage"
              note="Per-key request counts, rate-limit headroom, and audit log."
            />
          </StaggerItem>
        </Stagger>

        <FadeIn delay={0.1}>
        <Terminal title="POST /v1/score/batch">
          <TerminalPrompt>
            curl -sX POST https://api.klaro.tn/v1/score/batch \
          </TerminalPrompt>
          {'\n'}
          {'     '}-H {'"'}Authorization: Bearer $KLARO_BANK_KEY{'"'} \{'\n'}
          {'     '}-H {'"'}Content-Type: application/json{'"'} \{'\n'}
          {'     '}-d {'\''}{'{'} <TerminalKey>&quot;user_ids&quot;</TerminalKey>: [<TerminalString>&quot;klr_7421&quot;</TerminalString>, <TerminalString>&quot;klr_7409&quot;</TerminalString>] {'}'}{'\''}
          {'\n'}
          {'\n'}
          {'{'}
          {'\n'}
          {'  '}<TerminalKey>&quot;results&quot;</TerminalKey>: [
          {'\n'}
          {'    '}{'{'}
          {'\n'}
          {'      '}<TerminalKey>&quot;user_id&quot;</TerminalKey>: <TerminalString>&quot;klr_7421&quot;</TerminalString>,
          {'\n'}
          {'      '}<TerminalKey>&quot;score&quot;</TerminalKey>: <TerminalNumber>712</TerminalNumber>,
          {'\n'}
          {'      '}<TerminalKey>&quot;band&quot;</TerminalKey>: <TerminalString>&quot;GOOD&quot;</TerminalString>,
          {'\n'}
          {'      '}<TerminalKey>&quot;habits&quot;</TerminalKey>: {'{'}
          {'\n'}
          {'        '}<TerminalKey>&quot;on_time_ratio&quot;</TerminalKey>: <TerminalNumber>0.94</TerminalNumber>,
          {'\n'}
          {'        '}<TerminalKey>&quot;cash_buffer_days&quot;</TerminalKey>: <TerminalNumber>23</TerminalNumber>,
          {'\n'}
          {'        '}<TerminalKey>&quot;debt_to_income&quot;</TerminalKey>: <TerminalNumber>0.31</TerminalNumber>
          {'\n'}
          {'      '}{'}'}
          {'\n'}
          {'    '}{'}'},
          {'\n'}
          {'    '}{'{'} <TerminalKey>&quot;user_id&quot;</TerminalKey>: <TerminalString>&quot;klr_7409&quot;</TerminalString>, <TerminalKey>&quot;score&quot;</TerminalKey>: <TerminalNumber>488</TerminalNumber>, <TerminalKey>&quot;band&quot;</TerminalKey>: <TerminalString>&quot;FAIR&quot;</TerminalString> {'}'}
          {'\n'}
          {'  '}]
          {'\n'}
          {'}'}
        </Terminal>
        </FadeIn>
      </div>
    </Section>
  );
}

function EndpointRow({
  method,
  path,
  note,
}: {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  note: string;
}) {
  return (
    <div className="hairline rounded-xl p-4 marketing-card-hover">
      <div className="flex items-center gap-3">
        <span
          className={`mono text-[10.5px] tracking-[0.16em] uppercase px-2 py-0.5 rounded ${
            method === 'POST' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-sky-500/10 text-sky-300'
          }`}
        >
          {method}
        </span>
        <span className="mono text-[13px] text-white">{path}</span>
      </div>
      <p className="mt-2 text-[13px] text-white/55 leading-relaxed">{note}</p>
    </div>
  );
}

function DashboardSurfaces() {
  const surfaces = [
    {
      title: 'Score distribution',
      desc: 'Histogram across your portfolio, with cohort filters by KYC date, region, and product.',
      mock: <DistributionMock />,
    },
    {
      title: 'Habit cohorts',
      desc: 'Slice users by habit signal — on-time ratio, cash buffer, income variance — and watch them move.',
      mock: <CohortMock />,
    },
    {
      title: 'Client lookup',
      desc: 'Per-client deep-dive: KYC, last 6 months of activity, signal explainer, score history.',
      mock: <ClientMock />,
    },
    {
      title: 'API keys & usage',
      desc: 'Issue scoped keys, monitor request volume, see rate-limit headroom and replay failed webhooks.',
      mock: <UsageMock />,
    },
  ];

  return (
    <Section
      index="03"
      eyebrow="The console"
      title="Built for credit teams. Not just engineers."
      description="The same data your API consumes, rendered for the analyst who has to defend the decision."
      className="hairline-b"
    >
      <Stagger
        stagger={0.08}
        className="grid gap-px bg-white/[0.06] hairline sm:grid-cols-2"
      >
        {surfaces.map((s) => (
          <StaggerItem key={s.title}>
            <article className="bg-[hsl(var(--marketing-bg))] p-6 marketing-card-hover space-y-4 h-full">
              <div>
                <h3 className="text-lg font-medium text-white">{s.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-white/55">{s.desc}</p>
              </div>
              <div className="hairline rounded-lg bg-white/[0.02] p-4">{s.mock}</div>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

function DistributionMock() {
  const bars = [3, 6, 11, 18, 26, 31, 27, 22, 16, 11, 7, 4];
  const max = Math.max(...bars);
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-16">
        {bars.map((v, i) => (
          <div
            key={i}
            className="flex-1 bg-white/55"
            style={{ height: `${(v / max) * 100}%`, minHeight: '3px' }}
          />
        ))}
      </div>
      <div className="flex justify-between mono text-[10px] text-white/35">
        <span>0</span>
        <span>500</span>
        <span>1000</span>
      </div>
    </div>
  );
}

function CohortMock() {
  const cohorts = [
    { label: 'High on-time · stable', pct: 42 },
    { label: 'Low buffer · improving', pct: 28 },
    { label: 'Variable income', pct: 18 },
    { label: 'High DTI · risk', pct: 12 },
  ];
  return (
    <div className="space-y-2">
      {cohorts.map((c) => (
        <div key={c.label} className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-white/65">{c.label}</span>
            <span className="mono text-white/45 tabular-nums">{c.pct}%</span>
          </div>
          <div className="h-1 w-full bg-white/8 overflow-hidden rounded-full">
            <div className="h-full bg-white/55" style={{ width: `${c.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientMock() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] text-white">M. Ben Salah</div>
          <div className="mono text-[10px] text-white/40">KLR-7421 · Tunis</div>
        </div>
        <div className="text-right">
          <div className="mono text-xl font-semibold text-white tabular-nums">712</div>
          <div className="mono text-[9px] tracking-[0.18em] text-emerald-300/85">
            GOOD · +12
          </div>
        </div>
      </div>
      <div className="flex items-end gap-0.5 h-8 hairline-t pt-2">
        {[3, 4, 4, 5, 5, 6, 6, 7, 7, 7, 8].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-white/45"
            style={{ height: `${(h / 8) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function UsageMock() {
  const rows = [
    { name: 'production', requests: '128.4k', limit: '500k', pct: 26 },
    { name: 'staging', requests: '14.2k', limit: '50k', pct: 28 },
  ];
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.name} className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="mono text-white/75">key_{r.name}</span>
            <span className="mono text-white/45 tabular-nums">
              {r.requests} / {r.limit}
            </span>
          </div>
          <div className="h-1 w-full bg-white/8 overflow-hidden rounded-full">
            <div className="h-full bg-white/55" style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ))}
      <div className="hairline-t pt-2 mono text-[10px] text-white/35">
        rate-limit · 60 rps · audit-logged
      </div>
    </div>
  );
}

function ComplianceStrip() {
  const items = [
    'Tunisia-resident data',
    'AES-256 at rest',
    'User-consented',
    'Audit-logged',
    'Postgres RLS',
    'Revocable scopes',
  ];
  return (
    <section className="hairline-b">
      <FadeIn className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="mono text-[11px] tracking-[0.2em] uppercase text-white/45">
            Compliance & data handling
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mono text-[12px] text-white/55">
            {items.map((it, i) => (
              <span key={it} className="flex items-center gap-3">
                {i !== 0 && <span className="text-white/15">/</span>}
                <span>{it}</span>
              </span>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function PricingTeaser() {
  return (
    <Section
      index="04"
      eyebrow="Pricing"
      title="Custom for the first design partners."
      description="The first three banks we onboard pay nothing for the first 12 months. We co-design the integration; you keep the dashboard."
      className="hairline-b"
    >
      <Stagger
        stagger={0.08}
        className="grid gap-px bg-white/[0.06] hairline sm:grid-cols-3"
      >
        <StaggerItem>
        <PriceCard
          tag="01"
          title="Pilot"
          price="Free"
          sub="First 12 months"
          bullets={[
            'Up to 10k scored users',
            'API + partner dashboard',
            'Direct Slack channel',
            'Co-designed integration',
          ]}
          cta="Apply as design partner"
          href={PARTNER_EMAIL}
          highlighted
        />
        </StaggerItem>
        <StaggerItem>
        <PriceCard
          tag="02"
          title="Growth"
          price="Custom"
          sub="Per-decision pricing"
          bullets={[
            'Unlimited scored users',
            'Webhook events',
            'SLA-backed uptime',
            'Quarterly model reviews',
          ]}
          cta="Talk to us"
          href={PARTNER_EMAIL}
        />
        </StaggerItem>
        <StaggerItem>
        <PriceCard
          tag="03"
          title="Enterprise"
          price="Annual"
          sub="On-prem option"
          bullets={[
            'On-prem ML sidecar',
            'Custom signal layers',
            'Dedicated infra',
            'Compliance reporting',
          ]}
          cta="Contact sales"
          href={PARTNER_EMAIL}
        />
        </StaggerItem>
      </Stagger>
    </Section>
  );
}

function PriceCard({
  tag,
  title,
  price,
  sub,
  bullets,
  cta,
  href,
  highlighted = false,
}: {
  tag: string;
  title: string;
  price: string;
  sub: string;
  bullets: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`bg-[hsl(var(--marketing-bg))] p-7 flex flex-col ${
        highlighted ? 'relative' : ''
      }`}
    >
      {highlighted && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-[hsl(var(--marketing-accent))]"
        />
      )}
      <div className="flex items-center justify-between">
        <span className="mono text-[10.5px] tracking-[0.18em] text-white/40">{tag}</span>
        {highlighted && (
          <span className="mono text-[10px] tracking-[0.18em] uppercase accent-text">
            Limited
          </span>
        )}
      </div>
      <h3 className="mt-4 text-xl font-medium text-white">{title}</h3>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-white">{price}</span>
        <span className="mono text-[11px] uppercase tracking-wider text-white/40">
          {sub}
        </span>
      </div>
      <ul className="mt-5 space-y-2 text-[13px] text-white/65">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mono text-white/30 mt-0.5">→</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <a
        href={href}
        className={`mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-medium ${
          highlighted ? 'btn-mark-primary' : 'btn-mark-ghost'
        }`}
      >
        {cta}
        <span aria-hidden>→</span>
      </a>
    </div>
  );
}

function PartnerCTA() {
  return (
    <section className="relative">
      <FadeIn className="mx-auto max-w-6xl px-6 py-24">
        <div className="hairline rounded-2xl p-10 sm:p-14 bg-white/[0.02] relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-24 -left-20 h-64 w-64 rounded-full bg-[hsl(var(--marketing-accent))] opacity-[0.07] blur-3xl"
          />
          <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-3">
              <span className="mono text-[10.5px] tracking-[0.2em] uppercase text-white/45">
                Design partner program
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                Underwrite the customers
                <br />
                <span className="text-white/45">the bureau forgot.</span>
              </h2>
              <p className="text-[14px] text-white/55 max-w-md leading-relaxed">
                Three slots open. Twelve months free. Your credit team, our pipeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={PARTNER_EMAIL}
                className="btn-mark-primary inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium"
              >
                Request API access
                <span aria-hidden>→</span>
              </a>
              <Link
                href="/"
                className="btn-mark-ghost inline-flex items-center gap-2 px-5 py-3 text-[14px] font-medium"
              >
                I&apos;m an end user
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
