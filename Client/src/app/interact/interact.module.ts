import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InteractRoutingModule } from './interact-routing.module';
import { HomeComponent } from './home/home.component';
import { PatternsComponent } from './patterns/patterns.component';


@NgModule({
  declarations: [HomeComponent, PatternsComponent],
  imports: [
    CommonModule,
    InteractRoutingModule
  ]
})
export class InteractModule { }
