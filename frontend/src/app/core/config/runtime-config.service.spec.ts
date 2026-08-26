import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { RuntimeConfigService } from './runtime-config.service';

interface BrowserHarness {
  document: Document;
  documentEvents: EventTarget;
  reload: ReturnType<typeof vi.fn>;
  setVisibility(state: DocumentVisibilityState): void;
  windowEvents: EventTarget;
}

function createBrowserHarness(): BrowserHarness {
  const reload = vi.fn();
  const windowEvents = new EventTarget();
  const documentEvents = new EventTarget();
  let visibilityState: DocumentVisibilityState = 'visible';

  Object.defineProperty(windowEvents, 'location', {
    value: { reload },
  });
  Object.defineProperties(documentEvents, {
    defaultView: { value: windowEvents },
    visibilityState: { get: () => visibilityState },
  });

  return {
    document: documentEvents as Document,
    documentEvents,
    reload,
    setVisibility: (state) => {
      visibilityState = state;
    },
    windowEvents,
  };
}

function configResponse(config: Record<string, unknown>): Response {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue(config),
  } as unknown as Response;
}

async function finishPendingPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('RuntimeConfigService', () => {
  let browser: BrowserHarness;
  let fetchMock: ReturnType<typeof vi.fn>;
  let service: RuntimeConfigService;

  beforeEach(() => {
    browser = createBrowserHarness();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: browser.document }],
    });
    service = TestBed.inject(RuntimeConfigService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('applies the business timezone and remembers the initial build identity', async () => {
    fetchMock
      .mockResolvedValueOnce(
        configResponse({ businessTimeZone: 'Europe/Madrid', buildId: 'build-a' }),
      )
      .mockResolvedValueOnce(
        configResponse({ businessTimeZone: 'Europe/Madrid', buildId: 'build-b' }),
      );

    await service.load();
    browser.windowEvents.dispatchEvent(new Event('pageshow'));
    await finishPendingPromises();

    expect(service.businessTimeZone()).toBe('Europe/Madrid');
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/runtime-config.json', {
      cache: 'no-store',
    });
    expect(browser.reload).toHaveBeenCalledOnce();
  });

  it('does not reload when the deployed build is unchanged', async () => {
    fetchMock
      .mockResolvedValueOnce(
        configResponse({ businessTimeZone: 'Europe/Madrid', buildId: 'build-a' }),
      )
      .mockResolvedValueOnce(
        configResponse({ businessTimeZone: 'Europe/Madrid', buildId: 'build-a' }),
      );

    await service.load();
    browser.windowEvents.dispatchEvent(new Event('pageshow'));
    await finishPendingPromises();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(browser.reload).not.toHaveBeenCalled();
  });

  it('reloads exactly once when a visible tab detects a different build', async () => {
    fetchMock
      .mockResolvedValueOnce(
        configResponse({ businessTimeZone: 'Europe/Madrid', buildId: 'build-a' }),
      )
      .mockResolvedValueOnce(
        configResponse({ businessTimeZone: 'Europe/Madrid', buildId: 'build-b' }),
      );

    await service.load();
    browser.documentEvents.dispatchEvent(new Event('visibilitychange'));
    await finishPendingPromises();

    browser.windowEvents.dispatchEvent(new Event('pageshow'));
    browser.documentEvents.dispatchEvent(new Event('visibilitychange'));
    await finishPendingPromises();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(browser.reload).toHaveBeenCalledOnce();
  });

  it('keeps running after a failed check and allows a later activation to retry', async () => {
    fetchMock
      .mockResolvedValueOnce(
        configResponse({ businessTimeZone: 'Europe/Madrid', buildId: 'build-a' }),
      )
      .mockRejectedValueOnce(new TypeError('network unavailable'))
      .mockResolvedValueOnce(
        configResponse({ businessTimeZone: 'Europe/Madrid', buildId: 'build-b' }),
      );

    await service.load();
    browser.windowEvents.dispatchEvent(new Event('pageshow'));
    await finishPendingPromises();

    expect(service.businessTimeZone()).toBe('Europe/Madrid');
    expect(browser.reload).not.toHaveBeenCalled();

    browser.windowEvents.dispatchEvent(new Event('pageshow'));
    await finishPendingPromises();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(browser.reload).toHaveBeenCalledOnce();
  });

  it('keeps timezone behavior but disables build checks when buildId is missing', async () => {
    fetchMock.mockResolvedValueOnce(configResponse({ businessTimeZone: 'Europe/Madrid' }));

    await service.load();
    browser.windowEvents.dispatchEvent(new Event('pageshow'));
    browser.documentEvents.dispatchEvent(new Event('visibilitychange'));
    await finishPendingPromises();

    expect(service.businessTimeZone()).toBe('Europe/Madrid');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(browser.reload).not.toHaveBeenCalled();
  });

  it('coalesces overlapping lifecycle events into one build check', async () => {
    let resolveBuildCheck: ((response: Response) => void) | undefined;
    const pendingBuildCheck = new Promise<Response>((resolve) => {
      resolveBuildCheck = resolve;
    });
    fetchMock
      .mockResolvedValueOnce(
        configResponse({ businessTimeZone: 'Europe/Madrid', buildId: 'build-a' }),
      )
      .mockReturnValueOnce(pendingBuildCheck);

    await service.load();
    browser.windowEvents.dispatchEvent(new Event('pageshow'));
    browser.documentEvents.dispatchEvent(new Event('visibilitychange'));

    expect(fetchMock).toHaveBeenCalledTimes(2);

    resolveBuildCheck?.(configResponse({ businessTimeZone: 'Europe/Madrid', buildId: 'build-b' }));
    await finishPendingPromises();

    expect(browser.reload).toHaveBeenCalledOnce();
  });

  it('checks visibility changes only when the tab becomes visible', async () => {
    fetchMock
      .mockResolvedValueOnce(
        configResponse({ businessTimeZone: 'Europe/Madrid', buildId: 'build-a' }),
      )
      .mockResolvedValueOnce(
        configResponse({ businessTimeZone: 'Europe/Madrid', buildId: 'build-a' }),
      );

    await service.load();
    browser.setVisibility('hidden');
    browser.documentEvents.dispatchEvent(new Event('visibilitychange'));
    await finishPendingPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    browser.setVisibility('visible');
    browser.documentEvents.dispatchEvent(new Event('visibilitychange'));
    await finishPendingPromises();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(browser.reload).not.toHaveBeenCalled();
  });
});
