# Tài liệu Xây dựng giao diện và chức năng tìm kiếm sản phẩm tại trang mua hàng trên App VMC

1. **Tên tính năng**: Xây dựng giao diện và chức năng tìm kiếm sản phẩm tại trang mua hàng trên App VMC
2. **Project**: vmc
3. **Người phát triển**: huytq72@wru.vn
4. **Người yêu cầu**: minhpl@aum.edu.vn
5. **Tham chiếu ERP:**
6. **Mã nguồn:**
	1. **branch**: https://github.com/minhpl/thmoodleapp/tree/36-feature_xay_dung_giao_dien_tim_kiem_khoa_hoc_tai_trang_mua_hang_tren_app_vmc
	2. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp/tree/main

# 1. Yêu cầu:

Người dùng bấm vào trang xem danh sách khóa học và bấm nút tìm kiếm. Sau đó, nhập từ khóa tìm kiếm để tìm khóa học theo từ khóa.

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Người dùng đăng nhập vào App VMC-e và bấm chọn vào phần xem khóa học. Sau đó, bấm vào nút tìm kiếm ở góc trái trên cùng màn hình**:

![image](https://user-images.githubusercontent.com/58178423/236405447-11f4296a-cd46-4837-a96c-534e1cb0bd3c.png)


**B2: Sau khi giao diện tìm kiếm xuất hiện, người dùng nhập từ khóa cần tìm kiếm và bấm nút tìm kiếm.Các khóa học cần tìm sẽ được hiển thị sau khi tìm kiếm thành công.**:

![image](https://user-images.githubusercontent.com/58178423/236410940-5eb68ec8-cdfa-4f66-989a-df71581a8981.png)

![image](https://user-images.githubusercontent.com/58178423/236411191-f2d84601-f914-41a4-9565-4f47cc0d113b.png)


# 3. Phân tích thiết kế (database, cách viết functions, method call flowchart nếu cần)

Trong file src\app\search\search.page.ts gọi hàm getProduct() để tìm kiếm tất cả các khóa học phù hợp với từ khóa tìm kiếm.

    async getProduct() {
       const loading = await this.loadingCtrl.create({
         message: 'Vui lòng chờ...',
       });
       loading.present();
       encodeURIComponent(this.pet)
       return new Promise(resolve => {
         this.http
           .get(
             `${this.url}/wp-json/wc/v3/products?per_page=100&search=${encodeURIComponent(this.pet)}&consumer_key=${
               this.consumerKey
             }&consumer_secret=${this.consumersecret}`
           )
           .subscribe(productData => {
             resolve(productData);
             const jsonValue = JSON.stringify(productData);
             const valueFromJson = JSON.parse(jsonValue);
             console.log(valueFromJson)
             this.products =  valueFromJson.filter((item) => (
               item.images.length !== 0 && item.name.toLowerCase().indexOf(this.pet.toLowerCase()) > -1
           ))
             let temp: any[] = valueFromJson.filter((item) => (
                 item.images.length !== 0 && item.name.toLowerCase().indexOf(this.pet.toLowerCase()) > -1
             ))

             for(let i = 0; i <temp.length; i++){
               if(temp[i].name.length >= 30){
                   temp[i].name1 = temp[i].name.substr(0,30) + '...'
               } else {
                 temp[i].name1 = temp[i].name
               }

             }

             this.products = temp;
           if(this.products.length !== 0 && this.pet.length !== 0) {
             this.boolean = true;
             this.boolean2 = false
           } else {
             this.boolean = false;
             this.boolean2 = true
           }
           loading.dismiss();

         });
       });
    }

Trong file src\core\features\mainmenu\mainmenu-lazy.module.ts ta khai báo loadChildren để khi click vào biểu tượng tìm kiếm sẽ chạy đến SearchPageModule hiển thị ra giao diện tìm kiếm:

    {
        path: CoreMainMenuProvider.MORE_PAGE_NAME8,
        loadChildren: () => import('../../../app/search/search.module').then( m => m.SearchPageModule)
    },

Ta khai báo static readonly MORE_PAGE_NAME8 = 'search'; ở file src\core\features\mainmenu\services\mainmenu.ts để path chạy đến main/search

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/main-TUAF...36-feature_xay_dung_giao_dien_tim_kiem_khoa_hoc_tai_trang_mua_hang_tren_app_vmc

# 5. Kiểm thử (nếu cần)


# 6. Triển khai (Hướng dẫn triển khai, lưu ý khi upload nên appstore. nếu cần)
