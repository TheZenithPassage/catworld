import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-deceased-marker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (deceased()) {
      &ngsp;<span class="heart" role="img" [attr.aria-label]="text().entityDetail.deceased">♥</span>
    }
  `,
  styles: `
    .heart {
      color: #000;
      -webkit-text-stroke: 0.35px #fff;
    }
  `,
})
export class DeceasedMarker {
  readonly deceased = input<boolean>();
  protected readonly text = inject(I18nService).text;
}
