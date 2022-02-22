import { AbstractControl, ValidatorFn, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';

export function OptionalValidator(validator: ValidatorFn): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return control.value ? validator(control) : null;
  }
}

export function OptionalAsyncValidator(validator: AsyncValidatorFn): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return of(control.value ? validator(control) : null);
  }
}
