import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { TextFieldModule } from '@angular/cdk/text-field';
import { ModalModule, BsModalService } from 'ngx-bootstrap/modal';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { AlertModule } from 'ngx-bootstrap/alert';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FlexLayoutModule } from '@angular/flex-layout';

import { TrackAndTraceRoutingModule } from './track-and-trace-routing.module';
import { NgbdSortableHeader } from '@client/helpers/directives/sortable.directive';
import { ActiveProcessValidator } from '@client/helpers/validators/track-and-trace/process.validator';
import { ConfirmDeleteComponent } from '@client/helpers/components/modals/confirm-delete/confirm-delete.component';
import { BPMNModelerComponent } from '@client/helpers/components/bpmn-modeler/bpmn-modeler.component';
import { DisplayModelerComponent } from '@client/helpers/components/modals/display-modeler/display-modeler.component';
import { JSONInputComponent } from '@client/helpers/components/modals/json-input/json-input.component';
import { DropdownComponent } from '@client/helpers/components/forms/dropdown/dropdown.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ListProcessesComponent } from './processes/list/list.component';
import { ListInstancesComponent } from './instances/list/list.component';
import { CreateProcessComponent } from './processes/create/create.component';
import { CreateVersionComponent } from './versions/create/create.component';
import { ViewProcessComponent } from './processes/view/view.component';
import { ViewVersionComponent } from './versions/view/view.component';
import { ViewInstanceComponent } from './instances/view/view.component';
import { ManageInstanceStateComponent } from './instances/manage/manage.component';
import { CreateInstanceComponent } from './instances/create/create.component';
import { ListOfProcessesMinimalComponent } from './instances/create/list-processes/list-processes.component';
import { ListOfVersionsMinimalComponent } from './instances/create/list-versions/list-versions.component';
import { ViewTraceComponent } from './traces/view/view.component';

@NgModule({
  declarations: [NgbdSortableHeader, ActiveProcessValidator, ConfirmDeleteComponent, DropdownComponent, ListProcessesComponent, ListInstancesComponent, HomeComponent, BPMNModelerComponent, DisplayModelerComponent, JSONInputComponent, CreateProcessComponent, DashboardComponent, CreateVersionComponent, ViewProcessComponent, ViewVersionComponent, ViewInstanceComponent, ManageInstanceStateComponent, CreateInstanceComponent, ListOfProcessesMinimalComponent, ListOfVersionsMinimalComponent, ViewTraceComponent],
  imports: [
    CommonModule,
    TrackAndTraceRoutingModule,
    FormsModule,
    ClipboardModule,
    TextFieldModule,
    ReactiveFormsModule,
    ModalModule.forRoot(),
    AlertModule.forRoot(),
    BsDropdownModule.forRoot(),
    TypeaheadModule.forRoot(),
    NgbModule,
    FlexLayoutModule

  ],
  providers: [BsModalService]
})
export class TrackAndTraceModule { }
