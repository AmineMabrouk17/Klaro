'use client';

import Link from 'next/link';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_ENDPOINTS, TUNISIAN_BANKS } from '@klaro/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';

type JobStatus = 'idle' | 'queued' | 'running' | 'otp_required' | 'success' | 'failed' | 'error';

interface BankState {
  status: JobStatus;
  jobId?: string;
  error?: string;
}

/** Banks that use OTP-based login (Playwright flow with mid-session pause). */
const OTP_BANKS = new Set(['ubci']);

const POLL_INTERVAL_MS = 2_000;
const STORAGE_KEY = 'klaro:connected-banks';

/** Read the set of bank IDs that were previously connected from localStorage. */
function loadConnectedBanks(): Record<string, BankState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Persist only the 'success' states so credentials/job data never reach disk. */
function saveConnectedBanks(states: Record<string, BankState>) {
  try {
    const toSave: Record<string, BankState> = {};
    for (const [id, state] of Object.entries(states)) {
      if (state.status === 'success') toSave[id] = { status: 'success' };
    }
    if (Object.keys(toSave).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable — fail silently
  }
}

export default function ConnectBankPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromOnboarding = searchParams.get('from') === 'onboarding';

  // Start empty on both server and client to avoid SSR/hydration mismatch.
  // localStorage is read in a useEffect (client-only) after first render.
  const [bankStates, setBankStates] = useState<Record<string, BankState>>({});

  // Inline-expand state for non-OTP banks
  const [openInline, setOpenInline] = useState<string | null>(null);

  // Modal state for OTP banks (e.g. UBCI)
  const [modalBank, setModalBank] = useState<string | null>(null);
  const [modalStep, setModalStep] = useState<'credentials' | 'otp'>('credentials');

  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [otp, setOtp] = useState('');
  const [anyQueued, setAnyQueued] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate from localStorage once on mount (client-only)
  useEffect(() => {
    const saved = loadConnectedBanks();
    if (Object.keys(saved).length > 0) {
      setBankStates(saved);
    }
  }, []);

  // Persist successful connections to localStorage whenever states change
  useEffect(() => {
    saveConnectedBanks(bankStates);
  }, [bankStates]);

  function setBank(bankId: string, state: Partial<BankState>) {
    setBankStates((prev) => ({ ...prev, [bankId]: { ...prev[bankId], status: 'idle', ...state } }));
  }

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (bankId: string, jobId: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const { status, error } = await api.get<{ jobId: string; status: string; error?: string }>(
            API_ENDPOINTS.scrape.status(jobId),
          );

          if (status === 'otp_required') {
            setBank(bankId, { status: 'otp_required', jobId });
            setModalStep('otp');
            // Keep modal open – don't stop polling yet
          } else if (status === 'success') {
            setBank(bankId, { status: 'success', jobId });
            stopPolling();
            setModalBank(null);
          } else if (status === 'failed') {
            setBank(bankId, { status: 'failed', jobId, error: error ?? 'Connection failed' });
            stopPolling();
            setModalBank(null);
          }
          // 'queued' / 'running' → keep polling
        } catch {
          // Network blip – keep polling
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  // ── Non-OTP banks (inline form) ────────────────────────────────────────────

  async function handleConnect(bankId: string) {
    if (!credentials.username || !credentials.password) return;
    setBank(bankId, { status: 'queued', error: undefined });
    setOpenInline(null);
    try {
      const { jobId } = await api.post<{ jobId: string; status: string }>(
        API_ENDPOINTS.scrape.start,
        {
          bankName: bankId,
          connectionMethod: 'scraping',
          encryptedCredentials: JSON.stringify(credentials),
        },
      );
      setBank(bankId, { status: 'queued', jobId });
      setAnyQueued(true);
    } catch (err: unknown) {
      const body = (err as { body?: { error?: string } }).body;
      setBank(bankId, { status: 'error', error: body?.error ?? 'Connection failed' });
    } finally {
      setCredentials({ username: '', password: '' });
    }
  }

  // ── OTP banks (modal flow) ─────────────────────────────────────────────────

  async function handleOtpBankConnect(bankId: string) {
    if (!credentials.username || !credentials.password) return;
    setBank(bankId, { status: 'queued', error: undefined });
    try {
      const { jobId } = await api.post<{ jobId: string; status: string }>(
        API_ENDPOINTS.scrape.start,
        {
          bankName: bankId,
          connectionMethod: 'scraping',
          encryptedCredentials: JSON.stringify(credentials),
        },
      );
      setBank(bankId, { status: 'running', jobId });
      setAnyQueued(true);
      startPolling(bankId, jobId);
      // Keep modal open – it will transition to OTP step when polling detects otp_required
    } catch (err: unknown) {
      const body = (err as { body?: { error?: string } }).body;
      setBank(bankId, { status: 'error', error: body?.error ?? 'Connection failed' });
      setModalBank(null);
    } finally {
      setCredentials({ username: '', password: '' });
    }
  }

  async function handleOtpSubmit(bankId: string) {
    if (!otp.trim()) return;
    const jobId = bankStates[bankId]?.jobId;
    if (!jobId) return;
    try {
      await api.post<{ jobId: string; status: string }>(
        API_ENDPOINTS.scrape.submitOtp(jobId),
        { otp: otp.trim() },
      );
      setBank(bankId, { status: 'running', jobId });
      setOtp('');
      // Polling continues – will detect 'success' or 'failed'
    } catch (err: unknown) {
      const body = (err as { body?: { error?: string } }).body;
      setBank(bankId, { status: 'error', error: body?.error ?? 'Invalid OTP' });
      setModalBank(null);
      stopPolling();
    }
  }

  function openOtpModal(bankId: string) {
    setModalBank(bankId);
    setModalStep('credentials');
    setCredentials({ username: '', password: '' });
    setOtp('');
  }

  function closeOtpModal() {
    setModalBank(null);
    setCredentials({ username: '', password: '' });
    setOtp('');
    stopPolling();
  }

  function disconnect(bankId: string) {
    setBankStates((prev) => {
      const next = { ...prev };
      delete next[bankId];
      return next;
    });
  }

  // ── Derived helpers ────────────────────────────────────────────────────────

  function statusLabel(status: JobStatus | undefined) {
    switch (status) {
      case 'queued':
      case 'running':
        return 'Connecting…';
      case 'otp_required':
        return 'Waiting for OTP…';
      case 'success':
        return '✓ Connected';
      case 'failed':
      case 'error':
        return null; // shown via error message
      default:
        return null;
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Post-connect continue CTA */}
      {fromOnboarding && anyQueued && (
        <div className="glass-card-strong p-4 flex items-center gap-3 border border-green-500/25">
          <span className="text-2xl shrink-0">✅</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">Bank connection queued!</p>
            <p className="text-xs text-white/45">We&apos;re syncing your data in the background</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white btn-glow transition-all"
          >
            Continue →
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-1 py-2">
        <div className="text-5xl mb-2">🏦</div>
        <h1 className="text-xl font-bold text-white">Connect your bank</h1>
        <p className="text-sm text-white/40">
          Encrypted in your browser before sending 🔒
        </p>
      </div>

      {/* Bank grid */}
      <div className="space-y-3">
        {TUNISIAN_BANKS.map((bank) => {
          const state = bankStates[bank.id];
          const isOtpBank = OTP_BANKS.has(bank.id);
          const busy =
            state?.status === 'queued' || state?.status === 'running' || state?.status === 'otp_required';
          const isOpen = openInline === bank.id;
          const queued = state?.status === 'queued';

          return (
            <div
              key={bank.id}
              className={`glass-card p-4 transition-all ${queued ? 'border-green-500/30' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/8 flex items-center justify-center text-xl font-bold text-white/60 shrink-0">
                  {bank.shortName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white text-sm truncate">{bank.shortName}</p>
                        {!bank.supported && (
                          <span className="text-[9px] font-semibold uppercase tracking-wide bg-white/8 text-white/40 px-1.5 py-0.5 rounded-full shrink-0">
                            Soon
                          </span>
                        )}
                        {queued && (
                          <span className="text-[9px] font-semibold uppercase tracking-wide bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full shrink-0">
                            ✓ Queued
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/35 truncate">{bank.name}</p>
                    </div>
                    {!isOpen && !busy && state?.status !== 'success' && (
                      <button
                        type="button"
                        disabled={!bank.supported}
                        onClick={() => {
                          if (!bank.supported) return;
                          if (isOtpBank) {
                            openOtpModal(bank.id);
                          } else {
                            setOpenInline(bank.id);
                          }
                        }}
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                          bank.supported
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white btn-glow'
                            : 'bg-white/5 text-white/25 cursor-not-allowed'
                        }`}
                      >
                        {bank.supported ? 'Connect' : 'Soon'}
                      </button>
                    )}
                  </div>

                  {busy && !isOtpBank && (
                    <p className="text-xs text-white/50">
                      {statusLabel(state?.status)}
                      {state?.jobId ? ` (${state.jobId.slice(0, 8)}…)` : ''}
                    </p>
                  )}
                  {state?.status === 'success' && (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-green-400">✓ Connected</p>
                      <button
                        type="button"
                        className="text-xs text-red-400/90 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-white/5"
                        onClick={() => disconnect(bank.id)}
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                  {(state?.status === 'error' || state?.status === 'failed') && (
                    <p className="text-xs text-red-400">{state.error}</p>
                  )}

                  {isOtpBank && busy && (
                    <p className="text-xs text-white/50">{statusLabel(state?.status)}</p>
                  )}
                </div>
              </div>

              {/* Inline credential form – non-OTP banks only */}
              {!isOtpBank && isOpen && (
                <div className="mt-4 pt-4 border-t border-white/8 space-y-3">
                  <Input
                    placeholder="Username / ID"
                    value={credentials.username}
                    onChange={(e) => setCredentials((c) => ({ ...c, username: e.target.value }))}
                    autoComplete="username"
                    className="glass border-white/10 bg-white/5 text-white placeholder:text-white/25 h-11 rounded-xl"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))}
                    autoComplete="current-password"
                    className="glass border-white/10 bg-white/5 text-white placeholder:text-white/25 h-11 rounded-xl"
                  />
                  {state?.status === 'error' && (
                    <p className="text-xs text-red-400">⚠️ {state.error}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white btn-glow"
                      onClick={() => handleConnect(bank.id)}
                      disabled={!credentials.username || !credentials.password}
                    >
                      Connect 🔗
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 rounded-xl text-white/50 hover:text-white hover:bg-white/8"
                      onClick={() => {
                        setOpenInline(null);
                        setCredentials({ username: '', password: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* UBCI (OTP-bank) modal */}
      {modalBank && OTP_BANKS.has(modalBank) && (() => {
        const bank = TUNISIAN_BANKS.find((b) => b.id === modalBank)!;
        const state = bankStates[modalBank];
        const submitting = state?.status === 'running' || state?.status === 'queued';

        return (
          <Dialog open onOpenChange={(open) => { if (!open) closeOtpModal(); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect to {bank.shortName}</DialogTitle>
                <DialogDescription>
                  {modalStep === 'credentials'
                    ? 'Enter your online banking credentials. They are used only to connect and are never stored.'
                    : 'A one-time code has been sent to your registered phone or email. Enter it below to continue.'}
                </DialogDescription>
              </DialogHeader>

              {modalStep === 'credentials' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ubci-username">Identifiant Utilisateur</Label>
                    <Input
                      id="ubci-username"
                      placeholder="Identifiant Utilisateur"
                      value={credentials.username}
                      onChange={(e) => setCredentials((c) => ({ ...c, username: e.target.value }))}
                      autoComplete="username"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ubci-password">Mot de passe</Label>
                    <Input
                      id="ubci-password"
                      type="password"
                      placeholder="Mot de passe"
                      value={credentials.password}
                      onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))}
                      autoComplete="current-password"
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}

              {modalStep === 'otp' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ubci-otp">Code de vérification (OTP)</Label>
                    <Input
                      id="ubci-otp"
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      maxLength={10}
                      disabled={submitting}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Check your SMS or email for the code sent by UBCI.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={closeOtpModal} disabled={submitting}>
                  Cancel
                </Button>

                {modalStep === 'credentials' && (
                  <Button
                    onClick={() => handleOtpBankConnect(modalBank)}
                    disabled={!credentials.username || !credentials.password || submitting}
                  >
                    {submitting ? 'Connecting…' : 'Connect'}
                  </Button>
                )}

                {modalStep === 'otp' && (
                  <Button
                    onClick={() => handleOtpSubmit(modalBank)}
                    disabled={!otp.trim() || submitting}
                  >
                    {submitting ? 'Verifying…' : 'Verify'}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Prefer documents */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <div>
            <p className="font-semibold text-white text-sm">Prefer to upload statements?</p>
            <p className="text-xs text-white/40">PDFs, images, CSVs — all verified 🔍</p>
          </div>
        </div>
        <Link href="/documents">
          <button
            type="button"
            className="w-full h-11 rounded-xl glass border-white/15 text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-all"
          >
            Upload documents →
          </button>
        </Link>
      </div>
    </div>
  );
}
