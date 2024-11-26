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
import { CoreEvents } from '@singletons/events';
import { CoreSites, CoreSitesReadingStrategy } from '@services/sites';
import { CoreSyncBlockedError } from '@classes/base-sync';
import {
    AddonModThrdAssignProvider,
    AddonModThrdAssignAssign,
    AddonModThrdAssignSubmission,
    AddonModThrdAssign,
    AddonModThrdAssignGetSubmissionStatusWSResponse,
    AddonModThrdAssignSubmissionStatusOptions,
} from './thrdassign';
import { makeSingleton, Translate } from '@singletons';
import { CoreCourse } from '@features/course/services/course';
import { CoreCourseActivitySyncBaseProvider } from '@features/course/classes/activity-sync';
import {
    AddonModThrdAssignOffline,
    AddonModThrdAssignSubmissionsDBRecordFormatted,
    AddonModThrdAssignSubmissionsGradingDBRecordFormatted,
} from './thrdassign-offline';
import { CoreSync, CoreSyncResult } from '@services/sync';
import { CoreCourseLogHelper } from '@features/course/services/log-helper';
import { CoreUtils } from '@services/utils/utils';
import { CoreNetwork } from '@services/network';
import { CoreNetworkError } from '@classes/errors/network-error';
import { CoreGradesFormattedItem, CoreGradesHelper } from '@features/grades/services/grades-helper';
import { AddonModThrdAssignSubmissionDelegate } from './submission-delegate';
import { AddonModThrdAssignFeedbackDelegate } from './feedback-delegate';

/**
 * Service to sync assigns.
 */
@Injectable({ providedIn: 'root' })
export class AddonModThrdAssignSyncProvider extends CoreCourseActivitySyncBaseProvider<AddonModThrdAssignSyncResult> {

    static readonly AUTO_SYNCED = 'addon_mod_thrdassign_autom_synced';
    static readonly MANUAL_SYNCED = 'addon_mod_thrdassign_manual_synced';

    protected componentTranslatableString = 'thrdassign';

    constructor() {
        super('AddonModThrdAssignSyncProvider');
    }

    /**
     * Get the sync ID for a certain user grade.
     *
     * @param thrdassignId Assign ID.
     * @param userId User the grade belongs to.
     * @returns Sync ID.
     */
    getGradeSyncId(thrdassignId: number, userId: number): string {
        return 'thrdassignGrade#' + thrdassignId + '#' + userId;
    }

    /**
     * Convenience function to get scale selected option.
     *
     * @param options Possible options.
     * @param selected Selected option to search.
     * @returns Index of the selected option.
     */
    protected getSelectedScaleId(options: string, selected: string): number {
        let optionsList = options.split(',');

        optionsList = optionsList.map((value) => value.trim());

        optionsList.unshift('');

        const index = options.indexOf(selected) || 0;
        if (index < 0) {
            return 0;
        }

        return index;
    }

    /**
     * Check if an thrdassignment has data to synchronize.
     *
     * @param thrdassignId Assign ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with boolean: whether it has data to sync.
     */
    hasDataToSync(thrdassignId: number, siteId?: string): Promise<boolean> {
        return AddonModThrdAssignOffline.hasAssignOfflineData(thrdassignId, siteId);
    }

    /**
     * Try to synchronize all the thrdassignments in a certain site or in all sites.
     *
     * @param siteId Site ID to sync. If not defined, sync all sites.
     * @param force Wether to force sync not depending on last execution.
     * @returns Promise resolved if sync is successful, rejected if sync fails.
     */
    syncAllAssignments(siteId?: string, force?: boolean): Promise<void> {
        return this.syncOnSites('all thrdassignments', (siteId) => this.syncAllAssignmentsFunc(!!force, siteId), siteId);
    }

    /**
     * Sync all thrdassignments on a site.
     *
     * @param force Wether to force sync not depending on last execution.
     * @param siteId Site ID to sync. If not defined, sync all sites.
     * @returns Promise resolved if sync is successful, rejected if sync fails.
     */
    protected async syncAllAssignmentsFunc(force: boolean, siteId: string): Promise<void> {
        // Get all thrdassignments that have offline data.
        const thrdassignIds = await AddonModThrdAssignOffline.getAllAssigns(siteId);

        // Try to sync all thrdassignments.
        await Promise.all(thrdassignIds.map(async (thrdassignId) => {
            const result = force
                ? await this.syncAssign(thrdassignId, siteId)
                : await this.syncAssignIfNeeded(thrdassignId, siteId);

            if (result?.updated) {
                CoreEvents.trigger(AddonModThrdAssignSyncProvider.AUTO_SYNCED, {
                    thrdassignId: thrdassignId,
                    warnings: result.warnings,
                    gradesBlocked: result.gradesBlocked,
                }, siteId);
            }
        }));
    }

    /**
     * Sync an thrdassignment only if a certain time has passed since the last time.
     *
     * @param thrdassignId Assign ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the thrdassign is synced or it doesn't need to be synced.
     */
    async syncAssignIfNeeded(thrdassignId: number, siteId?: string): Promise<AddonModThrdAssignSyncResult | undefined> {
        const needed = await this.isSyncNeeded(thrdassignId, siteId);

        if (needed) {
            return this.syncAssign(thrdassignId, siteId);
        }
    }

    /**
     * Try to synchronize an thrdassign.
     *
     * @param thrdassignId Assign ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved in success.
     */
    async syncAssign(thrdassignId: number, siteId?: string): Promise<AddonModThrdAssignSyncResult> {
        siteId = siteId || CoreSites.getCurrentSiteId();

        const currentSyncPromise = this.getOngoingSync(thrdassignId, siteId);
        if (currentSyncPromise) {
            // There's already a sync ongoing for this thrdassign, return the promise.
            return currentSyncPromise;
        }

        // Verify that thrdassign isn't blocked.
        if (CoreSync.isBlocked(AddonModThrdAssignProvider.COMPONENT, thrdassignId, siteId)) {
            this.logger.debug('Cannot sync thrdassign ' + thrdassignId + ' because it is blocked.');

            throw new CoreSyncBlockedError(Translate.instant('core.errorsyncblocked', { $a: this.componentTranslate }));
        }

        this.logger.debug('Try to sync thrdassign ' + thrdassignId + ' in site ' + siteId);

        const syncPromise = this.performSyncAssign(thrdassignId, siteId);

        return this.addOngoingSync(thrdassignId, syncPromise, siteId);
    }

    /**
     * Perform the thrdassign submission.
     *
     * @param thrdassignId Assign ID.
     * @param siteId Site ID.
     * @returns Promise resolved in success.
     */
    protected async performSyncAssign(thrdassignId: number, siteId: string): Promise<AddonModThrdAssignSyncResult> {
        // Sync offline logs.
        await CoreUtils.ignoreErrors(
            CoreCourseLogHelper.syncActivity(AddonModThrdAssignProvider.COMPONENT, thrdassignId, siteId),
        );

        const result: AddonModThrdAssignSyncResult = {
            warnings: [],
            updated: false,
            gradesBlocked: [],
        };

        // Load offline data and sync offline logs.
        const [submissions, grades] = await Promise.all([
            this.getOfflineSubmissions(thrdassignId, siteId),
            this.getOfflineGrades(thrdassignId, siteId),
        ]);

        if (!submissions.length && !grades.length) {
            // Nothing to sync.
            await CoreUtils.ignoreErrors(this.setSyncTime(thrdassignId, siteId));

            return result;
        }

        if (!CoreNetwork.isOnline()) {
            // Cannot sync in offline.
            throw new CoreNetworkError();
        }

        const courseId = submissions.length > 0 ? submissions[0].courseid : grades[0].courseid;

        const thrdassign = await AddonModThrdAssign.getAssignmentById(courseId, thrdassignId, { siteId });

        let promises: Promise<void>[] = [];

        promises = promises.concat(submissions.map(async (submission) => {
            await this.syncSubmission(thrdassign, submission, result.warnings, siteId);

            result.updated = true;

            return;
        }));

        promises = promises.concat(grades.map(async (grade) => {
            try {
                await this.syncSubmissionGrade(thrdassign, grade, result.warnings, courseId, siteId);

                result.updated = true;
            } catch (error) {
                if (error instanceof CoreSyncBlockedError) {
                    // Grade blocked, but allow finish the sync.
                    result.gradesBlocked.push(grade.userid);
                } else {
                    throw error;
                }
            }
        }));

        await CoreUtils.allPromises(promises);

        if (result.updated) {
            // Data has been sent to server. Now invalidate the WS calls.
            await CoreUtils.ignoreErrors(AddonModThrdAssign.invalidateContent(thrdassign.cmid, courseId, siteId));
        }

        // Sync finished, set sync time.
        await CoreUtils.ignoreErrors(this.setSyncTime(thrdassignId, siteId));

        // All done, return the result.
        return result;
    }

    /**
     * Get offline grades to be sent.
     *
     * @param thrdassignId Assign ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise with grades.
     */
    protected async getOfflineGrades(
        thrdassignId: number,
        siteId: string,
    ): Promise<AddonModThrdAssignSubmissionsGradingDBRecordFormatted[]> {
        // If no offline data found, return empty array.
        return CoreUtils.ignoreErrors(AddonModThrdAssignOffline.getAssignSubmissionsGrade(thrdassignId, siteId), []);
    }

    /**
     * Get offline submissions to be sent.
     *
     * @param thrdassignId Assign ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise with submissions.
     */
    protected async getOfflineSubmissions(
        thrdassignId: number,
        siteId: string,
    ): Promise<AddonModThrdAssignSubmissionsDBRecordFormatted[]> {
        // If no offline data found, return empty array.
        return CoreUtils.ignoreErrors(AddonModThrdAssignOffline.getAssignSubmissions(thrdassignId, siteId), []);
    }

    /**
     * Synchronize a submission.
     *
     * @param thrdassign Assignment.
     * @param offlineData Submission offline data.
     * @param warnings List of warnings.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved if success, rejected otherwise.
     */
    protected async syncSubmission(
        thrdassign: AddonModThrdAssignAssign,
        offlineData: AddonModThrdAssignSubmissionsDBRecordFormatted,
        warnings: string[],
        siteId: string,
    ): Promise<void> {

        const userId = offlineData.userid;
        const pluginData = {};
        const options: AddonModThrdAssignSubmissionStatusOptions = {
            userId,
            cmId: thrdassign.cmid,
            readingStrategy: CoreSitesReadingStrategy.ONLY_NETWORK,
            siteId,
        };

        const status = await AddonModThrdAssign.getSubmissionStatus(thrdassign.id, options);

        const submission = AddonModThrdAssign.getSubmissionObjectFromAttempt(thrdassign, status.lastattempt);

        if (submission && submission.timemodified != offlineData.onlinetimemodified) {
            // The submission was modified in Moodle, discard the submission.
            this.addOfflineDataDeletedWarning(
                warnings,
                thrdassign.name,
                Translate.instant('addon.mod_assign.warningsubmissionmodified'),
            );

            return this.deleteSubmissionData(thrdassign, offlineData, submission, siteId);
        }

        try {
            if (submission?.plugins) {
                // Prepare plugins data.
                await Promise.all(submission.plugins.map((plugin) =>
                    AddonModThrdAssignSubmissionDelegate.preparePluginSyncData(
                        thrdassign,
                        submission,
                        plugin,
                        offlineData,
                        pluginData,
                        siteId,
                    )));
            }

            // Now save the submission.
            if (Object.keys(pluginData).length > 0) {
                await AddonModThrdAssign.saveSubmissionOnline(thrdassign.id, pluginData, siteId);
            }

            if (thrdassign.submissiondrafts && offlineData.submitted) {
                // The user submitted the thrdassign manually. Submit it for grading.
                await AddonModThrdAssign.submitForGradingOnline(thrdassign.id, !!offlineData.submissionstatement, siteId);
            }

            // Submission data sent, update cached data. No need to block the user for this.
            AddonModThrdAssign.getSubmissionStatus(thrdassign.id, options);
        } catch (error) {
            if (!error || !CoreUtils.isWebServiceError(error)) {
                // Local error, reject.
                throw error;
            }

            // A WebService has thrown an error, this means it cannot be submitted. Discard the submission.
            this.addOfflineDataDeletedWarning(warnings, thrdassign.name, error);
        }

        // Delete the offline data.
        await this.deleteSubmissionData(thrdassign, offlineData, submission, siteId);
    }

    /**
     * Delete the submission offline data (not grades).
     *
     * @param thrdassign Assign.
     * @param offlineData Offline data.
     * @param submission Submission.
     * @param siteId Site ID.
     * @returns Promise resolved when done.
     */
    protected async deleteSubmissionData(
        thrdassign: AddonModThrdAssignAssign,
        offlineData: AddonModThrdAssignSubmissionsDBRecordFormatted,
        submission?: AddonModThrdAssignSubmission,
        siteId?: string,
    ): Promise<void> {

        // Delete the offline data.
        await AddonModThrdAssignOffline.deleteSubmission(thrdassign.id, offlineData.userid, siteId);

        if (submission?.plugins){
            // Delete plugins data.
            await Promise.all(submission.plugins.map((plugin) =>
                AddonModThrdAssignSubmissionDelegate.deletePluginOfflineData(
                    thrdassign,
                    submission,
                    plugin,
                    offlineData,
                    siteId,
                )));
        }
    }

    /**
     * Synchronize a submission grade.
     *
     * @param thrdassign Assignment.
     * @param offlineData Submission grade offline data.
     * @param warnings List of warnings.
     * @param courseId Course Id.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved if success, rejected otherwise.
     */
    protected async syncSubmissionGrade(
        thrdassign: AddonModThrdAssignAssign,
        offlineData: AddonModThrdAssignSubmissionsGradingDBRecordFormatted,
        warnings: string[],
        courseId: number,
        siteId: string,
    ): Promise<void> {

        const userId = offlineData.userid;
        const syncId = this.getGradeSyncId(thrdassign.id, userId);
        const options: AddonModThrdAssignSubmissionStatusOptions = {
            userId,
            cmId: thrdassign.cmid,
            readingStrategy: CoreSitesReadingStrategy.ONLY_NETWORK,
            siteId,
        };

        // Check if this grade sync is blocked.
        if (CoreSync.isBlocked(AddonModThrdAssignProvider.COMPONENT, syncId, siteId)) {
            this.logger.error(`Cannot sync grade for thrdassign ${thrdassign.id} and user ${userId} because it is blocked.!!!!`);

            throw new CoreSyncBlockedError(Translate.instant(
                'core.errorsyncblocked',
                { $a: Translate.instant('addon.mod_assign.syncblockedusercomponent') },
            ));
        }

        const status = await AddonModThrdAssign.getSubmissionStatus(thrdassign.id, options);

        const timemodified = (status.feedback && (status.feedback.gradeddate || status.feedback.grade?.timemodified)) || 0;

        if (timemodified > offlineData.timemodified) {
            // The submission grade was modified in Moodle, discard it.
            this.addOfflineDataDeletedWarning(
                warnings,
                thrdassign.name,
                Translate.instant('addon.mod_assign.warningsubmissiongrademodified'),
            );

            return AddonModThrdAssignOffline.deleteSubmissionGrade(thrdassign.id, userId, siteId);
        }

        // If grade has been modified from gradebook, do not use offline.
        const grades = await CoreGradesHelper.getGradeModuleItems(courseId, thrdassign.cmid, userId, undefined, siteId, true);

        const gradeInfo = await CoreCourse.getModuleBasicGradeInfo(thrdassign.cmid, siteId);

        // Override offline grade and outcomes based on the gradebook data.
        grades.forEach((grade: CoreGradesFormattedItem) => {
            if ((grade.gradedategraded || 0) >= offlineData.timemodified) {
                if (!grade.outcomeid && !grade.scaleid) {
                    if (gradeInfo && gradeInfo.scale) {
                        offlineData.grade = this.getSelectedScaleId(gradeInfo.scale, grade.grade || '');
                    } else {
                        offlineData.grade = parseFloat(grade.grade || '');
                    }
                } else if (gradeInfo && grade.outcomeid && gradeInfo.outcomes) {
                    gradeInfo.outcomes.forEach((outcome, index) => {
                        if (outcome.scale && grade.itemnumber == index) {
                            offlineData.outcomes[grade.itemnumber] = this.getSelectedScaleId(
                                outcome.scale,
                                grade.grade || '',
                            );
                        }
                    });
                }
            }
        });

        try {
            // Now submit the grade.
            await AddonModThrdAssign.submitGradingFormOnline(
                thrdassign.id,
                userId,
                offlineData.grade,
                offlineData.attemptnumber,
                !!offlineData.addattempt,
                offlineData.workflowstate,
                !!offlineData.applytoall,
                offlineData.outcomes,
                offlineData.plugindata,
                siteId,
            );

            // Grades sent. Discard grades drafts.
            let promises: Promise<void | AddonModThrdAssignGetSubmissionStatusWSResponse>[] = [];
            if (status.feedback && status.feedback.plugins) {
                promises = status.feedback.plugins.map((plugin) =>
                    AddonModThrdAssignFeedbackDelegate.discardPluginFeedbackData(thrdassign.id, userId, plugin, siteId));
            }

            // Update cached data.
            promises.push(AddonModThrdAssign.getSubmissionStatus(thrdassign.id, options));

            await CoreUtils.allPromises(promises);
        } catch (error) {
            if (!error || !CoreUtils.isWebServiceError(error)) {
                // Local error, reject.
                throw error;
            }

            // A WebService has thrown an error, this means it cannot be submitted. Discard the submission.
            this.addOfflineDataDeletedWarning(warnings, thrdassign.name, error);
        }

        // Delete the offline data.
        await AddonModThrdAssignOffline.deleteSubmissionGrade(thrdassign.id, userId, siteId);
    }

}
export const AddonModThrdAssignSync = makeSingleton(AddonModThrdAssignSyncProvider);

/**
 * Data returned by a thrdassign sync.
 */
export type AddonModThrdAssignSyncResult = CoreSyncResult & {
    courseId?: number; // Course the thrdassign belongs to (if known).
    gradesBlocked: number[]; // Whether some grade couldn't be synced because it was blocked. UserId fields of the blocked grade.
};

/**
 * Data passed to AUTO_SYNCED event.
 */
export type AddonModThrdAssignAutoSyncData = {
    thrdassignId: number;
    warnings: string[];
    gradesBlocked: number[]; // Whether some grade couldn't be synced because it was blocked. UserId fields of the blocked grade.
};

/**
 * Data passed to MANUAL_SYNCED event.
 */
export type AddonModThrdAssignManualSyncData = AddonModThrdAssignAutoSyncData & {
    context: string;
    submitId?: number;
};
