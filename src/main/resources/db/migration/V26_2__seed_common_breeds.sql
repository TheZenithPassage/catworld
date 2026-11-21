-- Keep an existing UUID for a standard breed even if its spelling has no accent.
INSERT INTO cat_profile_options (id, category, name, normalized_key)
SELECT seeds.id, 'breed', seeds.name, seeds.canonical_key
FROM (
    SELECT X'750a75afc2e24440b809ef5482b668ed' AS id, 'Común' AS name,
           X'636f6dc3ba6e' AS canonical_key, X'636f6d756e' AS plain_key,
           'comun' AS plain_name, 'común' AS decomposed_name
    UNION ALL
    SELECT X'd58827db0efe488f84b393e7ad1d9a8a', 'Siamés',
           X'7369616dc3a973', X'7369616d6573', 'siames', 'siamés'
    UNION ALL
    SELECT X'd63de50ea9cf464b93a15ac31395b4a6', 'Persa',
           X'7065727361', X'7065727361', 'persa', 'persa'
) AS seeds
WHERE NOT EXISTS (
    SELECT 1
    FROM cat_profile_options AS existing
    WHERE existing.category = 'breed'
      AND (existing.normalized_key IN (seeds.canonical_key, seeds.plain_key)
        OR LOWER(TRIM(existing.name)) IN (LOWER(seeds.name), seeds.plain_name, seeds.decomposed_name))
);
