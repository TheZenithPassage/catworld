package com.allegaeon.catworld.model;

public enum LitterPreference {
    OWN("Trae sus propias piedritas"),
    SHARED("Usa las de CatWorld");

    private final String legacyValue;

    LitterPreference(String legacyValue) {
        this.legacyValue = legacyValue;
    }

    public String legacyValue() {
        return legacyValue;
    }

    public static LitterPreference fromLegacyValue(String value) {
        if (value == null || value.isBlank()) return null;
        return SHARED.legacyValue.equals(value) ? SHARED : OWN;
    }

    public static String detailFromLegacyValue(String value) {
        return fromLegacyValue(value) == OWN && !OWN.legacyValue.equals(value) ? value : null;
    }

    public String legacyValueWithDetail(String detail) {
        return this == OWN && detail != null && !SHARED.legacyValue.equals(detail) ? detail : legacyValue;
    }
}
