import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-deceased-marker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (deceased()) {
      &nbsp;<span class="heart" role="img" [attr.aria-label]="text().entityDetail.deceased">♥</span>
    }
  `,
  styles: `
    .heart {
      margin-inline-start: -0.25em;
      color: #000;
      font-size: 1.18em;
      line-height: 1;
      -webkit-text-stroke: 0.65px #fff;
    }
  `,
})
export class DeceasedMarker {
  readonly deceased = input<boolean>();
  protected readonly text = inject(I18nService).text;
}
