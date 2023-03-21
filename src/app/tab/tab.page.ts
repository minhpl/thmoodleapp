import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { HTTP } from '@ionic-native/http/ngx';
import { CoreSites } from '@services/sites';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.page.html',
  styleUrls: ['./tab.page.scss'],
})
export class TabPage implements OnInit {

  url:any;
  consumerKey:any;
  consumerSecret:any;
  products: any[] | undefined;
  categories: any[] | undefined;

  constructor(public http: HTTP, private nav:NavController,private loadingController:LoadingController,public alertCtrl: AlertController) {
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

    this.getProduct();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CategoryPage');
  }

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
          }&consumer_secret=${this.consumerSecret}`,{},{}
        )
        .then(productData => {
          resolve(productData);
          const valueFromJson = JSON.parse(productData.data);
          this.categories=  valueFromJson.filter((item) => (
            item.id !== 16
        ))
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

  view_cart() {
    this.nav.navigateForward(['main/cart'])
  }

  openCategoryPage(category){

    this.nav.navigateForward(['main/category', { data: JSON.stringify(category), url: this.url, consumerKey: this.consumerKey, consumersecret:this.consumerSecret }])
  }

  doRefresh(event) {
    console.log('Begin async operation');

    this.getProduct();

    setTimeout(() => {
      console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
  }

}
