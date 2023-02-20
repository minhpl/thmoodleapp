import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CategoryPageRoutingModule } from './category-routing.module';

import { CategoryPage } from './category.page';
import { ProductdetailsPage } from '../productdetails/productdetails.page';
import { ProductdetailsPageModule } from '../productdetails/productdetails.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CategoryPageRoutingModule,
    ProductdetailsPageModule
  ],
  declarations: [CategoryPage],
})
export class CategoryPageModule {}
