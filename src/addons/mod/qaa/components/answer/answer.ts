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
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { CoreSites } from '@services/sites';


/**
 * Page that displays a page.
 */
@Component({
    selector: 'addon-mod-qaa-answer',
    templateUrl: 'addon-mod-qaa-answer.html',
    styleUrls: ['addon-mod-qaa-answer.scss'],
})
export class AddonModQaaAnswerComponent  implements OnInit {
    @Input() courseId: any;
    @Input() cmid: any;
    textareaValue:any;
    @Input() qapp: any;

    constructor(public modalController: ModalController,public alertCtrl: AlertController,private loadingController:LoadingController) {

    }


    async ngOnInit(): Promise<void> {
        console.log(this.courseId,this.cmid,this.qapp)
    }

    back() {
        this.modalController.dismiss();
    }

    async add_answer() {
        if(this.textareaValue != undefined) {
            const loading = await this.loadingController.create({
                message: 'Vui lòng chờ...',
              });
              loading.present();
                const site = await CoreSites.getSite();

                var data: any = {
                        courseid: this.courseId,
                        cmid: this.cmid,
                        questionid: this.qapp.id,
                        action: 'add_answer',
                        newanswer: this.textareaValue
                };

                console.log(data)


                const preSets = {
                    getFromCache: false,
                };

                await site.read('mod_qaa_updatequestion', data, preSets).then(async (data) => {
                    console.log(data)
                    const alert = await this.alertCtrl.create({
                        header: 'Thêm câu trả lời',
                        message: 'Bạn đã thêm câu trả lời thành công!',
                        buttons: [ {
                            text: 'Đồng ý',
                            role: 'destructive',
                            handler: () => this.back()
                          }]
                    });
                    await alert.present();


                }).catch(async (e) => {
                    const jsonValue = JSON.stringify(e);
                    let temp = JSON.parse(jsonValue)
                    console.log(temp.name, temp.exception)
                    const alert = await this.alertCtrl.create({
                        header: 'Thông báo',
                        message: e,
                        buttons: [ {
                            text: 'Đồng ý',
                            role: 'destructive',
                            }]
                    });

                    await alert.present();
            });
                loading.dismiss();
        }else {
            const alert = await this.alertCtrl.create({
                header: 'Thông báo',
                message: 'Bạn vui lòng nhập nội dung!',
                buttons: [ {
                    text: 'Đồng ý',
                    role: 'destructive',
                  }]
            });
            await alert.present();
        }
    }
}