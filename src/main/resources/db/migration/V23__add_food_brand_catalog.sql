CREATE TABLE food_brands (
    id BINARY(16) NOT NULL,
    name VARCHAR(100) NOT NULL,
    normalized_key VARBINARY(400) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_food_brands_key UNIQUE (normalized_key)
);

ALTER TABLE cats ADD COLUMN food_brand_id BINARY(16) NULL;
ALTER TABLE cats ADD COLUMN food_detail VARCHAR(255) NULL;
ALTER TABLE cats ADD CONSTRAINT fk_cats_food_brand
    FOREIGN KEY (food_brand_id) REFERENCES food_brands (id);
