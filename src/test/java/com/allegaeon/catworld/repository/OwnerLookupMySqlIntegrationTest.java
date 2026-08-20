package com.allegaeon.catworld.repository;

import com.allegaeon.catworld.dto.lookup.OwnerLookupOptionDTO;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.service.IOwnerService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.nio.ByteBuffer;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@EnabledIfEnvironmentVariable(named = "CATWORLD_NATIVE_MYSQL_URL", matches = ".+")
@SpringBootTest(properties = {
        "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true",
        "catworld.security.username=native-admin",
        "catworld.security.password=native-password",
        "catworld.security.cors-allowed-origins=http://localhost:4200"
})
@Transactional
@Rollback
class OwnerLookupMySqlIntegrationTest {

    @DynamicPropertySource
    static void nativeProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv("CATWORLD_NATIVE_MYSQL_URL"));
        registry.add("spring.datasource.username", () -> System.getenv("CATWORLD_NATIVE_MYSQL_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("CATWORLD_NATIVE_MYSQL_PASSWORD"));
    }

    @Autowired IOwnerService ownerService;
    @Autowired JdbcTemplate jdbc;

    @Test
    void lookupUsesAccentInsensitiveOwnerAndCatSearchWithBoundedDeterministicPaging() {
        String marker = UUID.randomUUID().toString().substring(0, 8);
        UUID creatorId = UUID.randomUUID();
        jdbc.update("""
                insert into user_accounts
                    (id, username, password_hash, role, enabled, created_at, updated_at)
                values (?, ?, 'hash', 'ADMIN', true, now(6), now(6))
                """, bytes(creatorId), "lookup-" + marker);

        UUID resolvedId = null;
        for (int index = 0; index < 7; index++) {
            UUID ownerId = UUID.randomUUID();
            String ownerName = index == 0
                    ? marker + " Álvaro Owner"
                    : marker + " Owner 0" + index;
            jdbc.update("""
                    insert into owners
                        (id, full_name, primary_phone, created_by_id, created_at, updated_at)
                    values (?, ?, '555-0100', ?, now(6), now(6))
                    """, bytes(ownerId), ownerName, bytes(creatorId));
            if (index == 0) {
                resolvedId = ownerId;
                insertCat(UUID.randomUUID(), ownerId, creatorId, "Mílo");
                insertCat(UUID.randomUUID(), ownerId, creatorId, "Zoe");
            } else {
                insertCat(UUID.randomUUID(), ownerId, creatorId, marker + " cat " + index);
            }
        }

        var firstPage = ownerService.searchLookupOptions(marker, 0);
        assertEquals(5, firstPage.items().size());
        assertTrue(firstPage.hasNext());
        assertEquals(marker + " Álvaro Owner", firstPage.items().get(0).fullName());
        assertEquals(List.of("Mílo", "Zoe"), firstPage.items().get(0).catNames());
        assertEquals(5, firstPage.items().stream().map(OwnerLookupOptionDTO::id).distinct().count());

        var accentInsensitiveMatch = ownerService.searchLookupOptions("alvaro", 0);
        assertEquals(List.of(resolvedId),
                accentInsensitiveMatch.items().stream().map(OwnerLookupOptionDTO::id).toList());
        assertEquals(List.of(resolvedId), ownerService.searchLookupOptions("milo", 0).items()
                .stream().map(OwnerLookupOptionDTO::id).toList());

        var secondPage = ownerService.searchLookupOptions(marker, 1);
        assertEquals(2, secondPage.items().size());
        assertFalse(secondPage.hasNext());

        OwnerLookupOptionDTO resolved = ownerService.getLookupOption(resolvedId);
        assertEquals(List.of("Mílo", "Zoe"), resolved.catNames());

        assertThrows(BadRequestException.class, () -> ownerService.searchLookupOptions("ab", 0));
        assertThrows(BadRequestException.class, () -> ownerService.searchLookupOptions("valid", -1));
    }

    private void insertCat(UUID catId, UUID ownerId, UUID creatorId, String name) {
        jdbc.update("""
                insert into cats
                    (id, name, birth_date, sex, owner_id, created_by_id, created_at, updated_at)
                values (?, ?, '2020-01-01', 'FEMALE', ?, ?, now(6), now(6))
                """, bytes(catId), name, bytes(ownerId), bytes(creatorId));
    }

    private byte[] bytes(UUID id) {
        return ByteBuffer.allocate(16)
                .putLong(id.getMostSignificantBits())
                .putLong(id.getLeastSignificantBits())
                .array();
    }
}
