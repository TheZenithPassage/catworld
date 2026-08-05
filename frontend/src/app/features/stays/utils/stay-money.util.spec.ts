import { describe, expect, it } from 'vitest';

import { isValidWholeMoney, sameWholeMoney } from './stay-money.util';

describe('stay money utilities', () => {
  it.each(['0', '000', '9999999999999999999'])('accepts exact whole money %s', (value) => {
    expect(isValidWholeMoney(value)).toBe(true);
  });

  it.each(['', '-1', '1.5', '10000000000000000000'])('rejects unsupported money %s', (value) => {
    expect(isValidWholeMoney(value)).toBe(false);
  });

  it('compares numeric equality without converting through number', () => {
    expect(sameWholeMoney('0009999999999999999999', '9999999999999999999')).toBe(true);
    expect(sameWholeMoney('9999999999999999998', '9999999999999999999')).toBe(false);
  });
});
