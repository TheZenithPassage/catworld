CREATE TABLE cat_informational_photos (
    id BINARY(16) NOT NULL,
    cat_id BINARY(16) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    content MEDIUMBLOB NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_cat_informational_photos_gallery (cat_id, created_at, id),
    CONSTRAINT fk_cat_informational_photos_cat FOREIGN KEY (cat_id) REFERENCES cats (id) ON DELETE CASCADE
) ENGINE=InnoDB;
