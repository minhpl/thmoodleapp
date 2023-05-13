import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PurchasehistoryPage } from './purchase-history.page';

const routes: Routes = [
  {
    path: '',
    component: PurchasehistoryPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PurchasehistoryPageRoutingModule {}
