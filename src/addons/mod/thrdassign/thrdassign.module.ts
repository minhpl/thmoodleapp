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

import { APP_INITIALIZER, NgModule, Type } from '@angular/core';
import { Routes } from '@angular/router';
import { CoreContentLinksDelegate } from '@features/contentlinks/services/contentlinks-delegate';
import { CoreCourseHelper } from '@features/course/services/course-helper';
import { CoreCourseModuleDelegate } from '@features/course/services/module-delegate';
import { CoreCourseModulePrefetchDelegate } from '@features/course/services/module-prefetch-delegate';
import { CoreMainMenuTabRoutingModule } from '@features/mainmenu/mainmenu-tab-routing.module';
import { CorePushNotificationsDelegate } from '@features/pushnotifications/services/push-delegate';
import { CoreCronDelegate } from '@services/cron';
import { CORE_SITE_SCHEMAS } from '@services/sites';
import { AddonModThrdAssignFeedbackModule } from './feedback/feedback.module';
import { AddonModThrdAssignProvider } from './services/thrdassign';
import { OFFLINE_SITE_SCHEMA } from './services/database/thrdassign';
import { AddonModThrdAssignIndexLinkHandler } from './services/handlers/index-link';
import { AddonModThrdAssignListLinkHandler } from './services/handlers/list-link';
import { AddonModThrdAssignModuleHandler, AddonModThrdAssignModuleHandlerService } from './services/handlers/module';
import { AddonModThrdAssignPrefetchHandler } from './services/handlers/prefetch';
import { AddonModThrdAssignPushClickHandler } from './services/handlers/push-click';
import { AddonModThrdAssignSyncCronHandler } from './services/handlers/sync-cron';
import { AddonModThrdAssignSubmissionModule } from './submission/submission.module';

/**
 * Get mod thrdassign services.
 *
 * @returns Returns mod thrdassign services.
 */
export async function getModAssignServices(): Promise<Type<unknown>[]> {
    const { AddonModThrdAssignProvider } = await import('@addons/mod/thrdassign/services/thrdassign');
    const { AddonModThrdAssignOfflineProvider } = await import('@addons/mod/thrdassign/services/thrdassign-offline');
    const { AddonModThrdAssignSyncProvider } = await import('@addons/mod/thrdassign/services/thrdassign-sync');
    const { AddonModThrdAssignHelperProvider } = await import('@addons/mod/thrdassign/services/thrdassign-helper');
    const { AddonModThrdAssignFeedbackDelegateService } = await import('@addons/mod/thrdassign/services/feedback-delegate');
    const { AddonModThrdAssignSubmissionDelegateService } = await import('@addons/mod/thrdassign/services/submission-delegate');

    return [
        AddonModThrdAssignProvider,
        AddonModThrdAssignOfflineProvider,
        AddonModThrdAssignSyncProvider,
        AddonModThrdAssignHelperProvider,
        AddonModThrdAssignFeedbackDelegateService,
        AddonModThrdAssignSubmissionDelegateService,
    ];
}

/**
 * Get thrdassign component modules.
 *
 * @returns Assign component modules.
 */
export async function getModAssignComponentModules(): Promise<unknown[]> {
    const { AddonModThrdAssignComponentsModule } = await import('@addons/mod/thrdassign/components/components.module');

    return [AddonModThrdAssignComponentsModule];
}

const routes: Routes = [
    {
        path: AddonModThrdAssignModuleHandlerService.PAGE_NAME,
        loadChildren: () => import('./thrdassign-lazy.module').then(m => m.AddonModThrdAssignLazyModule),
    },
];

@NgModule({
    imports: [
        CoreMainMenuTabRoutingModule.forChild(routes),
        AddonModThrdAssignSubmissionModule,
        AddonModThrdAssignFeedbackModule,
    ],
    providers: [
        {
            provide: CORE_SITE_SCHEMAS,
            useValue: [OFFLINE_SITE_SCHEMA],
            multi: true,
        },
        {
            provide: APP_INITIALIZER,
            multi: true,
            useValue: () => {
                CoreCourseModuleDelegate.registerHandler(AddonModThrdAssignModuleHandler.instance);
                CoreContentLinksDelegate.registerHandler(AddonModThrdAssignIndexLinkHandler.instance);
                CoreContentLinksDelegate.registerHandler(AddonModThrdAssignListLinkHandler.instance);
                CoreCourseModulePrefetchDelegate.registerHandler(AddonModThrdAssignPrefetchHandler.instance);
                CoreCronDelegate.register(AddonModThrdAssignSyncCronHandler.instance);
                CorePushNotificationsDelegate.registerClickHandler(AddonModThrdAssignPushClickHandler.instance);

                CoreCourseHelper.registerModuleReminderClick(AddonModThrdAssignProvider.COMPONENT);
            },
        },
    ],
})
export class AddonModThrdAssignModule {}
