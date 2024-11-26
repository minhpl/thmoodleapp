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

import { Params } from '@angular/router';
import { CoreRoutedItemsManagerSource } from '@classes/items-management/routed-items-manager-source';
import { CoreGroupInfo, CoreGroups } from '@services/groups';
import { CoreSites } from '@services/sites';
import { CoreUtils } from '@services/utils/utils';
import { Translate } from '@singletons';
import { CoreIonicColorNames } from '@singletons/colors';
import { CoreEvents } from '@singletons/events';
import {
    AddonModThrdAssign,
    AddonModThrdAssignAssign,
    AddonModThrdAssignGradingStates,
    AddonModThrdAssignSubmission,
    AddonModThrdAssignSubmissionStatusValues,
} from '../services/thrdassign';
import { AddonModThrdAssignHelper, AddonModThrdAssignSubmissionFormatted } from '../services/thrdassign-helper';
import { AddonModThrdAssignOffline } from '../services/thrdassign-offline';
import { AddonModThrdAssignSync, AddonModThrdAssignSyncProvider } from '../services/thrdassign-sync';

/**
 * Provides a collection of thrdassignment submissions.
 */
export class AddonModThrdAssignSubmissionsSource extends CoreRoutedItemsManagerSource<AddonModThrdAssignSubmissionForList> {

    /**
     * @inheritdoc
     */
    static getSourceId(courseId: number, moduleId: number, selectedStatus?: AddonModThrdAssignListFilterName): string {
        const statusId = selectedStatus ?? '__empty__';

        return `submissions-${courseId}-${moduleId}-${statusId}`;
    }

    readonly COURSE_ID: number;
    readonly MODULE_ID: number;
    readonly SELECTED_STATUS: AddonModThrdAssignListFilterName | undefined;

    thrdassign?: AddonModThrdAssignAssign;
    groupId = 0;
    groupInfo: CoreGroupInfo = {
        groups: [],
        separateGroups: false,
        visibleGroups: false,
        defaultGroupId: 0,
        canAccessAllGroups: false,
    };

    protected submissionsData: { canviewsubmissions: boolean; submissions?: AddonModThrdAssignSubmission[] } = {
        canviewsubmissions: false,
    };

    constructor(courseId: number, moduleId: number, selectedStatus?: AddonModThrdAssignListFilterName) {
        super();

        this.COURSE_ID = courseId;
        this.MODULE_ID = moduleId;
        this.SELECTED_STATUS = selectedStatus;
    }

    /**
     * @inheritdoc
     */
    getItemPath(submission: AddonModThrdAssignSubmissionForList): string {
        return String(submission.submitid);
    }

    /**
     * @inheritdoc
     */
    getItemQueryParams(submission: AddonModThrdAssignSubmissionForList): Params {
        return {
            blindId: submission.blindid,
            groupId: this.groupId,
            selectedStatus: this.SELECTED_STATUS,
        };
    }

    /**
     * Invalidate thrdassignment cache.
     */
    async invalidateCache(): Promise<void> {
        await Promise.all([
            AddonModThrdAssign.invalidateAssignmentData(this.COURSE_ID),
            this.thrdassign && AddonModThrdAssign.invalidateAllSubmissionData(this.thrdassign.id),
            this.thrdassign && AddonModThrdAssign.invalidateAssignmentUserMappingsData(this.thrdassign.id),
            this.thrdassign && AddonModThrdAssign.invalidateAssignmentGradesData(this.thrdassign.id),
            this.thrdassign && AddonModThrdAssign.invalidateListParticipantsData(this.thrdassign.id),
        ]);
    }

    /**
     * Load thrdassignment.
     */
    async loadAssignment(sync: boolean = false): Promise<void> {
        // Get thrdassignment data.
        this.thrdassign = await AddonModThrdAssign.getAssignment(this.COURSE_ID, this.MODULE_ID);

        if (sync) {
            try {
                // Try to synchronize data.
                const result = await AddonModThrdAssignSync.syncAssign(this.thrdassign.id);

                if (result && result.updated) {
                    CoreEvents.trigger(
                        AddonModThrdAssignSyncProvider.MANUAL_SYNCED,
                        {
                            thrdassignId: this.thrdassign.id,
                            warnings: result.warnings,
                            gradesBlocked: result.gradesBlocked,
                            context: 'submission-list',
                        },
                        CoreSites.getCurrentSiteId(),
                    );
                }
            } catch {
                // Ignore errors, probably user is offline or sync is blocked.
            }
        }

        // Get thrdassignment submissions.
        this.submissionsData = await AddonModThrdAssign.getSubmissions(this.thrdassign.id, { cmId: this.thrdassign.cmid });

        if (!this.submissionsData.canviewsubmissions) {
            // User shouldn't be able to reach here.
            throw new Error('Cannot view submissions.');
        }

        // Check if groupmode is enabled to avoid showing wrong numbers.
        this.groupInfo = await CoreGroups.getActivityGroupInfo(this.thrdassign.cmid, false);

        this.groupId = CoreGroups.validateGroupId(this.groupId, this.groupInfo);

        await this.reload();
    }

    /**
     * @inheritdoc
     */
    protected async loadPageItems(): Promise<{ items: AddonModThrdAssignSubmissionForList[] }> {
        const thrdassign = this.thrdassign;

        if (!thrdassign) {
            throw new Error('Can\'t load submissions without thrdassignment');
        }

        // Fetch submissions and grades.
        let submissions =
            await AddonModThrdAssignHelper.getSubmissionsUserData(
                thrdassign,
                this.submissionsData.submissions,
                this.groupId,
            );

        // Get thrdassignment grades only if workflow is not enabled to check grading date.
        let grades = !thrdassign.markingworkflow
            ? await AddonModThrdAssign.getAssignmentGrades(thrdassign.id, { cmId: thrdassign.cmid })
            : [];

        // Remove grades (not graded) and sort by timemodified DESC to allow finding quicker.
        grades = grades.filter((grade) => parseInt(grade.grade, 10) >= 0).sort((a, b) => b.timemodified - a.timemodified);
        // Filter the submissions to get only the ones with the right status and add some extra data.
        if (this.SELECTED_STATUS == AddonModThrdAssignListFilterName.NEED_GRADING) {
            const promises: Promise<void>[] = submissions.map(async (submission: AddonModThrdAssignSubmissionForList) => {
                // Only show the submissions that need to be graded.
                submission.needsGrading = await AddonModThrdAssign.needsSubmissionToBeGraded(submission, thrdassign.id);
            });

            await Promise.all(promises);

            submissions = submissions.filter((submission: AddonModThrdAssignSubmissionForList) => submission.needsGrading);
        } else if (this.SELECTED_STATUS) {
            const searchStatus = this.SELECTED_STATUS == AddonModThrdAssignListFilterName.DRAFT
                ? AddonModThrdAssignSubmissionStatusValues.DRAFT
                : AddonModThrdAssignSubmissionStatusValues.SUBMITTED;

            submissions = submissions.filter((submission: AddonModThrdAssignSubmissionForList) => submission.status  == searchStatus);
        }

        const showSubmissions: AddonModThrdAssignSubmissionForList[] = await Promise.all(
            submissions.map(async (submission: AddonModThrdAssignSubmissionForList) => {
                const gradeData =
                    await CoreUtils.ignoreErrors(AddonModThrdAssignOffline.getSubmissionGrade(thrdassign.id, submission.userid));

                // Load offline grades.
                const notSynced = !!gradeData && submission.timemodified < gradeData.timemodified;

                if (!thrdassign.markingworkflow) {
                    // Get the last grade of the submission.
                    const grade = grades.find((grade) => grade.userid == submission.userid);

                    if (grade) {
                        // Override status if grade is found.
                        submission.gradingstatus = grade.timemodified < submission.timemodified
                            ? AddonModThrdAssignGradingStates.GRADED_FOLLOWUP_SUBMIT
                            : AddonModThrdAssignGradingStates.GRADED;
                    }
                } else if (thrdassign.teamsubmission) {
                    // Try to use individual grading status instead of the group one.
                    const individualSubmission = this.submissionsData.submissions?.find(subm => submission.userid === subm.userid);
                    submission.gradingstatus = individualSubmission?.gradingstatus ?? submission.gradingstatus;
                }

                submission.statusColor = AddonModThrdAssign.getSubmissionStatusColor(submission.status);
                submission.gradingColor = AddonModThrdAssign.getSubmissionGradingStatusColor(
                    submission.gradingstatus,
                );

                submission.statusTranslated = Translate.instant(
                    'addon.mod_assign.submissionstatus_' + submission.status,
                );

                if (notSynced) {
                    submission.gradingStatusTranslationId = 'addon.mod_assign.gradenotsynced';
                    submission.gradingColor = '';
                } else if (submission.statusColor != CoreIonicColorNames.DANGER ||
                    submission.gradingColor != CoreIonicColorNames.DANGER) {
                    // Show grading status if one of the statuses is not done.
                    submission.gradingStatusTranslationId = AddonModThrdAssign.getSubmissionGradingStatusTranslationId(
                        submission.gradingstatus,
                    );
                } else {
                    submission.gradingStatusTranslationId = '';
                }

                return submission;
            }),
        );

        return { items: showSubmissions };
    }

}

/**
 * Calculated data for an thrdassign submission.
 */
export type AddonModThrdAssignSubmissionForList = AddonModThrdAssignSubmissionFormatted & {
    statusColor?: string; // Calculated in the app. Color of the submission status.
    gradingColor?: string; // Calculated in the app. Color of the submission grading status.
    statusTranslated?: string; // Calculated in the app. Translated text of the submission status.
    gradingStatusTranslationId?: string; // Calculated in the app. Key of the text of the submission grading status.
    needsGrading?: boolean; // Calculated in the app. If submission and grading status means that it needs grading.
};

/**
 * List filter by status name.
 */
export enum AddonModThrdAssignListFilterName {
    ALL = '',
    NEED_GRADING = 'needgrading',
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
}
