import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { IProcessInformation, IListOfProcesses } from '@client/helpers/models/track-and-trace/process';
import { ITableState } from '@client/helpers/models/table';
import { DisplayElementsService } from '@client/helpers/services/display-elements.service';

@Injectable({
    providedIn: 'root'
})
export class DisplayProcessesService extends DisplayElementsService<Omit<IProcessInformation, 'versions'>, IListOfProcesses | unknown, IProcessInformation> {
    public list_name: string = 'processes';
    public state: ITableState<IListOfProcesses> = { 'page': 1, 'size': 5, 'filter': '', 'sort_field': 'creation', 'sort_direction': 'desc' };

    constructor(protected http: HttpClient, @Inject('display-process-data') @Optional() data: { 'state': 'active' | 'deactivated' }) {
        super(http, data);
    }

    protected fetch(): Observable<IListOfProcesses | unknown> {
        return this.http.get<IListOfProcesses>(`${environment['api']}/${environment['endpoints']['track']}/processes?page=${this.state.page}&size=${this.state.size}&identifier=${this.state.filter}${(this.data?.['state'] && ['active', 'deactivated'].includes(this.data['state'])) ? '&state=' + this.data['state'] : '' }&sort=${this.state.sort_field}&direction=${this.state.sort_direction}`).pipe(retry(3), catchError(() => of()));
    }
}
