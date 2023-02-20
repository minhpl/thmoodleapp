import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { LoadingController, NavController, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { CoreSites } from '@services/sites';
import { HttpClient } from '@angular/common/http';
// import { YoutubeVideoPlayer } from '@ionic-native/youtube-video-player/ngx';

@Component({
  selector: 'app-productdetails',
  templateUrl: './productdetails.page.html',
  styleUrls: ['./productdetails.page.scss'],
})
export class ProductdetailsPage implements OnInit {

  item: any;
  product: any;
  date: any;
  update: any;
  metadata: any;
  videodata: any ;
  imgdata: any ;
  teacher: any ;
  hh : any;
  text: any;
  video: any;
  onpause: any;
  boolean: boolean | undefined;
  course: boolean | undefined;
  videoboolean: boolean | undefined;
  trustedVideoUrl: SafeResourceUrl | undefined;
  param: any;
  test: any;
  id: any;


  url:any = 'https://vmcvietnam.org';
  consumerKey:any = 'ck_a8d7832eeec157aa837f08035d0d38a584b84959';
  consumerSecret:any = 'cs_b2054352baefb9857816fa33a3546e3157dfcb05';

  constructor(public http: HttpClient,private toastController: ToastController,private storage: Storage,private nav: NavController,private route: ActivatedRoute, private dom: DomSanitizer,private loadingController:LoadingController){

    this.id = JSON.parse(this.route.snapshot.params['data'])

    // console.log(this.id)

    // this.getProduct()

    this.item = this.route.snapshot.params['data']
    this.product = JSON.parse(this.item)


    this.date =  this.product.date_created.slice(0,10);
    this.update = this.product.date_modified_gmt.slice(0,10);
    this.metadata = this.product.meta_data.filter((item) => (
      item.key == "curriculum"
    ))
    this.teacher = this.product.meta_data.filter((item) => (
      item.key == "lecturer_name"
    ))
    this.imgdata = this.product.meta_data.filter((item) => (
      item.key == "lecturer_image"
    ))
    this.videodata = this.product.meta_data[3].value.split("=");
    this.video = 'https://www.youtube.com/embed/' + this.videodata[1] ;

    // this.getProduct()
  }


  async getProduct() {
    const loading = await this.loadingController.create({
      message: 'Vui lòng chờ...',
    });
    loading.present();
    return new Promise(resolve => {
      this.http
        .get(
          `${this.url}/wp-json/wc/v3/products/${this.id}?per_page=100&consumer_key=${
            this.consumerKey
          }&consumer_secret=${this.consumerSecret}`
        )
        .subscribe(productData => {
          resolve(productData);
          const jsonValue = JSON.stringify(productData);
          this.product = JSON.parse(jsonValue)
          console.log(this.product)
          this.date =  this.product.date_created.slice(0,10);
          this.update = this.product.date_modified_gmt.slice(0,10);
          this.metadata = this.product.meta_data.filter((item) => (
            item.key == "curriculum"
          ))
          this.teacher = this.product.meta_data.filter((item) => (
            item.key == "lecturer_name"
          ))
          this.imgdata = this.product.meta_data.filter((item) => (
            item.key == "lecturer_image"
          ))
          this.videodata = this.product.meta_data[3].value.split("=");
          this.video = 'https://www.youtube.com/embed/' + this.videodata[1] ;



          this.text = this.product.description;
          //console.log(this.product.name.length);
          this.text = this.product.description;
          console.log(this.videodata[1])
          if(this.teacher.length !== 0 && this.imgdata.length !== 0) {
            this.boolean = true
          }else {
            this.boolean = false
          }

          if(this.metadata[0].value != '') {
            this.course = true
          }else {
            this.course = false
          }
          loading.dismiss();
        });

    });
  }

  async ngOnInit() {
    this.text = this.product.description;
    //console.log(this.product.name.length);
    this.text = this.product.description;
    console.log(this.videodata[1])
    if(this.teacher.length !== 0 && this.imgdata.length !== 0) {
      this.boolean = true
    }else {
      this.boolean = false
    }

    if(this.metadata[0].value != '') {
      this.course = true
    }else {
      this.course = false
    }
  }

  async ionViewWillEnter(): Promise<void> {
    //this.getProduct();
    console.log(this.videodata[1])
    if(this.videodata[1] != undefined) {
      const loading = await this.loadingController.create({
        message: 'Vui lòng chờ...',
      });
      loading.present();
      this.trustedVideoUrl = this.dom.bypassSecurityTrustResourceUrl(this.video);
      loading.dismiss();
      this.videoboolean = true
    }else {
      this.videoboolean = false
    }
  }

  ionViewDidLoad() {

  }
  back(): void {
    this.nav.back()
  }

  onClick() {
    this.text = this.product.description
  };

  onClick2() {
    this.text = '';
    this.text = this.metadata[0].value.replace(/Bài/g, "</br>Bài").replace(/<strong>/g, '');
  };

  onClick3() {
    this.text = '';
    this.text = 'Đoạn văn 3 khi tham gia vào khóa học chúng ta sẽ được lĩnh hội khi tham gia vào khóa học chúng ta sẽ được lĩnh hội khi tham gia vào khóa học chúng ta sẽ được lĩnh hội ';
  }

  onpausevideo() {
    this.videoboolean = false;
  }

  view_cart() {
    this.nav.navigateForward(['main/cart'])
  }

  product_buy(product) {
    this.nav.navigateForward(['main/payment', { data: JSON.stringify(product) }])
  }

  async addToCart(product) {
    const toast = await this.toastController.create({
      message: 'Bạn đã thêm sản phẩm vào giỏ hàng!',
      duration: 1500,
      position: 'bottom'
    });

    const site = await CoreSites.getSite();

    const userId = site.getUserId();
    const storage1 =await this.storage.create();
    this.storage = storage1;

    this.storage.get(`${userId}`).then((data) => {

      if(data == null || data.length == 0){

        data = [];

        data.push({
          "product":product,
          "userId" : userId
        })
      }else {

        let added = 0;

        for(let i = 0; i < data.length; i++) {
          if(product.id == data[i].product.id){
            added = 1
          }
        }

        if(added == 0) {
          data.push({
            "product":product,
            "userId" : userId
          })
        }
      }
      this.storage.set(`${userId}`, data).then(() => {
      });
    })

    await toast.present();

  }

  async doRefresh(event) {
      if(this.videodata[1] != undefined) {
        const loading = await this.loadingController.create({
          message: 'Vui lòng chờ...',
        });
        loading.present();
          this.trustedVideoUrl = this.dom.bypassSecurityTrustResourceUrl(this.video);
          loading.dismiss();
          this.videoboolean = true
        }else {
          this.videoboolean = false
        }
        this.item = this.route.snapshot.params['data']
    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }
}
