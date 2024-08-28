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

import { APP_INITIALIZER, NgModule } from '@angular/core';
import { Routes } from '@angular/router';

import { CoreCourseIndexRoutingModule } from '@features/course/course-routing.module';
import { CoreMainMenuTabRoutingModule } from '@features/mainmenu/mainmenu-tab-routing.module';
import { CoreMainMenuHomeRoutingModule } from '@features/mainmenu/mainmenu-home-routing.module';
import { CoreSitePreferencesRoutingModule } from '@features/settings/settings-site-routing.module';
import { CoreSitePluginsComponentsModule } from './components/components.module';
import { CoreSitePluginsHelper } from './services/siteplugins-helper';
import { CoreSharedModule } from '@/core/shared.module';
import { CoreSitePluginsPluginPage } from '@features/siteplugins/pages/plugin/plugin';
import { canLeaveGuard } from '@guards/can-leave';
import { CoreSitePluginsCourseOptionPage } from '@features/siteplugins/pages/course-option/course-option';
import { CoreSitePluginsModuleIndexPage } from '@features/siteplugins/pages/module-index/module-index';

/**
 * Get site plugins exported objects.
 *
 * @returns Site plugins exported objects.
 */
export async function getSitePluginsExportedObjects(): Promise<Record<string, unknown>> {
    const { CoreSitePluginsModuleIndexComponent } = await import ('@features/siteplugins/components/module-index/module-index');
    const { CoreSitePluginsBlockComponent } = await import ('@features/siteplugins/components/block/block');
    const { CoreSitePluginsCourseFormatComponent } = await import ('@features/siteplugins/components/course-format/course-format');
    const { CoreSitePluginsQuestionComponent } = await import ('@features/siteplugins/components/question/question');
    const { CoreSitePluginsQuestionBehaviourComponent }
        = await import ('@features/siteplugins/components/question-behaviour/question-behaviour');
    const { CoreSitePluginsUserProfileFieldComponent }
        = await import ('@features/siteplugins/components/user-profile-field/user-profile-field');
    const { CoreSitePluginsQuizAccessRuleComponent }
        = await import ('@features/siteplugins/components/quiz-access-rule/quiz-access-rule');
    const { CoreSitePluginsAssignFeedbackComponent }
        = await import ('@features/siteplugins/components/assign-feedback/assign-feedback');
    const { CoreSitePluginsAssignSubmissionComponent }
        = await import ('@features/siteplugins/components/assign-submission/assign-submission');

    /* eslint-disable @typescript-eslint/naming-convention */
    return {
        CoreSitePluginsModuleIndexComponent,
        CoreSitePluginsBlockComponent,
        CoreSitePluginsCourseFormatComponent,
        CoreSitePluginsQuestionComponent,
        CoreSitePluginsQuestionBehaviourComponent,
        CoreSitePluginsUserProfileFieldComponent,
        CoreSitePluginsQuizAccessRuleComponent,
        CoreSitePluginsAssignFeedbackComponent,
        CoreSitePluginsAssignSubmissionComponent,
    };
    /* eslint-enable @typescript-eslint/naming-convention */
}

const routes: Routes = [
    {
        path: 'siteplugins/content/:component/:method/:hash',
        component: CoreSitePluginsPluginPage,
        canDeactivate: [canLeaveGuard],
    },
];

const homeRoutes: Routes = [
    {
        path: 'siteplugins/homecontent/:component/:method',
        component: CoreSitePluginsPluginPage,
        canDeactivate: [canLeaveGuard],
    },
];

const courseIndexRoutes: Routes = [
    {
        path: 'siteplugins/:handlerUniqueName',
        component: CoreSitePluginsCourseOptionPage,
        canDeactivate: [canLeaveGuard],
    },
];

const moduleRoutes: Routes = [
    {
        path: 'siteplugins/module/:courseId/:cmId',
        component: CoreSitePluginsModuleIndexPage,
        canDeactivate: [canLeaveGuard],
    },
];

@NgModule({
    imports: [
        CoreMainMenuTabRoutingModule.forChild(moduleRoutes.concat(routes)),
        CoreCourseIndexRoutingModule.forChild({ children: courseIndexRoutes }),
        CoreMainMenuHomeRoutingModule.forChild({ children: homeRoutes }),
        CoreSitePreferencesRoutingModule.forChild(routes),
        CoreSitePluginsComponentsModule,
        CoreSharedModule,
    ],
    declarations: [
        CoreSitePluginsPluginPage,
        CoreSitePluginsCourseOptionPage,
        CoreSitePluginsModuleIndexPage,
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            multi: true,
            useValue: () => {
                CoreSitePluginsHelper.initialize();
            },
        },
    ],
})
export class CoreSitePluginsModule {}
