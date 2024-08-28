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

import { Injectable } from '@angular/core';

import { CoreBlockHandlerData } from '@features/block/services/block-delegate';
import { CoreBlockBaseHandler } from '@features/block/classes/base-block-handler';
import { AddonBlockBlogTagsComponent } from '../components/blogtags/blogtags';
import { makeSingleton } from '@singletons';
import { CoreTag } from '@features/tag/services/tag';
import { AddonBlog } from '@addons/blog/services/blog';

/**
 * Block handler.
 */
@Injectable({ providedIn: 'root' })
export class AddonBlockBlogTagsHandlerService extends CoreBlockBaseHandler {

    name = 'AddonBlockBlogTags';
    blockName = 'blog_tags';

    /**
     * @inheritdoc
     */
    async isEnabled(): Promise<boolean> {
        const tags = await CoreTag.areTagsAvailable();
        const blogs = await AddonBlog.isPluginEnabled();

        return blogs && tags;
    }

    /**
     * Returns the data needed to render the block.
     *
     * @returns Data or promise resolved with the data.
     */
    getDisplayData(): CoreBlockHandlerData {

        return {
            title: 'addon.block_blogtags.pluginname',
            class: 'addon-block-blog-tags',
            component: AddonBlockBlogTagsComponent,
        };
    }

}

export const AddonBlockBlogTagsHandler = makeSingleton(AddonBlockBlogTagsHandlerService);
