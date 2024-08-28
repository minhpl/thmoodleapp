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

import { DownloadStatus } from '@/core/constants';
import { isSafeNumber, safeNumber, SafeNumber } from '@/core/utils/types';
import { Component, OnDestroy, OnInit, Optional } from '@angular/core';

import { CoreCourseModuleMainActivityComponent } from '@features/course/classes/main-activity-component';
import { CoreCourseContentsPage } from '@features/course/pages/contents/contents';
import { CoreQuestionBehaviourDelegate } from '@features/question/services/behaviour-delegate';
import { IonContent } from '@ionic/angular';
import { CoreNavigator } from '@services/navigator';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreTextUtils } from '@services/utils/text';
import { CoreUtils } from '@services/utils/utils';
import { Translate } from '@singletons';
import { CoreEventObserver, CoreEvents } from '@singletons/events';
import { AddonModQuizModuleHandlerService } from '../../services/handlers/module';
import { AddonModQuizPrefetchHandler } from '../../services/handlers/prefetch';
import {
    AddonModQuiz,
    AddonModQuizAttemptFinishedData,
    AddonModQuizAttemptWSData,
    AddonModQuizCombinedReviewOptions,
    AddonModQuizGetAttemptAccessInformationWSResponse,
    AddonModQuizGetQuizAccessInformationWSResponse,
    AddonModQuizGetUserBestGradeWSResponse,
    AddonModQuizWSAdditionalData,
} from '../../services/quiz';
import { AddonModQuizAttempt, AddonModQuizHelper, AddonModQuizQuizData } from '../../services/quiz-helper';
import {
    AddonModQuizAutoSyncData,
    AddonModQuizSync,
    AddonModQuizSyncProvider,
    AddonModQuizSyncResult,
} from '../../services/quiz-sync';
import { ADDON_MOD_QUIZ_ATTEMPT_FINISHED_EVENT, ADDON_MOD_QUIZ_COMPONENT, AddonModQuizAttemptStates } from '../../constants';
import { QuestionDisplayOptionsMarks } from '@features/question/constants';

/**
 * Component that displays a quiz entry page.
 */
@Component({
    selector: 'addon-mod-quiz-index',
    templateUrl: 'addon-mod-quiz-index.html',
    styleUrls: ['index.scss'],
})
export class AddonModQuizIndexComponent extends CoreCourseModuleMainActivityComponent implements OnInit, OnDestroy {

    component = ADDON_MOD_QUIZ_COMPONENT;
    pluginName = 'quiz';
    quiz?: AddonModQuizQuizData; // The quiz.
    now?: number; // Current time.
    syncTime?: string; // Last synchronization time.
    hasOffline = false; // Whether the quiz has offline data.
    hasSupportedQuestions = false; // Whether the quiz has at least 1 supported question.
    accessRules: string[] = []; // List of access rules of the quiz.
    unsupportedRules: string[] = []; // List of unsupported access rules of the quiz.
    unsupportedQuestions: string[] = []; // List of unsupported question types of the quiz.
    behaviourSupported = false; // Whether the quiz behaviour is supported.
    showResults = false; // Whether to show the result of the quiz (grade, etc.).
    gradeOverridden = false; // Whether grade has been overridden.
    gradebookFeedback?: string; // The feedback in the gradebook.
    gradeResult?: string; // Message with the grade.
    overallFeedback?: string; // The feedback for the grade.
    buttonText?: string; // Text to display in the start/continue button.
    preventMessages: string[] = []; // List of messages explaining why the quiz cannot be attempted.
    showStatusSpinner = true; // Whether to show a spinner due to quiz status.
    gradeMethodReadable?: string; // Grade method in a readable format.
    showReviewColumn = false; // Whether to show the review column.
    attempts: QuizAttempt[] = []; // List of attempts the user has made.
    bestGrade?: AddonModQuizGetUserBestGradeWSResponse; // Best grade data.

    protected fetchContentDefaultError = 'addon.mod_quiz.errorgetquiz'; // Default error to show when loading contents.
    protected syncEventName = AddonModQuizSyncProvider.AUTO_SYNCED;

    protected autoReview?: AddonModQuizAttemptFinishedData; // Data to auto-review an attempt after finishing.
    protected quizAccessInfo?: AddonModQuizGetQuizAccessInformationWSResponse; // Quiz access info.
    protected attemptAccessInfo?: AddonModQuizGetAttemptAccessInformationWSResponse; // Last attempt access info.
    protected moreAttempts = false; // Whether user can create/continue attempts.
    protected options?: AddonModQuizCombinedReviewOptions; // Combined review options.
    protected gradebookData?: { grade?: SafeNumber; feedback?: string }; // The gradebook grade and feedback.
    protected overallStats = false; // Equivalent to overallstats in mod_quiz_view_object in Moodle.
    protected finishedObserver?: CoreEventObserver; // It will observe attempt finished events.
    protected hasPlayed = false; // Whether the user has gone to the quiz player (attempted).
    protected candidateQuiz?: AddonModQuizQuizData;

    constructor(
        protected content?: IonContent,
        @Optional() courseContentsPage?: CoreCourseContentsPage,
    ) {
        super('AddonModQuizIndexComponent', content, courseContentsPage);
    }

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        super.ngOnInit();

        // Listen for attempt finished events.
        this.finishedObserver = CoreEvents.on(
            ADDON_MOD_QUIZ_ATTEMPT_FINISHED_EVENT,
            (data) => {
                // Go to review attempt if an attempt in this quiz was finished and synced.
                if (this.quiz && data.quizId == this.quiz.id) {
                    this.autoReview = data;
                }
            },
            this.siteId,
        );

        await this.loadContent(false, true);
    }

    /**
     * Attempt the quiz.
     *
     * @returns Promise resolved when done.
     */
    async attemptQuiz(): Promise<void> {
        if (this.showStatusSpinner || !this.quiz) {
            // Quiz is being downloaded or synchronized, abort.
            return;
        }

        if (!AddonModQuiz.isQuizOffline(this.quiz)) {
            // Quiz isn't offline, just open it.
            return this.openQuiz();
        }

        // Quiz supports offline, check if it needs to be downloaded.
        // If the site doesn't support check updates, always prefetch it because we cannot tell if there's something new.
        const isDownloaded = this.currentStatus === DownloadStatus.DOWNLOADED;

        if (isDownloaded) {
            // Already downloaded, open it.
            return this.openQuiz();
        }

        // Prefetch the quiz.
        this.showStatusSpinner = true;

        try {
            await AddonModQuizPrefetchHandler.prefetch(this.module, this.courseId, true);

            // Success downloading, open quiz.
            this.openQuiz();
        } catch (error) {
            if (this.hasOffline) {
                // Error downloading but there is something offline, allow continuing it.
                // If the site doesn't support check updates, continue too because we cannot tell if there's something new.
                this.openQuiz();
            } else {
                CoreDomUtils.showErrorModalDefault(error, 'core.errordownloading', true);
            }
        } finally {
            this.showStatusSpinner = false;
        }
    }

    /**
     * @inheritdoc
     */
    protected async fetchContent(refresh?: boolean, sync = false, showErrors = false): Promise<void> {
        // First get the quiz instance.
        const quiz = await AddonModQuiz.getQuiz(this.courseId, this.module.id);

        this.gradeMethodReadable = AddonModQuiz.getQuizGradeMethod(quiz.grademethod);
        this.now = Date.now();
        this.dataRetrieved.emit(quiz);
        this.description = quiz.intro || this.description;
        this.candidateQuiz = quiz;

        // Try to get warnings from automatic sync.
        const warnings = await AddonModQuizSync.getSyncWarnings(quiz.id);

        if (warnings?.length) {
            // Show warnings and delete them so they aren't shown again.
            CoreDomUtils.showErrorModal(CoreTextUtils.buildMessage(warnings));

            await AddonModQuizSync.setSyncWarnings(quiz.id, []);
        }

        if (AddonModQuiz.isQuizOffline(quiz)) {
            if (sync) {
                // Try to sync the quiz.
                await CoreUtils.ignoreErrors(this.syncActivity(showErrors));
            }
        } else {
            this.showStatusSpinner = false;
        }

        if (AddonModQuiz.isQuizOffline(quiz)) {
            // Handle status.
            this.setStatusListener();

            // Get last synchronization time and check if sync button should be seen.
            this.syncTime = await AddonModQuizSync.getReadableSyncTime(quiz.id);
            this.hasOffline = await AddonModQuizSync.hasDataToSync(quiz.id);
        }

        // Get quiz access info.
        this.quizAccessInfo = await AddonModQuiz.getQuizAccessInformation(quiz.id, { cmId: this.module.id });

        this.showReviewColumn = this.quizAccessInfo.canreviewmyattempts;
        this.accessRules = this.quizAccessInfo.accessrules;
        this.unsupportedRules = AddonModQuiz.getUnsupportedRules(this.quizAccessInfo.activerulenames);

        if (quiz.preferredbehaviour) {
            this.behaviourSupported = CoreQuestionBehaviourDelegate.isBehaviourSupported(quiz.preferredbehaviour);
        }

        // Get question types in the quiz.
        const types = await AddonModQuiz.getQuizRequiredQtypes(quiz.id, { cmId: this.module.id });

        this.unsupportedQuestions = AddonModQuiz.getUnsupportedQuestions(types);
        this.hasSupportedQuestions = !!types.find((type) => type != 'random' && this.unsupportedQuestions.indexOf(type) == -1);

        await this.getAttempts(quiz, this.quizAccessInfo);

        // Quiz is ready to be shown, move it to the variable that is displayed.
        this.quiz = quiz;
    }

    /**
     * Get the user attempts in the quiz and the result info.
     *
     * @param quiz Quiz instance.
     * @returns Promise resolved when done.
     */
    protected async getAttempts(
        quiz: AddonModQuizQuizData,
        accessInfo: AddonModQuizGetQuizAccessInformationWSResponse,
    ): Promise<void> {
        // Always get the best grade because it includes the grade to pass.
        this.bestGrade = await AddonModQuiz.getUserBestGrade(quiz.id, { cmId: this.module.id });

        // Get access information of last attempt (it also works if no attempts made).
        this.attemptAccessInfo = await AddonModQuiz.getAttemptAccessInformation(quiz.id, 0, { cmId: this.module.id });

        // Get attempts.
        const attempts = await AddonModQuiz.getUserAttempts(quiz.id, { cmId: this.module.id });

        this.attempts = await this.treatAttempts(quiz, accessInfo, attempts);

        // Check if user can create/continue attempts.
        if (this.attempts.length) {
            const last = this.attempts[0];
            this.moreAttempts = !AddonModQuiz.isAttemptCompleted(last.state) || !this.attemptAccessInfo.isfinished;
        } else {
            this.moreAttempts = !this.attemptAccessInfo.isfinished;
        }

        this.getButtonText(quiz);

        await this.getResultInfo(quiz);
    }

    /**
     * Get the text to show in the button. It also sets restriction messages if needed.
     *
     * @param quiz Quiz.
     */
    protected getButtonText(quiz: AddonModQuizQuizData): void {
        this.buttonText = '';

        if (quiz.hasquestions !== 0) {
            if (this.attempts.length && !AddonModQuiz.isAttemptCompleted(this.attempts[0].state)) {
                // Last attempt is unfinished.
                if (this.quizAccessInfo?.canattempt) {
                    this.buttonText = 'addon.mod_quiz.continueattemptquiz';
                } else if (this.quizAccessInfo?.canpreview) {
                    this.buttonText = 'addon.mod_quiz.continuepreview';
                }

            } else {
                // Last attempt is finished or no attempts.
                if (this.quizAccessInfo?.canattempt) {
                    this.preventMessages = this.attemptAccessInfo?.preventnewattemptreasons || [];
                    if (!this.preventMessages.length) {
                        if (!this.attempts.length) {
                            this.buttonText = 'addon.mod_quiz.attemptquiznow';
                        } else {
                            this.buttonText = 'addon.mod_quiz.reattemptquiz';
                        }
                    }
                } else if (this.quizAccessInfo?.canpreview) {
                    this.buttonText = 'addon.mod_quiz.previewquiznow';
                }
            }
        }

        if (!this.buttonText) {
            return;
        }

        // So far we think a button should be printed, check if they will be allowed to access it.
        this.preventMessages = this.quizAccessInfo?.preventaccessreasons || [];

        if (!this.moreAttempts) {
            this.buttonText = '';
        } else if (this.quizAccessInfo?.canattempt && this.preventMessages.length) {
            this.buttonText = '';
        } else if (!this.hasSupportedQuestions || this.unsupportedRules.length || !this.behaviourSupported) {
            this.buttonText = '';
        }
    }

    /**
     * Get result info to show.
     *
     * @param quiz Quiz.
     * @returns Promise resolved when done.
     */
    protected async getResultInfo(quiz: AddonModQuizQuizData): Promise<void> {
        if (!this.attempts.length || !quiz.showAttemptsGrades || !this.bestGrade?.hasgrade ||
            this.gradebookData?.grade === undefined) {
            this.showResults = false;

            return;
        }

        const bestGrade = this.bestGrade.grade;
        const formattedGradebookGrade = AddonModQuiz.formatGrade(this.gradebookData.grade, quiz.decimalpoints);
        const formattedBestGrade = AddonModQuiz.formatGrade(bestGrade, quiz.decimalpoints);
        let gradeToShow = formattedGradebookGrade; // By default we show the grade in the gradebook.

        this.showResults = true;
        this.gradeOverridden = formattedGradebookGrade != formattedBestGrade;
        this.gradebookFeedback = this.gradebookData.feedback;

        if (bestGrade && bestGrade > this.gradebookData.grade && this.gradebookData.grade == quiz.grade) {
            // The best grade is higher than the max grade for the quiz.
            // We'll do like Moodle web and show the best grade instead of the gradebook grade.
            this.gradeOverridden = false;
            gradeToShow = formattedBestGrade;
        }

        this.gradeResult = Translate.instant('core.grades.gradelong', { $a: {
            grade: gradeToShow,
            max: quiz.gradeFormatted,
        } });

        if (quiz.showFeedback) {
            // Get the quiz overall feedback.
            const response = await AddonModQuiz.getFeedbackForGrade(quiz.id, this.gradebookData.grade, {
                cmId: this.module.id,
            });

            this.overallFeedback = response.feedbacktext;
        }
    }

    /**
     * @inheritdoc
     */
    protected async logActivity(): Promise<void> {
        if (!this.quiz) {
            return; // Shouldn't happen.
        }

        await CoreUtils.ignoreErrors(AddonModQuiz.logViewQuiz(this.quiz.id));

        this.analyticsLogEvent('mod_quiz_view_quiz');
    }

    /**
     * Go to review an attempt that has just been finished.
     *
     * @returns Promise resolved when done.
     */
    protected async goToAutoReview(attempts: AddonModQuizAttemptWSData[]): Promise<void> {
        if (!this.autoReview) {
            return;
        }

        // If we go to auto review it means an attempt was finished. Check completion status.
        this.checkCompletion();

        // Verify that user can see the review.
        const attempt = attempts.find(attempt => attempt.id === this.autoReview?.attemptId);
        this.autoReview = undefined;

        if (!this.quiz || !this.quizAccessInfo || !attempt) {
            return;
        }

        const canReview = await AddonModQuizHelper.canReviewAttempt(this.quiz, this.quizAccessInfo, attempt);
        if (!canReview) {
            return;
        }

        await this.reviewAttempt(attempt.id);
    }

    /**
     * @inheritdoc
     */
    protected hasSyncSucceed(result: AddonModQuizSyncResult): boolean {
        if (result.attemptFinished) {
            // An attempt was finished, check completion status.
            this.checkCompletion();
        }

        // If the sync call isn't rejected it means the sync was successful.
        return result.updated;
    }

    /**
     * User entered the page that contains the component.
     */
    async ionViewDidEnter(): Promise<void> {
        super.ionViewDidEnter();

        if (!this.hasPlayed) {
            this.autoReview = undefined;

            return;
        }

        this.hasPlayed = false;

        // Refresh data.
        this.showLoading = true;
        this.content?.scrollToTop();

        await CoreUtils.ignoreErrors(this.refreshContent(true));

        this.showLoading = false;
        this.autoReview = undefined;
    }

    /**
     * User left the page that contains the component.
     */
    ionViewDidLeave(): void {
        super.ionViewDidLeave();
        this.autoReview = undefined;
    }

    /**
     * Perform the invalidate content function.
     *
     * @returns Resolved when done.
     */
    protected async invalidateContent(): Promise<void> {
        const promises: Promise<void>[] = [];

        promises.push(AddonModQuiz.invalidateQuizData(this.courseId));

        if (this.quiz) {
            promises.push(AddonModQuiz.invalidateUserAttemptsForUser(this.quiz.id));
            promises.push(AddonModQuiz.invalidateQuizAccessInformation(this.quiz.id));
            promises.push(AddonModQuiz.invalidateQuizRequiredQtypes(this.quiz.id));
            promises.push(AddonModQuiz.invalidateAttemptAccessInformation(this.quiz.id));
            promises.push(AddonModQuiz.invalidateCombinedReviewOptionsForUser(this.quiz.id));
            promises.push(AddonModQuiz.invalidateUserBestGradeForUser(this.quiz.id));
            promises.push(AddonModQuiz.invalidateGradeFromGradebook(this.courseId));
        }

        await Promise.all(promises);
    }

    /**
     * Compares sync event data with current data to check if refresh content is needed.
     *
     * @param syncEventData Data receiven on sync observer.
     * @returns True if refresh is needed, false otherwise.
     */
    protected isRefreshSyncNeeded(syncEventData: AddonModQuizAutoSyncData): boolean {
        if (!this.courseId || !this.module) {
            return false;
        }

        if (syncEventData.attemptFinished) {
            // An attempt was finished, check completion status.
            this.checkCompletion();
        }

        if (this.quiz && syncEventData.quizId == this.quiz.id) {
            this.content?.scrollToTop();

            return true;
        }

        return false;
    }

    /**
     * Open a quiz to attempt it.
     */
    protected openQuiz(): void {
        this.hasPlayed = true;

        CoreNavigator.navigateToSitePath(
            `${AddonModQuizModuleHandlerService.PAGE_NAME}/${this.courseId}/${this.module.id}/player`,
            {
                params: {
                    moduleUrl: this.module.url,
                },
            },
        );
    }

    /**
     * Displays some data based on the current status.
     *
     * @param status The current status.
     * @param previousStatus The previous status. If not defined, there is no previous status.
     */
    protected showStatus(status: DownloadStatus, previousStatus?: DownloadStatus): void {
        this.showStatusSpinner = status === DownloadStatus.DOWNLOADING;

        if (status === DownloadStatus.DOWNLOADED && previousStatus === DownloadStatus.DOWNLOADING) {
            // Quiz downloaded now, maybe a new attempt was created. Load content again.
            this.showLoadingAndFetch();
        }
    }

    /**
     * @inheritdoc
     */
    protected async sync(): Promise<AddonModQuizSyncResult> {
        if (!this.candidateQuiz) {
            return {
                warnings: [],
                attemptFinished: false,
                updated: false,
            };
        }

        return AddonModQuizSync.syncQuiz(this.candidateQuiz, true);
    }

    /**
     * Treat user attempts.
     *
     * @param quiz Quiz data.
     * @param accessInfo Quiz access information.
     * @param attempts The attempts to treat.
     * @returns Promise resolved when done.
     */
    protected async treatAttempts(
        quiz: AddonModQuizQuizData,
        accessInfo: AddonModQuizGetQuizAccessInformationWSResponse,
        attempts: AddonModQuizAttemptWSData[],
    ): Promise<QuizAttempt[]> {
        if (!attempts || !attempts.length) {
            // There are no attempts to treat.
            quiz.gradeFormatted = AddonModQuiz.formatGrade(quiz.grade, quiz.decimalpoints);

            return [];
        }

        const lastCompleted = AddonModQuiz.getLastCompletedAttemptFromList(attempts);
        let openReview = false;

        if (this.autoReview && lastCompleted && lastCompleted.id >= this.autoReview.attemptId) {
            // User just finished an attempt in offline and it seems it's been synced, since it's finished in online.
            // Go to the review of this attempt if the user hasn't left this view.
            if (!this.isDestroyed && this.isCurrentView) {
                openReview = true;
            }
        }

        const [options] = await Promise.all([
            AddonModQuiz.getCombinedReviewOptions(quiz.id, { cmId: this.module.id }),
            this.getQuizGrade(),
            openReview ? this.goToAutoReview(attempts) : undefined,
        ]);

        this.options = options;

        AddonModQuizHelper.setQuizCalculatedData(quiz, this.options);

        this.overallStats = !!lastCompleted && this.options.alloptions.marks >= QuestionDisplayOptionsMarks.MARK_AND_MAX;

        // Calculate data to show for each attempt.
        const formattedAttempts = await Promise.all(attempts.map(async (attempt) => {
            const [formattedAttempt, canReview] = await Promise.all([
                AddonModQuizHelper.setAttemptCalculatedData(quiz, attempt) as Promise<QuizAttempt>,
                AddonModQuizHelper.canReviewAttempt(quiz, accessInfo, attempt),
            ]);

            formattedAttempt.canReview = canReview;
            if (!canReview) {
                formattedAttempt.cannotReviewMessage = AddonModQuizHelper.getCannotReviewMessage(quiz, attempt, true);
            }

            if (quiz.showFeedback && attempt.state === AddonModQuizAttemptStates.FINISHED &&
                    options.someoptions.overallfeedback && isSafeNumber(formattedAttempt.rescaledGrade)) {

                // Feedback should be displayed, get the feedback for the grade.
                const response = await AddonModQuiz.getFeedbackForGrade(quiz.id, formattedAttempt.rescaledGrade, {
                    cmId: quiz.coursemodule,
                });

                if (response.feedbacktext) {
                    formattedAttempt.additionalData = [
                        {
                            id: 'feedback',
                            title: Translate.instant('addon.mod_quiz.feedback'),
                            content: response.feedbacktext,
                        },
                    ];
                }
            }

            return formattedAttempt;
        }));

        return formattedAttempts.reverse();
    }

    /**
     * Get quiz grade data.
     *
     * @returns Promise resolved when done.
     */
    protected async getQuizGrade(): Promise<void> {
        try {
            // Get gradebook grade.
            const data = await AddonModQuiz.getGradeFromGradebook(this.courseId, this.module.id);

            if (data) {
                const grade = data.graderaw ?? (data.grade !== undefined && data.grade !== null ? Number(data.grade) : undefined);

                this.gradebookData = {
                    grade: safeNumber(grade),
                    feedback: data.feedback,
                };
            }
        } catch {
            // Fallback to quiz best grade if failure or not found.
            this.gradebookData = {
                grade: this.bestGrade?.grade,
            };
        }
    }

    /**
     * Go to page to review the attempt.
     *
     * @returns Promise resolved when done.
     */
    async reviewAttempt(attemptId: number): Promise<void> {
        await CoreNavigator.navigateToSitePath(
            `${AddonModQuizModuleHandlerService.PAGE_NAME}/${this.courseId}/${this.module.id}/review/${attemptId}`,
        );
    }

    /**
     * @inheritdoc
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();

        this.finishedObserver?.off();
    }

}

type QuizAttempt = AddonModQuizAttempt & {
    canReview?: boolean;
    cannotReviewMessage?: string;
    additionalData?: AddonModQuizWSAdditionalData[]; // Additional data to display for the attempt.
};
