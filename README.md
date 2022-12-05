# **Tài liệu phát triển tính năng chống đăng nhập đồng thời trên nhiều thiết bị

1. **Tên tính năng**: Chống đăng nhập đồng thời trên nhiều thiết bị
2. **Project**:  tnu,aof,tnut,vmc
3. **Người phát triển**: huytq72@wru.vn
6. **Người yêu cầu**: Phạm Lê Minh
7. **Tham chiếu ERP:** TASK-19
8. **Mã nguồn (branch):** https://github.com/minhpl/thmoodleapp/tree/feature_chong_dang_nhap_dong_thoi_fix_loi

# 1. Yêu cầu:

Người dùng đăng nhập tài khoản trên nhiều thiết vào App. Thiết bị đầu tiên đăng nhập sẽ bị buộc đăng xuất khi truy cập khóa học, các thiết bị truy cập sau sẽ học tập bình thường tùy vào số lượng gia hạn thiết bị trên Web.

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Quản trị viên truy cập link: Dashboard/ Site administration/ Plugins/ Local plugins/ TH th_managelogin trên hệ thống Web để setup số lượng truy cập trên thiết bị mobile**:

![Screenshot 2022-12-05 114628](https://user-images.githubusercontent.com/58178423/205551628-6928ed35-ceec-4122-a046-d4eb88fe24f2.png)

**B2: Người dùng đăng nhập tài khoản của mình trên nhiều thiết bị và truy cập vào khóa học. Khi đó, thiết bị được đăng nhập đầu tiên khi truy cập vào khóa học sẽ hiện thông báo buộc người dùng phải bấm đồng ý để đăng xuất thiết bị. Còn những thiết bị còn lại sẽ được truy cập vào khóa học và học tập bình thường**:

![imge](https://user-images.githubusercontent.com/58178423/205550633-2e9a765d-e5b1-4c35-8e28-5f8b18cc0c49.jpg)

**B3:Thiết bị bị buộc đăng xuất sau khi bấm đồng ý sẽ trở về giao diện đăng nhập.Nếu người dùng đăng nhập trên thiết bị này thì thiết bị đăng nhập thứ 2 sẽ bị buộc đăng xuất và tương tự cho các trường hợp khác.**
# 3. Phân tích thiết kế (database, functions nếu cần)

# 4. mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/ef5348e03b8b9d745fea5292a5345b1ae901be04...9586ca4661bcef1b56fcd7e574ce696f3da5e783

# 5. Triển khai (nếu cần)
# 6. Kiểm thử (nếu cần)
