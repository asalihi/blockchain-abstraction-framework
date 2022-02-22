import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { NotificationService } from '@client/helpers/services/notification.service';
import { DisplayInstancesService } from '@client/helpers/services/track-and-trace/instances/display-instances.service';
import { IVersion, IVersionInformation } from '@client/helpers/models/track-and-trace/version';
import { IInstanceParameters } from '@client/helpers/models/track-and-trace/instance';
import { Event } from '@client/helpers/models/track-and-trace/trace';
import { Capitalize } from '@client/helpers/utils/functions';
import { InstanceController } from '@client/helpers/services/track-and-trace/instances/controller.service';
import { MAX_RETRIES_ON_ERROR } from '@client/helpers/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class VersionController {
  changes: Subject<{ version: string, changes: Partial<IVersion> }> = new Subject();

  constructor(private http: HttpClient, private notification_service: NotificationService, private instance_controller: InstanceController) { }

  public fetch(process: string, version: string): Observable<IVersionInformation> {
    return this.http.get<IVersionInformation>(`${environment['api']}/${environment['endpoints']['track']}/processes/${process}/versions/${version}`).pipe(retry(MAX_RETRIES_ON_ERROR), catchError((error: HttpErrorResponse) => this.handle_error(error)));
  }

  public fetch_tasks(process: string, version: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment['api']}/${environment['endpoints']['track']}/processes/${process}/versions/${version}/tasks`).pipe(retry(MAX_RETRIES_ON_ERROR), catchError((error: HttpErrorResponse) => this.handle_error(error)));
  }

  public fetch_events(process: string, version: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${environment['api']}/${environment['endpoints']['track']}/processes/${process}/versions/${version}/events`).pipe(retry(MAX_RETRIES_ON_ERROR), catchError((error: HttpErrorResponse) => this.handle_error(error)));
  }

  public add_instance(process: string, version: string, instance: IInstanceParameters, display_instances_service?: DisplayInstancesService): Observable<boolean> {
    let success_message: string = `<b>${instance['instance']}</b> was added successfully!`;
    let failure_message: string = `<b>${instance['instance']}</b> could not be created!`;

    const request: Observable<boolean> = this.http.post<boolean>(`${environment['api']}/${environment['endpoints']['track']}/processes/${process}/versions/${version}/instances`, instance).pipe(
      retry(MAX_RETRIES_ON_ERROR),
      catchError((error: HttpErrorResponse) => {
        this.notification_service.show_http_error(error, { 'message': failure_message }, true).onAction.subscribe((event: any) => {
          this.add_instance(process, version, instance, display_instances_service);
        });

        return this.handle_error(error);
      })
    );

    request.subscribe(() => {
      this.notification_service.show_success({ 'title': 'Instance added', 'message': success_message });
      if (display_instances_service) display_instances_service.search.next();

      if (instance['activation']) this.instance_controller.activate({ 'process': process, 'version': version, 'instance': instance['instance'] }, instance['activation']);
    });

    return request;
  }

  public deactivate(process: string, version: string, display_instances_service?: DisplayInstancesService): Observable<IVersion & { '_id': string }> {
    return this.change_status(process, version, 'deactivation', display_instances_service);
  }

  private change_status(process: string, version: string, operation: 'deactivation', display_instances_service: DisplayInstancesService): Observable<IVersion & { '_id': string }> {
    let operation_capitalized: string = Capitalize(operation);
    let success_message: string = `${operation_capitalized} was achieved successfully for <b>${version}</b>!`;
    let failure_message: string = `${operation_capitalized} could not be achieved for <b>${version}</b>!`;

    const request: Observable<IVersion & { '_id': string }> = this.http.post<IVersion & { '_id': string }>(`${environment['api']}/${environment['endpoints']['track']}/processes/${process}/versions/${version}/status`, { 'operation': operation }).pipe(
      retry(MAX_RETRIES_ON_ERROR),
      catchError((error: HttpErrorResponse) => {
        this.notification_service.show_http_error(error, { 'message': failure_message }, true).onAction.subscribe((event: any) => {
          this.change_status(process, version, operation, display_instances_service);
        });

        return this.handle_error(error);
      })
    );

    request.subscribe((updated_version: IVersion) => {
      this.notification_service.show_success({ 'title': `${operation_capitalized} successful`, 'message': success_message });
      this.changes.next({ 'version': updated_version['version'], 'changes': { 'state': updated_version['state'], 'deactivation': updated_version['deactivation'], 'traces': updated_version['traces'] } });
      if (display_instances_service) {
        display_instances_service.search.next();
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
