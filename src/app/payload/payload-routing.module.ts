import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PayloadPage } from './payload.page';

const routes: Routes = [
  {
    path: '',
    component: PayloadPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PayloadPageRoutingModule {}
