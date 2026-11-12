import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { I18nService } from '../../core/i18n/i18n.service';
import { CARE_TRANSLATIONS } from '../../core/i18n/translations/care.translations';
import { UiStateComponent } from '../../shared/ui-state/ui-state';
import { CareApiService } from './care-api.service';
import { CareMode, CareRoutine } from './care.models';

@Component({
  selector: 'app-care-routines-page',
  imports: [FormsModule, MatButton, MatFormField, MatInput, MatLabel, RouterLink, UiStateComponent],
  templateUrl: './care-routines-page.html',
  styleUrl: './care.scss',
})
export class CareRoutinesPage {
  private readonly api = inject(CareApiService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly nameField = viewChild<ElementRef<HTMLInputElement>>('nameField');
  private initialName = '';

  readonly text = computed(() => CARE_TRANSLATIONS[this.i18n.language()]);
  readonly routines = signal<CareRoutine[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly saving = signal(false);
  readonly saveFailed = signal(false);
  readonly editing = signal<CareRoutine | null>(null);
  readonly confirming = signal<string | null>(null);
  readonly name = signal('');
  readonly mode = signal<CareMode>('DAILY');
  readonly modes: CareMode[] = ['DAILY', 'SHIFT', 'EVENT'];

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api
      .listRoutines()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (routines) => this.routines.set(routines),
        error: () => this.loadFailed.set(true),
      });
  }

  label(routine: CareRoutine): string {
    return routine.seedKey ? this.text().seeds[routine.seedKey] : routine.name;
  }

  edit(routine: CareRoutine): void {
    this.saveFailed.set(false);
    this.confirming.set(null);
    this.editing.set(routine);
    this.initialName = this.label(routine);
    this.name.set(this.initialName);
    this.mode.set(routine.mode);
    this.nameField()?.nativeElement.focus();
  }

  clearForm(): void {
    this.saveFailed.set(false);
    this.editing.set(null);
    this.name.set('');
    this.mode.set('DAILY');
  }

  save(): void {
    const name = this.name().trim();
    if (!name || name.length > 100 || this.saving()) return;
    const routine = this.editing();
    const request = {
      name: routine && name === this.initialName ? routine.name : name,
      mode: this.mode(),
    };
    const change = routine
      ? this.api.configureRoutine(routine.id, request)
      : this.api.addRoutine(request);
    this.saveFailed.set(false);
    this.saving.set(true);
    change
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.clearForm();
          this.load();
        },
        error: () => this.saveFailed.set(true),
      });
  }

  deactivate(routine: CareRoutine): void {
    if (this.saving() || this.confirming() !== routine.id) return;
    this.saveFailed.set(false);
    this.saving.set(true);
    this.api
      .deactivateRoutine(routine.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.confirming.set(null);
          if (this.editing()?.id === routine.id) this.clearForm();
          this.load();
        },
        error: () => this.saveFailed.set(true),
      });
  }
}
