import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavController, NavParams, ModalController, LoadingController } from '@ionic/angular';
import { HTTP } from '@ionic-native/http';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ProductdetailsPage } from '../productdetails/productdetails.page';
import { Storage } from '@ionic/storage-angular';
import { CoreSites } from '@services/sites';

declare var google: any;

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit {

  url:any = 'https://vmcvietnam.org';
  consumerKey:any = 'ck_a8d7832eeec157aa837f08035d0d38a584b84959';
  consumerSecret:any = 'cs_b2054352baefb9857816fa33a3546e3157dfcb05';
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

  private slideOpts = {
    initialSlide: 0,
    speed: 500,
    spaceBetween: -5,
    slidesPerView: 1.55
  }

  private slideOpts1 = {
    initialSlide: 0,
    speed: 500,
    // spaceBetween: 10,
    slidesPerView: 1,
    pager: true
  }

  constructor(private storage: Storage, public http: HttpClient, private router:Router, private nav:NavController,private loadingController:LoadingController, private modal: ModalController) {
    this.getProduct();
  }

  async ngOnInit(): Promise<void> {

    const site = await CoreSites.getSite();

    const userId = site.getUserId()
    console.log(userId)
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
          }&consumer_secret=${this.consumerSecret}`
        )
        .subscribe(productData => {
          resolve(productData);
          const jsonValue = JSON.stringify(productData);
             let temp: any[] = JSON.parse(jsonValue).slice(0,6).filter((item) => (
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
          let temp2: any[] = JSON.parse(jsonValue).slice(6,13).filter((item) => (
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
    //console.log(product.id)
    this.nav.navigateForward(['main/productdetails', { data: JSON.stringify(product)}])
    //this.router.navigate(['/product-details', product.id]);
  }

  Search() {
    this.nav.navigateForward(['main/search'])
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
