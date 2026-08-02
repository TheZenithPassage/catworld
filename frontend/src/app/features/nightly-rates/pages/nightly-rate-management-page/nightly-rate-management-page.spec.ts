import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { NightlyReferenceRateApiService } from '../../services/nightly-reference-rate-api.service';
import { NightlyRateManagementPage } from './nightly-rate-management-page';

const currentRates = [
  { minimumCatCount: 1 as const, nightlyRate: 45 },
  { minimumCatCount: 2 as const, nightlyRate: null },
  { minimumCatCount: 3 as const, nightlyRate: '90' },
];

describe('NightlyRateManagementPage', () => {
  let fixture: ComponentFixture<NightlyRateManagementPage>;
  let component: NightlyRateManagementPage;
  let api: {
    getCurrentRates: ReturnType<typeof vi.fn>;
    configureRate: ReturnType<typeof vi.fn>;
    clearRate: ReturnType<typeof vi.fn>;
  };
  let auth: AuthSessionService;

  async function create(role: 'ADMIN' | 'STAFF' = 'ADMIN'): Promise<void> {
    localStorage.setItem('catworld.language', 'en');
    api = {
      getCurrentRates: vi.fn().mockReturnValue(of(currentRates)),
      configureRate: vi.fn().mockReturnValue(of(currentRates[0])),
      clearRate: vi.fn().mockReturnValue(of(undefined)),
    };
    await TestBed.configureTestingModule({
      imports: [NightlyRateManagementPage],
      providers: [
        provideNoopAnimations(),
        { provide: NightlyReferenceRateApiService, useValue: api },
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
    expect(text).toContain('One cat');
    expect(text).toContain('Two cats');
    expect(text).toContain('Three or more cats');
    expect(text).not.toContain('Exactly three cats');
    expect(text).toContain('45');
    expect(text).toContain('Temporarily unavailable');
    expect(text).toContain('not a per-cat amount');
  });

  it('keeps STAFF read-only while preserving all categories', async () => {
    await create('STAFF');
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('mat-card').length).toBe(3);
    expect(root.querySelector('input')).toBeNull();
    expect(root.querySelector('.rate-actions')).toBeNull();
  });

  it('shows ADMIN mutation controls for configured and unavailable categories', async () => {
    await create();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('input').length).toBe(3);
    expect(root.textContent).toContain('Change');
    expect(root.textContent).toContain('Configure');
    expect(root.textContent).toContain('Clear rate');
  });

  it.each(['', '0', '-1', '1.5', 'letters', '12345678901234567890'])(
    'blocks invalid entry %s without an API call',
    async (value) => {
      await create();
      component.setEntry(1, value);
      component.save(1);
      fixture.detectChanges();
      expect(api.configureRate).not.toHaveBeenCalled();
      expect((fixture.nativeElement as HTMLElement).querySelector('.field-error')).not.toBeNull();
    },
  );

  it('preserves a 19-digit value and reloads the complete set after configure success', async () => {
    await create();
    component.setEntry(3, '9999999999999999999');
    component.save(3);
    expect(api.configureRate).toHaveBeenCalledWith(3, '9999999999999999999');
    expect(api.getCurrentRates).toHaveBeenCalledTimes(2);
  });

  it('clears one category and reloads the complete set', async () => {
    await create();
    component.clear(1);
    expect(api.clearRate).toHaveBeenCalledWith(1);
    expect(api.getCurrentRates).toHaveBeenCalledTimes(2);
  });

  it('prevents duplicate mutation while one request is pending', async () => {
    await create();
    const response = new BehaviorSubject(currentRates[0]);
    api.configureRate.mockReturnValue(response);
    component.setEntry(1, '50');
    component.save(1);
    component.save(1);
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
    component.setEntry(2, '75');
    component.save(2);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(message);
    expect(component.entry(2)).toBe('75');
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
