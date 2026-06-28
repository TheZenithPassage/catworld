import { DIALOG_DATA } from '@angular/cdk/dialog';
import { NgComponentOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { I18nService } from '../../i18n/i18n.service';
import { DetailDialogService } from '../detail-dialog.service';

@Component({
  selector: 'app-detail-dialog-shell',
  imports: [NgComponentOutlet],
  templateUrl: './detail-dialog-shell.html',
  styleUrl: './detail-dialog-shell.scss',
})
export class DetailDialogShellComponent {
  private readonly i18nService = inject(I18nService);
  private readonly detailDialogService = inject<DetailDialogService>(DIALOG_DATA);

  readonly text = this.i18nService.text;
  readonly entry = this.detailDialogService.currentEntry;
  readonly canGoBack = this.detailDialogService.canGoBack;
  readonly bodyInputs = computed(() => this.entry()?.bodyInputs ?? {});

  back(): void {
    this.detailDialogService.back();
  }

  close(): void {
    this.detailDialogService.close();
  }

  edit(): void {
    this.detailDialogService.editCurrent();
  }
}
