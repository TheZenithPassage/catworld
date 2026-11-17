CREATE TABLE gallery_publications (
    id BINARY(16) NOT NULL,
    version BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(320),
    kind VARCHAR(20) NOT NULL,
    photo MEDIUMBLOB NOT NULL,
    width INT UNSIGNED NOT NULL,
    height INT UNSIGNED NOT NULL,
    published_at DATETIME(6),
    guest_permission_confirmed BIT(1) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_gallery_publication_kind CHECK (kind IN ('RESIDENT', 'GUEST')),
    CONSTRAINT chk_gallery_publication_width CHECK (width > 0 AND width <= 1600),
    CONSTRAINT chk_gallery_publication_height CHECK (height > 0 AND height <= 1600),
    CONSTRAINT chk_gallery_guest_permission CHECK (
        published_at IS NULL OR kind = 'RESIDENT' OR guest_permission_confirmed = TRUE
    )
) ENGINE=InnoDB;
