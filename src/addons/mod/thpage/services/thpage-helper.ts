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

import { Injectable } from '@angular/core';
import { AddonModTHPage, AddonModTHPageProvider } from './thpage';
import { CoreError } from '@classes/errors/error';
import { CoreSites } from '@services/sites';
import { CoreFilepool } from '@services/filepool';
import { CoreDomUtils } from '@services/utils/dom';
import { Translate, makeSingleton } from '@singletons';
import { CoreCourse, CoreCourseModuleContentFile } from '@features/course/services/course';
import { CoreCourseHelper, CoreCourseModuleData } from '@features/course/services/course-helper';
import { CoreFileHelper } from '@services/file-helper';
import { CoreUtilsOpenFileOptions } from '@services/utils/utils';

/**
 * Service that provides some features for page.
 */
@Injectable({ providedIn: 'root' })
export class AddonModTHPageHelperProvider {

    /**
     * Check if main file of resource is downloadable.
     *
     * @param module Module instance.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with boolean: whether main file is downloadable.
     */
    async isMainFileDownloadable(module: CoreCourseModuleData, siteId?: string): Promise<boolean> {
        const contents = await CoreCourse.getModuleContents(module);
        if (!contents.length) {
            throw new CoreError(Translate.instant('core.filenotfound'));
        }

        siteId = siteId || CoreSites.getCurrentSiteId();

        const mainFile = contents[0];
        const timemodified = CoreFileHelper.getFileTimemodified(mainFile);

        return CoreFilepool.isFileDownloadable(siteId, mainFile.fileurl, timemodified);
    }

    /**
     * Opens a file of the resource activity.
     *
     * @param module Module where to get the contents.
     * @param courseId Course Id, used for completion purposes.
     * @param options Options to open the file.
     * @returns Resolved when done.
     */
    async openModuleFile(module: CoreCourseModuleData, courseId: number, options: CoreUtilsOpenFileOptions = {}): Promise<void> {
        const modal = await CoreDomUtils.showModalLoading();
        console.log(module);
        try {
            await CoreCourseHelper.downloadModuleAndOpenFile(
                module,
                courseId,
                AddonModTHPageProvider.COMPONENT,
                module.id,
                module.contents,
                undefined,
                options,
            );

            try {
                await AddonModTHPage.logView(module.instance, module.name);
                CoreCourse.checkModuleCompletion(courseId, module.completiondata);
            } catch {
                // Ignore errors.
            }
        } catch (error) {
            CoreDomUtils.showErrorModalDefault(error, 'addon.mod_thpage.errorwhileloadingthecontent', true);
        } finally {
            modal.dismiss();
        }
    }

}
export const AddonModTHPageHelper = makeSingleton(AddonModTHPageHelperProvider);
