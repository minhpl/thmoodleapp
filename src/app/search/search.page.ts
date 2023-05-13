import { Component, OnInit } from '@angular/core';
import { NavController, ModalController , LoadingController} from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { HTTP } from '@ionic-native/http';
import { ProductdetailsPage } from '../productdetails/productdetails.page';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit {

  products!: any[];
  searchQuery: string = "";
  lista: string[] | undefined;
  pet: any;
  boolean: boolean | undefined;
  boolean2: boolean | undefined;
  url: any;
  consumerKey:any;
  consumersecret:any

  constructor(public navCtrl: NavController, public http: HttpClient,private route: ActivatedRoute, public modalCtrl:ModalController, public loadingCtrl: LoadingController, private modal: ModalController) {
    this.url = this.route.snapshot.params['url']
    this.consumerKey = this.route.snapshot.params['consumerKey']
    this.consumersecret = this.route.snapshot.params['consumersecret']
   }

  ngOnInit() {
  }

  async getProduct() {
    const loading = await this.loadingCtrl.create({
      message: 'Vui lòng chờ...',
    });
    loading.present();
    encodeURIComponent(this.pet)
    return new Promise(resolve => {
      this.http
        .get(
          `${this.url}/wp-json/wc/v3/products?per_page=100&search=${encodeURIComponent(this.pet)}&consumer_key=${
            this.consumerKey
          }&consumer_secret=${this.consumersecret}`
        )
        .subscribe(productData => {
          resolve(productData);
          const jsonValue = JSON.stringify(productData);
          const valueFromJson = JSON.parse(jsonValue);
          console.log(valueFromJson)
          this.products =  valueFromJson.filter((item) => (
            item.images.length !== 0 && item.name.toLowerCase().indexOf(this.pet.toLowerCase()) > -1
        ))
          let temp: any[] = valueFromJson.filter((item) => (
              item.images.length !== 0 && item.name.toLowerCase().indexOf(this.pet.toLowerCase()) > -1
          ))

          for(let i = 0; i <temp.length; i++){
            if(temp[i].name.length >= 30){
                temp[i].name1 = temp[i].name.substr(0,30) + '...'
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
    this.navCtrl.navigateForward(['main/productdetails', { data: JSON.stringify(product), url: this.url, consumerKey: this.consumerKey, consumersecret:this.consumersecret }])
    // const modal = await this.modal.create({
    //   component: ProductdetailsPage,
    //   componentProps: { data: product }
    // })

    // await modal.present();
  }

}
