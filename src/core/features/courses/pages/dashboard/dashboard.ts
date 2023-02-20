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

import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { AlertController, IonRefresher, ModalController } from '@ionic/angular';

import { CoreCourses } from '../../services/courses';
import { CoreEventObserver, CoreEvents } from '@singletons/events';
import { CoreSites, CoreSitesProvider } from '@services/sites';
import { CoreCoursesDashboard } from '@features/courses/services/dashboard';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreCourseBlock } from '@features/course/services/course';
import { CoreBlockComponent } from '@features/block/components/block/block';
import { CoreNavigator } from '@services/navigator';
import { CoreBlockDelegate } from '@features/block/services/block-delegate';
import { Translate } from '@singletons';
import { CoreConstants } from '@/core/constants';
import { CoreFilter } from '@features/filter/services/filter';
import { Device } from '@ionic-native/device/ngx';


/**
 * Page that displays the dashboard page.
 */
@Component({
    selector: 'page-core-courses-dashboard',
    templateUrl: 'dashboard.html',
})
export class CoreCoursesDashboardPage implements OnInit, OnDestroy {

    @ViewChildren(CoreBlockComponent) blocksComponents?: QueryList<CoreBlockComponent>;

    hasSideBlocks = false;
    searchEnabled = false;
    downloadCourseEnabled = false;
    downloadCoursesEnabled = false;
    userId?: number;
    blocks: Partial<CoreCourseBlock>[] = [];
    loaded = false;
    removeAccountOnLogout = false;
    siteName?: string;
    siteId?: string;

    protected updateSiteObserver: CoreEventObserver;

    constructor(private sitesProvider: CoreSitesProvider,private device: Device, public alertCtrl: AlertController) {
        // Refresh the enabled flags if site is updated.
        this.updateSiteObserver = CoreEvents.on(CoreEvents.SITE_UPDATED, () => {
            const currentSite = CoreSites.getRequiredCurrentSite();
            this.searchEnabled = !CoreCourses.isSearchCoursesDisabledInSite();
            this.downloadCourseEnabled = !CoreCourses.isDownloadCourseDisabledInSite();
            this.downloadCoursesEnabled = !CoreCourses.isDownloadCoursesDisabledInSite();
            this.removeAccountOnLogout = !!CoreConstants.CONFIG.removeaccountonlogout;
            this.siteName = currentSite.getSiteName();
            this.siteId = currentSite.getId();

        }, CoreSites.getCurrentSiteId());


    }

    /**
     * @inheritdoc
     */
    ngOnInit(): void {
        this.searchEnabled = !CoreCourses.isSearchCoursesDisabledInSite();
        this.downloadCourseEnabled = !CoreCourses.isDownloadCourseDisabledInSite();
        this.downloadCoursesEnabled = !CoreCourses.isDownloadCoursesDisabledInSite();
        this.loadContent();
        // this.checkisloginvalidandlogout();
    }

    async checkisloginvalidandlogout(): Promise<void> {
        const site = await CoreSites.getSite();

        var uuid = '';
            if (this.device.uuid) {
                uuid = this.device.uuid;
        }

        const userId = site.getUserId()

        var data: any = {
            userid: userId,
            uuid: uuid,
            loginstatus: 1,
        };

        const preSets = {
            getFromCache: false,
        };

        site.write('local_th_managelogin_checklogin_valid', data, preSets).then(async (courses) => {
            const jsonValue = JSON.stringify(courses);
            console.log(jsonValue)
            let temp = JSON.parse(jsonValue)
            if (temp.isloggedin_valid == 1) {
                    const alert = await this.alertCtrl.create({
                    header: 'Thông báo',
                    message: 'Tài khoản của bạn bị đăng xuất do được đăng nhập trên thiết bị mới!',
                    buttons: [ {
                        text: 'Đồng ý',
                        role: 'destructive',
                        handler: () => this.logout()
                        }]
                });


                await alert.present();
            }
        });
    }

    async logout () {

        if (CoreNavigator.currentRouteCanBlockLeave()) {
            await CoreDomUtils.showAlert(undefined, Translate.instant('core.cannotlogoutpageblocks'));
            return;
        }

        if (this.removeAccountOnLogout) {
            // Ask confirm.
            const siteName = this.siteName ?
                await CoreFilter.formatText(this.siteName, { clean: true, singleLine: true, filter: false }, [], this.siteId) :
                '';

            try {
                await CoreDomUtils.showDeleteConfirm('core.login.confirmdeletesite', { sitename: siteName });
            } catch (error) {
                // User cancelled, stop.
                return;
            }
        }

        await CoreSites.logout_isloggedin_valid({
            forceLogout: true,
            removeAccount: this.removeAccountOnLogout,
        });
    }

    /**
     * Convenience function to fetch the dashboard data.
     *
     * @return Promise resolved when done.
     */
    protected async loadContent(): Promise<void> {
        const available = await CoreCoursesDashboard.isAvailable();
        const disabled = await CoreCoursesDashboard.isDisabled();

        if (available && !disabled) {
            this.userId = CoreSites.getCurrentSiteUserId();

            try {
                const blocks = await CoreCoursesDashboard.getDashboardBlocks();

                this.blocks = blocks.mainBlocks;

                this.hasSideBlocks = CoreBlockDelegate.hasSupportedBlock(blocks.sideBlocks);
            } catch (error) {
                CoreDomUtils.showErrorModal(error);

                // Cannot get the blocks, just show dashboard if needed.
                this.loadFallbackBlocks();
            }
        } else if (!available) {
            // Not available, but not disabled either. Use fallback.
            this.loadFallbackBlocks();
        } else {
            // Disabled.
            this.blocks = [];
        }

        this.loaded = true;
    }

    /**
     * Load fallback blocks to shown before 3.6 when dashboard blocks are not supported.
     */
    protected loadFallbackBlocks(): void {
        this.blocks = [
            {
                name: 'myoverview',
                visible: true,
            },
            {
                name: 'timeline',
                visible: true,
            },
        ];
    }

    /**
     * Refresh the dashboard data.
     *
     * @param refresher Refresher.
     */
    refreshDashboard(refresher: IonRefresher): void {
        const promises: Promise<void>[] = [];

        promises.push(CoreCoursesDashboard.invalidateDashboardBlocks());

        // Invalidate the blocks.
        this.blocksComponents?.forEach((blockComponent) => {
            promises.push(blockComponent.invalidate().catch(() => {
                // Ignore errors.
            }));
        });

        Promise.all(promises).finally(() => {
            this.loadContent().finally(() => {
                refresher?.complete();
            });
        });
    }

    /**
     * Go to search courses.
     */
    async openSearch(): Promise<void> {
        CoreNavigator.navigateToSitePath('/courses/list', { params : { mode: 'search' } });
    }

    /**
     * Component being destroyed.
     */
    ngOnDestroy(): void {
        this.updateSiteObserver.off();
    }

}
function reject(arg0: string) {
    throw new Error('Function not implemented.');
}
