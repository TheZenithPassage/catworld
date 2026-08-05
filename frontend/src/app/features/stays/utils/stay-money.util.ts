export function isValidWholeMoney(value: string): boolean {
  if (!/^\d+$/.test(value)) {
    return false;
  }

  return canonicalWholeMoney(value).length <= 19;
}

export function sameWholeMoney(first: string, second: string): boolean {
  return (
    isValidWholeMoney(first) &&
    isValidWholeMoney(second) &&
    canonicalWholeMoney(first) === canonicalWholeMoney(second)
  );
}

function canonicalWholeMoney(value: string): string {
  return value.replace(/^0+(?=\d)/, '');
}
