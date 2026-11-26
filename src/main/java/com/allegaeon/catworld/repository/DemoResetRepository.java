package com.allegaeon.catworld.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Repository
@RequiredArgsConstructor
public class DemoResetRepository {
    private static final String SELECT_STATE = """
            SELECT queued_at, accepted_at, quota_day, accepted_count FROM demo_reset_state WHERE id = 1
            """;

    private final JdbcTemplate jdbc;

    public ResetState readState(boolean lock) {
        return jdbc.queryForObject(lock ? SELECT_STATE + "FOR UPDATE" : SELECT_STATE, (row, index) -> new ResetState(
                row.getObject("queued_at", LocalDateTime.class) != null,
                row.getObject("accepted_at", LocalDateTime.class),
                row.getObject("quota_day", LocalDate.class),
                row.getInt("accepted_count")));
    }

    public int acceptedFromIp(String clientIp) {
        return jdbc.queryForObject("""
                SELECT COALESCE((SELECT accepted_count FROM demo_reset_ip_usage WHERE client_ip = ?), 0)
                """, Integer.class, clientIp);
    }

    public void accept(String clientIp, LocalDateTime acceptedAt, LocalDate quotaDay, boolean continuingQuotaDay) {
        if (!continuingQuotaDay) {
            jdbc.update("DELETE FROM demo_reset_ip_usage");
            jdbc.update("UPDATE demo_reset_state SET accepted_count = 0 WHERE id = 1");
        }
        jdbc.update("""
                UPDATE demo_reset_state
                SET queued_at = ?, accepted_at = ?, quota_day = ?, accepted_count = accepted_count + 1
                WHERE id = 1
                """, acceptedAt, acceptedAt, quotaDay);
        int updated = jdbc.update("""
                UPDATE demo_reset_ip_usage SET accepted_count = accepted_count + 1 WHERE client_ip = ?
                """, clientIp);
        if (updated == 0) {
            jdbc.update("INSERT INTO demo_reset_ip_usage (client_ip, accepted_count) VALUES (?, 1)", clientIp);
        }
    }

    public record ResetState(boolean queued, LocalDateTime acceptedAt, LocalDate quotaDay, int acceptedCount) {
    }
}
