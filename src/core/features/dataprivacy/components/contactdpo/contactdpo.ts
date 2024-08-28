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

import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CoreDataPrivacy } from '@features/dataprivacy/services/dataprivacy';
import { CoreUser } from '@features/user/services/user';
import { CoreSites } from '@services/sites';
import { CoreDomUtils, ToastDuration } from '@services/utils/dom';
import { CoreUtils } from '@services/utils/utils';

import { ModalController } from '@singletons';

/**
 * Component that displays the contact DPO page.
 */
@Component({
    selector: 'core-data-privacy-contact-dpo',
    templateUrl: 'contactdpo.html',
})
export class CoreDataPrivacyContactDPOComponent implements OnInit {

    message = '';
    email = '';

    // Form variables.
    form: FormGroup;

    constructor(
        protected fb: FormBuilder,
    ) {
        this.form = new FormGroup({});

        // Initialize form variables.
        this.form.addControl('message', this.fb.control('', Validators.required));
    }

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        const modal = await CoreDomUtils.showModalLoading();

        // Get current user email.
        const userId = CoreSites.getCurrentSiteUserId();
        const user = await CoreUtils.ignoreErrors(CoreUser.getProfile(userId));

        this.email = user?.email || '';

        modal.dismiss();
    }

    /**
     * Sends the message.
     */
    async send(event: Event): Promise<void> {
        event.preventDefault();
        event.stopPropagation();

        const modal = await CoreDomUtils.showModalLoading();

        try {
            // Send the message.
            const succeed = await CoreDataPrivacy.contactDPO(this.message);
            if (succeed) {
                CoreDomUtils.showToast('core.dataprivacy.requestsubmitted', true, ToastDuration.LONG);
                ModalController.dismiss(true);
            }
        } catch (error) {
            CoreDomUtils.showErrorModalDefault(error, 'Error sending data privacy request');
        } finally {
            modal.dismiss();
        }
    }

    /**
     * Close modal.
     */
    close(): void {
        ModalController.dismiss();
    }

}
