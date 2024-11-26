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

import { Component, Input, OnInit, Type, ViewChild } from '@angular/core';
import { CoreDynamicComponent } from '@components/dynamic-component/dynamic-component';
import {
    AddonModThrdAssignAssign,
    AddonModThrdAssignSubmission,
    AddonModThrdAssignPlugin,
    AddonModThrdAssignProvider,
    AddonModThrdAssign,
} from '../../services/thrdassign';
import { AddonModThrdAssignHelper, AddonModThrdAssignPluginConfig } from '../../services/thrdassign-helper';
import { AddonModThrdAssignSubmissionDelegate } from '../../services/submission-delegate';
import { CoreFileEntry } from '@services/file-helper';
import type { AddonModThrdAssignSubmissionPluginBaseComponent } from '@addons/mod/thrdassign/classes/base-submission-plugin-component';

/**
 * Component that displays an thrdassignment submission plugin.
 */
@Component({
    selector: 'addon-mod-thrdassign-submission-plugin',
    templateUrl: 'addon-mod-thrdassign-submission-plugin.html',
})
export class AddonModThrdAssignSubmissionPluginComponent implements OnInit {

    @ViewChild(CoreDynamicComponent) dynamicComponent!: CoreDynamicComponent<AddonModThrdAssignSubmissionPluginBaseComponent>;

    @Input() thrdassign!: AddonModThrdAssignAssign; // The thrdassignment.
    @Input() submission!: AddonModThrdAssignSubmission; // The submission.
    @Input() plugin!: AddonModThrdAssignPlugin; // The plugin object.
    @Input() edit = false; // Whether the user is editing.
    @Input() allowOffline = false; // Whether to allow offline.

    pluginComponent?: Type<AddonModThrdAssignSubmissionPluginBaseComponent>; // Component to render the plugin.
    data?: AddonModThrdAssignSubmissionPluginData; // Data to pass to the component.

    // Data to render the plugin if it isn't supported.
    component = AddonModThrdAssignProvider.COMPONENT;
    text = '';
    files: CoreFileEntry[] = [];
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

        const name = AddonModThrdAssignSubmissionDelegate.getPluginName(this.plugin);

        if (!name) {
            this.pluginLoaded = true;

            return;
        }
        this.plugin.name = name;

        // Check if the plugin has defined its own component to render itself.
        this.pluginComponent = await AddonModThrdAssignSubmissionDelegate.getComponentForPlugin(this.plugin, this.edit);

        if (this.pluginComponent) {
            // Prepare the data to pass to the component.
            this.data = {
                thrdassign: this.thrdassign,
                submission: this.submission,
                plugin: this.plugin,
                configs: AddonModThrdAssignHelper.getPluginConfig(this.thrdassign, 'thrdassignsubmission', this.plugin.type),
                edit: this.edit,
                allowOffline: this.allowOffline,
            };
        } else {
            // Data to render the plugin.
            this.text = AddonModThrdAssign.getSubmissionPluginText(this.plugin);
            this.files = AddonModThrdAssign.getSubmissionPluginAttachments(this.plugin);
            this.notSupported = AddonModThrdAssignSubmissionDelegate.isPluginSupported(this.plugin.type);
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

export type AddonModThrdAssignSubmissionPluginData = {
    thrdassign: AddonModThrdAssignAssign;
    submission: AddonModThrdAssignSubmission;
    plugin: AddonModThrdAssignPlugin;
    configs: AddonModThrdAssignPluginConfig;
    edit: boolean;
    allowOffline: boolean;
};
