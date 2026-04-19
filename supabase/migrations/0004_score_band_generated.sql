-- =============================================================================
-- Klaro — convert score_band to a generated column
-- =============================================================================

-- Drop the plain nullable column (had a CHECK constraint baked in)
ALTER TABLE public.credit_scores DROP COLUMN score_band;

-- Re-add as GENERATED ALWAYS AS stored column derived from score
ALTER TABLE public.credit_scores
  ADD COLUMN score_band text
  GENERATED ALWAYS AS (
    CASE
      WHEN score >= 850 THEN 'EXCELLENT'
      WHEN score >= 750 THEN 'VERY_GOOD'
      WHEN score >= 600 THEN 'GOOD'
      WHEN score >= 400 THEN 'FAIR'
      ELSE 'POOR'
    END
  ) STORED;
