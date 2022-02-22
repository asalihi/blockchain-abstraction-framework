import { Component, OnInit, ViewChildren, QueryList, TemplateRef } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ResolvedValue } from '@client/helpers/utils/resolver';
import { CleanObject } from '@client/helpers/utils/functions';
import { NotificationService } from '@client/helpers/services/notification.service';
import { DisplayInstancesService } from '@client/helpers/services/track-and-trace/instances/display-instances.service';
import { VersionController } from '@client/helpers/services/track-and-trace/versions/controller.service';
import { IVersion, IVersionInformation } from '@client/helpers/models/track-and-trace/version';
import { IInstanceParameters, IInstance } from '@client/helpers/models/track-and-trace/instance';
import { NgbdSortableHeader, SortEvent } from '@client/helpers/directives/sortable.directive';
import { DisplayModelerComponent } from '@client/helpers/components/modals/display-modeler/display-modeler.component';
import { InstanceController } from '@client/helpers/services/track-and-trace/instances/controller.service';

@Component({
  selector: 'view-version',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.sass'],
  providers: [{ provide: DisplayInstancesService, useValue: DisplayInstancesService }]
})
export class ViewVersionComponent implements OnInit {
  display_service: DisplayInstancesService;
  version: IVersionInformation;
  error: HttpErrorResponse;
  instances: BehaviorSubject<IInstance[]>;
  total_number_of_instances: Observable<number>;
  display_modeler_modal: BsModalRef;
  deactivation_modal: BsModalRef;
  data_modal: BsModalRef;
  options_modal: BsModalRef;
  adding_instance: boolean = false;
  private subscriptions: Subscription[] = [];
  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader<IInstance>>;

  constructor(private location: Location, private modal_service: BsModalService, private route: ActivatedRoute, private http: HttpClient, private notification_service: NotificationService, private version_controller: VersionController, private instance_controller: InstanceController) {
    this.route.data.subscribe((data: any) => this.load(data['response']));
    this.subscriptions.push(
      this.version_controller.changes.subscribe((changes: { version: string, changes: Partial<IVersion> }) => {
        if (this.version['version'] === changes['version']) Object.assign(this.version, changes['changes']);
      }),
      // TODO: DELETE
      /*this.instance_controller.changes.subscribe(_ => {
        this.notification_service.show_info({ 'message': 'List of instances has changed. Do you want to update the table?', 'actions': [{ 'type': 'info', 'name': 'reload', 'message': 'Reload', 'close': true }] }).onAction.subscribe((event: any) => {
          this.display_service.search.next();
        });
      })*/
    );
  }

  ngOnInit(): void { }

  public back(): void {
    this.location.back();
  }

  public load(response: ResolvedValue<IVersionInformation>): void {
    if (response.has_error()) {
      this.error = response.error;
      throw response.error;
    } else {
      this.version = CleanObject<IVersionInformation>(response.value);
      this.display_service = new DisplayInstancesService(this.http, { 'process': this.version['process'], 'version': this.version['version'] });
      this.display_service.search.next();
      this.instances = this.display_service.get_elements();
      this.total_number_of_instances = this.display_service.get_number_of_elements();
    }
  }

  public sort({ column, direction }: SortEvent<IInstance>): void {
    this.headers.forEach((header: NgbdSortableHeader<Omit<IInstance, 'signature'>>) => {
      if (header['sortable'] !== column) header['direction'] = '';
    });

    if (this.display_service['sort_field'] !== column) direction = 'desc';

    this.display_service['sort_field'] = column;
    this.display_service['sort_direction'] = direction;
  }

  public refresh_table(): void {
    this.display_service.search.next();
  }

  public view_model(): void {
    setTimeout(() => {
      this.display_modeler_modal = this.modal_service.show(DisplayModelerComponent, Object.assign({ class: 'bpmn-display-modal', animated: true, initialState: { version: this.version['version'], model: this.version['resources']['file']['file'], mode: 'view' } }));
    });
  }

  public add_instance(instance: IInstanceParameters): void {
    this.adding_instance = false;
    if (this.version['state'] === 'active') {
      const { process, version, ...parameters } = instance;
      this.version_controller.add_instance(this.version['process'], this.version['version'], parameters, this.display_service);
    }
  }

  public show_deactivation_confirmation(template: TemplateRef<any>): void {
    this.deactivation_modal = this.modal_service.show(template, { animated: true, class: 'deactivate-version-modal' });
  }

  public confirm_deactivation(): void {
    this.version_controller.deactivate(this.version['process'], this.version['version'], this.display_service);
    this.deactivation_modal.hide();
  }

  public show_data(template: TemplateRef<any>): void {
    this.data_modal = this.modal_service.show(template, { animated: true, class: 'data-modal' });
  }

  public show_options(template: TemplateRef<any>): void {
    this.options_modal = this.modal_service.show(template, { animated: true, class: 'options-modal' });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
