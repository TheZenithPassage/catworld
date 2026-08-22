package com.allegaeon.catworld.dto.relationship;

import java.util.List;

public record RelationshipPage<T>(List<T> items, int page, int pageSize,
                                  long totalElements, int totalPages) {
}
