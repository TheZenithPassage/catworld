package com.allegaeon.catworld.model;

import lombok.RequiredArgsConstructor;

import java.util.UUID;
import java.util.function.BiConsumer;
import java.util.function.Function;

@RequiredArgsConstructor
public enum CatProfileOptionField {
    BREED("breed", Cat::getBreed, Cat::setBreed, Cat::getBreedOptionId, Cat::setBreedOptionId),
    COAT("coat", Cat::getCoat, Cat::setCoat, Cat::getCoatOptionId, Cat::setCoatOptionId),
    COLOR("color", Cat::getColor, Cat::setColor, Cat::getColorOptionId, Cat::setColorOptionId),
    FOOD_BRAND("foodBrand", Cat::getFoodBrand, Cat::setFoodBrand, Cat::getFoodBrandId, Cat::setFoodBrandId),
    INTERNAL_DEWORMER("lastInternalDewormerName", Cat::getLastInternalDewormerName, Cat::setLastInternalDewormerName,
            Cat::getLastInternalDewormerOptionId, Cat::setLastInternalDewormerOptionId),
    EXTERNAL_DEWORMER("lastExternalDewormerName", Cat::getLastExternalDewormerName, Cat::setLastExternalDewormerName,
            Cat::getLastExternalDewormerOptionId, Cat::setLastExternalDewormerOptionId);

    private final String key;
    private final Function<Cat, String> nameReader;
    private final BiConsumer<Cat, String> nameWriter;
    private final Function<Cat, UUID> idReader;
    private final BiConsumer<Cat, UUID> idWriter;

    public String key() {
        return key;
    }

    public String nameOf(Cat cat) {
        return nameReader.apply(cat);
    }

    public UUID idOf(Cat cat) {
        return idReader.apply(cat);
    }

    public void setOption(Cat cat, String name, UUID id) {
        nameWriter.accept(cat, name);
        idWriter.accept(cat, id);
    }
}
