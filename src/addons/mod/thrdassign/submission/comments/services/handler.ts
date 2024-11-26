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
import { AddonModThrdAssignAssign, AddonModThrdAssignSubmission, AddonModThrdAssignPlugin } from '@addons/mod/thrdassign/services/thrdassign';
import { AddonModThrdAssignSubmissionHandler } from '@addons/mod/thrdassign/services/submission-delegate';
import { Injectable, Type } from '@angular/core';
import { CoreComments } from '@features/comments/services/comments';
import { makeSingleton } from '@singletons';
import { AddonModThrdAssignSubmissionCommentsComponent } from '../component/comments';
import { ContextLevel } from '@/core/constants';

/**
 * Handler for comments submission plugin.
 */
@Injectable( { providedIn: 'root' })
export class AddonModThrdAssignSubmissionCommentsHandlerService implements AddonModThrdAssignSubmissionHandler {

    name = 'AddonModThrdAssignSubmissionCommentsHandler';
    type = 'comments';

    /**
     * @inheritdoc
     */
    canEditOffline(): boolean {
        // This plugin is read only, but return true to prevent blocking the edition.
        return true;
    }

    /**
     * @inheritdoc
     */
    getComponent(plugin: AddonModThrdAssignPlugin, edit = false): Type<AddonModThrdAssignSubmissionPluginBaseComponent> | undefined {
        return edit ? undefined : AddonModThrdAssignSubmissionCommentsComponent;
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
    isEnabledForEdit(): boolean{
        return true;
    }

    /**
     * @inheritdoc
     */
    async prefetch(
        thrdassign: AddonModThrdAssignAssign,
        submission: AddonModThrdAssignSubmission,
        plugin: AddonModThrdAssignPlugin,
        siteId?: string,
    ): Promise<void> {
        await CoreComments.getComments(
            ContextLevel.MODULE,
            thrdassign.cmid,
            'thrdassignsubmission_comments',
            submission.id,
            'submission_comments',
            0,
            siteId,
        );
    }

}
export const AddonModThrdAssignSubmissionCommentsHandler = makeSingleton(AddonModThrdAssignSubmissionCommentsHandlerService);
