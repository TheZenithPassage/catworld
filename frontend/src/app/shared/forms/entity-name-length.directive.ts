import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

export const ENTITY_NAME_MIN_LENGTH = 3;
export const ENTITY_NAME_MAX_LENGTH = 100;

export function isEntityNameLengthValid(value: string): boolean {
  const length = value.trim().length;

  return length >= ENTITY_NAME_MIN_LENGTH && length <= ENTITY_NAME_MAX_LENGTH;
}

@Directive({
  selector: '[appEntityNameLength]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => EntityNameLengthDirective),
      multi: true,
    },
  ],
})
export class EntityNameLengthDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (typeof value !== 'string' || value.trim().length === 0) {
      return null;
    }

    return isEntityNameLengthValid(value) ? null : { entityNameLength: true };
  }
}
