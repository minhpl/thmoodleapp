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
import { CoreCourseModuleDelegate } from '@features/course/services/module-delegate';
import { CoreCourseModulePrefetchDelegate } from '@features/course/services/module-prefetch-delegate';
import { CoreMainMenuTabRoutingModule } from '@features/mainmenu/mainmenu-tab-routing.module';
import { CorePluginFileDelegate } from '@services/plugin-file-delegate';
import { AddonModTHPageComponentsModule } from './components/components.module';
import { AddonModTHPageIndexLinkHandler } from './services/handlers/index-link';
import { AddonModTHPageListLinkHandler } from './services/handlers/list-link';
import { AddonModTHPageModuleHandler, AddonModTHPageModuleHandlerService } from './services/handlers/module';
import { AddonModTHPagePluginFileHandler } from './services/handlers/pluginfile';
import { AddonModTHPagePrefetchHandler } from './services/handlers/prefetch';
import { AddonModTHPageProvider } from './services/thpage';
import { AddonModTHPageHelperProvider } from './services/thpage-helper';

export const ADDON_MOD_PAGE_SERVICES: Type<unknown>[] = [
    AddonModTHPageProvider,
    AddonModTHPageHelperProvider,
];

const routes: Routes = [
    {
        path: AddonModTHPageModuleHandlerService.PAGE_NAME,
        loadChildren: () => import('./page-lazy.module').then(m => m.AddonModTHPageLazyModule),
    },
];

@NgModule({
    imports: [
        CoreMainMenuTabRoutingModule.forChild(routes),
        AddonModTHPageComponentsModule,
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            multi: true,
            useValue: () => {
                CoreCourseModuleDelegate.registerHandler(AddonModTHPageModuleHandler.instance);
                CoreContentLinksDelegate.registerHandler(AddonModTHPageIndexLinkHandler.instance);
                CoreContentLinksDelegate.registerHandler(AddonModTHPageListLinkHandler.instance);
                CoreCourseModulePrefetchDelegate.registerHandler(AddonModTHPagePrefetchHandler.instance);
                CorePluginFileDelegate.registerHandler(AddonModTHPagePluginFileHandler.instance);
            },
        },
    ],
})
export class AddonModTHPageModule {}
