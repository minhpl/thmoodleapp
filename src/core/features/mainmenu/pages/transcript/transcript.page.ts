import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { CoreSites } from '@services/sites';
import { CoreTextUtils } from '@services/utils/text';
import { Translate } from '@singletons';

@Component({
  selector: 'app-transcript',
  templateUrl: './transcript.page.html',
  styleUrls: ['./transcript.page.scss'],
})
export class TranscriptPage implements OnInit {

  title: any;
  transcript: any;
  boolean: boolean | undefined;
  booleantable: boolean | undefined;

  constructor(public navController:NavController) { }

  async ngOnInit() {
    this.title =  Translate.instant('core.transcript');
    //this.savelogoutinfotosite();

    const site = await CoreSites.getSite();

        const userId = site.getUserId();
        var data: any = {
            userid: userId,
        };

        const preSets = {
            getFromCache: false,
        };

        console.log(data)
        site.write('th_transcript_api', data, preSets).then((data) => {
          this.transcript = data
          if(this.transcript != null && this.transcript.length!= 0) {
            this.boolean = false;
            this.booleantable = true;
          }else {
            this.boolean = true;
            this.booleantable = false;
          }
        }).catch((e) => {
            // console.log(e)
        });
  }


  back(): void {
    this.navController.back()
  }

}
