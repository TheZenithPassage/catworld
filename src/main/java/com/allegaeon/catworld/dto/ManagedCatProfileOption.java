package com.allegaeon.catworld.dto;

import java.util.UUID;

public record ManagedCatProfileOption(UUID id, String field, String name, UUID brandId, boolean active) {}
