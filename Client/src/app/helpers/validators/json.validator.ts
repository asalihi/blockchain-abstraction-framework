import {AbstractControl, ValidationErrors} from '@angular/forms';

export function JSONValidator(control: AbstractControl): (ValidationErrors | null) {
  try {
    if (control.value) JSON.parse(control.value);
    else return null;
  } catch {
    return { invalid: true };
  }

  return null;
};
