import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PurchasehistoryPageRoutingModule } from './purchase-history-routing.module';

import { PurchasehistoryPage } from './purchase-history.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PurchasehistoryPageRoutingModule
  ],
  declarations: [PurchasehistoryPage]
})
export class PurchasehistoryModule {}
