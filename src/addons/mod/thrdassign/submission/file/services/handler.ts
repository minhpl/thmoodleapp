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

import {
    AddonModThrdAssignAssign,
    AddonModThrdAssignSubmission,
    AddonModThrdAssignPlugin,
    AddonModThrdAssignProvider,
    AddonModThrdAssign,
} from '@addons/mod/thrdassign/services/thrdassign';
import { AddonModThrdAssignHelper } from '@addons/mod/thrdassign/services/thrdassign-helper';
import { AddonModThrdAssignOffline, AddonModThrdAssignSubmissionsDBRecordFormatted } from '@addons/mod/thrdassign/services/thrdassign-offline';
import { AddonModThrdAssignSubmissionHandler } from '@addons/mod/thrdassign/services/submission-delegate';
import { Injectable, Type } from '@angular/core';
import { CoreFileUploader, CoreFileUploaderStoreFilesResult } from '@features/fileuploader/services/fileuploader';
import { CoreFileEntry, CoreFileHelper } from '@services/file-helper';
import { CoreFileSession } from '@services/file-session';
import { CoreUtils } from '@services/utils/utils';
import { CoreWSFile } from '@services/ws';
import { makeSingleton } from '@singletons';
import { AddonModThrdAssignSubmissionFileComponent } from '../component/file';
import { FileEntry } from '@awesome-cordova-plugins/file/ngx';
import type { AddonModThrdAssignSubmissionPluginBaseComponent } from '@addons/mod/thrdassign/classes/base-submission-plugin-component';

/**
 * Handler for file submission plugin.
 */
@Injectable( { providedIn: 'root' })
export class AddonModThrdAssignSubmissionFileHandlerService implements AddonModThrdAssignSubmissionHandler {

    static readonly FOLDER_NAME = 'submission_file';

    name = 'AddonModThrdAssignSubmissionFileHandler';
    type = 'file';

    /**
     * @inheritdoc
     */
    canEditOffline(): boolean {
        // This plugin doesn't use Moodle filters, it can be edited in offline.
        return true;
    }

    /**
     * @inheritdoc
     */
    isEmpty(thrdassign: AddonModThrdAssignAssign, plugin: AddonModThrdAssignPlugin): boolean {
        const files = AddonModThrdAssign.getSubmissionPluginAttachments(plugin);

        return files.length === 0;
    }

    /**
     * @inheritdoc
     */
    clearTmpData(thrdassign: AddonModThrdAssignAssign): void {
        const files = CoreFileSession.getFiles(AddonModThrdAssignProvider.COMPONENT, thrdassign.id);

        // Clear the files in session for this thrdassign.
        CoreFileSession.clearFiles(AddonModThrdAssignProvider.COMPONENT, thrdassign.id);

        // Now delete the local files from the tmp folder.
        CoreFileUploader.clearTmpFiles(files);
    }

    /**
     * @inheritdoc
     */
    async copySubmissionData(
        thrdassign: AddonModThrdAssignAssign,
        plugin: AddonModThrdAssignPlugin,
        pluginData: AddonModThrdAssignSubmissionFilePluginData,
    ): Promise<void> {
        // We need to re-upload all the existing files.
        const files = AddonModThrdAssign.getSubmissionPluginAttachments(plugin);

        // Get the itemId.
        pluginData.files_filemanager = await AddonModThrdAssignHelper.uploadFiles(thrdassign.id, files);
    }

    /**
     * @inheritdoc
     */
    getComponent(): Type<AddonModThrdAssignSubmissionPluginBaseComponent> {
        return AddonModThrdAssignSubmissionFileComponent;
    }

    /**
     * @inheritdoc
     */
    async deleteOfflineData(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        offlineData: AddonModThrdAssignSubmissionsDBRecordFormatted,
        siteId?: string,
    ): Promise<void> {

        await CoreUtils.ignoreErrors(
            AddonModThrdAssignHelper.deleteStoredSubmissionFiles(
                thrdassign.id,
                AddonModThrdAssignSubmissionFileHandlerService.FOLDER_NAME,
                submission.userid,
                siteId,
            ),
        );
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
        const files = AddonModThrdAssign.getSubmissionPluginAttachments(plugin);

        return CoreFileHelper.getTotalFilesSize(files);
    }

    /**
     * @inheritdoc
     */
    async getSizeForEdit(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
    ): Promise<number> {
        // Check if there's any change.
        const hasChanged = await this.hasDataChanged(thrdassign, submission, plugin);
        if (hasChanged) {
            const files = CoreFileSession.getFiles(AddonModThrdAssignProvider.COMPONENT, thrdassign.id);

            return CoreFileHelper.getTotalFilesSize(files);
        } else {
            // Nothing has changed, we won't upload any file.
            return 0;
        }
    }

    /**
     * @inheritdoc
     */
    async hasDataChanged(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
    ): Promise<boolean> {
        const offlineData = await CoreUtils.ignoreErrors(
            // Check if there's any offline data.
            AddonModThrdAssignOffline.getSubmission(thrdassign.id, submission.userid),
            undefined,
        );

        let numFiles: number;
        if (offlineData && offlineData.plugindata && offlineData.plugindata.files_filemanager) {
            const offlineDataFiles = <CoreFileUploaderStoreFilesResult>offlineData.plugindata.files_filemanager;
            // Has offline data, return the number of files.
            numFiles = offlineDataFiles.offline + offlineDataFiles.online.length;
        } else {
            // No offline data, return the number of online files.
            const pluginFiles = AddonModThrdAssign.getSubmissionPluginAttachments(plugin);

            numFiles = pluginFiles && pluginFiles.length;
        }

        const currentFiles = CoreFileSession.getFiles(AddonModThrdAssignProvider.COMPONENT, thrdassign.id);

        if (currentFiles.length != numFiles) {
            // Number of files has changed.
            return true;
        }

        const files = await this.getSubmissionFilesToSync(thrdassign, submission, offlineData);

        // Check if there is any local file added and list has changed.
        return CoreFileUploader.areFileListDifferent(currentFiles, files);
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
    async prepareSubmissionData(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: AddonModThrdAssignSubmissionFileData,
        pluginData: AddonModThrdAssignSubmissionFilePluginData,
        offline = false,
        userId?: number,
        siteId?: string,
    ): Promise<void> {

        const changed = await this.hasDataChanged(thrdassign, submission, plugin);
        if (!changed) {
            return;
        }

        // Data has changed, we need to upload new files and re-upload all the existing files.
        const currentFiles = CoreFileSession.getFiles(AddonModThrdAssignProvider.COMPONENT, thrdassign.id);
        const error = CoreUtils.hasRepeatedFilenames(currentFiles);

        if (error) {
            throw error;
        }

        pluginData.files_filemanager = await AddonModThrdAssignHelper.uploadOrStoreFiles(
            thrdassign.id,
            AddonModThrdAssignSubmissionFileHandlerService.FOLDER_NAME,
            currentFiles,
            offline,
            userId,
            siteId,
        );
    }

    /**
     * @inheritdoc
     */
    async prepareSyncData(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        offlineData: AddonModThrdAssignSubmissionsDBRecordFormatted,
        pluginData: AddonModThrdAssignSubmissionFilePluginData,
        siteId?: string,
    ): Promise<void> {

        const files = await this.getSubmissionFilesToSync(thrdassign, submission, offlineData, siteId);

        if (files.length == 0) {
            return;
        }

        pluginData.files_filemanager = await AddonModThrdAssignHelper.uploadFiles(thrdassign.id, files, siteId);
    }

    /**
     * Get the file list to be synced.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param offlineData Offline data stored.
     * @param siteId Site ID. If not defined, current site.
     * @returns File entries when is all resolved.
     */
    protected async getSubmissionFilesToSync(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        offlineData?: AddonModThrdAssignSubmissionsDBRecordFormatted,
        siteId?: string,
    ): Promise<CoreFileEntry[]> {
        const filesData = <CoreFileUploaderStoreFilesResult>offlineData?.plugindata.files_filemanager;
        if (!filesData) {
            return [];
        }

        // Has some data to sync.
        let files: CoreFileEntry[] = filesData.online || [];

        if (filesData.offline) {
            // Has offline files, get them and add them to the list.
            const storedFiles = <FileEntry[]> await CoreUtils.ignoreErrors(
                AddonModThrdAssignHelper.getStoredSubmissionFiles(
                    thrdassign.id,
                    AddonModThrdAssignSubmissionFileHandlerService.FOLDER_NAME,
                    submission.userid,
                    siteId,
                ),
                [],
            );
            files = files.concat(storedFiles);
        }

        return files;
    }

}
export const AddonModThrdAssignSubmissionFileHandler = makeSingleton(AddonModThrdAssignSubmissionFileHandlerService);

// Define if ever used.
export type AddonModThrdAssignSubmissionFileData = Record<string, unknown>;

export type AddonModThrdAssignSubmissionFilePluginData = {
    // The id of a draft area containing files for this submission. Or the offline file results.
    files_filemanager: number | CoreFileUploaderStoreFilesResult; // eslint-disable-line @typescript-eslint/naming-convention
};
