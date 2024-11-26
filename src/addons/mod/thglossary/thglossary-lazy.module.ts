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

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CoreSharedModule } from '@/core/shared.module';
import { AddonModThGlossaryComponentsModule } from './components/components.module';
import { AddonModThGlossaryIndexPage } from './pages/index/index';
import { conditionalRoutes } from '@/app/app-routing.module';
import { CoreScreen } from '@services/screen';

const mobileRoutes: Routes = [
    {
        path: ':courseId/:cmId',
        component: AddonModThGlossaryIndexPage,
    },
    {
        path: ':courseId/:cmId/entry/:entrySlug',
        loadChildren: () => import('./thglossary-entry-lazy.module').then(m => m.AddonModThGlossaryEntryLazyModule),
    },
];

const tabletRoutes: Routes = [
    {
        path: ':courseId/:cmId',
        component: AddonModThGlossaryIndexPage,
        children: [
            {
                path: 'entry/:entrySlug',
                loadChildren: () => import('./thglossary-entry-lazy.module').then(m => m.AddonModThGlossaryEntryLazyModule),
            },
        ],
    },
];

const routes: Routes = [
    {
        path: ':courseId/:cmId/entry/new',
        loadChildren: () => import('./thglossary-edit-lazy.module').then(m => m.AddonModThGlossaryEditLazyModule),
    },
    {
        path: ':courseId/:cmId/entry/:entrySlug/edit',
        loadChildren: () => import('./thglossary-edit-lazy.module').then(m => m.AddonModThGlossaryEditLazyModule),
    },
    ...conditionalRoutes(mobileRoutes, () => CoreScreen.isMobile),
    ...conditionalRoutes(tabletRoutes, () => CoreScreen.isTablet),
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
        CoreSharedModule,
        AddonModThGlossaryComponentsModule,
    ],
    declarations: [
        AddonModThGlossaryIndexPage,
    ],
})
export class AddonModThGlossaryLazyModule {}
