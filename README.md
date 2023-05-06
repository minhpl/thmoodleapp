# Tài liệu Xây dựng giao diện và chức năng xem chi tiết sản phẩm trên App VMC

1. **Tên tính năng**: Xây dựng giao diện và chức năng xem chi tiết sản phẩm trên App VMC
2. **Project**: vmc
3. **Người phát triển**: huytq72@wru.vn
4. **Người yêu cầu**: minhpl@aum.edu.vn
5. **Tham chiếu ERP:**
6. **Mã nguồn:**
	1. **branch**: https://github.com/minhpl/thmoodleapp/tree/38-feature_xay_dung_giao_dien_xem__khoa_hoc_theo_tung_nganh_tai_trang_mua_hang_tren_app_vmc
	2. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp/tree/main

# 1. Yêu cầu:

Người dùng bấm vào khóa học sẽ hiển thị chi tiết thông tin của khóa học gồm: giá bán, số lượng bài học, thông tin về khóa học,...

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Người dùng bấm chọn khóa học tại trang xem khóa học hoặc trang xem khóa học theo từng ngành học**:

![image](https://user-images.githubusercontent.com/58178423/236592948-e5b6a026-219b-475d-ab26-06add00e3505.png)

![image](https://user-images.githubusercontent.com/58178423/236592867-85927f89-c009-4f32-845e-bbf932406913.png)

**B2: Sau khi bấm chọn khóa học, giao diện chi tiết khóa học sẽ được hiển thị. Người dùng xem được chi tiết các thông tin về giá bán khóa học, giới thiệu về khóa học và tất cả các bài học.**:

![image](https://user-images.githubusercontent.com/58178423/236593040-4abba1c8-48ec-461b-820c-a3a1c0a29a17.png)

# 3. Phân tích thiết kế (database, cách viết functions, method call flowchart nếu cần)
Trong file src\app\discover\discover.page.ts gọi hàm  để truyền dữ liệu data đã call sang page xem chi tiết khóa học để hiện thị ra giao diện

     async openProductPage(product) {
       this.nav.navigateForward(['main/productdetails', {data: JSON.stringify(product), url: this.url, consumerKey: this.consumerKey, consumersecret:this.consumerSecret}])
     }

Trong file src\app\app-routing.module.ts ta khai báo loadChildren để khi click vào biểu tượng tìm kiếm sẽ chạy đến ProductdetailsPageModule hiển thị ra giao diện ngành:

      const routess: Routes = [
          {
              path: 'main/productdetails',
              loadChildren: () => import('./productdetails/productdetails.module').then( m => m.ProductdetailsPageModule)
          },
      ]

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/main-TUAF...38-feature_xay_dung_giao_dien_xem__khoa_hoc_theo_tung_nganh_tai_trang_mua_hang_tren_app_vmc

# 5. Kiểm thử (nếu cần)


# 6. Triển khai (Hướng dẫn triển khai, lưu ý khi upload nên appstore. nếu cần)
