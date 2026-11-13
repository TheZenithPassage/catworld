CREATE TABLE care_routines (
    id BINARY(16) NOT NULL,
    name VARCHAR(100) NOT NULL,
    mode VARCHAR(10) NOT NULL,
    seed_key VARCHAR(10) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT uk_care_routines_seed UNIQUE (seed_key),
    CONSTRAINT chk_care_routines_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_care_routines_mode CHECK (mode IN ('DAILY', 'SHIFT', 'EVENT')),
    CONSTRAINT chk_care_routines_seed CHECK (seed_key IN ('FOOD', 'WATER', 'LITTER'))
);

INSERT INTO care_routines (id, name, mode, seed_key) VALUES
    (X'cafe0000000040008000000000000001', 'Food', 'EVENT', 'FOOD'),
    (X'cafe0000000040008000000000000002', 'Water', 'DAILY', 'WATER'),
    (X'cafe0000000040008000000000000003', 'Litter', 'DAILY', 'LITTER');

CREATE TABLE care_records (
    id BINARY(16) NOT NULL,
    stay_id BINARY(16) NOT NULL,
    cat_id BINARY(16) NOT NULL,
    cat_name VARCHAR(255) NOT NULL,
    business_date DATE NOT NULL,
    recorded_at DATETIME(6) NOT NULL,
    routine_id BINARY(16) NULL,
    routine_name VARCHAR(100) NULL,
    routine_seed_key VARCHAR(10) NULL,
    mode VARCHAR(10) NULL,
    shift VARCHAR(10) NULL,
    active_slot VARCHAR(10) NULL,
    note TEXT NULL,
    author_id BINARY(16) NOT NULL,
    author_username VARCHAR(255) NOT NULL,
    annulled_at DATETIME(6) NULL,
    annulled_by_id BINARY(16) NULL,
    annulled_by_username VARCHAR(255) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_care_records_stay FOREIGN KEY (stay_id) REFERENCES stays (id) ON DELETE CASCADE,
    CONSTRAINT uk_care_records_active_slot UNIQUE (stay_id, cat_id, business_date, routine_id, active_slot),
    CONSTRAINT chk_care_records_content CHECK (
        (routine_id IS NULL AND routine_name IS NULL AND routine_seed_key IS NULL AND mode IS NULL
            AND note IS NOT NULL AND CHAR_LENGTH(TRIM(note)) > 0)
        OR (routine_id IS NOT NULL AND routine_name IS NOT NULL AND mode IS NOT NULL
            AND mode IN ('DAILY', 'SHIFT', 'EVENT') AND note IS NULL)
    ),
    CONSTRAINT chk_care_records_shift CHECK (
        (shift IS NULL AND (mode IS NULL OR mode <> 'SHIFT'))
        OR (mode IS NOT NULL AND mode = 'SHIFT' AND shift IS NOT NULL
            AND shift IN ('MORNING', 'AFTERNOON', 'EVENING'))
    ),
    CONSTRAINT chk_care_records_active_slot CHECK (
        (active_slot IS NULL AND (annulled_at IS NOT NULL OR mode IS NULL OR mode = 'EVENT'))
        OR (annulled_at IS NULL AND mode IS NOT NULL AND active_slot IS NOT NULL
            AND ((mode = 'DAILY' AND active_slot = 'DAILY') OR (mode = 'SHIFT' AND active_slot = shift)))
    ),
    CONSTRAINT chk_care_records_annulment CHECK (
        (annulled_at IS NULL AND annulled_by_id IS NULL AND annulled_by_username IS NULL)
        OR (annulled_at IS NOT NULL AND annulled_by_id IS NOT NULL AND annulled_by_username IS NOT NULL)
    )
);

CREATE INDEX idx_care_records_stay_history ON care_records (stay_id, business_date, recorded_at, id);
