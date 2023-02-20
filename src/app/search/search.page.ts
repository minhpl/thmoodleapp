import { Component, OnInit } from '@angular/core';
import { NavController, ModalController , LoadingController} from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { HTTP } from '@ionic-native/http';
import { ProductdetailsPage } from '../productdetails/productdetails.page';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit {

  url:any = 'https://vmcvietnam.org';
  consumerKey:any = 'ck_a8d7832eeec157aa837f08035d0d38a584b84959';
  consumerSecret:any = 'cs_b2054352baefb9857816fa33a3546e3157dfcb05';
  products!: any[];
  searchQuery: string = "";
  lista: string[] | undefined;
  pet!: string;
  boolean: boolean | undefined;
  boolean2: boolean | undefined;

  constructor(public navCtrl: NavController, public http: HttpClient, public modalCtrl:ModalController, public loadingCtrl: LoadingController, private modal: ModalController) { }

  ngOnInit() {
  }

  async getProduct() {
    const loading = await this.loadingCtrl.create({
      message: 'Vui lòng chờ...',
    });
    loading.present();
    return new Promise(resolve => {
      this.http
        .get(
          `${this.url}/wp-json/wc/v3/products?per_page=100&consumer_key=${
            this.consumerKey
          }&consumer_secret=${this.consumerSecret}`
        )
        .subscribe(productData => {
          resolve(productData);
          const jsonValue = JSON.stringify(productData);
          const valueFromJson = JSON.parse(jsonValue);
          this.products =  valueFromJson.filter((item) => (
            item.images.length !== 0 && item.name.toLowerCase().indexOf(this.pet.toLowerCase()) > -1
        ))

               let temp: any[] = valueFromJson.filter((item) => (
              item.images.length !== 0 && item.name.toLowerCase().indexOf(this.pet.toLowerCase()) > -1
          ))

          for(let i = 0; i <temp.length; i++){
            if(temp[i].name.length >= 30){

                temp[i].name1 = temp[i].name.substr(0,30) + '...'

                // this.products.push(temp[i]);
            } else {
              temp[i].name1 = temp[i].name
            }

          }

          this.products = temp;
        if(this.products.length !== 0 && this.pet.length !== 0) {
          this.boolean = true;
          this.boolean2 = false
        } else {
          this.boolean = false;
          this.boolean2 = true
        }
        loading.dismiss();

      });

      // this.http.get(`${this.url}/wp-json/wc/v3/products?per_page=100&consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`, {}, {})
      // .then(data => {
      //   resolve(data);
      //   this.products =  JSON.parse(data.data).filter((item) => (
      //           item.images.length !== 0 && item.name.toLowerCase().indexOf(this.pet.toLowerCase()) > -1
      //       ))


      //       let temp: any[] = JSON.parse(data.data).filter((item) => (
      //         item.images.length !== 0 && item.name.toLowerCase().indexOf(this.pet.toLowerCase()) > -1
      //     ))

      //     for(let i = 0; i <temp.length; i++){
      //       if(temp[i].name.length >= 30){

      //           temp[i].name1 = temp[i].name.substr(0,30) + '...'

      //           // this.products.push(temp[i]);
      //       } else {
      //         temp[i].name1 = temp[i].name
      //       }

      //     }

      //     this.products = temp;
      //     if(this.products.length !== 0 && this.pet.length !== 0) {
      //       this.boolean = true;
      //       this.boolean2 = false
      //     } else {
      //       this.boolean = false;
      //       this.boolean2 = true
      //     }
      //       // loading.dismiss();
      // })
    });
  }

  onChange() {
    if(this.pet == '') {
      this.boolean = false;
      this.boolean2 = false
    }
  }

  onClick() {
      console.log(this.pet);
      if(this.pet !== undefined) {
        this.getProduct();
      }else {
        this.boolean2 = true
      }

      console.log(this.products)
  }

  back(): void {
    this.navCtrl.back()
  }

  async openProductPage(product) {
    this.boolean2 = false
    this.navCtrl.navigateForward(['main/productdetails', { data: JSON.stringify(product) }])
    // const modal = await this.modal.create({
    //   component: ProductdetailsPage,
    //   componentProps: { data: product }
    // })

    // await modal.present();
  }

}
