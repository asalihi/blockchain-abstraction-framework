import { Component, OnInit, ViewChildren, QueryList, TemplateRef } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ResolvedValue } from '@client/helpers/utils/resolver';
import { InstanceController } from '@client/helpers/services/track-and-trace/instances/controller.service';
import { NgbdSortableHeader, SortEvent } from '@client/helpers/directives/sortable.directive';
import { IInstance, InstanceStateActions } from '@client/helpers/models/track-and-trace/instance';
import { ITrace, ITraceParameters } from '@client/helpers/models/track-and-trace/trace';
import { DisplayTracesService } from '@client/helpers/services/track-and-trace/traces/display-traces.service';
import { ManageInstanceStateComponent } from '@client/track-and-trace/instances/manage/manage.component';

@Component({
  selector: 'view-instance',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.sass'],
  providers: [{ provide: DisplayTracesService, useValue: DisplayTracesService }]
})
export class ViewInstanceComponent implements OnInit {
  display_service: DisplayTracesService;
  instance: IInstance;
  error: HttpErrorResponse;
  updates: BehaviorSubject<ITrace[]>;
  total_number_of_updates: Observable<number>;
  update_state_modal: BsModalRef;
  data_modal: BsModalRef;
  options_modal: BsModalRef;
  @ViewChildren(NgbdSortableHeader) headers: QueryList<NgbdSortableHeader<Pick<ITrace, 'identifier' | 'timestamp' | 'type' | 'task'>>>;
  private subscriptions: Subscription[] = [];

  constructor(private location: Location, private router: Router, private route: ActivatedRoute, private http: HttpClient, private controller: InstanceController, private modal_service: BsModalService) {
    this.route.data.subscribe((data: any) => this.load(data['response']));
    this.subscriptions.push(
      this.controller.changes.subscribe((changes: Object) => {
        if (this.instance['instance'] === changes['instance']) Object.assign(this.instance, changes['changes']);
      })
    );
  }

  ngOnInit(): void { }

  public back(): void {
    this.location.back();
  }

  public load(response: ResolvedValue<IInstance>): void {
    if (response.has_error()) {
      this.error = response.error;
      throw response.error;
    } else {
      this.instance = response.value;
      this.display_service = new DisplayTracesService(this.http, { 'process': this.instance['process'], 'version': this.instance['version'], 'instance': this.instance['instance'] });
      this.display_service.search.next();
      this.updates = this.display_service.get_elements();
      this.total_number_of_updates = this.display_service.get_number_of_elements();
    }
  }

  public sort({ column, direction }: SortEvent<Pick<ITrace, 'identifier' | 'timestamp' | 'type' | 'task'>>): void {
    this.headers.forEach((header: NgbdSortableHeader<Pick<ITrace, 'identifier' | 'timestamp' | 'type' | 'task'>>) => {
      if (header['sortable'] !== column) header['direction'] = '';
    });

    if (this.display_service['sort_field'] !== column) direction = 'desc';

    this.display_service['sort_field'] = column;
    this.display_service['sort_direction'] = direction;
  }

  public show_trace(identifier: string, type: 'state' | 'update'): void {
    console.log('We have to display trace: ' + identifier);
    console.log('(type: ' + type + ')');
  }

  private show_update_state_modal(action: InstanceStateActions): void {
    setTimeout(() => {
      this.update_state_modal = this.modal_service.show(ManageInstanceStateComponent, Object.assign({ class: 'instance-state-update-modal', animated: true, initialState: { process: this.instance['process'], version: this.instance['version'], action: action }, keyboard: false, ignoreBackdropClick: true }));
      this.update_state_modal.content.update_cancelled.subscribe(() => this.update_state_modal.hide());
      this.update_state_modal.content.state_updated.subscribe((information: { 'state': InstanceStateActions } & Partial<ITraceParameters>) => this.update_state(information));
    });
  }

  public activate(): void {
    if (!this.instance['start'] && !this.instance['end']) this.show_update_state_modal('activation');
  }

  public update(): void {
    if (this.instance['start'] && !this.instance['end']) this.show_update_state_modal('update');
  }

  public deactivate(): void {
    if (this.instance['start'] && !this.instance['end']) this.show_update_state_modal('deactivation');
  }

  public cancel(): void {
    if (this.instance['start'] && !this.instance['end']) this.show_update_state_modal('cancelation');
  }

  public update_state(information: { 'state': InstanceStateActions } & Partial<ITraceParameters>): void {
    const { state, ...trace } = information;
    const { process, version, instance } = this.instance;
    if (state === 'activation') this.controller.activate({ process, version, instance }, trace, this.display_service);
    else if (state === 'update') this.controller.update({ process, version, instance }, trace, this.display_service);
    else if (state === 'deactivation') this.controller.deactivate({ process, version, instance }, trace, this.display_service);
    else if (state === 'cancelation') this.controller.cancel({ process, version, instance }, trace, this.display_service);
    this.update_state_modal.hide();
  }

  public show_data(template: TemplateRef<any>): void {
    this.data_modal = this.modal_service.show(template, { animated: true, class: 'data-modal' });
  }

  public show_options(template: TemplateRef<any>): void {
    this.options_modal = this.modal_service.show(template, { animated: true, class: 'options-modal' });
  }

  public refresh_table(): void {
    this.display_service.search.next();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}
