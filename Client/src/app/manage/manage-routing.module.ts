import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from '@client/manage/home/home.component';
import { EthereumComponent } from '@client/manage/ethereum/ethereum.component';
import { NotFoundComponent } from '@client/notfound/notfound.component';

const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'ethereum', component: EthereumComponent },
	{ path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManageRoutingModule { }
