ALTER TABLE cat_photos ADD COLUMN frame_x INT;
ALTER TABLE cat_photos ADD COLUMN frame_y INT;
ALTER TABLE cat_photos ADD COLUMN frame_zoom INT;

ALTER TABLE cat_intake_photos ADD COLUMN frame_x INT;
ALTER TABLE cat_intake_photos ADD COLUMN frame_y INT;
ALTER TABLE cat_intake_photos ADD COLUMN frame_zoom INT;
ALTER TABLE cat_intake_photos ADD COLUMN portrait_width INT;
ALTER TABLE cat_intake_photos ADD COLUMN portrait_height INT;
ALTER TABLE cat_intake_photos ADD COLUMN portrait_sha256 VARCHAR(64);
