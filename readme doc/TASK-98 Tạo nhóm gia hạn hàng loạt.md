
# **Tài liệu phát triển tính năng gia hạn hàng loạt bài kiểm tra bằng file CSV**

1. **Tên plugin**: th_bulk_override
2. **Kiểu plugin**: block
3. **Project**:  tnu,aof,tnut
4. **Chức năng chung**: Plugin th bulk override có chức năng gia hạn hàng loạt bài kiểm tra bằng file csv
5. **Người phát triển**: linhnt720@wru.vn
6. **Người yêu cầu**: minhpl
7. **Tham chiếu ERP:** TASK-98
8. **Mã nguồn:** https://github.com/minhngb/th/tree/master/blocks/th_bulk_override

# 1. Yêu cầu:

Viết plugin tính năng gia hạn hàng loạt bài kiểm tra bằng file CSV

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

- Plugin th bulk override có chức năng gia hạn hàng loạt bài kiểm tra bằng file csv.
    - Plugin sẽ lấy dữ liệu từ file csv tạo ra group:
        - Nếu quiz là bài kiểm tra thì sẽ tạo group có tên: Nhóm gia hạn bài kiểm tra - {thoi_gian_gia_han} - {so_lan_lam} lần.
        - Nếu quiz là bài luyện tập thì sẽ tạo group có tên: Nhóm gia hạn bài luyện tập - {thoi_gian_gia_han} - {so_lan_lam} lần.
        ![image](https://user-images.githubusercontent.com/57883256/198924087-91b3d440-cbdf-4c7f-a916-b2405d5b27bd.png)
    - Sau đó sẽ gia hạn cho group này theo thời gian yêu cầu.
        - Gia hạn bài luyện tập thành công:
        ![image](https://user-images.githubusercontent.com/57883256/198924339-d5c4705b-3125-4676-bcc5-ef318d93d051.png)
        - Gia hạn bài kiểm tra thành công:
        ![image](https://user-images.githubusercontent.com/57883256/198924430-ac22ee51-0e3e-41f6-bcd8-aea62621ad0d.png)
## Giao diện plugin th bulk override:
- Đầu vào:
    - Tệp tin csv
- Tệp csv mẫu:

| ma_mon | ten_quiz | ten_nhom | thoi_gian_gia_han | so_lan_lam |
|--------------|-------|------|------|------|
| FINT212-211017 | Bài kiểm tra 1;Bài kiểm tra 2 |Nhóm gia hạn bài kiểm tra  | 17h30p00s-4/3/2022 -> 23h59p00-6/3/2022 | 3 |
| FINT212-211017 | Bài luyện tập 1;Bài luyện tập 2 | Nhóm gia hạn bài luyện tập | 17h30p00s-4/3/2022 -> 23h59p00-6/3/2022 | 3 |

![image](https://user-images.githubusercontent.com/57883256/198924521-c21aa6ed-cb65-4042-bd5a-ad201c9ba026.png)

- Đầu ra:
    - Gợi ý (Nếu tìm thấy giá trị lỗi)
    - Các bài kiểm tra sẽ được gia hạn
        - Tên khóa học
        - Tên rút gọn khóa học
        - Tên bài kiểm tra
        - Thời gian gia hạn
        - Số lần làm bài
![image](https://user-images.githubusercontent.com/57883256/198924587-427cceb6-98f3-4290-b191-81eb56412eb3.png)


## Support

For support, email linhnt720@wru.vn


# Hi, I'm Linh! 👋

# 3. Phân tích thiết kế (database, functions nếu cần)

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết)

# 5. Triển khai (nếu cần)

# 6. Kiểm thử (nếu cần)



