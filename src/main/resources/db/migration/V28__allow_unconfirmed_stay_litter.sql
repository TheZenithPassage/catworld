ALTER TABLE stay_cat MODIFY COLUMN litter_choice VARCHAR(4) NULL DEFAULT NULL;

-- V27 used OWN both for explicit choices and for its automatic fallback.
-- Before the first agreement, an ambiguous OWN can fall back to the current cat preference.
UPDATE stay_cat
SET litter_choice = NULL
WHERE litter_choice = 'OWN'
  AND EXISTS (
      SELECT 1 FROM stays s
      WHERE s.id = stay_cat.stay_id AND s.price_pending = TRUE
  )
  AND NOT EXISTS (
      SELECT 1 FROM stay_agreed_amount_corrections c
      WHERE c.stay_id = stay_cat.stay_id AND c.previous_agreed_amount IS NOT NULL
  );
