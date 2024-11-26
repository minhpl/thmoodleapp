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

import type { AddonModThrdAssignSubmissionPluginBaseComponent } from '@addons/mod/thrdassign/classes/base-submission-plugin-component';
import {
    AddonModThrdAssignAssign,
    AddonModThrdAssignSubmission,
    AddonModThrdAssignPlugin,
    AddonModThrdAssign,
} from '@addons/mod/thrdassign/services/thrdassign';
import { AddonModThrdAssignHelper } from '@addons/mod/thrdassign/services/thrdassign-helper';
import { AddonModThrdAssignOffline, AddonModThrdAssignSubmissionsDBRecordFormatted } from '@addons/mod/thrdassign/services/thrdassign-offline';
import { AddonModThrdAssignSubmissionHandler } from '@addons/mod/thrdassign/services/submission-delegate';
import { Injectable, Type } from '@angular/core';
import { CoreError } from '@classes/errors/error';
import { CoreFileHelper } from '@services/file-helper';
import { CoreTextUtils } from '@services/utils/text';
import { CoreUtils } from '@services/utils/utils';
import { CoreWSFile } from '@services/ws';
import { makeSingleton, Translate } from '@singletons';
import { AddonModThrdAssignSubmissionOnlineTextComponent } from '../component/onlinetext';

/**
 * Handler for online text submission plugin.
 */
@Injectable( { providedIn: 'root' })
export class AddonModThrdAssignSubmissionOnlineTextHandlerService implements AddonModThrdAssignSubmissionHandler {

    name = 'AddonModThrdAssignSubmissionOnlineTextHandler';
    type = 'onlinetext';

    /**
     * @inheritdoc
     */
    canEditOffline(): boolean {
        // This plugin uses Moodle filters, it cannot be edited in offline.
        return false;
    }

    /**
     * @inheritdoc
     */
    isEmpty(thrdassign: AddonModThrdAssignAssign, plugin: AddonModThrdAssignPlugin): boolean {
        const text = AddonModThrdAssign.getSubmissionPluginText(plugin, true);

        // If the text is empty, we can ignore files because they won't be visible anyways.
        return text.trim().length === 0;
    }

    /**
     * @inheritdoc
     */
    async copySubmissionData(
        thrdassign: AddonModThrdAssignAssign,
        plugin: AddonModThrdAssignPlugin,
        pluginData: AddonModThrdAssignSubmissionOnlineTextPluginData,
        userId?: number,
        siteId?: string,
    ): Promise<void> {

        const text = AddonModThrdAssign.getSubmissionPluginText(plugin, true);
        const files = AddonModThrdAssign.getSubmissionPluginAttachments(plugin);
        let itemId = 0;

        if (files.length) {
            // Re-upload the files.
            itemId = await AddonModThrdAssignHelper.uploadFiles(thrdassign.id, files, siteId);
        }

        pluginData.onlinetext_editor = {
            text: text,
            format: 1,
            itemid: itemId,
        };
    }

    /**
     * @inheritdoc
     */
    getComponent(): Type<AddonModThrdAssignSubmissionPluginBaseComponent> {
        return AddonModThrdAssignSubmissionOnlineTextComponent;
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
    async getSizeForCopy(thrdassign: AddonModThrdAssignAssign, plugin: AddonModThrdAssignPlugin): Promise<number> {
        const text = AddonModThrdAssign.getSubmissionPluginText(plugin, true);
        const files = AddonModThrdAssign.getSubmissionPluginAttachments(plugin);

        const filesSize = await CoreFileHelper.getTotalFilesSize(files);

        return text.length + filesSize;
    }

    /**
     * @inheritdoc
     */
    getSizeForEdit(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
    ): number {
        const text = AddonModThrdAssign.getSubmissionPluginText(plugin, true);

        return text.length;
    }

    /**
     * Get the text to submit.
     *
     * @param plugin The plugin object.
     * @param inputData Data entered by the user for the submission.
     * @returns Text to submit.
     */
    protected getTextToSubmit(plugin: AddonModThrdAssignPlugin, inputData: AddonModThrdAssignSubmissionOnlineTextData): string {
        const text = inputData.onlinetext_editor_text;
        const files = plugin.fileareas && plugin.fileareas[0] && plugin.fileareas[0].files || [];

        return CoreTextUtils.restorePluginfileUrls(text, files || []);
    }

    /**
     * @inheritdoc
     */
    async hasDataChanged(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: AddonModThrdAssignSubmissionOnlineTextData,
    ): Promise<boolean> {

        // Get the original text from plugin or offline.
        const offlineData =
            await CoreUtils.ignoreErrors(AddonModThrdAssignOffline.getSubmission(thrdassign.id, submission.userid));

        let initialText = '';
        if (offlineData && offlineData.plugindata && offlineData.plugindata.onlinetext_editor) {
            initialText = (<AddonModThrdAssignSubmissionOnlineTextPluginData>offlineData.plugindata).onlinetext_editor.text;
        } else {
            // No offline data found, get text from plugin.
            initialText = plugin.editorfields && plugin.editorfields[0] ? plugin.editorfields[0].text : '';
        }

        // Check if text has changed.
        return initialText != this.getTextToSubmit(plugin, inputData);
    }

    /**
     * @inheritdoc
     */
    async isEnabled(): Promise<boolean> {
        return true;
    }

    /**
     * @inheritdoc
     */
    isEnabledForEdit(): boolean {
        return true;
    }

    /**
     * @inheritdoc
     */
    prepareSubmissionData(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: AddonModThrdAssignSubmissionOnlineTextData,
        pluginData: AddonModThrdAssignSubmissionOnlineTextPluginData,
    ): void {

        let text = this.getTextToSubmit(plugin, inputData);

        // Check word limit.
        const configs = AddonModThrdAssignHelper.getPluginConfig(thrdassign, 'thrdassignsubmission', plugin.type);
        if (parseInt(configs.wordlimitenabled, 10)) {
            const words = CoreTextUtils.countWords(text);
            const wordlimit = parseInt(configs.wordlimit, 10);
            if (words > wordlimit) {
                const params = { $a: { count: words, limit: wordlimit } };
                const message = Translate.instant('addon.mod_assign_submission_onlinetext.wordlimitexceeded', params);

                throw new CoreError(message);
            }
        }

        // Add some HTML to the text if needed.
        text = CoreTextUtils.formatHtmlLines(text);

        pluginData.onlinetext_editor = {
            text: text,
            format: 1,
            itemid: 0, // Can't add new files yet, so we use a fake itemid.
        };
    }

    /**
     * @inheritdoc
     */
    prepareSyncData(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        offlineData: AddonModThrdAssignSubmissionsDBRecordFormatted,
        pluginData: AddonModThrdAssignSubmissionOnlineTextPluginData,
    ): void {

        const offlinePluginData = <AddonModThrdAssignSubmissionOnlineTextPluginData>(offlineData && offlineData.plugindata);
        const textData = offlinePluginData.onlinetext_editor;
        if (textData) {
            // Has some data to sync.
            pluginData.onlinetext_editor = textData;
        }
    }

}
export const AddonModThrdAssignSubmissionOnlineTextHandler = makeSingleton(AddonModThrdAssignSubmissionOnlineTextHandlerService);

export type AddonModThrdAssignSubmissionOnlineTextData = {
    // The text for this submission.
    onlinetext_editor_text: string; // eslint-disable-line @typescript-eslint/naming-convention
};

export type AddonModThrdAssignSubmissionOnlineTextPluginData = {
    // Editor structure.
    onlinetext_editor: { // eslint-disable-line @typescript-eslint/naming-convention
        text: string; // The text for this submission.
        format: number; // The format for this submission.
        itemid: number; // The draft area id for files attached to the submission.
    };
};
