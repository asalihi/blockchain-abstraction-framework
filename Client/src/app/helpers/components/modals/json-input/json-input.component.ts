import { Component, OnInit, TemplateRef, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { JSONValidator } from '@client/helpers/validators/json.validator';

@Component({
  selector: 'json-input',
  templateUrl: './json-input.component.html',
  styleUrls: ['./json-input.component.sass'],
  encapsulation: ViewEncapsulation.None
})
export class JSONInputComponent implements OnInit {
  public content: string;
  public data: string;
  public cancel_modal: BsModalRef;
  public form: FormGroup;
  @Output() cancelled: EventEmitter<void> = new EventEmitter<void>();
  @Output() saved: EventEmitter<Object> = new EventEmitter<Object>();

  constructor(private modal_service: BsModalService, public display_modal: BsModalRef) { }

  ngOnInit(): void {
    this.form = new FormGroup({
      data: new FormControl(this.data, [Validators.required, JSONValidator])
    });
  }

  async save_data(): Promise<void> {
    if (this.form.valid) {
      this.saved.emit(JSON.parse(this.form.controls.data.value));
      this.display_modal.hide();
    }
  }

  show_cancel_confirmation(template: TemplateRef<any>): void {
    this.cancel_modal = this.modal_service.show(template, { animated: true, class: 'cancel-json-input-modal' });
  }

  confirm_cancel(): void {
    this.cancel_modal.hide();
    this.cancelled.emit();
    this.display_modal.hide();
  }
}
