import { Router } from 'express';
import { transactionListQuerySchema } from '@klaro/shared';
import type { TransactionListQuery } from '@klaro/shared';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { supabaseAdmin } from '../services/supabase';

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

transactionsRouter.get('/', validate(transactionListQuerySchema, 'query'), async (req, res) => {
  const userId = req.user!.id;
  const q = req.query as unknown as TransactionListQuery;

  let query = supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .limit(q.limit ?? 50);

  if (q.from) query = query.gte('transaction_date', q.from);
  if (q.to) query = query.lte('transaction_date', q.to);
  if (q.category) query = query.eq('category', q.category);
  if (q.bankConnectionId) query = query.eq('bank_connection_id', q.bankConnectionId);

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
  return res.json(data ?? []);
});
