CREATE TABLE stay_payments (
    id BINARY(16) NOT NULL,
    stay_id BINARY(16) NOT NULL,
    amount DECIMAL(19, 0) NOT NULL,
    payment_date DATE NOT NULL,
    note TEXT NULL,
    annulled BOOLEAN NOT NULL DEFAULT FALSE,
    registered_by_id BINARY(16) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_stay_payments_amount
        CHECK (amount > 0),
    CONSTRAINT fk_stay_payments_stay
        FOREIGN KEY (stay_id) REFERENCES stays (id),
    CONSTRAINT fk_stay_payments_registrant
        FOREIGN KEY (registered_by_id) REFERENCES user_accounts (id)
);

CREATE INDEX idx_stay_payments_stay_active
    ON stay_payments (stay_id, annulled);

CREATE TABLE stay_payment_edits (
    id BINARY(16) NOT NULL,
    stay_id BINARY(16) NOT NULL,
    payment_id BINARY(16) NOT NULL,
    previous_amount DECIMAL(19, 0) NOT NULL,
    new_amount DECIMAL(19, 0) NOT NULL,
    edited_by_id BINARY(16) NOT NULL,
    edited_at DATETIME(6) NOT NULL,
    reason TEXT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_stay_payment_edits_previous_amount
        CHECK (previous_amount > 0),
    CONSTRAINT chk_stay_payment_edits_new_amount
        CHECK (new_amount > 0),
    CONSTRAINT chk_stay_payment_edits_real_change
        CHECK (previous_amount <> new_amount),
    CONSTRAINT chk_stay_payment_edits_reason
        CHECK (CHAR_LENGTH(TRIM(reason)) > 0),
    CONSTRAINT fk_stay_payment_edits_actor
        FOREIGN KEY (edited_by_id) REFERENCES user_accounts (id)
);

CREATE INDEX idx_stay_payment_edits_stay_id
    ON stay_payment_edits (stay_id);

CREATE INDEX idx_stay_payment_edits_payment_id
    ON stay_payment_edits (payment_id);

CREATE TABLE stay_payment_annulments (
    id BINARY(16) NOT NULL,
    stay_id BINARY(16) NOT NULL,
    payment_id BINARY(16) NOT NULL,
    annulled_by_id BINARY(16) NOT NULL,
    annulled_at DATETIME(6) NOT NULL,
    reason TEXT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_stay_payment_annulments_payment
        UNIQUE (payment_id),
    CONSTRAINT chk_stay_payment_annulments_reason
        CHECK (CHAR_LENGTH(TRIM(reason)) > 0),
    CONSTRAINT fk_stay_payment_annulments_actor
        FOREIGN KEY (annulled_by_id) REFERENCES user_accounts (id)
);

CREATE INDEX idx_stay_payment_annulments_stay_id
    ON stay_payment_annulments (stay_id);
