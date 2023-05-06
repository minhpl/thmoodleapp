import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { HTTP } from '@ionic-native/http';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, ModalController, NavController } from '@ionic/angular';
import { ProductdetailsPage } from '../productdetails/productdetails.page';


@Component({
  selector: 'app-category',
  templateUrl: './category.page.html',
  styleUrls: ['./category.page.scss'],
})
export class CategoryPage implements OnInit {

  products: any[] = [];
  moreproduct: any[] = []
  products1: any[] | undefined;
  products2: any[] | undefined;
  page: number;
  page2: number | undefined;
  category: any;
  url: any;
  consumerKey:any;
  consumersecret:any
  item: any;

  constructor(public alertCtrl: AlertController, public http: HttpClient, private route: ActivatedRoute, private nav:NavController ,private loadingController:LoadingController, private modal: ModalController) {
      this.url = this.route.snapshot.params['url']
      this.consumerKey = this.route.snapshot.params['consumerKey']
      this.consumersecret = this.route.snapshot.params['consumersecret']
      this.page = 2;
      this.item = this.route.snapshot.params['data']
      this.category = JSON.parse(this.item)
  }

  async loadData(event) {
    const loading = await this.loadingController.create({
      message: 'Vui lòng chờ...',
    });
    loading.present();
    for (let page = 2; page <= 100; page++) {
      return new Promise(resolve => {
        this.http
          .get(
            `${this.url}/wp-json/wc/v3/products?category=${this.category.id}&page=${this.page}&consumer_key=${
              this.consumerKey
            }&consumer_secret=${this.consumersecret}`
          )
          .subscribe(async productData => {
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


          if(temp.length != 0) {
            this.page ++
          }else {}

        })
      })
    }
        event.target.complete();
        loading.dismiss()
  }

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


  view_cart() {
    this.nav.navigateForward(['main/cart'])
  }

  async openProductPage(product) {
    this.nav.navigateForward(['main/productdetails', { data: JSON.stringify(product), url: this.url, consumerKey: this.consumerKey, consumersecret:this.consumersecret }])
  }


  async ngOnInit() {
    if(this.route.snapshot.params['product']) {
      this.products = JSON.parse(this.route.snapshot.params['product'])
    }
    this.Productcategory();
  }

  onBack() {
    this.nav.back()
  }

  doRefresh(event) {
    console.log('Begin async operation');
    this.products = [];
    this.Productcategory();
    setTimeout(() => {
      console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
  }

}
