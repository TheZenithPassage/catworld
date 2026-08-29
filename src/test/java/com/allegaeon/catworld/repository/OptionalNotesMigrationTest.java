package com.allegaeon.catworld.repository;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

class OptionalNotesMigrationTest {

    @Test
    void versionElevenAddsNullableTextColumnsWithoutRewritingStayNotes() {
        DataSource dataSource = new SingleConnectionDataSource(
                "jdbc:h2:mem:optional_notes_v10_upgrade;DB_CLOSE_DELAY=-1;MODE=MySQL",
                "sa",
                "",
                true
        );
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        jdbcTemplate.execute("create table owners (id binary(16) primary key)");
        jdbcTemplate.execute("create table cats (id binary(16) primary key)");
        jdbcTemplate.execute("create table vets (id binary(16) primary key)");
        jdbcTemplate.execute("create table stays (id binary(16) primary key, notes text null)");

        String existingStayNotes = "  Línea uno\nsecond  line  ";
        byte[] expectedBytes = existingStayNotes.getBytes(StandardCharsets.UTF_8);
        jdbcTemplate.update(
                "insert into stays (id, notes) values (random_uuid(), ?)",
                existingStayNotes
        );

        Flyway.configure()
                .dataSource(dataSource)
                .baselineOnMigrate(true)
                .baselineVersion(MigrationVersion.fromVersion("10"))
                .load()
                .migrate();

        assertNullableTextColumn(jdbcTemplate, "OWNERS", "NOTES");
        assertNullableTextColumn(jdbcTemplate, "CATS", "NOTES");
        assertNullableTextColumn(jdbcTemplate, "VETS", "NOTES");
        String preservedStayNotes = jdbcTemplate.queryForObject(
                "select notes from stays",
                String.class
        );
        assertArrayEquals(expectedBytes, preservedStayNotes.getBytes(StandardCharsets.UTF_8));
        assertEquals(
                1,
                jdbcTemplate.queryForObject(
                        "select count(*) from \"flyway_schema_history\" where \"version\" = '11' and \"success\" = true",
                        Integer.class
                )
        );
    }

    private void assertNullableTextColumn(JdbcTemplate jdbcTemplate, String table, String column) {
        assertEquals(
                1,
                jdbcTemplate.queryForObject(
                        """
                        select count(*)
                        from information_schema.columns
                        where table_name = ?
                          and column_name = ?
                          and is_nullable = 'YES'
                          and data_type in ('CHARACTER VARYING', 'CLOB')
                        """,
                        Integer.class,
                        table,
                        column
                )
        );
    }
}
