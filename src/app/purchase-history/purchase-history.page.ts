import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HTTP } from '@ionic-native/http/ngx';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { Translate } from '@singletons';
import { CoreSites } from '@services/sites';

@Component({
  selector: 'app-purchase-history',
  templateUrl: './purchase-history.page.html',
  styleUrls: ['./purchase-history.page.scss'],
})
export class  PurchasehistoryPage implements OnInit {

  user: any;
  url:any;
  consumerKey:any;
  consumerSecret:any;
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

  constructor(public alertCtrl: AlertController,private route: ActivatedRoute,public http: HTTP, private navController: NavController,private loadingController:LoadingController) {
    this.boolean = false;
    this.item = this.route.snapshot.params['data']
    this.user = JSON.parse(this.item);
  }

  async ngOnInit() {
    this.title =  Translate.instant('core.mainmenu.purchase_history');

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
    this.getPastOrders();
  }

   async getPastOrders() {
    const loading = await this.loadingController.create({
      message: 'Vui lòng chờ...',
    });
    loading.present();
    return new Promise(resolve => {

      this.http.get(`${this.url}/wp-json/wc/v3/orders?per_page=100&consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`, {},{})
      .then(data => {
        resolve(data);
        const valueFromJson = JSON.parse(data.data);
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

  doRefresh(event) {
    console.log('Begin async operation');

    this.getPastOrders();

    setTimeout(() => {
      console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
  }


  back(): void {
    this.navController.back()
  }

}
