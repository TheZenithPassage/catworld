ALTER TABLE cat_intake_invitations
    ADD COLUMN requested_fields_snapshot MEDIUMTEXT NULL;

ALTER TABLE cat_intake_reviews ADD COLUMN draft_id BINARY(16) NULL;
ALTER TABLE cat_intake_reviews ADD COLUMN revision BIGINT NOT NULL DEFAULT 1;
ALTER TABLE cat_intake_reviews ADD CONSTRAINT uk_cat_intake_review_cat UNIQUE (invitation_id, cat_id);
ALTER TABLE cat_intake_reviews ADD CONSTRAINT uk_cat_intake_review_draft UNIQUE (invitation_id, draft_id);
