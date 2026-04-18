import Link from 'next/link';
import { getServerApi } from '@/lib/api.server';
import { requireRole } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_ENDPOINTS } from '@klaro/shared';

interface Client {
  id: string;
  name: string;
  score: number | null;
  scoreBand: string | null;
  grantedAt: string | null;
}

export default async function BankClientsPage() {
  await requireRole('bank');
  const api = await getServerApi();

  let clients: Client[] = [];
  try {
    clients = await api.get<Client[]>(API_ENDPOINTS.bank.clients);
  } catch {
    clients = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="text-sm text-muted-foreground">
          Users who have granted your institution score visibility.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {clients.length > 0
              ? `${clients.length} consented user${clients.length === 1 ? '' : 's'}`
              : 'No consented users yet'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Users will appear here once they grant your institution access to their score.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Score</th>
                  <th className="pb-2 font-medium">Band</th>
                  <th className="pb-2 font-medium">Granted</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3">{c.name}</td>
                    <td className="py-3 tabular-nums">{c.score ?? '—'}</td>
                    <td className="py-3">{c.scoreBand ?? '—'}</td>
                    <td className="py-3 text-muted-foreground">
                      {c.grantedAt ? new Date(c.grantedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/bank/clients/${c.id}`}
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
