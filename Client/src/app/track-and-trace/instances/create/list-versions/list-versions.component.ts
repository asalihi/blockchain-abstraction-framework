import { Component, OnInit, ViewChildren, QueryList, Input, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, Subject } from 'rxjs';

import { DisplayVersionsService } from '@client/helpers/services/track-and-trace/versions/display-versions.service';
import { IVersionInformation } from '@client/helpers/models/track-and-trace/version';
import { NgbdSortableHeader, SortEvent } from '@client/helpers/directives/sortable.directive';

@Component({
    selector: 'list-versions-minimal',
    templateUrl: './list-versions.component.html',
    styleUrls: ['./list-versions.component.sass'],
    providers: [{ provide: DisplayVersionsService, useValue: DisplayVersionsService }]
})
export class ListOfVersionsMinimalComponent implements OnInit {
    private subscriptions: Subscription[] = [];
    public display_service: DisplayVersionsService;
    public versions: Observable<IVersionInformation[]>;
    public total_number_of_versions: Observable<number>;
    @ViewChildren(NgbdSortableHeader) public headers: QueryList<NgbdSortableHeader<Omit<IVersionInformation, 'process' | 'state' | 'deactivation' | 'file' | 'tree' | 'signature' | 'instances'>>>;
    @Output() public selected: Subject<string> = new Subject<string>();

    constructor(private http: HttpClient) {
        this.display_service = new DisplayVersionsService(this.http, { 'process': '', 'state': 'active' });
        this.display_service.search.next();
        this.versions = this.display_service.get_elements();
        this.total_number_of_versions = this.display_service.get_number_of_elements();
    }

    ngOnInit(): void { }

    ngOnDestroy() {
        this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
    }

    sort({ column, direction }: SortEvent<Omit<IVersionInformation, 'process' | 'state' | 'deactivation' | 'file' | 'tree' | 'signature' | 'instances'>>): void {
        this.headers.forEach((header: NgbdSortableHeader<Omit<IVersionInformation, 'process' | 'state' | 'deactivation' | 'file' | 'tree' | 'signature' | 'instances'>>) => {
            if (header['sortable'] !== column) header['direction'] = '';
        });

        if (this.display_service['sort_field'] !== column) direction = 'desc';

        this.display_service['sort_field'] = column;
        this.display_service['sort_direction'] = direction;
    }

    @Input() set search_field(value: string | null) {
        this.display_service['filter_term'] = value ?? '';
    }

    @Input() set process(value: string | null) {
        this.display_service.set_process(value ?? '');
        this.display_service.search.next();
    }

    select(version: string): void {
        this.selected.next(version);
    }
}
