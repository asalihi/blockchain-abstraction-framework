import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { isEmpty as empty } from 'lodash';

import { environment } from '@environments/environment';
import { NotificationService } from '@client/helpers/services/notification.service';
import { IInstance, IInstanceStatistics } from '@client/helpers/models/track-and-trace/instance';
import { Capitalize } from '@client/helpers/utils/functions';
import { ITraceParameters } from '@client/helpers/models/track-and-trace/trace';
import { DisplayTracesService } from '@client/helpers/services/track-and-trace/traces/display-traces.service';
import { MAX_RETRIES_ON_ERROR } from '@client/helpers/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class InstanceController {
  changes: Subject<{ instance: string, changes: Partial<IInstance> }> = new Subject();

  constructor(private http: HttpClient, private notification_service: NotificationService) { }

  public fetch(process: string, version: string, instance: string): Observable<IInstance> {
    return this.http.get<IInstance>(`${environment['api']}/${environment['endpoints']['track']}/processes/${process}/versions/${version}/instances/${instance}`).pipe(retry(MAX_RETRIES_ON_ERROR), catchError((error: HttpErrorResponse) => this.handle_error(error)));
  }

  public fetch_statistics(): Observable<IInstanceStatistics> {
    return this.http.get<IInstanceStatistics>(`${environment['api']}/${environment['endpoints']['track']}/instances/statistics`).pipe(retry(MAX_RETRIES_ON_ERROR), catchError((error: HttpErrorResponse) => this.handle_error(error)));
  }

  public activate(instance: Pick<IInstance, 'process' | 'version' | 'instance'>, trace: Partial<ITraceParameters>, display_traces_service?: DisplayTracesService): Observable<IInstance> {
    return this.change_state(instance, 'activation', trace, display_traces_service);
  }

  public update(instance: Pick<IInstance, 'process' | 'version' | 'instance'>, trace: Partial<ITraceParameters>, display_traces_service?: DisplayTracesService): Observable<IInstance> {
    return this.change_state(instance, 'update', trace, display_traces_service);
  }

  public deactivate(instance: Pick<IInstance, 'process' | 'version' | 'instance'>, trace: Partial<ITraceParameters>, display_traces_service?: DisplayTracesService): Observable<IInstance> {
    return this.change_state(instance, 'deactivation', trace, display_traces_service);
  }

  public cancel(instance: Pick<IInstance, 'process' | 'version' | 'instance'>, trace: Partial<ITraceParameters>, display_traces_service?: DisplayTracesService): Observable<IInstance> {
    return this.change_state(instance, 'cancelation', trace, display_traces_service);
  }

  public add_trace(process: string, version: string, instance: string, trace: ITraceParameters, display_traces_service?: DisplayTracesService): Observable<boolean> {
    let success_message: string = `<b>${trace['identifier']}</b> was added successfully!<br/><br/>Trace still need to be persisted on blockchain.<br/>You'll receive a separate notification when it's done.`;
    let failure_message: string = `<b>${trace['identifier']}</b> could not be created!`;

    const request: Observable<boolean> = this.http.post<boolean>(`${environment['api']}/${environment['endpoints']['track']}/processes/${process}/versions/${version}/instances/${instance}/status`, { 'operation': 'update', 'trace': trace }).pipe(
      retry(MAX_RETRIES_ON_ERROR),
      catchError((error: HttpErrorResponse) => {
        this.notification_service.show_http_error(error, { 'message': failure_message }, true).onAction.subscribe((event: any) => {
          this.add_trace(process, version, instance, trace, display_traces_service);
        });

        return this.handle_error(error);
      })
    );

    request.subscribe(() => {
      this.notification_service.show_success({ 'title': 'Trace added', 'message': success_message });
      if (display_traces_service) display_traces_service.search.next();
    });

    return request;
  }

  private change_state(instance: Pick<IInstance, 'process' | 'version' | 'instance'>, operation: 'activation' | 'update' | 'deactivation' | 'cancelation', parameters: Partial<ITraceParameters>, display_traces_service?: DisplayTracesService): Observable<IInstance> {
    let operation_capitalized: string = Capitalize(operation);
    let success_message: string = `${operation_capitalized} was achieved successfully for <b>${instance['instance']}</b>!`;
    let failure_message: string = `${operation_capitalized} could not be achieved for <b>${instance['instance']}</b>!`;

    const request: Observable<IInstance> = this.http.post<IInstance>(`${environment['api']}/${environment['endpoints']['track']}/processes/${instance['process']}/versions/${instance['version']}/instances/${instance['instance']}/state`, Object.assign({ 'operation': operation }, !empty(parameters) ? parameters : {})).pipe(
      retry(MAX_RETRIES_ON_ERROR),
      catchError((error: HttpErrorResponse) => {
        this.notification_service.show_http_error(error, { 'message': failure_message }, true).onAction.subscribe((event: any) => {
          this.change_state(instance, operation, parameters, display_traces_service);
        });

        return this.handle_error(error);
      })
    );

    // TODO: Specify type
    request.subscribe((response: any) => {
      if (response['success']) {
        this.notification_service.show_success({ 'title': `${operation_capitalized} successful`, 'message': success_message });
        if(operation !== 'update') this.changes.next({ 'instance': response['instance']['instance'], 'changes': { 'state': response['instance']['state'], ...((operation === 'activation') && { 'start': response['instance']['start'] }), ...((['deactivation', 'cancelation'].includes(operation))) && ({ 'stop': response['instance']['stop'] }), 'traces': response['instance']['traces'] } });
        if (display_traces_service) {
          display_traces_service.search.next();
        }
      } else {
        if (display_traces_service) display_traces_service.search.next();
        // TODO URGENT: Better handle error response
        this.notification_service.show_error({ 'message': failure_message });
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
