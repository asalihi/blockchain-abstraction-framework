import { Component, OnInit, ViewEncapsulation, Output, EventEmitter, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ProcessController } from '@client/helpers/services/track-and-trace/processes/controller.service';
import { IVersionParameters } from '@client/helpers/models/track-and-trace/version';
import { MINIMUM_LENGTH_VERSION_IDENTIFIER } from '@client/helpers/constants/constants';
import { DisplayModelerComponent } from '@client/helpers/components/modals/display-modeler/display-modeler.component';
import { ConfirmDeleteComponent } from '@client/helpers/components/modals/confirm-delete/confirm-delete.component';
import { IProcessWithVersions } from '@client/helpers/models/track-and-trace/process';
import { JSONInputComponent } from '@client/helpers/components/modals/json-input/json-input.component';

interface IError {
  'type'?: 'invalid-or-missing-fields',
  'activated': boolean
}

@Component({
  selector: 'create-process',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.sass'],
  encapsulation: ViewEncapsulation.None
})
export class CreateProcessComponent implements OnInit {
  form: FormGroup;
  versions: IVersionParameters[] = [];
  adding_version: boolean = false;
  cancel_modal: BsModalRef;
  display_modeler_modal: BsModalRef;
  delete_version_modal: BsModalRef;
  data_modal: BsModalRef;
  options_modal: BsModalRef;
  data?: Object;
  options?: Object;
  index_of_version_to_edit?: number;
  error: IError = { 'activated': false };
  @Output() cancelled: EventEmitter<void> = new EventEmitter<void>();
  @Output() saved: EventEmitter<IProcessWithVersions> = new EventEmitter<IProcessWithVersions>();

  constructor(private router: Router, private route: ActivatedRoute, private modal_service: BsModalService, public controller: ProcessController) { }

  ngOnInit(): void {
    this.form = new FormGroup({
      identifier: new FormControl('', [Validators.required, Validators.minLength(MINIMUM_LENGTH_VERSION_IDENTIFIER), Validators.pattern('^[a-zA-Z0-9]*$')])
    });
  }

  show_data_modal(): void {
    setTimeout(() => {
      this.data_modal = this.modal_service.show(JSONInputComponent, { animated: true, ignoreBackdropClick: true, keyboard: false, class: 'json-input-modal', initialState: { content: 'data', data: JSON.stringify(this.data) } });
      this.data_modal.content.cancelled.subscribe(() => { delete this.data });
      this.data_modal.content.saved.subscribe((data: Object) => { this.data = data });
    });
  }

  show_options_modal(): void {
    setTimeout(() => {
      this.options_modal = this.modal_service.show(JSONInputComponent, { animated: true, ignoreBackdropClick: true, keyboard: false, class: 'json-input-modal', initialState: { content: 'options', data: JSON.stringify(this.options) } });
      this.options_modal.content.cancelled.subscribe(() => { delete this.options });
      this.options_modal.content.saved.subscribe((data: Object) => { this.options = data });
    });
  }

  create_version(): void {
    delete this.index_of_version_to_edit;
    this.adding_version = true;
  }

  edit_version(index: number): void {
    this.index_of_version_to_edit = index;
    this.adding_version = true;
  }

  add_version(version: IVersionParameters): void {
    this.adding_version = false;
    if(!this.versions.find((v: IVersionParameters) => v['identifier'] === version['identifier'])) this.versions.push(version);
  }

  update_version(version: IVersionParameters): void {
    this.versions[this.index_of_version_to_edit] = version;
    delete this.index_of_version_to_edit;
    this.adding_version = false;
  }

  view_model(version: string): void {
    this.show_model(version, 'view');
  }

  edit_model(version: string): void {
    this.show_model(version, 'edition');
  }

  show_model(version_identifier: string, mode: 'view' | 'edition'): void {
    let version: IVersionParameters | undefined = this.versions.find((version: IVersionParameters) => version['identifier'] === version_identifier);
    if (version) {
      setTimeout(() => {
        this.display_modeler_modal = this.modal_service.show(DisplayModelerComponent, Object.assign({ class: 'bpmn-display-modal', animated: true, initialState: { process: version['identifier'], model: version['file'], mode: mode } }, { ...((mode !== 'view') && { ignoreBackdropClick: true, keyboard: false }) }));
        if (mode === 'edition') {
          this.display_modeler_modal.content.model_saved.subscribe((version: IVersionParameters) => this.update_model(version));
        }
      });
    }
  }

  update_model(version: IVersionParameters): void {
    let index_of_version: number = this.versions.findIndex((v: IVersionParameters) => v['identifier'] === version['identifier']);
    this.versions[index_of_version] = version;
  }

  confirm_deletion_of_version(version: string): void {
    this.delete_version_modal = this.modal_service.show(ConfirmDeleteComponent, { animated: true, initialState: { identifier: version } });
    this.delete_version_modal.content.deletion_confirmed.subscribe((version: string) => this.delete_version(version));
  }

  delete_version(identifier: string): void {
    this.versions = this.versions.filter((version: IVersionParameters) => version['identifier'] !== identifier);
  }

  public show_cancel_confirmation(template: TemplateRef<any>): void {
    this.cancel_modal = this.modal_service.show(template, { animated: true, class: 'cancel-process-creation-modal' });
  }

  public confirm_cancel(): void {
    this.cancel_modal.hide();
    this.cancel();
  }

  public cancel(): void {
    this.cancelled.emit();
  }

  public save(): void {
    if (this.form['valid']) {
      this.saved.emit({ 'process': this.form.controls.identifier.value, 'versions': this.versions, ...(this.data && { 'data': this.data }), ...(this.options && { 'options': this.options }) });
    } else this.error = { 'activated': true, 'type': 'invalid-or-missing-fields' };
  }
}
