CREATE TABLE sensitive_stay_contexts (
    id BINARY(16) NOT NULL,
    stay_id BINARY(16) NOT NULL,
    owner_id BINARY(16) NOT NULL,
    owner_full_name VARCHAR(255) NOT NULL,
    stay_start_at DATETIME(6) NOT NULL,
    stay_end_at DATETIME(6) NOT NULL,
    stay_cancelled_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_sensitive_stay_contexts_owner_name
        CHECK (CHAR_LENGTH(TRIM(owner_full_name)) > 0),
    CONSTRAINT chk_sensitive_stay_contexts_dates
        CHECK (stay_end_at > stay_start_at)
);

CREATE INDEX idx_sensitive_stay_contexts_stay_id
    ON sensitive_stay_contexts (stay_id);

CREATE INDEX idx_sensitive_stay_contexts_owner_id
    ON sensitive_stay_contexts (owner_id);

CREATE TABLE sensitive_stay_context_cats (
    context_id BINARY(16) NOT NULL,
    cat_id BINARY(16) NOT NULL,
    cat_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (context_id, cat_id),
    CONSTRAINT chk_sensitive_context_cats_name
        CHECK (CHAR_LENGTH(TRIM(cat_name)) > 0),
    CONSTRAINT fk_sensitive_context_cats_context
        FOREIGN KEY (context_id) REFERENCES sensitive_stay_contexts (id)
);

CREATE INDEX idx_sensitive_context_cats_cat_id
    ON sensitive_stay_context_cats (cat_id);

ALTER TABLE stay_pricing_decisions
    ADD COLUMN sensitive_context_id BINARY(16) NULL;

ALTER TABLE stay_pricing_decisions
    ADD CONSTRAINT uk_stay_pricing_decisions_sensitive_context
        UNIQUE (sensitive_context_id);

ALTER TABLE stay_pricing_decisions
    ADD CONSTRAINT fk_stay_pricing_decisions_sensitive_context
        FOREIGN KEY (sensitive_context_id) REFERENCES sensitive_stay_contexts (id);

ALTER TABLE stay_agreed_amount_corrections
    ADD COLUMN sensitive_context_id BINARY(16) NULL;

ALTER TABLE stay_agreed_amount_corrections
    ADD CONSTRAINT uk_stay_corrections_sensitive_context
        UNIQUE (sensitive_context_id);

ALTER TABLE stay_agreed_amount_corrections
    ADD CONSTRAINT fk_stay_corrections_sensitive_context
        FOREIGN KEY (sensitive_context_id) REFERENCES sensitive_stay_contexts (id);

ALTER TABLE stay_payment_edits
    ADD COLUMN sensitive_context_id BINARY(16) NULL;

ALTER TABLE stay_payment_edits
    ADD COLUMN payment_date DATE NULL;

ALTER TABLE stay_payment_edits
    ADD COLUMN payment_note TEXT NULL;

ALTER TABLE stay_payment_edits
    ADD COLUMN registered_by_id BINARY(16) NULL;

ALTER TABLE stay_payment_edits
    ADD COLUMN registered_at DATETIME(6) NULL;

ALTER TABLE stay_payment_edits
    ADD CONSTRAINT uk_stay_payment_edits_sensitive_context
        UNIQUE (sensitive_context_id);

ALTER TABLE stay_payment_edits
    ADD CONSTRAINT chk_stay_payment_edits_sensitive_snapshot
        CHECK (
            sensitive_context_id IS NULL
            OR (
                payment_date IS NOT NULL
                AND registered_by_id IS NOT NULL
                AND registered_at IS NOT NULL
            )
        );

ALTER TABLE stay_payment_edits
    ADD CONSTRAINT fk_stay_payment_edits_sensitive_context
        FOREIGN KEY (sensitive_context_id) REFERENCES sensitive_stay_contexts (id);

ALTER TABLE stay_payment_edits
    ADD CONSTRAINT fk_stay_payment_edits_registrant
        FOREIGN KEY (registered_by_id) REFERENCES user_accounts (id);

ALTER TABLE stay_payment_annulments
    ADD COLUMN sensitive_context_id BINARY(16) NULL;

ALTER TABLE stay_payment_annulments
    ADD COLUMN amount DECIMAL(19, 0) NULL;

ALTER TABLE stay_payment_annulments
    ADD COLUMN payment_date DATE NULL;

ALTER TABLE stay_payment_annulments
    ADD COLUMN payment_note TEXT NULL;

ALTER TABLE stay_payment_annulments
    ADD COLUMN registered_by_id BINARY(16) NULL;

ALTER TABLE stay_payment_annulments
    ADD COLUMN registered_at DATETIME(6) NULL;

ALTER TABLE stay_payment_annulments
    ADD CONSTRAINT uk_stay_payment_annulments_sensitive_context
        UNIQUE (sensitive_context_id);

ALTER TABLE stay_payment_annulments
    ADD CONSTRAINT chk_stay_payment_annulments_amount
        CHECK (amount IS NULL OR amount > 0);

ALTER TABLE stay_payment_annulments
    ADD CONSTRAINT chk_stay_payment_annulments_sensitive_snapshot
        CHECK (
            sensitive_context_id IS NULL
            OR (
                amount IS NOT NULL
                AND payment_date IS NOT NULL
                AND registered_by_id IS NOT NULL
                AND registered_at IS NOT NULL
            )
        );

ALTER TABLE stay_payment_annulments
    ADD CONSTRAINT fk_stay_payment_annulments_sensitive_context
        FOREIGN KEY (sensitive_context_id) REFERENCES sensitive_stay_contexts (id);

ALTER TABLE stay_payment_annulments
    ADD CONSTRAINT fk_stay_payment_annulments_registrant
        FOREIGN KEY (registered_by_id) REFERENCES user_accounts (id);

CREATE TABLE stay_payment_removals (
    id BINARY(16) NOT NULL,
    sensitive_context_id BINARY(16) NOT NULL,
    stay_id BINARY(16) NOT NULL,
    payment_id BINARY(16) NOT NULL,
    amount DECIMAL(19, 0) NOT NULL,
    payment_date DATE NOT NULL,
    payment_note TEXT NULL,
    annulled BOOLEAN NOT NULL,
    registered_by_id BINARY(16) NOT NULL,
    registered_at DATETIME(6) NOT NULL,
    removed_by_id BINARY(16) NOT NULL,
    removed_at DATETIME(6) NOT NULL,
    reason TEXT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_stay_payment_removals_context
        UNIQUE (sensitive_context_id),
    CONSTRAINT uk_stay_payment_removals_payment
        UNIQUE (payment_id),
    CONSTRAINT chk_stay_payment_removals_amount
        CHECK (amount > 0),
    CONSTRAINT chk_stay_payment_removals_reason
        CHECK (CHAR_LENGTH(TRIM(reason)) > 0),
    CONSTRAINT fk_stay_payment_removals_context
        FOREIGN KEY (sensitive_context_id) REFERENCES sensitive_stay_contexts (id),
    CONSTRAINT fk_stay_payment_removals_registrant
        FOREIGN KEY (registered_by_id) REFERENCES user_accounts (id),
    CONSTRAINT fk_stay_payment_removals_actor
        FOREIGN KEY (removed_by_id) REFERENCES user_accounts (id)
);

CREATE INDEX idx_stay_payment_removals_stay_id
    ON stay_payment_removals (stay_id);

CREATE INDEX idx_stay_payment_removals_removed_at
    ON stay_payment_removals (removed_at);

CREATE INDEX idx_nightly_rate_changes_activity
    ON nightly_reference_rate_changes (changed_at, changed_by_id);

CREATE INDEX idx_stay_pricing_decisions_activity
    ON stay_pricing_decisions (decided_at, decided_by_id);

CREATE INDEX idx_stay_corrections_activity
    ON stay_agreed_amount_corrections (decided_at, decided_by_id);

CREATE INDEX idx_stay_payment_edits_activity
    ON stay_payment_edits (edited_at, edited_by_id);

CREATE INDEX idx_stay_payment_annulments_activity
    ON stay_payment_annulments (annulled_at, annulled_by_id);
