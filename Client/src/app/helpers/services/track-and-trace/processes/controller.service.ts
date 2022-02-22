import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { NotificationService } from '@client/helpers/services/notification.service';
import { DisplayProcessesService } from '@client/helpers/services/track-and-trace/processes/display-processes.service';
import { DisplayVersionsService } from '@client/helpers/services/track-and-trace/versions/display-versions.service';
import { IProcessWithVersions, IProcessInformation, IProcess, IProcessStatistics } from '@client/helpers/models/track-and-trace/process';
import { IVersionParameters } from '@client/helpers/models/track-and-trace/version';
import { Capitalize } from '@client/helpers/utils/functions';
import { MAX_RETRIES_ON_ERROR } from '@client/helpers/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class ProcessController {
  changes: Subject<{ process: string, changes: Partial<IProcess> }> = new Subject();

  constructor(private http: HttpClient, private notification_service: NotificationService) { }

  public fetch(process: string): Observable<IProcessInformation> {
    return this.http.get<IProcessInformation>(`${environment['api']}/${environment['endpoints']['track']}/processes/${process}`).pipe(retry(MAX_RETRIES_ON_ERROR), catchError((error: HttpErrorResponse) => this.handle_error(error)));
  }

  public fetch_statistics(): Observable<IProcessStatistics> {
    return this.http.get<IProcessStatistics>(`${environment['api']}/${environment['endpoints']['track']}/processes/statistics`).pipe(retry(MAX_RETRIES_ON_ERROR), catchError((error: HttpErrorResponse) => this.handle_error(error)));
  }

  public create_process(process: IProcessWithVersions, display_processes_service?: DisplayProcessesService): Observable<boolean> {
    let success_message: string = `<b>${process['process']}</b> was added successfully!`;
    let failure_message: string = `<b>${process['process']}</b> could not be created.`;

    const request: Observable<boolean> = this.http.post<boolean>(`${environment['api']}/${environment['endpoints']['track']}/processes`, process).pipe(
      retry(MAX_RETRIES_ON_ERROR),
      catchError((error: HttpErrorResponse) => {
        this.notification_service.show_http_error(error, { 'message': failure_message }, true).onAction.subscribe((event: any) => {
          this.create_process(process);
        });

        return this.handle_error(error);
      })
    );

    request.subscribe(() => {
      this.notification_service.show_success({ 'title': 'Process added', 'message': success_message });
      if (display_processes_service) display_processes_service.search.next();
    });

    return request;
  }

  public add_version(process: string, version: IVersionParameters, display_versions_Service?: DisplayVersionsService): Observable<boolean> {
    let success_message: string = `<b>${version['identifier']}</b> was added successfully!`;
    let failure_message: string = `<b>${version['identifier']}</b> could not be created.!`;

    const request: Observable<boolean> = this.http.post<boolean>(`${environment['api']}/${environment['endpoints']['track']}/processes/${process}/versions`, version).pipe(
      retry(MAX_RETRIES_ON_ERROR),
      catchError((error: HttpErrorResponse) => {
        this.notification_service.show_http_error(error, { 'message': failure_message }, true).onAction.subscribe((event: any) => {
          this.add_version(process, version, display_versions_Service);
        });

        return this.handle_error(error);
      })
    );

    request.subscribe(() => {
      this.notification_service.show_success({ 'title': 'Version added', 'message': success_message });
      if (display_versions_Service) display_versions_Service.search.next();
    });

    return request;
  }

  public deactivate(process: string, display_versions_service?: DisplayVersionsService): Observable<IProcess & { '_id': string }> {
    return this.change_status(process, 'deactivation', display_versions_service);
  }

  private change_status(process: string, operation: 'deactivation', display_versions_service: DisplayVersionsService): Observable<IProcess & { '_id': string }> {
    let operation_capitalized: string = Capitalize(operation);
    let success_message: string = `${operation_capitalized} was achieved successfully for <b>${process}</b>!`;
    let failure_message: string = `${operation_capitalized} could not be achieved for <b>${process}</b>!`;

    const request: Observable<IProcess & { '_id': string }> = this.http.post<IProcess & { '_id': string }>(`${environment['api']}/${environment['endpoints']['track']}/processes/${process}/state`, { 'operation': operation }).pipe(
      retry(MAX_RETRIES_ON_ERROR),
      catchError((error: HttpErrorResponse) => {
        this.notification_service.show_http_error(error, { 'message': failure_message }, true).onAction.subscribe((event: any) => {
          this.change_status(process, operation, display_versions_service);
        });

        return this.handle_error(error);
      })
    );

    request.subscribe((updated_process: IProcess) => {
      this.notification_service.show_success({ 'title': `${operation_capitalized} successful`, 'message': success_message });
      this.changes.next({ 'process': updated_process['process'], 'changes': { 'state': updated_process['state'], 'deactivation': updated_process['deactivation'], 'traces': updated_process['traces'] } });
      if (display_versions_service) {
        display_versions_service.search.next();
      }
    });

    return request;
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
