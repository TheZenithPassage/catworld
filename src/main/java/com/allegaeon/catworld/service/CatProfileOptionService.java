package com.allegaeon.catworld.service;

import com.allegaeon.catworld.dto.CatProfileOptionDto;
import com.allegaeon.catworld.dto.CatRequestDTO;
import com.allegaeon.catworld.dto.ManagedCatProfileOption;
import com.allegaeon.catworld.exception.BadRequestException;
import com.allegaeon.catworld.exception.CatCatalogTextConfirmationException;
import com.allegaeon.catworld.exception.ConflictException;
import com.allegaeon.catworld.exception.ForbiddenException;
import com.allegaeon.catworld.exception.ResourceNotFoundException;
import com.allegaeon.catworld.model.Cat;
import com.allegaeon.catworld.model.CatProfileOption;
import com.allegaeon.catworld.model.CatProfileOptionField;
import com.allegaeon.catworld.model.LitterPreference;
import com.allegaeon.catworld.model.UserRole;
import com.allegaeon.catworld.repository.CatProfileOptionRepository;
import com.allegaeon.catworld.repository.CatRepository;
import com.allegaeon.catworld.security.CurrentUserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import static com.allegaeon.catworld.model.CatProfileOptionField.FOOD_BRAND;
import static com.allegaeon.catworld.model.CatProfileOptionField.LITTER_DETAIL;
import static com.allegaeon.catworld.service.CatalogOptionName.binaryId;
import static com.allegaeon.catworld.service.CatalogOptionName.cleanName;
import static com.allegaeon.catworld.service.CatalogOptionName.key;
import static com.allegaeon.catworld.service.CatalogOptionName.sameName;

@Service
@RequiredArgsConstructor
public class CatProfileOptionService {
    private static final List<String> FIELD_KEYS = Arrays.stream(CatProfileOptionField.values())
            .map(CatProfileOptionField::key).toList();
    private static final List<String> PROFILE_CATALOG_FIELDS = Arrays.stream(CatProfileOptionField.values())
            .filter(CatProfileOptionField::isCatalogManaged).map(CatProfileOptionField::key).toList();
    private static final Set<String> COAT_LENGTHS = Set.of("Corto", "Largo", "Sin pelo");

    static boolean isFixedCoatLength(String value) {
        return value != null && COAT_LENGTHS.contains(value);
    }

    private final CatProfileOptionRepository options;
    private final CatRepository cats;
    private final FoodBrandService foodBrands;
    private final CurrentUserAccountService users;

    @Transactional(readOnly = true)
    public Map<String, List<CatProfileOptionDto>> approvedOptions() {
        Map<String, List<CatProfileOptionDto>> result = new LinkedHashMap<>();
        FIELD_KEYS.forEach(field -> result.put(field, new ArrayList<>()));
        for (var option : options.findAllByActiveTrueOrderByNameAscIdAsc()) {
            result.get(option.getCategory()).add(new CatProfileOptionDto(option.getId(), option.getName()));
        }
        result.put(FOOD_BRAND.key(), foodBrands.approvedBrands().stream()
                .map(brand -> new CatProfileOptionDto(brand.id(), brand.name())).toList());
        return result;
    }

    @Transactional
    public CatProfileOptionDto publish(String field, String suppliedName, UUID brandId) {
        requireAdministrator();
        String name = validatedName(field, suppliedName);
        if (CatIntakeCatalog.FOOD_DETAIL.equals(field)) return foodBrands.publishVariety(name, brandId);
        if (brandId != null || field == null || !PROFILE_CATALOG_FIELDS.contains(field)) {
            throw new BadRequestException("This cat profile field cannot be published");
        }
        if (FOOD_BRAND.key().equals(field)) return foodBrands.publishBrand(name);
        var option = findOrPublishOption(field, name);
        return new CatProfileOptionDto(option.getId(), option.getName());
    }

    @Transactional(readOnly = true)
    public List<ManagedCatProfileOption> managedOptions() {
        requireAdministrator();
        return allManagedOptions();
    }

    List<ManagedCatProfileOption> allManagedOptions() {
        var result = new ArrayList<>(foodBrands.managedOptions());
        options.findAllByOrderByNameAscIdAsc().stream()
                .filter(option -> PROFILE_CATALOG_FIELDS.contains(option.getCategory()))
                .map(CatProfileOptionService::managedOption)
                .forEach(result::add);
        return result;
    }

    @Transactional
    public ManagedCatProfileOption changeOption(String field, UUID id, String suppliedName, Boolean active) {
        requireAdministrator();
        if ((!PROFILE_CATALOG_FIELDS.contains(field) && !CatIntakeCatalog.FOOD_DETAIL.equals(field))
                || (suppliedName == null) == (active == null)) {
            throw new BadRequestException("Supply a name or visibility for a managed catalog option");
        }
        String name = active == null ? validatedName(field, suppliedName) : null;
        try {
            if (FOOD_BRAND.key().equals(field) || CatIntakeCatalog.FOOD_DETAIL.equals(field)) {
                return foodBrands.changeOption(field, id, name, active);
            }
            var option = options.findLockedById(id).filter(entry -> field.equals(entry.getCategory()))
                    .orElseThrow(() -> new ResourceNotFoundException("Catalog option", id));
            if (name != null) option.rename(name, key(name));
            else option.setActive(active);
            options.flush();
            return managedOption(option);
        } catch (DataIntegrityViolationException duplicate) {
            throw new ConflictException("This name is already used in this catalog");
        }
    }

    @Transactional
    public void deleteOption(String field, UUID id) {
        requireAdministrator();
        if (FOOD_BRAND.key().equals(field) || CatIntakeCatalog.FOOD_DETAIL.equals(field)) {
            foodBrands.deleteOption(field, id);
            return;
        }
        var option = options.findLockedById(id)
                .filter(entry -> field.equals(entry.getCategory()) && PROFILE_CATALOG_FIELDS.contains(field))
                .orElseThrow(() -> new ResourceNotFoundException("Catalog option", id));
        byte[] reference = binaryId(id);
        switch (field) {
            case "breed" -> cats.freezeBreed(reference, option.getName());
            case "lastInternalDewormerName" -> cats.freezeInternalDewormer(reference, option.getName());
            case "lastExternalDewormerName" -> cats.freezeExternalDewormer(reference, option.getName());
            case "litterDetail" -> cats.freezeLitterDetail(reference, option.getName());
            default -> throw new ResourceNotFoundException("Catalog option", id);
        }
        options.delete(option);
    }

    private static ManagedCatProfileOption managedOption(CatProfileOption option) {
        return new ManagedCatProfileOption(option.getId(), option.getCategory(), option.getName(), null,
                option.isActive());
    }

    private static String validatedName(String field, String suppliedName) {
        String name = cleanName(suppliedName);
        if (name == null || name.length() > (CatIntakeCatalog.FOOD_DETAIL.equals(field) ? 255 : 100)) {
            throw new BadRequestException("Provide a valid catalog option name");
        }
        return name;
    }

    static ConflictException hiddenName() {
        return new ConflictException("Restore this hidden option to offer it again");
    }

    private void requireAdministrator() {
        if (users.getCurrentUserAccount().getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only administrators can approve cat profile options");
        }
    }

    // The cat mutation owns the transaction. A confirmation response rolls back the entire profile.
    void applyProfile(Cat cat, CatRequestDTO request, Map<String, UUID> reviewedOptions) {
        Map<String, UUID> selected = request.getCatalogOptionIds() == null ? Map.of() : request.getCatalogOptionIds();
        if (!PROFILE_CATALOG_FIELDS.containsAll(selected.keySet()) || selected.containsKey(FOOD_BRAND.key())
                || selected.values().stream().anyMatch(Objects::isNull)) {
            throw new BadRequestException("An unknown cat profile option was selected");
        }

        var previousLabels = new LinkedHashMap<String, String>();
        for (var field : CatProfileOptionField.values()) {
            if (field.isCatalogManaged() && (!request.isUnlinkedIntakeOption(field.key()) || field.idOf(cat) == null)) {
                previousLabels.put(field.key(), field.displayedNameOf(cat));
            }
        }
        if (!request.isUnlinkedIntakeOption(CatIntakeCatalog.FOOD_DETAIL) || cat.getFoodVarietyId() == null) {
            previousLabels.put(CatIntakeCatalog.FOOD_DETAIL, cat.getDisplayedFoodDetail());
        }
        for (var field : CatProfileOptionField.values()) {
            UUID reviewedId = reviewedOptions.get(field.key());
            UUID selectedId = reviewedId == null ? selected.get(field.key()) : reviewedId;
            if (field == FOOD_BRAND) {
                foodBrands.applyProfile(cat, request, reviewedOptions);
            } else if (field == LITTER_DETAIL) {
                applyLitter(cat, request, selectedId, reviewedId != null);
            } else {
                String supplied = suppliedName(field, request);
                if (field.isCatalogManaged()) {
                    if (selectedId != null || hasTextUpdate(field, request)) {
                        applyOption(field, cat, supplied, selectedId, reviewedId != null,
                                request.isUnlinkedIntakeOption(field.key()));
                    }
                } else {
                    applyDescription(field, cat, supplied, request.isReviewedIntake());
                }
            }
        }

        var localText = new LinkedHashMap<String, String>();
        for (var field : CatProfileOptionField.values()) {
            if (field.isCatalogManaged() && field.idOf(cat) == null) {
                addChangedText(localText, field.key(), field.nameOf(cat), previousLabels);
            }
        }
        if (cat.getFoodVarietyId() == null) {
            addChangedText(localText, CatIntakeCatalog.FOOD_DETAIL, cat.getFoodDetail(), previousLabels);
        }
        Map<String, String> confirmed = request.getConfirmedCatalogText();
        if (!localText.isEmpty() && (confirmed == null || !confirmed.entrySet().containsAll(localText.entrySet()))) {
            throw new CatCatalogTextConfirmationException(localText);
        }
    }

    private static void addChangedText(Map<String, String> localText, String field, String saved,
                                       Map<String, String> previousLabels) {
        if (cleanName(saved) != null && !sameName(saved, previousLabels.get(field))) localText.put(field, saved);
    }

    private void applyLitter(Cat cat, CatRequestDTO request, UUID selected, boolean reviewed) {
        String supplied = request.getLitterDetail();
        boolean hasDetail = request.hasLitterDetailUpdate();
        if (request.hasLitterPreferenceUpdate()) {
            cat.setLitterPreference(request.getLitterPreference());
        } else if (!hasDetail && request.hasLitterBrandUpdate()
                && !Objects.equals(cat.getDisplayedLitterValue(), request.getLitterBrand())) {
            cat.setLitterPreference(LitterPreference.fromLegacyValue(request.getLitterBrand()));
            supplied = LitterPreference.detailFromLegacyValue(request.getLitterBrand());
            hasDetail = true;
        }
        if (cat.getLitterPreference() != LitterPreference.OWN) {
            if (selected != null || cleanName(supplied) != null) {
                throw new BadRequestException("A litter detail can only be saved for own litter");
            }
            return;
        }
        if (selected != null || hasDetail) {
            cat.setLitterPreference(LitterPreference.OWN);
            applyOption(LITTER_DETAIL, cat, supplied, selected, reviewed,
                    request.isUnlinkedIntakeOption(LITTER_DETAIL.key()));
        }
    }

    private void applyDescription(CatProfileOptionField field, Cat cat, String supplied, boolean reviewedIntake) {
        if (Objects.equals(field.nameOf(cat), supplied)) return;
        String description = supplied == null || supplied.isBlank() ? null : supplied.strip();
        if (field == CatProfileOptionField.COAT && description != null && !reviewedIntake
                && !isFixedCoatLength(description)) {
            throw new BadRequestException("Select a valid coat length");
        }
        field.setOption(cat, reviewedIntake && description != null ? supplied : description, null);
    }

    private void applyOption(CatProfileOptionField field, Cat cat, String supplied, UUID selected,
                             boolean reviewed, boolean unlinked) {
        if (selected != null) {
            if (selected.equals(field.idOf(cat))) return;
            var option = options.findLockedById(selected)
                    .filter(entry -> field.key().equals(entry.getCategory()) && (reviewed || entry.isActive()))
                    .orElseThrow(() -> new BadRequestException("The selected option is unavailable for this field"));
            field.setOption(cat, option.getName(), option.getId());
            return;
        }
        if (!unlinked && (sameName(field.nameOf(cat), supplied) || sameName(field.displayedNameOf(cat), supplied))) {
            return;
        }

        String name = cleanName(supplied);
        var option = name == null || unlinked ? null : options.findLockedByCategoryAndNormalizedKey(field.key(), key(name))
                .filter(CatProfileOption::isActive).orElse(null);
        field.setOption(cat, option == null ? (name == null ? null : supplied) : option.getName(),
                option == null ? null : option.getId());
    }

    private CatProfileOption findOrPublishOption(String field, String name) {
        byte[] normalizedKey = key(name);
        options.insertIfAbsent(binaryId(UUID.randomUUID()), field, name, normalizedKey);
        // A locking read sees a concurrent insert in MySQL repeatable-read transactions.
        var option = options.findLockedByCategoryAndNormalizedKey(field, normalizedKey).orElseThrow();
        if (!option.isActive()) throw hiddenName();
        return option;
    }

    private boolean hasTextUpdate(CatProfileOptionField field, CatRequestDTO request) {
        return switch (field) {
            case BREED -> request.hasBreedUpdate();
            case INTERNAL_DEWORMER -> request.hasLastInternalDewormerNameUpdate();
            case EXTERNAL_DEWORMER -> request.hasLastExternalDewormerNameUpdate();
            default -> false;
        };
    }

    private String suppliedName(CatProfileOptionField field, CatRequestDTO request) {
        return switch (field) {
            case BREED -> request.getBreed();
            case COAT -> request.getCoat();
            case COLOR -> request.getColor();
            case FOOD_BRAND -> request.getFoodBrand();
            case LITTER_DETAIL -> request.getLitterDetail();
            case INTERNAL_DEWORMER -> request.getLastInternalDewormerName();
            case EXTERNAL_DEWORMER -> request.getLastExternalDewormerName();
        };
    }
}
