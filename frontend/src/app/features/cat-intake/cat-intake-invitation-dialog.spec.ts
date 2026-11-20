import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { I18nService } from '../../core/i18n/i18n.service';
import { CatIntakeInvitationDialog } from './cat-intake-invitation-dialog';

describe('CatIntakeInvitationDialog', () => {
  it('generates one link for the household and sends the arrival and new-cat choice', () => {
    TestBed.configureTestingModule({
      imports: [CatIntakeInvitationDialog],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: { ownerId: 'owner-1', ownerName: 'Ana', stayId: 'stay-1' },
        },
        { provide: MatDialogRef, useValue: {} },
      ],
    });
    TestBed.inject(I18nService).language.set('es');
    const fixture = TestBed.createComponent(CatIntakeInvitationDialog);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/owners/owner-1/lookup').flush({
      id: 'owner-1',
      fullName: 'Ana',
      currentCats: [
        { id: 'cat-1', name: 'Milo', deceased: false },
        { id: 'cat-2', name: 'Luna', deceased: true },
      ],
    });
    http.expectOne('/api/cat-intake/invitations/active?ownerId=owner-1').flush(null);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Milo');
    expect(root.textContent).not.toContain('Luna');
    const checkboxes = root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(1);
    expect(checkboxes[0].checked).toBe(false);
    checkboxes[0].click();
    fixture.detectChanges();

    root.querySelector<HTMLButtonElement>('button[mat-flat-button]')!.click();
    const request = http.expectOne({ method: 'POST', url: '/api/cat-intake/invitations' });
    expect(request.request.body).toEqual({
      ownerId: 'owner-1',
      stayId: 'stay-1',
      allowNewCats: true,
    });
    request.flush({
      id: 'invite-1',
      url: 'https://fichas.catworld.com.ar/#private',
      expiresAt: '2026-11-26T13:00:00Z',
    });
    fixture.detectChanges();
    expect(root.querySelector<HTMLInputElement>('input[readonly]')?.value).toBe(
      'https://fichas.catworld.com.ar/#private',
    );
    http.verify();
  });
});
