# **Tài liệu phát triển tính năng hiển thị subtitle trên video khóa học trên app

1. **Tên tính năng**: Hiển thị subtitle trên video khóa học trên app
2. **Project**:  tnu,aof,tnut,vmc
3. **Người phát triển**: aum.ducdnn@gmail.com
4. **Người yêu cầu**: Hoàng Hồng Lan
5. **Tham chiếu ERP:** 
6. **Mã nguồn:**
	1. **branch**: https://github.com/minhpl/thmoodleapp/tree/feature_video_subtitle_fromTNU
	2. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp/commit/421243b47f5b1135f1ae219d88d6b56b1724e222

# 1. Yêu cầu:

Hiển thị subtitle cho video khóa học trên app

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Truy cập vào khóa học và xem video của khóa học**:
  ![image](https://github.com/minhpl/thmoodleapp/assets/91856933/314c11a6-178a-4820-8761-04a3a186d239)

**B2: Bấm vào dấu ba chấm ở góc dưới cùng bên phải màn hình**:
  ![image](https://github.com/minhpl/thmoodleapp/assets/91856933/9a1d53dd-9ac8-47c3-86a7-9d44450b7adf)

**B3:Chọn phần Caption để cấu hình subtitle.**
  ![image](https://github.com/minhpl/thmoodleapp/assets/91856933/f30c128c-be32-48a1-92d3-cc4566a62319)

**B4:Lựa chọn subtitle mong muốn hoặc tắt đi.**
  ![image](https://github.com/minhpl/thmoodleapp/assets/91856933/9addc260-02d3-4c76-9047-74a4f9a12e05)

# 3. Phân tích thiết kế (database, cách viết functions, method call flowchart nếu cần)

B1: Trong file src/core/services/utils/mimetype.ts tại hàm getEmbeddedHtml() ta thay đổi để trả về subtitle cho video:

```javascript
 /**
     * Set the embed type to display an embedded file and mimetype if not found.
     *
     * @param file File object.
     * @param path Alternative path that will override fileurl from file object.
     */
    getEmbeddedHtml(file: CoreFileEntry, path?: string, lesss?: CoreCourseModuleContentFile[]): string {
        const filename = CoreUtils.isFileEntry(file) ? (file as FileEntry).name : file.filename;
        const extension = !CoreUtils.isFileEntry(file) && file.mimetype
            ? this.getExtension(file.mimetype)
            : (filename && this.getFileExtension(filename));
        const mimeType = !CoreUtils.isFileEntry(file) && file.mimetype
            ? file.mimetype
            : (extension && this.getMimeType(extension));

        // @todo linting: See if this can be removed
        (file as CoreWSFile).mimetype = mimeType;

        if (extension && this.canBeEmbedded(extension)) {
            const embedType = this.getExtensionType(extension);

            // @todo linting: See if this can be removed
            (file as { embedType?: string }).embedType = embedType;

            path = path ?? (CoreUtils.isFileEntry(file) ? file.toURL() : CoreFileHelper.getFileUrl(file));
            path = path && CoreFile.convertFileSrc(path);
            var track = ''

            if(lesss !== undefined) {
                lesss.slice(1).map((item)=> {
                    return track =  track + `<track src="${item.fileurl}" kind="subtitles" srclang=${JSON.stringify(item.filename.replace('.vtt',''))} label=${JSON.stringify(item.filename.replace('.vtt',''))} default="true">`
                })
            }

            switch (embedType) {
                case 'image':
                    return `<img src="${path}">`;
                case 'audio':
                case 'video':
                    if(lesss !== undefined) {
                        if(lesss.length > 1) {
                            return [
                                `<${embedType} controls title="${filename}" src="${path.replace('?forcedownload=1&offline=1', '')}" controlsList="nodownload">`,
                                `<source src="${path}" type="${mimeType}">`,
                                `${track}`,
                                `</${embedType}>`,
                            ].join('');
                        }else if(lesss.length == 1) {
                            return [
                                `<${embedType} controls title="${filename}" src="${path.replace('?forcedownload=1&offline=1', '')}" controlsList="nodownload">`,
                                `<source src="${path}" type="${mimeType}">`,
                                `</${embedType}>`,
                            ].join('');
                        }
                    }
                default:
                    return '';
            }
        }

        return '';
    }
```

B2: Trong file src/addons/mod/resource/services/resource-helper.ts ta thay đổi dữ liệu return của hàm getEmbeddedHtml():


```javascript
 /**
     * Get the HTML to display an embedded resource.
     *
     * @param module The module object.
     * @return Promise resolved with the HTML.
     */
    async getEmbeddedHtml(module: CoreCourseModuleData): Promise<string> {
        const contents = await CoreCourse.getModuleContents(module);

        const result = await CoreCourseHelper.downloadModuleWithMainFileIfNeeded(
            module,
            module.course,
            AddonModResourceProvider.COMPONENT,
            module.id,
            contents,
        );

        // TH_edit
        return CoreMimetypeUtils.getEmbeddedHtml(contents[0], result.path, contents);
    }
```

# 4. mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

[https://github.com/minhpl/thmoodleapp/compare/ef5348e03b8b9d745fea5292a5345b1ae901be04...9586ca4661bcef1b56fcd7e574ce696f3da5e783](https://github.com/minhpl/thmoodleapp/commit/421243b47f5b1135f1ae219d88d6b56b1724e222)

# 5. Triển khai (Hướng dẫn triểu khai, lưu ý khi upload nên appstore. nếu cần)

# 6. Kiểm thử (nếu cần)

