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
import { AddonModThrdAssignDefaultFeedbackHandler } from './handlers/default-feedback';
import { AddonModThrdAssignAssign, AddonModThrdAssignSubmission, AddonModThrdAssignPlugin, AddonModThrdAssignSavePluginData } from './thrdassign';
import { makeSingleton } from '@singletons';
import { CoreWSFile } from '@services/ws';
import { AddonModThrdAssignSubmissionFormatted } from './thrdassign-helper';
import { CoreFormFields } from '@singletons/form';
import type { IAddonModThrdAssignFeedbackPluginComponent } from '@addons/mod/thrdassign/classes/base-feedback-plugin-component';
import { CoreSites } from '@services/sites';
import { ADDON_MOD_ASSIGN_FEATURE_NAME } from '../constants';

/**
 * Interface that all feedback handlers must implement.
 */
export interface AddonModThrdAssignFeedbackHandler extends CoreDelegateHandler {

    /**
     * Name of the type of feedback the handler supports. E.g. 'file'.
     */
    type: string;

    /**
     * Discard the draft data of the feedback plugin.
     *
     * @param thrdassignId The thrdassignment ID.
     * @param userId User ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns If the function is async, it should return a Promise resolved when done.
     */
    discardDraft?(thrdassignId: number, userId: number, siteId?: string): void | Promise<void>;

    /**
     * Return the Component to use to display the plugin data.
     * It's recommended to return the class of the component, but you can also return an instance of the component.
     *
     * @param plugin The plugin object.
     * @returns The component (or promise resolved with component) to use, undefined if not found.
     */
    getComponent?(plugin: AddonModThrdAssignPlugin): Type<IAddonModThrdAssignFeedbackPluginComponent>
    | undefined
    | Promise<Type<IAddonModThrdAssignFeedbackPluginComponent> | undefined>;

    /**
     * Return the draft saved data of the feedback plugin.
     *
     * @param thrdassignId The thrdassignment ID.
     * @param userId User ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Data (or promise resolved with the data).
     */
    getDraft?(
        thrdassignId: number,
        userId: number,
        siteId?: string,
    ): CoreFormFields | Promise<CoreFormFields | undefined> | undefined;

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
     * Check if the feedback data has changed for this plugin.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param inputData Data entered by the user for the feedback.
     * @param userId User ID of the submission.
     * @returns Boolean (or promise resolved with boolean): whether the data has changed.
     */
    hasDataChanged?(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        inputData: CoreFormFields,
        userId: number,
    ): boolean | Promise<boolean>;

    /**
     * Check whether the plugin has draft data stored.
     *
     * @param thrdassignId The thrdassignment ID.
     * @param userId User ID.
     * @param siteId Site ID. If not defined, current site.
     * @returns Boolean or promise resolved with boolean: whether the plugin has draft data.
     */
    hasDraftData?(thrdassignId: number, userId: number, siteId?: string): boolean | Promise<boolean>;

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
     * Prepare and add to pluginData the data to send to the server based on the draft data saved.
     *
     * @param thrdassignId The thrdassignment ID.
     * @param userId User ID.
     * @param plugin The plugin object.
     * @param pluginData Object where to store the data to send.
     * @param siteId Site ID. If not defined, current site.
     * @returns If the function is async, it should return a Promise resolved when done.
     */
    prepareFeedbackData?(
        thrdassignId: number,
        userId: number,
        plugin: AddonModThrdAssignPlugin,
        pluginData: AddonModThrdAssignSavePluginData,
        siteId?: string,
    ): void | Promise<void>;

    /**
     * Save draft data of the feedback plugin.
     *
     * @param thrdassignId The thrdassignment ID.
     * @param userId User ID.
     * @param plugin The plugin object.
     * @param data The data to save.
     * @param siteId Site ID. If not defined, current site.
     * @returns If the function is async, it should return a Promise resolved when done.
     */
    saveDraft?(
        thrdassignId: number,
        userId: number,
        plugin: AddonModThrdAssignPlugin,
        data: CoreFormFields,
        siteId?: string,
    ): void | Promise<void>;
}

/**
 * Delegate to register plugins for thrdassign feedback.
 */
@Injectable({ providedIn: 'root' })
export class AddonModThrdAssignFeedbackDelegateService extends CoreDelegate<AddonModThrdAssignFeedbackHandler> {

    protected handlerNameProperty = 'type';

    constructor(
        protected defaultHandler: AddonModThrdAssignDefaultFeedbackHandler,
    ) {
        super('AddonModThrdAssignFeedbackDelegate');
    }

    /**
     * @inheritdoc
     */
    async isEnabled(): Promise<boolean> {
        return !(await CoreSites.isFeatureDisabled(ADDON_MOD_ASSIGN_FEATURE_NAME));
    }

    /**
     * Discard the draft data of the feedback plugin.
     *
     * @param thrdassignId The thrdassignment ID.
     * @param userId User ID.
     * @param plugin The plugin object.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when done.
     */
    async discardPluginFeedbackData(
        thrdassignId: number,
        userId: number,
        plugin: AddonModThrdAssignPlugin,
        siteId?: string,
    ): Promise<void> {
        return this.executeFunctionOnEnabled(plugin.type, 'discardDraft', [thrdassignId, userId, siteId]);
    }

    /**
     * Get the component to use for a certain feedback plugin.
     *
     * @param plugin The plugin object.
     * @returns Promise resolved with the component to use, undefined if not found.
     */
    async getComponentForPlugin(
        plugin: AddonModThrdAssignPlugin,
    ): Promise<Type<IAddonModThrdAssignFeedbackPluginComponent> | undefined> {
        return this.executeFunctionOnEnabled(plugin.type, 'getComponent', [plugin]);
    }

    /**
     * Return the draft saved data of the feedback plugin.
     *
     * @param thrdassignId The thrdassignment ID.
     * @param userId User ID.
     * @param plugin The plugin object.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with the draft data.
     */
    async getPluginDraftData<T>(
        thrdassignId: number,
        userId: number,
        plugin: AddonModThrdAssignPlugin,
        siteId?: string,
    ): Promise<T | undefined> {
        return this.executeFunctionOnEnabled(plugin.type, 'getDraft', [thrdassignId, userId, siteId]);
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
     * Get a readable name to use for a certain feedback plugin.
     *
     * @param plugin Plugin to get the name for.
     * @returns Human readable name.
     */
    getPluginName(plugin: AddonModThrdAssignPlugin): string | undefined {
        return this.executeFunctionOnEnabled(plugin.type, 'getPluginName', [plugin]);
    }

    /**
     * Check if the feedback data has changed for a certain plugin.
     *
     * @param thrdassign The thrdassignment.
     * @param submission The submission.
     * @param plugin The plugin object.
     * @param inputData Data entered by the user for the feedback.
     * @param userId User ID of the submission.
     * @returns Promise resolved with true if data has changed, resolved with false otherwise.
     */
    async hasPluginDataChanged(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission | AddonModThrdAssignSubmissionFormatted,
        plugin: AddonModThrdAssignPlugin,
        inputData: CoreFormFields,
        userId: number,
    ): Promise<boolean | undefined> {
        return this.executeFunctionOnEnabled(
            plugin.type,
            'hasDataChanged',
            [thrdassign, submission, plugin, inputData, userId],
        );
    }

    /**
     * Check whether the plugin has draft data stored.
     *
     * @param thrdassignId The thrdassignment ID.
     * @param userId User ID.
     * @param plugin The plugin object.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved with true if it has draft data.
     */
    async hasPluginDraftData(
        thrdassignId: number,
        userId: number,
        plugin: AddonModThrdAssignPlugin,
        siteId?: string,
    ): Promise<boolean | undefined> {
        return this.executeFunctionOnEnabled(plugin.type, 'hasDraftData', [thrdassignId, userId, siteId]);
    }

    /**
     * Check if a feedback plugin is supported.
     *
     * @param pluginType Type of the plugin.
     * @returns Whether it's supported.
     */
    isPluginSupported(pluginType: string): boolean {
        return this.hasHandler(pluginType, true);
    }

    /**
     * Prefetch any required data for a feedback plugin.
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
     * Prepare and add to pluginData the data to submit for a certain feedback plugin.
     *
     * @param thrdassignId The thrdassignment ID.
     * @param userId User ID.
     * @param plugin The plugin object.
     * @param pluginData Object where to store the data to send.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when data has been gathered.
     */
    async preparePluginFeedbackData(
        thrdassignId: number,
        userId: number,
        plugin: AddonModThrdAssignPlugin,
        pluginData: AddonModThrdAssignSavePluginData,
        siteId?: string,
    ): Promise<void> {

        return this.executeFunctionOnEnabled(
            plugin.type,
            'prepareFeedbackData',
            [thrdassignId, userId, plugin, pluginData, siteId],
        );
    }

    /**
     * Save draft data of the feedback plugin.
     *
     * @param thrdassignId The thrdassignment ID.
     * @param userId User ID.
     * @param plugin The plugin object.
     * @param inputData Data to save.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when data has been saved.
     */
    async saveFeedbackDraft(
        thrdassignId: number,
        userId: number,
        plugin: AddonModThrdAssignPlugin,
        inputData: CoreFormFields,
        siteId?: string,
    ): Promise<void> {
        return this.executeFunctionOnEnabled(
            plugin.type,
            'saveDraft',
            [thrdassignId, userId, plugin, inputData, siteId],
        );
    }

}
export const AddonModThrdAssignFeedbackDelegate = makeSingleton(AddonModThrdAssignFeedbackDelegateService);
