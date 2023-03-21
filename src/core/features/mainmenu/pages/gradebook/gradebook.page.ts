import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { CoreSites } from '@services/sites';
import { CoreTextUtils } from '@services/utils/text';
import { Translate } from '@singletons';

@Component({
  selector: 'app-gradebook',
  templateUrl: './gradebook.page.html',
  styleUrls: ['./gradebook.page.scss'],
})
export class GradebookPage implements OnInit {

  title: any;
  gradebook: any;
  boolean: boolean | undefined;
  booleantable: boolean | undefined;

  constructor(public navController:NavController) { }

  async ngOnInit() {
    this.title =  Translate.instant('core.mainmenu.gradebook');
    //this.savelogoutinfotosite();

    const site = await CoreSites.getSite();

        const userId = site.getUserId();
        var data: any = {
            userid: userId,
        };

        const preSets = {
            getFromCache: false,
        };

        site.write('th_gradebook_api', data, preSets).then((data) => {
          this.gradebook = data
          console.log(this.gradebook)
          if(this.gradebook != null && this.gradebook.length!= 0) {
            this.boolean = false;
            this.booleantable = true;
          }else {
            this.boolean = true;
            this.booleantable = false;
          }
        }).catch((e) => {
            console.log(e)
        });
  }


  back(): void {
    this.navController.back()
  }

}
