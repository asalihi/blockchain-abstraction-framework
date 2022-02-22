import { Component, ViewChild, OnInit } from '@angular/core';
import { Router, RouterEvent, NavigationEnd, NavigationError, NavigationCancel } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, takeUntil, tap, delay } from 'rxjs/operators';
import { ToastrService, ToastContainerDirective } from 'ngx-toastr';

import { DELAY_BEFORE_LOADING_SCREEN } from '@client/helpers/constants/constants';
import { AuthenticationService } from '@client/helpers/services/authentication.service';
import { User } from '@client/helpers/models/user';
import { NotificationService } from '@client/helpers/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  loading: boolean;
  user: User;
  @ViewChild(ToastContainerDirective, { static: true }) toastContainer: ToastContainerDirective;

  constructor(private router: Router, private authenticationService: AuthenticationService, private toastr: ToastrService, private notificationService: NotificationService) {
    const navigation_end_events: Observable<RouterEvent> = this.router.events.pipe(filter((event: RouterEvent) => event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError), tap(_ => this.loading = false));
    this.router.events.pipe(delay(DELAY_BEFORE_LOADING_SCREEN), takeUntil(navigation_end_events), tap(_ => this.loading = true)).subscribe();
    this.authenticationService.user.subscribe((user: User) => this.user = user);
  }

  onInit() { }

  ngOnInit() {
    this.toastr.overlayContainer = this.toastContainer;
    /*this.notificationService.show({
      'notification': 'error', 'title': 'Error', 'message': `<b>process16</b> could not be created.`, 'details': '<b>Code:</b>400<br/><b>Message:</b>Bad request<br/><b>Description:</b>Request is malformed (one or more parameters are missing or incorrect)<br/><b>Resolution:</b>You should provide all required parameters as per the official API documentation', 'actions': [{ 'type': 'error', 'name': 'retry', 'message': 'Retry', 'data': {}, 'close': false }] })
    /*
    this.notificationService.show({ 'notification': 'error', 'title': 'Error', 'message': 'An unexpected error occurred! Then comes a very detailed explanation if needed, making the toast being bigger, thus max-width limit!' });
    this.notificationService.show({ 'notification': 'warning', 'title': 'Error', 'message': 'An unexpected error occurred! Then comes a very detailed explanation if needed, making the toast being bigger, thus max-width limit!' });
    this.notificationService.show({ 'notification': 'info', 'title': 'Error', 'message': 'An unexpected error occurred! Then comes a very detailed explanation if needed, making the toast being bigger, thus max-width limit!' });
    this.notificationService.show({ 'notification': 'success', 'title': 'Error', 'message': 'An unexpected error occurred! Then comes a very detailed explanation if needed, making the toast being bigger, thus max-width limit!' });
    this.notificationService.show({ 'notification': 'message', 'title': 'Error', 'message': 'An unexpected error occurred! Then comes a very detailed explanation if needed, making the toast being bigger, thus max-width limit!' });
    */
  }

  async logout(): Promise<void> {
    await this.authenticationService.logout();
    this.router.navigate(['authentication/login']);
  }
}
