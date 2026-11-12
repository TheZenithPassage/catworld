CREATE TABLE cat_intake_invitations (
    id BINARY(16) NOT NULL,
    owner_id BINARY(16) NOT NULL,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    allow_new_cats BOOLEAN NOT NULL,
    scope_snapshot MEDIUMTEXT NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    revoked_at DATETIME(6) NULL,
    submitted_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cat_intake_token_hash UNIQUE (token_hash),
    INDEX idx_cat_intake_invitation_owner (owner_id, revoked_at, submitted_at, expires_at),
    CONSTRAINT fk_cat_intake_invitation_owner FOREIGN KEY (owner_id) REFERENCES owners (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cat_intake_reviews (
    id BINARY(16) NOT NULL,
    invitation_id BINARY(16) NOT NULL,
    cat_id BINARY(16) NULL,
    cat_name VARCHAR(100) NOT NULL,
    original_fields TEXT NOT NULL,
    proposed_fields TEXT NOT NULL,
    submitted_at DATETIME(6) NOT NULL,
    approved_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    INDEX idx_cat_intake_pending (approved_at, submitted_at, id),
    CONSTRAINT fk_cat_intake_review_invitation
        FOREIGN KEY (invitation_id) REFERENCES cat_intake_invitations (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cat_intake_photos (
    id BINARY(16) NOT NULL,
    review_id BINARY(16) NOT NULL,
    content MEDIUMBLOB NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_cat_intake_photo_review (review_id),
    CONSTRAINT fk_cat_intake_photo_review
        FOREIGN KEY (review_id) REFERENCES cat_intake_reviews (id) ON DELETE CASCADE
) ENGINE=InnoDB;
