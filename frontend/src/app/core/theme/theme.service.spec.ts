import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

// The CI runner uses jsdom in Node. Read the real initializer, not a copied policy.
const { readFileSync } = await vi.importActual<{
  readFileSync(path: string, encoding: 'utf8'): string;
}>('node:fs');
const indexHtml = readFileSync('src/index.html', 'utf8');
const initializer = indexHtml.match(/<script id="catworld-theme-init">([\s\S]*?)<\/script>/)![1];

describe('ThemeService and first-paint initialization', () => {
  let media: MediaQueryList;
  let changeListener: ((event: MediaQueryListEvent) => void) | undefined;

  function systemTheme(dark: boolean): void {
    Object.defineProperty(media, 'matches', { value: dark, configurable: true });
    changeListener?.({ matches: dark } as MediaQueryListEvent);
  }

  function initializeBeforeAngular(): string | undefined {
    new Function('document', 'localStorage', 'matchMedia', initializer)(
      document,
      localStorage,
      window.matchMedia,
    );
    return document.documentElement.dataset['theme'];
  }

  beforeEach(() => {
    localStorage.removeItem('catworld.theme');
    delete document.documentElement.dataset['theme'];
    document.documentElement.style.colorScheme = '';
    changeListener = undefined;
    media = {
      matches: false,
      addEventListener: vi.fn((_type, listener) => {
        changeListener = listener;
      }),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => media),
    );
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.removeItem('catworld.theme');
    delete document.documentElement.dataset['theme'];
    document.documentElement.style.colorScheme = '';
  });

  it.each([
    { stored: 'light', systemDark: true, expected: 'light' },
    { stored: 'dark', systemDark: false, expected: 'dark' },
    { stored: null, systemDark: true, expected: 'dark' },
    { stored: null, systemDark: false, expected: 'light' },
    { stored: 'invalid', systemDark: true, expected: 'dark' },
    { stored: 'invalid', systemDark: false, expected: 'light' },
    { stored: '', systemDark: true, expected: 'dark' },
  ])(
    'resolves $stored with systemDark=$systemDark consistently',
    ({ stored, systemDark, expected }) => {
      if (stored !== null) localStorage.setItem('catworld.theme', stored);
      systemTheme(systemDark);
      const write = vi.spyOn(Storage.prototype, 'setItem');

      expect(initializeBeforeAngular()).toBe(expected);
      const service = TestBed.inject(ThemeService);

      expect(service.theme()).toBe(expected);
      expect(document.documentElement.dataset['theme']).toBe(expected);
      expect(document.documentElement.style.colorScheme).toBe(expected);
      expect(write).not.toHaveBeenCalled();
    },
  );

  it('runs the first-paint initializer in the head before the application', () => {
    expect(indexHtml.indexOf('id="catworld-theme-init"')).toBeLessThan(
      indexHtml.indexOf('</head>'),
    );
    expect(indexHtml.indexOf('</head>')).toBeLessThan(indexHtml.indexOf('<app-root>'));
  });

  it('follows live OS changes until an explicit choice is made, without persisting an inferred theme', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const service = TestBed.inject(ThemeService);

    systemTheme(true);
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    systemTheme(false);
    expect(service.theme()).toBe('light');
    expect(write).not.toHaveBeenCalled();

    // Explicitly selecting the currently resolved theme must still override the OS.
    service.setTheme('light');
    systemTheme(true);
    expect(service.theme()).toBe('light');
    expect(localStorage.getItem('catworld.theme')).toBe('light');
  });

  it('restores a user choice across a new page/service instance', () => {
    TestBed.inject(ThemeService).setTheme('dark');
    TestBed.resetTestingModule();
    delete document.documentElement.dataset['theme'];

    expect(initializeBeforeAngular()).toBe('dark');
    expect(TestBed.inject(ThemeService).theme()).toBe('dark');
  });

  it('continues following the OS when the stored value is invalid', () => {
    localStorage.setItem('catworld.theme', 'sepia');
    const service = TestBed.inject(ThemeService);
    systemTheme(true);
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem('catworld.theme')).toBe('sepia');
  });

  it('tolerates failed reads and writes and retains an explicit in-memory override', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    systemTheme(true);
    expect(initializeBeforeAngular()).toBe('dark');
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
    expect(() => service.setTheme('light')).not.toThrow();
    systemTheme(false);
    systemTheme(true);
    expect(service.theme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it.each(['missing', 'throwing'])(
    'uses light without persisting when system detection is %s',
    (failure) => {
      vi.stubGlobal(
        'matchMedia',
        failure === 'missing'
          ? undefined
          : () => {
              throw new Error('Unavailable');
            },
      );
      const write = vi.spyOn(Storage.prototype, 'setItem');

      expect(initializeBeforeAngular()).toBe('light');
      const service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('light');
      expect(write).not.toHaveBeenCalled();
      service.setTheme('dark');
      expect(service.theme()).toBe('dark');
    },
  );

  it('removes its OS listener on destruction', () => {
    TestBed.inject(ThemeService);
    const listener = changeListener;
    TestBed.resetTestingModule();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', listener);
  });
});
