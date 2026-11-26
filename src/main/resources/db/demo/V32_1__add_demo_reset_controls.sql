CREATE TABLE IF NOT EXISTS demo_activity (
    id INT PRIMARY KEY,
    generation CHAR(36) NOT NULL,
    pending_writes INT NOT NULL DEFAULT 0,
    last_changed_at DATETIME(6)
);

ALTER TABLE demo_activity
    ADD COLUMN photo_uploads INT NOT NULL DEFAULT 0;

ALTER TABLE demo_activity
    ADD COLUMN baseline_date DATE;

CREATE TABLE demo_reset_state (
    id INT PRIMARY KEY,
    queued_at DATETIME(6),
    accepted_at DATETIME(6),
    quota_day DATE,
    accepted_count INT NOT NULL DEFAULT 0
);

INSERT INTO demo_reset_state (id) VALUES (1);

CREATE TABLE demo_reset_ip_usage (
    client_ip VARCHAR(45) PRIMARY KEY,
    accepted_count INT NOT NULL
);
