Moodle App 4.0.2
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
# Tài liệu phát triển tính năng xem bảng điểm tổng hợp trên App

1. **Tên tính năng**: xem bảng điểm tổng hợp trên App
2. **Project**:  tnu,aof,tnut,tuaf,hcct
3. **Người phát triển**: huytq72@wru.vn
4. **Người yêu cầu**: minhpl@aum.edu.vn
5. **Tham chiếu ERP:**
6. **Mã nguồn:**
	1. **branch**: https://github.com/minhpl/thmoodleapp/tree/21-feature_bang_diem_tren_app
	2. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp/commit/ef5348e03b8b9d745fea5292a5345b1ae901be04

# 1. Yêu cầu:

Người dùng xem được bảng điểm tổng hợp trên ứng dụng Mobile App.

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Người dùng đăng nhập vào ứng dụng trên thiết bị mobile và bấm chọn vào phần xem thông tin như hình dưới đây**:

![imge](https://user-images.githubusercontent.com/58178423/231935154-992c9990-f59f-4af2-bb2e-ca506c3dd25b.png)

**B2: Sau khi giao diện xem thông tin người dùng hiển thị, tiếp tục chọn vào phần bảng điểm như hình vẽ**:

![image](https://user-images.githubusercontent.com/58178423/231936122-08564424-a2b0-4985-9691-82ffbdeb53ee.png)

**B3: Sau đó, bảng điểm được hiển thị. Người dùng có thể xem được chi tiết các môn học với từng đầu điểm tương ứng**:

![image](https://user-images.githubusercontent.com/58178423/231937483-bc71cc2f-aa62-4776-9b48-b81ea1b29894.png)
# 3. Phân tích thiết kế (database, cách viết functions, method call flowchart nếu cần)

Tạo folder gradebook trong thư mục như source sau src\core\features\mainmenu\pages\gradebook. Sau đó, trong file gradebook.page.ts ta gọi hàm call th_gradebook_api để call dữ liệu về môn học và điểm số theo id của người dùng:

    const site = await CoreSites.getSite();

    const userId = site.getUserId();
    var data: any = {
      userid: userId,
    };

    const preSets = {
      getFromCache: false,
    };

    site.write('th_gradebook_api', data, preSets).then((data) => {
        this.gradebook = data
    if(this.gradebook != null && this.gradebook.length!= 0) {
        this.boolean = false;
        this.booleantable = true;
    }else {
        this.boolean = true;
        this.booleantable = false;
    }
    }).catch((e) => {
        console.log(e)
    });

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/main...21-feature_bang_diem_tren_app

# 5. Kiểm thử (nếu cần)


# 6. Triển khai (Hướng dẫn triển khai, lưu ý khi upload nên appstore. nếu cần)
