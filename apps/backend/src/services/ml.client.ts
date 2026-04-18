import { env } from '../config/env';

export interface MLScoreInput {
  userId: string;
}

export interface MLScoreResult {
  score: number;
  band: string;
  riskCategory: string;
  confidence: number;
  breakdown: Record<string, number>;
  flags: string[];
  explanation: string;
  coachingTips: string[];
  dataSufficiency: number;
  modelVersion: string;
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${env.ML_BASE_URL}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new MLError(`ML call failed (${res.status})`, res.status, text);
    throw err;
  }
  const json = await res.json();
  // Map snake_case ML response to camelCase
  if (path === '/score') {
    return mapScoreResponse(json as Record<string, unknown>) as T;
  }
  return json as T;
}

function mapScoreResponse(raw: Record<string, unknown>): MLScoreResult {
  return {
    score: raw.score as number,
    band: raw.band as string,
    riskCategory: raw.risk_category as string,
    confidence: raw.confidence as number,
    breakdown: raw.breakdown as Record<string, number>,
    flags: (raw.flags ?? []) as string[],
    explanation: (raw.explanation ?? '') as string,
    coachingTips: (raw.coaching_tips ?? []) as string[],
    dataSufficiency: (raw.data_sufficiency ?? 1) as number,
    modelVersion: raw.model_version as string,
  };
}

export class MLError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = 'MLError';
  }
}

export const ml = {
  health: () => call<{ status: string }>('/health'),
  score: (input: MLScoreInput) => call<MLScoreResult>('/score', input),
  ocrExtract: (storagePath: string) =>
    call<{ fields: Record<string, string> }>('/ocr/extract', { storagePath }),
  livenessCheck: (storagePath: string) =>
    call<{ passed: boolean; confidence: number }>('/kyc/liveness', { storagePath }),
};
