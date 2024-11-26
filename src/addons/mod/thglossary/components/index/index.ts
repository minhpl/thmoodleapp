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

import { ContextLevel } from '@/core/constants';
import { AfterViewInit, Component, OnDestroy, OnInit, Optional, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CoreListItemsManager } from '@classes/items-management/list-items-manager';
import { CoreRoutedItemsManagerSourcesTracker } from '@classes/items-management/routed-items-manager-sources-tracker';
import { CorePromisedValue } from '@classes/promised-value';
import { CoreSplitViewComponent } from '@components/split-view/split-view';
import { CoreCourseModuleMainActivityComponent } from '@features/course/classes/main-activity-component';
import { CoreCourseContentsPage } from '@features/course/pages/contents/contents';
import { CoreCourse } from '@features/course/services/course';
import { CoreRatingProvider } from '@features/rating/services/rating';
import { CoreRatingOffline } from '@features/rating/services/rating-offline';
import { CoreRatingSyncProvider } from '@features/rating/services/rating-sync';
import { IonContent } from '@ionic/angular';
import { CoreNavigator } from '@services/navigator';
import { CoreSites } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreTextUtils } from '@services/utils/text';
import { Translate } from '@singletons';
import { CoreEventObserver, CoreEvents } from '@singletons/events';
import {
    AddonModThGlossaryEntriesSource,
    AddonModThGlossaryEntryItem,
    AddonModThGlossaryFetchMode,
} from '../../classes/thglossary-entries-source';
import {
    AddonModThGlossary,
    AddonModThGlossaryEntry,
    AddonModThGlossaryEntryWithCategory,
    AddonModThGlossaryThGlossary,
    AddonModThGlossaryProvider,
    GLOSSARY_ENTRY_ADDED,
    GLOSSARY_ENTRY_DELETED,
    GLOSSARY_ENTRY_UPDATED,
} from '../../services/thglossary';
import { AddonModThGlossaryOfflineEntry } from '../../services/thglossary-offline';
import {
    AddonModThGlossaryAutoSyncedData,
    AddonModThGlossarySyncResult,
    GLOSSARY_AUTO_SYNCED,
} from '../../services/thglossary-sync';
import { AddonModThGlossaryModuleHandlerService } from '../../services/handlers/module';
import { AddonModThGlossaryPrefetchHandler } from '../../services/handlers/prefetch';
import { AddonModThGlossaryModePickerPopoverComponent } from '../mode-picker/mode-picker';
import { CoreTime } from '@singletons/time';

/**
 * Component that displays a thglossary entry page.
 */
@Component({
    selector: 'addon-mod-thglossary-index',
    templateUrl: 'addon-mod-thglossary-index.html',
    styleUrls: ['index.scss'],
})
export class AddonModThGlossaryIndexComponent extends CoreCourseModuleMainActivityComponent
    implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild(CoreSplitViewComponent) splitView!: CoreSplitViewComponent;

    component = AddonModThGlossaryProvider.COMPONENT;
    pluginName = 'thglossary';

    canAdd = false;
    loadMoreError = false;
    loadingMessage: string;
    promisedEntries: CorePromisedValue<AddonModThGlossaryEntriesManager>;

    protected hasOfflineEntries = false;
    protected hasOfflineRatings = false;
    protected syncEventName = GLOSSARY_AUTO_SYNCED;
    protected fetchedEntriesCanLoadMore = false;
    protected fetchedEntries: AddonModThGlossaryEntry[] = [];
    protected sourceUnsubscribe?: () => void;
    protected observers?: CoreEventObserver[];
    protected checkCompletionAfterLog = false; // Use CoreListItemsManager log system instead.
    protected logSearch?: () => void;

    getDivider?: (entry: AddonModThGlossaryEntry) => string;
    showDivider: (entry: AddonModThGlossaryEntry, previous?: AddonModThGlossaryEntry) => boolean = () => false;

    constructor(
        public route: ActivatedRoute,
        protected content?: IonContent,
        @Optional() protected courseContentsPage?: CoreCourseContentsPage,
    ) {
        super('AddonModThGlossaryIndexComponent', content, courseContentsPage);

        this.loadingMessage = Translate.instant('core.loading');
        this.promisedEntries = new CorePromisedValue();
    }

    get entries(): AddonModThGlossaryEntriesManager | null {
        return this.promisedEntries.value;
    }

    get thglossary(): AddonModThGlossaryThGlossary | undefined {
        return this.entries?.getSource().thglossary;
    }

    get isSearch(): boolean {
        return this.entries?.getSource().isSearch ?? false;
    }

    get hasSearched(): boolean {
        return this.entries?.getSource().hasSearched ?? false;
    }

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        await super.ngOnInit();

        // Initialize entries manager.
        const source = CoreRoutedItemsManagerSourcesTracker.getOrCreateSource(
            AddonModThGlossaryEntriesSource,
            [this.courseId, this.module.id, this.courseContentsPage ? `${AddonModThGlossaryModuleHandlerService.PAGE_NAME}/` : ''],
        );

        this.promisedEntries.resolve(new AddonModThGlossaryEntriesManager(source, this));

        this.sourceUnsubscribe = source.addListener({
            onItemsUpdated: (items) => {
                this.hasOfflineEntries = !!items.find(item => source.isOfflineEntry(item));
                this.hasOffline = this.hasOfflineEntries || this.hasOfflineRatings;
            },
        });

        // When an entry is added, we reload the data.
        this.observers = [
            CoreEvents.on(GLOSSARY_ENTRY_ADDED, ({ thglossaryId }) => {
                if (this.thglossary?.id !== thglossaryId) {
                    return;
                }

                // Check completion since it could be configured to complete once the user adds a new entry.
                this.checkCompletion();

                this.showLoadingAndRefresh(false);
            }),
            CoreEvents.on(GLOSSARY_ENTRY_UPDATED, ({ thglossaryId }) => {
                if (this.thglossary?.id !== thglossaryId) {
                    return;
                }

                this.showLoadingAndRefresh(false);
            }),
            CoreEvents.on(GLOSSARY_ENTRY_DELETED, ({ thglossaryId }) => {
                if (this.thglossary?.id !== thglossaryId) {
                    return;
                }

                this.showLoadingAndRefresh(false);
            }),
        ];

        // Listen for offline ratings saved and synced.
        this.observers.push(CoreEvents.on(CoreRatingProvider.RATING_SAVED_EVENT, (data) => {
            if (
                this.thglossary &&
                data.component == 'mod_thglossary' &&
                data.ratingArea == 'entry' &&
                data.contextLevel == ContextLevel.MODULE &&
                data.instanceId == this.thglossary.coursemodule
            ) {
                this.hasOfflineRatings = true;
                this.hasOffline = true;
            }
        }));
        this.observers.push(CoreEvents.on(CoreRatingSyncProvider.SYNCED_EVENT, (data) => {
            if (
                this.thglossary &&
                data.component == 'mod_thglossary' &&
                data.ratingArea == 'entry' &&
                data.contextLevel == ContextLevel.MODULE &&
                data.instanceId == this.thglossary.coursemodule
            ) {
                this.hasOfflineRatings = false;
                this.hasOffline = this.hasOfflineEntries;
            }
        }));
    }

    /**
     * @inheritdoc
     */
    async ngAfterViewInit(): Promise<void> {
        const entries = await this.promisedEntries;

        await this.loadContent(false, true);
        await entries.start(this.splitView);
    }

    /**
     * @inheritdoc
     */
    protected async fetchContent(refresh = false, sync = false, showErrors = false): Promise<void> {
        const entries = await this.promisedEntries;

        await entries.getSource().loadThGlossary();

        if (!this.thglossary) {
            return;
        }

        this.description = this.thglossary.intro || this.description;
        this.canAdd = !!this.thglossary.canaddentry || false;

        this.dataRetrieved.emit(this.thglossary);

        if (!entries.getSource().fetchMode) {
            this.switchMode('letter_all');
        }

        if (sync) {
            // Try to synchronize the thglossary.
            await this.syncActivity(showErrors);
        }

        const [hasOfflineRatings] = await Promise.all([
            CoreRatingOffline.hasRatings('mod_thglossary', 'entry', ContextLevel.MODULE, this.thglossary.coursemodule),
            refresh ? entries.reload() : entries.load(),
        ]);

        this.hasOfflineRatings = hasOfflineRatings;
        this.hasOffline = this.hasOfflineEntries || this.hasOfflineRatings;

        if (this.isSearch && this.logSearch) {
            this.logSearch();
        }
    }

    /**
     * @inheritdoc
     */
    protected async invalidateContent(): Promise<void> {
        await this.entries?.getSource().invalidateCache();
    }

    /**
     * @inheritdoc
     */
    protected sync(): Promise<AddonModThGlossarySyncResult> {
        return AddonModThGlossaryPrefetchHandler.sync(this.module, this.courseId);
    }

    /**
     * Compares sync event data with current data to check if refresh content is needed.
     *
     * @param syncEventData Data receiven on sync observer.
     * @returns True if refresh is needed, false otherwise.
     */
    protected isRefreshSyncNeeded(syncEventData: AddonModThGlossaryAutoSyncedData): boolean {
        return !!this.thglossary && syncEventData.thglossaryId == this.thglossary.id &&
                syncEventData.userId == CoreSites.getCurrentSiteUserId();
    }

    /**
     * Change fetch mode.
     *
     * @param mode New mode.
     */
    protected switchMode(mode: AddonModThGlossaryFetchMode): void {
        this.entries?.getSource().switchMode(mode);

        switch (mode) {
            case 'author_all':
                // Browse by author.
                this.getDivider = (entry) => entry.userfullname;
                this.showDivider = (entry, previous) => !previous || entry.userid != previous.userid;
                break;

            case 'cat_all': {
                // Browse by category.
                const getDivider = (entry: AddonModThGlossaryEntryWithCategory) => entry.categoryname || '';

                this.getDivider = getDivider;
                this.showDivider = (entry, previous) => !previous || getDivider(entry) != getDivider(previous);
                break;
            }

            case 'newest_first':
                // Newest first.
                this.getDivider = undefined;
                this.showDivider = () => false;
                break;

            case 'recently_updated':
                // Recently updated.
                this.getDivider = undefined;
                this.showDivider = () => false;
                break;

            case 'letter_all':
            default: {
                // Consider it is 'letter_all'.
                const getDivider = (entry) => {
                    // Try to get the first letter without HTML tags.
                    const noTags = CoreTextUtils.cleanTags(entry.concept);

                    return (noTags || entry.concept).substring(0, 1).toUpperCase();
                };

                this.getDivider = getDivider;
                this.showDivider = (entry, previous) => !previous || getDivider(entry) != getDivider(previous);
                break;
            }
        }
    }

    /**
     * Convenience function to load more entries.
     *
     * @param infiniteComplete Infinite scroll complete function. Only used from core-infinite-loading.
     * @returns Promise resolved when done.
     */
    async loadMoreEntries(infiniteComplete?: () => void): Promise<void> {
        const entries = await this.promisedEntries;

        try {
            this.loadMoreError = false;

            await entries.load();
        } catch (error) {
            this.loadMoreError = true;
            CoreDomUtils.showErrorModalDefault(error, 'addon.mod_glossary.errorloadingentries', true);
        } finally {
            infiniteComplete && infiniteComplete();
        }
    }

    /**
     * Show the mode picker menu.
     *
     * @param event Event.
     */
    async openModePicker(event: MouseEvent): Promise<void> {
        if (!this.thglossary) {
            return;
        }

        const entries = await this.promisedEntries;
        const previousMode = entries.getSource().fetchMode;
        const newMode = await CoreDomUtils.openPopover<AddonModThGlossaryFetchMode>({
            component: AddonModThGlossaryModePickerPopoverComponent,
            componentProps: {
                browseModes: this.thglossary.browsemodes,
                selectedMode: this.isSearch ? '' : previousMode,
            },
            event,
        });

        if (!newMode) {
            return;
        }

        if (newMode !== previousMode) {
            this.changeFetchMode(newMode);

            return;
        }

        if (this.isSearch) {
            this.toggleSearch();

            return;
        }
    }

    /**
     * Toggles between search and fetch mode.
     */
    toggleSearch(): void {
        if (!this.entries) {
            return;
        }

        if (this.isSearch) {
            const fetchMode = this.entries.getSource().fetchMode;

            fetchMode && this.switchMode(fetchMode);
            this.entries.getSource().stopSearch(this.fetchedEntries, this.fetchedEntriesCanLoadMore);

            return;
        }

        // Search for entries. The fetch function will be set when searching.
        this.fetchedEntries = this.entries.getSource().onlineEntries;
        this.fetchedEntriesCanLoadMore = !this.entries.completed;
        this.getDivider = undefined;
        this.showDivider = () => false;

        this.entries.reset();
        this.entries.getSource().startSearch();
    }

    /**
     * Change fetch mode.
     *
     * @param mode Mode.
     */
    changeFetchMode(mode: AddonModThGlossaryFetchMode): void {
        this.loadingMessage = Translate.instant('core.loading');
        this.content?.scrollToTop();
        this.switchMode(mode);
        this.showLoading = true;
        this.loadContent();
    }

    /**
     * Opens new entry editor.
     */
    openNewEntry(): void {
        CoreNavigator.navigate(
            this.splitView.outletActivated
                ? '../new'
                : './entry/new',
        );
    }

    /**
     * Search entries.
     *
     * @param query Text entered on the search box.
     */
    search(query: string): void {
        this.loadingMessage = Translate.instant('core.searching');
        this.showLoading = true;
        this.logSearch = CoreTime.once(() => this.performLogSearch(query));

        this.entries?.getSource().search(query);
        this.loadContent();
    }

    /**
     * Log search.
     *
     * @param query Text entered on the search box.
     */
    protected async performLogSearch(query: string): Promise<void> {
        this.analyticsLogEvent('mod_thglossary_get_entries_by_search', {
            data: { mode: 'search', hook: query, fullsearch: 1 },
        });
    }

    /**
     * @inheritdoc
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();

        this.observers?.forEach(observer => observer.off());
        this.sourceUnsubscribe?.call(null);
        this.entries?.destroy();
    }

}

/**
 * Entries manager.
 */
class AddonModThGlossaryEntriesManager extends CoreListItemsManager<AddonModThGlossaryEntryItem, AddonModThGlossaryEntriesSource> {

    page: AddonModThGlossaryIndexComponent;

    constructor(source: AddonModThGlossaryEntriesSource, page: AddonModThGlossaryIndexComponent) {
        super(source, page.route.component);

        this.page = page;
    }

    get offlineEntries(): AddonModThGlossaryOfflineEntry[] {
        return this.getSource().offlineEntries;
    }

    get onlineEntries(): AddonModThGlossaryEntry[] {
        return this.getSource().onlineEntries;
    }

    /**
     * @inheritdoc
     */
    protected getDefaultItem(): AddonModThGlossaryEntryItem | null {
        return this.getSource().onlineEntries[0] || null;
    }

    /**
     * @inheritdoc
     */
    protected async logActivity(): Promise<void> {
        const thglossary = this.getSource().thglossary;
        const viewMode = this.getSource().viewMode;

        if (!thglossary || !viewMode) {
            return;
        }

        try {
            await AddonModThGlossary.logView(thglossary.id, viewMode);

            CoreCourse.checkModuleCompletion(this.page.courseId, this.page.module.completiondata);
        } catch {
            // Ignore errors.
        }

        this.page.analyticsLogEvent('mod_thglossary_view_thglossary', { data: { mode: viewMode } });
    }

    /**
     * Check whether there is any entry in the items.
     *
     * @returns Whether there is an entry.
     */
    get hasEntries(): boolean {
        return this.getSource().onlineEntries.length > 0 || this.getSource().offlineEntries.length > 0;
    }

}
