CREATE TABLE food_varieties (
    id BINARY(16) NOT NULL,
    brand_id BINARY(16) NOT NULL,
    name VARCHAR(255) NOT NULL,
    normalized_key VARBINARY(1020) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_food_variety_name UNIQUE (brand_id, normalized_key),
    CONSTRAINT uk_food_variety_brand_id UNIQUE (brand_id, id),
    CONSTRAINT fk_food_variety_brand FOREIGN KEY (brand_id) REFERENCES food_brands (id)
);

ALTER TABLE cats ADD COLUMN food_variety_id BINARY(16) NULL;
ALTER TABLE cats ADD CONSTRAINT ck_cat_food_variety_brand
    CHECK (food_variety_id IS NULL OR food_brand_id IS NOT NULL);
ALTER TABLE cats ADD CONSTRAINT fk_cats_food_variety
    FOREIGN KEY (food_brand_id, food_variety_id) REFERENCES food_varieties (brand_id, id);

ALTER TABLE cat_intake_reviews ADD COLUMN proposed_option_ids TEXT NULL;
ALTER TABLE cat_intake_reviews ADD COLUMN proposed_food_detail_brand VARCHAR(100) NULL;
