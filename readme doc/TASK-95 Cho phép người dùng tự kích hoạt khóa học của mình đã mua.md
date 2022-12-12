# **Tài liệu phát triển tính năng Cho phép người dùng tự kích hoạt khóa học của mình đã mua**

1.  **Tên plugin**: th_activatecourses
2.  **Kiểu plugin**: block
3. **Project**:  vmc
4.  **Chức năng chung**: Cho phép người dùng tự kích hoạt khóa học của mình đã mua
5. **Người phát triển**: minhpl@aum.edu.vn
6. **Người yêu cầu**: minhpl
7. **Tham chiếu ERP:** ví dụ TASK-95
8. **Mã nguồn:**  https://github.com/minhngb/th/tree/master/blocks/th_activatecourses

# 1. Yêu cầu:
Cho phép người dùng tự kích hoạt khóa học của mình đã mua

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt
![image](https://user-images.githubusercontent.com/13426817/158002615-eb647798-86c9-4c0a-90c7-8e839707f94c.png)

 1. Người dùng ấn nút kích hoạt khóa học để tự enrol vào khóa học theo phương thức Manual enrolments
 2. Người dùng sẽ học trong khóa học trong thời gian nhất định, được thiết lập trong cài đặt mặc định thời gian ghi danh thủ công của khóa học
 
# 3. Phân tích thiết kế (database, functions nếu cần)
bảng **th_registeredcourses**

| id            | int | id bản ghi                   |
|---------------|-----|------------------------------|
| userid        | int | id người mua                 |
| courseid      | int | id course người mua đăng kí  |
| timecreated   | int | thời gian tạo bản ghi        |
| timeactivated | int | thời gian kích hoạt khóa học |

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết)

# 5. Triển khai (nếu cần)

# 6. Kiểm thử (nếu cần)

