import { Component, OnInit, QueryList, ViewChildren, HostListener } from '@angular/core';
import { Observable } from 'rxjs';

import { DisplayInstancesService } from '@client/helpers/services/track-and-trace/instances/display-instances.service';
import { IInstance, IInstanceParametersWithProcessAndVersion } from '@client/helpers/models/track-and-trace/instance';
import { NgbdSortableHeader, SortEvent } from '@client/helpers/directives/sortable.directive';
import { VersionController } from '@client/helpers/services/track-and-trace/versions/controller.service';

@Component({
    selector: 'list-instances',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.sass'],
    providers: [DisplayInstancesService]
})
export class ListInstancesComponent implements OnInit {
    instances: Observable<IInstance[]>;
    total_number_of_instances: Observable<number>;
    @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader<IInstance>>;
    display_list_processes: boolean = false;
    adding_instance: boolean = false;

    constructor(public display_service: DisplayInstancesService, private version_controller: VersionController) {
        this.display_service.search.next();
        this.instances = this.display_service.get_elements();
        this.total_number_of_instances = this.display_service.get_number_of_elements();
    }

    ngOnInit() { }

    sort({ column, direction }: SortEvent<IInstance>): void {
        this.headers.forEach((header: NgbdSortableHeader<IInstance>) => {
            if (header['sortable'] !== column) header['direction'] = '';
        });

        if (this.display_service['sort_field'] !== column) direction = 'desc';

        this.display_service['sort_field'] = column;
        this.display_service['sort_direction'] = direction;
    }

    public refresh_table(): void {
        this.display_service.search.next();
    }

    @HostListener('document:click', ['$event']) document_click(event: Event) {
        this.display_list_processes = false;
    }

    show_list_of_processes(event: Event): void {
        this.display_list_processes = true;
        event.stopPropagation();
    }

    add_instance(instance: IInstanceParametersWithProcessAndVersion): void {
        this.adding_instance = false;
        const { process, version, ...parameters } = instance;
        this.version_controller.add_instance(process, version, parameters, this.display_service);
    }
}
