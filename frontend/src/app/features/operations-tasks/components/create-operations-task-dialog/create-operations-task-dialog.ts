import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { NativeBadInputDirective } from '../../../../shared/forms/native-bad-input.directive';
import {
  OperationsTask,
  OperationsTaskApiService,
  OperationsTaskLinkTarget,
} from '../../data-access/operations-task-api.service';
import { OperationsTaskLinkPicker } from '../operations-task-link-picker/operations-task-link-picker';

type CreateError = 'invalidDate' | 'createFailed' | 'linkMissing';

@Component({
  selector: 'app-create-operations-task-dialog',
  imports: [
    FormsModule,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    NativeBadInputDirective,
    OperationsTaskLinkPicker,
  ],
  templateUrl: './create-operations-task-dialog.html',
  styleUrl: './create-operations-task-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateOperationsTaskDialog {
  private readonly api = inject(OperationsTaskApiService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<CreateOperationsTaskDialog, OperationsTask>);
  private readonly descriptionAttempted = signal(false);
  private selectedLink: OperationsTaskLinkTarget | null = null;

  readonly copy = computed(() => this.i18n.text().operationsTasks);
  readonly description = signal('');
  readonly dueDate = signal('');
  readonly saving = signal(false);
  readonly createError = signal<CreateError | null>(null);

  readonly descriptionErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control) =>
      this.descriptionAttempted() &&
      (!this.description().trim() || !!control?.hasError('maxlength')),
  };

  updateDescription(value: string): void {
    this.description.set(value);
    if (value.trim()) this.descriptionAttempted.set(false);
  }

  setLink(link: OperationsTaskLinkTarget | null): void {
    this.selectedLink = link;
    if (this.createError() === 'linkMissing') this.createError.set(null);
  }

  create(form: NgForm, descriptionInput: HTMLTextAreaElement, dateInput: HTMLInputElement): void {
    if (this.saving()) return;
    this.createError.set(null);
    const description = this.description().trim();
    if (!description || form.controls['description']?.hasError('maxlength')) {
      this.descriptionAttempted.set(true);
      descriptionInput.focus();
      return;
    }
    if (!dateInput.validity.valid) {
      this.createError.set('invalidDate');
      return;
    }
    if (form.invalid) return;

    const link = this.selectedLink;
    this.saving.set(true);
    this.dialogRef.disableClose = true;
    this.api
      .create({
        description,
        dueDate: this.dueDate() || null,
        stayId: link?.kind === 'STAY' ? link.id : null,
        ownerId: link?.kind === 'OWNER' ? link.id : null,
        catId: link?.kind === 'CAT' ? link.id : null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (task) => this.dialogRef.close(task),
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.dialogRef.disableClose = false;
          this.createError.set(error.status === 404 && link ? 'linkMissing' : 'createFailed');
        },
      });
  }
}
