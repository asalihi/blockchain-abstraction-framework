import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule, ToastContainerModule } from 'ngx-toastr';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TimeagoModule } from 'ngx-timeago';

import { AppRoutingModule } from '@client/app-routing.module';
import { AppComponent } from '@client/app.component';
import { ApplicationErrorHandler } from '@client/helpers/handlers/error.handler';
import { CoreService } from '@client/helpers/services/core.service';
import { AuthenticationService, AuthenticationServiceFactory } from '@client/helpers/services/authentication.service';
import { NotificationService } from '@client/helpers/services/notification.service';
import { CredentialsInterceptor } from '@client/helpers/interceptors/credentials.interceptor';
import { ErrorInterceptor } from '@client/helpers/interceptors/error.interceptor';
import { NotificationComponent } from '@client/helpers/components/notification/notification.component';
import { NotificationDetailsComponent } from '@client/helpers/components/notification/details/details.component';
import { HomeComponent } from '@client/home/home.component';
import { NotFoundComponent } from '@client/notfound/notfound.component';

@NgModule({
  declarations: [
    AppComponent,
    NotificationComponent,
    NotificationDetailsComponent,
    HomeComponent,
    NotFoundComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FlexLayoutModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({ toastComponent: NotificationComponent }),
    ToastContainerModule,
    NgbModule,
    TimeagoModule.forRoot()
  ],
  providers: [
    CoreService,
    AuthenticationService,
    NotificationService,
    { provide: APP_INITIALIZER, useFactory: AuthenticationServiceFactory, deps: [ AuthenticationService ], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: CredentialsInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: ErrorHandler, useClass: ApplicationErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
