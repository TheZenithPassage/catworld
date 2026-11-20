CREATE TABLE cat_profile_options (
    id BINARY(16) NOT NULL,
    category VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    name VARCHAR(100) NOT NULL,
    normalized_key VARBINARY(400) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cat_profile_option_key UNIQUE (category, normalized_key),
    CONSTRAINT ck_cat_profile_option_category CHECK (
        category IN ('breed', 'coat', 'color', 'lastInternalDewormerName', 'lastExternalDewormerName')
    )
);

ALTER TABLE cats ADD COLUMN breed_option_id BINARY(16) NULL;
ALTER TABLE cats ADD COLUMN coat_option_id BINARY(16) NULL;
ALTER TABLE cats ADD COLUMN color_option_id BINARY(16) NULL;
ALTER TABLE cats ADD COLUMN last_internal_dewormer_option_id BINARY(16) NULL;
ALTER TABLE cats ADD COLUMN last_external_dewormer_option_id BINARY(16) NULL;

ALTER TABLE cats ADD CONSTRAINT fk_cats_breed_option
    FOREIGN KEY (breed_option_id) REFERENCES cat_profile_options (id);
ALTER TABLE cats ADD CONSTRAINT fk_cats_coat_option
    FOREIGN KEY (coat_option_id) REFERENCES cat_profile_options (id);
ALTER TABLE cats ADD CONSTRAINT fk_cats_color_option
    FOREIGN KEY (color_option_id) REFERENCES cat_profile_options (id);
ALTER TABLE cats ADD CONSTRAINT fk_cats_internal_dewormer_option
    FOREIGN KEY (last_internal_dewormer_option_id) REFERENCES cat_profile_options (id);
ALTER TABLE cats ADD CONSTRAINT fk_cats_external_dewormer_option
    FOREIGN KEY (last_external_dewormer_option_id) REFERENCES cat_profile_options (id);
