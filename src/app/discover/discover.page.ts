import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavController, ModalController, LoadingController, AlertController } from '@ionic/angular';
import { HTTP } from '@ionic-native/http/ngx';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ProductdetailsPage } from '../productdetails/productdetails.page';
import { Storage } from '@ionic/storage-angular';
import { CoreSites } from '@services/sites';
import { rejects } from 'assert';

declare var google: any;

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit {

  url:any;
  consumerKey:any;
  consumerSecret:any;
  products: any[] | undefined;
  productscombo: any[] | undefined;
  // @ViewChild('productSlides') productSlides: Slides;
  imglogo: any;
  imgbanner1: any;
  imgbanner2: any;
  imgbanner3: any;
  imgbanner4: any;
  total_product: any;
  boolean_total: boolean | undefined;
  adasd: any;

  private slideOpts = {
    initialSlide: 0,
    speed: 500,
    spaceBetween: -5,
    slidesPerView: 1.55
  }

  private slideOpts1 = {
    initialSlide: 0,
    speed: 500,
    slidesPerView: 1,
    pager: true
  }

  constructor(public alertCtrl: AlertController,private storage: Storage, public http: HTTP, private router:Router, private nav:NavController,private loadingController:LoadingController, private modal: ModalController) {
  }

  async ngOnInit(): Promise<void> {

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
      if(data == null) {
        this.boolean_total = false;
      }else {
        if(data.length != 0) {
          this.total_product  = data.length;
          this.boolean_total = true;
        }else {
          this.boolean_total = false;
        }
      }
    });

    this.getProduct();
  }

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
          }&consumer_secret=${this.consumerSecret}`,{},{}
        )
        .then(productData => {
          resolve(productData);
             let temp: any[] = JSON.parse(productData.data).slice(0,6).filter((item) => (
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
          let temp2: any[] = JSON.parse(productData.data).slice(6,13).filter((item) => (
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

  // spa() {
  //   this.nav.navigateForward(['main/map'])
  // }

  // hospital() {
  //   this.nav.navigateForward(['main/hospital'])
  // }


  async openProductPage(product) {
    this.nav.navigateForward(['main/productdetails', {data: JSON.stringify(product), url: this.url, consumerKey: this.consumerKey, consumersecret:this.consumerSecret}])
  }

  Search() {
    this.nav.navigateForward(['main/search',{url: this.url, consumerKey: this.consumerKey, consumersecret:this.consumerSecret}])
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
