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
import { AddonModAssignFeedbackModule } from './feedback/feedback.module';
import { AddonModAssignProvider } from './services/assign';
import { OFFLINE_SITE_SCHEMA } from './services/database/assign';
import { AddonModAssignIndexLinkHandler } from './services/handlers/index-link';
import { AddonModAssignListLinkHandler } from './services/handlers/list-link';
import { AddonModAssignModuleHandler, AddonModAssignModuleHandlerService } from './services/handlers/module';
import { AddonModAssignPrefetchHandler } from './services/handlers/prefetch';
import { AddonModAssignPushClickHandler } from './services/handlers/push-click';
import { AddonModAssignSyncCronHandler } from './services/handlers/sync-cron';
import { AddonModAssignSubmissionModule } from './submission/submission.module';

/**
 * Get mod assign services.
 *
 * @returns Returns mod assign services.
 */
export async function getModAssignServices(): Promise<Type<unknown>[]> {
    const { AddonModAssignProvider } = await import('@addons/mod/assign/services/assign');
    const { AddonModAssignOfflineProvider } = await import('@addons/mod/assign/services/assign-offline');
    const { AddonModAssignSyncProvider } = await import('@addons/mod/assign/services/assign-sync');
    const { AddonModAssignHelperProvider } = await import('@addons/mod/assign/services/assign-helper');
    const { AddonModAssignFeedbackDelegateService } = await import('@addons/mod/assign/services/feedback-delegate');
    const { AddonModAssignSubmissionDelegateService } = await import('@addons/mod/assign/services/submission-delegate');

    return [
        AddonModAssignProvider,
        AddonModAssignOfflineProvider,
        AddonModAssignSyncProvider,
        AddonModAssignHelperProvider,
        AddonModAssignFeedbackDelegateService,
        AddonModAssignSubmissionDelegateService,
    ];
}

/**
 * Get assign component modules.
 *
 * @returns Assign component modules.
 */
export async function getModAssignComponentModules(): Promise<unknown[]> {
    const { AddonModAssignComponentsModule } = await import('@addons/mod/assign/components/components.module');

    return [AddonModAssignComponentsModule];
}

const routes: Routes = [
    {
        path: AddonModAssignModuleHandlerService.PAGE_NAME,
        loadChildren: () => import('./assign-lazy.module').then(m => m.AddonModAssignLazyModule),
    },
];

@NgModule({
    imports: [
        CoreMainMenuTabRoutingModule.forChild(routes),
        AddonModAssignSubmissionModule,
        AddonModAssignFeedbackModule,
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
                CoreCourseModuleDelegate.registerHandler(AddonModAssignModuleHandler.instance);
                CoreContentLinksDelegate.registerHandler(AddonModAssignIndexLinkHandler.instance);
                CoreContentLinksDelegate.registerHandler(AddonModAssignListLinkHandler.instance);
                CoreCourseModulePrefetchDelegate.registerHandler(AddonModAssignPrefetchHandler.instance);
                CoreCronDelegate.register(AddonModAssignSyncCronHandler.instance);
                CorePushNotificationsDelegate.registerClickHandler(AddonModAssignPushClickHandler.instance);

                CoreCourseHelper.registerModuleReminderClick(AddonModAssignProvider.COMPONENT);
            },
        },
    ],
})
export class AddonModAssignModule {}
