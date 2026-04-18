import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { supabaseAdmin } from '../services/supabase';
import { logger } from '../lib/logger';

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

// Frontend uploads the file directly to Supabase Storage, then registers metadata here.
const uploadBodySchema = z.object({
  storagePath: z.string().min(1),
  documentType: z.enum(['cin', 'passport', 'driver_license', 'proof_of_address']),
  fileName: z.string().min(1),
});

documentsRouter.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('kyc_documents')
    .select('id, document_type, storage_path, verification_status, created_at, ocr_data')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
  return res.json(data ?? []);
});

documentsRouter.post('/upload', validate(uploadBodySchema), async (req, res) => {
  const userId = req.user!.id;
  const { storagePath, documentType, fileName } = req.body as z.infer<typeof uploadBodySchema>;

  // Use storage path as a stable hash proxy to prevent duplicate registrations.
  const documentHash = Buffer.from(`${userId}:${storagePath}`).toString('base64').slice(0, 64);

  const { data, error } = await supabaseAdmin
    .from('kyc_documents')
    .insert({
      user_id: userId,
      document_type: documentType,
      storage_path: storagePath,
      document_hash: documentHash,
    })
    .select('id, document_type, storage_path, verification_status, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Document already registered' });
    }
    logger.error({ err: error, userId, fileName }, 'document registration failed');
    return res.status(500).json({ error: 'Failed to register document' });
  }

  return res.status(201).json(data);
});

documentsRouter.delete('/:id', async (req, res) => {
  const userId = req.user!.id;
  const documentId = req.params.id;

  // Fetch storage path before deleting the DB row so we can remove the file too.
  const { data: doc, error: fetchError } = await supabaseAdmin
    .from('kyc_documents')
    .select('storage_path')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const { error: dbError } = await supabaseAdmin
    .from('kyc_documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', userId);

  if (dbError) {
    return res.status(500).json({ error: 'Failed to delete document' });
  }

  // Best-effort Storage cleanup — don't fail the request if removal errors.
  const bucket = doc.storage_path.split('/')[0] ?? 'documents';
  const filePath = doc.storage_path.split('/').slice(1).join('/');
  supabaseAdmin.storage.from(bucket).remove([filePath]).catch((e) => {
    logger.warn({ err: e, documentId }, 'storage cleanup failed');
  });

  return res.json({ id: documentId, deleted: true });
});
