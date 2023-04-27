// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { CoreSites } from '@services/sites';
import { AddonModQaaAnswerComponent } from '../answer/answer';
import { AddonModQaaEditAnswerComponent } from '../edit_answer/edit';
import { AddonModQaaEditQuestionComponent } from '../edit_question/edit';

/**
 * Page that displays a page.
 */
@Component({
    selector: 'addon-mod-qaa-detail',
    templateUrl: 'addon-mod-qaa-detail.html',
    styleUrls: ['addon-mod-qaa-detail.scss'],
})
export class AddonModQaaDetailQuestionComponent  implements OnInit {
    @Input() courseId: any;
    @Input() cmid: any;
    @Input() qapp: any;
    data: any;

    answerquest: boolean | undefined;
    questionquest: boolean | undefined;
    edit_answerquest: boolean | undefined;


    constructor(public modalController: ModalController,public alertCtrl: AlertController,private loadingController:LoadingController,public sanitizer: DomSanitizer) {
    }

    async ngOnInit(): Promise<void> {
        await this.qaa_detailqaa()
    }

    async qaa_detailqaa() {
      const loading = await this.loadingController.create({
        message: 'Vui lòng chờ...',
      });
      loading.present();
        const site = await CoreSites.getSite();

        const userId = site.getUserId();

        var data: any = {
            userid: userId,
            courseid: this.courseId,
            cmid: this.cmid,
            questionid: this.qapp.id,
        };

        console.log(data)


        const preSets = {
            getFromCache: false,
        };

        await site.read('mod_qaa_detailqaa', data, preSets).then(async (data) => {
          console.log(data)
          this.qapp = data
          console.log(this.qapp)
          if(this.qapp.answer != null) {
            this.edit_answerquest = true
            this.answerquest = false
            this.questionquest = false
          }else {
            this.answerquest = true
            this.questionquest = true
            this.edit_answerquest = false
          }
          if(this.qapp.answerquest == 1) {
            if(this.qapp.answer != null) {
              this.answerquest = false
              this.edit_answerquest = true
            }else {
              this.answerquest = true
              this.edit_answerquest = false
            }
          }else {
            this.answerquest = false
            this.edit_answerquest = false
          }

          if(this.qapp.makequest == 1) {
            this.questionquest = true
          }else {
              this.questionquest = false
          }
          if(this.qapp.question == null) {
            const alert = await this.alertCtrl.create({
              header: 'Thông báo',
              message: 'Câu hỏi không tồn tại!',
              buttons: [ {
                  text: 'Đồng ý',
                  role: 'destructive',
                  handler: () => this.back()
                }]
          });
          await alert.present();
          }

        }).catch(async (e) => {
          console.log(e)
          const alert = await this.alertCtrl.create({
            header: 'Thông báo',
            message: 'Câu hỏi không tồn tại!',
            buttons: [ {
                text: 'Đồng ý',
                role: 'destructive',
                handler: () => this.back()
              }]
        });
        await alert.present();

        });
        loading.dismiss();
    }

    back() {
        this.modalController.dismiss();
    }

    async edit_question() {
        const modal = await this.modalController.create({
          component: AddonModQaaEditQuestionComponent,
          componentProps: {
            courseId : this.courseId, cmid: this.cmid, qapp: this.qapp
          },
          swipeToClose: true
        });
        await modal.present();
        if(await modal.onDidDismiss()) {
            await this.qaa_detailqaa();
        }
    }

    async answer() {
        const modal = await this.modalController.create({
          component: AddonModQaaAnswerComponent,
          componentProps: {
            courseId : this.courseId, cmid: this.cmid, qapp: this.qapp
          },
          swipeToClose: true
        });
        await modal.present()
        if(await modal.onDidDismiss()) {
          await this.qaa_detailqaa()
        }
    }

    async edit_answewed() {
        const modal = await this.modalController.create({
          component: AddonModQaaEditAnswerComponent,
          componentProps: {
            courseId : this.courseId, cmid: this.cmid, qapp: this.qapp
          },
          swipeToClose: true
        });
        await modal.present()
        if(await modal.onDidDismiss()) {
          await this.qaa_detailqaa();
        }
    }
}
