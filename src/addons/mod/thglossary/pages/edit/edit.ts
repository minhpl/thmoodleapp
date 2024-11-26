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

import { Component, OnInit, ViewChild, ElementRef, Optional } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CoreError } from '@classes/errors/error';
import { CoreNetworkError } from '@classes/errors/network-error';
import { CoreSplitViewComponent } from '@components/split-view/split-view';
import { CoreFileUploader, CoreFileUploaderStoreFilesResult } from '@features/fileuploader/services/fileuploader';
import { CanLeave } from '@guards/can-leave';
import { CoreFileEntry } from '@services/file-helper';
import { CoreNavigator } from '@services/navigator';
import { CoreNetwork } from '@services/network';
import { CoreSites } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreTextUtils } from '@services/utils/text';
import { CoreUtils } from '@services/utils/utils';
import { Translate } from '@singletons';
import { CoreEventObserver, CoreEvents } from '@singletons/events';
import { CoreForms } from '@singletons/form';
import {
    AddonModThGlossary,
    AddonModThGlossaryCategory,
    AddonModThGlossaryEntry,
    AddonModThGlossaryEntryOption,
    AddonModThGlossaryThGlossary,
    AddonModThGlossaryProvider,
} from '../../services/thglossary';
import { AddonModThGlossaryHelper } from '../../services/thglossary-helper';
import { AddonModThGlossaryOffline } from '../../services/thglossary-offline';
import { CoreAnalytics, CoreAnalyticsEventType } from '@services/analytics';

/**
 * Page that displays the edit form.
 */
@Component({
    selector: 'page-addon-mod-thglossary-edit',
    templateUrl: 'edit.html',
})
export class AddonModThGlossaryEditPage implements OnInit, CanLeave {

    @ViewChild('editFormEl') formElement?: ElementRef;

    component = AddonModThGlossaryProvider.COMPONENT;
    cmId!: number;
    courseId!: number;
    loaded = false;
    thglossary?: AddonModThGlossaryThGlossary;
    definitionControl = new FormControl<string | null>(null);
    categories: AddonModThGlossaryCategory[] = [];
    showAliases = true;
    editorExtraParams: Record<string, unknown> = {};
    handler!: AddonModThGlossaryFormHandler;
    data: AddonModThGlossaryFormData = {
        concept: '',
        definition: '',
        timecreated: 0,
        attachments: [],
        categories: [],
        aliases: '',
        usedynalink: false,
        casesensitive: false,
        fullmatch: false,
    };

    originalData?: AddonModThGlossaryFormData;

    protected entry?: AddonModThGlossaryEntry;
    protected syncId?: string;
    protected syncObserver?: CoreEventObserver;
    protected isDestroyed = false;
    protected saved = false;

    constructor(protected route: ActivatedRoute, @Optional() protected splitView: CoreSplitViewComponent) {}

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        try {
            const entrySlug = CoreNavigator.getRouteParam<string>('entrySlug');
            this.cmId = CoreNavigator.getRequiredRouteNumberParam('cmId');
            this.courseId = CoreNavigator.getRequiredRouteNumberParam('courseId');

            if (entrySlug?.startsWith('new-')) {
                const timecreated = Number(entrySlug.slice(4));
                this.editorExtraParams.timecreated = timecreated;
                this.handler = new AddonModThGlossaryOfflineFormHandler(this, timecreated);
            } else if (entrySlug) {
                const { entry } = await AddonModThGlossary.getEntry(Number(entrySlug));

                this.entry = entry;
                this.editorExtraParams.timecreated = entry.timecreated;
                this.handler = new AddonModThGlossaryOnlineFormHandler(this, entry);
            } else {
                this.handler = new AddonModThGlossaryNewFormHandler(this);
            }
        } catch (error) {
            CoreDomUtils.showErrorModal(error);

            this.goBack();

            return;
        }

        this.fetchData();
    }

    /**
     * Fetch required data.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchData(): Promise<void> {
        try {
            this.thglossary = await AddonModThGlossary.getThGlossary(this.courseId, this.cmId);

            await this.handler.loadData(this.thglossary);

            this.loaded = true;

            if (this.handler instanceof AddonModThGlossaryOfflineFormHandler) {
                return;
            }

            CoreAnalytics.logEvent({
                type: CoreAnalyticsEventType.VIEW_ITEM,
                ws: 'mod_thglossary_get_glossaries_by_courses',
                name: this.thglossary.name,
                data: { id: this.thglossary.id, category: 'thglossary' },
                url: '/mod/thglossary/edit.php' + (this.entry ? `?cmid=${this.cmId}&id=${this.entry.id}` : ''),
            });
        } catch (error) {
            CoreDomUtils.showErrorModalDefault(error, 'addon.mod_glossary.errorloadingthglossary', true);

            this.goBack();
        }
    }

    /**
     * Reset the form data.
     */
    protected resetForm(): void {
        this.originalData = undefined;

        this.data.concept = '';
        this.data.definition = '';
        this.data.timecreated = 0;
        this.data.categories = [];
        this.data.aliases = '';
        this.data.usedynalink = false;
        this.data.casesensitive = false;
        this.data.fullmatch = false;
        this.data.attachments.length = 0; // Empty the array.

        this.definitionControl.setValue('');
    }

    /**
     * Definition changed.
     *
     * @param text The new text.
     */
    onDefinitionChange(text?: string | null): void {
        this.data.definition = text ?? '';
    }

    /**
     * Check if we can leave the page or not.
     *
     * @returns Resolved if we can leave it, rejected if not.
     */
    async canLeave(): Promise<boolean> {
        if (this.saved) {
            return true;
        }

        if (this.hasDataChanged()) {
            // Show confirmation if some data has been modified.
            await CoreDomUtils.showConfirm(Translate.instant('core.confirmcanceledit'));
        }

        // Delete the local files from the tmp folder.
        CoreFileUploader.clearTmpFiles(this.data.attachments);

        CoreForms.triggerFormCancelledEvent(this.formElement, CoreSites.getCurrentSiteId());

        return true;
    }

    /**
     * Save the entry.
     */
    async save(): Promise<void> {
        if (!this.data.concept || !this.data.definition) {
            CoreDomUtils.showErrorModal('addon.mod_glossary.fillfields', true);

            return;
        }

        if (!this.thglossary) {
            return;
        }

        const modal = await CoreDomUtils.showModalLoading('core.sending', true);

        try {
            const savedOnline = await this.handler.save(this.thglossary);

            this.saved = true;

            CoreForms.triggerFormSubmittedEvent(this.formElement, savedOnline, CoreSites.getCurrentSiteId());

            this.goBack();
        } catch (error) {
            CoreDomUtils.showErrorModalDefault(error, 'addon.mod_glossary.cannoteditentry', true);
        } finally {
            modal.dismiss();
        }
    }

    /**
     * Check if the form data has changed.
     *
     * @returns True if data has changed, false otherwise.
     */
    protected hasDataChanged(): boolean {
        if (!this.originalData || this.originalData.concept === undefined) {
            // There is no original data.
            return !!(this.data.definition || this.data.concept || this.data.attachments.length > 0);
        }

        if (this.originalData.definition != this.data.definition || this.originalData.concept != this.data.concept) {
            return true;
        }

        return CoreFileUploader.areFileListDifferent(this.data.attachments, this.originalData.attachments);
    }

    /**
     * Helper function to go back.
     */
    protected goBack(): void {
        if (this.splitView?.outletActivated) {
            CoreNavigator.navigate('../../');
        } else {
            CoreNavigator.back();
        }
    }

}

/**
 * Helper to manage form data.
 */
abstract class AddonModThGlossaryFormHandler {

    constructor(protected page: AddonModThGlossaryEditPage) {}

    /**
     * Load form data.
     *
     * @param thglossary ThGlossary.
     */
    abstract loadData(thglossary: AddonModThGlossaryThGlossary): Promise<void>;

    /**
     * Save form data.
     *
     * @param thglossary ThGlossary.
     * @returns Whether the form was saved online.
     */
    abstract save(thglossary: AddonModThGlossaryThGlossary): Promise<boolean>;

    /**
     * Load form categories.
     *
     * @param thglossary ThGlossary.
     */
    protected async loadCategories(thglossary: AddonModThGlossaryThGlossary): Promise<void> {
        this.page.categories = await AddonModThGlossary.getAllCategories(thglossary.id, {
            cmId: this.page.cmId,
        });
    }

    /**
     * Upload attachments online.
     *
     * @param thglossary ThGlossary.
     * @returns Uploaded attachments item id.
     */
    protected async uploadAttachments(thglossary: AddonModThGlossaryThGlossary): Promise<number> {
        const data = this.page.data;
        const itemId = await CoreFileUploader.uploadOrReuploadFiles(
            data.attachments,
            AddonModThGlossaryProvider.COMPONENT,
            thglossary.id,
        );

        return itemId;
    }

    /**
     * Store attachments offline.
     *
     * @param thglossary ThGlossary.
     * @param timecreated Entry time created.
     * @returns Storage result.
     */
    protected async storeAttachments(
        thglossary: AddonModThGlossaryThGlossary,
        timecreated: number,
    ): Promise<CoreFileUploaderStoreFilesResult> {
        const data = this.page.data;
        const result = await AddonModThGlossaryHelper.storeFiles(
            thglossary.id,
            data.concept,
            timecreated,
            data.attachments,
        );

        return result;
    }

    /**
     * Make sure that the new entry won't create any duplicates.
     *
     * @param thglossary ThGlossary.
     */
    protected async checkDuplicates(thglossary: AddonModThGlossaryThGlossary): Promise<void> {
        if (thglossary.allowduplicatedentries) {
            return;
        }

        const data = this.page.data;
        const isUsed = await AddonModThGlossary.isConceptUsed(thglossary.id, data.concept, {
            timeCreated: data.timecreated,
            cmId: this.page.cmId,
        });

        if (isUsed) {
            // There's a entry with same name, reject with error message.
            throw new CoreError(Translate.instant('addon.mod_glossary.errconceptalreadyexists'));
        }
    }

    /**
     * Get additional options to save an entry.
     *
     * @param thglossary ThGlossary.
     * @returns Options.
     */
    protected getSaveOptions(thglossary: AddonModThGlossaryThGlossary): Record<string, AddonModThGlossaryEntryOption> {
        const data = this.page.data;
        const options: Record<string, AddonModThGlossaryEntryOption> = {};

        if (this.page.showAliases) {
            options.aliases = data.aliases;
        }

        if (this.page.categories.length > 0) {
            options.categories = data.categories.join(',');
        }

        if (thglossary.usedynalink) {
            options.usedynalink = data.usedynalink ? 1 : 0;

            if (data.usedynalink) {
                options.casesensitive = data.casesensitive ? 1 : 0;
                options.fullmatch = data.fullmatch ? 1 : 0;
            }
        }

        return options;
    }

}

/**
 * Helper to manage the form data for an offline entry.
 */
class AddonModThGlossaryOfflineFormHandler extends AddonModThGlossaryFormHandler {

    private timecreated: number;

    constructor(page: AddonModThGlossaryEditPage, timecreated: number) {
        super(page);

        this.timecreated = timecreated;
    }

    /**
     * @inheritdoc
     */
    async loadData(thglossary: AddonModThGlossaryThGlossary): Promise<void> {
        const data = this.page.data;
        const entry = await AddonModThGlossaryOffline.getOfflineEntry(thglossary.id, this.timecreated);

        data.concept = entry.concept || '';
        data.definition = entry.definition || '';
        data.timecreated = entry.timecreated;

        if (entry.options) {
            data.categories = ((entry.options.categories as string)?.split(',') ?? []).map(id => Number(id));
            data.aliases = entry.options.aliases as string ?? '';
            data.usedynalink = !!entry.options.usedynalink;

            if (data.usedynalink) {
                data.casesensitive = !!entry.options.casesensitive;
                data.fullmatch = !!entry.options.fullmatch;
            }
        }

        // Treat offline attachments if any.
        if (entry.attachments?.offline) {
            data.attachments = await AddonModThGlossaryHelper.getStoredFiles(thglossary.id, entry.concept, entry.timecreated);
        }

        this.page.originalData = {
            concept: data.concept,
            definition: data.definition,
            attachments: data.attachments.slice(),
            timecreated: data.timecreated,
            categories: data.categories.slice(),
            aliases: data.aliases,
            usedynalink: data.usedynalink,
            casesensitive: data.casesensitive,
            fullmatch: data.fullmatch,
        };

        this.page.definitionControl.setValue(data.definition);

        await this.loadCategories(thglossary);
    }

    /**
     * @inheritdoc
     */
    async save(thglossary: AddonModThGlossaryThGlossary): Promise<boolean> {
        const originalData = this.page.data;
        const data = this.page.data;

        // Upload attachments first if any.
        let offlineAttachments: CoreFileUploaderStoreFilesResult | undefined = undefined;

        if (data.attachments.length) {
            offlineAttachments = await this.storeAttachments(thglossary, data.timecreated);
        }

        if (originalData.concept !== data.concept) {
            await AddonModThGlossaryHelper.deleteStoredFiles(thglossary.id, originalData.concept, data.timecreated);
        }

        // Save entry data.
        await this.updateOfflineEntry(thglossary, offlineAttachments);

        // Delete the local files from the tmp folder.
        CoreFileUploader.clearTmpFiles(data.attachments);

        return false;
    }

    /**
     * Update an offline entry.
     *
     * @param thglossary ThGlossary.
     * @param uploadedAttachments Uploaded attachments.
     */
    protected async updateOfflineEntry(
        thglossary: AddonModThGlossaryThGlossary,
        uploadedAttachments?: CoreFileUploaderStoreFilesResult,
    ): Promise<void> {
        const originalData = this.page.originalData;
        const data = this.page.data;
        const options = this.getSaveOptions(thglossary);
        const definition = CoreTextUtils.formatHtmlLines(data.definition);

        if (!originalData) {
            return;
        }

        await this.checkDuplicates(thglossary);
        await AddonModThGlossaryOffline.updateOfflineEntry(
            {
                thglossaryid: thglossary.id,
                courseid: this.page.courseId,
                concept: originalData.concept,
                timecreated: originalData.timecreated,
            },
            data.concept,
            definition,
            options,
            uploadedAttachments,
        );
    }

}

/**
 * Helper to manage the form data for creating a new entry.
 */
class AddonModThGlossaryNewFormHandler extends AddonModThGlossaryFormHandler {

    /**
     * @inheritdoc
     */
    async loadData(thglossary: AddonModThGlossaryThGlossary): Promise<void> {
        await this.loadCategories(thglossary);
    }

    /**
     * @inheritdoc
     */
    async save(thglossary: AddonModThGlossaryThGlossary): Promise<boolean> {
        const data = this.page.data;
        const timecreated = Date.now();

        // Upload attachments first if any.
        let onlineAttachments: number | undefined = undefined;
        let offlineAttachments: CoreFileUploaderStoreFilesResult | undefined = undefined;

        if (data.attachments.length) {
            try {
                onlineAttachments = await this.uploadAttachments(thglossary);
            } catch (error) {
                if (CoreUtils.isWebServiceError(error)) {
                    throw error;
                }

                offlineAttachments = await this.storeAttachments(thglossary, timecreated);
            }
        }

        // Save entry data.
        const entryId = offlineAttachments
            ? await this.createOfflineEntry(thglossary, timecreated, offlineAttachments)
            : await this.createOnlineEntry(thglossary, timecreated, onlineAttachments, !data.attachments.length);

        // Delete the local files from the tmp folder.
        CoreFileUploader.clearTmpFiles(data.attachments);

        if (entryId) {
            // Data sent to server, delete stored files (if any).
            AddonModThGlossaryHelper.deleteStoredFiles(thglossary.id, data.concept, timecreated);
            CoreEvents.trigger(CoreEvents.ACTIVITY_DATA_SENT, { module: 'thglossary' });
        }

        return !!entryId;
    }

    /**
     * Create an offline entry.
     *
     * @param thglossary ThGlossary.
     * @param timecreated Time created.
     * @param uploadedAttachments Uploaded attachments.
     */
    protected async createOfflineEntry(
        thglossary: AddonModThGlossaryThGlossary,
        timecreated: number,
        uploadedAttachments?: CoreFileUploaderStoreFilesResult,
    ): Promise<void> {
        const data = this.page.data;
        const options = this.getSaveOptions(thglossary);
        const definition = CoreTextUtils.formatHtmlLines(data.definition);

        await this.checkDuplicates(thglossary);
        await AddonModThGlossaryOffline.addOfflineEntry(
            thglossary.id,
            data.concept,
            definition,
            this.page.courseId,
            timecreated,
            options,
            uploadedAttachments,
            undefined,
            undefined,
        );
    }

    /**
     * Create an online entry.
     *
     * @param thglossary ThGlossary.
     * @param timecreated Time created.
     * @param uploadedAttachmentsId Id of the uploaded attachments.
     * @param allowOffline Allow falling back to creating the entry offline.
     * @returns Entry id.
     */
    protected async createOnlineEntry(
        thglossary: AddonModThGlossaryThGlossary,
        timecreated: number,
        uploadedAttachmentsId?: number,
        allowOffline?: boolean,
    ): Promise<number | false> {
        const data = this.page.data;
        const options = this.getSaveOptions(thglossary);
        const definition = CoreTextUtils.formatHtmlLines(data.definition);
        const entryId = await AddonModThGlossary.addEntry(
            thglossary.id,
            data.concept,
            definition,
            this.page.courseId,
            options,
            uploadedAttachmentsId,
            {
                timeCreated: timecreated,
                allowOffline: allowOffline,
                checkDuplicates: !thglossary.allowduplicatedentries,
            },
        );

        return entryId;
    }

}

/**
 * Helper to manage the form data for an online entry.
 */
class AddonModThGlossaryOnlineFormHandler extends AddonModThGlossaryFormHandler {

    private entry: AddonModThGlossaryEntry;

    constructor(page: AddonModThGlossaryEditPage, entry: AddonModThGlossaryEntry) {
        super(page);

        this.entry = entry;
    }

    /**
     * @inheritdoc
     */
    async loadData(): Promise<void> {
        const data = this.page.data;

        data.concept = this.entry.concept;
        data.definition = this.entry.definition || '';
        data.timecreated = this.entry.timecreated;
        data.usedynalink = this.entry.usedynalink;

        if (data.usedynalink) {
            data.casesensitive = this.entry.casesensitive;
            data.fullmatch = this.entry.fullmatch;
        }

        // Treat offline attachments if any.
        if (this.entry.attachments) {
            data.attachments = this.entry.attachments;
        }

        this.page.originalData = {
            concept: data.concept,
            definition: data.definition,
            attachments: data.attachments.slice(),
            timecreated: data.timecreated,
            categories: data.categories.slice(),
            aliases: data.aliases,
            usedynalink: data.usedynalink,
            casesensitive: data.casesensitive,
            fullmatch: data.fullmatch,
        };

        this.page.definitionControl.setValue(data.definition);
        this.page.showAliases = false;
    }

    /**
     * @inheritdoc
     */
    async save(thglossary: AddonModThGlossaryThGlossary): Promise<boolean> {
        if (!CoreNetwork.isOnline()) {
            throw new CoreNetworkError();
        }

        const data = this.page.data;
        const options = this.getSaveOptions(thglossary);
        const definition = CoreTextUtils.formatHtmlLines(data.definition);

        // Upload attachments, if any.
        let attachmentsId: number | undefined = undefined;

        if (data.attachments.length) {
            attachmentsId = await this.uploadAttachments(thglossary);
        }

        // Save entry data.
        await AddonModThGlossary.updateEntry(thglossary.id, this.entry.id, data.concept, definition, options, attachmentsId);

        // Delete the local files from the tmp folder.
        CoreFileUploader.clearTmpFiles(data.attachments);

        CoreEvents.trigger(CoreEvents.ACTIVITY_DATA_SENT, { module: 'thglossary' });

        return true;
    }

}

/**
 * Form data.
 */
type AddonModThGlossaryFormData = {
    concept: string;
    definition: string;
    timecreated: number;
    attachments: CoreFileEntry[];
    categories: number[];
    aliases: string;
    usedynalink: boolean;
    casesensitive: boolean;
    fullmatch: boolean;
};
