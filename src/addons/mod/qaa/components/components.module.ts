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

import { NgModule } from '@angular/core';

import { CoreSharedModule } from '@/core/shared.module';
import { CoreCourseComponentsModule } from '@features/course/components/components.module';

import { AddonModQaaIndexComponent } from './index/index';

import { AddonModQaaAddQuestionComponent } from './add-question/add';

import { AddonModQaaAnswerComponent } from './answer/answer';

import { AddonModQaaEditAnswerComponent } from './edit_answer/edit';

import { AddonModQaaDetailQuestionComponent } from './detail_question/detail';

import { AddonModQaaEditQuestionComponent } from './edit_question/edit';

import { QuillModule } from 'ngx-quill';

const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }], // custom button values
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
      [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
      [{ direction: 'rtl' }], // text direction
      [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [], // dropdown with defaults from theme
      [{ font: [] }],
      [{ align: [] }],
      ['clean'], // remove formatting button
      ['link', 'image', 'video']  // link and image, video
    ]
  };
@NgModule({
    declarations: [
        AddonModQaaIndexComponent,
        AddonModQaaAddQuestionComponent,
        AddonModQaaAnswerComponent,
        AddonModQaaEditAnswerComponent,
        AddonModQaaDetailQuestionComponent,
        AddonModQaaEditQuestionComponent
    ],
    imports: [
        CoreSharedModule,
        CoreCourseComponentsModule,
        QuillModule.forRoot({
            modules: {
              toolbar: modules.toolbar
            }
        })
    ],
    exports: [
        AddonModQaaIndexComponent,
        AddonModQaaAddQuestionComponent,
        AddonModQaaAnswerComponent,
        AddonModQaaEditAnswerComponent,
        AddonModQaaDetailQuestionComponent,
        AddonModQaaEditQuestionComponent    ],
})
export class AddonModPageComponentsModule {}
