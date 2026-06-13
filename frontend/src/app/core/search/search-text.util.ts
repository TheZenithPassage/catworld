export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchesSearchText(
  values: Array<string | null | undefined>,
  searchText: string,
): boolean {
  const normalizedSearchText = normalizeSearchText(searchText);

  if (!normalizedSearchText) {
    return true;
  }

  return values.some((value) => normalizeSearchText(value).includes(normalizedSearchText));
}
