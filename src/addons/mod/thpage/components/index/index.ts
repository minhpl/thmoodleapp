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

import { Component, OnDestroy, OnInit, Optional } from '@angular/core';
import { CoreCourseModuleMainResourceComponent } from '@features/course/classes/main-resource-component';
import { CoreCourseContentsPage } from '@features/course/pages/contents/contents';
import { CoreCourse } from '@features/course/services/course';
import { CoreTextUtils } from '@services/utils/text';
import { CoreUtils, OpenFileAction } from '@services/utils/utils';
import { AddonModTHPageProvider, AddonModTHPage } from '../../services/thpage';
import { AddonModTHPageHelper } from '../../services/thpage-helper';
import { CoreError } from '@classes/errors/error';
import { NgZone, Translate } from '@singletons';
import { CorePlatform } from '@services/platform';
import { CoreFileHelper } from '@services/file-helper';
import { CoreMimetypeUtils } from '@services/utils/mimetype';
import { CoreCourseModulePrefetchDelegate } from '@features/course/services/module-prefetch-delegate';
import { CoreConstants } from '@/core/constants';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreNetwork } from '@services/network';
import { CoreSites } from '@services/sites';
import { Subscription } from 'rxjs';

/**
 * Component that displays a page.
 */
@Component({
    selector: 'addon-mod-thpage-index',
    templateUrl: 'addon-mod-thpage-index.html',
})
export class AddonModTHPageIndexComponent extends CoreCourseModuleMainResourceComponent implements OnInit, OnDestroy {

    isIOS = false;
    isOnline = false;

    component = AddonModTHPageProvider.COMPONENT;
    contents?: string;
    timemodified = -1;
    warning?: string;
    openFileAction = OpenFileAction;
    readableSize = '';
    type = '';
    outdatedStatus = CoreConstants.OUTDATED;

    protected onlineObserver?: Subscription;

    protected fetchContentDefaultError = 'addon.mod_thpage.errorwhileloadingthepage';

    constructor(@Optional() courseContentsPage?: CoreCourseContentsPage) {
        super('AddonModTHPageIndexComponent', courseContentsPage);
    }

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        super.ngOnInit();

        this.isIOS = CorePlatform.isIOS();
        this.isOnline = CoreNetwork.isOnline();

        // Refresh online status when changes.
        this.onlineObserver = CoreNetwork.onChange().subscribe(() => {
            // Execute the callback in the Angular zone, so change detection doesn't stop working.
            NgZone.run(() => {
                this.isOnline = CoreNetwork.isOnline();
            });
        });

        await this.loadContent();
    }

    /**
     * Perform the invalidate content function.
     *
     * @returns Resolved when done.
     */
    protected async invalidateContent(): Promise<void> {
        await AddonModTHPage.invalidateContent(this.module.id, this.courseId);
    }

    /**
     * @inheritdoc
     */
    protected async fetchContent(refresh?: boolean): Promise<void> {
        // Get contents.
        const contents = await CoreCourse.getModuleContents(this.module, undefined, undefined, false, refresh);

        if (!contents.length) {
            throw new CoreError(Translate.instant('core.filenotfound'));
        }

        const resource = await AddonModTHPage.getTHPageData(this.courseId, this.module.id);
        this.setStatusListener();

        let mimetype: string;

        if (resource.pdffile.length > 0) {
            mimetype = resource.pdffile[0].mimetype;
            this.readableSize = CoreTextUtils.bytesToSize(resource.pdffile[0].filesize, 1);
            this.timemodified = resource.pdffile[0].timemodified * 1000;
            this.type = CoreMimetypeUtils.getMimetypeDescription(mimetype);
        } else {
            mimetype = await CoreUtils.getMimeTypeFromUrl(CoreFileHelper.getFileUrl(contents[0]));
            this.readableSize = CoreTextUtils.bytesToSize(contents[0].filesize, 1);
            this.timemodified = contents[0].timemodified * 1000;
            this.type = CoreMimetypeUtils.getMimetypeDescription(mimetype);
        }
    }

    /**
     * Opens a file.
     *
     * @param iOSOpenFileAction Action to do in iOS.
     * @returns Promise resolved when done.
     */
    async open(iOSOpenFileAction?: OpenFileAction): Promise<void> {
        let downloadable = await CoreCourseModulePrefetchDelegate.isModuleDownloadable(this.module, this.courseId);

        if (downloadable) {
            // Check if the main file is downloadle.
            // This isn't done in "isDownloadable" to prevent extra WS calls in the course page.
            downloadable = await AddonModTHPageHelper.isMainFileDownloadable(this.module);

            if (downloadable) {
                if (this.currentStatus === CoreConstants.OUTDATED && !this.isOnline) {
                    // Warn the user that the file isn't updated.
                    const alert = await CoreDomUtils.showAlert(
                        undefined,
                        Translate.instant('addon.mod_resource.resourcestatusoutdatedconfirm'),
                    );

                    await alert.onWillDismiss();
                }
                return AddonModTHPageHelper.openModuleFile(this.module, this.courseId, { iOSOpenFileAction });
            }
        }

        // The resource cannot be downloaded, open the activity in browser.
        await CoreSites.getCurrentSite()?.openInBrowserWithAutoLogin(this.module.url || '');
    }

    /**
     * @inheritdoc
     */
    protected async logActivity(): Promise<void> {
        await AddonModTHPage.logView(this.module.instance, this.module.name);
    }

    /**
     * @inheritdoc
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.onlineObserver?.unsubscribe();
    }
}
