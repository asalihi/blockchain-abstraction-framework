import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from '@client/settings/home/home.component';
import { UsersComponent } from '@client/settings/users/users.component';
import { NotFoundComponent } from '@client/notfound/notfound.component';

const routes: Routes = [
	{
		path: '', component: HomeComponent, children: [
			{ path: 'users', component: UsersComponent },
			{ path: '**', component: NotFoundComponent }
		]
	}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
