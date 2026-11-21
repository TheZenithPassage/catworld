import { describe, expect, it } from 'vitest';
import { catLitterChoice, catLitterLabel, catOwnLitterDetail } from './cat-litter-label';

describe('cat litter values', () => {
  it('displays historical text as the detail for personal litter', () => {
    const labels = { ownLitter: 'Personal', sharedLitter: 'CatWorld', unconfirmedLitter: 'Pending' };

    expect(catLitterChoice('Clay')).toBe('own');
    expect(catOwnLitterDetail('Clay')).toBe('Clay');
    expect(catLitterLabel('Clay', labels)).toBe('Personal · Clay');
    expect(catLitterLabel('Trae sus propias piedritas', labels)).toBe('Personal');
    expect(catLitterLabel('Usa las de CatWorld', labels)).toBe('CatWorld');
    expect(catLitterLabel(null, labels)).toBe('Pending');
  });
});
