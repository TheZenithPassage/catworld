ALTER TABLE stays
    ADD COLUMN price_pending BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE stays
    ADD CONSTRAINT chk_stays_pending_price
        CHECK (price_pending = FALSE OR agreed_amount IS NULL);

ALTER TABLE stay_agreed_amount_corrections
    DROP CONSTRAINT chk_stay_corrections_real_change;

ALTER TABLE stay_agreed_amount_corrections
    MODIFY COLUMN new_agreed_amount DECIMAL(19, 0) NULL;

ALTER TABLE stay_agreed_amount_corrections
    ADD CONSTRAINT chk_stay_corrections_real_change
        CHECK (
            (previous_agreed_amount IS NULL AND new_agreed_amount IS NOT NULL)
            OR (previous_agreed_amount IS NOT NULL AND new_agreed_amount IS NULL)
            OR (previous_agreed_amount IS NOT NULL AND new_agreed_amount IS NOT NULL
                AND previous_agreed_amount <> new_agreed_amount)
        );
