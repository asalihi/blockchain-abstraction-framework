import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Observable } from 'rxjs';

import { DisplayProcessesService } from '@client/helpers/services/track-and-trace/processes/display-processes.service';
import { IProcessInformation, IProcessWithVersions } from '@client/helpers/models/track-and-trace/process';
import { NgbdSortableHeader, SortEvent } from '@client/helpers/directives/sortable.directive';
import { ProcessController } from '@client/helpers/services/track-and-trace/processes/controller.service';

@Component({
  selector: 'list-processes',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.sass']
})
export class ListProcessesComponent implements OnInit {
  adding_process: boolean = false;
  processes: Observable<IProcessInformation[]>;
  total_number_of_processes: Observable<number>;
  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader<Omit<IProcessInformation, 'versions'>>>;

  constructor(public display_service: DisplayProcessesService, private controller: ProcessController) {
    this.display_service.search.next();
    this.processes = this.display_service.get_elements();
    this.total_number_of_processes = this.display_service.get_number_of_elements();
  }

  ngOnInit() { }

  sort({ column, direction }: SortEvent<Omit<IProcessInformation, 'versions'>>): void {
    this.headers.forEach((header: NgbdSortableHeader<Omit<IProcessInformation, 'versions'>>) => {
      if (header['sortable'] !== column) header['direction'] = '';
    });

    if (this.display_service['sort_field'] !== column) direction = 'desc';

    this.display_service['sort_field'] = column;
    this.display_service['sort_direction'] = direction;
  }

  public refresh_table(): void {
    this.display_service.search.next();
  }

  public create_process(process: IProcessWithVersions): void {
    this.adding_process = false;
    this.controller.create_process(process, this.display_service);
  }
}
