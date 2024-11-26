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
    AddonModThrdAssignPlugin,
    AddonModThrdAssignAssign,
    AddonModThrdAssignSubmission,
    AddonModThrdAssign,
} from '@addons/mod/thrdassign/services/thrdassign';
import { AddonModThrdAssignFeedbackHandler } from '@addons/mod/thrdassign/services/feedback-delegate';
import { Injectable, Type } from '@angular/core';
import { CoreWSFile } from '@services/ws';
import { makeSingleton } from '@singletons';
import { AddonModThrdAssignFeedbackEditPdfComponent } from '../component/editpdf';
import type { IAddonModThrdAssignFeedbackPluginComponent } from '@addons/mod/thrdassign/classes/base-feedback-plugin-component';

/**
 * Handler for edit pdf feedback plugin.
 */
@Injectable( { providedIn: 'root' })
export class AddonModThrdAssignFeedbackEditPdfHandlerService implements AddonModThrdAssignFeedbackHandler {

    name = 'AddonModThrdAssignFeedbackEditPdfHandler';
    type = 'editpdf';

    /**
     * @inheritdoc
     */
    getComponent(): Type<IAddonModThrdAssignFeedbackPluginComponent> {
        return AddonModThrdAssignFeedbackEditPdfComponent;
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
    async isEnabled(): Promise<boolean> {
        return true;
    }

}
export const AddonModThrdAssignFeedbackEditPdfHandler = makeSingleton(AddonModThrdAssignFeedbackEditPdfHandlerService);
