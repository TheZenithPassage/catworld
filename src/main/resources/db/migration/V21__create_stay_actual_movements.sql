CREATE TABLE stay_actual_movements (
    stay_id BINARY(16) NOT NULL,
    movement_type VARCHAR(9) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    occurred_at_utc DATETIME(6) NOT NULL,
    recorded_by_id BINARY(16) NOT NULL,
    recorded_by VARCHAR(255) NOT NULL,
    corrected_by_id BINARY(16) NULL,
    corrected_by VARCHAR(255) NULL,
    version BIGINT NOT NULL,
    PRIMARY KEY (stay_id, movement_type),
    CONSTRAINT fk_actual_movements_stay FOREIGN KEY (stay_id) REFERENCES stays (id) ON DELETE CASCADE,
    CONSTRAINT chk_actual_movements_type CHECK (movement_type IN ('ARRIVAL', 'DEPARTURE')),
    CONSTRAINT chk_actual_movements_version CHECK (version >= 0),
    CONSTRAINT chk_actual_movements_corrector CHECK ((corrected_by_id IS NULL) = (corrected_by IS NULL))
) ENGINE=InnoDB;
