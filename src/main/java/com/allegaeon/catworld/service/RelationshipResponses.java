package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.relationship.*;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.Stay;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

final class RelationshipResponses {

    static final int PAGE_SIZE = 5;

    private RelationshipResponses() {
    }

    static void requireValidPage(int page) {
        if (page < 0) {
            throw new BadRequestException("Page must not be negative");
        }
    }

    static CatRelationshipItem cat(Cat cat) {
        return new CatRelationshipItem(cat.getId(), cat.getName(),
                cat.getOwner().getId(), cat.getOwner().getFullName());
    }

    static StayRelationshipItem stay(Stay stay) {
        return new StayRelationshipItem(stay.getId(), stay.getStartAt(), stay.getEndAt(), stay.getStatus());
    }

    static <S, T> RelationshipPreview<T> preview(Page<S> source, Function<S, T> mapper) {
        List<T> items = source.getTotalElements() <= 3
                ? source.getContent().stream().map(mapper).toList()
                : List.of();
        return new RelationshipPreview<>(source.getTotalElements(), items);
    }

    static <S, T> RelationshipPage<T> page(Page<S> source, Function<S, T> mapper) {
        return new RelationshipPage<>(source.getContent().stream().map(mapper).toList(),
                source.getNumber(), PAGE_SIZE, source.getTotalElements(), source.getTotalPages());
    }
}
