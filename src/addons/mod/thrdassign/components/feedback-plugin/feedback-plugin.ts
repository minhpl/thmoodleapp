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
import { Component, Input, OnInit, ViewChild, Type } from '@angular/core';
import { CoreDynamicComponent } from '@components/dynamic-component/dynamic-component';
import { CoreWSFile } from '@services/ws';
import {
    AddonModThrdAssignAssign,
    AddonModThrdAssignSubmission,
    AddonModThrdAssignPlugin,
    AddonModThrdAssignProvider,
    AddonModThrdAssign,
} from '../../services/thrdassign';
import { AddonModThrdAssignHelper, AddonModThrdAssignPluginConfig } from '../../services/thrdassign-helper';
import { AddonModThrdAssignFeedbackDelegate } from '../../services/feedback-delegate';

/**
 * Component that displays an thrdassignment feedback plugin.
 */
@Component({
    selector: 'addon-mod-thrdassign-feedback-plugin',
    templateUrl: 'addon-mod-thrdassign-feedback-plugin.html',
})
export class AddonModThrdAssignFeedbackPluginComponent implements OnInit {

    @ViewChild(CoreDynamicComponent) dynamicComponent!: CoreDynamicComponent<IAddonModThrdAssignFeedbackPluginComponent>;

    @Input() thrdassign!: AddonModThrdAssignAssign; // The thrdassignment.
    @Input() submission!: AddonModThrdAssignSubmission; // The submission.
    @Input() plugin!: AddonModThrdAssignPlugin; // The plugin object.
    @Input() userId!: number; // The user ID of the submission.
    @Input() canEdit = false; // Whether the user can edit.
    @Input() edit = false; // Whether the user is editing.

    pluginComponent?: Type<IAddonModThrdAssignFeedbackPluginComponent>; // Component to render the plugin.
    data?: AddonModThrdAssignFeedbackPluginData; // Data to pass to the component.

    // Data to render the plugin if it isn't supported.
    component = AddonModThrdAssignProvider.COMPONENT;
    text = '';
    files: CoreWSFile[] = [];
    notSupported = false;
    pluginLoaded = false;

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        if (!this.plugin) {
            this.pluginLoaded = true;

            return;
        }

        const name = AddonModThrdAssignFeedbackDelegate.getPluginName(this.plugin);

        if (!name) {
            this.pluginLoaded = true;

            return;
        }
        this.plugin.name = name;

        // Check if the plugin has defined its own component to render itself.
        this.pluginComponent = await AddonModThrdAssignFeedbackDelegate.getComponentForPlugin(this.plugin);

        if (this.pluginComponent) {
            // Prepare the data to pass to the component.
            this.data = {
                thrdassign: this.thrdassign,
                submission: this.submission,
                plugin: this.plugin,
                userId: this.userId,
                configs: AddonModThrdAssignHelper.getPluginConfig(this.thrdassign, 'thrdassignfeedback', this.plugin.type),
                edit: this.edit,
                canEdit: this.canEdit,
            };
        } else {
            // Data to render the plugin.
            this.text = AddonModThrdAssign.getSubmissionPluginText(this.plugin);
            this.files = AddonModThrdAssign.getSubmissionPluginAttachments(this.plugin);
            this.notSupported = AddonModThrdAssignFeedbackDelegate.isPluginSupported(this.plugin.type);
            this.pluginLoaded = true;
        }
    }

    /**
     * Invalidate the plugin data.
     *
     * @returns Promise resolved when done.
     */
    async invalidate(): Promise<void> {
        await this.dynamicComponent.callComponentMethod('invalidate');
    }

}

export type AddonModThrdAssignFeedbackPluginData = {
    thrdassign: AddonModThrdAssignAssign;
    submission: AddonModThrdAssignSubmission;
    plugin: AddonModThrdAssignPlugin;
    configs: AddonModThrdAssignPluginConfig;
    edit: boolean;
    canEdit: boolean;
    userId: number;
};
