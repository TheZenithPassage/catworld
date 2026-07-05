ALTER TABLE owners
    ADD COLUMN created_by_id BINARY(16) NOT NULL,
    ADD CONSTRAINT fk_owners_created_by FOREIGN KEY (created_by_id) REFERENCES user_accounts (id);

ALTER TABLE vets
    ADD COLUMN created_by_id BINARY(16) NOT NULL,
    ADD CONSTRAINT fk_vets_created_by FOREIGN KEY (created_by_id) REFERENCES user_accounts (id);

ALTER TABLE cats
    ADD COLUMN created_by_id BINARY(16) NOT NULL,
    ADD CONSTRAINT fk_cats_created_by FOREIGN KEY (created_by_id) REFERENCES user_accounts (id);

ALTER TABLE stays
    ADD COLUMN created_by_id BINARY(16) NOT NULL,
    ADD CONSTRAINT fk_stays_created_by FOREIGN KEY (created_by_id) REFERENCES user_accounts (id);
