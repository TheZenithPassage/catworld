import { TestBed } from '@angular/core/testing';

import { OwnerApiService } from '../../features/owners/services/owner-api.service';
import { OwnerLookupAdapter } from './domain-lookup.adapters';

describe('OwnerLookupAdapter', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: OwnerApiService, useValue: {} }],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('keeps all current Cats in the selected input presentation', () => {
    const adapter = TestBed.inject(OwnerLookupAdapter);

    expect(
      adapter.present({
        id: 'owner-1',
        fullName: 'Ada Lovelace',
        currentCats: [
          { id: 'cat-1', name: 'Milo' },
          { id: 'cat-2', name: 'Pixel' },
        ],
      }),
    ).toEqual({
      primary: 'Ada Lovelace',
      secondary: 'Milo, Pixel',
      selected: 'Ada Lovelace (Milo, Pixel)',
    });
    expect(
      adapter.present({ id: 'owner-2', fullName: 'Grace Hopper', currentCats: [] }).selected,
    ).toBe('Grace Hopper');
  });
});
