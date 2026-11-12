CREATE TABLE operations_tasks (
    id BINARY(16) NOT NULL,
    description VARCHAR(500) NOT NULL,
    due_date DATE NULL,
    stay_id BINARY(16) NULL,
    created_by_id BINARY(16) NOT NULL,
    created_by_username VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_operations_tasks_description CHECK (CHAR_LENGTH(TRIM(description)) > 0),
    CONSTRAINT fk_operations_tasks_stay
        FOREIGN KEY (stay_id) REFERENCES stays (id) ON DELETE SET NULL
);

CREATE TABLE operations_task_transitions (
    id BINARY(16) NOT NULL,
    task_id BINARY(16) NOT NULL,
    revision BIGINT NOT NULL,
    resolved BOOLEAN NOT NULL,
    actor_id BINARY(16) NOT NULL,
    actor_username VARCHAR(255) NOT NULL,
    occurred_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_operations_task_transitions_revision UNIQUE (task_id, revision),
    CONSTRAINT chk_operations_task_transitions_revision CHECK (revision > 0),
    CONSTRAINT fk_operations_task_transitions_task
        FOREIGN KEY (task_id) REFERENCES operations_tasks (id)
);
