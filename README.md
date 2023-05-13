# Tài liệu Xây dựng giao diện và chức năng giỏ hàng để mua nhiều khóa học trên App VMC

1. **Tên tính năng**: Xây dựng giao diện và chức năng giỏ hàng để mua nhiều khóa học trên App VMC
2. **Project**: vmc
3. **Người phát triển**: huytq72@wru.vn
4. **Người yêu cầu**: minhpl@aum.edu.vn
5. **Tham chiếu ERP:**
6. **Mã nguồn:**
	1. **branch**: https://github.com/minhpl/thmoodleapp/tree/45-feature_xay_dung_giao_dien_va_chuc_nang_gio_hang_de_mua_nhieu_khoa_hoc_tren_app_vmc
	2. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp/tree/main

# 1. Yêu cầu:

 Người dùng thêm được nhiều khóa học vào giỏ hàng và mua được nhiều khóa học trong cùng một đơn hàng.

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Người dùng truy cập vào chi tiết khóa học cần mua và thêm khóa học đó vào giỏ hàng**:

![image](https://github.com/minhpl/thmoodleapp/assets/58178423/f8b0af4b-911b-4dda-99a0-af3a9ca7b050)

**B2: Sau khi thêm khóa học vào giỏ hàng thành công, để kiểm tra giỏ hàng hoặc tiến hành mua người dùng bấm vào nút giỏ hàng như trên hình**:

![image](https://github.com/minhpl/thmoodleapp/assets/58178423/31e4230d-7f9c-432b-9d70-4a6b2554e670)

**B3: Sau đó, giao diện giỏ hàng hiển thị. Người dùng kiểm tra lại thông tin đơn hàng và nếu muốn mua có thể tiến hành nhập mã giảm giá(nếu có) và bấm nút thanh toán.Khi thêm nhầm khóa học vào giỏ hàng người dùng có quyền xóa khóa học khỏi giỏ hàng khi bấm vào nút X trên hình vẽ**:

![image](https://github.com/minhpl/thmoodleapp/assets/58178423/033bc374-a4d7-4b39-a56d-a0771e6d7c2b)

**B4: Khi người dùng muốn mua thêm khóa học khác. Thực hiện thao tác tương tự để khóa học được thêm vào giỏ hàng. Sau đó, người dùng có thể thanh toán được nhiều khóa học trong một giỏ hàng**:

![image](https://github.com/minhpl/thmoodleapp/assets/58178423/9fb50a13-5946-46e7-99d6-1c2afe288480).

# 3. Phân tích thiết kế (database, cách viết functions, method call flowchart nếu cần)
Trong file src\app\cart\cart.page.ts dùng functions ngOnInit() để lấy dữ liệu khóa học đã được thêm vào stronge và xử lý

      async ngOnInit() {
          const site = await CoreSites.getSite();
          const userId = site.getUserId()
          console.log(userId)
          const storage1 =await this.storage.create();
          this.storage = storage1;

          this.storage.get(`${userId}`).then((data) => {
            console.log(data)
            if(data == null) {
              this.boolean = false;
              this.boolean1 = true;
            }else {
              if(data.length != 0) {
                this.boolean = true;
                this.boolean1 = false;
                data.forEach((item) => {
                  if(item.userId == userId) {
                    this.cartItems.push(item)
                  }
                })
              }else {
                this.boolean = false;
                this.boolean1 = true;
              }
            }
            this.cartItems.forEach((item) => {
              this.total = this.total + Number(item.product.sale_price);
              this.sale_price_new = this.total
              console.log(item.product.sale_price)
            })
          });
        }

Trong file src\app\cart\cart.page.ts gọi hàm getCode() để  call dữ liệu các mã giảm giá có trên hệ thống.

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

Cũng trong file src\app\cart\cart.page.ts gọi hàm CodeSale() để tính toán giá bán khóa học khi áp dụng mã giảm giá.

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

# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/main-TUAF...45-feature_xay_dung_giao_dien_va_chuc_nang_gio_hang_de_mua_nhieu_khoa_hoc_tren_app_vmc

# 5. Kiểm thử (nếu cần)


# 6. Triển khai (Hướng dẫn triển khai, lưu ý khi upload nên appstore. nếu cần)
