'use client';

import Link from 'next/link';
import { useState } from 'react';
import { API_ENDPOINTS, TUNISIAN_BANKS } from '@klaro/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

type JobStatus = 'idle' | 'queued' | 'error';

interface BankState {
  status: JobStatus;
  jobId?: string;
  error?: string;
}

export default function ConnectBankPage() {
  const [bankStates, setBankStates] = useState<Record<string, BankState>>({});
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  function setBank(bankId: string, state: Partial<BankState>) {
    setBankStates((prev) => ({ ...prev, [bankId]: { ...prev[bankId], status: 'idle', ...state } }));
  }

  async function handleConnect(bankId: string, bankName: string) {
    if (!credentials.username || !credentials.password) return;
    setBank(bankId, { status: 'queued', error: undefined });
    setOpenDialog(null);
    try {
      const { jobId } = await api.post<{ jobId: string; status: string }>(
        API_ENDPOINTS.scrape.start,
        {
          bankName,
          connectionMethod: 'scraping',
          encryptedCredentials: JSON.stringify(credentials),
        },
      );
      setBank(bankId, { status: 'queued', jobId });
    } catch (err: unknown) {
      const body = (err as { body?: { error?: string } }).body;
      setBank(bankId, { status: 'error', error: body?.error ?? 'Connection failed' });
    } finally {
      setCredentials({ username: '', password: '' });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connect your bank</h1>
        <p className="text-sm text-muted-foreground">
          Pick your bank to fetch your transaction history. Credentials are encrypted in your
          browser before leaving your device.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TUNISIAN_BANKS.map((bank) => {
          const state = bankStates[bank.id];
          return (
            <Card key={bank.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{bank.shortName}</span>
                  {!bank.supported && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{bank.name}</p>

                {openDialog === bank.id && (
                  <div className="space-y-2 rounded-md border p-3">
                    <Input
                      placeholder="Username / ID"
                      value={credentials.username}
                      onChange={(e) => setCredentials((c) => ({ ...c, username: e.target.value }))}
                      autoComplete="username"
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={credentials.password}
                      onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))}
                      autoComplete="current-password"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleConnect(bank.id, bank.shortName)}
                        disabled={!credentials.username || !credentials.password}
                      >
                        Connect
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOpenDialog(null);
                          setCredentials({ username: '', password: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {state?.status === 'queued' && (
                  <p className="text-xs text-muted-foreground">
                    ✓ Connection queued{state.jobId ? ` (job: ${state.jobId.slice(0, 8)}…)` : ''}
                  </p>
                )}
                {state?.status === 'error' && (
                  <p className="text-xs text-destructive">{state.error}</p>
                )}

                {openDialog !== bank.id && state?.status !== 'queued' && (
                  <Button
                    disabled={!bank.supported}
                    variant={bank.supported ? 'default' : 'outline'}
                    onClick={() => bank.supported && setOpenDialog(bank.id)}
                  >
                    {bank.supported ? 'Connect' : 'Notify me'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prefer to upload statements?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Upload PDF statements, images, CSV exports, or payslips. Each file goes through
            deepfake detection, authenticity checks, and cross-consistency verification before
            transactions are imported.
          </p>
          <Link href="/documents">
            <Button variant="outline">Upload statement</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
