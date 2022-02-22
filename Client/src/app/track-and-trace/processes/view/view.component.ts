import { Component, OnInit, ViewChildren, QueryList, TemplateRef } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { CleanObject } from '@client/helpers/utils/functions';
import { ResolvedValue } from '@client/helpers/utils/resolver';
import { NotificationService } from '@client/helpers/services/notification.service';
import { DisplayVersionsService } from '@client/helpers/services/track-and-trace/versions/display-versions.service';
import { ProcessController } from '@client/helpers/services/track-and-trace/processes/controller.service';
import { VersionController } from '@client/helpers/services/track-and-trace/versions/controller.service';
import { IProcess, IProcessInformation } from '@client/helpers/models/track-and-trace/process';
import { IVersionParameters, IVersionInformation, IVersion } from '@client/helpers/models/track-and-trace/version';
import { NgbdSortableHeader, SortEvent } from '@client/helpers/directives/sortable.directive';
import { DisplayModelerComponent } from '@client/helpers/components/modals/display-modeler/display-modeler.component';

@Component({
  selector: 'view-process',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.sass'],
  providers: [{ provide: DisplayVersionsService, useValue: DisplayVersionsService }]
})
export class ViewProcessComponent implements OnInit {
  display_service: DisplayVersionsService;
  process: IProcessInformation;
  error: HttpErrorResponse;
  versions: Observable<IVersionInformation[]>;
  total_number_of_versions: Observable<number>;
  display_modeler_modal: BsModalRef;
  adding_version: boolean = false;
  deactivation_modal: BsModalRef;
  data_modal: BsModalRef;
  options_modal: BsModalRef;
  private subscriptions: Subscription[] = [];
  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader<Omit<IVersionInformation, 'versions'>>>;

  constructor(private location: Location, private modal_service: BsModalService, private route: ActivatedRoute, private http: HttpClient, private notification_service: NotificationService, private process_controller: ProcessController, private version_controller: VersionController) {
    this.route.data.subscribe((data: any) => this.load(data['response']));
    this.subscriptions.push(
      this.process_controller.changes.subscribe((changes: { process: string, changes: Partial<IProcess> }) => {
        if (this.process['process'] === changes['process']) Object.assign(this.process, changes['changes']);
      }),
      this.version_controller.changes.subscribe(_ => {
        this.notification_service.show_info({ 'message': 'List of versions has changed. Do you want to update the table?', 'actions': [{ 'type': 'info', 'name': 'reload', 'message': 'Reload', 'close': true }] }).onAction.subscribe((event: any) => {
          this.display_service.search.next();
        });
      })
    );
  }

  ngOnInit(): void { }

  public back(): void {
    this.location.back();
  }

  public load(response: ResolvedValue<IProcessInformation>): void {
    if (response.has_error()) {
      this.error = response.error;
      throw response.error;
    } else {
      this.process = CleanObject<IProcessInformation>(response.value);
      this.display_service = new DisplayVersionsService(this.http, { 'process': this.process['process'] });
      this.versions = this.display_service.get_elements();
      this.total_number_of_versions = this.display_service.get_number_of_elements();
    }
  }

  public sort({ column, direction }: SortEvent<Omit<IProcessInformation, 'versions'>>): void {
    this.headers.forEach((header: NgbdSortableHeader<Omit<IVersionInformation, 'file' | 'signature' | 'instances'>>) => {
      if (header['sortable'] !== column) header['direction'] = '';
    });

    if (this.display_service['sort_field'] !== column) direction = 'desc';

    this.display_service['sort_field'] = column;
    this.display_service['sort_direction'] = direction;
  }

  public refresh_table(): void {
    this.display_service.search.next();
  }

  public view_model(version: IVersionInformation): void {
    setTimeout(() => {
      this.display_modeler_modal = this.modal_service.show(DisplayModelerComponent, Object.assign({ class: 'bpmn-display-modal', animated: true, initialState: { version: version['version'], model: version['resources']['file']['file'], mode: 'view' } }));
    });
  }

  add_version(version: IVersionParameters): void {
    this.adding_version = false;
    if (this.process['state'] === 'active') {
      this.process_controller.add_version(this.process['process'], version, this.display_service);
    }
  }

  public show_deactivation_confirmation(template: TemplateRef<any>): void {
    this.deactivation_modal = this.modal_service.show(template, { animated: true, class: 'deactivate-process-modal' });
  }

  public show_data(template: TemplateRef<any>): void {
    this.data_modal = this.modal_service.show(template, { animated: true, class: 'data-modal' });
  }

  public show_options(template: TemplateRef<any>): void {
    this.options_modal = this.modal_service.show(template, { animated: true, class: 'options-modal' });
  }

  public confirm_deactivation(): void {
    this.process_controller.deactivate(this.process['process'], this.display_service);
    this.deactivation_modal.hide();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
