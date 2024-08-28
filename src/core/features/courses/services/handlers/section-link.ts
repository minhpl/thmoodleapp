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
import { makeSingleton } from '@singletons';
import { CoreContentLinksAction } from '@features/contentlinks/services/contentlinks-delegate';
import { CoreCourses, CoreEnrolledCourseData } from '@features/courses/services/courses';
import { CoreSites, CoreSitesReadingStrategy } from '@services/sites';
import { CoreCourse } from '@features/course/services/course';
import { CoreCoursesLinksHandlerBase } from '@features/courses/services/handlers/base-link-handler';
import { CoreLogger } from '@singletons/logger';
import { CoreUtils } from '@services/utils/utils';

/**
 * Handler to treat links to course section.
 */
@Injectable({ providedIn: 'root' })
export class CoreCoursesSectionLinkHandlerService extends CoreCoursesLinksHandlerBase {

    name = 'CoreCoursesSectionLinkHandler';
    pattern = /\/course\/section\.php.*([?&]id=\d+)/;

    private logger: CoreLogger;

    constructor() {
        super();

        this.logger = CoreLogger.getInstance('CoreCoursesSectionLinkHandler');
    }

    /**
     * @inheritdoc
     */
    async getActions(
        siteIds: string[],
        url: string,
        params: Record<string, string>,
    ): Promise<CoreContentLinksAction[]> {
        const siteId = siteIds[0] ?? false;
        const sectionId = params.id ? Number(params.id) : false;
        const siteHomeId = await CoreSites.getSiteHomeId(siteId);
        const course = await this.getSectionCourse(sectionId, siteId);

        if (!sectionId || !course || course.id === siteHomeId) {
            return [];
        }

        return this.getCourseActions(url, course.id, { sectionId });
    }

    /**
     * Get which course a section belongs to.
     *
     * @param sectionId Section id.
     * @param siteId Site id.
     * @returns Course.
     */
    private async getSectionCourse(sectionId: number | false, siteId: string | false): Promise<CoreEnrolledCourseData | null> {
        if (!siteId || !sectionId) {
            return null;
        }

        // Ideally, we would use a webservice to get this information; but such webservice doesn't exists.
        // Given that getting all the courses from a user could be very network intensive, all the requests
        // in this method will only use cache.

        const courses = await CoreUtils.ignoreErrors(
            CoreCourses.getUserCourses(true, siteId, CoreSitesReadingStrategy.ONLY_CACHE),
        ) ?? [];

        for (const course of courses) {
            const courseSections = await CoreUtils.ignoreErrors(CoreCourse.getSections(
                course.id,
                true,
                true,
                {
                    ...CoreSites.getReadingStrategyPreSets(CoreSitesReadingStrategy.ONLY_CACHE),
                    getCacheUsingCacheKey: true,
                },
            ));

            const courseSection = courseSections?.find(section => section.id === sectionId);

            if (!courseSection) {
                continue;
            }

            return course;
        }

        return null;
    }

}

export const CoreCoursesSectionLinkHandler = makeSingleton(CoreCoursesSectionLinkHandlerService);
