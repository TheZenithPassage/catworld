import { Directive, ElementRef, forwardRef, HostListener, inject } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appNativeBadInput]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NativeBadInputDirective),
      multi: true,
    },
  ],
})
export class NativeBadInputDirective implements Validator {
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private validatorChange: () => void = () => undefined;

  validate(_control: AbstractControl): ValidationErrors | null {
    return this.element.nativeElement.validity.badInput ? { badInput: true } : null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange = fn;
  }

  @HostListener('input')
  @HostListener('blur')
  onNativeStateChange(): void {
    this.validatorChange();
  }
}
