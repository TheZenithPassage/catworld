import { Stay } from '../models/stay.model';

export interface StaySearchFilters {
  catId: string | null;
  ownerId: string | null;
}

export interface StayCatFilterOption {
  catId: string;
  catName: string;
  ownerId: string;
  ownerName: string;
  label: string;
  searchText: string;
}

export interface StayOwnerFilterOption {
  ownerId: string;
  ownerName: string;
  catNames: string[];
  label: string;
  searchText: string;
}

export function getDefaultStaySearchFilters(): StaySearchFilters {
  return {
    catId: null,
    ownerId: null,
  };
}

export function getStayCatFilterOptions(stays: Stay[]): StayCatFilterOption[] {
  const optionsByCatId = new Map<string, StayCatFilterOption>();

  stays.forEach((stay) => {
    stay.cats.forEach((cat) => {
      if (optionsByCatId.has(cat.catId)) {
        return;
      }

      optionsByCatId.set(cat.catId, {
        catId: cat.catId,
        catName: cat.name,
        ownerId: stay.ownerId,
        ownerName: stay.ownerName,
        label: `${cat.name} (${stay.ownerName})`,
        searchText: normalizeSearchText(cat.name),
      });
    });
  });

  return [...optionsByCatId.values()].sort((firstOption, secondOption) =>
    firstOption.label.localeCompare(secondOption.label, 'es'),
  );
}

export function getStayOwnerFilterOptions(stays: Stay[]): StayOwnerFilterOption[] {
  const ownersById = new Map<
    string,
    {
      ownerId: string;
      ownerName: string;
      catNames: Set<string>;
    }
  >();

  stays.forEach((stay) => {
    const owner = ownersById.get(stay.ownerId) ?? {
      ownerId: stay.ownerId,
      ownerName: stay.ownerName,
      catNames: new Set<string>(),
    };

    stay.cats.forEach((cat) => owner.catNames.add(cat.name));
    ownersById.set(stay.ownerId, owner);
  });

  return [...ownersById.values()]
    .map((owner) => {
      const catNames = [...owner.catNames].sort((firstName, secondName) =>
        firstName.localeCompare(secondName, 'es'),
      );

      return {
        ownerId: owner.ownerId,
        ownerName: owner.ownerName,
        catNames,
        label: `${owner.ownerName} (${catNames.join(', ')})`,
        searchText: normalizeSearchText(`${owner.ownerName} ${catNames.join(' ')}`),
      };
    })
    .sort((firstOption, secondOption) => firstOption.label.localeCompare(secondOption.label, 'es'));
}

export function isStayVisibleBySearchFilters(stay: Stay, filters: StaySearchFilters): boolean {
  if (filters.catId) {
    return stay.cats.some((cat) => cat.catId === filters.catId);
  }

  if (filters.ownerId) {
    return stay.ownerId === filters.ownerId;
  }

  return true;
}

export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('es-ES')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function hasActiveStayEntityFilter(filters: StaySearchFilters): boolean {
  return Boolean(filters.catId || filters.ownerId);
}
