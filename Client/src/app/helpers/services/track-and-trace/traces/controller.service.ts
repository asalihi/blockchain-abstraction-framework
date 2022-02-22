import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { NotificationService } from '@client/helpers/services/notification.service';
import { ITrace } from '@client/helpers/models/track-and-trace/trace';
import { MAX_RETRIES_ON_ERROR } from '@client/helpers/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class TraceController {

  constructor(private http: HttpClient, private notification_service: NotificationService) { }

  public fetch(identifier: string, context: 'processes' | 'versions' | 'instances' | 'updates'): Observable<ITrace> {
    return this.http.get<ITrace>(`${environment['api']}/${environment['endpoints']['track']}/${ (context === 'updates') ? 'instances/updates' : context + '/traces' }/${identifier}`).pipe(retry(MAX_RETRIES_ON_ERROR), catchError((error: HttpErrorResponse) => this.handle_error(error)));
  }

  private handle_error(error: HttpErrorResponse): Observable<never> {
    return throwError(error);

    // TODO: IMPLEMENT
    /*if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // Return an observable with a user-facing error message.
    return throwError(
      'Something bad happened; please try again later.');*/
  }
}
