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

import { NgModule, Type } from '@angular/core';

/**
 * Get enrol services.
 *
 * @returns Returns enrol services.
 */
export async function getEnrolServices(): Promise<Type<unknown>[]> {
    const { CoreEnrolDelegateService } = await import('@features/enrol/services/enrol-delegate');
    const { CoreEnrolService } = await import('@features/enrol/services/enrol');
    const { CoreEnrolHelperService } = await import('@features/enrol/services/enrol-helper');

    return [
        CoreEnrolService,
        CoreEnrolHelperService,
        CoreEnrolDelegateService,
    ];
}

@NgModule({})
export class CoreEnrolModule {}
