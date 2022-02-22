import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, timer, combineLatest } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { MINIMUM_WAITING_TIME } from '@client/helpers/constants/constants';
import { CleanObject } from '@client/helpers/utils/functions';

export class ResolvedValue<T> {
  constructor(public value: T, public error: HttpErrorResponse = null) { }

  public has_error(): Boolean {
    return this.error !== null;
  }
}

export function Resolve<T>(observable: Observable<T>, default_value: T = null): Observable<ResolvedValue<T>> {
  return combineLatest(observable.pipe(map((value: T) => new ResolvedValue(CleanObject(value))), catchError((error: HttpErrorResponse) => of(new ResolvedValue(default_value, error)))), timer(MINIMUM_WAITING_TIME), x => x);
}
