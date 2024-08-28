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

import { CoreReminderData, CoreReminders, CoreRemindersService } from '@features/reminders/services/reminders';
import { Component, Input, OnInit } from '@angular/core';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreRemindersSetReminderMenuComponent } from '../set-reminder-menu/set-reminder-menu';
import { Translate } from '@singletons';
import { CoreTimeUtils } from '@services/utils/time';

/**
 * Component that displays a button to set a reminder.
 */
@Component({
    selector: 'core-reminders-set-button',
    templateUrl: 'set-button.html',
})
export class CoreRemindersSetButtonComponent implements OnInit {

    @Input() component?: string;
    @Input() instanceId?: number;
    @Input() type?: string;
    @Input() label = '';
    @Input() initialTimebefore?: number;
    @Input() time = -1;
    @Input() title = '';
    @Input() url = '';

    labelClean = '';
    timebefore?: number;
    reminderMessage?: string;

    /**
     * @inheritdoc
     */
    ngOnInit(): void {
        this.labelClean = this.label.replace(':', '');

        this.setTimebefore(this.initialTimebefore);
    }

    /**
     * Set reminder.
     *
     * @param ev Click event.
     */
    async setReminder(ev: Event): Promise<void> {
        if (this.component === undefined || this.instanceId === undefined || this.type === undefined) {
            return;
        }

        ev.preventDefault();
        ev.stopPropagation();

        if (this.timebefore === undefined) {
            // Set it to the time of the event.
            this.saveReminder(0);

            return;
        }

        // Open popover.
        const reminderTime = await CoreDomUtils.openPopover<{timeBefore: number}>({
            component: CoreRemindersSetReminderMenuComponent,
            componentProps: {
                initialValue: this.timebefore,
                eventTime: this.time,
                noReminderLabel: 'core.reminders.delete',
            },
            event: ev,
        });

        if (reminderTime === undefined) {
            // User canceled.
            return;
        }

        // Save before.
        this.saveReminder(reminderTime.timeBefore);
    }

    /**
     * Update time before.
     */
    setTimebefore(timebefore: number | undefined): void {
        this.timebefore = timebefore;

        if (this.timebefore !== undefined) {
            const reminderTime = this.time - this.timebefore;

            this.reminderMessage = Translate.instant('core.reminders.reminderset', {
                $a: CoreTimeUtils.userDate(reminderTime * 1000),
            });
        } else {
            this.reminderMessage = undefined;
        }
    }

    /**
     * Save reminder.
     *
     * @param timebefore Time before the event to fire the notification.
     * @returns Promise resolved when done.
     */
    protected async saveReminder(timebefore: number): Promise<void> {
        if (this.component === undefined || this.instanceId === undefined || this.type === undefined) {
            return;
        }

        // Remove previous the reminders.
        await CoreReminders.removeReminders({
            instanceId: this.instanceId,
            component: this.component,
            type: this.type,
        });

        if (timebefore === undefined || timebefore === CoreRemindersService.DISABLED) {
            this.setTimebefore(undefined);
            CoreDomUtils.showToast('core.reminders.reminderunset', true);

            return;
        }

        this.setTimebefore(timebefore);

        const reminder: CoreReminderData = {
            timebefore,
            component: this.component,
            instanceId: this.instanceId,
            type: this.type,
            title: this.label + ' ' + this.title,
            url: this.url,
            time: this.time,
        };

        // Save before.
        await CoreReminders.addReminder(reminder);

        const time = this.time - timebefore;
        const text = Translate.instant('core.reminders.reminderset', { $a: CoreTimeUtils.userDate(time * 1000) });
        CoreDomUtils.showToast(text);
    }

}
