import { env } from '../config/env';

export interface MLScoreInput {
  userId: string;
  features: Record<string, unknown>;
}

export interface MLScoreResult {
  score: number;
  band: string;
  breakdown: Record<string, number>;
  flags: string[];
  recommendations: string[];
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${env.ML_BASE_URL}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`ML call failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Statement processing types
// ---------------------------------------------------------------------------

export interface RawTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category?: string;
}

export interface CoherenceFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detail: string;
  evidence?: Record<string, unknown>;
}

export interface AnomalySignal {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detail: string;
  evidence?: Record<string, unknown>;
}

export interface LayerDeepfake {
  passed: boolean;
  confidence: number;
  signals: string[];
}

export interface LayerAuthenticity {
  passed: boolean;
  score: number;
  failed_rules: string[];
}

export interface LayerConsistency {
  passed: boolean;
  coherence_score: number;
  flags: CoherenceFlag[];
  web_checks: Array<{ query: string; finding: string; passed: boolean }>;
}

export interface StatementVerification {
  passed: boolean;
  failed_layer: 'deepfake' | 'authenticity' | 'consistency' | null;
  layers: {
    deepfake: LayerDeepfake;
    authenticity: LayerAuthenticity;
    consistency: LayerConsistency;
  };
}

export interface StatementAnomalies {
  anomaly_score: number;
  flagged: boolean;
  signals: AnomalySignal[];
}

export interface StatementProcessResult {
  extraction: { transactions: RawTransaction[] };
  verification: StatementVerification;
  anomalies: StatementAnomalies;
}

export interface UserContext {
  fullName: string;
  occupationCategory: string | null;
  kycStatus: string;
  locationGovernorate: string | null;
  kycDocuments: Array<{ type: string; status: string }>;
  priorStatements: Array<{ fileName: string; uploadedAt: string }>;
}

export const ml = {
  health: () => call<{ status: string }>('/health'),
  score: (input: MLScoreInput) => call<MLScoreResult>('/score', input),
  ocrExtract: (storagePath: string) =>
    call<{ fields: Record<string, string> }>('/ocr/extract', { storagePath }),
  livenessCheck: (storagePath: string) =>
    call<{ passed: boolean; confidence: number }>('/kyc/liveness', { storagePath }),
  statementProcess: (storagePath: string, mimeType: string, userContext: UserContext) =>
    call<StatementProcessResult>('/statements/process', { storagePath, mimeType, userContext }),
};
