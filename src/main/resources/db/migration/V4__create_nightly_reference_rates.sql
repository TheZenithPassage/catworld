CREATE TABLE nightly_reference_rates (
    category VARCHAR(20) NOT NULL,
    nightly_rate DECIMAL(19, 0) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (category),
    CONSTRAINT chk_nightly_reference_rates_category
        CHECK (category IN ('ONE_CAT', 'TWO_CATS', 'THREE_PLUS_CATS')),
    CONSTRAINT chk_nightly_reference_rates_positive
        CHECK (nightly_rate IS NULL OR nightly_rate > 0)
);

CREATE TABLE nightly_reference_rate_changes (
    id BINARY(16) NOT NULL,
    category VARCHAR(20) NOT NULL,
    previous_nightly_rate DECIMAL(19, 0) NULL,
    new_nightly_rate DECIMAL(19, 0) NULL,
    changed_by_id BINARY(16) NOT NULL,
    changed_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_nightly_reference_rate_changes_category
        CHECK (category IN ('ONE_CAT', 'TWO_CATS', 'THREE_PLUS_CATS')),
    CONSTRAINT chk_nightly_reference_rate_changes_previous_positive
        CHECK (previous_nightly_rate IS NULL OR previous_nightly_rate > 0),
    CONSTRAINT chk_nightly_reference_rate_changes_new_positive
        CHECK (new_nightly_rate IS NULL OR new_nightly_rate > 0),
    CONSTRAINT chk_nightly_reference_rate_changes_transition
        CHECK (
            (previous_nightly_rate IS NULL AND new_nightly_rate IS NOT NULL)
            OR (previous_nightly_rate IS NOT NULL AND new_nightly_rate IS NULL)
            OR (
                previous_nightly_rate IS NOT NULL
                AND new_nightly_rate IS NOT NULL
                AND previous_nightly_rate <> new_nightly_rate
            )
        ),
    CONSTRAINT fk_nightly_reference_rate_changes_actor
        FOREIGN KEY (changed_by_id) REFERENCES user_accounts (id)
);

INSERT INTO nightly_reference_rates (category, nightly_rate, created_at, updated_at)
VALUES
    ('ONE_CAT', NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('TWO_CATS', NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
    ('THREE_PLUS_CATS', NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
