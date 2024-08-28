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
import { CoreDataPrivacyContactDPOComponent } from '@features/dataprivacy/components/contactdpo/contactdpo';
import { CoreDataPrivacyNewRequestComponent } from '@features/dataprivacy/components/newrequest/newrequest';
import {
    CoreDataPrivacy,
    CoreDataPrivacyDataRequestType,
    CoreDataPrivacyGetAccessInformationWSResponse,
    CoreDataPrivacyRequest,
} from '@features/dataprivacy/services/dataprivacy';
import { CoreNavigator } from '@services/navigator';
import { CoreScreen } from '@services/screen';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreUtils } from '@services/utils/utils';
import { Translate } from '@singletons';
import { Subscription } from 'rxjs';

/**
 * Page to display the main data privacy page.
 */
@Component({
    selector: 'page-core-data-privacy-main',
    templateUrl: 'main.html',
    styleUrl: 'main.scss',
})
export class CoreDataPrivacyMainPage implements OnInit {

    accessInfo?: CoreDataPrivacyGetAccessInformationWSResponse;
    requests: CoreDataPrivacyRequestToDisplay[] = [];
    loaded = false;
    isTablet = false;
    layoutSubscription?: Subscription;

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        this.isTablet = CoreScreen.isTablet;

        this.layoutSubscription = CoreScreen.layoutObservable.subscribe(() => {
            this.isTablet = CoreScreen.isTablet;
        });

        await this.fetchContent();

        const createType = CoreNavigator.getRouteNumberParam('createType') as CoreDataPrivacyDataRequestType;

        switch (createType) {
            case CoreDataPrivacyDataRequestType.DATAREQUEST_TYPE_EXPORT:
                if (this.accessInfo?.cancreatedatadownloadrequest) {
                    this.newRequest(createType);
                }
                break;
            case CoreDataPrivacyDataRequestType.DATAREQUEST_TYPE_DELETE:
                if (this.accessInfo?.cancreatedatadeletionrequest) {
                    this.newRequest(createType);
                }
                break;
            case CoreDataPrivacyDataRequestType.DATAREQUEST_TYPE_OTHERS:
                if (this.accessInfo?.cancontactdpo) {
                    this.contactDPO();
                }
                break;
        }
    }

    /**
     * Fetch page content.
     */
    async fetchContent(): Promise<void> {
        try {
            this.accessInfo = await CoreDataPrivacy.getAccessInformation();

            this.requests = await CoreDataPrivacy.getDataRequests();

            this.requests.forEach((request) => {
                request.canCancel = CoreDataPrivacy.canCancelRequest(request);
            });
        } catch (error) {
            CoreDomUtils.showErrorModalDefault(error, 'Error fetching data privacy information', true);
        } finally {
            this.loaded = true;
        }
    }

    /**
     * Refresh the page content.
     *
     * @param refresher Refresher.
     */
    async refreshContent(refresher?: HTMLIonRefresherElement): Promise<void> {
        await CoreUtils.ignoreErrors(
            CoreDataPrivacy.invalidateAll(),
        );

        await CoreUtils.ignoreErrors(this.fetchContent());

        refresher?.complete();
    }

    /**
     * Open the contact DPO modal.
     */
    async contactDPO(): Promise<void> {
        // Create and show the modal.
        const succeed = await CoreDomUtils.openModal<boolean>({
            component: CoreDataPrivacyContactDPOComponent,
        });

        if (succeed) {
            const modal = await CoreDomUtils.showModalLoading();
            try {
                await this.refreshContent();
            } finally {
                modal.dismiss();
            }
       }
    }

    /**
     * Open the new request modal.
     */
    async newRequest(createType?: CoreDataPrivacyDataRequestType): Promise<void> {
        // Create and show the modal.
        const succeed = await CoreDomUtils.openModal<boolean>({
            component: CoreDataPrivacyNewRequestComponent,
            componentProps: {
                accessInfo: this.accessInfo,
                createType,
            },
        });

        if (succeed) {
            const modal = await CoreDomUtils.showModalLoading();
            try {
                await this.refreshContent();
            } finally {
                modal.dismiss();
            }
        }
    }

    /**
     * Cancel a request.
     *
     * @param requestId Request ID.
     */
    async cancelRequest(requestId: number): Promise<void> {

        try {
            await CoreDomUtils.showConfirm(
                Translate.instant('core.dataprivacy.cancelrequestconfirmation'),
                Translate.instant('core.dataprivacy.cancelrequest'),
                Translate.instant('core.dataprivacy.cancelrequest'),
            );
        } catch {
            return;
        }

        const modal = await CoreDomUtils.showModalLoading();

        try {
            await CoreDataPrivacy.cancelDataRequest(requestId);

            await this.refreshContent();
        } catch (error) {
            CoreDomUtils.showErrorModalDefault(error, 'Error cancelling data privacy request');
        } finally {
            modal.dismiss();
        }
    }

}

type CoreDataPrivacyRequestToDisplay = CoreDataPrivacyRequest & {
    canCancel?: boolean;
};
