CREATE TABLE IF NOT EXISTS demo_activity (
    id INT PRIMARY KEY,
    generation CHAR(36) NOT NULL,
    pending_writes INT NOT NULL DEFAULT 0,
    last_changed_at DATETIME(6)
);

INSERT INTO demo_activity (id, generation) VALUES (1, UUID())
ON DUPLICATE KEY UPDATE id = 1;
