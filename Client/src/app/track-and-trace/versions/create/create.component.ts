import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import BPMNViewer from 'bpmn-js/lib/Viewer';

import { IVersionParameters } from '@client/helpers/models/track-and-trace/version';
import { DisplayModelerComponent } from '@client/helpers/components/modals/display-modeler/display-modeler.component';
import { MINIMUM_LENGTH_VERSION_IDENTIFIER, MAX_BPMN_FILE_SIZE } from '@client/helpers/constants/constants';
import { JSONInputComponent } from '@client/helpers/components/modals/json-input/json-input.component';

interface IError {
  'type'?: 'invalid-or-missing-fields' | 'upload-generic-error' | 'upload-invalid-file' | 'upload-max-size-reached',
  'activated': boolean
}

@Component({
  selector: 'create-version',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.sass']
})
export class CreateVersionComponent implements OnInit {
  readonly MAX_BPMN_FILE_SIZE = MAX_BPMN_FILE_SIZE;
  cancel_modal: BsModalRef;
  display_modal: BsModalRef;
  data_modal: BsModalRef;
  options_modal: BsModalRef;
  @Output() cancelled: EventEmitter<void> = new EventEmitter<void>();
  @Output() saved: EventEmitter<IVersionParameters> = new EventEmitter<IVersionParameters>();
  form: FormGroup;
  error: IError = { 'activated': false };
  modeler_error: boolean = false;
  editing: boolean = false;
  file: File;
  @Input() version: Partial<IVersionParameters> = {};
  @ViewChild('file_input') file_input: ElementRef;

  constructor(private modal_service: BsModalService) { }

  ngOnInit(): void {
    console.log('Component initialized');
    console.log(JSON.stringify(this.version));
    this.form = new FormGroup({
      identifier: new FormControl(this.version.identifier, [Validators.required, Validators.minLength(MINIMUM_LENGTH_VERSION_IDENTIFIER), Validators.pattern('^[a-zA-Z0-9]*$')])
    });
  }

  public show_data_modal(): void {
    setTimeout(() => {
      this.form.controls.identifier.errors
      this.data_modal = this.modal_service.show(JSONInputComponent, { animated: true, ignoreBackdropClick: true, keyboard: false, class: 'json-input-modal', initialState: { content: 'data', data: JSON.stringify(this.version['data']) } });
      this.data_modal.content.cancelled.subscribe(() => { delete this.version['data'] });
      this.data_modal.content.saved.subscribe((data: Object) => { this.version['data'] = data });
    });
  }

  public show_options_modal(): void {
    setTimeout(() => {
      this.options_modal = this.modal_service.show(JSONInputComponent, { animated: true, ignoreBackdropClick: true, keyboard: false, class: 'json-input-modal', initialState: { content: 'options', data: JSON.stringify(this.version['options']) } });
      this.options_modal.content.cancelled.subscribe(() => { delete this.version['options'] });
      this.options_modal.content.saved.subscribe((data: Object) => { this.version['options'] = data });
    });
  }

  public load_file(files: FileList): void {
    this.editing = false;

    try {
     let reader: FileReader = new FileReader();
      reader.onload = async (event: ProgressEvent): Promise<void> => {
        try {
          this.file_input.nativeElement.value = '';
          await (new BPMNViewer()).importXML(reader.result);
          this.version['file'] = reader.result.toString();
        } catch {
          this.error = { 'activated': true, 'type': 'upload-invalid-file' };
        }
      };
      if (files.length > 0) {
        this.file = files.item(0);

        if (this.file.size <= MAX_BPMN_FILE_SIZE) reader.readAsText(this.file);
        else this.error = { 'activated': true, 'type': 'upload-max-size-reached' };
      }
    } catch {
      this.error = { 'activated': true, 'type': 'upload-generic-error' };
    }
  }

  public show_modeler(): void {
    this.editing = true;
    this.error = { 'activated': false };
    setTimeout(() => {
      this.display_modal = this.modal_service.show(DisplayModelerComponent, { animated: true, ignoreBackdropClick: true, keyboard: false, class: 'bpmn-display-modal', initialState: { mode: (this.version['file'] ? 'edition' : 'creation'), process: this.form.controls.identifier.value, model: this.version['file'] } });
      this.display_modal.content.edition_cancelled.subscribe(() => this.cancel_model_edition());
      this.display_modal.content.model_saved.subscribe((model: Pick<IVersionParameters, 'file'> & Partial<Pick<IVersionParameters, 'identifier'>>) => this.save_model(model));
    });
  }

  public save_model(model: Pick<IVersionParameters, 'file'> & Partial<Pick<IVersionParameters, 'identifier'>>): void {
    this.editing = false;
    this.version['file'] = model['file'];
    this.display_modal.hide();
  }

  public cancel_model_edition(): void {
    this.editing = false;
    this.display_modal.hide();
  }

  public save(): void {
    if (this.form['valid']) {
      this.version['identifier'] = this.form['controls']['identifier']['value'];
      if (this.version['identifier'] && this.version['file']) this.saved.emit(this.version as IVersionParameters);
      else this.error = { 'activated': true, 'type': 'invalid-or-missing-fields' };
    }
  }

  public show_cancel_confirmation(template: TemplateRef<any>): void {
    this.cancel_modal = this.modal_service.show(template, { animated: true, class: 'cancel-version-creation-modal' });
  }

  public confirm_cancel(): void {
    this.cancel_modal.hide();
    this.cancel();
  }

  public cancel(): void {
    this.cancelled.emit();
  }
}
