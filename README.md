# Tài liệu xây dựng giao diện và chức năng xem sản phẩm tại trang mua hàng trên App VMC

1. **Tên tính năng**: xây dựng giao diện và chức năng xem sản phẩm tại trang mua hàng trên App VMC
2. **Project**: vmc
3. **Người phát triển**: huytq72@wru.vn
4. **Người yêu cầu**: minhpl@aum.edu.vn
5. **Tham chiếu ERP:**
6. **Mã nguồn:**
	1. **branch**: https://github.com/minhpl/thmoodleapp/tree/33-feature_xay_dung_giao_dien_xem_khoa_hoc_tai_trang_mua_hang_tren_App_VMC
	2. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp

# 1. Yêu cầu:

Người dùng đăng nhập vào app VMC-e và bấm vào nút xem khóa học để xem list khóa học.

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Người dùng đăng nhập vào App VMC-e và bấm chọn vào phần xem khóa học**:

![image](https://user-images.githubusercontent.com/58178423/236368455-eb159a29-02bb-45fb-abc8-e2e4001385a0.png)


**B2: Sau đó, giao diện xem sản phẩm xuất hiện. Người dùng xem được list danh sách khóa học nổi bật và list danh sách khóa học xu hướng**:

![image](https://user-images.githubusercontent.com/58178423/236368974-fde3018f-6dcd-43e7-ac2b-b7b618f0cb5e.png)

![image](https://user-images.githubusercontent.com/58178423/236369308-1c7a07db-4cd2-451f-908f-e628e16183a1.png)


# 3. Phân tích thiết kế (database, cách viết functions, method call flowchart nếu cần)

Trong file src\app\discover\discover.page.ts gọi hàm getProduct() để call dữ liệu lấy ra list danh sách khóa học để hiển thị trên giao diện.

    async getProduct() {
          const loading = await this.loadingController.create({
            message: 'Vui lòng chờ...',
          });
          loading.present();
          return new Promise(resolve => {
            this.http
              .get(
                `${this.url}/wp-json/wc/v3/products?per_page=14&consumer_key=${
                  this.consumerKey
                }&consumer_secret=${this.consumerSecret}`
              )
              .subscribe(productData => {
                resolve(productData);
                const jsonValue = JSON.stringify(productData);
                   let temp: any[] = JSON.parse(jsonValue).slice(0,6).filter((item) => (
                item.images.length !== 0
              ));

              for(let i = 0; i <temp.length; i++){
                if(temp[i].name.length >= 40){

                    temp[i].name1 = temp[i].name.substr(0,40) + '...';

                    temp[i].short_description = temp[i].short_description.replace('<p>', ' ').replace('</p>', ' ')


                  } else {
                    temp[i].name1 = temp[i].name
                    temp[i].short_description = temp[i].short_description.replace('<p>', ' ').replace('</p>', ' ')
                  }
                }

                this.products = temp;
                let temp2: any[] = JSON.parse(jsonValue).slice(6,13).filter((item) => (
                  item.images.length !== 0
                ))

                for(let j = 0; j <temp2.length; j++){
                  if(temp2[j].name.length >= 40){

                      temp2[j].name1 = temp2[j].name.substr(0,40) + '...'

                      temp2[j].short_description = temp2[j].short_description.replace('<p>', ' ').replace('</p>', ' ')

                      // this.products.push(temp[i]);
                  }else {
                    temp2[j].name1 = temp2[j].name

                    temp2[j].short_description = temp2[j].short_description.replace('<p>', ' ').replace('</p>', ' ')
                  }
                }

              this.productscombo =  temp2;
              loading.dismiss();

              });
            });

    }

Trong file src\core\features\mainmenu\mainmenu-lazy.module.ts ta khai báo loadChildren để khi click vào biểu tượng xem khóa học sẽ chạy đến DiscoverPageModule hiển thị ra page khóa học:

    {
        path: CoreMainMenuProvider.MORE_PAGE_NAME3,
        loadChildren: () => import('../../../app/discover/discover.module').then( m => m.DiscoverPageModule)
    },

Ta khai báo static readonly MORE_PAGE_NAME3 = 'discover' ở file src\core\features\mainmenu\services\mainmenu.ts để path chạy đến main/discover

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/main...33-feature_xay_dung_giao_dien_xem_khoa_hoc_tai_trang_mua_hang_tren_App_VMC

# 5. Kiểm thử (nếu cần)


# 6. Triển khai (Hướng dẫn triển khai, lưu ý khi upload nên appstore. nếu cần)
