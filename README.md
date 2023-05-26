# Tài liệu phát triển tính năng th_url

1. **Tên tính năng**: phát triển tính năng th_url
2. **Project**: tnu,aof,tnut,hcct,tuaf
3. **Người phát triển**: huytq72@wru.vn
4. **Người yêu cầu**: minhpl@aum.edu.vn
5. **Tham chiếu ERP:**
6. **Mã nguồn:**
	1. **branch**: https://github.com/minhpl/thmoodleapp/tree/49-feature_tinh_nang_th_url
	2. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp/tree/main

# 1. Yêu cầu:

 Viết tính năng để học viên tham gia lớp học trực tuyến qua link do giảng viên edit chỉnh sửa url

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Người dùng truy cập vào khóa học và chọn vào phần lớp học trực tuyến**:

![image](https://github.com/minhpl/thmoodleapp/assets/58178423/ab56ef70-2d36-49f2-82b7-5e0572e7f948)


**B2: Sau khi bấm vào lớp học trực tuyến, ứng dụng sẽ chạy đến link mà giảng viên đã edit.**


# 3. Phân tích thiết kế (database, cách viết functions, method call flowchart nếu cần)

    Function logView() được sử dụng để hiển thị nội dung của hoạt động mod_url, cho phép người dùng truy cập vào các liên kết đến các trang web bên ngoài và tài liệu trực tuyến khác từ trong khóa học.
     * Report the url as being viewed.
     *
     * @param id Module ID.
     * @param name Name of the assign.
     * @param siteId Site ID. If not defined, current site.
     * @returns Promise resolved when the WS call is successful.
     */
    logView(id: number, name?: string, siteId?: string): Promise<void> {
        const params: AddonModUrlViewUrlWSParams = {
            urlid: id,
        };

        return CoreCourseLogHelper.logSingle(
            'mod_thurl_view_url',
            params,
            AddonModUrlProvider.COMPONENT,
            id,
            name,
            'thurl',
            {},
            siteId,
        );
    }

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/main-TUAF...49-feature_tinh_nang_th_url

# 5. Kiểm thử (nếu cần)


# 6. Triển khai (Hướng dẫn triển khai, lưu ý khi upload nên appstore. nếu cần)
