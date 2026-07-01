import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

export type UiStateKind = 'loading' | 'empty' | 'error';

@Component({
  selector: 'app-ui-state',
  imports: [MatButton, MatCard, MatCardContent, MatProgressSpinner],
  templateUrl: './ui-state.html',
  styleUrl: './ui-state.scss',
})
export class UiStateComponent {
  @Input({ required: true }) kind!: UiStateKind;
  @Input({ required: true }) message!: string;
  @Input() actionLabel: string | null = null;

  @Output() readonly actionTriggered = new EventEmitter<void>();

  get role(): 'alert' | 'status' {
    return this.kind === 'error' ? 'alert' : 'status';
  }

  get ariaLive(): 'assertive' | 'polite' {
    return this.kind === 'error' ? 'assertive' : 'polite';
  }
}
