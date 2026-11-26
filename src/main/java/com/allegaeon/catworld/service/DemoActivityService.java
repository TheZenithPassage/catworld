package com.allegaeon.catworld.service;

import com.allegaeon.catworld.config.CatWorldSecurityProperties;
import com.allegaeon.catworld.exception.DemoPhotoUploadLimitException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;

@Service
@ConditionalOnProperty(name = "catworld.demo.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DemoActivityService {
    public static final int PHOTO_UPLOAD_LIMIT = 32;

    private final JdbcTemplate jdbc;
    private final CatWorldSecurityProperties securityProperties;

    public String sharedUsername() {
        return securityProperties.username().trim().toLowerCase(Locale.ROOT);
    }

    public String generation() {
        return jdbc.queryForObject("SELECT generation FROM demo_activity WHERE id = 1", String.class);
    }

    public boolean needsReset() {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                SELECT last_changed_at IS NOT NULL OR pending_writes > 0 OR photo_uploads >= ?
                FROM demo_activity WHERE id = 1
                """, Boolean.class, PHOTO_UPLOAD_LIMIT));
    }

    public void beginWrite() {
        jdbc.update("UPDATE demo_activity SET pending_writes = pending_writes + 1 WHERE id = 1");
    }

    public void finishWrite(boolean saved) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        jdbc.update("""
                UPDATE demo_activity
                SET pending_writes = pending_writes - 1,
                    last_changed_at = CASE
                        WHEN ? AND (last_changed_at IS NULL OR last_changed_at < ?) THEN ?
                        ELSE last_changed_at
                    END
                WHERE id = 1
                """, saved, now, now);
    }

    public void reservePhotoUpload(MultipartFile profilePhoto, List<MultipartFile> galleryPhotos) {
        boolean hasProfilePhoto = profilePhoto != null && !profilePhoto.isEmpty();
        boolean hasGalleryPhoto = galleryPhotos != null && galleryPhotos.stream().anyMatch(file -> !file.isEmpty());
        if (!hasProfilePhoto && !hasGalleryPhoto) {
            return;
        }
        int reserved = jdbc.update("""
                UPDATE demo_activity SET photo_uploads = photo_uploads + 1
                WHERE id = 1 AND photo_uploads < ?
                """, PHOTO_UPLOAD_LIMIT);
        if (reserved == 0) {
            throw new DemoPhotoUploadLimitException();
        }
    }
}
