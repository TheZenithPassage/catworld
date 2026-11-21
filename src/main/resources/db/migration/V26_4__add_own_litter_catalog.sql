ALTER TABLE cats ADD COLUMN litter_preference VARCHAR(6) NULL;
ALTER TABLE cats ADD COLUMN litter_detail VARCHAR(100) NULL;
ALTER TABLE cats ADD COLUMN litter_detail_option_id BINARY(16) NULL;
ALTER TABLE cats ADD CONSTRAINT fk_cats_litter_detail_option
    FOREIGN KEY (litter_detail_option_id) REFERENCES cat_profile_options (id);
ALTER TABLE cats ADD CONSTRAINT ck_cats_litter_detail_own CHECK (
    (litter_preference IS NULL OR litter_preference IN ('OWN', 'SHARED'))
    AND ((litter_detail IS NULL AND litter_detail_option_id IS NULL)
         OR (litter_preference IS NOT NULL AND litter_preference = 'OWN'))
);
