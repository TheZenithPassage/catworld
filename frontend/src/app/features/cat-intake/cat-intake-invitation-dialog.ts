import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { forkJoin } from 'rxjs';

import { I18nService } from '../../core/i18n/i18n.service';
import { CAT_INTAKE_TRANSLATIONS } from '../../core/i18n/translations/cat-intake.translations';
import { BusinessTimeService } from '../../core/time/business-time.service';
import { OwnerLookupCat } from '../owners/models/owner.model';
import { OwnerApiService } from '../owners/services/owner-api.service';
import { CatIntakeApi } from './cat-intake-api';
import { ActiveCatIntakeInvitation } from './cat-intake-models';

export interface CatIntakeInvitationDialogData {
  ownerId: string;
  ownerName: string;
}

@Component({
  selector: 'app-cat-intake-invitation-dialog',
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  templateUrl: './cat-intake-invitation-dialog.html',
  styleUrl: './cat-intake-invitation-dialog.scss',
})
export class CatIntakeInvitationDialog {
  private readonly intake = inject(CatIntakeApi);
  private readonly owners = inject(OwnerApiService);
  private readonly i18n = inject(I18nService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ref = inject(MatDialogRef<CatIntakeInvitationDialog>);

  readonly data = inject<CatIntakeInvitationDialogData>(MAT_DIALOG_DATA);
  readonly copy = computed(() => CAT_INTAKE_TRANSLATIONS[this.i18n.language()].invite);
  readonly cats = signal<OwnerLookupCat[]>([]);
  readonly catIds = signal<string[]>([]);
  readonly allowNewCats = signal(false);
  readonly active = signal<ActiveCatIntakeInvitation | null>(null);
  readonly link = signal<string | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly feedback = signal<
    'loadFailed' | 'issueFailed' | 'revokeFailed' | 'copied' | 'copyFailed' | null
  >(null);
  readonly atLimit = computed(() => this.catIds().length >= 20);
  readonly canIssue = computed(
    () => !this.busy() && (this.allowNewCats() || this.catIds().length > 0),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.feedback.set(null);
    forkJoin({
      owner: this.owners.getOwnerLookup(this.data.ownerId),
      active: this.intake.getActiveInvitation(this.data.ownerId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ owner, active }) => {
          this.cats.set(owner.currentCats);
          this.active.set(active);
          this.allowNewCats.set(active?.allowNewCats ?? owner.currentCats.length === 0);
          this.catIds.set(
            owner.currentCats.filter((cat) => active?.catIds.includes(cat.id)).map((cat) => cat.id),
          );
          this.loading.set(false);
        },
        error: () => {
          this.feedback.set('loadFailed');
          this.loading.set(false);
        },
      });
  }

  selectCat(id: string, selected: boolean): void {
    if (selected) {
      if (!this.atLimit() && !this.catIds().includes(id)) this.catIds.update((ids) => [...ids, id]);
    } else {
      this.catIds.update((ids) => ids.filter((catId) => catId !== id));
    }
  }

  issue(): void {
    if (!this.canIssue()) return;
    const request = {
      ownerId: this.data.ownerId,
      catIds: this.catIds(),
      allowNewCats: this.allowNewCats(),
    };
    this.setBusy(true);
    this.feedback.set(null);
    this.intake
      .issueInvitation(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ id, url, expiresAt }) => {
          this.active.set({ ...request, id, expiresAt });
          this.link.set(url);
          this.setBusy(false);
        },
        error: () => {
          this.feedback.set('issueFailed');
          this.setBusy(false);
        },
      });
  }

  revoke(): void {
    const active = this.active();
    if (!active || this.busy()) return;
    this.setBusy(true);
    this.feedback.set(null);
    this.intake
      .revokeInvitation(active.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.active.set(null);
          this.link.set(null);
          this.setBusy(false);
        },
        error: () => {
          this.feedback.set('revokeFailed');
          this.setBusy(false);
        },
      });
  }

  async copyLink(input: HTMLInputElement): Promise<void> {
    const link = this.link();
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      this.feedback.set('copied');
    } catch {
      input.focus();
      input.select();
      this.feedback.set('copyFailed');
    }
  }

  displayInstant(value: string): string {
    return this.businessTime.formatInstant(value, this.i18n.dateLocale());
  }

  private setBusy(value: boolean): void {
    this.busy.set(value);
    this.ref.disableClose = value;
  }
}
