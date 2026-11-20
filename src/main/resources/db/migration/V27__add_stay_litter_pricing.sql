CREATE TABLE litter_rates (
    id BIGINT NOT NULL PRIMARY KEY,
    litter_rate_per_kg DECIMAL(19,0) NULL,
    CONSTRAINT chk_litter_rate_id CHECK (id = 1),
    CONSTRAINT chk_litter_rate CHECK (litter_rate_per_kg IS NULL OR litter_rate_per_kg > 0)
);

INSERT INTO litter_rates (id, litter_rate_per_kg) VALUES (1, NULL);

ALTER TABLE stays ADD COLUMN retained_litter_rate_per_kg DECIMAL(19,0) NULL;
ALTER TABLE stays ADD CONSTRAINT chk_stays_litter_rate CHECK (retained_litter_rate_per_kg IS NULL OR retained_litter_rate_per_kg > 0);

ALTER TABLE stay_cat ADD COLUMN litter_choice VARCHAR(4) NOT NULL DEFAULT 'OWN';
ALTER TABLE stay_cat ADD CONSTRAINT chk_stay_cat_litter_choice CHECK (litter_choice IN ('OWN', 'HALF', 'ONE'));

ALTER TABLE stay_pricing_decisions ADD COLUMN litter_rate_per_kg DECIMAL(19,0) NULL;
ALTER TABLE stay_pricing_decisions ADD COLUMN litter_daily_half_kilos INT NOT NULL DEFAULT 0;
ALTER TABLE stay_pricing_decisions ADD COLUMN litter_choices TEXT NULL;
ALTER TABLE stay_pricing_decisions ADD CONSTRAINT chk_stay_pricing_litter_rate CHECK (litter_rate_per_kg IS NULL OR litter_rate_per_kg > 0);
ALTER TABLE stay_pricing_decisions ADD CONSTRAINT chk_stay_pricing_litter_quantity CHECK (
    litter_daily_half_kilos >= 0 AND (litter_daily_half_kilos = 0 OR litter_choices IS NOT NULL)
);

ALTER TABLE stay_agreed_amount_corrections ADD COLUMN litter_rate_per_kg DECIMAL(19,0) NULL;
ALTER TABLE stay_agreed_amount_corrections ADD COLUMN litter_choices TEXT NULL;
ALTER TABLE stay_agreed_amount_corrections ADD CONSTRAINT chk_stay_correction_litter_rate CHECK (litter_rate_per_kg IS NULL OR litter_rate_per_kg > 0);
