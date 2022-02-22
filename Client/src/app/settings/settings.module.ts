import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { HomeComponent } from './home/home.component';
import { UsersComponent } from './users/users.component';


@NgModule({
  declarations: [HomeComponent, UsersComponent],
  imports: [
    CommonModule,
    SettingsRoutingModule
  ]
})
export class SettingsModule { }
