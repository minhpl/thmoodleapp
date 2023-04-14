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

import { TestingBehatDomUtils } from './behat-dom';
import { TestingBehatBlocking } from './behat-blocking';
import { CoreCustomURLSchemes, CoreCustomURLSchemesProvider } from '@services/urlschemes';
import { CoreLoginHelperProvider } from '@features/login/services/login-helper';
import { CoreConfig } from '@services/config';
import { EnvironmentConfig } from '@/types/config';
import { LocalNotifications, makeSingleton, NgZone } from '@singletons';
import { CoreNetwork, CoreNetworkService } from '@services/network';
import { CorePushNotifications, CorePushNotificationsProvider } from '@features/pushnotifications/services/pushnotifications';
import { CoreCronDelegate, CoreCronDelegateService } from '@services/cron';
import { CoreLoadingComponent } from '@components/loading/loading';
import { CoreComponentsRegistry } from '@singletons/components-registry';
import { CoreDom } from '@singletons/dom';
import { Injectable } from '@angular/core';
import { CoreSites, CoreSitesProvider } from '@services/sites';
import { CoreNavigator, CoreNavigatorService } from '@services/navigator';

/**
 * Behat runtime servive with public API.
 */
@Injectable({ providedIn: 'root' })
export class TestingBehatRuntimeService {

    protected initialized = false;

    get cronDelegate(): CoreCronDelegateService {
        return CoreCronDelegate.instance;
    }

    get customUrlSchemes(): CoreCustomURLSchemesProvider {
        return CoreCustomURLSchemes.instance;
    }

    get network(): CoreNetworkService {
        return CoreNetwork.instance;
    }

    get pushNotifications(): CorePushNotificationsProvider {
        return CorePushNotifications.instance;
    }

    get sites(): CoreSitesProvider {
        return CoreSites.instance;
    }

    get navigator(): CoreNavigatorService {
        return CoreNavigator.instance;
    }

    /**
     * Init behat functions and set options like skipping onboarding.
     *
     * @param options Options to set on the app.
     */
    init(options: TestingBehatInitOptions = {}): void {
        if (this.initialized) {
            return;
        }

        this.initialized = true;
        TestingBehatBlocking.init();

        if (options.skipOnBoarding) {
            CoreConfig.set(CoreLoginHelperProvider.ONBOARDING_DONE, 1);
        }

        if (options.configOverrides) {
            // Set the cookie so it's maintained between reloads.
            document.cookie = 'MoodleAppConfig=' + JSON.stringify(options.configOverrides);
            CoreConfig.patchEnvironment(options.configOverrides, { patchDefault: true });
        }
    }

    /**
     * Check whether the service has been initialized or not.
     *
     * @returns Whether the service has been initialized or not.
     */
    hasInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Run an operation inside the angular zone and return result.
     *
     * @param operation Operation callback.
     * @returns OK if successful, or ERROR: followed by message.
     */
    async runInZone(operation: () => unknown, blocking: boolean = false): Promise<string> {
        const blockKey = blocking && TestingBehatBlocking.block();

        try {
            await NgZone.run(operation);

            return 'OK';
        } catch (error) {
            return 'ERROR: ' + error.message;
        } finally {
            blockKey && TestingBehatBlocking.unblock(blockKey);
        }
    }

    /**
     * Wait all controlled components to be rendered.
     *
     * @returns Promise resolved when all components have been rendered.
     */
    async waitLoadingToFinish(): Promise<void> {
        await NgZone.run(async () => {
            const elements = Array.from(document.body.querySelectorAll<HTMLElement>('core-loading'))
                .filter((element) => CoreDom.isElementVisible(element));

            await Promise.all(elements.map(element =>
                CoreComponentsRegistry.waitComponentReady(element, CoreLoadingComponent)));
        });
    }

    /**
     * Function to find and click an app standard button.
     *
     * @param button Type of button to press.
     * @returns OK if successful, or ERROR: followed by message.
     */
    async pressStandard(button: string): Promise<string> {
        this.log('Action - Click standard button: ' + button);

        // Find button
        let foundButton: HTMLElement | undefined;
        const options: TestingBehatFindOptions = {
            onlyClickable: true,
            containerName: '',
        };

        switch (button) {
            case 'back':
                foundButton = TestingBehatDomUtils.findElementBasedOnText({ text: 'Back' }, options);
                break;
            case 'main menu': // Deprecated name.
            case 'more menu':
                foundButton = TestingBehatDomUtils.findElementBasedOnText({
                    text: 'More',
                    selector: 'ion-tab-button',
                }, options);
                break;
            case 'user menu' :
                foundButton = TestingBehatDomUtils.findElementBasedOnText({ text: 'User account' }, options);
                break;
            case 'page menu':
                foundButton = TestingBehatDomUtils.findElementBasedOnText({ text: 'Display options' }, options);
                break;
            default:
                return 'ERROR: Unsupported standard button type';
        }

        if (!foundButton) {
            return `ERROR: Button '${button}' not found`;
        }

        // Click button
        await TestingBehatDomUtils.pressElement(foundButton);

        return 'OK';
    }

    /**
     * When there is a popup, clicks on the backdrop.
     *
     * @returns OK if successful, or ERROR: followed by message
     */
    closePopup(): string {
        this.log('Action - Close popup');

        let backdrops = Array.from(document.querySelectorAll('ion-backdrop'));
        backdrops = backdrops.filter((backdrop) => !!backdrop.offsetParent);

        if (!backdrops.length) {
            return 'ERROR: Could not find backdrop';
        }
        if (backdrops.length > 1) {
            return 'ERROR: Found too many backdrops ('+backdrops.length+')';
        }
        const backdrop = backdrops[0];
        backdrop.click();

        // Mark busy until the click finishes processing.
        TestingBehatBlocking.delay();

        return 'OK';
    }

    /**
     * Function to find an arbitrary element based on its text or aria label.
     *
     * @param locator Element locator.
     * @param options Search options.
     * @returns OK if successful, or ERROR: followed by message
     */
    find(locator: TestingBehatElementLocator, options: Partial<TestingBehatFindOptions> = {}): string {
        this.log('Action - Find', { locator, ...options });

        try {
            const element = TestingBehatDomUtils.findElementBasedOnText(locator, {
                onlyClickable: false,
                containerName: '',
                ...options,
            });

            if (!element) {
                return 'ERROR: No element matches locator to find.';
            }

            this.log('Action - Found', { locator, element, ...options });

            return 'OK';
        } catch (error) {
            return 'ERROR: ' + error.message;
        }
    }

    /**
     * Scroll an element into view.
     *
     * @param locator Element locator.
     * @returns OK if successful, or ERROR: followed by message
     */
    scrollTo(locator: TestingBehatElementLocator): string {
        this.log('Action - scrollTo', { locator });

        try {
            let element = TestingBehatDomUtils.findElementBasedOnText(locator, { onlyClickable: false, containerName: '' });

            if (!element) {
                return 'ERROR: No element matches element to scroll to.';
            }

            element = element.closest('ion-item') ?? element.closest('button') ?? element;

            element.scrollIntoView();

            this.log('Action - Scrolled to', { locator, element });

            return 'OK';
        } catch (error) {
            return 'ERROR: ' + error.message;
        }
    }

    /**
     * Load more items form an active list with infinite loader.
     *
     * @returns OK if successful, or ERROR: followed by message
     */
    async loadMoreItems(): Promise<string> {
        this.log('Action - loadMoreItems');

        try {
            const infiniteLoading = Array
                .from(document.querySelectorAll<HTMLElement>('core-infinite-loading'))
                .find(element => !element.closest('.ion-page-hidden'));

            if (!infiniteLoading) {
                return 'ERROR: There isn\'t an infinite loader in the current page.';
            }

            const initialOffset = infiniteLoading.offsetTop;
            const isLoading = () => !!infiniteLoading.querySelector('ion-spinner[aria-label]');
            const isCompleted = () => !isLoading() && !infiniteLoading.querySelector('ion-button');
            const hasMoved = () => infiniteLoading.offsetTop !== initialOffset;

            if (isCompleted()) {
                return 'ERROR: All items are already loaded.';
            }

            infiniteLoading.scrollIntoView({ behavior: 'smooth' });

            // Wait 100ms
            await new Promise(resolve => setTimeout(resolve, 100));

            if (isLoading() || isCompleted() || hasMoved()) {
                return 'OK';
            }

            infiniteLoading.querySelector<HTMLElement>('ion-button')?.click();

            // Wait 100ms
            await new Promise(resolve => setTimeout(resolve, 100));

            return (isLoading() || isCompleted() || hasMoved()) ? 'OK' : 'ERROR: Couldn\'t load more items.';
        } catch (error) {
            return 'ERROR: ' + error.message;
        }
    }

    /**
     * Check whether an item is selected or not.
     *
     * @param locator Element locator.
     * @returns YES or NO if successful, or ERROR: followed by message
     */
    isSelected(locator: TestingBehatElementLocator): string {
        this.log('Action - Is Selected', locator);

        try {
            const element = TestingBehatDomUtils.findElementBasedOnText(locator, { onlyClickable: false, containerName: '' });

            if (!element) {
                return 'ERROR: No element matches locator to find.';
            }

            return TestingBehatDomUtils.isElementSelected(element, document.body) ? 'YES' : 'NO';
        } catch (error) {
            return 'ERROR: ' + error.message;
        }
    }

    /**
     * Function to press arbitrary item based on its text or Aria label.
     *
     * @param locator Element locator.
     * @returns OK if successful, or ERROR: followed by message
     */
    async press(locator: TestingBehatElementLocator): Promise<string>;
    async press(text: string, nearText?: string): Promise<string>;
    async press(locatorOrText: TestingBehatElementLocator | string, nearText?: string): Promise<string> {
        const locator = typeof locatorOrText === 'string' ? { text: locatorOrText } : locatorOrText;

        if (nearText) {
            locator.near = { text: nearText };
        }

        this.log('Action - Press', locator);

        try {
            const found = TestingBehatDomUtils.findElementBasedOnText(locator, { onlyClickable: true, containerName: '' });

            if (!found) {
                return 'ERROR: No element matches locator to press.';
            }

            await TestingBehatDomUtils.pressElement(found);

            return 'OK';
        } catch (error) {
            return 'ERROR: ' + error.message;
        }
    }

    /**
     * Trigger a pull to refresh gesture in the current page.
     *
     * @returns OK if successful, or ERROR: followed by message
     */
    async pullToRefresh(): Promise<string> {
        this.log('Action - pullToRefresh');

        try {
            // 'el' is protected, but there's no other way to trigger refresh programatically.
            const ionRefresher = this.getAngularInstance<{ el: HTMLIonRefresherElement }>(
                'ion-refresher',
                'IonRefresher',
            );

            if (!ionRefresher) {
                return 'ERROR: It\'s not possible to pull to refresh the current page.';
            }

            ionRefresher.el.dispatchEvent(new CustomEvent('ionRefresh'));

            return 'OK';
        } catch (error) {
            return 'ERROR: ' + error.message;
        }
    }

    /**
     * Gets the currently displayed page header.
     *
     * @returns OK: followed by header text if successful, or ERROR: followed by message.
     */
    getHeader(): string {
        this.log('Action - Get header');

        let titles = Array.from(document.querySelectorAll<HTMLElement>('.ion-page:not(.ion-page-hidden) > ion-header h1'));
        titles = titles.filter((title) => TestingBehatDomUtils.isElementVisible(title, document.body));

        if (titles.length > 1) {
            return 'ERROR: Too many possible titles ('+titles.length+').';
        } else if (!titles.length) {
            return 'ERROR: No title found.';
        } else {
            const title = titles[0].innerText.trim();

            return 'OK:' + title;
        }
    }

    /**
     * Sets the text of a field to the specified value.
     *
     * This currently matches fields only based on the placeholder attribute.
     *
     * @param field Field name
     * @param value New value
     * @returns OK or ERROR: followed by message
     */
    async setField(field: string, value: string): Promise<string> {
        this.log('Action - Set field ' + field + ' to: ' + value);

        const found = this.findField(field);

        if (!found) {
            return 'ERROR: No element matches field to set.';
        }

        await TestingBehatDomUtils.setElementValue(found, value);

        return 'OK';
    }

    /**
     * Sets the text of a field to the specified value.
     *
     * This currently matches fields only based on the placeholder attribute.
     *
     * @param field Field name
     * @param value New value
     * @returns OK or ERROR: followed by message
     */
    async fieldMatches(field: string, value: string): Promise<string> {
        this.log('Action - Field ' + field + ' matches value: ' + value);

        const found = this.findField(field);

        if (!found) {
            return 'ERROR: No element matches field to set.';
        }

        const foundValue = this.getFieldValue(found);
        if (value !== foundValue) {
            return `ERROR: Expecting value "${value}", found "${foundValue}" instead.`;
        }

        return 'OK';
    }

    /**
     * Find a field.
     *
     * @param field Field name.
     * @returns Field element.
     */
    protected findField(field: string): HTMLElement | HTMLInputElement | undefined {
        return TestingBehatDomUtils.findElementBasedOnText(
            { text: field, selector: 'input, textarea, [contenteditable="true"], ion-select, ion-datetime' },
            { onlyClickable: false, containerName: '' },
        );
    }

    /**
     * Get the value of a certain field.
     *
     * @param element Field to get the value.
     * @returns Value.
     */
    protected getFieldValue(element: HTMLElement | HTMLInputElement): string {
        if (element.tagName === 'ION-DATETIME') {
            // ion-datetime's value is a timestamp in ISO format. Use the text displayed to the user instead.
            const dateTimeTextElement = element.shadowRoot?.querySelector<HTMLElement>('.datetime-text');
            if (dateTimeTextElement) {
                return dateTimeTextElement.innerText;
            }
        }

        return 'value' in element ? element.value : element.innerText;
    }

    /**
     * Get an Angular component instance.
     *
     * @param selector Element selector
     * @param className Constructor class name
     * @returns Component instance
     */
    getAngularInstance<T = unknown>(selector: string, className: string): T | null {
        this.log('Action - Get Angular instance ' + selector + ', ' + className);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeElement = Array.from(document.querySelectorAll<any>(`.ion-page:not(.ion-page-hidden) ${selector}`)).pop();

        if (!activeElement || !activeElement.__ngContext__) {
            return null;
        }

        return activeElement.__ngContext__.find(node => node?.constructor?.name === className);
    }

    /**
     * Logs information from this Behat runtime JavaScript, including the time and the 'BEHAT'
     * keyword so we can easily filter for it if needed.
     */
    log(...args: unknown[]): void {
        const now = new Date();
        const nowFormatted = String(now.getHours()).padStart(2, '0') + ':' +
                String(now.getMinutes()).padStart(2, '0') + ':' +
                String(now.getSeconds()).padStart(2, '0') + '.' +
                String(now.getMilliseconds()).padStart(2, '0');

        console.log('BEHAT: ' + nowFormatted, ...args); // eslint-disable-line no-console
    }

    /**
     * Check a notification is present.
     *
     * @param title Title of the notification
     * @returns YES or NO: depending on the result.
     */
    async notificationIsPresentWithText(title: string): Promise<string> {
        const notifications = await LocalNotifications.getAllTriggered();

        const notification = notifications.find((notification) => notification.title?.includes(title));

        if (!notification) {
            return 'NO';
        }

        if (!notification.id) {
            // Cannot check but has been triggered.
            return 'YES';
        }

        return (await LocalNotifications.isPresent(notification.id)) ? 'YES' : 'NO';
    }

    /**
     * Close notification.
     *
     * @param title Title of the notification
     * @returns OK or ERROR
     */
    async closeNotification(title: string): Promise<string> {
        const notifications = await LocalNotifications.getAllTriggered();

        const notification = notifications.find((notification) => notification.title?.includes(title));

        if (!notification || !notification.id) {
            return `ERROR: Notification with title ${title} cannot be closed`;
        }

        await LocalNotifications.clear(notification.id);

        return 'OK';
    }

}

export const TestingBehatRuntime = makeSingleton(TestingBehatRuntimeService);

export type BehatTestsWindow = Window & {
    M?: { // eslint-disable-line @typescript-eslint/naming-convention
        util?: {
            pending_js?: string[]; // eslint-disable-line @typescript-eslint/naming-convention
        };
    };
};

export type TestingBehatFindOptions = {
    containerName: string;
    onlyClickable: boolean;
};

export type TestingBehatElementLocator = {
    text: string;
    within?: TestingBehatElementLocator;
    near?: TestingBehatElementLocator;
    selector?: string;
};

export type TestingBehatInitOptions = {
    skipOnBoarding?: boolean;
    configOverrides?: Partial<EnvironmentConfig>;
};
