import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { StayEditor } from '../../components/stay-editor/stay-editor';
import { StayPayments } from '../../components/stay-payments/stay-payments';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';

@Component({
  selector: 'app-stay-edit-page',
  imports: [MatButton, RouterLink, UiStateComponent, StayEditor, StayPayments],
  templateUrl: './stay-edit-page.html',
  styleUrl: './stay-edit-page.scss',
})
export class StayEditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(StayApiService);
  readonly text = inject(I18nService).text;
  readonly stay = signal<Stay | null>(null);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  private readonly stayId = this.route.snapshot.paramMap.get('id');

  constructor() {
    this.load();
  }

  load(): void {
    if (!this.stayId) {
      this.loadFailed.set(true);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api.getStayById(this.stayId).subscribe({
      next: (stay) => {
        this.stay.set(stay);
        this.loading.set(false);
      },
      error: () => {
        this.loadFailed.set(true);
        this.loading.set(false);
      },
    });
  }

  saved(): void {
    void this.router.navigate(['/stays']);
  }
  onStayChanged(stay: Stay): void {
    this.stay.set(stay);
  }
}
