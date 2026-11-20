ALTER TABLE cats MODIFY COLUMN birth_date DATE NULL;
ALTER TABLE cats ADD COLUMN birth_year INT NULL;
ALTER TABLE cats ADD COLUMN care_instructions VARCHAR(2000) NULL;
ALTER TABLE cats ADD CONSTRAINT chk_cats_birth_precision CHECK (
    (birth_date IS NOT NULL AND birth_year IS NULL)
    OR (birth_date IS NULL AND birth_year IS NOT NULL AND birth_year BETWEEN 1000 AND 9999)
);
