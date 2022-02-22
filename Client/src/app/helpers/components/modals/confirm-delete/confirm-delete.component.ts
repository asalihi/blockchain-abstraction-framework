import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete.component.html',
  styleUrls: ['./confirm-delete.component.sass']
})
export class ConfirmDeleteComponent implements OnInit {
  identifier: string;
  @Output() deletion_confirmed: EventEmitter<string> = new EventEmitter<string>();

  constructor(public modal: BsModalRef) { }

  ngOnInit(): void { }

  confirm_deletion(): void {
    this.deletion_confirmed.emit(this.identifier);
    this.modal.hide();
  }
}
