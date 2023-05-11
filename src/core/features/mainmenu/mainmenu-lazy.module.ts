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

import { Injector, NgModule } from '@angular/core';
import { ROUTES, Routes } from '@angular/router';
import { CoreSharedModule } from '@/core/shared.module';

import { resolveModuleRoutes } from '@/app/app-routing.module';

import { MAIN_MENU_ROUTES } from './mainmenu-routing.module';
import { CoreMainMenuPage } from './pages/menu/menu';
import { CoreMainMenuHomeHandlerService } from './services/handlers/mainmenu';
import { CoreMainMenuProvider } from './services/mainmenu';
import { CoreMainMenuComponentsModule } from './components/components.module';

function buildRoutes(injector: Injector): Routes {
    const routes = resolveModuleRoutes(injector, MAIN_MENU_ROUTES);

    return [
        {
            path: '',
            component: CoreMainMenuPage,
            children: [
                {
                    path: '',
                    pathMatch: 'full',
                },
                {
                    path: CoreMainMenuHomeHandlerService.PAGE_NAME,
                    loadChildren: () => import('./pages/home/home.module').then(m => m.CoreMainMenuHomePageModule),
                },
                {
                    path: CoreMainMenuProvider.MORE_PAGE_NAME2,
                    loadChildren: () => import('../../../addons/block/activatecourses/components/event/event.module').then(m => m.AddonCalendarEventPageModule),
                },
                {
                    path: CoreMainMenuProvider.MORE_PAGE_NAME,
                    loadChildren: () => import('./pages/more/more.module').then(m => m.CoreMainMenuMorePageModule),
                },
                {
                    path: CoreMainMenuProvider.MORE_PAGE_NAME0,
                    loadChildren: () => import('../../../app/tab/tab.module').then( m => m.TabPageModule)
                },
                {
                    path: CoreMainMenuProvider.MORE_PAGE_NAME3,
                    loadChildren: () => import('../../../app/discover/discover.module').then( m => m.DiscoverPageModule)
                },
                {
                    path: CoreMainMenuProvider.MORE_PAGE_NAME9,
                    loadChildren: () => import('../../../app/category/category.module').then( m => m.CategoryPageModule)
                },
                {
                    path: CoreMainMenuProvider.MORE_PAGE_NAME10,
                    loadChildren: () => import('../../../app/map/map.module').then( m => m.MapPageModule)
                },
                {
                    path: CoreMainMenuProvider.MORE_PAGE_NAME11,
                    loadChildren: () => import('../../../app/purchase-history/purchase-history.module').then( m => m.PurchasehistoryModule)
                },
                {
                    path: CoreMainMenuProvider.MORE_PAGE_NAME8,
                    loadChildren: () => import('../../../app/search/search.module').then( m => m.SearchPageModule)
                },
                {
                    path: CoreMainMenuProvider.MORE_PAGE_NAME12,
                    loadChildren: () => import('../../../app/hospital/hospital.module').then( m => m.HospitalPageModule)
                },
                {
                    path: CoreMainMenuProvider.MORE_PAGE_NAME14,
                    loadChildren: () => import('./pages/gradebook/gradebook.module').then( m => m.TranscriptPageModule)
                },
                ...routes.children,
            ],
        },
        ...routes.siblings,
    ];
}

@NgModule({
    imports: [
        CoreSharedModule,
        CoreMainMenuComponentsModule,
    ],
    declarations: [
        CoreMainMenuPage,
    ],
    providers: [
        { provide: ROUTES, multi: true, useFactory: buildRoutes, deps: [Injector] },
    ],
})
export class CoreMainMenuLazyModule {}
