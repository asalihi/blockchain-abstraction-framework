import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import { DELAY_BETWEEN_TWO_SUCCESSIVE_REQUESTS } from '@client/helpers/constants/constants';
import { VersionController } from '@client/helpers/services/track-and-trace/versions/controller.service';
import { IVersionInformation } from '@client/helpers/models/track-and-trace/version';
import { Event } from '@client/helpers/models/track-and-trace/trace';

export function ValidateActiveVersion(version_controller: VersionController, process: string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
        return timer(DELAY_BETWEEN_TWO_SUCCESSIVE_REQUESTS).pipe(switchMap(() => {
            return version_controller.fetch(process, control.value).pipe(
                map((version: IVersionInformation) => version['state'] == 'deactivated' ? { 'inactive': true } : null),
                catchError((error: HttpErrorResponse) => of(error.status === 404 ? { 'nonexistent': true } : { 'http_error': true }))
            );
        }));
    }
}

export function ValidateTaskIdentifier(version_controller: VersionController, process: string, version: string): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return timer(DELAY_BETWEEN_TWO_SUCCESSIVE_REQUESTS).pipe(switchMap(() => {
      return version_controller.fetch_tasks(process, version).pipe(
        map((tasks: string[]) => tasks.includes(control.value) ? null : { 'nonexistent': true }),
        catchError((error: HttpErrorResponse) => of(error.status === 404 ? { 'nonexistent': true } : { 'http_error': true }))
      );
    }));
  }
}

export function ValidateEndEventIdentifier(version_controller: VersionController, process: string, version: string): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return timer(DELAY_BETWEEN_TWO_SUCCESSIVE_REQUESTS).pipe(switchMap(() => {
      return version_controller.fetch_events(process, version).pipe(
        map((events: Event[]) => events.filter((event: Event) => event['type'] === 'end').find((event: Event) => event['identifier'] === control.value) ? null : { 'nonexistent': true }),
        catchError((error: HttpErrorResponse) => of(error.status === 404 ? { 'nonexistent': true } : { 'http_error': true }))
      );
    }));
  }
}
