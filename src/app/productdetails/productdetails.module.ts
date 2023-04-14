import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProductdetailsPageRoutingModule } from './productdetails-routing.module';

import { ProductdetailsPage } from './productdetails.page';

// import { IonicStorageModule } from '@ionic/storage-angular';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProductdetailsPageRoutingModule,
    //IonicStorageModule.forRoot()
  ],
  declarations: [ProductdetailsPage],

})
export class ProductdetailsPageModule {}
