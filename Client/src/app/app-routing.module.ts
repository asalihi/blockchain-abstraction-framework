import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthenticationGuard } from '@client/helpers/guards/authentication.guard';
import { Role } from '@client/helpers/models/role';

import { HomeComponent } from '@client/home/home.component';
import { NotFoundComponent } from '@client/notfound/notfound.component';

const routes: Routes = [
	{ path: '', component: HomeComponent, data: { roles: Object.values(Role) } },
	{ path: 'interact', loadChildren: () => import(`@client/interact/interact.module`).then(m => m.InteractModule), canActivate: [ AuthenticationGuard ], data: { roles: Object.values(Role) } },
	{ path: 'manage', loadChildren: () => import(`@client/manage/manage.module`).then(m => m.ManageModule), canActivate: [ AuthenticationGuard ], data: { roles: [ Role.ADMIN, Role.SUPERUSER ] } },
  { path: 'track-and-trace', loadChildren: () => import(`@client/track-and-trace/track-and-trace.module`).then(m => m.TrackAndTraceModule), canActivate: [AuthenticationGuard], data: { roles: [Role.ADMIN, Role.SUPERUSER] } },
  { path: 'tools', loadChildren: () => import(`@client/tools/tools.module`).then(m => m.ToolsModule), canActivate: [AuthenticationGuard], data: { roles: Object.values(Role) } },
  { path: 'settings', loadChildren: () => import(`@client/settings/settings.module`).then(m => m.SettingsModule), canActivate: [AuthenticationGuard], data: { roles: [Role.SUPERUSER] } },
	{ path: 'authentication', loadChildren: () => import(`@client/authentication/authentication.module`).then(m => m.AuthenticationModule) },
	{ path: 'login', redirectTo: 'authentication/login', pathMatch: 'full' },
	{ path: 'logout', redirectTo: 'authentication/logout', pathMatch: 'full' },
	{ path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
