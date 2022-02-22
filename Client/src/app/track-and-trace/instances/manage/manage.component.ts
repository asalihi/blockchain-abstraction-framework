import { Component, OnInit, TemplateRef, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TypeaheadConfig } from 'ngx-bootstrap/typeahead';

import { ITraceParameters, Event } from '@client/helpers/models/track-and-trace/trace';
import { JSONValidator } from '@client/helpers/validators/json.validator';
import { InstanceStateActions } from '@client/helpers/models/track-and-trace/instance';
import { ValidateEndEventIdentifier, ValidateTaskIdentifier } from '@client/helpers/validators/track-and-trace/version.validator';
import { VersionController } from '@client/helpers/services/track-and-trace/versions/controller.service';

@Component({
  selector: 'manage-instance-state',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.sass'],
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: TypeaheadConfig, useFactory: () => Object.assign(new TypeaheadConfig(), { cancelRequestOnFocusLost: true }) }]
})
export class ManageInstanceStateComponent implements OnInit {
  @Input() public action: 'activation' | 'update' | 'deactivation' | 'cancelation';
  @Input() public process: string;
  @Input() public version: string;
  public form: FormGroup;
  public cancel_modal: BsModalRef;
  public list_of_end_events: Observable<Event[]>;
  public list_of_tasks: Observable<string[]>;
  @Output() update_cancelled: EventEmitter<void> = new EventEmitter<void>();
  @Output() state_updated: EventEmitter<{ 'state': InstanceStateActions } & Partial<ITraceParameters>> = new EventEmitter<{ 'state': InstanceStateActions } & Partial<ITraceParameters>>();

  constructor(private modal_service: BsModalService, public display_modal: BsModalRef, private controller: VersionController) { }

  ngOnInit(): void {
    if (this.action === 'update') this.list_of_tasks = this.controller.fetch_tasks(this.process, this.version);
    if(this.action === 'deactivation') this.list_of_end_events = this.controller.fetch_events(this.process, this.version).pipe(map((events: Event[]) => events.filter((event: Event) => event['type'] === 'end')));
    this.setup_form();
  }

  confirm_state_update(): void {
    if (this.form.valid) {
      this.state_updated.emit({ 'state': this.action, ...(this.form.controls.data.value && { 'data': JSON.parse(this.form.controls.data.value) }), ...((this.action === 'update') && { 'task': this.form.controls.task.value }), ...(((this.action === 'update') && (this.form.controls.options.value)) && { 'options': JSON.parse(this.form.controls.options.value) }), ...((this.action === 'deactivation') && { 'end': this.form.controls.end.value }) });
      this.display_modal.hide();
    }
  }

  show_cancel_confirmation(template: TemplateRef<any>): void {
    this.cancel_modal = this.modal_service.show(template, { animated: true, class: 'cancel-state-update-modal' });
  }

  confirm_cancel(): void {
    this.cancel_modal.hide();
    this.update_cancelled.emit();
    this.display_modal.hide();
  }

  // TODO URGENT: Enable validators
  private setup_form(): void {
    this.form = new FormGroup({
      data: new FormControl('', [JSONValidator]),
      ...((this.action === 'update') && { task: new FormControl('', [Validators.required], [/*ValidateTaskIdentifier(this.controller, this.process, this.version)*/]), options: new FormControl('', [JSONValidator]) }),
    ...((this.action === 'deactivation') && { end: new FormControl('', [Validators.required], [/*ValidateEndEventIdentifier(this.controller, this.process, this.version)*/]) })
    });

    /*if (this.action === 'update') {
      this.form.controls.task.setValidators(Validators.required);
      this.form.controls.task.setAsyncValidators(ValidateTaskIdentifier(this.controller, this.process, this.version));
    } else if (this.action === 'deactivation') {
      this.form.controls.end.setValidators(Validators.required);
      this.form.controls.end.setAsyncValidators(ValidateEndEventIdentifier(this.controller, this.process, this.version));
    } else {
      this.form.controls.end.clearValidators();
    }
    this.form.controls.end.updateValueAndValidity();*/
  }
}
