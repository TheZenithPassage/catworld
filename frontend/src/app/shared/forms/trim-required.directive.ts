import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appTrimRequired]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TrimRequiredDirective),
      multi: true,
    },
  ],
})
export class TrimRequiredDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    return typeof value === 'string' && value.trim().length === 0 ? { required: true } : null;
  }
}
