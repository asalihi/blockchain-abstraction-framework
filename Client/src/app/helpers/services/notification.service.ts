import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActiveToast, ToastrService } from 'ngx-toastr';

import { NotificationComponent } from '@client/helpers/components/notification/notification.component';

const DEFAULT_OPTIONS: any = {
  timeOut: 10000,
  extendedTimeOut: 0,
  tapToDismiss: false,
  closeButton: true,
  enableHtml: true,
  progressBar: true
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private toastr: ToastrService) { }

  close(notification: number): void {
    this.toastr.clear(notification);
  }

  show(options: any): ActiveToast<NotificationComponent> {
    options = Object.assign({}, DEFAULT_OPTIONS, options, { 'date': Date.now() - 1000 });
    if (options['title'] && options['message']) return this.toastr.show(options['message'], options['title'], options);
  }

  show_info(options: any): ActiveToast<NotificationComponent> {
    options = Object.assign({}, DEFAULT_OPTIONS, { 'notification': 'info', 'title': 'Information' }, options, { 'date': Date.now() - 1000 });
    if (options['title'] && options['message']) return this.toastr.show(options['message'], options['title'], options);
  }

  show_success(options: any): ActiveToast<NotificationComponent> {
    options = Object.assign({}, DEFAULT_OPTIONS, { 'notification': 'success', 'title': 'Success' }, options, { 'date': Date.now() - 1000 });
    if (options['title'] && options['message']) return this.toastr.show(options['message'], options['title'], options);
  }

  show_error(options: any): ActiveToast<NotificationComponent> {
    options = Object.assign({}, DEFAULT_OPTIONS, { 'notification': 'error', 'title': 'Error' }, options, { 'date': Date.now() - 1000 });
    if (options['title'] && options['message']) return this.toastr.show(options['message'], options['title'], options);
  }

  show_http_error(error: HttpErrorResponse, options: any, retry: boolean = false): ActiveToast<NotificationComponent> {
    const details: Object = {
      'options': {
        'container': {
          'border': {
            'visibile': true,
            'color': 'dark',
            'size': '3px!important'
          }
        },
        'headers': {
          'background': {
            'color': 'dark'
          },
          'text': {
            'color': 'white'
          }
        },
        'content': {
          'background': {
            'color': 'white'
          },
          'text': {
            'color': 'dark'
          }
        }
      },
      'data': {
        'headers': [
          {
            'title': 'Error',
            'value': error['error']?.['code'] ?? error['status']
          },
          {
            'title': 'Message',
            'value': error['error']?.['message'] ?? error['message']
          }
        ],
        'content': [
          {
            'title': 'Description',
            'value': error['error']?.['description']
          },
          {
            'title': 'Resolution',
            'value': error['error']?.['resolution']
          }
        ]
      }
    };
    options = Object.assign({}, DEFAULT_OPTIONS, { 'notification': 'error', 'title': 'Error' }, { 'details': details }, options, { 'date': Date.now() - 1000 }, { ...(retry && { 'actions': [{ 'type': 'error', 'name': 'retry', 'message': 'Retry', 'data': {}, 'close': true }] }) });
    if (options['title'] && options['message']) return this.toastr.show(options['message'], options['title'], options);
  }
}
