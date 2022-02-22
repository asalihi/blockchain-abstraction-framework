import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NotFoundComponent } from '@client/notfound/notfound.component';
import { HomeComponent } from '@client/tools/home/home.component';
import { DashboardComponent } from '@client/tools/dashboard/dashboard.component';
import { CryptographyComponent } from '@client/tools/cryptography/cryptography.component';
import { FingerprintsComponent } from '@client/tools/cryptography/fingerprints/fingerprints.component';
import { SignaturesComponent } from '@client/tools/cryptography/signatures/signatures.component';

const routes: Routes = [
  {
    path: '', component: HomeComponent, children: [
      { path: '', component: DashboardComponent },
      { path: 'cryptography', component: CryptographyComponent },
      { path: 'cryptography/fingerprints', component: FingerprintsComponent },
      { path: 'cryptography/signatures', component: SignaturesComponent },
      { path: '**', component: NotFoundComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ToolsRoutingModule { }
