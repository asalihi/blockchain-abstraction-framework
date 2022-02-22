import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ToolsRoutingModule } from './tools-routing.module';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CryptographyComponent } from './cryptography/cryptography.component';
import { FingerprintsComponent } from './cryptography/fingerprints/fingerprints.component';
import { SignaturesComponent } from './cryptography/signatures/signatures.component';

@NgModule({
  declarations: [HomeComponent, DashboardComponent, CryptographyComponent, FingerprintsComponent, SignaturesComponent],
  imports: [
    CommonModule,
    ToolsRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule
  ]
})
export class ToolsModule { }
