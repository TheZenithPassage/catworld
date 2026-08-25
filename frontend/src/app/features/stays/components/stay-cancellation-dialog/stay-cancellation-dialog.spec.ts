import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { StayApiService } from '../../services/stay-api.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { StayCancellationDialog, StayCancellationDialogData } from './stay-cancellation-dialog';

describe('StayCancellationDialog', () => {
  const data: StayCancellationDialogData = {
    stayId: 'stay-1',
    catNames: ['Milo', 'Nina'],
    ownerName: 'Ada Lovelace',
    startAt: '2030-01-01T10:00:00',
    endAt: '2030-01-03T10:00:00',
  };
  const api = { cancelStay: vi.fn() };
  const dialogRef = { close: vi.fn(), disableClose: false };

  beforeEach(() => {
    vi.clearAllMocks();
    dialogRef.disableClose = false;
  });

  afterEach(() => TestBed.resetTestingModule());

  async function render() {
    await TestBed.configureTestingModule({
      imports: [StayCancellationDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: StayApiService, useValue: api },
      ],
    }).compileComponents();
    TestBed.inject(I18nService).language.set('en');
    const fixture = TestBed.createComponent(StayCancellationDialog);
    fixture.detectChanges();
    return fixture;
  }

  it('dismisses without sending a cancellation request', async () => {
    const fixture = await render();

    fixture.debugElement.queryAll(By.css('button'))[0].nativeElement.click();

    expect(api.cancelStay).not.toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
    expect(fixture.nativeElement.textContent).toContain('Milo, Nina (Ada Lovelace)');
    expect(fixture.nativeElement.textContent).toContain('distinct from permanent deletion');
  });

  it('locks duplicate submission and closes positively only after success', async () => {
    const pending = new Subject<void>();
    api.cancelStay.mockReturnValue(pending);
    const fixture = await render();
    const confirm = fixture.debugElement.queryAll(By.css('button'))[1].nativeElement;

    confirm.click();
    confirm.click();
    fixture.detectChanges();

    expect(api.cancelStay).toHaveBeenCalledTimes(1);
    expect(api.cancelStay).toHaveBeenCalledWith('stay-1');
    expect(dialogRef.disableClose).toBe(true);
    expect(confirm.disabled).toBe(true);
    expect(dialogRef.close).not.toHaveBeenCalled();

    pending.next();
    pending.complete();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('keeps a failed cancellation open and retryable', async () => {
    api.cancelStay.mockReturnValueOnce(throwError(() => new Error('failed')));
    const fixture = await render();
    const confirm = fixture.debugElement.queryAll(By.css('button'))[1].nativeElement;

    confirm.click();
    fixture.detectChanges();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(dialogRef.disableClose).toBe(false);
    expect(confirm.disabled).toBe(false);
    expect(confirm.textContent).toContain('Retry cancellation');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'could not be cancelled',
    );
  });
});
