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
import { authGuard } from '@features/mainmenu/guards/auth';

import { AppRoutingModule } from '@/app/app-routing.module';

import { CoreMainMenuDelegate } from './services/mainmenu-delegate';
import { CoreMainMenuHomeHandler } from './services/handlers/mainmenu';

/**
 * Get main menu services.
 *
 * @returns Returns main menu services.
 */
export async function getMainMenuServices(): Promise<Type<unknown>[]> {
    const { CoreMainMenuHomeDelegateService } = await import('@features/mainmenu/services/home-delegate');
    const { CoreMainMenuDelegateService } = await import('@features/mainmenu/services/mainmenu-delegate');
    const { CoreMainMenuProvider } = await import('@features/mainmenu/services/mainmenu');

    return [
        CoreMainMenuHomeDelegateService,
        CoreMainMenuDelegateService,
        CoreMainMenuProvider,
    ];
}

const appRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'main',
    },
    {
        path: 'main',
        loadChildren: () => import('./mainmenu-lazy.module').then(m => m.CoreMainMenuLazyModule),
        canActivate: [authGuard],
    },
    {
        path: 'reload',
        loadChildren: () => import('./mainmenu-reload-lazy.module').then( m => m.CoreMainMenuReloadLazyModule),
    },
];

@NgModule({
    imports: [AppRoutingModule.forChild(appRoutes)],
    providers: [
        {
            provide: APP_INITIALIZER,
            multi: true,
            useValue: () => {
                CoreMainMenuDelegate.registerHandler(CoreMainMenuHomeHandler.instance);
            },
        },
    ],
})
export class CoreMainMenuModule {}
