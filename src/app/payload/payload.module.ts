import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PayloadPageRoutingModule } from './payload-routing.module';

import { PayloadPage } from './payload.page';

import {NgxCopyPasteModule} from 'ngx-copypaste'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PayloadPageRoutingModule,
    NgxCopyPasteModule
  ],
  declarations: [PayloadPage]
})
export class PayloadPageModule {}
