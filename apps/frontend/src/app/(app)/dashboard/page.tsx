import { getServerApi } from '@/lib/api.server';
import { requireUser } from '@/lib/auth';
import { ScoreDashboardClient } from '@/components/score/score-dashboard-client';

export default async function DashboardPage() {
  const user = await requireUser();
  const api = await getServerApi();

  let initialScore = null;
  try {
    initialScore = await api.get('/api/score/current');
  } catch (err: unknown) {
    // 404 = no score yet — that's expected for new users.
    const status = (err as { status?: number }).status;
    if (status !== 404) {
      throw err;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your Klaro score</h1>
        <p className="text-sm text-muted-foreground">
          Powered by your KYC, bank activity, and payment behavior.
        </p>
      </div>

      <ScoreDashboardClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialScore={initialScore as any}
        userId={user.id}
      />
    </div>
  );
}
