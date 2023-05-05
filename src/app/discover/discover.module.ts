import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DiscoverPageRoutingModule } from './discover-routing.module';

import { DiscoverPage } from './discover.page';

// import { ProductdetailsPageModule } from '../productdetails/productdetails.module';
// import { ProductdetailsPage } from '../productdetails/productdetails.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DiscoverPageRoutingModule,
  ],
  declarations: [DiscoverPage],
  // entryComponents: [ProductdetailsPage]
})
export class DiscoverPageModule {}
