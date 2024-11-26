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

import { Component, Optional, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Params } from '@angular/router';
import { CoreError } from '@classes/errors/error';
import { CoreSite } from '@classes/sites/site';
import { CoreCourseModuleMainActivityComponent } from '@features/course/classes/main-activity-component';
import { CoreCourseContentsPage } from '@features/course/pages/contents/contents';
import { IonContent } from '@ionic/angular';
import { CoreGroupInfo, CoreGroups } from '@services/groups';
import { CoreNavigator } from '@services/navigator';
import { CoreSites } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreTimeUtils } from '@services/utils/time';
import { CoreUtils } from '@services/utils/utils';
import { Translate } from '@singletons';
import { CoreEventObserver, CoreEvents } from '@singletons/events';
import { CoreTime } from '@singletons/time';
import { AddonModThrdAssignListFilterName } from '../../classes/submissions-source';
import {
    AddonModThrdAssign,
    AddonModThrdAssignAssign,
    AddonModThrdAssignProvider,
    AddonModThrdAssignSubmissionGradingSummary,
} from '../../services/thrdassign';
import { AddonModThrdAssignOffline } from '../../services/thrdassign-offline';
import {
    AddonModThrdAssignAutoSyncData,
    AddonModThrdAssignSync,
    AddonModThrdAssignSyncProvider,
    AddonModThrdAssignSyncResult,
} from '../../services/thrdassign-sync';
import { AddonModThrdAssignModuleHandlerService } from '../../services/handlers/module';
import { AddonModThrdAssignSubmissionComponent } from '../submission/submission';

/**
 * Component that displays an thrdassignment.
 */
@Component({
    selector: 'addon-mod-thrdassign-index',
    templateUrl: 'addon-mod-thrdassign-index.html',
})
export class AddonModThrdAssignIndexComponent extends CoreCourseModuleMainActivityComponent implements OnInit, OnDestroy {

    @ViewChild(AddonModThrdAssignSubmissionComponent) submissionComponent?: AddonModThrdAssignSubmissionComponent;

    component = AddonModThrdAssignProvider.COMPONENT;
    pluginName = 'thrdassign';

    thrdassign?: AddonModThrdAssignAssign; // The thrdassign object.
    canViewAllSubmissions = false; // Whether the user can view all submissions.
    canViewOwnSubmission = false; // Whether the user can view their own submission.
    timeRemaining?: string; // Message about time remaining to submit.
    lateSubmissions?: string; // Message about late submissions.
    summary?: AddonModThrdAssignSubmissionGradingSummary; // The grading summary.
    needsGradingAvailable = false; // Whether we can see the submissions that need grading.

    groupInfo: CoreGroupInfo = {
        groups: [],
        separateGroups: false,
        visibleGroups: false,
        defaultGroupId: 0,
        canAccessAllGroups: false,
    };

    // Status.
    submissionStatusSubmitted = AddonModThrdAssignListFilterName.SUBMITTED;
    submissionStatusDraft = AddonModThrdAssignListFilterName.DRAFT;
    needGrading = AddonModThrdAssignListFilterName.NEED_GRADING;

    protected currentUserId!: number; // Current user ID.
    protected currentSite!: CoreSite; // Current site.
    protected syncEventName = AddonModThrdAssignSyncProvider.AUTO_SYNCED;

    // Observers.
    protected savedObserver?: CoreEventObserver;
    protected submittedObserver?: CoreEventObserver;
    protected gradedObserver?: CoreEventObserver;
    protected startedObserver?: CoreEventObserver;

    constructor(
        protected content?: IonContent,
        @Optional() courseContentsPage?: CoreCourseContentsPage,
    ) {
        super('AddonModLessonIndexComponent', content, courseContentsPage);

        this.currentSite = CoreSites.getRequiredCurrentSite();
        this.currentUserId = this.currentSite.getUserId();
    }

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        super.ngOnInit();

        // Listen to events.
        this.savedObserver = CoreEvents.on(
            AddonModThrdAssignProvider.SUBMISSION_SAVED_EVENT,
            (data) => {
                if (this.thrdassign && data.thrdassignmentId == this.thrdassign.id && data.userId == this.currentUserId) {
                    // Assignment submission saved, refresh data.
                    this.showLoadingAndRefresh(true, false);
                }
            },
            this.siteId,
        );

        this.submittedObserver = CoreEvents.on(
            AddonModThrdAssignProvider.SUBMITTED_FOR_GRADING_EVENT,
            (data) => {
                if (this.thrdassign && data.thrdassignmentId == this.thrdassign.id && data.userId == this.currentUserId) {
                    // Assignment submitted, check completion.
                    this.checkCompletion();

                    // Reload data since it can have offline data now.
                    this.showLoadingAndRefresh(true, false);
                }
            },
            this.siteId,
        );

        this.gradedObserver = CoreEvents.on(AddonModThrdAssignProvider.GRADED_EVENT, (data) => {
            if (this.thrdassign && data.thrdassignmentId == this.thrdassign.id && data.userId == this.currentUserId) {
                // Assignment graded, refresh data.
                this.showLoadingAndRefresh(true, false);
            }
        }, this.siteId);

        this.startedObserver = CoreEvents.on(AddonModThrdAssignProvider.STARTED_EVENT, (data) => {
            if (this.thrdassign && data.thrdassignmentId == this.thrdassign.id) {
                // Assignment submission started, refresh data.
                this.showLoadingAndRefresh(false, false);
            }
        }, this.siteId);

        await this.loadContent(false, true);
    }

    /**
     * @inheritdoc
     */
    protected async fetchContent(refresh?: boolean, sync = false, showErrors = false): Promise<void> {

        // Get thrdassignment data.
        this.thrdassign = await AddonModThrdAssign.getAssignment(this.courseId, this.module.id);
        this.dataRetrieved.emit(this.thrdassign);
        this.description = this.thrdassign.intro;

        if (sync) {
            // Try to synchronize the thrdassign.
            await CoreUtils.ignoreErrors(this.syncActivity(showErrors));
        }

        // Check if there's any offline data for this thrdassign.
        this.hasOffline = await AddonModThrdAssignOffline.hasAssignOfflineData(this.thrdassign.id);

        // Get thrdassignment submissions.
        const submissions = await AddonModThrdAssign.getSubmissions(this.thrdassign.id, { cmId: this.module.id });
        const time = CoreTimeUtils.timestamp();

        this.canViewAllSubmissions = submissions.canviewsubmissions;

        if (submissions.canviewsubmissions) {

            // Calculate the messages to display about time remaining and late submissions.
            this.timeRemaining = '';
            this.lateSubmissions = '';

            if (this.thrdassign.duedate > 0) {
                if (this.thrdassign.duedate - time <= 0) {
                    this.timeRemaining = Translate.instant('addon.mod_assign.assignmentisdue');
                } else {
                    this.timeRemaining = CoreTime.formatTime(this.thrdassign.duedate - time);
                }

                if (this.thrdassign.duedate < time) {
                    if (this.thrdassign.cutoffdate) {
                        if (this.thrdassign.cutoffdate > time) {
                            this.lateSubmissions = Translate.instant(
                                'addon.mod_assign.latesubmissionsaccepted',
                                { $a: CoreTimeUtils.userDate(this.thrdassign.cutoffdate * 1000) },
                            );
                        } else {
                            this.lateSubmissions = Translate.instant('addon.mod_assign.nomoresubmissionsaccepted');
                        }
                    }
                }
            }

            // Check if groupmode is enabled to avoid showing wrong numbers.
            this.groupInfo = await CoreGroups.getActivityGroupInfo(this.thrdassign.cmid, false);

            await this.setGroup(CoreGroups.validateGroupId(this.group, this.groupInfo));

            return;
        }

        try {
            // Check if the user can view their own submission.
            await AddonModThrdAssign.getSubmissionStatus(this.thrdassign.id, { cmId: this.module.id });
            this.canViewOwnSubmission = true;
        } catch (error) {
            this.canViewOwnSubmission = false;

            if (error.errorcode !== 'nopermission') {
                throw error;
            }
        }
    }

    /**
     * @inheritdoc
     */
    protected async logActivity(): Promise<void> {
        if (!this.thrdassign) {
            return; // Shouldn't happen.
        }

        await CoreUtils.ignoreErrors(AddonModThrdAssign.logView(this.thrdassign.id));

        this.analyticsLogEvent('mod_thrdassign_view_thrdassign');

        if (this.canViewAllSubmissions) {
            // User can see all submissions, log grading view.
            await CoreUtils.ignoreErrors(AddonModThrdAssign.logGradingView(this.thrdassign.id));

            this.analyticsLogEvent('mod_thrdassign_view_grading_table', { sendUrl: false });
        } else if (this.canViewOwnSubmission) {
            // User can only see their own submission, log view the user submission.
            await CoreUtils.ignoreErrors(AddonModThrdAssign.logSubmissionView(this.thrdassign.id));

            this.analyticsLogEvent('mod_thrdassign_view_submission_status', { sendUrl: false });
        }
    }

    /**
     * Set group to see the summary.
     *
     * @param groupId Group ID.
     * @returns Resolved when done.
     */
    async setGroup(groupId = 0): Promise<void> {
        this.group = groupId;

        if (!this.thrdassign) {
            return;
        }

        const submissionStatus = await AddonModThrdAssign.getSubmissionStatus(this.thrdassign.id, {
            groupId: this.group,
            cmId: this.module.id,
        });

        this.summary = submissionStatus.gradingsummary;
        if (!this.summary) {
            this.needsGradingAvailable = false;

            return;
        }

        if (this.summary.warnofungroupedusers === true) {
            this.summary.warnofungroupedusers = 'ungroupedusers';
        } else {
            switch (this.summary.warnofungroupedusers) {
                case AddonModThrdAssignProvider.WARN_GROUPS_REQUIRED:
                    this.summary.warnofungroupedusers = 'ungroupedusers';
                    break;
                case AddonModThrdAssignProvider.WARN_GROUPS_OPTIONAL:
                    this.summary.warnofungroupedusers = 'ungroupedusersoptional';
                    break;
                default:
                    this.summary.warnofungroupedusers = '';
                    break;
            }
        }

        this.needsGradingAvailable = this.summary.submissionsneedgradingcount > 0;
    }

    /**
     * Go to view a list of submissions.
     *
     * @param status Status to see.
     * @param hasSubmissions If the status has any submission.
     */
    goToSubmissionList(status?: AddonModThrdAssignListFilterName, hasSubmissions = false): void {
        if (status !== undefined && !hasSubmissions) {
            return;
        }

        const params: Params = {
            groupId: this.group || 0,
            moduleName: this.moduleName,
        };
        if (status !== undefined) {
            params.status = status;
        }

        CoreNavigator.navigateToSitePath(
            AddonModThrdAssignModuleHandlerService.PAGE_NAME + `/${this.courseId}/${this.module.id}/submission`,
            {
                params,
            },
        );
    }

    /**
     * @inheritdoc
     */
    protected hasSyncSucceed(result: AddonModThrdAssignSyncResult): boolean {
        if (result.updated) {
            this.submissionComponent?.invalidateAndRefresh(false);
        }

        return result.updated;
    }

    /**
     * @inheritdoc
     */
    protected async invalidateContent(): Promise<void> {
        const promises: Promise<void>[] = [];

        promises.push(AddonModThrdAssign.invalidateAssignmentData(this.courseId));
        // Invalidate before component becomes null.
        promises.push(this.submissionComponent?.invalidateAndRefresh(true) || Promise.resolve());

        if (this.thrdassign) {
            promises.push(AddonModThrdAssign.invalidateAllSubmissionData(this.thrdassign.id));

            if (this.canViewAllSubmissions) {
                promises.push(AddonModThrdAssign.invalidateSubmissionStatusData(this.thrdassign.id, undefined, this.group));
            }
        }

        await Promise.all(promises);
    }

    /**
     * User entered the page that contains the component.
     */
    ionViewDidEnter(): void {
        super.ionViewDidEnter();

        this.submissionComponent?.ionViewDidEnter();
    }

    /**
     * User left the page that contains the component.
     */
    ionViewDidLeave(): void {
        super.ionViewDidLeave();

        this.submissionComponent?.ionViewDidLeave();
    }

    /**
     * @inheritdoc
     */
    protected isRefreshSyncNeeded(syncEventData: AddonModThrdAssignAutoSyncData): boolean {
        if (!this.thrdassign || syncEventData.thrdassignId != this.thrdassign.id) {
            return false;
        }

        if (syncEventData.warnings && syncEventData.warnings.length) {
            // Show warnings.
            CoreDomUtils.showAlert(undefined, syncEventData.warnings[0]);
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    protected async sync(): Promise<AddonModThrdAssignSyncResult> {
        if (!this.thrdassign) {
            throw new CoreError('Cannot sync without a thrdassign.');
        }

        return AddonModThrdAssignSync.syncAssign(this.thrdassign.id);
    }

    /**
     * @inheritdoc
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();

        this.savedObserver?.off();
        this.submittedObserver?.off();
        this.gradedObserver?.off();
        this.startedObserver?.off();
    }

}
