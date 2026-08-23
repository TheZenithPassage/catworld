package com.allegaeon.catworld.dto.relationship;

import java.util.List;

public record RelationshipPreview<T>(long totalElements, List<T> items) {
}
