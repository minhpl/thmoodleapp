# **Tài liệu phát triển tính năng ghi danh GVCN,QLHT,GVCM vào nhiều khóa học cùng lúc bằng file csv**

1. **Tên plugin**: th_bulkenrol_course
2. **Kiểu plugin**: block
3. **Project**:  tnu
4. **Chức năng chung**: Plugin th bulk enrol course có chức năng ghi danh GVCM,GVCN,QLHT vào nhiều khóa học cùng lúc bằng file csv
5. **Người phát triển**: linhnt720@wru.vn
6. **Người yêu cầu**: minhpl
7. **Tham chiếu ERP:** TASK-99
8. **Mã nguồn:** https://github.com/minhngb/th/tree/master/blocks/th_bulkenrol_course

# 1. Yêu cầu: 
viết plugin hỗ trợ việc ghi danh hàng loạt GVCN (giáo viên chủ nghiệm), QLHT, GVCM (giáo viên chuyên môn)

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt
# TH BULK ENROL COURSE

## Chức năng của plugin

Plugin th bulk enrol course có chức năng ghi danh GVCM,GVCN,QLHT
vào nhiều khóa học cùng lúc bằng file csv.

## Giao diện plugin th bulk enrol course:

- Đầu vào:
    - Tệp tin csv
- Tệp csv mẫu:


| CourseShortName | GVCM | GVCN | QLHT |
|--------------|-------|------|------|
| Shortname1 | linh@gmail.com | linh@gmail.com | linh@gmail.com |
| Shortname2 | linh@gmail.com  | linh@gmail.com | linh@gmail.com |

![image](https://user-images.githubusercontent.com/57883256/198924972-36b75c96-466a-4e33-8022-1c96c0136abf.png)

- Cài đặt quyền cho GVCM,GVCN,QLHT:
    - Đường dẫn đến cài đặt: Dashboard -> Site administration -> Plugins -> Blocks -> TH User Bulk Enrolment
    - Chọn quyền.

![image](https://user-images.githubusercontent.com/57883256/198925235-9b57fd52-f2fd-4071-b7b7-a6afa270c159.png)

- Đầu ra:
    - Gợi ý (Nếu tìm thấy giá trị lỗi)
    - Các người dùng sẽ được gán vào khóa học
        - Địa chỉ thư điện tử
        - Họ
        - Tên
        - Tên khóa học
        - Trạng thái

![image](https://user-images.githubusercontent.com/57883256/198926993-5749e4bc-4089-4f76-babc-dae1be01a766.png)

## Support

For support, email linhnt720@wru.vn


# Hi, I'm Linh! 👋
# 3. Phân tích thiết kế (database, functions nếu cần)

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết)

# 5. Triển khai

# 6. Kiểm thử


