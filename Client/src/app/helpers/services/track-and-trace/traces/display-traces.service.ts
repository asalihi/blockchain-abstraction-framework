import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { ITrace, IListOfTraces } from '@client/helpers/models/track-and-trace/trace';
import { ITableState } from '@client/helpers/models/table';
import { DisplayElementsService } from '@client/helpers/services/display-elements.service';

@Injectable({
  providedIn: 'root'
})
export class DisplayTracesService extends DisplayElementsService<ITrace, IListOfTraces | unknown, ITrace> {
  public list_name: string = 'traces';
  public state: ITableState<IListOfTraces> = { 'page': 1, 'size': 5, 'filter': '', 'sort_field': 'timestamp', 'sort_direction': 'desc' };

  constructor(http: HttpClient, @Inject('display-trace-data') data: { 'process': string, 'version': string, 'instance': string }) {
    super(http, data);
  }

  protected fetch(): Observable<IListOfTraces | unknown> {
    if (this.data) return this.http.get<IListOfTraces>(`${environment['api']}/${environment['endpoints']['track']}/processes/${this.data['process']}/versions/${this.data['version']}/instances/${this.data['instance']}/updates?page=${this.state.page}&size=${this.state.size}&identifier=${this.state.filter}&sort=${this.state.sort_field}&direction=${this.state.sort_direction}`).pipe(retry(3), catchError(() => of()));
  }
}
