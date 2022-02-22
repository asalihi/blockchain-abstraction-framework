import { Component, OnInit, ViewChildren, QueryList, Input, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, Subject } from 'rxjs';

import { DisplayProcessesService } from '@client/helpers/services/track-and-trace/processes/display-processes.service';
import { IProcessInformation } from '@client/helpers/models/track-and-trace/process';
import { NgbdSortableHeader, SortEvent } from '@client/helpers/directives/sortable.directive';

@Component({
    selector: 'list-processes-minimal',
    templateUrl: './list-processes.component.html',
    styleUrls: ['./list-processes.component.sass'],
    providers: [{ provide: DisplayProcessesService, useValue: DisplayProcessesService }]
})
export class ListOfProcessesMinimalComponent implements OnInit {
    private subscriptions: Subscription[] = [];
    public display_service: DisplayProcessesService;
    public processes: Observable<IProcessInformation[]>;
    public total_number_of_processes: Observable<number>;
    @ViewChildren(NgbdSortableHeader) public headers: QueryList<NgbdSortableHeader<Omit<IProcessInformation, 'state' | 'deactivation' | 'versions'>>>;
    @Output() public selected: Subject<string> = new Subject<string>();

    constructor(private http: HttpClient) {
        this.display_service = new DisplayProcessesService(this.http, { 'state': 'active' });
        this.display_service.search.next();
        this.processes = this.display_service.get_elements();
        this.total_number_of_processes = this.display_service.get_number_of_elements();
    }

    ngOnInit(): void { }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
    }

    sort({ column, direction }: SortEvent<Omit<IProcessInformation, 'state' | 'deactivation' | 'versions'>>): void {
        this.headers.forEach((header: NgbdSortableHeader<Omit<IProcessInformation, 'state' | 'deactivation' | 'versions'>>) => {
            if (header['sortable'] !== column) header['direction'] = '';
        });

        if (this.display_service['sort_field'] !== column) direction = 'desc';

        this.display_service['sort_field'] = column;
        this.display_service['sort_direction'] = direction;
    }

    @Input() set search_field(value: string) {
        this.display_service['filter_term'] = value ?? '';
    }

    select(process: string): void {
        this.selected.next(process);
    }
}
