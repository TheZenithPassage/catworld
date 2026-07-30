CREATE TABLE stay_agreed_amount_corrections (
    id BINARY(16) NOT NULL,
    stay_id BINARY(16) NOT NULL,
    previous_agreed_amount DECIMAL(19, 0) NULL,
    new_agreed_amount DECIMAL(19, 0) NOT NULL,
    decided_by_id BINARY(16) NOT NULL,
    decided_at DATETIME(6) NOT NULL,
    reason TEXT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_stay_corrections_previous_agreed
        CHECK (previous_agreed_amount IS NULL OR previous_agreed_amount >= 0),
    CONSTRAINT chk_stay_corrections_new_agreed
        CHECK (new_agreed_amount >= 0),
    CONSTRAINT chk_stay_corrections_real_change
        CHECK (
            previous_agreed_amount IS NULL
            OR previous_agreed_amount <> new_agreed_amount
        ),
    CONSTRAINT chk_stay_corrections_reason
        CHECK (CHAR_LENGTH(TRIM(reason)) > 0),
    CONSTRAINT fk_stay_corrections_actor
        FOREIGN KEY (decided_by_id) REFERENCES user_accounts (id)
);

CREATE INDEX idx_stay_agreed_amount_corrections_stay_id
    ON stay_agreed_amount_corrections (stay_id);
