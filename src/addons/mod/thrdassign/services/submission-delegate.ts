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

import { Injectable, Type } from '@angular/core';
import { CoreDelegate, CoreDelegateHandler } from '@classes/delegate';
import { AddonModThrdAssignDefaultSubmissionHandler } from './handlers/default-submission';
import { AddonModThrdAssignAssign, AddonModThrdAssignSubmission, AddonModThrdAssignPlugin, AddonModThrdAssignSavePluginData } from './thrdassign';
import { makeSingleton } from '@singletons';
import { CoreWSFile } from '@services/ws';
import { AddonModThrdAssignSubmissionsDBRecordFormatted } from './thrdassign-offline';
import { CoreFormFields } from '@singletons/form';
import type { AddonModThrdAssignSubmissionPluginBaseComponent } from '@addons/mod/thrdassign/classes/base-submission-plugin-component';
import { CoreSites } from '@services/sites';
import { ADDON_MOD_ASSIGN_FEATURE_NAME } from '../constants';

/**
 * Interface that all submission handlers must implement.
 */
export interface AddonModThrdAssignSubmissionHandler extends CoreDelegateHandler {

    /**
     * Name of the type of submission the handler supports. E.g. 'file'.
     */
    type: string;

    /**
     * Whether the plugin can be edited in offline for existing submissions. In general, this should return false if the
     * plugin uses Moodle filters. The reason is that the app only prefetches filtered data, and the user should edit
     * unfiltered data.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @returns Boolean or promise resolved with boolean: whether it can be edited in offline.
     */
    canEditOffline?(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
    ): boolean | Promise<boolean>;

    /**
     * Check if a plugin has no data.
     *
     * @param thrdassign The thrdassignment.
     * @param plugin The plugin object.
     * @returns Whether the plugin is empty.
     */
    isEmpty?(
        thrdassign: AddonModThrdAssignAssign,
        plugin: AddonModThrdAssignPlugin,
    ): boolean;

    /**
     * Should clear temporary data for a cancelled submission.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param inputData Data entered by the user for the submission.
     */
    clearTmpData?(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: CoreFormFields,
    ): void;

    /**
     * This function will be called when the user wants to create a new submission based on the previous one.
     * It should add to pluginData the data to send to server based in the data in plugin (previous attempt).
     *
     * @param thrdassign The thrdassignment.
     * @param plugin The plugin object.
     * @param pluginData Object where to store the data to send.
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns If the function is async, it should return a Promise resolved when done.
     */
    copySubmissionData?(
        thrdassign: AddonModThrdAssignAssign,
        plugin: AddonModThrdAssignPlugin,
        pluginData: AddonModThrdAssignSavePluginData,
        userId?: number,
        siteId?: string,
    ): void | Promise<void>;

    /**
     * Delete any stored data for the plugin and submission.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param offlineData Offline data stored.
     * @param siteId Site ID. If not defined, current site.
     * @returns If the function is async, it should return a Promise resolved when done.
     */
    deleteOfflineData?(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        offlineData: AddonModThrdAssignSubmissionsDBRecordFormatted,
        siteId?: string,
    ): void | Promise<void>;

    /**
     * Return the Component to use to display the plugin data, either in read or in edit mode.
     * It's recommended to return the class of the component, but you can also return an instance of the component.
     *
     * @param plugin The plugin object.
     * @param edit Whether the user is editing.
     * @returns The component (or promise resolved with component) to use, undefined if not found.
     */
    getComponent?(
        plugin: AddonModThrdAssignPlugin,
        edit?: boolean,
    ): Type<AddonModThrdAssignSubmissionPluginBaseComponent>
    | undefined
    | Promise<Type<AddonModThrdAssignSubmissionPluginBaseComponent> | undefined>;

    /**
     * Get files used by this plugin.
     * The files returned by this function will be prefetched when the user prefetches the thrdassign.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param siteId Site ID. If not defined, current site.
     * @returns The files (or promise resolved with the files).
     */
    getPluginFiles?(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        siteId?: string,
    ): CoreWSFile[] | Promise<CoreWSFile[]>;

    /**
     * Get a readable name to use for the plugin.
     *
     * @param plugin The plugin object.
     * @returns The plugin name.
     */
    getPluginName?(plugin: AddonModThrdAssignPlugin): string;

    /**
     * Get the size of data (in bytes) this plugin will send to copy a previous submission.
     *
     * @param thrdassign The thrdassignment.
     * @param plugin The plugin object.
     * @returns The size (or promise resolved with size).
     */
    getSizeForCopy?(
        thrdassign: AddonModThrdAssignAssign,
        plugin: AddonModThrdAssignPlugin,
    ): number | Promise<number>;

    /**
     * Get the size of data (in bytes) this plugin will send to add or edit a submission.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param inputData Data entered by the user for the submission.
     * @returns The size (or promise resolved with size).
     */
    getSizeForEdit?(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: CoreFormFields,
    ): number | Promise<number>;

    /**
     * Check if the submission data has changed for this plugin.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param inputData Data entered by the user for the submission.
     * @returns Boolean (or promise resolved with boolean): whether the data has changed.
     */
    hasDataChanged?(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: CoreFormFields,
    ): Promise<boolean>;

    /**
     * Whether or not the handler is enabled for edit on a site level.
     *
     * @returns Whether or not the handler is enabled for edit on a site level.
     */
    isEnabledForEdit?(): boolean | Promise<boolean>;

    /**
     * Prefetch any required data for the plugin.
     * This should NOT prefetch files. Files to be prefetched should be returned by the getPluginFiles function.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when done.
     */
    prefetch?(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        siteId?: string,
    ): Promise<void>;

    /**
     * Prepare and add to pluginData the data to send to the server based on the input data.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param inputData Data entered by the user for the submission.
     * @param pluginData Object where to store the data to send.
     * @param offline Whether the user is editing in offline.
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns If the function is async, it should return a Promise resolved when done.
     */
    prepareSubmissionData?(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: CoreFormFields,
        pluginData: AddonModThrdAssignSavePluginData,
        offline?: boolean,
        userId?: number,
        siteId?: string,
    ): void | Promise<void>;

    /**
     * Prepare and add to pluginData the data to send to the server based on the offline data stored.
     * This will be used when performing a synchronization.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param offlineData Offline data stored.
     * @param pluginData Object where to store the data to send.
     * @param siteId Site ID. If not defined, current site.
     * @returns If the function is async, it should return a Promise resolved when done.
     */
    prepareSyncData?(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        offlineData: AddonModThrdAssignSubmissionsDBRecordFormatted,
        pluginData: AddonModThrdAssignSavePluginData,
        siteId?: string,
    ): void | Promise<void>;
}

/**
 * Delegate to register plugins for thrdassign submission.
 */
@Injectable({ providedIn: 'root' })
export class AddonModThrdAssignSubmissionDelegateService extends CoreDelegate<AddonModThrdAssignSubmissionHandler> {

    protected handlerNameProperty = 'type';

    constructor(
        protected defaultHandler: AddonModThrdAssignDefaultSubmissionHandler,
    ) {
        super('AddonModThrdAssignSubmissionDelegate');
    }

    /**
     * @inheritdoc
     */
    async isEnabled(): Promise<boolean> {
        return !(await CoreSites.isFeatureDisabled(ADDON_MOD_ASSIGN_FEATURE_NAME));
    }

    /**
     * Whether the plugin can be edited in offline for existing submissions.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @returns Promise resolved with boolean: whether it can be edited in offline.
     */
    async canPluginEditOffline(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
    ): Promise<boolean | undefined> {
        return this.executeFunctionOnEnabled(plugin.type, 'canEditOffline', [thrdassign, submission, plugin]);
    }

    /**
     * Clear some temporary data for a certain plugin because a submission was cancelled.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param inputData Data entered by the user for the submission.
     */
    clearTmpData(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: CoreFormFields,
    ): void {
        this.executeFunctionOnEnabled(plugin.type, 'clearTmpData', [thrdassign, submission, plugin, inputData]);
    }

    /**
     * Copy the data from last submitted attempt to the current submission for a certain plugin.
     *
     * @param thrdassign The thrdassignment.
     * @param plugin The plugin object.
     * @param pluginData Object where to store the data to send.
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the data has been copied.
     */
    async copyPluginSubmissionData(
        thrdassign: AddonModThrdAssignAssign,
        plugin: AddonModThrdAssignPlugin,
        pluginData: AddonModThrdAssignSavePluginData,
        userId?: number,
        siteId?: string,
    ): Promise<void | undefined> {
        return this.executeFunctionOnEnabled(
            plugin.type,
            'copySubmissionData',
            [thrdassign, plugin, pluginData, userId, siteId],
        );
    }

    /**
     * Delete offline data stored for a certain submission and plugin.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param offlineData Offline data stored.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when done.
     */
    async deletePluginOfflineData(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        offlineData: AddonModThrdAssignSubmissionsDBRecordFormatted,
        siteId?: string,
    ): Promise<void> {
        return this.executeFunctionOnEnabled(
            plugin.type,
            'deleteOfflineData',
            [thrdassign, submission, plugin, offlineData, siteId],
        );
    }

    /**
     * Get the component to use for a certain submission plugin.
     *
     * @param plugin The plugin object.
     * @param edit Whether the user is editing.
     * @returns Promise resolved with the component to use, undefined if not found.
     */
    async getComponentForPlugin(
        plugin: AddonModThrdAssignPlugin,
        edit?: boolean,
    ): Promise<Type<AddonModThrdAssignSubmissionPluginBaseComponent> | undefined> {
        return this.executeFunctionOnEnabled(plugin.type, 'getComponent', [plugin, edit]);
    }

    /**
     * Get files used by this plugin.
     * The files returned by this function will be prefetched when the user prefetches the thrdassign.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with the files.
     */
    async getPluginFiles(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        siteId?: string,
    ): Promise<CoreWSFile[]> {
        const files: CoreWSFile[] | undefined =
            await this.executeFunctionOnEnabled(plugin.type, 'getPluginFiles', [thrdassign, submission, plugin, siteId]);

        return files || [];
    }

    /**
     * Get a readable name to use for a certain submission plugin.
     *
     * @param plugin Plugin to get the name for.
     * @returns Human readable name.
     */
    getPluginName(plugin: AddonModThrdAssignPlugin): string | undefined {
        return this.executeFunctionOnEnabled(plugin.type, 'getPluginName', [plugin]);
    }

    /**
     * Get the size of data (in bytes) this plugin will send to copy a previous submission.
     *
     * @param thrdassign The thrdassignment.
     * @param plugin The plugin object.
     * @returns Promise resolved with size.
     */
    async getPluginSizeForCopy(thrdassign: AddonModThrdAssignAssign, plugin: AddonModThrdAssignPlugin): Promise<number | undefined> {
        return this.executeFunctionOnEnabled(plugin.type, 'getSizeForCopy', [thrdassign, plugin]);
    }

    /**
     * Get the size of data (in bytes) this plugin will send to add or edit a submission.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param inputData Data entered by the user for the submission.
     * @returns Promise resolved with size.
     */
    async getPluginSizeForEdit(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: CoreFormFields,
    ): Promise<number | undefined> {
        return this.executeFunctionOnEnabled(
            plugin.type,
            'getSizeForEdit',
            [thrdassign, submission, plugin, inputData],
        );
    }

    /**
     * Check if the submission data has changed for a certain plugin.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param inputData Data entered by the user for the submission.
     * @returns Promise resolved with true if data has changed, resolved with false otherwise.
     */
    async hasPluginDataChanged(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: CoreFormFields,
    ): Promise<boolean | undefined> {
        return this.executeFunctionOnEnabled(
            plugin.type,
            'hasDataChanged',
            [thrdassign, submission, plugin, inputData],
        );
    }

    /**
     * Check if a submission plugin is supported.
     *
     * @param pluginType Type of the plugin.
     * @returns Whether it's supported.
     */
    isPluginSupported(pluginType: string): boolean {
        return this.hasHandler(pluginType, true);
    }

    /**
     * Check if a submission plugin is supported for edit.
     *
     * @param pluginType Type of the plugin.
     * @returns Whether it's supported for edit.
     */
    async isPluginSupportedForEdit(pluginType: string): Promise<boolean | undefined> {
        return this.executeFunctionOnEnabled(pluginType, 'isEnabledForEdit');
    }

    /**
     * Check if a plugin has no data.
     *
     * @param thrdassign The thrdassignment.
     * @param plugin The plugin object.
     * @returns Whether the plugin is empty.
     */
    isPluginEmpty(thrdassign: AddonModThrdAssignAssign, plugin: AddonModThrdAssignPlugin): boolean | undefined {
        return this.executeFunctionOnEnabled(plugin.type, 'isEmpty', [thrdassign, plugin]);
    }

    /**
     * Prefetch any required data for a submission plugin.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when done.
     */
    async prefetch(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        siteId?: string,
    ): Promise<void> {
        return this.executeFunctionOnEnabled(plugin.type, 'prefetch', [thrdassign, submission, plugin, siteId]);
    }

    /**
     * Prepare and add to pluginData the data to submit for a certain submission plugin.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param inputData Data entered by the user for the submission.
     * @param pluginData Object where to store the data to send.
     * @param offline Whether the user is editing in offline.
     * @param userId User ID. If not defined, site's current user.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when data has been gathered.
     */
    async preparePluginSubmissionData(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: CoreFormFields,
        pluginData: AddonModThrdAssignSavePluginData,
        offline?: boolean,
        userId?: number,
        siteId?: string,
    ): Promise<void | undefined> {

        return this.executeFunctionOnEnabled(
            plugin.type,
            'prepareSubmissionData',
            [thrdassign, submission, plugin, inputData, pluginData, offline, userId, siteId],
        );
    }

    /**
     * Prepare and add to pluginData the data to send to server to synchronize an offline submission.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param offlineData Offline data stored.
     * @param pluginData Object where to store the data to send.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when data has been gathered.
     */
    async preparePluginSyncData(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        offlineData: AddonModThrdAssignSubmissionsDBRecordFormatted,
        pluginData: AddonModThrdAssignSavePluginData,
        siteId?: string,
    ): Promise<void> {

        return this.executeFunctionOnEnabled(
            plugin.type,
            'prepareSyncData',
            [thrdassign, submission, plugin, offlineData, pluginData, siteId],
        );
    }

}
export const AddonModThrdAssignSubmissionDelegate = makeSingleton(AddonModThrdAssignSubmissionDelegateService);
