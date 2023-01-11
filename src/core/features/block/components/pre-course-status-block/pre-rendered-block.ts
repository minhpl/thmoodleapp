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

import { OnInit, Component } from '@angular/core';
import { CoreBlockBaseComponent } from '../../classes/base-block-component';
import { CoreSites } from '@services/sites';
import { AlertController, ToastController } from '@ionic/angular';


/**
 * Component to render blocks with pre-rendered HTML.
 */
@Component({
    selector: 'core-block-pre-rendered',
    templateUrl: 'core-block-pre-rendered.html',
    styleUrls: ['./pre-rendered-block.scss'],
})
export class AddonBlockCourseStatusComponent extends CoreBlockBaseComponent implements OnInit {
    courseId?: number;
    block_status!: boolean;
    btn_cancel =  'btn_cancel';
    btn_confirm = 'un_btn_confirm';
    icon_cancel!: boolean;
    icon_confirm!: boolean;
    data: any;
    id: any;

    constructor(public toastCtrl: ToastController, public alertCtrl: AlertController) {
        super('AddonBlockCourseStatusComponent');

    }

    /**
     * Component being initialized.
     */
    async ngOnInit(): Promise<void> {

        await super.ngOnInit();

        this.courseId = this.contextLevel == 'course' ? this.instanceId : undefined;

        this.fetchContentDefaultError = 'Error getting ' + this.block.contents?.title + ' data.';

        const site = await CoreSites.getSite();

        const userId = site.getUserId(),
            data: any = {
                userid: userId,
                courseid: this.courseId
            };

        const preSets = {
            getFromCache: false,
        };

        return site.write('local_th_course_status_check_status', data, preSets).then((courses) => {
            const jsonValue = JSON.stringify(courses);
            let temp = JSON.parse(jsonValue)
            console.log(temp.check, temp.status)
            console.log(temp)
            this.data = temp
            if(temp.check = true) {
                this.block_status = true
            } else {
                this.block_status = false
            }

            if(temp.status == 0) {
                this.btn_cancel = 'btn_cancel';
                this.btn_confirm = 'un_btn_confirm';
                this.icon_cancel = true;
                this.icon_confirm = false;
            } else if(temp.status == 1)  {
                this.btn_cancel = 'un_btn_cancel';
                this.btn_confirm = 'btn_confirm ';
                this.icon_cancel = false;
                this.icon_confirm = true;
            }
        })
    }

    async Cancel() {
        if(new Date(this.data.startdate).getTime() < new Date().getTime()) {
            if(this.data.status == 1) {
                const alert = await this.alertCtrl.create({
                    header: 'Bạn không thể hủy phê duyệt',
                    message: 'Khóa học này hiện đã có học viên đăng ký, bạn không thể hủy xuất bản, liên hệ với quản trị viên để được hỗ trợ!',
                    buttons: ['Đồng ý']
                });
                console.log(this.data.status)
                await alert.present();
            }
        } else if(new Date(this.data.startdate).getTime() > new Date().getTime() && this.data.status != 0){

            const alert = await this.alertCtrl.create({
                header: 'Hủy phê duyệt khóa học',
                message: 'Bạn có chắc chắn muốn hủy phê duyệt khóa học không?',
                buttons: [ {
                    text: 'Đồng ý',
                    role: 'destructive',
                    handler: () => this.th_un_published_course()
                    }, {
                    text: 'Trở về',
                    role: 'cancel',
                    }]
            });

            await alert.present();
        }

    }

    async Confirm() {
        if(this.data.status == 0) {
            const alert = await this.alertCtrl.create({
                header: 'Phê duyệt khóa học',
                message: 'Bạn có chắc chắn muốn phê duyệt khóa học không?',
                buttons: [ {
                    text: 'Đồng ý',
                    role: 'destructive',
                    handler: () => this.th_published_course()
                  }, {
                    text: 'Trở về',
                    role: 'cancel',
                  }]
            });
            await alert.present();
        }
    }


    async th_published_course() {
        const site = await CoreSites.getSite();

        const userId = site.getUserId(),
            data: any = {
                userid: userId,
                courseid: this.courseId
            };

        const preSets = {
            getFromCache: false,
        };

        this.btn_cancel = 'un_btn_cancel';
        this.btn_confirm = 'btn_confirm ';
        this.icon_cancel = false;
        this.icon_confirm = true;

        return site.write('local_th_course_status_published_course', data, preSets).then((courses) => {
            const jsonValue = JSON.stringify(courses);
            let temp = JSON.parse(jsonValue)
            console.log(temp)
            this.data.status = temp.status
        })


    }

    async th_un_published_course() {
        const site = await CoreSites.getSite();

        const userId = site.getUserId(),
            data: any = {
                userid: userId,
                courseid: this.courseId
            };

        const preSets = {
            getFromCache: false,
        };

        this.btn_cancel = 'btn_cancel';
        this.btn_confirm = 'un_btn_confirm';
        this.icon_cancel = true;
        this.icon_confirm = false;

        return site.write('local_th_course_status_unpublished_course', data, preSets).then((courses) => {
            const jsonValue = JSON.stringify(courses);
            let temp = JSON.parse(jsonValue)
            console.log(temp)
            this.data.status = temp.status
        })
    }

}
