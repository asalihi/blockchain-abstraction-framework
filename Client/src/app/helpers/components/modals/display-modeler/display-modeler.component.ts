import { Component, OnInit, TemplateRef, ViewEncapsulation, ViewChild, Output, EventEmitter } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { BPMNModelerComponent } from '@client/helpers/components/bpmn-modeler/bpmn-modeler.component';
import { IVersionParameters } from '@client/helpers/models/track-and-trace/version';

@Component({
  selector: 'app-display-modeler',
  templateUrl: './display-modeler.component.html',
  styleUrls: ['./display-modeler.component.sass'],
  encapsulation: ViewEncapsulation.None
})
export class DisplayModelerComponent implements OnInit {
  public mode: 'view' | 'creation' | 'edition';
  public model?: string;
  public process?: string;
  public cancel_modal: BsModalRef;
  public has_errors: boolean = false;
  public saving_while_errors: boolean = false;
  @ViewChild('modeler') modeler: BPMNModelerComponent;
  @Output() edition_cancelled: EventEmitter<void> = new EventEmitter<void>();
  @Output() model_saved: EventEmitter<Pick<IVersionParameters, 'file'> & Partial<Pick<IVersionParameters, 'identifier'>>> = new EventEmitter<Pick<IVersionParameters, 'file'> & Partial<Pick<IVersionParameters, 'identifier'>>>();

  constructor(private modal_service: BsModalService, public display_modal: BsModalRef) { }

  ngOnInit(): void { }

  async save_model(): Promise<void> {
    let model: string | null = await this.modeler.fetch();
    if (model) {
      this.saving_while_errors = false;
      this.model = model;
      this.model_saved.emit({ ...(this.process && { 'identifier': this.process }), 'file': model });
      this.display_modal.hide();
    } else {
      this.saving_while_errors = true;
    }
  }

  show_cancel_confirmation(template: TemplateRef<any>): void {
    this.cancel_modal = this.modal_service.show(template, { animated: true, class: 'cancel-edition-modal' });
  }

  confirm_cancel(): void {
    this.cancel_modal.hide();
    this.edition_cancelled.emit();
    this.display_modal.hide();
  }
}
