import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { IInstance, IListOfInstances } from '@client/helpers/models/track-and-trace/instance';
import { ITableState } from '@client/helpers/models/table';
import { DisplayElementsService } from '@client/helpers/services/display-elements.service';

@Injectable({
    providedIn: 'root'
})
export class DisplayInstancesService extends DisplayElementsService<IInstance, IListOfInstances | unknown, IInstance> {
    public list_name: string = 'instances';
    public state: ITableState<IListOfInstances> = { 'page': 1, 'size': 5, 'filter': '', 'sort_field': 'creation', 'sort_direction': 'desc' };

    constructor(http: HttpClient, @Inject('display-instance-data') @Optional() data: { 'process': string, 'version': string }) {
        super(http, data);
    }

    protected fetch(): Observable<IListOfInstances | unknown> {
        if(this.data) return this.http.get<IListOfInstances>(`${environment['api']}/${environment['endpoints']['track']}/processes/${this.data['process']}/versions/${this.data['version']}/instances?page=${this.state.page}&size=${this.state.size}&identifier=${this.state.filter}&sort=${this.state.sort_field}&direction=${this.state.sort_direction}`).pipe(retry(3), catchError(() => of()));
        else return this.http.get<IListOfInstances>(`${environment['api']}/${environment['endpoints']['track']}/instances?page=${this.state.page}&size=${this.state.size}&identifier=${this.state.filter}&sort=${this.state.sort_field}&direction=${this.state.sort_direction}`).pipe(retry(3), catchError(() => of()));
    }
}
