import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { CoreTextUtils } from '@services/utils/text';
import { Translate } from '@singletons';

@Component({
  selector: 'app-transcript',
  templateUrl: './transcript.page.html',
  styleUrls: ['./transcript.page.scss'],
})
export class TranscriptPage implements OnInit {

  title: any;

  constructor(public navController:NavController) { }

  ngOnInit() {
    this.title =  Translate.instant('core.transcript')
  }


  back(): void {
    this.navController.back()
  }
}
