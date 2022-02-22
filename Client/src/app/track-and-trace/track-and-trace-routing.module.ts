import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NotFoundComponent } from '@client/notfound/notfound.component';
import { ProcessResolver } from '@client/helpers/resolvers/track-and-trace/processes/process.resolver';
import { VersionResolver } from '@client/helpers/resolvers/track-and-trace/versions/version.resolver';
import { InstanceResolver } from '@client/helpers/resolvers/track-and-trace/instances/instance.resolver';
import { TraceResolver } from '@client/helpers/resolvers/track-and-trace/traces/trace.resolver';
import { HomeComponent } from '@client/track-and-trace/home/home.component';
import { DashboardComponent } from '@client/track-and-trace/dashboard/dashboard.component';
import { ListProcessesComponent } from '@client/track-and-trace/processes/list/list.component';
import { ListInstancesComponent } from '@client/track-and-trace/instances/list/list.component';
import { ViewProcessComponent } from '@client/track-and-trace/processes/view/view.component';
import { ViewVersionComponent } from '@client/track-and-trace/versions/view/view.component';
import { ViewInstanceComponent } from '@client/track-and-trace/instances/view/view.component';
import { ViewTraceComponent } from '@client/track-and-trace/traces/view/view.component';
import { TracesDisplayerGuard } from '@client/helpers/guards/track-and-trace/traces';

const routes: Routes = [
  {
    path: '', component: HomeComponent,  children: [
      { path: '', component: DashboardComponent },
      { path: 'processes', component: ListProcessesComponent },
      { path: 'processes/:id', component: ViewProcessComponent, resolve: { response: ProcessResolver } },
      { path: `processes/:process/traces/:trace`, component: ViewTraceComponent, resolve: { response: TraceResolver } },
      { path: 'processes/:id/versions', redirectTo: 'processes/:id', pathMatch: 'full' },
      { path: 'processes/:process/versions/:version', component: ViewVersionComponent, resolve: { response: VersionResolver } },
      { path: `processes/:process/versions/:version/traces/:trace`, component: ViewTraceComponent, resolve: { response: TraceResolver } },
      { path: 'processes/:process/versions/:version/instances/:instance', component: ViewInstanceComponent, resolve: { response: InstanceResolver } },
      { path: `processes/:process/versions/:version/instances/:instance/:context/:trace`, component: ViewTraceComponent, canActivate: [ TracesDisplayerGuard ], resolve: { response: TraceResolver } },
      { path: 'instances', component: ListInstancesComponent },
      { path: '**', component: NotFoundComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrackAndTraceRoutingModule { }
