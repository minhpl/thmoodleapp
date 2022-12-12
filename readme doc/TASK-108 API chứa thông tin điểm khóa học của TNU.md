# **Tài liệu phát triển tính năng API chứa thông tin đăng kí dự thi**

- **Tên plugin**: th_tnuapi
- **Kiểu plugin**: local
- **Project**:  tnu
- **Chức năng chung**: API chứa thông tin điểm khóa học của TNU
- **Người phát triển**: minhpl@aum.edu.vn
- **Người yêu cầu**: TNU yêu cầu
- **Tham chiếu ERP:** TASK-108
- **Mã nguồn:** https://github.com/minhngb/th/tree/master/local/th_tnuapi

# 1. Yêu cầu:

TNU yêu cầu tạo API lấy danh sách xét điều kiện dự thi

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

API lấy danh sách xét đăng ký dự thi.

- Method: POST
- Endpoint: https://tnu.aum.edu.vn
- Resource /webservice/restful/server.php/tnuapi_xet_dkdt
- Header:
  Content-Type: application/json
  Authorization: {token}
  Accept: application/json

JSON Payload sample:

    {
           "ma_mon":"PSST113-201025",
           "dshv":[
              "20-2-7340301-1686",
              "20-2-7340301-1628",
              "20-2-7380107-1615",
           ]
        }
JSON Response sample:

{
   "ma_mon": "PSST113-201025",
   "ketqua":    [
            {
         "mhv": "20-2-7340301-1686",
         "dcc": 9,
         "dkt": 8.5,
         "xetdkdt": 1
      },
            {
         "mhv": "20-2-7380107-1615",
         "dcc": 5.33,
         "dkt": 3.5,
         "xetdkdt": 0
      },
            {
         "mhv": "20-2-7340301-1628",
         "dcc": 9.67,
         "dkt": 10,
         "xetdkdt": 1
      }
   ]
}
Lưu ý:

- Token: dùng thể xác thực, sẽ được gửi riêng ở thư khác.
- Các trường dcc/dkt/xetdkdt có thể nhận giá trị -1. Giá trị -1 nghĩa là chưa có điểm (chưa làm bài). Giá trị 0 nghĩa là làm bài rồi nhưng được 0.

# 3. Phân tích thiết kế (database, functions nếu cần)

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết)

# 5. Triển khai

# 6. Kiểm thử
