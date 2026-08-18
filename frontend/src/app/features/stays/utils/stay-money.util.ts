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

export function multiplyWholeMoney(value: string, multiplier: number): string | null {
  if (!isValidWholeMoney(value) || !Number.isSafeInteger(multiplier) || multiplier < 0) {
    return null;
  }

  const product = (BigInt(value) * BigInt(multiplier)).toString();
  return product.length <= 19 ? product : null;
}

function canonicalWholeMoney(value: string): string {
  return value.replace(/^0+(?=\d)/, '');
}
