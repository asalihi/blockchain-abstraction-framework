import { Component, OnInit, Input, Output, EventEmitter, HostListener, ViewChild, TemplateRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { NgbAccordion } from '@ng-bootstrap/ng-bootstrap';

import { IInstanceParameters } from '@client/helpers/models/track-and-trace/instance';
import { ITraceParameters } from '@client/helpers/models/track-and-trace/trace';
import { MINIMUM_LENGTH_VERSION_IDENTIFIER } from '@client/helpers/constants/constants';
import { JSONValidator } from '@client/helpers/validators/json.validator';
import { ValidateActiveVersion } from '@client/helpers/validators/track-and-trace/version.validator';
import { VersionController } from '@client/helpers/services/track-and-trace/versions/controller.service';

interface IError {
  'type'?: 'invalid-or-missing-fields',
  'activated': boolean
}

@Component({
  selector: 'create-instance',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.sass']
})
export class CreateInstanceComponent implements OnInit {
  private subscriptions: Subscription[] = [];
  @Input() extended: boolean = false;
  @Output() cancelled: EventEmitter<void> = new EventEmitter<void>();
  @Output() saved: EventEmitter<IInstanceParameters> = new EventEmitter<IInstanceParameters>();
  form: FormGroup;
  error: IError = { 'activated': false };
  instance: Partial<IInstanceParameters> = {};
  display_list_of_processes: boolean = false;
  display_list_of_versions: boolean = false;
  search_process: string;
  search_version: string;
  activation_modal: BsModalRef;
  cancel_modal: BsModalRef;
  activation_trace: Partial<ITraceParameters>;
  opened: boolean = false;
  disabled: boolean = false;
  @ViewChild('information') accordion: NgbAccordion;
  @ViewChild('confirm_cancel_template') confirm_cancel_template: TemplateRef<any>;

  constructor(private version_controller: VersionController, private modal_service: BsModalService) { }

  ngOnInit(): void {
    this.setup_form();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

  public save(): void {
    if (this.form['valid']) {
      this.instance = Object.assign({ 'instance': this.form.controls.identifier.value, ...(this.extended && { 'process': this.form.controls.process.value, 'version': this.form.controls.version.value }) }, { ...((this.form.controls.data.value && this.form.controls.data.value !== '') && { 'data': JSON.parse(this.form.controls.data.value) }), ...((this.form.controls.options.value && this.form.controls.options.value !== '') && { 'options': JSON.parse(this.form.controls.options.value) }) });
      if (this.instance['instance']) this.saved.emit(this.instance as IInstanceParameters);
    } else {
      this.error = { 'activated': true, 'type': 'invalid-or-missing-fields' };
      if (this.form.controls.data.invalid) this.accordion.expand('data-panel');
      if (this.form.controls.options.invalid) this.accordion.expand('options-panel');
    }
  }

  public show_cancel_confirmation(template: TemplateRef<any>): void {
    this.cancel_modal = this.modal_service.show(template, { animated: true, class: 'cancel-instance-creation-modal' });
  }

  public confirm_cancel(): void {
    this.cancel_modal.hide();
    this.cancel();
  }

  public cancel(): void {
    this.cancelled.emit();
  }

  public handle_cancel_action(): void {
    if (['identifier', 'process', 'version', 'data', 'options'].some((control: string) => this.form.controls[control]?.value)) {
      this.show_cancel_confirmation(this.confirm_cancel_template);
    }
    else {
      this.cancel();
    }
  }

  private setup_form(): void {
    this.form = new FormGroup({
      identifier: new FormControl(this.instance['instance'], [Validators.required, Validators.minLength(MINIMUM_LENGTH_VERSION_IDENTIFIER), Validators.pattern('^[a-zA-Z0-9]*$')]),
      data: new FormControl(this.instance['data'], [JSONValidator]),
      options: new FormControl(this.instance['options'], [JSONValidator]),
      ...(this.extended && { process: new FormControl(this.instance['process'], [Validators.required]) }),
      ...(this.extended && { version: new FormControl({ 'value': this.instance['version'], 'disabled': true }, [Validators.required]) })
    });
    if (this.extended) this.subscriptions.push(this.form['controls']['process'].statusChanges.subscribe((status: string) => this.update_version_field_logic(status)));
  }

  @HostListener('document:click', ['$event']) document_click(event: Event) {
    this.display_list_of_processes = false;
    this.display_list_of_versions = false;
  }

  show_list_of_processes(event: Event): void {
    this.display_list_of_processes = true;
    this.display_list_of_versions = false;
    event.stopPropagation();
  }

  update_list_of_processes(event: Event): void {
    this.display_list_of_versions = false;
    this.display_list_of_processes = true;
    this.search_process = this.form.controls.process.value;
    event.stopPropagation();
  }

  update_process_field(process: string): void {
    this.form.controls.process.setValue(process);
    this.form.controls.process.updateValueAndValidity();
    this.display_list_of_processes = false;
    this.search_process = '';
    event.stopPropagation();
  }

  update_version_field_logic(status: string): void {
    this.form.controls.version.setValue('');

    if (['PENDING', 'INVALID'].includes(status)) {
      this.form.controls.version.disable();
      this.form.controls.version.clearAsyncValidators();
    } else {
      this.form.controls.version.enable();
      this.form.controls.version.setAsyncValidators(ValidateActiveVersion(this.version_controller, this.form.controls.process.value));
    }
  }

  show_list_of_versions(event: Event): void {
    this.display_list_of_versions = true;
    this.display_list_of_processes = false;
    event.stopPropagation();
  }

  update_list_of_versions(event: Event): void {
    this.display_list_of_processes = false;
    this.display_list_of_versions = true;
    this.search_version = this.form.controls.version.value;
    event.stopPropagation();
  }

  update_version_field(version: string): void {
    this.form.controls.version.setValue(version);
    this.form.controls.version.updateValueAndValidity();
    this.display_list_of_versions = false;
    this.search_version = '';
    event.stopPropagation();
  }
}
