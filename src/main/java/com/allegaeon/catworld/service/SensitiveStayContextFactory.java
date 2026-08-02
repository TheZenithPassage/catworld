package com.allegaeon.catworld.service;

import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.SensitiveStayContext;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.repository.SensitiveStayContextRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SensitiveStayContextFactory {

    private final SensitiveStayContextRepository contextRepository;

    public SensitiveStayContext create(Stay stay) {
        SensitiveStayContext context = SensitiveStayContext.builder()
                .id(UUID.randomUUID())
                .stayId(stay.getId())
                .ownerId(stay.getOwner().getId())
                .ownerFullName(stay.getOwner().getFullName())
                .stayStartAt(stay.getStartAt())
                .stayEndAt(stay.getEndAt())
                .stayCancelledAt(stay.getCancelledAt())
                .build();

        stay.getStayCats().stream()
                .map(stayCat -> stayCat.getCat())
                .sorted(Comparator.comparing(Cat::getId))
                .forEach(cat -> context.addCat(cat.getId(), cat.getName()));

        return contextRepository.saveAndFlush(context);
    }
}

