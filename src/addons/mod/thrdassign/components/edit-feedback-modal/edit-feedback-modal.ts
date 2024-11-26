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

import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CoreSites } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreFormFields, CoreForms } from '@singletons/form';
import { CoreUtils } from '@services/utils/utils';
import { ModalController, Translate } from '@singletons';
import { AddonModThrdAssignAssign, AddonModThrdAssignPlugin, AddonModThrdAssignSubmission } from '../../services/thrdassign';
import { AddonModThrdAssignFeedbackDelegate } from '../../services/feedback-delegate';

/**
 * Modal that allows editing a feedback plugin.
 */
@Component({
    selector: 'addon-mod-thrdassign-edit-feedback-modal',
    templateUrl: 'edit-feedback-modal.html',
})
export class AddonModThrdAssignEditFeedbackModalComponent {

    @Input() thrdassign!: AddonModThrdAssignAssign; // The thrdassignment.
    @Input() submission!: AddonModThrdAssignSubmission; // The submission.
    @Input() plugin!: AddonModThrdAssignPlugin; // The plugin object.
    @Input() userId!: number; // The user ID of the submission.

    @ViewChild('editFeedbackForm') formElement?: ElementRef;

    /**
     * Close modal checking if there are changes first.
     */
    async closeModal(): Promise<void> {
        const changed = await this.hasDataChanged();
        if (changed) {
            await CoreDomUtils.showConfirm(Translate.instant('core.confirmcanceledit'));
        }

        CoreForms.triggerFormCancelledEvent(this.formElement, CoreSites.getCurrentSiteId());

        ModalController.dismiss();
    }

    /**
     * Done editing.
     *
     * @param e Click event.
     */
    done(e: Event): void {
        e.preventDefault();
        e.stopPropagation();

        CoreForms.triggerFormSubmittedEvent(this.formElement, false, CoreSites.getCurrentSiteId());

        // Close the modal, sending the input data.
        ModalController.dismiss(this.getInputData());
    }

    /**
     * Get the input data.
     *
     * @returns Object with the data.
     */
    protected getInputData(): CoreFormFields {
        return CoreForms.getDataFromForm(document.forms['addon-mod_thrdassign-edit-feedback-form']);
    }

    /**
     * Check if data has changed.
     *
     * @returns Promise resolved with boolean: whether the data has changed.
     */
    protected async hasDataChanged(): Promise<boolean> {
        const changed = await CoreUtils.ignoreErrors(
            AddonModThrdAssignFeedbackDelegate.hasPluginDataChanged(
                this.thrdassign,
                this.submission,
                this.plugin,
                this.getInputData(),
                this.userId,
            ),
            true,
        );

        return !!changed;
    }

}
