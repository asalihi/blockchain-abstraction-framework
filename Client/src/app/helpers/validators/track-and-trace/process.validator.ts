import { Directive } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, AsyncValidator, ValidationErrors, NG_ASYNC_VALIDATORS } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import { DELAY_BETWEEN_TWO_SUCCESSIVE_REQUESTS } from '@client/helpers/constants/constants';
import { ProcessController } from '@client/helpers/services/track-and-trace/processes/controller.service';
import { IProcessInformation } from '@client/helpers/models/track-and-trace/process';

@Directive({
    selector: '[active_process]',
    providers: [
        { provide: NG_ASYNC_VALIDATORS, useExisting: ActiveProcessValidator, multi: true }
    ]
})
export class ActiveProcessValidator implements AsyncValidator {
    constructor(private process_controller: ProcessController) { }

    validate(control: AbstractControl): Observable<ValidationErrors | null> {
        return timer(DELAY_BETWEEN_TWO_SUCCESSIVE_REQUESTS).pipe(switchMap(() => {
            return this.process_controller.fetch(control.value).pipe(
                map((process: IProcessInformation) => process['state'] == 'deactivated' ? { 'inactive': true } : null),
                catchError((error: HttpErrorResponse) => of(error.status === 404 ? { 'nonexistent': true } : { 'http_error': true }))
            );
        }));
    }
}
