# Tài liệu Xây dựng giao diện và chức năng mua hàng có kèm mã giảm giá trên App VMC

1. **Tên tính năng**: Xây dựng giao diện và chức năng mua hàng có kèm mã giảm giá trên App VMC
2. **Project**: vmc
3. **Người phát triển**: huytq72@wru.vn
4. **Người yêu cầu**: minhpl@aum.edu.vn
5. **Tham chiếu ERP:**
6. **Mã nguồn:**
	1. **branch**: https://github.com/minhpl/thmoodleapp/tree/43-feature_xay_dung_giao_dien_va_chuc_nang_mua_hang_kem_ma_giam_gia_tren_app_vmc
	2. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp/tree/main

# 1. Yêu cầu:

Người dùng mua hàng có kèm mã giảm giá trực tiếp trên App VMC.

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Người dùng xem khóa học và bấm nút mua ngay**:

![image](https://user-images.githubusercontent.com/58178423/236715106-186422ba-a986-420b-bf12-cbab9a94e144.png)

**B2: Sau khi bấm nút mua ngay, giao diện thông tin thanh toán được hiển thị gồm giá gốc, giá sale, mã giảm giá và tổng tiền cần thanh toán**:

![image](https://user-images.githubusercontent.com/58178423/236715362-70206a25-147a-477f-9ef0-4dc07d0de243.png)

**B3: Sau khi xem đầy đủ thông tin về giá bán khóa học, người dùng bấm nút thanh toán để tiến hành mua khóa học. Sau đó, người dùng thanh toán và bấm xác nhận để hoàn thành việc mua khóa học**:

![image](https://github.com/minhpl/thmoodleapp/assets/58178423/3ddcf877-064c-4ea1-b7e0-f1465798732b)


# 3. Phân tích thiết kế (database, cách viết functions, method call flowchart nếu cần)
Trong file src\app\payment\payment.page.ts gọi hàm getCode() để  call dữ liệu các mã giảm giá có trên hệ thống.

    async getCode() {
       const loading = await this.loadingController.create({
         message: 'Vui lòng chờ...',
       });
       loading.present();
       return new Promise(resolve => {
         this.http
           .get(
             `${this.url}/wp-json/wc/v3/coupons?consumer_key=${
               this.consumerKey
             }&consumer_secret=${this.consumersecret}`
           )
         .subscribe(data => {
           resolve(data);
           let code1:any[] =  JSON.parse(JSON.stringify(data))
             for(let i = 0; i <code1.length; i++){
               if(code1[i].date_expires != null) {
                 // code1[i].date_expires1 =new Date(code1[i].date_expires.split("T")[0])
                 code1[i].date_expires1 = Date.parse(code1[i].date_expires.replace('T', ' '))
               }
             }
             this.code = code1
           loading.dismiss();
         })
       });
    }

Cũng trong file src\app\payment\payment.page.ts gọi hàm CodeSale() để tính toán giá bán khóa học khi áp dụng mã giảm giá.

    CodeSale() {
      if(this.codesale != undefined) {
        var codesl = this.code.filter((item) => (
          item.code.toLowerCase() === this.codesale.toLowerCase() && item.date_expires1 >= new Date().getTime()
        ))
        this.coupons = codesl
        console.log(this.coupons)
        this.boolean2 = false
        if(codesl.length !== 0) {
          var sale_price_new = (Number(this.product.sale_price / 1000) - ((this.product.sale_price)/1000  * ((codesl[0].amount) / 100)))
          if(!(Number.isInteger(sale_price_new))) {
            this.sale_price_new = Math.ceil(sale_price_new) * 1000
          }else {
            this.sale_price_new = (Number(this.product.sale_price) - (Number(this.product.sale_price)  * (Number(codesl[0].amount) / 100)))
          }
          this.boolean = false;
          this.boolean3 = true;
        } else  {
          this.boolean = true;
          this.boolean3 = false;
          this.sale_price_new = this.product.sale_price;
        }
      }else {
        this.boolean3 = false;
        this.boolean2 = true;
        this.boolean = false;
      }
  }

Trong file src\app\payload\payload.page.ts ta gọi hàm placeOrder() để gửi dữ liệu đơn hàng lên hệ thống.

      async placeOrder() {
          if(this.phonenumber  == '') {
            this.contact = this.theuser.phone1
          }else {
            this.contact = this.phonenumber
          }

          let orderItems: any[] = [];
          let data: any = {};
          let codecoupons: any[] = [];


          if(this.coupons != undefined && this.coupons.length != 0) {
            codecoupons.push({
              code: this.coupons[0].code,
            });
          }
          let paymentData: any = {};


          const site = await CoreSites.getSite();
          const userId = site.getUserId();
          const storage1 = await this.storage.create();
          this.storage = storage1;
          data = {
            payment_method: this.payload_bacs.id,
            payment_method_title: this.payload_bacs.method_title,
            //set_paid: true,

            billing: {
              address_1: this.address,
              last_name: this.theuser.fullname,
              email: this.theuser.email,
              phone: this.contact,
            },
            line_items: orderItems,
            coupon_lines: codecoupons,
          };
          if(this.cart) {
            orderItems.push({
              product_id: this.cart.id,
              price: this.price_new_post,
              total: this.price_new_post
            });
            data.line_items = orderItems;
          }else {
            const data = await storage1.get(`${userId}`);
              data.map((item) => {
                if(this.coupons != undefined && this.coupons.length != 0) {
                  var sale_price_new = (Number(item.product.sale_price / 1000) - (Number(item.product.sale_price)/1000  * (Number(this.coupons[0].amount) / 100)))
                  console.log(sale_price_new)
                  if(!(Number.isInteger(sale_price_new))) {
                    this.sale_price_new = Math.ceil(sale_price_new) * 1000
                  }else {
                    this.sale_price_new = (Number(item.product.sale_price) - (Number(item.product.sale_price)  * (Number(this.coupons[0].amount) / 100)))
                  }
                  orderItems.push({
                    product_id: item.product.id,
                    price: this.sale_price_new,
                    total: this.sale_price_new,
                    //quantity: 1
                  })
                }else {
                  this.sale_price_new = Number(item.product.sale_price)
                  orderItems.push({
                    product_id: item.product.id,
                    price: this.sale_price_new,
                    total: this.sale_price_new,
                  })
                }
              });
          }

          data.line_items = orderItems;

          const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded'
          });

          if(this.phonenumber != '') {
            return new Promise(resolve => {
              this.http
                .post(
                  `${this.url}/wp-json/wc/v3/orders/?consumer_key=${
                    this.consumerKey
                  }&consumer_secret=${this.consumersecret}`,
                  data,
                  { headers }
                )
                .subscribe(data => {
                  resolve(data);
                });

                this.presentAlert();
                storage1.remove(`${userId}`);
                this.navController.navigateForward(['main/discover'])
              });
          }
          else if((this.phonenumber == '') && this.theuser.phone1 !== undefined && this.validPhone == true) {
            return new Promise(resolve => {
              this.http
                .post(
                  `${this.url}/wp-json/wc/v3/orders/?consumer_key=${
                    this.consumerKey
                  }&consumer_secret=${this.consumersecret}`,
                  data,
                  { headers }
                )
                .subscribe(data => {
                  resolve(data);
                });

                this.presentAlert();
                storage1.remove(`${userId}`);
                this.navController.navigateForward(['main/discover'])
              });
          }
          else if((this.theuser.phone1 == undefined || this.validPhone == false) && (this.phonenumber == '')) {
            let toast = await this.toastCtrl.create({
              message: 'Bạn chưa điền số điện thoại hoặc số điện thoại không hợp lệ!',
              duration: 3000,
              position: 'top'
            });
            toast.present();
          }else{
            console.log('TH4')
            let toast = await this.toastCtrl.create({
              message: 'Đơn hàng bị lỗi, bạn vui lòng thao tác lại',
              duration: 3000,
              position: 'top'
            });

            toast.present();
          }

      }

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/main-TUAF...43-feature_xay_dung_giao_dien_va_chuc_nang_mua_hang_kem_ma_giam_gia_tren_app_vmc

# 5. Kiểm thử (nếu cần)

![image](https://github.com/minhpl/thmoodleapp/assets/58178423/2aa7f1f8-8ab9-41bb-0-2da850cb2022)

# 6. Triển khai (Hướng dẫn triển khai, lưu ý khi upload nên appstore. nếu cần)
