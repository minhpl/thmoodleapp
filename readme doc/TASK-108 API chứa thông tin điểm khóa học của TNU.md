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

## Mẫu API

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

**Điều kiện plugin hoạt động:**

ID của các activity trong khóa học đặt theo đúng định dạng:

|                           | id            |
|---------------------------|---------------|
| Điểm chuyên cần           | cc            |
| điểm kiểm tra             | kt            |
| Điểm xét điều kiện dự thi | dkt           |
| kiểm tra 1                | kt1 hoặc kt.1 |
| kiểm tra 2                | kt2 hoặc kt.2 |

ví dụ:

![image](https://user-images.githubusercontent.com/13426817/207279131-09d176ee-20a4-48ef-88c3-fc9beb3d0741.png)

![image](https://user-images.githubusercontent.com/13426817/207278714-32299e50-f80a-4513-a0ff-5be6db31ab79.png)

**Cách cấu hình để lấy token:**

- địa chỉ cấu hình Manage tokens:
https://tnu.aum.edu.vn/admin/settings.php?section=webservicetokens
- Capability cần có để sử dụng webservice: webservice/restful:use

![image](https://user-images.githubusercontent.com/13426817/207283206-0dce0540-f6ff-49d7-932c-cac5e89872eb.png)


# 3. Phân tích thiết kế: database, chú ý về các method, method call flowchart

**CSDL:**
```sql
$sql = "SELECT userid, {user_info_data}.data
			from {user_info_field}
			inner join {user_info_data}
			on {user_info_field}.id = {user_info_data}.fieldid and {user_info_field}.shortname $insql2
			and {user_info_data}.data $insql";
```
```sql
$sql = "SELECT gg.id, c.shortname, gg.userid, gi.idnumber, gg.finalgrade
				from {grade_grades} as gg, {grade_items} as gi, {user_enrolments} as ue, {enrol} as e, {course} as c
				where  e.courseid = c.id and e.id = ue.enrolid and ue.userid = gg.userid and gg.userid $insql and c.shortname LIKE '%$ma_mon%'
					and gg.itemid = gi.id and gi.idnumber $insql2 and gi.courseid = c.id
				    and ue.status = 0 and c.visible = 1";
```

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết)
# 5. Triển khai
# 6. Kiểm thử 
