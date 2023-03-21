import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TranscriptPageRoutingModule } from './gradebook-routing.module';

import { GradebookPage } from './gradebook.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranscriptPageRoutingModule
  ],
  declarations: [GradebookPage]
})
export class TranscriptPageModule {}
