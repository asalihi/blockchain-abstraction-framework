import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { IVersionInformation, IListOfVersions } from '@client/helpers/models/track-and-trace/version';
import { ITableState } from '@client/helpers/models/table';
import { DisplayElementsService } from '@client/helpers/services/display-elements.service';

@Injectable({
    providedIn: 'root'
})
export class DisplayVersionsService extends DisplayElementsService<Omit<IVersionInformation, 'versions'>, IListOfVersions | unknown, IVersionInformation> {
    public list_name: string = 'versions';
    public state: ITableState<IListOfVersions> = { 'page': 1, 'size': 5, 'filter': '', 'sort_field': 'creation', 'sort_direction': 'desc' };

    constructor(http: HttpClient, @Inject('display-versions-data') data: { 'process': string, 'state'?: 'active' | 'deactivated' }) {
        super(http, data);
    }

    public set_process(process: string): void {
        this.data['process'] = process;
    }

    protected fetch(): Observable<IListOfVersions | unknown> {
        return this.http.get<IListOfVersions>(`${environment['api']}/${environment['endpoints']['track']}/processes/${this.data['process']}/versions?page=${this.state.page}&size=${this.state.size}&identifier=${this.state.filter}${(this.data?.['state'] && ['active', 'deactivated'].includes(this.data['state'])) ? '&state=' + this.data['state'] : '' }&sort=${this.state.sort_field}&direction=${this.state.sort_direction}`).pipe(retry(3), catchError(() => of()));
    }
}
