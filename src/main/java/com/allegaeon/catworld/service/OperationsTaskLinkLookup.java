package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.lookup.CatLookupItem;
import com.allegaeon.catworld.dto.lookup.CurrentCatLookupItem;
import com.allegaeon.catworld.dto.operations.OperationsTaskLinkOptions;
import com.allegaeon.catworld.dto.operations.OperationsTaskLinkOptions.Group;
import com.allegaeon.catworld.dto.operations.OperationsTaskLinkOptions.Results;
import com.allegaeon.catworld.dto.operations.OperationsTaskLinkOptions.StayOption;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.model.Stay;
import com.allegaeon.catworld.repository.OperationsTaskLinkRepository;
import com.allegaeon.catworld.repository.OperationsTaskLinkRepository.OwnerMatch;
import com.allegaeon.catworld.repository.StayCatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OperationsTaskLinkLookup {
    private static final int PAGE_SIZE = 5;

    private final OperationsTaskLinkRepository links;
    private final OwnerService owners;
    private final StayCatRepository stayCats;
    private final Clock clock;

    @Transactional(readOnly = true)
    public OperationsTaskLinkOptions search(String query, Group group, int pageIndex) {
        String name = query.strip();
        if (name.isEmpty() || name.length() > 255) throw new BadRequestException("Invalid link search query");
        if (pageIndex < 0 || pageIndex > Integer.MAX_VALUE / PAGE_SIZE) {
            throw new BadRequestException("Invalid link search page");
        }

        String pattern = "%" + name.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
        var page = PageRequest.of(pageIndex, PAGE_SIZE);
        var ownerMatches = group == null || group == Group.OWNER ? links.searchOwners(name, pattern, page) : null;
        var catMatches = group == null || group == Group.CAT ? links.searchCats(name, pattern, page) : null;
        int ownerRank = ownerMatches == null || ownerMatches.isEmpty()
                ? Integer.MAX_VALUE : ownerMatches.getContent().getFirst().getNameRank();
        int catRank = catMatches == null || catMatches.isEmpty()
                ? Integer.MAX_VALUE : catMatches.getContent().getFirst().getNameRank();

        return new OperationsTaskLinkOptions(
                ownerMatches == null ? null : new Results<>(
                        owners.hydrateLookupOwners(ownerMatches.map(OwnerMatch::getOwner).getContent()),
                        ownerMatches.hasNext()),
                catMatches == null ? null : new Results<>(catMatches.map(match -> {
                    var cat = match.getCat();
                    var owner = cat.getOwner();
                    return new CatLookupItem(cat.getId(), cat.getName(), owner.getId(), owner.getFullName(),
                            cat.isDeceased(), owner.isDeceased());
                }).getContent(), catMatches.hasNext()),
                group == null || group == Group.STAY ? searchStays(pattern, page) : null,
                ownerRank <= catRank);
    }

    private Results<StayOption> searchStays(String pattern, PageRequest page) {
        Slice<Stay> matches = links.searchStays(pattern, LocalDate.now(clock).atStartOfDay(), page);
        if (matches.isEmpty()) return new Results<>(List.of(), false);

        Map<UUID, List<CurrentCatLookupItem>> catsByStay = new HashMap<>();
        stayCats.findOverviewCatsByStayIds(matches.map(Stay::getId).getContent()).forEach(link -> {
            var cat = link.getCat();
            catsByStay.computeIfAbsent(link.getStay().getId(), id -> new ArrayList<>())
                    .add(new CurrentCatLookupItem(cat.getId(), cat.getName(), cat.isDeceased()));
        });
        List<StayOption> items = matches.stream().map(stay -> new StayOption(
                stay.getId(), stay.getStartAt(), stay.getEndAt(), stay.status(),
                stay.getOwner().getFullName(), stay.getOwner().isDeceased(),
                catsByStay.getOrDefault(stay.getId(), List.of()))).toList();
        return new Results<>(items, matches.hasNext());
    }
}
