import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TranscriptPage } from './transcript.page';

const routes: Routes = [
  {
    path: '',
    component: TranscriptPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TranscriptPageRoutingModule {}
