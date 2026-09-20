ALTER TABLE nightly_reference_rates
    DROP CONSTRAINT chk_nightly_reference_rates_category;
ALTER TABLE nightly_reference_rates
    ADD CONSTRAINT chk_nightly_reference_rates_category
        CHECK (category IN (
            'ONE_CAT',
            'ONE_CAT_7_TO_14',
            'ONE_CAT_15_TO_29',
            'ONE_CAT_30_PLUS',
            'TWO_CATS',
            'THREE_PLUS_CATS'
        ));

ALTER TABLE nightly_reference_rate_changes
    DROP CONSTRAINT chk_nightly_reference_rate_changes_category;
ALTER TABLE nightly_reference_rate_changes
    ADD CONSTRAINT chk_nightly_reference_rate_changes_category
        CHECK (category IN (
            'ONE_CAT',
            'ONE_CAT_7_TO_14',
            'ONE_CAT_15_TO_29',
            'ONE_CAT_30_PLUS',
            'TWO_CATS',
            'THREE_PLUS_CATS'
        ));

INSERT INTO nightly_reference_rates (category, nightly_rate, created_at, updated_at)
VALUES
    ('ONE_CAT_7_TO_14', NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('ONE_CAT_15_TO_29', NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('ONE_CAT_30_PLUS', NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
