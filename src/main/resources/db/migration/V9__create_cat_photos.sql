CREATE TABLE cat_photos (
    cat_id BINARY(16) NOT NULL,
    content MEDIUMBLOB NOT NULL,
    width INT UNSIGNED NOT NULL,
    height INT UNSIGNED NOT NULL,
    byte_size INT UNSIGNED NOT NULL,
    sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    PRIMARY KEY (cat_id),
    CONSTRAINT fk_cat_photos_cat FOREIGN KEY (cat_id) REFERENCES cats (id) ON DELETE CASCADE,
    CONSTRAINT chk_cat_photos_width CHECK (width > 0 AND width <= 1600),
    CONSTRAINT chk_cat_photos_height CHECK (height > 0 AND height <= 1600),
    CONSTRAINT chk_cat_photos_byte_size CHECK (byte_size > 0)
) ENGINE=InnoDB;
