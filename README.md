# **Tài liệu phát triển tính năng chống đăng nhập đồng thời trên nhiều thiết bị

1. **Tên tính năng**: Chống đăng nhập đồng thời trên nhiều thiết bị
2. **Project**:  tnu,aof,tnut,vmc
3. **Người phát triển**: huytq72@wru.vn
6. **Người yêu cầu**: Phạm Lê Minh
7. **Tham chiếu ERP:** TASK-19
8. **Mã nguồn (branch):** https://github.com/minhpl/thmoodleapp/tree/feature_chong_dang_nhap_dong_thoi_fix_loi
9. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp/commit/ef5348e03b8b9d745fea5292a5345b1ae901be04

# 1. Yêu cầu:

Hạn chế người dùng đăng nhập tài khoản trên nhiều thiết vào App một cách đồng thời.

Ví dụ: 2 thiết bị được đăng nhập đồng thời vào ứng dụng

- Thiết bị A: đăng nhập 10h
- Thiết bị B: đăng nhập 12h
- Thiết bị C: đăng nhập 13h => thiết bị A sẽ bị force logout

Trường hợp 2:

- Thiết bị A: đăng nhập 10h
- Thiết bị B: đăng nhập 12h sau đó chủ động đăng xuất
- Thiết bị C: đăng nhập 13h => thiết bị A và C vẫn đăng nhập bình thường. Không thiết bị nào bị logout

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Quản trị viên truy cập link: Dashboard/ Site administration/ Plugins/ Local plugins/ TH th_managelogin trên hệ thống Web để setup số lượng truy cập trên thiết bị mobile**:

![Screenshot 2022-12-05 114628](https://user-images.githubusercontent.com/13426817/205584115-9c9ef7dd-0f2b-4447-a80b-0f9776dd5cef.png)

**B2: Người dùng đăng nhập tài khoản của mình trên nhiều thiết bị và truy cập vào khóa học. Khi đó, thiết bị được đăng nhập đầu tiên khi truy cập vào khóa học sẽ hiện thông báo buộc người dùng phải bấm đồng ý để đăng xuất thiết bị. Còn những thiết bị còn lại sẽ được truy cập vào khóa học và học tập bình thường**:

![imge](https://user-images.githubusercontent.com/58178423/205550633-2e9a765d-e5b1-4c35-8e28-5f8b18cc0c49.jpg)

**B3:Thiết bị bị buộc đăng xuất sau khi bấm đồng ý sẽ trở về giao diện đăng nhập.Nếu người dùng đăng nhập trên thiết bị này thì thiết bị đăng nhập thứ 2 sẽ bị buộc đăng xuất và tương tự cho các trường hợp khác.**
# 3. Phân tích thiết kế (database, functions nếu cần)

# 4. mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/ef5348e03b8b9d745fea5292a5345b1ae901be04...9586ca4661bcef1b56fcd7e574ce696f3da5e783

# 5. Triển khai (nếu cần)

# 6. Kiểm thử (nếu cần)

| Mã yêu cầu |  Mã trường hợp   | Tiêu đề                                       | Mô tả                                                                                    | Kết quả mong đợi                                           | Người thực hiện | Kết quả lần 1 |
| ---------- | ---------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------- | ------------- |
| CN\_1      | <Testcase 1><br> | 1 thiết bị được đăng nhập và học tập trên App | Máy 1, Máy 2 lần lượt đăng nhập                                                          | Máy 1 bị logout. Máy 2 họat động bình thường               | datdt,huytq     | Pass          |
| CN\_1      | <Testcase 2>     | 2 thiết bị được đăng nhập và học tập trên App | Máy 1, Máy 2, Máy 3 lần lượt đăng nhập                                                   | Máy 1 bị logout. Máy 2, Máy 3 hoạt động bình thường        | datdt,huytq     | Pass          |
| CN\_1      | <Testcase 3>     | 2 thiết bị được đăng nhập và học tập trên App | Máy 1, Máy 2, Máy 3 lần lượt đăng nhập. Sau đó, Máy 2 bấm nút đăng xuất.                 | Máy 2 bị logout. Máy 1, Máy 3 đăng nhập bình thường        | datdt,huytq     | Pass          |
| CN\_1      | <Testcase 4>     | 2 thiết bị được đăng nhập và học tập trên App | Máy 1, Máy 2, Máy 3 lần lượt đăng nhập. Sau đó, Máy 3 bấm nút đăng xuất                  | Máy 1 và Máy 2 đăng nhập bình thường.                      | datdt,huytq     | Pass          |
| CN\_1      | <Testcase 5>     | 2 thiết bị được đăng nhập và học tập trên App | Máy 1, Máy 2,  Máy 3 đăng nhập. Sau đó, Máy 2, Máy 3 cùng đăng xuất.                     | Máy 1 hoạt động bình thường.                               | datdt,huytq     | Pass          |
| CN\_1      | <Testcase 6>     | 3 thiết bị được đăng nhập và học tập trên App | Máy 1, Máy 2, Máy 3, Máy 4 lần lượt đăng nhập                                            | Máy 1 bị logout. Máy 2, Máy 3, Máy 4 hoạt động bình thường | datdt,huytq     | Pass          |
| CN\_1      | <Testcase 7>     | 3 thiết bị được đăng nhập và học tập trên App | Máy 1, Máy 2, Máy 3, Máy 4 lần lượt đăng nhập. Sau đó Máy 2 đăng xuất                    | Máy 1, Máy 3, Máy 4 hoạt động bình thường                  | datdt,huytq     | Pass          |
| CN\_1      | <Testcase 8>     | 3 thiết bị được đăng nhập và học tập trên App | Máy 1, Máy 2, Máy 3, Máy 4 lần lượt đăng nhập. Sau đó Máy 3 đăng xuất                    | Máy 1, Máy 2, Máy 4 hoạt động bình thường                  | datdt,huytq     | Pass          |
| CN\_1      | <Testcase 9>     | 3 thiết bị được đăng nhập và học tập trên App | Máy 1, Máy 2, Máy 3, Máy 4 lần lượt đăng nhập. Sau đó Máy 4 đăng xuất                    | Máy 1, Máy 2, Máy 3 hoạt động bình thường                  | datdt,huytq     | Pass          |
| CN\_1      | <Testcase 10>    | 3 thiết bị được đăng nhập và học tập trên App | Máy 1, Máy 2, Máy 3, Máy 4 lần lượt đăng nhập. Sau đó Máy 2, Máy 3, Máy 4 cùng đăng xuất | Máy 1 hoạt động bình thường                                | datdt,huytq     | Pass          |
