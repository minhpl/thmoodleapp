import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HTTP } from '@ionic-native/http';
import { LoadingController, NavController } from '@ionic/angular';
import { Translate } from '@singletons';

@Component({
  selector: 'app-purchase-history',
  templateUrl: './purchase-history.page.html',
  styleUrls: ['./purchase-history.page.scss'],
})
export class  PurchasehistoryPage implements OnInit {

  user: any;
  url:any = 'https://vmcvietnam.org';
  consumerKey:any = 'ck_a8d7832eeec157aa837f08035d0d38a584b84959';
  consumerSecret:any = 'cs_b2054352baefb9857816fa33a3546e3157dfcb05';
  products!: any[];
  paymentMethods: any;
  boolean: boolean;
  boolean2: boolean | undefined;
  course:any;
  status!: string;
  status1!: string;
  status2!: string;
  boolean3: boolean | undefined;
  item: any;
  title: any

  constructor(private route: ActivatedRoute,public http: HttpClient, private navController: NavController,private loadingController:LoadingController) {
    this.boolean = false;
    this.item = this.route.snapshot.params['data']
    this.user = JSON.parse(this.item)
    this.getPastOrders(this.user.userid);
    console.log(this.user)
  }


  // getPastOrders(customerId) {
  //   // let loading = this.loadingCtrl.create({
  //   //   content: 'Please wait...'
  //   // });

  //   // loading.present();
  //   return new Promise(resolve => {

  //     this.http.get(`${this.url}/wp-json/wc/v3/orders?consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`, {}, {})
  //     .then(data => {
  //       resolve(data);
  //       this.products =  JSON.parse(data.data).filter((item) => (
  //         item.billing.email.toLowerCase().indexOf(this.user.email.toLowerCase()) > -1
  //       ));
  //       if(this.products.length !==0) {
  //               this.boolean = true;
  //               this.boolean2 = false
  //             }
  //       else {
  //         this.boolean2 = true
  //       }

  //       this.products.map((item) => {
  //         if(item.status === "processing") {
  //             this.status = 'Đã thanh toán';
  //             this.boolean3 = true;
  //         }else {
  //           this.status = 'Chờ xác nhận'
  //           this.boolean3 = false;
  //         }
  //       })
  //       // loading.dismiss();
  //     })
  //   });
  // }

   async getPastOrders(customerId) {
    const loading = await this.loadingController.create({
      message: 'Vui lòng chờ...',
    });
    loading.present();
    return new Promise(resolve => {

      this.http.get(`${this.url}/wp-json/wc/v3/orders?per_page=100&consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`, {})
      .subscribe(data => {
        resolve(data);
        const jsonValue = JSON.stringify(data);
        const valueFromJson = JSON.parse(jsonValue);
        this.products =  valueFromJson.filter((item) => (
          item.billing.email.toLowerCase().indexOf(this.user.email.toLowerCase()) > -1
        ));
        if(this.products.length !==0) {
                this.boolean = true;
                this.boolean2 = false
              }
        else {
          this.boolean2 = true
        }

        this.products.filter((item) => {
          if(item.status == "completed") {
              this.status1 = 'Đã mua hàng';
              this.boolean3 = true;
          }else if(item.status == "processing" || item.status == "pending") {
            this.status = 'Đang xử lý'
            this.boolean3 = false;
          }
        })
        loading.dismiss();
      })
    });
  }

  doRefresh(event) {
    console.log('Begin async operation');

    this.getPastOrders(this.user.userid);

    setTimeout(() => {
      console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
  }

  ngOnInit() {
    this.title =  Translate.instant('core.purchase_history')
    this.getPastOrders(this.user.userid);
  }

  ionViewWillEnter() {
    this.getPastOrders(this.user.userid);
  }

  back(): void {
    this.navController.back()
  }

}
