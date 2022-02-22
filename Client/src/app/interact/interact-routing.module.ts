import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from '@client/interact/home/home.component';
import { PatternsComponent } from '@client/interact/patterns/patterns.component';
import { NotFoundComponent } from '@client/notfound/notfound.component';

const routes: Routes = [
	{
		path: '', component: HomeComponent, children: [
			{ path: 'patterns', component: PatternsComponent },
			{ path: '**', component: NotFoundComponent }
		]
	}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InteractRoutingModule { }
