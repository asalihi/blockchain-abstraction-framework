import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManageRoutingModule } from './manage-routing.module';
import { HomeComponent } from './home/home.component';
import { EthereumComponent } from './ethereum/ethereum.component';


@NgModule({
  declarations: [HomeComponent, EthereumComponent],
  imports: [
    CommonModule,
    ManageRoutingModule
  ]
})
export class ManageModule { }
