import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from '@client/authentication/login/login.component';
import { NotFoundComponent } from '@client/notfound/notfound.component';

const routes: Routes = [
	{
		path: '', component: LoginComponent, children: [
			{ path: 'login', component: LoginComponent },
			{ path: '**', component: NotFoundComponent }
		]
	}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthenticationRoutingModule { }
