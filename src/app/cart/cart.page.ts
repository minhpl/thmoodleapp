import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { CoreSites } from '@services/sites';
import { HTTP } from '@ionic-native/http/ngx';

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
  url:any;
  consumerKey:any;
  consumerSecret:any;
  code!: any[];
  coupons!: any[];
  codesale = '';
  boolean_code: boolean | undefined;
  boolean_code2: boolean | undefined;
  boolean3: boolean | undefined
  sale_price_new: number | undefined;

  currentFood = undefined;

  constructor(public http: HTTP,private nav:NavController,private storage: Storage,public alertCtrl: AlertController,private loadingController:LoadingController) {
    this.total = 0;
   }

  async ngOnInit() {
    const site = await CoreSites.getSite();

    const userId = site.getUserId()

    var data: any = {
      userid: userId,
    };

    const preSets = {
        getFromCache: false,
    };
    await site.write('th_woocommerce_key_api', data, preSets).then((data) => {

      this.url = JSON.parse(JSON.stringify(data)).url_woocommerce

      this.consumerKey = JSON.parse(JSON.stringify(data)).consumerKey_woocommerce

      this.consumerSecret = JSON.parse(JSON.stringify(data)).consumerSecret_woocommerce

    }).catch((e) => {
         console.log(e)
    });

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

    this.getCode();
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
          }&consumer_secret=${this.consumerSecret}`,{},{}
        )
      .then(data => {
        resolve(data);
        let code1:any[] =  JSON.parse(data.data)
          for(let i = 0; i <code1.length; i++){
            if(code1[i].date_expires != null) {
              code1[i].date_expires1 = Date.parse(code1[i].date_expires.replace('T', ' '))
            }
          }
          this.code = code1
        loading.dismiss();
      })
      .catch(async error => {
        const alert = await this.alertCtrl.create({
          header: 'Thông báo',
          message: 'Đã xảy ra lỗi bạn vui lòng load lại trang!',
          buttons: ['OK']
        });
        loading.dismiss();
        await alert.present();

      });
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

  Payment() {
    if(this.coupons != undefined) {
      this.nav.navigateForward(['main/payload', { price : this.sale_price_new, coupons: JSON.stringify(this.coupons) ,url: this.url, consumerKey: this.consumerKey, consumersecret:this.consumerSecret}])
    }else {
      this.nav.navigateForward(['main/payload', { price : this.sale_price_new,url: this.url, consumerKey: this.consumerKey, consumersecret:this.consumerSecret}])
    }
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
