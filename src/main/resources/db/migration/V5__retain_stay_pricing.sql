ALTER TABLE stays
    ADD COLUMN retained_nightly_rate DECIMAL(19, 0) NULL;

ALTER TABLE stays
    ADD COLUMN agreed_amount DECIMAL(19, 0) NULL;

ALTER TABLE stays
    ADD CONSTRAINT chk_stays_retained_nightly_rate
        CHECK (retained_nightly_rate IS NULL OR retained_nightly_rate > 0);

ALTER TABLE stays
    ADD CONSTRAINT chk_stays_agreed_amount
        CHECK (agreed_amount IS NULL OR agreed_amount >= 0);

CREATE TABLE stay_pricing_decisions (
    id BINARY(16) NOT NULL,
    stay_id BINARY(16) NOT NULL,
    retained_nightly_rate DECIMAL(19, 0) NULL,
    previous_number_of_nights BIGINT NULL,
    new_number_of_nights BIGINT NOT NULL,
    previous_agreed_amount DECIMAL(19, 0) NULL,
    new_agreed_amount DECIMAL(19, 0) NOT NULL,
    decided_by_id BINARY(16) NOT NULL,
    decided_at DATETIME(6) NOT NULL,
    reason TEXT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_stay_pricing_decisions_retained_rate
        CHECK (retained_nightly_rate IS NULL OR retained_nightly_rate > 0),
    CONSTRAINT chk_stay_pricing_decisions_previous_nights
        CHECK (previous_number_of_nights IS NULL OR previous_number_of_nights >= 0),
    CONSTRAINT chk_stay_pricing_decisions_new_nights
        CHECK (new_number_of_nights >= 0),
    CONSTRAINT chk_stay_pricing_decisions_previous_agreed
        CHECK (previous_agreed_amount IS NULL OR previous_agreed_amount >= 0),
    CONSTRAINT chk_stay_pricing_decisions_new_agreed
        CHECK (new_agreed_amount >= 0),
    CONSTRAINT fk_stay_pricing_decisions_actor
        FOREIGN KEY (decided_by_id) REFERENCES user_accounts (id)
);

CREATE INDEX idx_stay_pricing_decisions_stay_id
    ON stay_pricing_decisions (stay_id);
