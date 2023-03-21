import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ModalController, NavController } from '@ionic/angular';
import { HTTP } from '@ionic-native/http/ngx';

// import { LoadingController, NavController, NavParams } from '@ionic-angular';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
})
export class PaymentPage implements OnInit {

  product: any;
  video: any;
  protected subscription;
  protected langObserver;
  protected updateSiteObserver;
  siteInfo: any;
  protected siteId;
  codesale = '';
  code!: any[];
  coupons!: any[];
  sale_price_new: number;
  boolean: boolean | undefined;
  boolean2: boolean | undefined;
  boolean3: boolean | undefined
  item: any;
  param: any;
  url: any;
  consumerKey:any;
  consumersecret:any

  currentFood = undefined;

  constructor(public alertCtrl: AlertController, private route: ActivatedRoute, public nav:NavController, public http: HTTP,private navController: NavController,private loadingController:LoadingController, private modal: ModalController) {
    this.url = this.route.snapshot.params['url']
    this.consumerKey = this.route.snapshot.params['consumerKey']
    this.consumersecret = this.route.snapshot.params['consumersecret']
    this.item = this.route.snapshot.params['data']
    this.product = JSON.parse(this.item)
    this.sale_price_new = this.product.sale_price
    this.getCode();

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
          }&consumer_secret=${this.consumersecret}`,{},{}
        )
      .then(data => {
        resolve(data);
        let code1:any[] =  JSON.parse(data.data)
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

  async onBack() {
    this.navController.back()
  }


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

  Payment(product) {
    if(this.coupons != undefined) {
      this.nav.navigateForward(['main/payload', { data: JSON.stringify(product),price : this.sale_price_new, coupons: JSON.stringify(this.coupons) ,url: this.url, consumerKey: this.consumerKey, consumersecret:this.consumersecret}])
    }else {
      this.nav.navigateForward(['main/payload', { data: JSON.stringify(product),price : this.sale_price_new ,url: this.url, consumerKey: this.consumerKey, consumersecret:this.consumersecret}])
    }
  }

  ngOnInit() {
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
