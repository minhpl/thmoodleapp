# Tài liệu Xây dựng giao diện và chức năng xem sản phẩm theo từng ngành tại trang mua hàng trên App VMC

1. **Tên tính năng**: Xây dựng giao diện và chức năng xem sản phẩm theo từng ngành tại trang mua hàng trên App VMC
2. **Project**: vmc
3. **Người phát triển**: huytq72@wru.vn
4. **Người yêu cầu**: minhpl@aum.edu.vn
5. **Tham chiếu ERP:**
6. **Mã nguồn:**
	1. **branch**: https://github.com/minhpl/thmoodleapp/tree/38-feature_xay_dung_giao_dien_xem__khoa_hoc_theo_tung_nganh_tai_trang_mua_hang_tren_app_vmc
	2. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp/tree/main

# 1. Yêu cầu:

Người dùng bấm vào nút xem ngành học trên tab thanh menu. Sau khi list ngành học hiển thị, người dùng có thể xem chi tiết các khóa học trong từng ngành..

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Người dùng đăng nhập vào App VMC-e và bấm chọn vào nút xem ngành học trên tab thanh menu. Sau đó list ngành học hiển thị**:

![image](https://user-images.githubusercontent.com/58178423/236590930-928451bd-6931-4fec-bea8-602d5cd7e82c.png)

![image](https://user-images.githubusercontent.com/58178423/236590984-c87f3a7a-0a82-4fee-af75-996491acd504.png)

**B2: Sau khi list ngành học hiển thị, người dùng click vào từng ngành để xem chi tiết các khóa học trong từng ngành.**:

![image](https://user-images.githubusercontent.com/58178423/236591200-67d030cd-6330-41a4-aba1-cd474256800c.png)

![image](https://user-images.githubusercontent.com/58178423/236591028-adbc8587-d639-444c-94ce-6474a9defad2.png)


# 3. Phân tích thiết kế (database, cách viết functions, method call flowchart nếu cần)

Trong file src\app\tab\tab.page.ts gọi hàm getProduct() call dữ liệu tất cả các ngành học để hiển thị ra giao diện
     async getProduct() {
       const loading = await this.loadingController.create({
         message: 'Vui lòng chờ...',
       });
       loading.present();
       return new Promise(resolve => {
         this.http
           .get(
             `${this.url}/wp-json/wc/v3/products/categories?per_page=100&consumer_key=${
               this.consumerKey
             }&consumer_secret=${this.consumerSecret}`
           )
           .subscribe(productData => {
             resolve(productData);
             const jsonValue = JSON.stringify(productData);
             const valueFromJson = JSON.parse(jsonValue);
             this.categories=  valueFromJson.filter((item) => (
               item.id !== 16
           ))
           loading.dismiss();
           });
       });
     }

Trong file src\app\category\category.page.ts gọi hàm Productcategory() call dữ liệu tất cả các khóa học trong từng ngành tương ứng để hiển thị ra giao diện

      async Productcategory() {
        const loading = await this.loadingController.create({
          message: 'Vui lòng chờ...',
        });
        loading.present();
        return new Promise(resolve => {
          this.http
            .get(
              `${this.url}/wp-json/wc/v3/products?category=${this.category.id}&page=1&consumer_key=${
                this.consumerKey
              }&consumer_secret=${this.consumersecret}`
            )
            .subscribe(productData => {
              resolve(productData);
              const jsonValue = JSON.stringify(productData);
              const valueFromJson = JSON.parse(jsonValue);

               let temp: any[] = valueFromJson.filter((item) => (
                item.images.length !== 0
            ))

            for(let i = 0; i <temp.length; i++){
              if(temp[i].name.length >= 30){

                  temp[i].name1 = temp[i].name.substr(0,30) + '...'

              } else {
                temp[i].name1 = temp[i].name
              }

            }

            this.products = this.products.concat(temp);
            loading.dismiss()
          })
        })

      }

Trong file src\core\features\mainmenu\mainmenu-lazy.module.ts ta khai báo loadChildren để khi click vào biểu tượng tìm kiếm sẽ chạy đến TabPageModule hiển thị ra giao diện ngành:

     {
        path: CoreMainMenuProvider.MORE_PAGE_NAME0,
        loadChildren: () => import('../../../app/tab/tab.module').then( m => m.TabPageModule)
     },

     {
        path: CoreMainMenuProvider.MORE_PAGE_NAME9,
        loadChildren: () => import('../../../app/category/category.module').then( m => m.CategoryPageModule)
     },

Ta khai báo static readonly MORE_PAGE_NAME0 = 'tab' ở file src\core\features\mainmenu\services\mainmenu.ts để path chạy đến main/tab

Ta khai báo static readonly MORE_PAGE_NAME9 = 'category' ở file src\core\features\mainmenu\services\mainmenu.ts để path chạy đến main/category

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/main-TUAF...38-feature_xay_dung_giao_dien_xem__khoa_hoc_theo_tung_nganh_tai_trang_mua_hang_tren_app_vmc

# 5. Kiểm thử (nếu cần)


# 6. Triển khai (Hướng dẫn triển khai, lưu ý khi upload nên appstore. nếu cần)
