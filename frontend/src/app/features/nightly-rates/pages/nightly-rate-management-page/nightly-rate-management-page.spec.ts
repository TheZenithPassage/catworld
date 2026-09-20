import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { NightlyReferenceRateApiService } from '../../services/nightly-reference-rate-api.service';
import { TransferRateApiService } from '../../services/transfer-rate-api.service';
import { NightlyRateManagementPage } from './nightly-rate-management-page';

const currentRates = [
  { key: 'ONE_CAT', nightlyRate: '45' },
  { key: 'ONE_CAT_7_TO_14', nightlyRate: null },
  { key: 'ONE_CAT_15_TO_29', nightlyRate: '40' },
  { key: 'ONE_CAT_30_PLUS', nightlyRate: null },
  { key: 'TWO_CATS', nightlyRate: '70' },
  { key: 'THREE_PLUS_CATS', nightlyRate: '90' },
] as const;

describe('NightlyRateManagementPage', () => {
  let fixture: ComponentFixture<NightlyRateManagementPage>;
  let component: NightlyRateManagementPage;
  let api: {
    getCurrentRates: ReturnType<typeof vi.fn>;
    configureRate: ReturnType<typeof vi.fn>;
    clearRate: ReturnType<typeof vi.fn>;
  };
  let auth: AuthSessionService;
  let transferApi: {
    getCurrentRate: ReturnType<typeof vi.fn>;
    configureRate: ReturnType<typeof vi.fn>;
    clearRate: ReturnType<typeof vi.fn>;
  };

  async function create(
    role: 'ADMIN' | 'STAFF' = 'ADMIN',
    rates: unknown = currentRates,
  ): Promise<void> {
    localStorage.setItem('catworld.language', 'en');
    api = {
      getCurrentRates: vi.fn().mockReturnValue(of(rates)),
      configureRate: vi.fn().mockReturnValue(of(currentRates[0])),
      clearRate: vi.fn().mockReturnValue(of(undefined)),
    };
    transferApi = {
      getCurrentRate: vi.fn().mockReturnValue(of({ transferRate: null })),
      configureRate: vi.fn().mockReturnValue(of({ transferRate: '25' })),
      clearRate: vi.fn().mockReturnValue(of(undefined)),
    };
    await TestBed.configureTestingModule({
      imports: [NightlyRateManagementPage],
      providers: [
        provideNoopAnimations(),
        { provide: NightlyReferenceRateApiService, useValue: api },
        { provide: TransferRateApiService, useValue: transferApi },
      ],
    }).compileComponents();
    auth = TestBed.inject(AuthSessionService);
    auth.login({ username: role.toLowerCase(), role }, { username: role, password: 'secret' });
    fixture = TestBed.createComponent(NightlyRateManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('renders exact categories, configured values, unavailable state, and whole-stay meaning', async () => {
    await create('STAFF');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('One cat — under 7 nights');
    expect(text).toContain('One cat — 7–14 nights');
    expect(text).toContain('One cat — 15–29 nights');
    expect(text).toContain('One cat — 30+ nights');
    expect(text).toContain('Two cats');
    expect(text).toContain('Three or more cats');
    expect(text).not.toContain('Exactly three cats');
    expect(text).toContain('45');
    expect(text).toContain('Temporarily unavailable');
    expect(text).toContain('not a per-cat amount');
    expect(text).not.toContain('Amount for each arrival or departure leg.');
  });

  it('keeps STAFF read-only while preserving all categories', async () => {
    await create('STAFF');
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('mat-card').length).toBe(7);
    expect(root.textContent).toContain('Transfer assistance');
    expect(root.querySelector('input')).toBeNull();
    expect(root.querySelector('.rate-actions')).toBeNull();
  });

  it('shows ADMIN mutation controls for configured and unavailable categories', async () => {
    await create();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('mat-card').length).toBe(7);
    expect(root.querySelectorAll('input[id^="nightly-rate-"]').length).toBe(6);
    expect(root.querySelector('#nightly-rate-ONE_CAT_15_TO_29')).not.toBeNull();
    expect(root.textContent).toContain('Transfer assistance');
    expect(root.textContent).toContain('Change');
    expect(root.textContent).toContain('Configure');
    expect(root.textContent).toContain('Clear rate');
  });

  it.each([
    ['an incomplete response', currentRates.slice(0, -1)],
    ['a response with duplicate keys', [...currentRates, currentRates[0]]],
  ])('rejects %s', async (_description, rates) => {
    await create('STAFF', rates);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('The current nightly rates could not be loaded.');
    expect(root.querySelector('.rate-grid')).toBeNull();
  });

  it.each(['', '0', '-1', '1.5', 'letters', '12345678901234567890'])(
    'blocks invalid entry %s without an API call',
    async (value) => {
      await create();
      component.setEntry('ONE_CAT', value);
      component.save('ONE_CAT');
      fixture.detectChanges();
      expect(api.configureRate).not.toHaveBeenCalled();
      expect((fixture.nativeElement as HTMLElement).querySelector('.field-error')).not.toBeNull();
    },
  );

  it('preserves and submits a 19-digit entry unchanged', async () => {
    await create();
    component.setEntry('ONE_CAT_15_TO_29', '9999999999999999999');
    component.save('ONE_CAT_15_TO_29');
    expect(api.configureRate).toHaveBeenCalledWith('ONE_CAT_15_TO_29', '9999999999999999999');
    expect(api.getCurrentRates).toHaveBeenCalledTimes(2);
  });

  it('updates an active field-validation error when the language changes', async () => {
    await create();
    component.setEntry('ONE_CAT', '0');
    component.save('ONE_CAT');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'The amount must be a positive whole number without decimals.',
    );

    TestBed.inject(I18nService).toggleLanguage();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'El importe debe ser un número entero positivo sin decimales.',
    );
  });

  it('clears one category and reloads the complete set', async () => {
    await create();
    component.clear('ONE_CAT');
    expect(api.clearRate).toHaveBeenCalledWith('ONE_CAT');
    expect(api.getCurrentRates).toHaveBeenCalledTimes(2);
  });

  it('prevents duplicate mutation while one request is pending', async () => {
    await create();
    const response = new BehaviorSubject(currentRates[0]);
    api.configureRate.mockReturnValue(response);
    component.setEntry('ONE_CAT', '50');
    component.save('ONE_CAT');
    component.save('ONE_CAT');
    expect(api.configureRate).toHaveBeenCalledTimes(1);
  });

  it.each([
    [400, 'server rejected'],
    [403, 'no longer have permission'],
  ])('shows backend status %i visibly and preserves the entered value', async (status, message) => {
    await create();
    api.configureRate.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: Number(status) })),
    );
    component.setEntry('TWO_CATS', '75');
    component.save('TWO_CATS');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(message);
    expect(component.entry('TWO_CATS')).toBe('75');
  });

  it('renders load failure and retries', async () => {
    await create();
    api.getCurrentRates.mockReturnValueOnce(throwError(() => new Error('offline')));
    component.loadRates();
    fixture.detectChanges();
    const retry = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Retry'));
    expect(retry).toBeDefined();
    api.getCurrentRates.mockReturnValueOnce(of(currentRates));
    retry?.click();
    expect(api.getCurrentRates).toHaveBeenCalledTimes(3);
  });
});
