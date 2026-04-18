import { getServerApi } from '@/lib/api.server';
import { requireRole } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreGauge } from '@/components/score/score-gauge';
import { ScoreBreakdown } from '@/components/score/score-breakdown';
import { API_ENDPOINTS } from '@klaro/shared';
import type { ScoreBreakdown as ScoreBreakdownType } from '@klaro/shared';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

interface ClientDetail {
  id: string;
  profile: {
    full_name: string;
    occupation_category: string | null;
    kyc_status: string;
  } | null;
  score: {
    score: number;
    score_band: string;
    risk_category: string;
    confidence: number;
    breakdown: Record<string, unknown>;
    flags: string[];
  } | null;
  consentScope: string[];
  grantedAt: string | null;
}

function mapBreakdown(raw: Record<string, unknown>): ScoreBreakdownType {
  return {
    income: raw.income_stability as number | undefined,
    paymentBehavior: raw.payment_behavior as number | undefined,
    debtSignals: raw.debt_signals as number | undefined,
    documentConsistency: raw.document_consistency as number | undefined,
    behavioralPatterns: raw.behavioral_patterns as number | undefined,
  };
}

export default async function BankClientDetailPage({ params }: Props) {
  await requireRole('bank');
  const { id } = await params;
  const api = await getServerApi();

  let client: ClientDetail;
  try {
    client = await api.get<ClientDetail>(API_ENDPOINTS.bank.client(id));
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 403 || status === 404) notFound();
    throw err;
  }

  const score = client.score;
  const profile = client.profile;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile?.full_name ?? `Client ${id.slice(0, 8)}`}
        </h1>
        <p className="text-sm text-muted-foreground">
          You see only what the user has consented to share.{' '}
          {client.grantedAt && (
            <span>Consent granted {new Date(client.grantedAt).toLocaleDateString()}.</span>
          )}
        </p>
      </div>

      {profile && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {profile.occupation_category && <span>Occupation: {profile.occupation_category}</span>}
          <span>KYC: {profile.kyc_status}</span>
        </div>
      )}

      {score ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Score</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ScoreGauge score={score.score} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreBreakdown breakdown={mapBreakdown(score.breakdown)} />
            </CardContent>
          </Card>

          {score.flags?.length > 0 && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Risk flags</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {score.flags.map((flag, i) => (
                    <li key={i}>• {flag}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No score yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This user has not generated a Klaro credit score yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
