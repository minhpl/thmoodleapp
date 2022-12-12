# **Tài liệu phát triển tính năng giúp clone nhiều khóa học cùng một lúc bằng hai cách. Chọn khóa học hoặc từ file CSV**

1. **Tên plugin**: th_clone_course
2. **Kiểu plugin**: block
3. **Project**:  tnu,aof,tnut
4. **Chức năng chung**: giúp clone nhiều khóa học cùng một lúc bằng hai cách:
    - Cách 1: chọn khóa học 
    - Cách 2: dùng file csv chứa các thông tin cần thiết để import.
5. **Người phát triển**: linhnt720@wru.vn
6. **Người yêu cầu**: minhpl
7. **Tham chiếu ERP:** TASK-100
8. **Mã nguồn:** https://github.com/minhngb/th/tree/master/blocks/th_clone_course

# 1. Yêu cầu:

Viết plugin giúp clone nhiều khóa học cùng một lúc bằng hai cách:
- Cách 1: chọn khóa học 
- Cách 2: dùng file csv chứa các thông tin cần thiết để import.

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

- Đầu vào khi clone bằng khóa học:
    - Khóa học (Hiển thị những khóa học có ngày bắt đầu mới nhất )
    - Ngày bắt đầu (Hiển thị ngày chủ nhật gần nhất)
- Lưu ý:
    - Khóa học phải có định dạng: tenkhoahoc - ngaybatdau (Ví dụ: Luật thương mại - 220221)
    - Tên rút gọn khóa học phải có định dạng: shortname-ngaybatdau (Ví dụ: LAWT224-220221)
![image](https://user-images.githubusercontent.com/57883256/169965314-6a993ac7-2283-47bb-a93d-64e7792892e5.png)
- Đầu ra khi clone bằng khóa học:
    - Tên khóa học
    - Thông báo
![image](https://user-images.githubusercontent.com/57883256/169965631-cbb316c9-82fd-46d5-8b9d-cd6efefc1a0f.png)


- Đầu vào khi clone bằng file csv:
    - File csv
- Mẫu file csv:

| CourseShortName | Ngaybatdau | 
|--------------|-------|
| Shortname1 | 21/2/2022 |
| Shortname2 | 21/2/2022 | 

![image](https://user-images.githubusercontent.com/57883256/169965413-c3c90529-047d-4109-9ee8-d5490286ee52.png)

- Đầu ra khi clone bằng file csv:
    - Gợi ý (Nếu tìm thấy giá trị lỗi trong file csv)
    - Danh sách khóa học có thể clone được:
        - Tên khóa học
        - Tên rút gọn khóa học
        - Trạng thái
        - Ngày bắt đầu khóa học

## Support

For support, email linhnt720@wru.vn

# Hi, I'm Linh! 👋

# 3. Phân tích thiết kế (database, functions nếu cần)

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết)

# 5. Triển khai (nếu cần)

# 6. Kiểm thử (nếu cần)
