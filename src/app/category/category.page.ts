import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { HTTP } from '@ionic-native/http';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, ModalController, NavController } from '@ionic/angular';
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
  category: any;
  url:any = 'https://vmcvietnam.org';
  consumerKey:any = 'ck_a8d7832eeec157aa837f08035d0d38a584b84959';
  consumerSecret:any = 'cs_b2054352baefb9857816fa33a3546e3157dfcb05';
  item: any;

  constructor( public http: HttpClient, private route: ActivatedRoute, private nav:NavController ,private loadingController:LoadingController, private modal: ModalController) {
      this.page = 1;
      this.item = this.route.snapshot.params['data']
      this.category = JSON.parse(this.item)
  }

  async loadData(event) {
    for (let page = 1; page < 100; page++) {
      return new Promise(resolve => {
        this.http
          .get(
            `${this.url}/wp-json/wc/v3/products?category=${this.category.id}&page=${this.page}&consumer_key=${
              this.consumerKey
            }&consumer_secret=${this.consumerSecret}`
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

          this.page ++

          event.target.complete();
        });
  })
    }

}


  view_cart() {
    this.nav.navigateForward(['main/cart'])
  }

  async openProductPage(product) {
    this.nav.navigateForward(['main/productdetails', { data: JSON.stringify(product) }])
  }


  async ngOnInit() {
    if(this.route.snapshot.params['product']) {
      this.products = JSON.parse(this.route.snapshot.params['product'])
    }

    const loading = await this.loadingController.create({
      message: 'Vui lòng chờ...',
    });
    loading.present();
    await this.loadData(null)
    loading.dismiss()
  }

  onBack() {
    this.nav.back()
  }

  doRefresh(event) {
    console.log('Begin async operation');

    this.loadData(null);
    setTimeout(() => {
      console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
  }

}
