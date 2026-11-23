package com.allegaeon.catworld.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
@ConditionalOnProperty(name = "catworld.demo.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DemoActivityService {
    private final JdbcTemplate jdbc;

    public String generation() {
        return jdbc.queryForObject("SELECT generation FROM demo_activity WHERE id = 1", String.class);
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
}
