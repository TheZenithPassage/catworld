import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [MatButton, MatCard, MatCardContent, RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;
}
