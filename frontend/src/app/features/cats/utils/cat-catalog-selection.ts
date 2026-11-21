import type { CatCatalogSelection, CreateCatRequest } from '../models/cat.model';

export function catCatalogSelectionRequest(
  selection: CatCatalogSelection,
  initial: CatCatalogSelection = {},
): Pick<CreateCatRequest, 'catalogOptionIds' | 'foodBrandId' | 'foodVarietyId'> {
  const { foodBrand, foodDetail, ...other } = selection;
  const catalogOptionIds = Object.fromEntries(
    Object.entries(other).filter(
      ([field, id]) => id && initial[field as keyof typeof other] !== id,
    ),
  );
  return {
    ...(Object.keys(catalogOptionIds).length ? { catalogOptionIds } : {}),
    ...(foodBrand && initial.foodBrand !== foodBrand ? { foodBrandId: foodBrand } : {}),
    ...(foodDetail && (initial.foodDetail !== foodDetail || initial.foodBrand !== foodBrand)
      ? { foodVarietyId: foodDetail }
      : {}),
  };
}
