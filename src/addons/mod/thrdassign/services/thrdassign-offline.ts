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
import { CoreError } from '@classes/errors/error';
import { SQLiteDBRecordValues } from '@classes/sqlitedb';
import { CoreFile } from '@services/file';
import { CoreSites } from '@services/sites';
import { CoreTextUtils } from '@services/utils/text';
import { CoreTimeUtils } from '@services/utils/time';
import { makeSingleton } from '@singletons';
import { CorePath } from '@singletons/path';
import { AddonModThrdAssignOutcomes, AddonModThrdAssignSavePluginData } from './thrdassign';
import {
    AddonModThrdAssignSubmissionsDBRecord,
    AddonModThrdAssignSubmissionsGradingDBRecord,
    SUBMISSIONS_GRADES_TABLE,
    SUBMISSIONS_TABLE,
} from './database/thrdassign';

/**
 * Service to handle offline assign.
 */
@Injectable({ providedIn: 'root' })
export class AddonModThrdAssignOfflineProvider {

    /**
     * Delete a submission.
     *
     * @param thrdassignId Assignment ID.
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved if deleted, rejected if failure.
     */
    async deleteSubmission(thrdassignId: number, userId?: number, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);
        userId = userId || site.getUserId();

        await site.getDb().deleteRecords(
            SUBMISSIONS_TABLE,
            { thrdassignid: thrdassignId, userid: userId },
        );
    }

    /**
     * Delete a submission grade.
     *
     * @param thrdassignId Assignment ID.
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved if deleted, rejected if failure.
     */
    async deleteSubmissionGrade(thrdassignId: number, userId?: number, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);
        userId = userId || site.getUserId();

        await site.getDb().deleteRecords(
            SUBMISSIONS_GRADES_TABLE,
            { thrdassignid: thrdassignId, userid: userId },
        );
    }

    /**
     * Get all the thrdassignments ids that have something to be synced.
     *
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with thrdassignments id that have something to be synced.
     */
    async getAllAssigns(siteId?: string): Promise<number[]> {
        const promises:
        Promise<AddonModThrdAssignSubmissionsDBRecordFormatted[] | AddonModThrdAssignSubmissionsGradingDBRecordFormatted[]>[] = [];

        promises.push(this.getAllSubmissions(siteId));
        promises.push(this.getAllSubmissionsGrade(siteId));

        const results = await Promise.all(promises);
        // Flatten array.
        const flatten = results.flat();

        // Get thrdassign id.
        let thrdassignIds: number[] = flatten.map((thrdassign) => thrdassign.thrdassignid);
        // Get unique values.
        thrdassignIds = thrdassignIds.filter((id, pos) => thrdassignIds.indexOf(id) == pos);

        return thrdassignIds;
    }

    /**
     * Get all the stored submissions from all the thrdassignments.
     *
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with submissions.
     */
    protected async getAllSubmissions(siteId?: string): Promise<AddonModThrdAssignSubmissionsDBRecordFormatted[]> {
        return this.getAssignSubmissionsFormatted(undefined, siteId);
    }

    /**
     * Get all the stored submissions for a certain thrdassignment.
     *
     * @param thrdassignId Assignment ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with submissions.
     */
    async getAssignSubmissions(thrdassignId: number, siteId?: string): Promise<AddonModThrdAssignSubmissionsDBRecordFormatted[]> {
        return this.getAssignSubmissionsFormatted({ thrdassignid: thrdassignId }, siteId);
    }

    /**
     * Convenience helper function to get stored submissions formatted.
     *
     * @param conditions Query conditions.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with submissions.
     */
    protected async getAssignSubmissionsFormatted(
        conditions: SQLiteDBRecordValues = {},
        siteId?: string,
    ): Promise<AddonModThrdAssignSubmissionsDBRecordFormatted[]> {
        const db = await CoreSites.getSiteDb(siteId);

        const submissions: AddonModThrdAssignSubmissionsDBRecord[] = await db.getRecords(SUBMISSIONS_TABLE, conditions);

        // Parse the plugin data.
        return submissions.map((submission) => ({
            thrdassignid: submission.thrdassignid,
            userid: submission.userid,
            courseid: submission.courseid,
            plugindata: CoreTextUtils.parseJSON<AddonModThrdAssignSavePluginData>(submission.plugindata, {}),
            onlinetimemodified: submission.onlinetimemodified,
            timecreated: submission.timecreated,
            timemodified: submission.timemodified,
            submitted: submission.submitted,
            submissionstatement: submission.submissionstatement,
        }));
    }

    /**
     * Get all the stored submissions grades from all the thrdassignments.
     *
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with submissions grades.
     */
    protected async getAllSubmissionsGrade(siteId?: string): Promise<AddonModThrdAssignSubmissionsGradingDBRecordFormatted[]> {
        return this.getAssignSubmissionsGradeFormatted(undefined, siteId);
    }

    /**
     * Get all the stored submissions grades for a certain thrdassignment.
     *
     * @param thrdassignId Assignment ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with submissions grades.
     */
    async getAssignSubmissionsGrade(
        thrdassignId: number,
        siteId?: string,
    ): Promise<AddonModThrdAssignSubmissionsGradingDBRecordFormatted[]> {
        return this.getAssignSubmissionsGradeFormatted({ thrdassignid: thrdassignId }, siteId);
    }

    /**
     * Convenience helper function to get stored submissions grading formatted.
     *
     * @param conditions Query conditions.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with submissions grades.
     */
    protected async getAssignSubmissionsGradeFormatted(
        conditions: SQLiteDBRecordValues = {},
        siteId?: string,
    ): Promise<AddonModThrdAssignSubmissionsGradingDBRecordFormatted[]> {
        const db = await CoreSites.getSiteDb(siteId);

        const submissions: AddonModThrdAssignSubmissionsGradingDBRecord[] = await db.getRecords(SUBMISSIONS_GRADES_TABLE, conditions);

        // Parse the plugin data and outcomes.
        return submissions.map((submission) => ({
            thrdassignid: submission.thrdassignid,
            userid: submission.userid,
            courseid: submission.courseid,
            grade: submission.grade,
            attemptnumber: submission.attemptnumber,
            addattempt: submission.addattempt,
            workflowstate: submission.workflowstate,
            applytoall: submission.applytoall,
            outcomes: CoreTextUtils.parseJSON<AddonModThrdAssignOutcomes>(submission.outcomes, {}),
            plugindata: CoreTextUtils.parseJSON<AddonModThrdAssignSavePluginData>(submission.plugindata, {}),
            timemodified: submission.timemodified,
        }));
    }

    /**
     * Get a stored submission.
     *
     * @param thrdassignId Assignment ID.
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with submission.
     */
    async getSubmission(thrdassignId: number, userId?: number, siteId?: string): Promise<AddonModThrdAssignSubmissionsDBRecordFormatted> {
        userId = userId || CoreSites.getCurrentSiteUserId();

        const submissions = await this.getAssignSubmissionsFormatted({ thrdassignid: thrdassignId, userid: userId }, siteId);

        if (submissions.length) {
            return submissions[0];
        }

        throw new CoreError('No records found.');
    }

    /**
     * Get the path to the folder where to store files for an offline submission.
     *
     * @param thrdassignId Assignment ID.
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with the path.
     */
    async getSubmissionFolder(thrdassignId: number, userId?: number, siteId?: string): Promise<string> {
        const site = await CoreSites.getSite(siteId);

        userId = userId || site.getUserId();
        const siteFolderPath = CoreFile.getSiteFolder(site.getId());
        const submissionFolderPath = 'offlinethrdassign/' + thrdassignId + '/' + userId;

        return CorePath.concatenatePaths(siteFolderPath, submissionFolderPath);
    }

    /**
     * Get a stored submission grade.
     * Submission grades are not identified using attempt number so it can retrieve the feedback for a previous attempt.
     *
     * @param thrdassignId Assignment ID.
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with submission grade.
     */
    async getSubmissionGrade(
        thrdassignId: number,
        userId?: number,
        siteId?: string,
    ): Promise<AddonModThrdAssignSubmissionsGradingDBRecordFormatted> {
        userId = userId || CoreSites.getCurrentSiteUserId();

        const submissions = await this.getAssignSubmissionsGradeFormatted({ thrdassignid: thrdassignId, userid: userId }, siteId);

        if (submissions.length) {
            return submissions[0];
        }

        throw new CoreError('No records found.');
    }

    /**
     * Get the path to the folder where to store files for a certain plugin in an offline submission.
     *
     * @param thrdassignId Assignment ID.
     * @param pluginName Name of the plugin. Must be unique (both in submission and feedback plugins).
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with the path.
     */
    async getSubmissionPluginFolder(thrdassignId: number, pluginName: string, userId?: number, siteId?: string): Promise<string> {
        const folderPath = await this.getSubmissionFolder(thrdassignId, userId, siteId);

        return CorePath.concatenatePaths(folderPath, pluginName);
    }

    /**
     * Check if the thrdassignment has something to be synced.
     *
     * @param thrdassignId Assignment ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with boolean: whether the thrdassignment has something to be synced.
     */
    async hasAssignOfflineData(thrdassignId: number, siteId?: string): Promise<boolean> {
        const promises:
        Promise<AddonModThrdAssignSubmissionsDBRecordFormatted[] | AddonModThrdAssignSubmissionsGradingDBRecordFormatted[]>[] = [];

        promises.push(this.getAssignSubmissions(thrdassignId, siteId));
        promises.push(this.getAssignSubmissionsGrade(thrdassignId, siteId));

        try {
            const results = await Promise.all(promises);

            return results.some((result) => result.length);
        } catch {
            // No offline data found.
            return false;
        }
    }

    /**
     * Mark/Unmark a submission as being submitted.
     *
     * @param thrdassignId Assignment ID.
     * @param courseId Course ID the thrdassign belongs to.
     * @param submitted True to mark as submitted, false to mark as not submitted.
     * @param acceptStatement True to accept the submission statement, false otherwise.
     * @param timemodified The time the submission was last modified in online.
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved if marked, rejected if failure.
     */
    async markSubmitted(
        thrdassignId: number,
        courseId: number,
        submitted: boolean,
        acceptStatement: boolean,
        timemodified: number,
        userId?: number,
        siteId?: string,
    ): Promise<number> {
        const site = await CoreSites.getSite(siteId);

        userId = userId || site.getUserId();
        let submission: AddonModThrdAssignSubmissionsDBRecord;
        try {
            const savedSubmission: AddonModThrdAssignSubmissionsDBRecordFormatted =
                await this.getSubmission(thrdassignId, userId, site.getId());
            submission = Object.assign(savedSubmission, {
                plugindata: savedSubmission.plugindata ? JSON.stringify(savedSubmission.plugindata) : '{}',
                submitted: submitted ? 1 : 0, // Mark the submission.
                submissionstatement: acceptStatement ? 1 : 0, // Mark the submission.
            });
        } catch {
            // No submission, create an empty one.
            const now = CoreTimeUtils.timestamp();
            submission = {
                thrdassignid: thrdassignId,
                courseid: courseId,
                userid: userId,
                onlinetimemodified: timemodified,
                timecreated: now,
                timemodified: now,
                plugindata: '{}',
                submitted: submitted ? 1 : 0, // Mark the submission.
                submissionstatement: acceptStatement ? 1 : 0, // Mark the submission.
            };
        }

        return site.getDb().insertRecord(SUBMISSIONS_TABLE, submission);
    }

    /**
     * Save a submission to be sent later.
     *
     * @param thrdassignId Assignment ID.
     * @param courseId Course ID the thrdassign belongs to.
     * @param pluginData Data to save.
     * @param timemodified The time the submission was last modified in online.
     * @param submitted True if submission has been submitted, false otherwise.
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved if stored, rejected if failure.
     */
    async saveSubmission(
        thrdassignId: number,
        courseId: number,
        pluginData: AddonModThrdAssignSavePluginData,
        timemodified: number,
        submitted: boolean,
        userId?: number,
        siteId?: string,
    ): Promise<number> {
        const site = await CoreSites.getSite(siteId);

        userId = userId || site.getUserId();

        const now = CoreTimeUtils.timestamp();
        const entry: AddonModThrdAssignSubmissionsDBRecord = {
            thrdassignid: thrdassignId,
            courseid: courseId,
            plugindata: pluginData ? JSON.stringify(pluginData) : '{}',
            userid: userId,
            submitted: submitted ? 1 : 0,
            timecreated: now,
            timemodified: now,
            onlinetimemodified: timemodified,
        };

        return site.getDb().insertRecord(SUBMISSIONS_TABLE, entry);
    }

    /**
     * Save a grading to be sent later.
     *
     * @param thrdassignId Assign ID.
     * @param userId User ID.
     * @param courseId Course ID the thrdassign belongs to.
     * @param grade Grade to submit.
     * @param attemptNumber Number of the attempt being graded.
     * @param addAttempt Admit the user to attempt again.
     * @param workflowState Next workflow State.
     * @param applyToAll If it's a team submission, whether the grade applies to all group members.
     * @param outcomes Object including all outcomes values. If empty, any of them will be sent.
     * @param pluginData Plugin data to save.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved if stored, rejected if failure.
     */
    async submitGradingForm(
        thrdassignId: number,
        userId: number,
        courseId: number,
        grade: number,
        attemptNumber: number,
        addAttempt: boolean,
        workflowState: string,
        applyToAll: boolean,
        outcomes: AddonModThrdAssignOutcomes,
        pluginData: AddonModThrdAssignSavePluginData,
        siteId?: string,
    ): Promise<number> {
        const site = await CoreSites.getSite(siteId);

        const now = CoreTimeUtils.timestamp();
        const entry: AddonModThrdAssignSubmissionsGradingDBRecord = {
            thrdassignid: thrdassignId,
            userid: userId,
            courseid: courseId,
            grade: grade,
            attemptnumber: attemptNumber,
            addattempt: addAttempt ? 1 : 0,
            workflowstate: workflowState,
            applytoall: applyToAll ? 1 : 0,
            outcomes: outcomes ? JSON.stringify(outcomes) : '{}',
            plugindata: pluginData ? JSON.stringify(pluginData) : '{}',
            timemodified: now,
        };

        return site.getDb().insertRecord(SUBMISSIONS_GRADES_TABLE, entry);
    }

}
export const AddonModThrdAssignOffline = makeSingleton(AddonModThrdAssignOfflineProvider);

export type AddonModThrdAssignSubmissionsDBRecordFormatted = Omit<AddonModThrdAssignSubmissionsDBRecord, 'plugindata'> & {
    plugindata: AddonModThrdAssignSavePluginData;
};

export type AddonModThrdAssignSubmissionsGradingDBRecordFormatted =
    Omit<AddonModThrdAssignSubmissionsGradingDBRecord, 'plugindata'|'outcomes'> & {
        plugindata: AddonModThrdAssignSavePluginData;
        outcomes: AddonModThrdAssignOutcomes;
    };
