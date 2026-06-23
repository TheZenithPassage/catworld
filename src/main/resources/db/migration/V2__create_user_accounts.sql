CREATE TABLE user_accounts (
                               id BINARY(16) NOT NULL,
                               username VARCHAR(255) NOT NULL,
                               password_hash VARCHAR(255) NOT NULL,
                               role VARCHAR(20) NOT NULL,
                               enabled BIT(1) NOT NULL,
                               created_at DATETIME(6) NOT NULL,
                               updated_at DATETIME(6) NOT NULL,
                               PRIMARY KEY (id),
                               CONSTRAINT uk_user_accounts_username UNIQUE (username),
                               CONSTRAINT chk_user_accounts_role CHECK (role IN ('ADMIN', 'STAFF'))
);
