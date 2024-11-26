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

import { AddonModThrdAssign, AddonModThrdAssignProvider } from '@addons/mod/thrdassign/services/thrdassign';
import { AddonModThrdAssignHelper } from '@addons/mod/thrdassign/services/thrdassign-helper';
import { AddonModThrdAssignOffline } from '@addons/mod/thrdassign/services/thrdassign-offline';
import { Component, OnInit } from '@angular/core';
import { CoreFileUploaderStoreFilesResult } from '@features/fileuploader/services/fileuploader';
import { CoreFileSession } from '@services/file-session';
import { CoreUtils } from '@services/utils/utils';
import { AddonModThrdAssignSubmissionFileHandlerService } from '../services/handler';
import { FileEntry } from '@awesome-cordova-plugins/file/ngx';
import { AddonModThrdAssignSubmissionPluginBaseComponent } from '@addons/mod/thrdassign/classes/base-submission-plugin-component';
import { CoreFileEntry } from '@services/file-helper';

/**
 * Component to render a file submission plugin.
 */
@Component({
    selector: 'addon-mod-thrdassign-submission-file',
    templateUrl: 'addon-mod-thrdassign-submission-file.html',
})
export class AddonModThrdAssignSubmissionFileComponent extends AddonModThrdAssignSubmissionPluginBaseComponent implements OnInit {

    component = AddonModThrdAssignProvider.COMPONENT;
    files: CoreFileEntry[] = [];

    maxSize?: number;
    acceptedTypes?: string;
    maxSubmissions?: number;

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        this.acceptedTypes = this.configs?.filetypeslist;
        this.maxSize = this.configs?.maxsubmissionsizebytes
            ? parseInt(this.configs.maxsubmissionsizebytes, 10)
            : undefined;
        this.maxSubmissions = this.configs?.maxfilesubmissions
            ? parseInt(this.configs.maxfilesubmissions, 10)
            : undefined;

        // Get the offline data.
        const filesData = await CoreUtils.ignoreErrors(
            AddonModThrdAssignOffline.getSubmission(this.thrdassign.id),
            undefined,
        );

        try {
            if (filesData && filesData.plugindata && filesData.plugindata.files_filemanager) {
                const offlineDataFiles = <CoreFileUploaderStoreFilesResult>filesData.plugindata.files_filemanager;
                // It has offline data.
                let offlineFiles: FileEntry[] = [];
                if (offlineDataFiles.offline) {
                    offlineFiles = <FileEntry[]>await CoreUtils.ignoreErrors(
                        AddonModThrdAssignHelper.getStoredSubmissionFiles(
                            this.thrdassign.id,
                            AddonModThrdAssignSubmissionFileHandlerService.FOLDER_NAME,
                        ),
                        [],
                    );
                }

                this.files = offlineDataFiles.online || [];
                this.files = this.files.concat(offlineFiles);
            } else {
                // No offline data, get the online files.
                this.files = AddonModThrdAssign.getSubmissionPluginAttachments(this.plugin);
            }
        } finally {
            CoreFileSession.setFiles(this.component, this.thrdassign.id, this.files);
        }
    }

}
