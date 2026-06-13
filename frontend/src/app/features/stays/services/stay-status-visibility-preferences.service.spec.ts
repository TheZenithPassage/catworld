import { getDefaultStayStatusVisibility, StayStatusVisibility } from '../utils/stay-status.util';

import { StayStatusVisibilityPreferencesService } from './stay-status-visibility-preferences.service';

describe('StayStatusVisibilityPreferencesService', () => {
  const storageKey = 'catworld.stay.statusVisibility';

  let service: StayStatusVisibilityPreferencesService;

  beforeEach(() => {
    localStorage.clear();
    service = new StayStatusVisibilityPreferencesService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns default visibility when no preference is stored', () => {
    expect(service.read()).toEqual(getDefaultStayStatusVisibility());
  });

  it('reads stored visibility preferences', () => {
    const storedVisibility: StayStatusVisibility = {
      reserved: true,
      'checked-in': false,
      'checked-out': true,
      cancelled: false,
    };

    localStorage.setItem(storageKey, JSON.stringify(storedVisibility));

    expect(service.read()).toEqual(storedVisibility);
  });

  it('falls back to defaults when stored value is not valid JSON', () => {
    localStorage.setItem(storageKey, '{invalid-json');

    expect(service.read()).toEqual(getDefaultStayStatusVisibility());
  });

  it('ignores invalid stored status values and keeps valid ones', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        reserved: false,
        'checked-in': 'no',
        'checked-out': true,
        cancelled: null,
      }),
    );

    expect(service.read()).toEqual({
      ...getDefaultStayStatusVisibility(),
      reserved: false,
      'checked-out': true,
    });
  });

  it('stores visibility preferences', () => {
    const visibility: StayStatusVisibility = {
      reserved: false,
      'checked-in': true,
      'checked-out': false,
      cancelled: true,
    };

    service.store(visibility);

    expect(JSON.parse(localStorage.getItem(storageKey) ?? '{}')).toEqual(visibility);
  });
});
