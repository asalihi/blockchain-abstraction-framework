import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ToastrService, ToastPackage, Toast } from 'ngx-toastr';

@Component({
  selector: '[notification]',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.sass'],
  encapsulation: ViewEncapsulation.None
})
export class NotificationComponent extends Toast implements OnInit {

  constructor(public service: ToastrService, public toast_package: ToastPackage) {
    super(service, toast_package);
  }

  ngOnInit(): void { }

  call_action(event: Event, action: string, data?: any, close: boolean = true): boolean {
    event.stopPropagation();
    this.toast_package.triggerAction(Object.assign({ 'action': action, ...(data && { data: data }) }));
    if (close) this.service.remove(this.toast_package.toastId);
    return false;
  }

  remove(): void {
    this.service.remove(this.toast_package.toastId);
  }
}
