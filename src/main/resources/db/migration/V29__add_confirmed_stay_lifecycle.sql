ALTER TABLE stays ADD COLUMN movement_status VARCHAR(11) NOT NULL DEFAULT 'RESERVED';
ALTER TABLE stays ADD COLUMN movement_revision BIGINT NOT NULL DEFAULT 0;
ALTER TABLE stays ADD CONSTRAINT chk_stays_movement_status
    CHECK (movement_status IN ('RESERVED', 'CHECKED_IN', 'CHECKED_OUT'));
ALTER TABLE stays ADD CONSTRAINT chk_stays_movement_revision CHECK (movement_revision >= 0);

CREATE INDEX ix_stays_movement_status_start ON stays (movement_status, start_at);

CREATE TABLE stay_arrival_resets (
    stay_id BINARY(16) NOT NULL,
    movement_revision BIGINT NOT NULL,
    occurred_at_utc DATETIME(6),
    recorded_by_id BINARY(16),
    recorded_by VARCHAR(255),
    corrected_by_id BINARY(16),
    corrected_by VARCHAR(255),
    version BIGINT,
    reset_by_id BINARY(16) NOT NULL,
    reset_by VARCHAR(255) NOT NULL,
    reset_at_utc DATETIME(6) NOT NULL,
    PRIMARY KEY (stay_id, movement_revision)
);
