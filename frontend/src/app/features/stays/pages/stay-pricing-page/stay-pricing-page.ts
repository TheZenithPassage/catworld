import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { StayPayments } from '../../components/stay-payments/stay-payments';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { getStayStatus } from '../../utils/stay-status.util';

@Component({
  selector: 'app-stay-pricing-page',
  imports: [MatButton, UiStateComponent, StayPayments],
  templateUrl: './stay-pricing-page.html',
  styleUrl: './stay-pricing-page.scss',
})
export class StayPricingPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(StayApiService);
  private readonly i18n = inject(I18nService);
  private readonly stayId = this.route.snapshot.paramMap.get('id');
  private readonly origin = this.captureOrigin();
  readonly text = this.i18n.text;
  readonly dateLocale = this.i18n.dateLocale;
  readonly stay = signal<Stay | null>(null);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);

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

  onStayChanged(stay: Stay): void {
    this.stay.set(stay);
  }
  back(): void {
    void (this.origin ? this.router.navigateByUrl(this.origin) : this.router.navigate(['/stays']));
  }
  formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.dateLocale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }
  status(stay: Stay): string {
    return this.text().stays.status[getStayStatus(stay)];
  }
  catNames(stay: Stay): string {
    return stay.cats.map((cat) => cat.name).join(', ') || this.text().stays.emptyValue;
  }
  private captureOrigin(): string | null {
    const state: unknown = this.router.getCurrentNavigation()?.extras.state;
    if (!state || typeof state !== 'object' || !('stayPricingOrigin' in state)) return null;
    const origin = (state as { stayPricingOrigin?: unknown }).stayPricingOrigin;
    return typeof origin === 'string' && origin.startsWith('/') && !origin.startsWith('//')
      ? origin
      : null;
  }
}
