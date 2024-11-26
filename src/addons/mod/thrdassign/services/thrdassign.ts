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
import { CoreSites, CoreSitesCommonWSOptions, CoreSitesReadingStrategy } from '@services/sites';
import { CoreSite } from '@classes/sites/site';
import { CoreInterceptor } from '@classes/interceptor';
import { CoreWSExternalWarning, CoreWSExternalFile, CoreWSFile } from '@services/ws';
import { makeSingleton, Translate } from '@singletons';
import { CoreCourseCommonModWSOptions } from '@features/course/services/course';
import { CoreTextUtils } from '@services/utils/text';
import { CoreGrades } from '@features/grades/services/grades';
import { CoreTimeUtils } from '@services/utils/time';
import { CoreCourseLogHelper } from '@features/course/services/log-helper';
import { CoreError } from '@classes/errors/error';
import { CoreNetwork } from '@services/network';
import { CoreUtils } from '@services/utils/utils';
import { AddonModThrdAssignOffline } from './thrdassign-offline';
import { AddonModThrdAssignSubmissionDelegate } from './submission-delegate';
import { CoreComments } from '@features/comments/services/comments';
import { AddonModThrdAssignSubmissionFormatted } from './thrdassign-helper';
import { CoreWSError } from '@classes/errors/wserror';
import { AddonModThrdAssignAutoSyncData, AddonModThrdAssignManualSyncData, AddonModThrdAssignSyncProvider } from './thrdassign-sync';
import { CoreFormFields } from '@singletons/form';
import { CoreFileHelper } from '@services/file-helper';
import { CoreIonicColorNames } from '@singletons/colors';
import { CoreSiteWSPreSets } from '@classes/sites/authenticated-site';
import { ContextLevel } from '@/core/constants';

const ROOT_CACHE_KEY = 'mmaModAssign:';

declare module '@singletons/events' {

    /**
     * Augment CoreEventsData interface with events specific to this service.
     *
     * @see https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
     */
    export interface CoreEventsData {
        [AddonModThrdAssignProvider.SUBMISSION_SAVED_EVENT]: AddonModThrdAssignSubmissionSavedEventData;
        [AddonModThrdAssignProvider.SUBMITTED_FOR_GRADING_EVENT]: AddonModThrdAssignSubmittedForGradingEventData;
        [AddonModThrdAssignProvider.GRADED_EVENT]: AddonModThrdAssignGradedEventData;
        [AddonModThrdAssignProvider.STARTED_EVENT]: AddonModThrdAssignStartedEventData;
        [AddonModThrdAssignSyncProvider.MANUAL_SYNCED]: AddonModThrdAssignManualSyncData;
        [AddonModThrdAssignSyncProvider.AUTO_SYNCED]: AddonModThrdAssignAutoSyncData;
    }

}

/**
 * Service that provides some functions for assign.
 */
@Injectable({ providedIn: 'root' })
export class AddonModThrdAssignProvider {

    static readonly COMPONENT = 'mmaModThrdAssign';
    static readonly SUBMISSION_COMPONENT = 'mmaModThrdAssignSubmission';
    static readonly UNLIMITED_ATTEMPTS = -1;

    // Group submissions warnings.
    static readonly WARN_GROUPS_REQUIRED = 'warnrequired';
    static readonly WARN_GROUPS_OPTIONAL = 'warnoptional';

    // Events.
    static readonly SUBMISSION_SAVED_EVENT = 'addon_mod_thrdassign_submission_saved';
    static readonly SUBMITTED_FOR_GRADING_EVENT = 'addon_mod_thrdassign_submitted_for_grading';
    static readonly GRADED_EVENT = 'addon_mod_thrdassign_graded';
    static readonly STARTED_EVENT = 'addon_mod_thrdassign_started';

    /**
     * Check if the user can submit in offline. This should only be used if submissionStatus.lastattempt.cansubmit cannot
     * be used (offline usage).
     * This function doesn't check if the submission is empty, it should be checked before calling this function.
     *
     * @param assign Assignment instance.
     * @param submissionStatus Submission status returned by getSubmissionStatus.
     * @returns Whether it can submit.
     */
    canSubmitOffline(thrdassign: AddonModThrdAssignAssign, submissionStatus: AddonModThrdAssignGetSubmissionStatusWSResponse): boolean {
        if (!this.isSubmissionOpen(thrdassign, submissionStatus)) {
            return false;
        }

        const userSubmission = submissionStatus.lastattempt?.submission;
        const teamSubmission = submissionStatus.lastattempt?.teamsubmission;

        if (teamSubmission) {
            if (teamSubmission.status === AddonModThrdAssignSubmissionStatusValues.SUBMITTED) {
                // The assignment submission has been completed.
                return false;
            } else if (userSubmission && userSubmission.status === AddonModThrdAssignSubmissionStatusValues.SUBMITTED) {
                // The user has already clicked the submit button on the team submission.
                return false;
            } else if (thrdassign.preventsubmissionnotingroup && !submissionStatus.lastattempt?.submissiongroup) {
                return false;
            }
        } else if (userSubmission) {
            if (userSubmission.status === AddonModThrdAssignSubmissionStatusValues.SUBMITTED) {
                // The assignment submission has been completed.
                return false;
            }
        } else {
            // No valid submission or team submission.
            return false;
        }

        // Last check is that this instance allows drafts.
        return !!thrdassign.submissiondrafts;
    }

    /**
     * Fix some submission status params.
     *
     * @param site Site to use.
     * @param userId User Id (empty for current user).
     * @param groupId Group Id (empty for all participants).
     * @param isBlind If blind marking is enabled or not.
     * @returns Object with fixed params.
     */
    protected fixSubmissionStatusParams(
        site: CoreSite,
        userId?: number,
        groupId?: number,
        isBlind = false,
    ): AddonModThrdAssignFixedSubmissionParams {

        return {
            isBlind: !userId ? false : !!isBlind,
            groupId: groupId || 0,
            userId: userId || site.getUserId(),
        };
    }

    /**
     * Get an assignment by course module ID.
     *
     * @param courseId Course ID the assignment belongs to.
     * @param cmId Assignment module ID.
     * @param options Other options.
     * @returns Promise resolved with the assignment.
     */
    getAssignment(courseId: number, cmId: number, options: CoreSitesCommonWSOptions = {}): Promise<AddonModThrdAssignAssign> {
        return this.getAssignmentByField(courseId, 'cmid', cmId, options);
    }

    /**
     * Get an assigment with key=value. If more than one is found, only the first will be returned.
     *
     * @param courseId Course ID.
     * @param key Name of the property to check.
     * @param value Value to search.
     * @param options Other options.
     * @returns Promise resolved when the assignment is retrieved.
     */
    protected async getAssignmentByField(
        courseId: number,
        key: string,
        value: number,
        options: CoreSitesCommonWSOptions = {},
    ): Promise<AddonModThrdAssignAssign> {
        const site = await CoreSites.getSite(options.siteId);

        const params: AddonModThrdAssignGetAssignmentsWSParams = {
            courseids: [courseId],
            includenotenrolledcourses: true,
        };

        const preSets: CoreSiteWSPreSets = {
            cacheKey: this.getAssignmentCacheKey(courseId),
            updateFrequency: CoreSite.FREQUENCY_RARELY,
            component: AddonModThrdAssignProvider.COMPONENT,
            ...CoreSites.getReadingStrategyPreSets(options.readingStrategy), // Include reading strategy preSets.
        };

        let response: AddonModThrdAssignGetAssignmentsWSResponse;

        try {
            response = await site.read<AddonModThrdAssignGetAssignmentsWSResponse>('mod_thrdassign_get_thrdassignments', params, preSets);
        } catch {
            // In 3.6 we added a new parameter includenotenrolledcourses that could cause offline data not to be found.
            // Retry again without the param to check if the request is already cached.
            delete params.includenotenrolledcourses;

            response = await site.read('mod_thrdassign_get_thrdassignments', params, preSets);
        }

        // Search the assignment to return.
        if (response.courses.length) {
            const thrdassignment = response.courses[0].thrdassignments.find((thrdassignment) => thrdassignment[key] == value);

            if (thrdassignment) {
                return thrdassignment;
            }
        }

        throw new CoreError(Translate.instant('core.course.modulenotfound'));
    }

    /**
     * Get an assignment by instance ID.
     *
     * @param courseId Course ID the assignment belongs to.
     * @param id Assignment instance ID.
     * @param options Other options.
     * @returns Promise resolved with the assignment.
     */
    getAssignmentById(courseId: number, id: number, options: CoreSitesCommonWSOptions = {}): Promise<AddonModThrdAssignAssign> {
        return this.getAssignmentByField(courseId, 'id', id, options);
    }

    /**
     * Get cache key for assignment data WS calls.
     *
     * @param courseId Course ID.
     * @returns Cache key.
     */
    protected getAssignmentCacheKey(courseId: number): string {
        return ROOT_CACHE_KEY + 'thrdassignment:' + courseId;
    }

    /**
     * Get an assignment user mapping for blind marking.
     *
     * @param assignId Assignment Id.
     * @param userId User Id to be blinded.
     * @param options Other options.
     * @returns Promise resolved with the user blind id.
     */
    async getAssignmentUserMappings(thrdassignId: number, userId: number, options: CoreCourseCommonModWSOptions = {}): Promise<number> {
        if (!userId || userId < 0) {
            // User not valid, stop.
            return -1;
        }

        const site = await CoreSites.getSite(options.siteId);

        const params: AddonModThrdAssignGetUserMappingsWSParams = {
            thrdassignmentids: [thrdassignId],
        };
        const preSets: CoreSiteWSPreSets = {
            cacheKey: this.getAssignmentUserMappingsCacheKey(thrdassignId),
            updateFrequency: CoreSite.FREQUENCY_OFTEN,
            component: AddonModThrdAssignProvider.COMPONENT,
            componentId: options.cmId,
            ...CoreSites.getReadingStrategyPreSets(options.readingStrategy),
        };

        const response = await site.read<AddonModThrdAssignGetUserMappingsWSResponse>('mod_thrdassign_get_user_mappings', params, preSets);

        // Search the user.
        if (response.thrdassignments.length && response.thrdassignments[0].thrdassignmentid == thrdassignId) {
            const mapping = response.thrdassignments[0].mappings.find((mapping) => mapping.userid == userId);

            if (mapping) {
                return mapping.id;
            }
        } else if (response.warnings && response.warnings.length) {
            throw response.warnings[0];
        }

        throw new CoreError('Assignment user mappings not found');
    }

    /**
     * Get cache key for assignment user mappings data WS calls.
     *
     * @param assignId Assignment ID.
     * @returns Cache key.
     */
    protected getAssignmentUserMappingsCacheKey(thrdassignId: number): string {
        return ROOT_CACHE_KEY + 'usermappings:' + thrdassignId;
    }

    /**
     * Returns grade information from assign_grades for the requested assignment id
     *
     * @param thrdassignId Assignment Id.
     * @param options Other options.
     * @returns Resolved with requested info when done.
     */
    async getAssignmentGrades(thrdassignId: number, options: CoreCourseCommonModWSOptions = {}): Promise<AddonModThrdAssignGrade[]> {
        const site = await CoreSites.getSite(options.siteId);

        const params: AddonModThrdAssignGetGradesWSParams = {
            thrdassignmentids: [thrdassignId],
        };
        const preSets: CoreSiteWSPreSets = {
            cacheKey: this.getAssignmentGradesCacheKey(thrdassignId),
            component: AddonModThrdAssignProvider.COMPONENT,
            componentId: options.cmId,
            ...CoreSites.getReadingStrategyPreSets(options.readingStrategy),
        };

        const response = await site.read<AddonModThrdAssignGetGradesWSResponse>('mod_thrdassign_get_grades', params, preSets);

        // Search the thrdassignment.
        if (response.thrdassignments.length && response.thrdassignments[0].thrdassignmentid == thrdassignId) {
            return response.thrdassignments[0].grades;
        } else if (response.warnings && response.warnings.length) {
            if (response.warnings[0].warningcode == '3') {
                // No grades found.
                return [];
            }

            throw response.warnings[0];
        }

        throw new CoreError('Assignment grades not found.');
    }

    /**
     * Get cache key for thrdassignment grades data WS calls.
     *
     * @param thrdassignId Assignment ID.
     * @returns Cache key.
     */
    protected getAssignmentGradesCacheKey(thrdassignId: number): string {
        return ROOT_CACHE_KEY + 'thrdassigngrades:' + thrdassignId;
    }

    /**
     * Returns the color name for a given grading status name.
     *
     * @param status Grading status name
     * @returns The color name.
     */
    getSubmissionGradingStatusColor(status?: AddonModThrdAssignGradingStates): CoreIonicColorNames {
        if (!status) {
            return CoreIonicColorNames.NONE;
        }

        if (status == AddonModThrdAssignGradingStates.GRADED
                || status == AddonModThrdAssignGradingStates.MARKING_WORKFLOW_STATE_RELEASED) {
            return CoreIonicColorNames.SUCCESS;
        }

        return CoreIonicColorNames.DANGER;
    }

    /**
     * Returns the translation id for a given grading status name.
     *
     * @param status Grading Status name
     * @returns The status translation identifier.
     */
    getSubmissionGradingStatusTranslationId(status?: AddonModThrdAssignGradingStates): string | undefined {
        if (!status) {
            return;
        }

        if (status == AddonModThrdAssignGradingStates.GRADED
                || status == AddonModThrdAssignGradingStates.NOT_GRADED
                || status == AddonModThrdAssignGradingStates.GRADED_FOLLOWUP_SUBMIT) {
            return 'addon.mod_assign.' + status;
        }

        return 'addon.mod_assign.markingworkflowstate' + status;
    }

    /**
     * Get the submission object from an attempt.
     *
     * @param assign Assign.
     * @param attempt Attempt.
     * @returns Submission object or null.
     */
    getSubmissionObjectFromAttempt(
        thrdassign: AddonModThrdAssignAssign,
        attempt: AddonModThrdAssignSubmissionAttempt | undefined,
    ): AddonModThrdAssignSubmission | undefined {
        if (!attempt) {
            return;
        }

        return thrdassign.teamsubmission ? attempt.teamsubmission : attempt.submission;
    }

    /**
     * Get attachments of a submission plugin.
     *
     * @param submissionPlugin Submission plugin.
     * @returns Submission plugin attachments.
     */
    getSubmissionPluginAttachments(submissionPlugin: AddonModThrdAssignPlugin): CoreWSFile[] {
        if (!submissionPlugin.fileareas) {
            return [];
        }

        const files: CoreWSFile[] = [];

        submissionPlugin.fileareas.forEach((filearea) => {
            if (!filearea || !filearea.files) {
                // No files to get.
                return;
            }

            filearea.files.forEach((file) => {
                if (!file.filename) {
                    // We don't have filename, extract it from the path.
                    file.filename = CoreFileHelper.getFilenameFromPath(file);
                }

                files.push(file);
            });
        });

        return files;
    }

    /**
     * Get text of a submission plugin.
     *
     * @param submissionPlugin Submission plugin.
     * @param keepUrls True if it should keep original URLs, false if they should be replaced.
     * @returns Submission text.
     */
    getSubmissionPluginText(submissionPlugin: AddonModThrdAssignPlugin, keepUrls = false): string {
        if (!submissionPlugin.editorfields) {
            return '';
        }
        let text = '';

        submissionPlugin.editorfields.forEach((field) => {
            text += field.text;
        });

        if (!keepUrls && submissionPlugin.fileareas && submissionPlugin.fileareas[0]) {
            text = CoreTextUtils.replacePluginfileUrls(text, submissionPlugin.fileareas[0].files || []);
        }

        return text;
    }

    /**
     * Get an thrdassignment submissions.
     *
     * @param thrdassignId Assignment id.
     * @param options Other options.
     * @returns Promise resolved when done.
     */
    async getSubmissions(
        thrdassignId: number,
        options: CoreCourseCommonModWSOptions = {},
    ): Promise<{ canviewsubmissions: boolean; submissions?: AddonModThrdAssignSubmission[] }> {
        const site = await CoreSites.getSite(options.siteId);

        const params: AddonModThrdAssignGetSubmissionsWSParams = {
            thrdassignmentids: [thrdassignId],
        };
        const preSets: CoreSiteWSPreSets = {
            cacheKey: this.getSubmissionsCacheKey(thrdassignId),
            updateFrequency: CoreSite.FREQUENCY_OFTEN,
            component: AddonModThrdAssignProvider.COMPONENT,
            componentId: options.cmId,
            ...CoreSites.getReadingStrategyPreSets(options.readingStrategy),
        };
        const response = await site.read<AddonModThrdAssignGetSubmissionsWSResponse>('mod_thrdassign_get_submissions', params, preSets);

        // Check if we can view submissions, with enough permissions.
        if (response.warnings?.length && response.warnings[0].warningcode == '1') {
            return { canviewsubmissions: false };
        }

        if (response.thrdassignments && response.thrdassignments.length) {
            return {
                canviewsubmissions: true,
                submissions: response.thrdassignments[0].submissions,
            };
        }

        throw new CoreError('Assignment submissions not found');
    }

    /**
     * Get cache key for thrdassignment submissions data WS calls.
     *
     * @param thrdassignId Assignment id.
     * @returns Cache key.
     */
    protected getSubmissionsCacheKey(thrdassignId: number): string {
        return ROOT_CACHE_KEY + 'submissions:' + thrdassignId;
    }

    /**
     * Get information about an thrdassignment submission status for a given user.
     *
     * @param thrdassignId Assignment instance id.
     * @param options Other options.
     * @returns Promise always resolved with the user submission status.
     */
    async getSubmissionStatus(
        thrdassignId: number,
        options: AddonModThrdAssignSubmissionStatusOptions = {},
    ): Promise<AddonModThrdAssignGetSubmissionStatusWSResponse> {
        const site = await CoreSites.getSite(options.siteId);

        options = {
            filter: true,
            ...options,
        };

        const fixedParams = this.fixSubmissionStatusParams(site, options.userId, options.groupId, options.isBlind);
        const params: AddonModThrdAssignGetSubmissionStatusWSParams = {
            thrdassignid: thrdassignId,
            userid: fixedParams.userId,
        };
        if (fixedParams.groupId) {
            params.groupid = fixedParams.groupId;
        }

        const preSets: CoreSiteWSPreSets = {
            cacheKey: this.getSubmissionStatusCacheKey(
                thrdassignId,
                fixedParams.userId,
                fixedParams.groupId,
                fixedParams.isBlind,
            ),
            getCacheUsingCacheKey: true,
            filter: options.filter,
            rewriteurls: options.filter,
            component: AddonModThrdAssignProvider.COMPONENT,
            componentId: options.cmId,
            // Don't cache when getting text without filters.
            // @todo Change this to support offline editing.
            saveToCache: options.filter,
            ...CoreSites.getReadingStrategyPreSets(options.readingStrategy),
        };

        return site.read<AddonModThrdAssignGetSubmissionStatusWSResponse>('mod_thrdassign_get_submission_status', params, preSets);
    }

    /**
     * Get information about an thrdassignment submission status for a given user.
     * If the data doesn't include the user submission, retry ignoring cache.
     *
     * @param thrdassign Assignment.
     * @param options Other options.
     * @returns Promise always resolved with the user submission status.
     */
    async getSubmissionStatusWithRetry(
        thrdassign: AddonModThrdAssignAssign,
        options: AddonModThrdAssignSubmissionStatusOptions = {},
    ): Promise<AddonModThrdAssignGetSubmissionStatusWSResponse> {
        options.cmId = options.cmId || thrdassign.cmid;

        const response = await this.getSubmissionStatus(thrdassign.id, options);

        const userSubmission = this.getSubmissionObjectFromAttempt(thrdassign, response.lastattempt);
        if (userSubmission) {
            return response;
        }
        // Try again, ignoring cache.
        const newOptions = {
            ...options,
            readingStrategy: CoreSitesReadingStrategy.ONLY_NETWORK,
        };

        try {
            return await this.getSubmissionStatus(thrdassign.id, newOptions);
        } catch {
            // Error, return the first result even if it doesn't have the user submission.
            return response;
        }
    }

    /**
     * Get cache key for get submission status data WS calls.
     *
     * @param thrdassignId Assignment instance id.
     * @param userId User id (empty for current user).
     * @param groupId Group Id (empty for all participants).
     * @param isBlind If blind marking is enabled or not.
     * @returns Cache key.
     */
    protected getSubmissionStatusCacheKey(thrdassignId: number, userId: number, groupId?: number, isBlind = false): string {
        return this.getSubmissionsCacheKey(thrdassignId) + ':' + userId + ':' + (isBlind ? 1 : 0) + ':' + groupId;
    }

    /**
     * Returns the color name for a given status name.
     *
     * @param status Status name
     * @returns The color name.
     */
    getSubmissionStatusColor(status: AddonModThrdAssignSubmissionStatusValues): CoreIonicColorNames {
        switch (status) {
            case AddonModThrdAssignSubmissionStatusValues.SUBMITTED:
                return CoreIonicColorNames.SUCCESS;
            case AddonModThrdAssignSubmissionStatusValues.DRAFT:
                return CoreIonicColorNames.INFO;
            case AddonModThrdAssignSubmissionStatusValues.NEW:
            case AddonModThrdAssignSubmissionStatusValues.NO_ATTEMPT:
            case AddonModThrdAssignSubmissionStatusValues.NO_ONLINE_SUBMISSIONS:
            case AddonModThrdAssignSubmissionStatusValues.NO_SUBMISSION:
            case AddonModThrdAssignSubmissionStatusValues.GRADED_FOLLOWUP_SUBMIT:
                return CoreIonicColorNames.DANGER;
            default:
                return CoreIonicColorNames.LIGHT;
        }
    }

    /**
     * Given a list of plugins, returns the plugin names that aren't supported for editing.
     *
     * @param plugins Plugins to check.
     * @returns Promise resolved with unsupported plugin names.
     */
    async getUnsupportedEditPlugins(plugins: AddonModThrdAssignPlugin[]): Promise<string[]> {
        const notSupported: string[] = [];
        const promises = plugins.map((plugin) =>
            AddonModThrdAssignSubmissionDelegate.isPluginSupportedForEdit(plugin.type).then((enabled) => {
                if (!enabled) {
                    notSupported.push(plugin.name);
                }

                return;
            }));

        await Promise.all(promises);

        return notSupported;
    }

    /**
     * List the participants for a single thrdassignment, with some summary info about their submissions.
     *
     * @param thrdassignId Assignment id.
     * @param groupId Group id. If not defined, 0.
     * @param options Other options.
     * @returns Promise resolved with the list of participants and summary of submissions.
     */
    async listParticipants(
        thrdassignId: number,
        groupId?: number,
        options: CoreCourseCommonModWSOptions = {},
    ): Promise<AddonModThrdAssignParticipant[]> {

        groupId = groupId || 0;

        const site = await CoreSites.getSite(options.siteId);

        const params: AddonModThrdAssignListParticipantsWSParams = {
            thrdassignid: thrdassignId,
            groupid: groupId,
            filter: '',
        };

        const preSets: CoreSiteWSPreSets = {
            cacheKey: this.listParticipantsCacheKey(thrdassignId, groupId),
            updateFrequency: CoreSite.FREQUENCY_OFTEN,
            component: AddonModThrdAssignProvider.COMPONENT,
            componentId: options.cmId,
            ...CoreSites.getReadingStrategyPreSets(options.readingStrategy),
        };

        return site.read<AddonModThrdAssignListParticipantsWSResponse>('mod_thrdassign_list_participants', params, preSets);
    }

    /**
     * Get cache key for thrdassignment list participants data WS calls.
     *
     * @param thrdassignId Assignment id.
     * @param groupId Group id.
     * @returns Cache key.
     */
    protected listParticipantsCacheKey(thrdassignId: number, groupId: number): string {
        return this.listParticipantsPrefixCacheKey(thrdassignId) + ':' + groupId;
    }

    /**
     * Get prefix cache key for thrdassignment list participants data WS calls.
     *
     * @param thrdassignId Assignment id.
     * @returns Cache key.
     */
    protected listParticipantsPrefixCacheKey(thrdassignId: number): string {
        return ROOT_CACHE_KEY + 'participants:' + thrdassignId;
    }

    /**
     * Invalidates all submission status data.
     *
     * @param thrdassignId Assignment instance id.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the data is invalidated.
     */
    async invalidateAllSubmissionData(thrdassignId: number, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        await site.invalidateWsCacheForKeyStartingWith(this.getSubmissionsCacheKey(thrdassignId));
    }

    /**
     * Invalidates thrdassignment data WS calls.
     *
     * @param courseId Course ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the data is invalidated.
     */
    async invalidateAssignmentData(courseId: number, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        await site.invalidateWsCacheForKey(this.getAssignmentCacheKey(courseId));
    }

    /**
     * Invalidates thrdassignment user mappings data WS calls.
     *
     * @param thrdassignId Assignment ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the data is invalidated.
     */
    async invalidateAssignmentUserMappingsData(thrdassignId: number, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        await site.invalidateWsCacheForKey(this.getAssignmentUserMappingsCacheKey(thrdassignId));
    }

    /**
     * Invalidates thrdassignment grades data WS calls.
     *
     * @param thrdassignId Assignment ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the data is invalidated.
     */
    async invalidateAssignmentGradesData(thrdassignId: number, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        await site.invalidateWsCacheForKey(this.getAssignmentGradesCacheKey(thrdassignId));
    }

    /**
     * Invalidate the prefetched content except files.
     *
     * @param moduleId The module ID.
     * @param courseId Course ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the data is invalidated.
     */
    async invalidateContent(moduleId: number, courseId: number, siteId?: string): Promise<void> {
        siteId = siteId || CoreSites.getCurrentSiteId();

        const thrdassign = await this.getAssignment(courseId, moduleId, { siteId });
        const promises: Promise<void>[] = [];
        // Do not invalidate thrdassignment data before getting thrdassignment info, we need it!
        promises.push(this.invalidateAllSubmissionData(thrdassign.id, siteId));
        promises.push(this.invalidateAssignmentUserMappingsData(thrdassign.id, siteId));
        promises.push(this.invalidateAssignmentGradesData(thrdassign.id, siteId));
        promises.push(this.invalidateListParticipantsData(thrdassign.id, siteId));
        promises.push(CoreComments.invalidateCommentsByInstance(ContextLevel.MODULE, thrdassign.id, siteId));
        promises.push(this.invalidateAssignmentData(courseId, siteId));
        promises.push(CoreGrades.invalidateAllCourseGradesData(courseId));

        await Promise.all(promises);
    }

    /**
     * Invalidates thrdassignment submissions data WS calls.
     *
     * @param thrdassignId Assignment instance id.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the data is invalidated.
     */
    async invalidateSubmissionData(thrdassignId: number, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        await site.invalidateWsCacheForKey(this.getSubmissionsCacheKey(thrdassignId));
    }

    /**
     * Invalidates submission status data.
     *
     * @param thrdassignId Assignment instance id.
     * @param userId User id (empty for current user).
     * @param groupId Group Id (empty for all participants).
     * @param isBlind Whether blind marking is enabled or not.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the data is invalidated.
     */
    async invalidateSubmissionStatusData(
        thrdassignId: number,
        userId?: number,
        groupId?: number,
        isBlind = false,
        siteId?: string,
    ): Promise<void> {
        const site = await CoreSites.getSite(siteId);
        const fixedParams = this.fixSubmissionStatusParams(site, userId, groupId, isBlind);

        await site.invalidateWsCacheForKey(this.getSubmissionStatusCacheKey(
            thrdassignId,
            fixedParams.userId,
            fixedParams.groupId,
            fixedParams.isBlind,
        ));
    }

    /**
     * Invalidates thrdassignment participants data.
     *
     * @param thrdassignId Assignment instance id.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the data is invalidated.
     */
    async invalidateListParticipantsData(thrdassignId: number, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        await site.invalidateWsCacheForKeyStartingWith(this.listParticipantsPrefixCacheKey(thrdassignId));
    }

    /**
     * Check if a submission is open. This function is based on Moodle's submissions_open.
     *
     * @param thrdassign Assignment instance.
     * @param submissionStatus Submission status returned by getSubmissionStatus.
     * @returns Whether submission is open.
     */
    isSubmissionOpen(thrdassign: AddonModThrdAssignAssign, submissionStatus?: AddonModThrdAssignGetSubmissionStatusWSResponse): boolean {
        if (!thrdassign || !submissionStatus) {
            return false;
        }

        const time = CoreTimeUtils.timestamp();
        const lastAttempt = submissionStatus.lastattempt;
        const submission = this.getSubmissionObjectFromAttempt(thrdassign, lastAttempt);

        let dateOpen = true;
        let finalDate: number | undefined;

        if (thrdassign.cutoffdate) {
            finalDate = thrdassign.cutoffdate;
        }

        if (lastAttempt && lastAttempt.locked) {
            return false;
        }

        // User extensions.
        if (finalDate) {
            if (lastAttempt && lastAttempt.extensionduedate) {
                // Extension can be before cut off date.
                if (lastAttempt.extensionduedate > finalDate) {
                    finalDate = lastAttempt.extensionduedate;
                }
            }
        }

        if (finalDate) {
            dateOpen = thrdassign.allowsubmissionsfromdate <= time && time <= finalDate;
        } else {
            dateOpen = thrdassign.allowsubmissionsfromdate <= time;
        }

        if (!dateOpen) {
            return false;
        }

        if (submission) {
            if (thrdassign.submissiondrafts && submission.status == AddonModThrdAssignSubmissionStatusValues.SUBMITTED) {
                // Drafts are tracked and the student has submitted the thrdassignment.
                return false;
            }
        }

        return true;
    }

    /**
     * Report an thrdassignment submission as being viewed.
     *
     * @param thrdassignid Assignment ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the WS call is successful.
     */
    async logSubmissionView(thrdassignid: number, siteId?: string): Promise<void> {
        const params: AddonModThrdAssignViewSubmissionStatusWSParams = {
            thrdassignid,
        };

        await CoreCourseLogHelper.log(
            'mod_thrdassign_view_submission_status',
            params,
            AddonModThrdAssignProvider.COMPONENT,
            thrdassignid,
            siteId,
        );
    }

    /**
     * Report an thrdassignment grading table is being viewed.
     *
     * @param thrdassignid Assignment ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the WS call is successful.
     */
    async logGradingView(thrdassignid: number, siteId?: string): Promise<void> {
        const params: AddonModThrdAssignViewGradingTableWSParams = {
            thrdassignid,
        };

        await CoreCourseLogHelper.log(
            'mod_thrdassign_view_grading_table',
            params,
            AddonModThrdAssignProvider.COMPONENT,
            thrdassignid,
            siteId,
        );
    }

    /**
     * Report an thrdassign as being viewed.
     *
     * @param thrdassignid Assignment ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the WS call is successful.
     */
    async logView(thrdassignid: number, siteId?: string): Promise<void> {
        const params: AddonModThrdAssignViewAssignWSParams = {
            thrdassignid,
        };

        await CoreCourseLogHelper.log(
            'mod_thrdassign_view_thrdassign',
            params,
            AddonModThrdAssignProvider.COMPONENT,
            thrdassignid,
            siteId,
        );
    }

    /**
     * Returns if a submissions needs to be graded.
     *
     * @param submission Submission.
     * @param thrdassignId Assignment ID.
     * @returns Promise resolved with boolean: whether it needs to be graded or not.
     */
    async needsSubmissionToBeGraded(submission: AddonModThrdAssignSubmissionFormatted, thrdassignId: number): Promise<boolean> {
        if (submission.status != AddonModThrdAssignSubmissionStatusValues.SUBMITTED) {
            return false;
        }

        if (!submission.gradingstatus) {
            // This should not happen, but it's better to show rather than not showing any of the submissions.
            return true;
        }

        if (submission.gradingstatus != AddonModThrdAssignGradingStates.GRADED &&
                submission.gradingstatus != AddonModThrdAssignGradingStates.MARKING_WORKFLOW_STATE_RELEASED) {
            // Not graded.
            return true;
        }

        // We need more data to decide that.
        const response = await this.getSubmissionStatus(thrdassignId, {
            userId: submission.submitid,
            isBlind: !!submission.blindid,
        });

        if (!response.feedback || !response.feedback.gradeddate) {
            // Not graded.
            return true;
        }

        return response.feedback.gradeddate < submission.timemodified;
    }

    /**
     * Save current user submission for a certain thrdassignment.
     *
     * @param thrdassignId Assign ID.
     * @param courseId Course ID the thrdassign belongs to.
     * @param pluginData Data to save.
     * @param allowOffline Whether to allow offline usage.
     * @param timemodified The time the submission was last modified in online.
     * @param allowsDrafts Whether the thrdassignment allows submission drafts.
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with true if sent to server, resolved with false if stored in offline.
     */
    async saveSubmission(
        thrdassignId: number,
        courseId: number,
        pluginData: AddonModThrdAssignSavePluginData,
        allowOffline: boolean,
        timemodified: number,
        allowsDrafts = false,
        userId?: number,
        siteId?: string,
    ): Promise<boolean> {

        siteId = siteId || CoreSites.getCurrentSiteId();

        // Function to store the submission to be synchronized later.
        const storeOffline = async (): Promise<boolean> => {
            await AddonModThrdAssignOffline.saveSubmission(
                thrdassignId,
                courseId,
                pluginData,
                timemodified,
                !allowsDrafts,
                userId,
                siteId,
            );

            return false;
        };

        if (allowOffline && !CoreNetwork.isOnline()) {
            // App is offline, store the action.
            return storeOffline();
        }

        try {
            // If there's already a submission to be sent to the server, discard it first.
            await AddonModThrdAssignOffline.deleteSubmission(thrdassignId, userId, siteId);
            await this.saveSubmissionOnline(thrdassignId, pluginData, siteId);

            return true;
        } catch (error) {
            if (allowOffline && error && !CoreUtils.isWebServiceError(error)) {
                // Couldn't connect to server, store in offline.
                return storeOffline();
            } else {
                // The WebService has thrown an error or offline not supported, reject.
                throw error;
            }
        }
    }

    /**
     * Save current user submission for a certain thrdassignment. It will fail if offline or cannot connect.
     *
     * @param thrdassignId Assign ID.
     * @param pluginData Data to save.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when saved, rejected otherwise.
     */
    async saveSubmissionOnline(thrdassignId: number, pluginData: AddonModThrdAssignSavePluginData, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);
        const params: AddonModThrdAssignSaveSubmissionWSParams = {
            thrdassignmentid: thrdassignId,
            plugindata: pluginData,
        };
        const warnings = await site.write<CoreWSExternalWarning[]>('mod_thrdassign_save_submission', params);

        if (warnings.length) {
            // The WebService returned warnings, reject.
            throw new CoreWSError(warnings[0]);
        }
    }

    /**
     * Start a submission.
     *
     * @param thrdassignId Assign ID.
     * @param siteId Site ID. If not defined, use current site.
     * @returns Promise resolved when done.
     */
    async startSubmission(thrdassignId: number, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        const params: AddonModThrdAssignStartSubmissionWSParams = {
            thrdassignid: thrdassignId,
        };

        const result = await site.write<AddonModThrdAssignStartSubmissionWSResponse>('mod_thrdassign_start_submission', params);

        if (!result.warnings?.length) {
            return;
        }

        // Ignore some warnings.
        const warning = result.warnings.find(warning =>
            warning.warningcode !== 'timelimitnotenabled' && warning.warningcode !== 'opensubmissionexists');

        if (warning) {
            throw new CoreWSError(warning);
        }
    }

    /**
     * Submit the current user thrdassignment for grading.
     *
     * @param thrdassignId Assign ID.
     * @param courseId Course ID the thrdassign belongs to.
     * @param acceptStatement True if submission statement is accepted, false otherwise.
     * @param timemodified The time the submission was last modified in online.
     * @param forceOffline True to always mark it in offline.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with true if sent to server, resolved with false if stored in offline.
     */
    async submitForGrading(
        thrdassignId: number,
        courseId: number,
        acceptStatement: boolean,
        timemodified: number,
        forceOffline = false,
        siteId?: string,
    ): Promise<boolean> {

        siteId = siteId || CoreSites.getCurrentSiteId();

        // Function to store the submission to be synchronized later.
        const storeOffline = async (): Promise<boolean> => {
            await AddonModThrdAssignOffline.markSubmitted(
                thrdassignId,
                courseId,
                true,
                acceptStatement,
                timemodified,
                undefined,
                siteId,
            );

            return false;
        };

        if (forceOffline || !CoreNetwork.isOnline()) {
            // App is offline, store the action.
            return storeOffline();
        }

        try {
            // If there's already a submission to be sent to the server, discard it first.
            await AddonModThrdAssignOffline.deleteSubmission(thrdassignId, undefined, siteId);
            await this.submitForGradingOnline(thrdassignId, acceptStatement, siteId);

            return true;
        } catch (error) {
            if (error && !CoreUtils.isWebServiceError(error)) {
                // Couldn't connect to server, store in offline.
                return storeOffline();
            } else {
                // The WebService has thrown an error, reject.
                throw error;
            }
        }
    }

    /**
     * Submit the current user thrdassignment for grading. It will fail if offline or cannot connect.
     *
     * @param thrdassignId Assign ID.
     * @param acceptStatement True if submission statement is accepted, false otherwise.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when submitted, rejected otherwise.
     */
    async submitForGradingOnline(thrdassignId: number, acceptStatement: boolean, siteId?: string): Promise<void> {
        const site = await CoreSites.getSite(siteId);

        const params: AddonModThrdAssignSubmitForGradingWSParams = {
            thrdassignmentid: thrdassignId,
            acceptsubmissionstatement: acceptStatement,
        };

        const warnings = await site.write<CoreWSExternalWarning[]>('mod_thrdassign_submit_for_grading', params);

        if (warnings.length) {
            // The WebService returned warnings, reject.
            throw new CoreWSError(warnings[0]);
        }
    }

    /**
     * Submit the grading for the current user and thrdassignment. It will use old or new WS depending on availability.
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
     * @param pluginData Feedback plugin data to save.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with true if sent to server, resolved with false if stored offline.
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
    ): Promise<boolean> {

        siteId = siteId || CoreSites.getCurrentSiteId();

        // Function to store the grading to be synchronized later.
        const storeOffline = async (): Promise<boolean> => {
            await AddonModThrdAssignOffline.submitGradingForm(
                thrdassignId,
                userId,
                courseId,
                grade,
                attemptNumber,
                addAttempt,
                workflowState,
                applyToAll,
                outcomes,
                pluginData,
                siteId,
            );

            return false;
        };

        if (!CoreNetwork.isOnline()) {
            // App is offline, store the action.
            return storeOffline();
        }

        try {
            // If there's already a grade to be sent to the server, discard it first.
            await AddonModThrdAssignOffline.deleteSubmissionGrade(thrdassignId, userId, siteId);
            await this.submitGradingFormOnline(
                thrdassignId,
                userId,
                grade,
                attemptNumber,
                addAttempt,
                workflowState,
                applyToAll,
                outcomes,
                pluginData,
                siteId,
            );

            return true;
        } catch (error) {
            if (error && !CoreUtils.isWebServiceError(error)) {
                // Couldn't connect to server, store in offline.
                return storeOffline();
            } else {
                // The WebService has thrown an error, reject.
                throw error;
            }
        }
    }

    /**
     * Submit the grading for the current user and thrdassignment. It will use old or new WS depending on availability.
     * It will fail if offline or cannot connect.
     *
     * @param thrdassignId Assign ID.
     * @param userId User ID.
     * @param grade Grade to submit.
     * @param attemptNumber Number of the attempt being graded.
     * @param addAttempt Allow the user to attempt again.
     * @param workflowState Next workflow State.
     * @param applyToAll If it's a team submission, if the grade applies to all group members.
     * @param outcomes Object including all outcomes values. If empty, any of them will be sent.
     * @param pluginData Feedback plugin data to save.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when submitted, rejected otherwise.
     */
    async submitGradingFormOnline(
        thrdassignId: number,
        userId: number,
        grade: number,
        attemptNumber: number,
        addAttempt: boolean,
        workflowState: string,
        applyToAll: boolean,
        outcomes: AddonModThrdAssignOutcomes,
        pluginData: AddonModThrdAssignSavePluginData,
        siteId?: string,
    ): Promise<void> {

        const site = await CoreSites.getSite(siteId);
        userId = userId || site.getUserId();

        const jsonData = {
            grade,
            attemptnumber: attemptNumber,
            addattempt: addAttempt ? 1 : 0,
            workflowstate: workflowState,
            applytoall: applyToAll ? 1 : 0,
        };

        for (const index in outcomes) {
            jsonData['outcome_' + index + '[' + userId + ']'] = outcomes[index];
        }

        for (const index in pluginData) {
            jsonData[index] = pluginData[index];
        }

        const serialized = CoreInterceptor.serialize(jsonData, true);
        const params: AddonModThrdAssignSubmitGradingFormWSParams = {
            thrdassignmentid: thrdassignId,
            userid: userId,
            jsonformdata: JSON.stringify(serialized),
        };

        const warnings = await site.write<CoreWSExternalWarning[]>('mod_thrdassign_submit_grading_form', params);

        if (warnings.length) {
            // The WebService returned warnings, reject.
            throw new CoreWSError(warnings[0]);
        }
    }

}
export const AddonModThrdAssign = makeSingleton(AddonModThrdAssignProvider);

/**
 * Options to pass to get submission status.
 */
export type AddonModThrdAssignSubmissionStatusOptions = CoreCourseCommonModWSOptions & {
    userId?: number; // User Id (empty for current user).
    groupId?: number; // Group Id (empty for all participants).
    isBlind?: boolean; // If blind marking is enabled or not.
    filter?: boolean; // True to filter WS response and rewrite URLs, false otherwise. Defaults to true.
};

/**
 * Assign data returned by mod_thrdassign_get_thrdassignments.
 */
export type AddonModThrdAssignAssign = {
    id: number; // Assignment id.
    cmid: number; // Course module id.
    course: number; // Course id.
    name: string; // Assignment name.
    nosubmissions: number; // No submissions.
    submissiondrafts: number; // Submissions drafts.
    sendnotifications: number; // Send notifications.
    sendlatenotifications: number; // Send notifications.
    sendstudentnotifications: number; // Send student notifications (default).
    duedate: number; // Assignment due date.
    allowsubmissionsfromdate: number; // Allow submissions from date.
    grade: number; // Grade type.
    timemodified: number; // Last time thrdassignment was modified.
    completionsubmit: number; // If enabled, set activity as complete following submission.
    cutoffdate: number; // Date after which submission is not accepted without an extension.
    gradingduedate?: number; // The expected date for marking the submissions.
    teamsubmission: number; // If enabled, students submit as a team.
    requireallteammemberssubmit: number; // If enabled, all team members must submit.
    teamsubmissiongroupingid: number; // The grouping id for the team submission groups.
    blindmarking: number; // If enabled, hide identities until reveal identities actioned.
    hidegrader?: number; // @since 3.7. If enabled, hide grader to student.
    revealidentities: number; // Show identities for a blind marking thrdassignment.
    attemptreopenmethod: AddonModThrdAssignAttemptReopenMethodValues; // Method used to control opening new attempts.
    maxattempts: number; // Maximum number of attempts allowed.
    markingworkflow: number; // Enable marking workflow.
    markingallocation: number; // Enable marking allocation.
    requiresubmissionstatement: number; // Student must accept submission statement.
    preventsubmissionnotingroup?: number; // Prevent submission not in group.
    submissionstatement?: string; // Submission statement formatted.
    submissionstatementformat?: number; // Submissionstatement format (1 = HTML, 0 = MOODLE, 2 = PLAIN or 4 = MARKDOWN).
    configs: AddonModThrdAssignConfig[]; // Configuration settings.
    intro?: string; // Assignment intro, not allways returned because it deppends on the activity configuration.
    introformat?: number; // Intro format (1 = HTML, 0 = MOODLE, 2 = PLAIN or 4 = MARKDOWN).
    introfiles?: CoreWSExternalFile[];
    introattachments?: CoreWSExternalFile[];
    activity?: string; // @since 4.0. Description of activity.
    activityformat?: number; // @since 4.0. Format of activity.
    activityattachments?: CoreWSExternalFile[]; // @since 4.0. Files from activity field.
    timelimit?: number; // @since 4.0. Time limit to complete assigment.
    submissionattachments?: number; // @since 4.0. Flag to only show files during submission.
};

/**
 * Config setting in an thrdassign.
 */
export type AddonModThrdAssignConfig = {
    id?: number; // Assign_plugin_config id.
    thrdassignment?: number; // Assignment id.
    plugin: string; // Plugin.
    subtype: string; // Subtype.
    name: string; // Name.
    value: string; // Value.
};

/**
 * Grade of an thrdassign, returned by mod_thrdassign_get_grades.
 */
export type AddonModThrdAssignGrade = {
    id: number; // Grade id.
    thrdassignment?: number; // Assignment id.
    userid: number; // Student id.
    attemptnumber: number; // Attempt number.
    timecreated: number; // Grade creation time.
    timemodified: number; // Grade last modified time.
    grader: number; // Grader, -1 if grader is hidden.
    grade: string; // Grade.
    gradefordisplay?: string; // Grade rendered into a format suitable for display.
};

/**
 * Assign submission returned by mod_thrdassign_get_submissions.
 */
export type AddonModThrdAssignSubmission = {
    id: number; // Submission id.
    userid: number; // Student id.
    attemptnumber: number; // Attempt number.
    timecreated: number; // Submission creation time.
    timemodified: number; // Submission last modified time.
    status: AddonModThrdAssignSubmissionStatusValues; // Submission status.
    groupid: number; // Group id.
    thrdassignment?: number; // Assignment id.
    latest?: number; // Latest attempt.
    plugins?: AddonModThrdAssignPlugin[]; // Plugins.
    gradingstatus?: AddonModThrdAssignGradingStates; // Grading status.
    timestarted?: number; // @since 4.0. Submission start time.
};

/**
 * Assign plugin.
 */
export type AddonModThrdAssignPlugin = {
    type: string; // Submission plugin type.
    name: string; // Submission plugin name.
    fileareas?: { // Fileareas.
        area: string; // File area.
        files?: CoreWSExternalFile[];
    }[];
    editorfields?: { // Editorfields.
        name: string; // Field name.
        description: string; // Field description.
        text: string; // Field value.
        format: number; // Text format (1 = HTML, 0 = MOODLE, 2 = PLAIN or 4 = MARKDOWN).
    }[];
};

/**
 * Grading summary of an thrdassign submission.
 */
export type AddonModThrdAssignSubmissionGradingSummary = {
    participantcount: number; // Number of users who can submit.
    submissiondraftscount: number; // Number of submissions in draft status.
    submissionsenabled: boolean; // Whether submissions are enabled or not.
    submissionssubmittedcount: number; // Number of submissions in submitted status.
    submissionsneedgradingcount: number; // Number of submissions that need grading.
    warnofungroupedusers: string | boolean; // Whether we need to warn people about groups.
};

/**
 * Attempt of an thrdassign submission.
 */
export type AddonModThrdAssignSubmissionAttempt = {
    submission?: AddonModThrdAssignSubmission; // Submission info.
    teamsubmission?: AddonModThrdAssignSubmission; // Submission info.
    submissiongroup?: number; // The submission group id (for group submissions only).
    submissiongroupmemberswhoneedtosubmit?: number[]; // List of users who still need to submit (for group submissions only).
    submissionsenabled: boolean; // Whether submissions are enabled or not.
    locked: boolean; // Whether new submissions are locked.
    graded: boolean; // Whether the submission is graded.
    canedit: boolean; // Whether the user can edit the current submission.
    caneditowner?: boolean; // Whether the owner of the submission can edit it.
    cansubmit: boolean; // Whether the user can submit.
    extensionduedate: number; // Extension due date.
    blindmarking: boolean; // Whether blind marking is enabled.
    gradingstatus: AddonModThrdAssignGradingStates; // Grading status.
    usergroups: number[]; // User groups in the course.
    timelimit?: number; // @since 4.0. Time limit for submission.
};

/**
 * Previous attempt of an thrdassign submission.
 */
export type AddonModThrdAssignSubmissionPreviousAttempt = {
    attemptnumber: number; // Attempt number.
    submission?: AddonModThrdAssignSubmission; // Submission info.
    grade?: AddonModThrdAssignGrade; // Grade information.
    feedbackplugins?: AddonModThrdAssignPlugin[]; // Feedback info.
};

/**
 * Feedback of an thrdassign submission.
 */
export type AddonModThrdAssignSubmissionFeedback = {
    grade?: AddonModThrdAssignGrade; // Grade information.
    gradefordisplay: string; // Grade rendered into a format suitable for display.
    gradeddate: number; // The date the user was graded.
    plugins?: AddonModThrdAssignPlugin[]; // Plugins info.
};

/**
 * Params of mod_thrdassign_list_participants WS.
 */
type AddonModThrdAssignListParticipantsWSParams = {
    thrdassignid: number; // Assign instance id.
    groupid: number; // Group id.
    filter: string; // Search string to filter the results.
    skip?: number; // Number of records to skip.
    limit?: number; // Maximum number of records to return.
    onlyids?: boolean; // Do not return all user fields.
    includeenrolments?: boolean; // Do return courses where the user is enrolled.
    tablesort?: boolean; // Apply current user table sorting preferences.
};

/**
 * Data returned by mod_thrdassign_list_participants WS.
 */
type AddonModThrdAssignListParticipantsWSResponse = AddonModThrdAssignParticipant[];

/**
 * Participant returned by mod_thrdassign_list_participants.
 */
export type AddonModThrdAssignParticipant = {
    id: number; // ID of the user.
    username?: string; // The username.
    firstname?: string; // The first name(s) of the user.
    lastname?: string; // The family name of the user.
    fullname: string; // The fullname of the user.
    email?: string; // Email address.
    address?: string; // Postal address.
    phone1?: string; // Phone 1.
    phone2?: string; // Phone 2.
    icq?: string; // Icq number.
    skype?: string; // Skype id.
    yahoo?: string; // Yahoo id.
    aim?: string; // Aim id.
    msn?: string; // Msn number.
    department?: string; // Department.
    institution?: string; // Institution.
    idnumber?: string; // The idnumber of the user.
    interests?: string; // User interests (separated by commas).
    firstaccess?: number; // First access to the site (0 if never).
    lastaccess?: number; // Last access to the site (0 if never).
    suspended?: boolean; // Suspend user account, either false to enable user login or true to disable it.
    description?: string; // User profile description.
    descriptionformat?: number; // Int format (1 = HTML, 0 = MOODLE, 2 = PLAIN or 4 = MARKDOWN).
    city?: string; // Home city of the user.
    url?: string; // URL of the user.
    country?: string; // Home country code of the user, such as AU or CZ.
    profileimageurlsmall?: string; // User image profile URL - small version.
    profileimageurl?: string; // User image profile URL - big version.
    customfields?: { // User custom fields (also known as user profile fields).
        type: string; // The type of the custom field - text field, checkbox...
        value: string; // The value of the custom field.
        displayvalue: string; // @since 4.2.Formatted value of the custom field.
        name: string; // The name of the custom field.
        shortname: string; // The shortname of the custom field - to be able to build the field class in the code.
    }[];
    preferences?: { // Users preferences.
        name: string; // The name of the preferences.
        value: string; // The value of the preference.
    }[];
    recordid?: number; // @since 3.7. Record id.
    groups?: { // User groups.
        id: number; // Group id.
        name: string; // Group name.
        description: string; // Group description.
    }[];
    roles?: { // User roles.
        roleid: number; // Role id.
        name: string; // Role name.
        shortname: string; // Role shortname.
        sortorder: number; // Role sortorder.
    }[];
    enrolledcourses?: { // Courses where the user is enrolled - limited by which courses the user is able to see.
        id: number; // Id of the course.
        fullname: string; // Fullname of the course.
        shortname: string; // Shortname of the course.
    }[];
    submitted: boolean; // Have they submitted their thrdassignment.
    requiregrading: boolean; // Is their submission waiting for grading.
    grantedextension?: boolean; // Have they been granted an extension.
    groupid?: number; // For group thrdassignments this is the group id.
    groupname?: string; // For group thrdassignments this is the group name.
};

/**
 * Result of WS mod_thrdassign_get_thrdassignments.
 */
export type AddonModThrdAssignGetAssignmentsWSResponse = {
    courses: { // List of courses.
        id: number; // Course id.
        fullname: string; // Course full name.
        shortname: string; // Course short name.
        timemodified: number; // Last time modified.
        thrdassignments: AddonModThrdAssignAssign[]; // Assignment info.
    }[];
    warnings?: CoreWSExternalWarning[];
};

/**
 * Params of mod_thrdassign_get_submissions WS.
 */
type AddonModThrdAssignGetSubmissionsWSParams = {
    thrdassignmentids: number[]; // 1 or more thrdassignment ids.
    status?: string; // Status.
    since?: number; // Submitted since.
    before?: number; // Submitted before.
};

/**
 * Data returned by mod_thrdassign_get_submissions WS.
 */
export type AddonModThrdAssignGetSubmissionsWSResponse = {
    thrdassignments: { // Assignment submissions.
        thrdassignmentid: number; // Assignment id.
        submissions: AddonModThrdAssignSubmission[];
    }[];
    warnings?: CoreWSExternalWarning[];
};

/**
 * Params of mod_thrdassign_get_submission_status WS.
 */
type AddonModThrdAssignGetSubmissionStatusWSParams = {
    thrdassignid: number; // Assignment instance id.
    userid?: number; // User id (empty for current user).
    groupid?: number; // Filter by users in group (used for generating the grading summary). Empty or 0 for all groups information.
};

/**
 * Result of WS mod_thrdassign_get_submission_status.
 */
export type AddonModThrdAssignGetSubmissionStatusWSResponse = {
    gradingsummary?: AddonModThrdAssignSubmissionGradingSummary; // Grading information.
    lastattempt?: AddonModThrdAssignSubmissionAttempt; // Last attempt information.
    feedback?: AddonModThrdAssignSubmissionFeedback; // Feedback for the last attempt.
    previousattempts?: AddonModThrdAssignSubmissionPreviousAttempt[]; // List all the previous attempts did by the user.
    thrdassignmentdata?: { // @since 4.0. Extra information about thrdassignment.
        attachments?: { // Intro and activity attachments.
            intro?: CoreWSExternalFile[]; // Intro attachments files.
            activity?: CoreWSExternalFile[]; // Activity attachments files.
        };
        activity?: string; // Text of activity.
        activityformat?: number; // Format of activity.
    };
    warnings?: CoreWSExternalWarning[];
};

/**
 * Params of mod_thrdassign_view_submission_status WS.
 */
type AddonModThrdAssignViewSubmissionStatusWSParams = {
    thrdassignid: number; // Assign instance id.
};

/**
 * Params of mod_thrdassign_view_grading_table WS.
 */
type AddonModThrdAssignViewGradingTableWSParams = {
    thrdassignid: number; // Assign instance id.
};

/**
 * Params of mod_thrdassign_view_thrdassign WS.
 */
type AddonModThrdAssignViewAssignWSParams = {
    thrdassignid: number; // Assign instance id.
};

type AddonModThrdAssignFixedSubmissionParams = {
    userId: number;
    groupId: number;
    isBlind: boolean;
};

/**
 * Params of mod_thrdassign_get_thrdassignments WS.
 */
type AddonModThrdAssignGetAssignmentsWSParams = {
    courseids?: number[]; // 0 or more course ids.
    capabilities?: string[]; // List of capabilities used to filter courses.
    includenotenrolledcourses?: boolean; // Whether to return courses that the user can see even if is not enroled in.
    // This requires the parameter courseids to not be empty.

};

/**
 * Params of mod_thrdassign_get_user_mappings WS.
 */
type AddonModThrdAssignGetUserMappingsWSParams = {
    thrdassignmentids: number[]; // 1 or more thrdassignment ids.
};

/**
 * Data returned by mod_thrdassign_get_user_mappings WS.
 */
export type AddonModThrdAssignGetUserMappingsWSResponse = {
    thrdassignments: { // List of thrdassign user mapping data.
        thrdassignmentid: number; // Assignment id.
        mappings: {
            id: number; // User mapping id.
            userid: number; // Student id.
        }[];
    }[];
    warnings?: CoreWSExternalWarning[];
};

/**
 * Params of mod_thrdassign_get_grades WS.
 */
type AddonModThrdAssignGetGradesWSParams = {
    thrdassignmentids: number[]; // 1 or more thrdassignment ids.
    since?: number; // Timestamp, only return records where timemodified >= since.
};

/**
 * Data returned by mod_thrdassign_get_grades WS.
 */
export type AddonModThrdAssignGetGradesWSResponse = {
    thrdassignments: { // List of thrdassignment grade information.
        thrdassignmentid: number; // Assignment id.
        grades: AddonModThrdAssignGrade[];
    }[];
    warnings?: CoreWSExternalWarning[];
};

/**
 * Params of mod_thrdassign_save_submission WS.
 */
type AddonModThrdAssignSaveSubmissionWSParams = {
    thrdassignmentid: number; // The thrdassignment id to operate on.
    plugindata: AddonModThrdAssignSavePluginData;
};

/**
 * All subplugins will decide what to add here.
 */
export type AddonModThrdAssignSavePluginData = CoreFormFields;

/**
 * Params of mod_thrdassign_submit_for_grading WS.
 */
type AddonModThrdAssignSubmitForGradingWSParams = {
    thrdassignmentid: number; // The thrdassignment id to operate on.
    acceptsubmissionstatement: boolean; // Accept the thrdassignment submission statement.
};

/**
 * Params of mod_thrdassign_submit_grading_form WS.
 */
type AddonModThrdAssignSubmitGradingFormWSParams = {
    thrdassignmentid: number; // The thrdassignment id to operate on.
    userid: number; // The user id the submission belongs to.
    jsonformdata: string; // The data from the grading form, encoded as a json array.
};

/**
 * Params of mod_thrdassign_start_submission WS.
 *
 * @since 4.0
 */
type AddonModThrdAssignStartSubmissionWSParams = {
    thrdassignid: number; // Assignment instance id.
};

/**
 * Data returned by mod_thrdassign_start_submission WS.
 *
 * @since 4.0
 */
export type AddonModThrdAssignStartSubmissionWSResponse = {
    submissionid: number; // New submission ID.
    warnings?: CoreWSExternalWarning[];
};

/**
 * Assignment grade outcomes.
 */
export type AddonModThrdAssignOutcomes = { [itemNumber: number]: number };

/**
 * Data sent by SUBMITTED_FOR_GRADING_EVENT event.
 */
export type AddonModThrdAssignSubmittedForGradingEventData = {
    thrdassignmentId: number;
    submissionId: number;
    userId: number;
};

/**
 * Data sent by SUBMISSION_SAVED_EVENT event.
 */
export type AddonModThrdAssignSubmissionSavedEventData = AddonModThrdAssignSubmittedForGradingEventData;

/**
 * Data sent by GRADED_EVENT event.
 */
export type AddonModThrdAssignGradedEventData = AddonModThrdAssignSubmittedForGradingEventData;

/**
 * Data sent by STARTED_EVENT event.
 */
export type AddonModThrdAssignStartedEventData = {
    thrdassignmentId: number;
};

/**
 * Submission status.
 * Constants on LMS starting with ASSIGN_SUBMISSION_STATUS_
 */
export enum AddonModThrdAssignSubmissionStatusValues {
    SUBMITTED = 'submitted',
    DRAFT = 'draft',
    NEW = 'new',
    REOPENED = 'reopened',
    // Added by App Statuses.
    NO_ATTEMPT = 'noattempt',
    NO_ONLINE_SUBMISSIONS = 'noonlinesubmissions',
    NO_SUBMISSION = 'nosubmission',
    GRADED_FOLLOWUP_SUBMIT = 'gradedfollowupsubmit',
}

/**
 * Grading status.
 * Constants on LMS starting with ASSIGN_GRADING_STATUS_
 */
export enum AddonModThrdAssignGradingStates {
    GRADED = 'graded',
    NOT_GRADED = 'notgraded',
    // Added by App Statuses.
    MARKING_WORKFLOW_STATE_RELEASED = 'released', // with ASSIGN_MARKING_WORKFLOW_STATE_RELEASED
    GRADED_FOLLOWUP_SUBMIT = 'gradedfollowupsubmit',
}

/**
 * Reopen attempt methods.
 * Constants on LMS starting with ASSIGN_ATTEMPT_REOPEN_METHOD_
 */
export enum AddonModThrdAssignAttemptReopenMethodValues {
    NONE = 'none',
    MANUAL = 'manual',
    UNTILPASS = 'untilpass',
}
