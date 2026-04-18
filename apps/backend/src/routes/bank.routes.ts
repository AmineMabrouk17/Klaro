import { Router } from 'express';
import { bankConsentUpdateSchema } from '@klaro/shared';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { supabaseAdmin } from '../services/supabase';
import { logger } from '../lib/logger';

export const bankRouter = Router();

bankRouter.use(requireAuth, requireRole('bank'));

bankRouter.get('/clients', async (req, res) => {
  const bankId = req.user!.id;

  // Fetch all users who have granted consent to this bank.
  const { data: consents, error: consentError } = await supabaseAdmin
    .from('bank_consents')
    .select('user_id, consent_scope, granted_at')
    .eq('bank_id', bankId)
    .eq('consent_granted', true);

  if (consentError) {
    return res.status(500).json({ error: 'Failed to fetch clients' });
  }
  if (!consents?.length) {
    return res.json([]);
  }

  const userIds = consents.map((c) => c.user_id);

  // Fetch profiles and latest scores in parallel.
  const [profilesResult, scoresResult] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, full_name').in('id', userIds),
    supabaseAdmin
      .from('credit_scores')
      .select('user_id, score, score_band, created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false }),
  ]);

  const profileMap = new Map(
    (profilesResult.data ?? []).map((p) => [p.id, p]),
  );

  // Deduplicate scores — keep only the latest per user.
  const latestScore = new Map<string, { score: number; score_band: string | null }>();
  for (const s of scoresResult.data ?? []) {
    if (!latestScore.has(s.user_id)) {
      latestScore.set(s.user_id, { score: s.score, score_band: s.score_band });
    }
  }

  const clients = userIds.map((uid) => {
    const profile = profileMap.get(uid);
    const score = latestScore.get(uid);
    const consent = consents.find((c) => c.user_id === uid);
    return {
      id: uid,
      name: profile?.full_name ?? 'Unknown',
      score: score?.score ?? null,
      scoreBand: score?.score_band ?? null,
      consentScope: consent?.consent_scope ?? [],
      grantedAt: consent?.granted_at ?? null,
    };
  });

  return res.json(clients);
});

bankRouter.get('/clients/:id', async (req, res) => {
  const bankId = req.user!.id;
  const clientId = req.params.id;

  // Verify consent exists.
  const { data: consent, error: consentError } = await supabaseAdmin
    .from('bank_consents')
    .select('consent_scope, granted_at')
    .eq('bank_id', bankId)
    .eq('user_id', clientId)
    .eq('consent_granted', true)
    .single();

  if (consentError || !consent) {
    return res.status(403).json({ error: 'Client has not granted consent' });
  }

  // Fetch profile + latest score.
  const [profileResult, scoreResult] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('id, full_name, occupation_category, kyc_status')
      .eq('id', clientId)
      .single(),
    supabaseAdmin
      .from('credit_scores')
      .select('score, score_band, risk_category, confidence, breakdown, flags, created_at')
      .eq('user_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return res.json({
    id: clientId,
    profile: profileResult.data ?? null,
    score: scoreResult.data ?? null,
    consentScope: consent.consent_scope,
    grantedAt: consent.granted_at,
  });
});

bankRouter.post('/consent', validate(bankConsentUpdateSchema), async (req, res) => {
  const { bankId, consentGranted, consentScope } = req.body as {
    bankId: string;
    consentGranted: boolean;
    consentScope: string[];
  };
  const userId = req.user!.id;

  const { error } = await supabaseAdmin.from('bank_consents').upsert(
    {
      user_id: userId,
      bank_id: bankId,
      consent_granted: consentGranted,
      consent_scope: consentScope,
      granted_at: consentGranted ? new Date().toISOString() : null,
      revoked_at: consentGranted ? null : new Date().toISOString(),
    },
    { onConflict: 'user_id, bank_id' },
  );

  if (error) {
    logger.error({ err: error, userId, bankId }, 'consent update failed');
    return res.status(500).json({ error: 'Failed to update consent' });
  }

  return res.json({ updated: true, consentGranted });
});
