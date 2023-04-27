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

import { Component, OnInit, Optional } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CoreCourseModuleMainResourceComponent } from '@features/course/classes/main-resource-component';
import { CoreCourseContentsPage } from '@features/course/pages/contents/contents';
import { CoreSites } from '@services/sites';
import { CoreTextUtils } from '@services/utils/text';
import { CoreUtils } from '@services/utils/utils';
import { AddonModQaaProvider, AddonModPagePage, AddonModPage } from '../../services/qaa';
import { ModalController, NavController } from '@ionic/angular';
import { AddonModQaaAddQuestionComponent } from '../add-question/add';
import { AddonModQaaEditAnswerComponent } from '../edit_answer/edit';
import { AddonModQaaAnswerComponent } from '../answer/answer';
import { AddonModQaaDetailQuestionComponent } from '../detail_question/detail';
import { CoreCourse } from '@features/course/services/course';
import { AddonModPageHelper } from '../../services/qaa-helper';
import { Translate } from '@singletons';

/**
 * Component that displays a page.
 */
@Component({
    selector: 'addon-mod-qaa-index',
    templateUrl: 'addon-mod-qaa-index.html',
    styleUrls: ['addon-mod-qaa-index.scss'],
})
export class AddonModQaaIndexComponent extends CoreCourseModuleMainResourceComponent implements OnInit {

    component = AddonModQaaProvider.COMPONENT;
    contents?: string;
    displayDescription = false;
    displayTimemodified = true;
    timemodified?: number;
    page?: AddonModPagePage;
    warning?: string;
    list_answered: any;
    list_unanswered: any;
    number_answered: any;
    number_unanswered: any;
    test: any;
    answered: boolean | undefined;
    unanswered: boolean | undefined;
    answerquest :boolean | undefined;
    makequest: boolean | undefined

    protected fetchContentDefaultError = 'addon.mod_page.errorwhileloadingthepage';

    constructor(public modalController: ModalController,public sanitizer: DomSanitizer,private nav: NavController, @Optional() courseContentsPage?: CoreCourseContentsPage) {
        super('AddonModPageIndexComponent', courseContentsPage);

    }

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        super.ngOnInit();

        await this.loadContent();

        await this.getquestion();

        console.log(Translate.instant('addon.mod_qaa.Answered'))

    }

    /**
     * Perform the invalidate content function.
     *
     * @returns Resolved when done.
     */
    protected async invalidateContent(): Promise<void> {
        await AddonModPage.invalidateContent(this.module.id, this.courseId);
    }


    async getquestion(): Promise<void> {
        const site = await CoreSites.getSite();

        const userId = site.getUserId()

        var data: any = {
            "qaa": {
                userid: userId,
                courseid: this.courseId,
                cmid: this.module.id
            }

        };

        const preSets = {
            getFromCache: false,
        };

        await site.write('mod_qaa_getquestion', data, preSets).then((data) => {
            let response = JSON.parse(JSON.stringify(data))
            console.log(data)
        if(response.answerquest == true){
            this.answerquest = true
        }else {
            this.answerquest = false
        }

        if(response.makequest == true){
            this.makequest = true
        }else {
            this.makequest = false
        }

        if(response.list_answered.length != 0) {
            this.list_answered = response.list_answered
            let i = 0
            response.list_answered.forEach(obj => {
                i  += obj.qaap.length
            })
            this.number_answered = i
            this.answered = true
        }else {
            this.answered = false
        }

        if(response.list_unanswered.length != 0) {
            this.list_unanswered = response.list_unanswered
            let i = 0
            response.list_unanswered.forEach(obj => {
                i  += obj.qaap.length
            })
            this.number_unanswered = i
            this.unanswered = true
        }else {
            this.unanswered = false
        }

        }).catch((e) => {
            console.log(e)
        });

    }

    async answewed(answered: any) {
        const modal = await this.modalController.create({
            component: AddonModQaaDetailQuestionComponent,
            componentProps: {
              courseId : this.courseId, cmid: this.module.id, qapp: answered
            },
            swipeToClose: true
          });
          await modal.present();
          if(await modal.onDidDismiss()) {
              await this.getquestion();
          }
    }

    async edit_answewed(qaap: any) {
        const modal = await this.modalController.create({
          component: AddonModQaaEditAnswerComponent,
          componentProps: {
            courseId : this.courseId, cmid: this.module.id, qapp: qaap
          },
          swipeToClose: true
        });
        await modal.present();
        if(await modal.onDidDismiss()) {
            await this.getquestion();
        }
    }

    async answer(qaap: any) {
        const modal = await this.modalController.create({
          component: AddonModQaaAnswerComponent,
          componentProps: {
            courseId : this.courseId, cmid: this.module.id, qapp: qaap
          },
          swipeToClose: true
        });
        await modal.present();
        if(await modal.onDidDismiss()) {
            await this.getquestion();
        }
    }

    async add_question() {
        const modal = await this.modalController.create({
          component: AddonModQaaAddQuestionComponent,
          componentProps: {
            courseId : this.courseId, cmid: this.module.id
          },
          swipeToClose: true
        });
        await modal.present();
        if(await modal.onDidDismiss()) {
            await this.getquestion();
        }
    }

    /**
     * @inheritdoc
     */
    protected async fetchContent(refresh?: boolean): Promise<void> {
        await this.getquestion();
    }

    /**
     * Load page data from WS.
     *
     * @returns Promise resolved when done.
     */
    protected async loadPageData(): Promise<void> {
        // Get latest title, description and some extra data. Data should've been updated in download.
        this.page = await AddonModPage.getPageData(this.courseId, this.module.id);

        this.description = this.page.intro;
        this.dataRetrieved.emit(this.page);

        // Check if description and timemodified should be displayed.
        if (this.page.displayoptions) {
            const options: Record<string, string | boolean> =
                CoreTextUtils.unserialize(this.page.displayoptions) || {};

            this.displayDescription = options.printintro === undefined ||
                    CoreUtils.isTrueOrOne(options.printintro);
            this.displayTimemodified = options.printlastmodified === undefined ||
                    CoreUtils.isTrueOrOne(options.printlastmodified);
        } else {
            this.displayDescription = true;
            this.displayTimemodified = true;
        }

        this.timemodified = 'timemodified' in this.page ? this.page.timemodified : undefined;
    }

    /**
     * @inheritdoc
     */
    protected async logActivity(): Promise<void> {
        await AddonModPage.logView(this.module.instance, this.module.name);
    }


}
