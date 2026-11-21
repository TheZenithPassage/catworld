package db.migration;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StayLifecycleActivationTest {

    @Test
    void activationAfterAClockJumpKeepsAnEndedStayClosed() {
        var start = LocalDateTime.parse("2026-03-28T15:00");
        var end = LocalDateTime.parse("2026-03-29T02:30");
        assertEquals("CHECKED_OUT", V30__backfill_stay_lifecycle_at_activation.classify(
                start, end, null, null, Instant.parse("2026-03-29T01:01:00Z"), ZoneId.of("Europe/Madrid")));
    }

    @Test
    void activationDuringSecondFallBackHourKeepsAnAlreadyEndedStayClosed() {
        var start = LocalDateTime.parse("2026-10-24T15:00");
        var end = LocalDateTime.parse("2026-10-25T02:30");
        var zone = ZoneId.of("Europe/Madrid");

        for (String instant : new String[]{"2026-10-25T00:45:00Z", "2026-10-25T01:15:00Z",
                "2026-10-25T01:45:00Z"}) {
            assertEquals("CHECKED_OUT", V30__backfill_stay_lifecycle_at_activation.classify(
                    start, end, null, null, Instant.parse(instant), zone));
        }
    }
}
