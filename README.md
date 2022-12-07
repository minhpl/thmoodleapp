Moodle App
=================

This is the primary repository of source code for the official mobile app for Moodle.

* [User documentation](https://docs.moodle.org/en/Moodle_app)
* [Developer documentation](http://docs.moodle.org/dev/Moodle_App)
* [Development environment setup](https://docs.moodle.org/dev/Setting_up_your_development_environment_for_the_Moodle_App)
* [Bug Tracker](https://tracker.moodle.org/browse/MOBILE)
* [Release Notes](https://docs.moodle.org/dev/Moodle_App_Release_Notes)

License
-------

[Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0)
# **Tài liệu phát triển tính năng phê duyệt khóa học trên thiết bị Mobile

1. **Tên tính năng**: phê duyệt khóa học
2. **Project**:  tnu,aof,tnut,vmc
3. **Người phát triển**: huytq72@wru.vn
6. **Người yêu cầu**: Phạm Lê Minh
7. **Tham chiếu ERP:** TASK-92
8. **Mã nguồn (branch):** https://github.com/minhpl/thmoodleapp/tree/feature_approve_course
9. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp/commit/ef5348e03b8b9d745fea5292a5345b1ae901be04

# 1. Yêu cầu:

Phê duyệt khóa học trên App cho giảng viên. Khối phê duyệt sẽ không hiển thị đối với học viên.

Lưu ý: Khối phê duyệt chỉ xuất hiện khi khối phê duyệt đã được thêm vào khóa học trên Web.

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt
**TH1: Người dùng đăng nhập tài khoản có quyền phê duyệt khóa học và muốn duyệt khóa học**

B1: Khối phê duyệt sẽ được hiển thị để người dùng phê duyệt trong khóa học:

![imge](https://user-images.githubusercontent.com/58178423/206085520-6d2df52e-1bf3-48a2-a817-49aa94bef705.jpg)

B2: Người dùng bấm nút duyệt trong khối phê duyệt thì sẽ có 1 thông báo hiển thị. Bấm nút đồng ý trong thông báo để phê duyệt khóa học:

![imge](https://user-images.githubusercontent.com/58178423/206085522-24dfdb9d-630e-4c86-9ea8-be87958afa78.jpg)

B3: Sau khi bấm đồng ý phê duyệt khóa học thành công, nút Duyệt trong khối sẽ chuyển thành màu xanh

![imge](https://user-images.githubusercontent.com/58178423/206085527-d71d4b3c-223d-4ec6-bb9f-4a8812d24fb9.jpg)

**TH2: Người dùng đăng nhập tài khoản có quyền phê duyệt khóa học và muốn hủy duyệt khóa học**

B1: Người dùng bấm nút chưa duyệt trong khối phê duyệt sẽ hiển thị 1 thông báo. Bấm nút đồng ý trong thông báo để hủy phê duyệt:

![imge](https://user-images.githubusercontent.com/58178423/206085524-db621cde-0624-4a4e-9cae-24e81b4adb7c.jpg)

**Lưu ý: Với 1 số khóa học đã bắt đầu học thì người dùng không thể hủy phê duyệt khóa học**:

![imge](https://user-images.githubusercontent.com/58178423/206085529-941f0f8e-0c19-44d9-9bb1-fafc3d1d4184.jpg)

# 3. Phân tích thiết kế (database, functions nếu cần)

Trong hàm ngOnInit trong file src\core\features\block\components\pre-course-status-block\pre-rendered-block.ts ta gọi đến hàm local_th_course_status_check_status() để check trạng thái khóa học đã duyệt hay chưa duyệt trên hệ thống.

       const site = await CoreSites.getSite();

       const userId = site.getUserId(),
       data: any = {
              userid: userId,
              courseid: this.courseId
       };

       const preSets = {
       getFromCache: false,
       };

       return site.write('local_th_course_status_check_status', data, preSets).then((courses) => {
       const jsonValue = JSON.stringify(courses);
       let temp = JSON.parse(jsonValue)
       this.data = temp
       if(temp.check = true) {
              this.block_status = true
       } else {
              this.block_status = false
       }

       if(temp.status == 0) {
              this.btn_cancel = 'btn_cancel';
              this.btn_confirm = 'un_btn_confirm';
              this.icon_cancel = true;
              this.icon_confirm = false;
       } else if(temp.status == 1)  {
              this.btn_cancel = 'un_btn_cancel';
              this.btn_confirm = 'btn_confirm ';
              this.icon_cancel = false;
              this.icon_confirm = true;
       }
       })

Trong file src\core\features\block\components\pre-course-status-block\pre-rendered-block.ts ta gọi đến hàm local_th_course_status_published_course() để duyệt khóa học.

       async th_published_course() {
              const site = await CoreSites.getSite();

              const userId = site.getUserId(),
              data: any = {
                     userid: userId,
                     courseid: this.courseId
              };

              const preSets = {
              getFromCache: false,
              };

              this.btn_cancel = 'un_btn_cancel';
              this.btn_confirm = 'btn_confirm ';
              this.icon_cancel = false;
              this.icon_confirm = true;

              return site.write('local_th_course_status_published_course', data, preSets).then((courses) => {
              const jsonValue = JSON.stringify(courses);
              let temp = JSON.parse(jsonValue)
              console.log(temp)
              this.data.status = temp.status
              })


       }

Trong file src\core\features\block\components\pre-course-status-block\pre-rendered-block.ts ta gọi đến hàm local_th_course_status_unpublished_course() để hủy phê duyệt khóa học.

       async th_un_published_course() {
              const site = await CoreSites.getSite();

              const userId = site.getUserId(),
              data: any = {
                     userid: userId,
                     courseid: this.courseId
              };

              const preSets = {
              getFromCache: false,
              };

              this.btn_cancel = 'btn_cancel';
              this.btn_confirm = 'un_btn_confirm';
              this.icon_cancel = true;
              this.icon_confirm = false;

              return site.write('local_th_course_status_unpublished_course', data, preSets).then((courses) => {
              const jsonValue = JSON.stringify(courses);
              let temp = JSON.parse(jsonValue)
              console.log(temp)
              this.data.status = temp.status
              })
       }
# 4. mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/ef5348e03b8b9d745fea5292a5345b1ae901be04...bbc2c18bffa1cfac26457e50e46903c5e539b105
# 5. Triển khai (nếu cần)

# 6. Kiểm thử (nếu cần)
