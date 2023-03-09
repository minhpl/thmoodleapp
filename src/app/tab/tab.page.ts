import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoadingController, NavController } from '@ionic/angular';
import { HTTP } from '@ionic-native/http/ngx';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.page.html',
  styleUrls: ['./tab.page.scss'],
})
export class TabPage implements OnInit {

  url:any = 'https://vmcvietnam.org';
  consumerKey:any = 'ck_a8d7832eeec157aa837f08035d0d38a584b84959';
  consumerSecret:any = 'cs_b2054352baefb9857816fa33a3546e3157dfcb05';
  products: any[] | undefined;
  categories: any[] | undefined;

  constructor(public http: HttpClient, private nav:NavController,private loadingController:LoadingController) {
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

      // this.http.get(`${this.url}/wp-json/wc/v3/products/categories?per_page=100&consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`, {}, {})
      // .then(data => {
      //   resolve(data);
      //   this.categories=  JSON.parse(data.data).filter((item) => (
      //            item.id !== 16
      //      ))
      //   loading.dismiss();
      // })
    });
  }

  view_cart() {
    this.nav.navigateForward(['main/cart'])
  }

  openCategoryPage(category){

    this.nav.navigateForward(['main/category', { data: JSON.stringify(category)  }])
  }

  doRefresh(event) {
    console.log('Begin async operation');

    this.getProduct();

    setTimeout(() => {
      console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
  }

  ngOnInit() {
  }

}
