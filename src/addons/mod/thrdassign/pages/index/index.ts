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

import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { CoreCourseModuleMainActivityPage } from '@features/course/classes/main-activity-page';
import { AddonModThrdAssignIndexComponent } from '../../components/index/index';
import { CoreNavigator } from '@services/navigator';
import { CoreUtils } from '@services/utils/utils';

/**
 * Page that displays an thrdassign.
 */
@Component({
    selector: 'page-addon-mod-thrdassign-index',
    templateUrl: 'index.html',
})
export class AddonModThrdAssignIndexPage extends CoreCourseModuleMainActivityPage<AddonModThrdAssignIndexComponent>
    implements AfterViewInit {

    private action?: string;

    @ViewChild(AddonModThrdAssignIndexComponent) activityComponent?: AddonModThrdAssignIndexComponent;

    constructor() {
        super();

        this.action = CoreNavigator.getRouteParam('action');
    }

    /**
     * @inheritdoc
     */
    async ngAfterViewInit(): Promise<void> {
        switch (this.action) {
            case 'editsubmission':
                await CoreUtils.waitFor(() => !!this.activityComponent?.submissionComponent, { timeout: 5000 });
                await this.activityComponent?.submissionComponent?.goToEdit();

                break;
        }
    }

}
