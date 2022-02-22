import { Component, OnInit, TemplateRef } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ResolvedValue } from '@client/helpers/utils/resolver';
import { ITrace } from '@client/helpers/models/track-and-trace/trace';

@Component({
  selector: 'view-trace',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.sass'],
  providers: []
})
export class ViewTraceComponent implements OnInit {
  trace: ITrace;
  error: HttpErrorResponse;
  data_modal: BsModalRef;
  options_modal: BsModalRef;
  verifications_modal: BsModalRef;

  constructor(private location: Location, private route: ActivatedRoute, private http: HttpClient, private modal_service: BsModalService) {
    this.route.data.subscribe((data: any) => this.load(data['response']));
  }

  ngOnInit(): void { }

  public back(): void {
    this.location.back();
  }

  public load(response: ResolvedValue<ITrace>): void {
    if (response.has_error()) {
      this.error = response.error;
      throw response.error;
    } else {
      this.trace = response.value;
    }
  }

  public show_data(template: TemplateRef<any>): void {
    this.data_modal = this.modal_service.show(template, { animated: true, class: 'data-modal' });
  }

  public show_options(template: TemplateRef<any>): void {
    this.options_modal = this.modal_service.show(template, { animated: true, class: 'options-modal' });
  }

  public show_verifications(template: TemplateRef<any>): void {
    this.verifications_modal = this.modal_service.show(template, { animated: true, class: 'verifications-modal' });
  }

  ngOnDestroy() { }
}
