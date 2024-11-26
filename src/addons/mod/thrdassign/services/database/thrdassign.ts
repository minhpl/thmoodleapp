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

import { CoreSiteSchema } from '@services/sites';

/**
 * Database variables for AddonModThrdAssignOfflineProvider.
 */
export const SUBMISSIONS_TABLE = 'addon_mod_thrdassign_submissions';
export const SUBMISSIONS_GRADES_TABLE = 'addon_mod_thrdassign_submissions_grading';
export const OFFLINE_SITE_SCHEMA: CoreSiteSchema = {
    name: 'AddonModThrdAssignOfflineProvider',
    version: 1,
    tables: [
        {
            name: SUBMISSIONS_TABLE,
            columns: [
                {
                    name: 'thrdassignid',
                    type: 'INTEGER',
                },
                {
                    name: 'courseid',
                    type: 'INTEGER',
                },
                {
                    name: 'userid',
                    type: 'INTEGER',
                },
                {
                    name: 'plugindata',
                    type: 'TEXT',
                },
                {
                    name: 'onlinetimemodified',
                    type: 'INTEGER',
                },
                {
                    name: 'timecreated',
                    type: 'INTEGER',
                },
                {
                    name: 'timemodified',
                    type: 'INTEGER',
                },
                {
                    name: 'submitted',
                    type: 'INTEGER',
                },
                {
                    name: 'submissionstatement',
                    type: 'INTEGER',
                },
            ],
            primaryKeys: ['thrdassignid', 'userid'],
        },
        {
            name: SUBMISSIONS_GRADES_TABLE,
            columns: [
                {
                    name: 'thrdassignid',
                    type: 'INTEGER',
                },
                {
                    name: 'courseid',
                    type: 'INTEGER',
                },
                {
                    name: 'userid',
                    type: 'INTEGER',
                },
                {
                    name: 'grade',
                    type: 'REAL',
                },
                {
                    name: 'attemptnumber',
                    type: 'INTEGER',
                },
                {
                    name: 'addattempt',
                    type: 'INTEGER',
                },
                {
                    name: 'workflowstate',
                    type: 'TEXT',
                },
                {
                    name: 'applytoall',
                    type: 'INTEGER',
                },
                {
                    name: 'outcomes',
                    type: 'TEXT',
                },
                {
                    name: 'plugindata',
                    type: 'TEXT',
                },
                {
                    name: 'timemodified',
                    type: 'INTEGER',
                },
            ],
            primaryKeys: ['thrdassignid', 'userid'],
        },
    ],
};

/**
 * Data about assign submissions to sync.
 */
export type AddonModThrdAssignSubmissionsDBRecord = {
    thrdassignid: number; // Primary key.
    userid: number; // Primary key.
    courseid: number;
    plugindata: string;
    onlinetimemodified: number;
    timecreated: number;
    timemodified: number;
    submitted: number;
    submissionstatement?: number;
};

/**
 * Data about assign submission grades to sync.
 */
export type AddonModThrdAssignSubmissionsGradingDBRecord = {
    thrdassignid: number; // Primary key.
    userid: number; // Primary key.
    courseid: number;
    grade: number; // Real.
    attemptnumber: number;
    addattempt: number;
    workflowstate: string;
    applytoall: number;
    outcomes: string;
    plugindata: string;
    timemodified: number;
};
