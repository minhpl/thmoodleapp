# Tài liệu Xây dựng giao diện và chức năng xem lịch sử mua hàng trên App VMC

1. **Tên tính năng**: Xây dựng giao diện và chức năng xem lịch sử mua hàng trên App VMC
2. **Project**: vmc
3. **Người phát triển**: huytq72@wru.vn
4. **Người yêu cầu**: minhpl@aum.edu.vn
5. **Tham chiếu ERP:**
6. **Mã nguồn:**
	1. **branch**: https://github.com/minhpl/thmoodleapp/tree/47-feature_xay_dung_giao_dien_va_chuc_nang_xem_lich_su_mua_hang_tren_app_vmc
	2. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp/tree/main

# 1. Yêu cầu:

 Người dùng xem được lịch sử đã mua các khóa học và trạng thái đơn hàng.

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Người dùng đăng nhập vào App VMC và chọn vào xem phần thông tin**:

![image](https://github.com/minhpl/thmoodleapp/assets/58178423/d8a68e3c-f278-46dd-b9e2-a0415b2e24a2)


**B2: Sau khi giao diện xem thông tin hiển thị, người dùng bấm chọn xem lịch sử mua hàng**:

![image](https://github.com/minhpl/thmoodleapp/assets/58178423/2e4402dc-7a93-490a-a45b-fe90fd0073d8)

**B3: Khi đó, giao diện xem lịch sử mua hàng hiển thị. Người dùng xem được tình trạng đơn hàng và lịch sử đã mua các khóa học.**:

![image](https://github.com/minhpl/thmoodleapp/assets/58178423/3df1cd27-3d6e-40ce-bab0-51b75db4b525)

# 3. Phân tích thiết kế (database, cách viết functions, method call flowchart nếu cần)
Trong file src\app\purchase-history\purchase-history.page.ts dùng functions getPastOrders() để lấy dữ liệu các đơn hàng và tình trạng đơn hàng trên hệ thống.

      async getPastOrders() {
          const loading = await this.loadingController.create({
            message: 'Vui lòng chờ...',
          });
          loading.present();
          return new Promise(resolve => {

            this.http.get(`${this.url}/wp-json/wc/v3/orders?per_page=100&consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`, {})
            .subscribe(data => {
              resolve(data);
              const jsonValue = JSON.stringify(data);
                const valueFromJson = JSON.parse(jsonValue);
              this.products =  valueFromJson.filter((item) => (
                item.billing.email.toLowerCase().indexOf(this.user.email.toLowerCase()) > -1
              ));
              if(this.products.length !==0) {
                      this.boolean = true;
                      this.boolean2 = false
              }
              else {
                this.boolean2 = true
              }

              this.products.filter((item) => {
                if(item.status == "completed") {
                    this.status1 = 'Đã mua hàng';
                    this.boolean3 = true;
                }else if(item.status == "processing" || item.status == "pending") {
                  this.status = 'Đang xử lý'
                  this.boolean3 = false;
                }
              })
              loading.dismiss();
            })
          });
        }

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/main-TUAF...47-feature_xay_dung_giao_dien_va_chuc_nang_xem_lich_su_mua_hang_tren_app_vmc

# 5. Kiểm thử (nếu cần)


# 6. Triển khai (Hướng dẫn triển khai, lưu ý khi upload nên appstore. nếu cần)
