import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { CoreSites } from '@services/sites';


@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit {

  cartItems: any[] = [];
  total: any;
  boolean: boolean | undefined;
  boolean1: boolean | undefined;
  url:any = 'https://vmcvietnam.org';
  consumerKey:any = 'ck_a8d7832eeec157aa837f08035d0d38a584b84959';
  consumerSecret:any = 'cs_b2054352baefb9857816fa33a3546e3157dfcb05';
  code!: any[];
  coupons!: any[];
  codesale = '';
  boolean_code: boolean | undefined;
  boolean_code2: boolean | undefined;
  boolean3: boolean | undefined
  sale_price_new: number | undefined;

  currentFood = undefined;

  constructor(private nav:NavController,private storage: Storage,public alertCtrl: AlertController,private loadingController:LoadingController,public http: HttpClient) {
    this.total = 0;
    this.getCode();
   }

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



    console.log(this.total);
    console.log(this.cartItems);

  }


  onBack() {
    this.nav.back()
  }

  async removeFromCart(item,i) {
    const alert = await this.alertCtrl.create({
      header: 'Thông báo',
      message: 'Bạn muốn xóa sản phẩm khỏi giỏ hàng?',
      buttons: [ {
        text: 'Đồng ý',
        role: 'destructive',
        handler: () => this.remove(item,i)
        }, {
        text: 'Hủy',
        role: 'cancel',
      }]
  });


  await alert.present();
  }

  async remove(item,i) {
    const site = await CoreSites.getSite();

    const userId = site.getUserId()

    this.cartItems.splice(i,1);

    this.total = this.total - item.product.sale_price;

    this.sale_price_new = this.total

    if(this.cartItems.length != 0) {

    }else {
      this.boolean = false;
      this.boolean1 = true;
      console.log('hh')
    }

    this.storage.set(`${userId}`, this.cartItems).then(() => {

    })
  }


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
          }&consumer_secret=${this.consumerSecret}`
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
          console.log(this.code)
          console.log(new Date().getTime())
        loading.dismiss();
      })
    });
  }

  CodeSale() {
    if(this.codesale != undefined) {
      var codesl = this.code.filter((item) => (
        item.code.toLowerCase() === this.codesale.toLowerCase() && item.date_expires1 >= new Date().getTime()
      ))
      this.coupons = codesl
      console.log(this.coupons)
      this.boolean_code2 = false
      if(codesl.length !== 0) {
        var sale_price_new = (Number(this.total / 1000) - ((this.total)/1000  * ((codesl[0].amount) / 100)))
        if(!(Number.isInteger(sale_price_new))) {
          this.sale_price_new = Math.ceil(sale_price_new) * 1000
        }else {
          this.sale_price_new = (Number(this.total) - (Number(this.total)  * (Number(codesl[0].amount) / 100)))
        }
        this.boolean_code = false;
        this.boolean3 = true;
      } else  {
        this.boolean_code = true;
        this.sale_price_new = this.total;
        this.boolean3 = false;
      }
    }else {
      this.boolean_code2 = true;
      this.boolean_code = false;
      this.boolean3 = false;
    }
  }

  Payment(product) {
    if(this.coupons != undefined) {
      this.nav.navigateForward(['main/payload', { price : this.sale_price_new, coupons: JSON.stringify(this.coupons)}])
    }else {
      this.nav.navigateForward(['main/payload', { price : this.sale_price_new}])
    }
    //this.nav.navigateForward(['main/payload', {price : this.sale_price_new, coupons: JSON.stringify(this.coupons)}])
  }

  customAlertOptions = {
    header: 'Chọn phương thức',
    message: 'Vui lòng chọn 1 phương thức',
    translucent: true,
  };

  handleChange(ev) {
    this.currentFood = ev.target.value;
    console.log(ev.target.value)
  }
}
