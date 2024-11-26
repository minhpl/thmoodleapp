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
import { CoreComments } from '@features/comments/services/comments';
import { CoreCourseActivityPrefetchHandlerBase } from '@features/course/classes/activity-prefetch-handler';
import { CoreCourse, CoreCourseAnyModuleData } from '@features/course/services/course';
import { CoreCourses } from '@features/courses/services/courses';
import { CoreUser } from '@features/user/services/user';
import { CoreFilepool } from '@services/filepool';
import { CoreSitesReadingStrategy } from '@services/sites';
import { CoreUtils } from '@services/utils/utils';
import { CoreWSFile } from '@services/ws';
import { makeSingleton } from '@singletons';
import { AddonModThGlossary, AddonModThGlossaryEntry, AddonModThGlossaryThGlossary, AddonModThGlossaryProvider } from '../thglossary';
import { AddonModThGlossarySync, AddonModThGlossarySyncResult } from '../thglossary-sync';
import { ContextLevel } from '@/core/constants';

/**
 * Handler to prefetch forums.
 */
@Injectable({ providedIn: 'root' })
export class AddonModThGlossaryPrefetchHandlerService extends CoreCourseActivityPrefetchHandlerBase {

    name = 'AddonModThGlossary';
    modName = 'thglossary';
    component = AddonModThGlossaryProvider.COMPONENT;
    updatesNames = /^configuration$|^.*files$|^entries$/;

    /**
     * @inheritdoc
     */
    async getFiles(module: CoreCourseAnyModuleData, courseId: number): Promise<CoreWSFile[]> {
        try {
            const thglossary = await AddonModThGlossary.getThGlossary(courseId, module.id);

            const entries = await AddonModThGlossary.fetchAllEntries(
                (options) => AddonModThGlossary.getEntriesByLetter(thglossary.id, options),
                {
                    cmId: module.id,
                },
            );

            return this.getFilesFromThGlossaryAndEntries(module, thglossary, entries);
        } catch {
            // ThGlossary not found, return empty list.
            return [];
        }
    }

    /**
     * Get the list of downloadable files. It includes entry embedded files.
     *
     * @param module Module to get the files.
     * @param thglossary ThGlossary
     * @param entries Entries of the ThGlossary.
     * @returns List of Files.
     */
    protected getFilesFromThGlossaryAndEntries(
        module: CoreCourseAnyModuleData,
        thglossary: AddonModThGlossaryThGlossary,
        entries: AddonModThGlossaryEntry[],
    ): CoreWSFile[] {
        let files = this.getIntroFilesFromInstance(module, thglossary);

        // Get entries files.
        entries.forEach((entry) => {
            files = files.concat(entry.attachments || []);

            if (entry.definitioninlinefiles && entry.definitioninlinefiles.length) {
                files = files.concat(entry.definitioninlinefiles);
            }
        });

        return files;
    }

    /**
     * @inheritdoc
     */
    invalidateContent(moduleId: number, courseId: number): Promise<void> {
        return AddonModThGlossary.invalidateContent(moduleId, courseId);
    }

    /**
     * @inheritdoc
     */
    prefetch(module: CoreCourseAnyModuleData, courseId: number): Promise<void> {
        return this.prefetchPackage(module, courseId, (siteId) => this.prefetchThGlossary(module, courseId, siteId));
    }

    /**
     * Prefetch a thglossary.
     *
     * @param module The module object returned by WS.
     * @param courseId Course ID the module belongs to.
     * @param siteId Site ID.
     * @returns Promise resolved when done.
     */
    protected async prefetchThGlossary(module: CoreCourseAnyModuleData, courseId: number, siteId: string): Promise<void> {
        const options = {
            cmId: module.id,
            readingStrategy: CoreSitesReadingStrategy.ONLY_NETWORK,
            siteId,
        };

        // Prefetch the thglossary data.
        const thglossary = await AddonModThGlossary.getThGlossary(courseId, module.id, { siteId });

        const promises: Promise<unknown>[] = [];

        thglossary.browsemodes.forEach((mode) => {
            switch (mode) {
                case 'letter': // Always done. Look bellow.
                    break;
                case 'cat':
                    promises.push(AddonModThGlossary.fetchAllEntries(
                        (newOptions) => AddonModThGlossary.getEntriesByCategory(thglossary.id, newOptions),
                        options,
                    ));
                    break;
                case 'date':
                    promises.push(AddonModThGlossary.fetchAllEntries(
                        (newOptions) => AddonModThGlossary.getEntriesByDate(thglossary.id, 'CREATION', newOptions),
                        options,
                    ));
                    promises.push(AddonModThGlossary.fetchAllEntries(
                        (newOptions) => AddonModThGlossary.getEntriesByDate(thglossary.id, 'UPDATE', newOptions),
                        options,
                    ));
                    break;
                case 'author':
                    promises.push(AddonModThGlossary.fetchAllEntries(
                        (newOptions) => AddonModThGlossary.getEntriesByAuthor(thglossary.id, newOptions),
                        options,
                    ));
                    break;
                default:
            }
        });

        // Fetch all entries to get information from.
        promises.push(AddonModThGlossary.fetchAllEntries(
            (newOptions) => AddonModThGlossary.getEntriesByLetter(thglossary.id, newOptions),
            options,
        ).then((entries) => {
            const promises: Promise<unknown>[] = [];
            const commentsEnabled = CoreComments.areCommentsEnabledInSite();

            entries.forEach((entry) => {
                // Don't fetch individual entries, it's too many WS calls.
                if (thglossary.allowcomments && commentsEnabled) {
                    promises.push(CoreComments.getComments(
                        ContextLevel.MODULE,
                        thglossary.coursemodule,
                        'mod_thglossary',
                        entry.id,
                        'thglossary_entry',
                        0,
                        siteId,
                    ));
                }
            });

            const files = this.getFilesFromThGlossaryAndEntries(module, thglossary, entries);
            promises.push(CoreFilepool.addFilesToQueue(siteId, files, this.component, module.id));

            // Prefetch user avatars.
            promises.push(CoreUser.prefetchUserAvatars(entries, 'userpictureurl', siteId));

            return Promise.all(promises);
        }));

        // Get all categories.
        promises.push(AddonModThGlossary.getAllCategories(thglossary.id, options));

        // Prefetch data for link handlers.
        promises.push(CoreCourse.getModuleBasicInfo(module.id, { siteId }));
        promises.push(CoreCourse.getModuleBasicInfoByInstance(thglossary.id, 'thglossary', { siteId }));

        // Get course data, needed to determine upload max size if it's configured to be course limit.
        promises.push(CoreUtils.ignoreErrors(CoreCourses.getCourseByField('id', courseId, siteId)));

        await Promise.all(promises);
    }

    /**
     * @inheritdoc
     */
    async sync(module: CoreCourseAnyModuleData, courseId: number, siteId?: string): Promise<AddonModThGlossarySyncResult> {
        const results = await Promise.all([
            AddonModThGlossarySync.syncThGlossaryEntries(module.instance, undefined, siteId),
            AddonModThGlossarySync.syncRatings(module.id, undefined, siteId),
        ]);

        return {
            updated: results[0].updated || results[1].updated,
            warnings: results[0].warnings.concat(results[1].warnings),
        };
    }

}

export const AddonModThGlossaryPrefetchHandler = makeSingleton(AddonModThGlossaryPrefetchHandlerService);
