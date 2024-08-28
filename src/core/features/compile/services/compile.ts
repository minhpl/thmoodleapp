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

import {
    Injectable,
    Injector,
    Component,
    NgModule,
    ComponentRef,
    NO_ERRORS_SCHEMA,
    Type,
    Provider,
    createNgModule,
    ViewContainerRef,
} from '@angular/core';
import {
    ActionSheetController,
    AlertController,
    LoadingController,
    ModalController,
    PopoverController,
    ToastController,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { CoreLogger } from '@singletons/logger';
import { CoreEvents } from '@singletons/events';
import { makeSingleton } from '@singletons';

// Import core services.
import { getCoreServices } from '@/core/core.module';
import { getBlockServices } from '@features/block/block.module';
import { getCommentsServices } from '@features/comments/comments.module';
import { getContentLinksExportedObjects, getContentLinksServices } from '@features/contentlinks/contentlinks.module';
import { getCourseExportedObjects, getCourseServices } from '@features/course/course.module';
import { getCoursesServices } from '@features/courses/courses.module';
import { getEditorServices } from '@features/editor/editor.module';
import { getEnrolServices } from '@features/enrol/enrol.module';
import { getFileUploadedServices } from '@features/fileuploader/fileuploader.module';
import { getFilterServices } from '@features/filter/filter.module';
import { getGradesServices } from '@features/grades/grades.module';
import { getH5PServices } from '@features/h5p/h5p.module';
import { getLoginServices } from '@features/login/login.module';
import { getMainMenuServices } from '@features/mainmenu/mainmenu.module';
import { getNativeServices } from '@features/native/native.module';
import { getPushNotificationsServices } from '@features/pushnotifications/pushnotifications.module';
import { getQuestionServices } from '@features/question/question.module';
import { getRatingServices } from '@features/rating/rating.module';
import { getSearchServices } from '@features/search/search.module';
import { getSettingsServices } from '@features/settings/settings.module';
import { getSharedFilesServices } from '@features/sharedfiles/sharedfiles.module';
import { getSiteHomeServices } from '@features/sitehome/sitehome.module';
import { getStyleServices } from '@features/styles/styles.module';
import { getTagServices } from '@features/tag/tag.module';
import { getUsersServices } from '@features/user/user.module';
import { getXAPIServices } from '@features/xapi/xapi.module';

// Import other libraries and providers.
import { DomSanitizer } from '@angular/platform-browser';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CoreConstants, DownloadStatus } from '@/core/constants';
import moment from 'moment-timezone';
import { Md5 } from 'ts-md5/dist/md5';

// Import core classes that can be useful for site plugins.
import { CoreSyncBaseProvider } from '@classes/base-sync';
import { CoreArray } from '@singletons/array';
import { CoreComponentsRegistry } from '@singletons/components-registry';
import { CoreDirectivesRegistry } from '@singletons/directives-registry';
import { CoreDom } from '@singletons/dom';
import { CoreForms } from '@singletons/form';
import { CoreText } from '@singletons/text';
import { CoreTime } from '@singletons/time';
import { CoreUrl } from '@singletons/url';
import { CoreWindow } from '@singletons/window';
import { CoreCache } from '@classes/cache';
import { CoreDelegate } from '@classes/delegate';
import { CoreGeolocationError, CoreGeolocationErrorReason } from '@services/geolocation';
import { getCoreErrorsExportedObjects } from '@classes/errors/errors';
import { CoreNetwork } from '@services/network';

// Import all core modules that define components, directives and pipes.
import { CoreSharedModule } from '@/core/shared.module';
import { CoreCourseComponentsModule } from '@features/course/components/components.module';
import { CoreCourseDirectivesModule } from '@features/course/directives/directives.module';
import { CoreCoursesComponentsModule } from '@features/courses/components/components.module';
import { CoreSitePluginsDirectivesModule } from '@features/siteplugins/directives/directives.module';
import { CoreUserComponentsModule } from '@features/user/components/components.module';
import { CoreQuestionComponentsModule } from '@features/question/components/components.module';
import { CoreBlockComponentsModule } from '@features/block/components/components.module';
import { CoreEditorComponentsModule } from '@features/editor/components/components.module';
import { CoreSearchComponentsModule } from '@features/search/components/components.module';

// Import addon providers. Do not import database module because it causes circular dependencies.
import { getBadgesServices } from '@addons/badges/badges.module';
import { getCalendarServices } from '@addons/calendar/calendar.module';
import { getCompetencyServices } from '@addons/competency/competency.module';
import { getCourseCompletionServices } from '@addons/coursecompletion/coursecompletion.module';
import { getMessageOutputServices } from '@addons/messageoutput/messageoutput.module';
import { getMessagesServices } from '@addons/messages/messages.module';
import { getModAssignComponentModules, getModAssignServices } from '@addons/mod/assign/assign.module';
import { getModQuizComponentModules, getModQuizServices } from '@addons/mod/quiz/quiz.module';
import { getModWorkshopComponentModules, getModWorkshopServices } from '@addons/mod/workshop/workshop.module';
import { getNotesServices } from '@addons/notes/notes.module';
import { getNotificationsServices } from '@addons/notifications/notifications.module';
import { getPrivateFilesServices } from '@addons/privatefiles/privatefiles.module';

// Import some addon modules that define components, directives and pipes. Only import the important ones.
import { CorePromisedValue } from '@classes/promised-value';
import { CorePlatform } from '@services/platform';

import { CoreAutoLogoutService } from '@features/autologout/services/autologout';
import { CoreSitePluginsProvider } from '@features/siteplugins/services/siteplugins';
import { getSitePluginsExportedObjects } from '@features/siteplugins/siteplugins.module';
import { CoreError } from '@classes/errors/error';

/**
 * Service to provide functionalities regarding compiling dynamic HTML and Javascript.
 */
@Injectable({ providedIn: 'root' })
export class CoreCompileProvider {

    protected logger: CoreLogger;

    // Other Ionic/Angular providers that don't depend on where they are injected.
    protected readonly OTHER_SERVICES: unknown[] = [
        TranslateService, HttpClient, DomSanitizer, ActionSheetController, AlertController, LoadingController,
        ModalController, PopoverController, ToastController, FormBuilder,
    ];

    // List of imports for dynamic module. Since the template can have any component we need to import all core components modules.
    protected readonly IMPORTS = [
        CoreSharedModule,
        CoreCourseComponentsModule,
        CoreCoursesComponentsModule,
        CoreUserComponentsModule,
        CoreCourseDirectivesModule,
        CoreQuestionComponentsModule,
        CoreBlockComponentsModule,
        CoreEditorComponentsModule,
        CoreSearchComponentsModule,
        CoreSitePluginsDirectivesModule,
    ];

    protected readonly LAZY_IMPORTS = [
        getModAssignComponentModules,
        getModQuizComponentModules,
        getModWorkshopComponentModules,
    ];

    protected componentId = 0;
    protected libraries?: unknown[];
    protected exportedObjects?: Record<string, unknown>;

    constructor(protected injector: Injector) {
        this.logger = CoreLogger.getInstance('CoreCompileProvider');
    }

    /**
     * Create and compile a dynamic component.
     *
     * @param template The template of the component.
     * @param componentClass The JS class of the component.
     * @param viewContainerRef View container reference to inject the component.
     * @param extraImports Extra imported modules if needed and not imported by this class.
     * @returns Promise resolved with the component reference.
     */
    async createAndCompileComponent<T = unknown>(
        template: string,
        componentClass: Type<T>,
        viewContainerRef: ViewContainerRef,
        extraImports: any[] = [], // eslint-disable-line @typescript-eslint/no-explicit-any
    ): Promise<ComponentRef<T> | undefined> {
        // Import the Angular compiler to be able to compile components in runtime.
        await import('@angular/compiler');

        // Create the component using the template and the class.
        const component = Component({ template, host: { 'compiled-component-id': String(this.componentId++) } })(componentClass);

        const lazyImports = await Promise.all(this.LAZY_IMPORTS.map(getModules => getModules()));
        const imports = [
            ...lazyImports.flat(),
            ...this.IMPORTS,
            ...extraImports,
        ];

        try {
            viewContainerRef.clear();

            // Now create the module containing the component.
            const ngModuleRef = createNgModule(
                NgModule({ imports, declarations: [component], schemas: [NO_ERRORS_SCHEMA] })(class {}),
                this.injector,
            );

            return viewContainerRef.createComponent(
                component,
                {
                    environmentInjector: ngModuleRef,
                },
            );
        } catch (error) {
            this.logger.error('Error compiling template', template);
            this.logger.error(error);
            error.message = 'Template has some errors and cannot be displayed.';

            throw error;
        }
    }

    /**
     * Eval some javascript using the context of the function.
     *
     * @param javascript The javascript to eval.
     * @returns Result of the eval.
     */
    protected evalInContext(javascript: string): unknown {
        // eslint-disable-next-line no-eval
        return eval(javascript);
    }

    /**
     * Execute some javascript code, using a certain instance as the context.
     *
     * @param instance Instance to use as the context. In the JS code, "this" will be this instance.
     * @param javascript The javascript code to eval.
     * @returns Result of the javascript execution.
     */
    executeJavascript(instance: unknown, javascript: string): unknown {
        try {
            return this.evalInContext.call(instance, javascript);
        } catch (ex) {
            this.logger.error('Error evaluating javascript', ex);
        }
    }

    /**
     * Inject all the core libraries in a certain object.
     *
     * @param instance The instance where to inject the libraries.
     * @param extraLibraries Extra imported providers if needed and not imported by this class.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    injectLibraries(instance: any, extraLibraries: Type<unknown>[] = []): void {
        if (!this.libraries || !this.exportedObjects) {
            throw new CoreError('Libraries not loaded. You need to call loadLibraries before calling injectLibraries.');
        }

        const libraries = [
            ...this.libraries,
            ...extraLibraries,
        ];

        // We cannot inject anything to this constructor. Use the Injector to inject all the providers into the instance.
        for (const i in libraries) {
            const libraryDef = libraries[i];
            if (typeof libraryDef === 'function' && libraryDef.name) {
                try {
                    // Inject the provider to the instance. We use the class name as the property name.
                    instance[libraryDef.name.replace(/DelegateService$/, 'Delegate')] = this.injector.get<Provider>(libraryDef);
                } catch (ex) {
                    this.logger.error('Error injecting provider', libraryDef.name, ex);
                }
            }
        }

        // Inject current service.
        instance['CoreCompileProvider'] = this;

        // Add some final classes.
        instance['injector'] = this.injector;
        instance['Validators'] = Validators;
        instance['CoreConstants'] = CoreConstants;
        instance['DownloadStatus'] = DownloadStatus;
        instance['CoreConfigConstants'] = CoreConstants.CONFIG;
        instance['CoreEventsProvider'] = CoreEvents;
        instance['CoreLoggerProvider'] = CoreLogger;
        instance['moment'] = moment;
        instance['Md5'] = Md5;
        instance['Network'] = CoreNetwork.instance; // @deprecated since 4.1, plugins should use CoreNetwork instead.
        instance['Platform'] = CorePlatform.instance; // @deprecated since 4.1, plugins should use CorePlatform instead.
        instance['CoreSyncBaseProvider'] = CoreSyncBaseProvider;
        instance['CoreArray'] = CoreArray;
        // eslint-disable-next-line deprecation/deprecation
        instance['CoreComponentsRegistry'] = CoreComponentsRegistry;
        instance['CoreDirectivesRegistry'] = CoreDirectivesRegistry;
        instance['CoreNetwork'] = CoreNetwork.instance;
        instance['CorePlatform'] = CorePlatform.instance;
        instance['CoreDom'] = CoreDom;
        instance['CoreForms'] = CoreForms;
        instance['CoreText'] = CoreText;
        instance['CoreTime'] = CoreTime;
        instance['CoreUrl'] = CoreUrl;
        instance['CoreWindow'] = CoreWindow;
        instance['CoreCache'] = CoreCache; // @deprecated since 4.4, plugins should use plain objects instead.
        instance['CoreDelegate'] = CoreDelegate;
        instance['CorePromisedValue'] = CorePromisedValue;
        instance['CoreGeolocationError'] = CoreGeolocationError;
        instance['CoreGeolocationErrorReason'] = CoreGeolocationErrorReason;

        // Inject exported objects.
        for (const name in this.exportedObjects) {
            instance[name] = this.exportedObjects[name];
        }
    }

    /**
     * Load all the libraries needed for the compile service.
     */
    async loadLibraries(): Promise<void> {
        if (!this.libraries) {
            this.libraries = await this.getLibraries();
        }

        if (!this.exportedObjects) {
            this.exportedObjects = await this.getExportedObjects();
        }
    }

    /**
     * Get lazy libraries to inject.
     *
     * @returns Lazy libraries.
     */
    protected async getLibraries(): Promise<unknown[]> {
        const services = await Promise.all([
            getCoreServices(),
            getBlockServices(),
            getCommentsServices(),
            getContentLinksServices(),
            getCourseServices(),
            getCoursesServices(),
            getEditorServices(),
            getEnrolServices(),
            getFileUploadedServices(),
            getFilterServices(),
            getGradesServices(),
            getH5PServices(),
            getLoginServices(),
            getMainMenuServices(),
            getNativeServices(),
            getPushNotificationsServices(),
            getQuestionServices(),
            getRatingServices(),
            getSearchServices(),
            getSettingsServices(),
            getSharedFilesServices(),
            getSiteHomeServices(),
            getStyleServices(),
            getTagServices(),
            getUsersServices(),
            getXAPIServices(),
            getBadgesServices(),
            getCalendarServices(),
            getCompetencyServices(),
            getCourseCompletionServices(),
            getMessageOutputServices(),
            getMessagesServices(),
            getModAssignServices(),
            getModQuizServices(),
            getModWorkshopServices(),
            getNotesServices(),
            getNotificationsServices(),
            getPrivateFilesServices(),
        ]);

        const lazyLibraries = services.flat();

        return [
            ...lazyLibraries,
            CoreAutoLogoutService,
            CoreSitePluginsProvider,
            ...this.OTHER_SERVICES,
        ];
    }

    /**
     * Get lazy exported objects to inject.
     *
     * @returns Lazy exported objects.
     */
    protected async getExportedObjects(): Promise<Record<string, unknown>> {
        const objects = await Promise.all([
            getCoreErrorsExportedObjects(),
            getCourseExportedObjects(),
            getContentLinksExportedObjects(),
            getSitePluginsExportedObjects(),
        ]);

        return Object.assign({}, ...objects);
    }

}

export const CoreCompile = makeSingleton(CoreCompileProvider);
