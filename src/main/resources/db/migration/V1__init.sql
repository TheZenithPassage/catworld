CREATE TABLE owners (
                        id BINARY(16) NOT NULL,
                        full_name VARCHAR(255) NOT NULL,
                        address VARCHAR(255) NULL,
                        primary_phone VARCHAR(20) NOT NULL,
                        secondary_phone VARCHAR(20) NULL,
                        secondary_phone_name VARCHAR(255) NULL,
                        instagram VARCHAR(255) NULL,
                        facebook VARCHAR(255) NULL,
                        created_at DATETIME(6) NOT NULL,
                        updated_at DATETIME(6) NOT NULL,
                        PRIMARY KEY (id)
);

CREATE TABLE vets (
                      id BINARY(16) NOT NULL,
                      name VARCHAR(255) NOT NULL,
                      address VARCHAR(255) NULL,
                      phone_number VARCHAR(20) NULL,
                      created_at DATETIME(6) NOT NULL,
                      updated_at DATETIME(6) NOT NULL,
                      PRIMARY KEY (id)
);

CREATE TABLE cats (
                      id BINARY(16) NOT NULL,
                      name VARCHAR(255) NOT NULL,
                      birth_date DATE NOT NULL,
                      sex VARCHAR(255) NOT NULL,
                      breed VARCHAR(255) NULL,
                      coat VARCHAR(255) NULL,
                      color VARCHAR(255) NULL,
                      food_brand VARCHAR(255) NULL,
                      litter_brand VARCHAR(255) NULL,
                      personality VARCHAR(255) NULL,
                      last_internal_dewormer_name VARCHAR(255) NULL,
                      last_internal_deworming_date DATE NULL,
                      last_external_dewormer_name VARCHAR(255) NULL,
                      last_external_deworming_date DATE NULL,
                      last_triple_feline_date DATE NULL,
                      last_rabies_date DATE NULL,
                      owner_id BINARY(16) NOT NULL,
                      vet_id BINARY(16) NULL,
                      created_at DATETIME(6) NOT NULL,
                      updated_at DATETIME(6) NOT NULL,
                      PRIMARY KEY (id),
                      CONSTRAINT fk_cats_owner FOREIGN KEY (owner_id) REFERENCES owners (id),
                      CONSTRAINT fk_cats_vet FOREIGN KEY (vet_id) REFERENCES vets (id)
);

CREATE TABLE stays (
                       id BINARY(16) NOT NULL,
                       start_at DATETIME(6) NOT NULL,
                       end_at DATETIME(6) NOT NULL,
                       cancelled_at DATETIME(6) NULL,
                       notes TEXT NULL,
                       owner_id BINARY(16) NOT NULL,
                       created_at DATETIME(6) NOT NULL,
                       updated_at DATETIME(6) NOT NULL,
                       PRIMARY KEY (id),
                       CONSTRAINT fk_stays_owner FOREIGN KEY (owner_id) REFERENCES owners (id)
);

CREATE TABLE stay_cat (
                          stay_id BINARY(16) NOT NULL,
                          cat_id BINARY(16) NOT NULL,
                          PRIMARY KEY (stay_id, cat_id),
                          CONSTRAINT fk_stay_cat_stay FOREIGN KEY (stay_id) REFERENCES stays (id),
                          CONSTRAINT fk_stay_cat_cat FOREIGN KEY (cat_id) REFERENCES cats (id)
);