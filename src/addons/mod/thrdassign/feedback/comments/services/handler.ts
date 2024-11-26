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

import type { IAddonModThrdAssignFeedbackPluginComponent } from '@addons/mod/thrdassign/classes/base-feedback-plugin-component';
import {
    AddonModThrdAssignPlugin,
    AddonModThrdAssignAssign,
    AddonModThrdAssignSubmission,
    AddonModThrdAssign,
    AddonModThrdAssignSavePluginData,
} from '@addons/mod/thrdassign/services/thrdassign';
import { AddonModThrdAssignOffline } from '@addons/mod/thrdassign/services/thrdassign-offline';
import { AddonModThrdAssignFeedbackHandler } from '@addons/mod/thrdassign/services/feedback-delegate';
import { Injectable, Type } from '@angular/core';
import { CoreSites } from '@services/sites';
import { CoreTextUtils } from '@services/utils/text';
import { CoreUtils } from '@services/utils/utils';
import { CoreWSFile } from '@services/ws';
import { makeSingleton } from '@singletons';
import { AddonModThrdAssignFeedbackCommentsComponent } from '../component/comments';

/**
 * Handler for comments feedback plugin.
 */
@Injectable( { providedIn: 'root' })
export class AddonModThrdAssignFeedbackCommentsHandlerService implements AddonModThrdAssignFeedbackHandler {

    name = 'AddonModThrdAssignFeedbackCommentsHandler';
    type = 'comments';

    // Store the data in this service so it isn't lost if the user performs a PTR in the page.
    protected drafts: { [draftId: string]: AddonModThrdAssignFeedbackCommentsDraftData } = {};

    /**
     * Get the text to submit.
     *
     * @param plugin Plugin.
     * @param inputData Data entered in the feedback edit form.
     * @returns Text to submit.
     */
    getTextFromInputData(plugin: AddonModThrdAssignPlugin, inputData: AddonModThrdAssignFeedbackCommentsTextData): string | undefined {
        if (inputData.thrdassignfeedbackcomments_editor === undefined) {
            return undefined;
        }

        const files = plugin.fileareas && plugin.fileareas[0] ? plugin.fileareas[0].files : [];

        return CoreTextUtils.restorePluginfileUrls(inputData.thrdassignfeedbackcomments_editor, files || []);
    }

    /**
     * @inheritdoc
     */
    discardDraft(thrdassignId: number, userId: number, siteId?: string): void {
        const id = this.getDraftId(thrdassignId, userId, siteId);
        if (this.drafts[id] !== undefined) {
            delete this.drafts[id];
        }
    }

    /**
     * @inheritdoc
     */
    getComponent(): Type<IAddonModThrdAssignFeedbackPluginComponent> {
        return AddonModThrdAssignFeedbackCommentsComponent;
    }

    /**
     * @inheritdoc
     */
    getDraft(thrdassignId: number, userId: number, siteId?: string): AddonModThrdAssignFeedbackCommentsDraftData | undefined {
        const id = this.getDraftId(thrdassignId, userId, siteId);

        if (this.drafts[id] !== undefined) {
            return this.drafts[id];
        }
    }

    /**
     * Get a draft ID.
     *
     * @param thrdassignId The thrdassignment ID.
     * @param userId User ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Draft ID.
     */
    protected getDraftId(thrdassignId: number, userId: number, siteId?: string): string {
        siteId = siteId || CoreSites.getCurrentSiteId();

        return siteId + '#' + thrdassignId + '#' + userId;
    }

    /**
     * @inheritdoc
     */
    getPluginFiles(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
    ): CoreWSFile[] {
        return AddonModThrdAssign.getSubmissionPluginAttachments(plugin);
    }

    /**
     * @inheritdoc
     */
    async hasDataChanged(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: AddonModThrdAssignFeedbackCommentsTextData,
        userId: number,
    ): Promise<boolean> {
        // Get it from plugin or offline.
        const offlineData = await CoreUtils.ignoreErrors(
            AddonModThrdAssignOffline.getSubmissionGrade(thrdassign.id, userId),
            undefined,
        );

        if (offlineData?.plugindata?.thrdassignfeedbackcomments_editor) {
            const pluginData = <AddonModThrdAssignFeedbackCommentsPluginData>offlineData.plugindata;

            return !!pluginData.thrdassignfeedbackcomments_editor.text;
        }

        // No offline data found, get text from plugin.
        const initialText = AddonModThrdAssign.getSubmissionPluginText(plugin);
        const newText = AddonModThrdAssignFeedbackCommentsHandler.getTextFromInputData(plugin, inputData);

        if (newText === undefined) {
            return false;
        }

        // Check if text has changed.
        return initialText != newText;
    }

    /**
     * @inheritdoc
     */
    hasDraftData(thrdassignId: number, userId: number, siteId?: string): boolean | Promise<boolean> {
        const draft = this.getDraft(thrdassignId, userId, siteId);

        return !!draft;
    }

    /**
     * @inheritdoc
     */
    async isEnabled(): Promise<boolean> {
        // In here we should check if comments is not disabled in site.
        // But due to this is not a common comments place and it can be disabled separately into Moodle (disabling the plugin).
        // We are leaving it always enabled. It's also a teacher's feature.
        return true;
    }

    /**
     * @inheritdoc
     */
    prepareFeedbackData(
        thrdassignId: number,
        userId: number,
        plugin: AddonModThrdAssignPlugin,
        pluginData: AddonModThrdAssignSavePluginData,
        siteId?: string,
    ): void {

        const draft = this.getDraft(thrdassignId, userId, siteId);

        if (draft) {
            // Add some HTML to the text if needed.
            draft.text = CoreTextUtils.formatHtmlLines(draft.text);

            pluginData.thrdassignfeedbackcomments_editor = draft;
        }
    }

    /**
     * @inheritdoc
     */
    saveDraft(
        thrdassignId: number,
        userId: number,
        plugin: AddonModThrdAssignPlugin,
        data: AddonModThrdAssignFeedbackCommentsDraftData,
        siteId?: string,
    ): void {

        if (data) {
            this.drafts[this.getDraftId(thrdassignId, userId, siteId)] = data;
        }
    }

}
export const AddonModThrdAssignFeedbackCommentsHandler = makeSingleton(AddonModThrdAssignFeedbackCommentsHandlerService);

export type AddonModThrdAssignFeedbackCommentsTextData = {
    // The text for this submission.
    thrdassignfeedbackcomments_editor: string; // eslint-disable-line @typescript-eslint/naming-convention
};

export type AddonModThrdAssignFeedbackCommentsDraftData = {
    text: string; // The text for this feedback.
    format: number; // The format for this feedback.
};

export type AddonModThrdAssignFeedbackCommentsPluginData = {
    // Editor structure.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    thrdassignfeedbackcomments_editor: AddonModThrdAssignFeedbackCommentsDraftData;
};
