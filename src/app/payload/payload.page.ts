import { Component, OnInit } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { CoreSite } from '@classes/site';
import { CoreUser, CoreUserProfile } from '@features/user/services/user';
import { CoreUserHelper } from '@features/user/services/user-helper';
import { CoreNavigator } from '@services/navigator';
import { CoreSites, CoreSitesProvider } from '@services/sites';
import { CoreDomUtils } from '@services/utils/dom';
import { CoreTextUtils } from '@services/utils/text';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute,Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser/ngx';
import { Storage } from '@ionic/storage-angular';


@Component({
  selector: 'app-payload',
  templateUrl: './payload.page.html',
  styleUrls: ['./payload.page.scss'],
})
export class PayloadPage implements OnInit {

  cart: any;
  url: any;
  consumerKey:any;
  consumersecret:any
  email:any;
  username:any;
  address:any;
  city:any;
  phone:any;
  paymentMethods: any[] | undefined;
  paymentMethod: any;
  stk:any = '19135229596016';
  name:any = 'TRUNG TÂM VMC VN';
  bank:any = 'Techcombank';
  branch:any = 'Trung Văn';
  price_new: any;
  price_new_post: any;
  sale_price_new: number | undefined;

  validPhone = false;
  courseId!: number;
  canChangeProfilePicture: any;
  protected userId!: number;
  protected site!: CoreSite;
  userLoaded = false;
  hasContact = false;
  hasDetails = false;
  user?: CoreUserProfile;
  title?: string;
  formattedAddress?: string;
  encodedAddress?: SafeUrl;
  interests?: string[];
  theuser: any = {};
  item: any;
  coupons:any;
  param: any;
  payload_bacs: any = {};
  phonenumber: any;
  contact:any;
  numbercontact: boolean | undefined;


//   options : InAppBrowserOptions = {
//     location : 'yes',//Or 'no'
//     hidden : 'no', //Or  'yes'
//     clearcache : 'yes',
//     clearsessioncache : 'yes',
//     zoom : 'yes',//Android only ,shows browser zoom controls
//     hardwareback : 'yes',
//     mediaPlaybackRequiresUserAction : 'no',
//     shouldPauseOnSuspend : 'no', //Android only
//     closebuttoncaption : 'Close', //iOS only
//     disallowoverscroll : 'no', //iOS only
//     toolbar : 'yes', //iOS only
//     enableViewportScale : 'no', //iOS only
//     allowInlineMediaPlayback : 'no',//iOS only
//     presentationstyle : 'pagesheet',//iOS only
//     fullscreen : 'yes',//Windows only
// };


  constructor(private sitesProvider: CoreSitesProvider,public http: HttpClient,
    public toastCtrl: ToastController, public alertCtrl: AlertController,
    private route: ActivatedRoute,public navController:NavController,private loadingController:LoadingController, router: Router,private iab: InAppBrowser,private storage: Storage) {

    this.courseId = CoreNavigator.getRouteNumberParam('courseId') || this.courseId; // Use 0 for site badges.
    this.userId = CoreNavigator.getRouteNumberParam('userId') || CoreSites.getRequiredCurrentSite().getUserId();
    this.url = this.route.snapshot.params['url']
    this.consumerKey = this.route.snapshot.params['consumerKey']
    this.consumersecret = this.route.snapshot.params['consumersecret']
    if(this.route.snapshot.params['data'] != undefined) {
      this.cart = JSON.parse(this.route.snapshot.params['data'])
    }
    if(this.route.snapshot.params['coupons'] != undefined) {
      if(this.route.snapshot.params['coupons'].length != 0) {
        this.coupons = JSON.parse(this.route.snapshot.params['coupons'])
      }
    }
    console.log(this.coupons)
    this.price_new_post = this.route.snapshot.params['price'];
    this.price_new = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(this.route.snapshot.params['price']);
    this.payload();

    var hh = encodeURI(router.url);
    console.log(hh)

}

async ngOnInit(): Promise<void> {

      this.fetchUser().finally(() => {
          this.userLoaded = true;
      });
      this.phonenumer();

      const storage1 = await this.storage.create();
      this.storage = storage1;
      this.storage.set('product', this.cart).then(() => {
      });

      this.storage.get('product').then((data) => {
        if(data) {
          this.cart = JSON.parse(this.route.snapshot.params['data'])

        }
      })
}

async phonenumer() {
  const site = await CoreSites.getSite();

      const userId = site.getUserId();
      var data: any = {
          userid: userId,
      };

      const preSets = {
          getFromCache: false,
      };

      site.write('local_thlib_get_user_phone2', data, preSets).then((phone) => {
        const jsonValue = JSON.stringify(phone);
        let temp = JSON.parse(jsonValue)
        this.phonenumber = temp.phone2
        if(this.phonenumber == '') {
          this.numbercontact = true
        }else {
          this.numbercontact = false
        }
        console.log(phone)
      }).catch((e) => {
          // console.log(e)
      });
}

  async payload() {
  const loading = await this.loadingController.create({
    message: 'Vui lòng chờ...',
  });
  loading.present();
  return new Promise(resolve => {
    this.http
      .get(
        `${this.url}/wp-json/wc/v3/payment_gateways/bacs?consumer_key=${
          this.consumerKey
        }&consumer_secret=${this.consumersecret}`
      )
    .subscribe(data => {
      resolve(data);
      this.payload_bacs =  JSON.parse(JSON.stringify(data))
      console.log(this.payload_bacs)
      loading.dismiss();
    })
  });
}


async fetchUser(): Promise<void> {
  try {
      const user = await CoreUser.getProfile(this.userId, this.courseId);

      if (user.address) {
          this.formattedAddress = CoreUserHelper.formatAddress(user.address, user.city, user.country);
          this.encodedAddress = CoreTextUtils.buildAddressURL(this.formattedAddress);
      }

      this.interests = user.interests ?
          user.interests.split(',').map(interest => interest.trim()) :
          undefined;

      this.hasContact = !!(user.email || user.phone1 || user.phone2 || user.city || user.country || user.address);
      this.hasDetails = !!(user.url || user.interests || (user.customfields && user.customfields.length > 0));

      this.user = user;
      this.title = user.fullname;
      this.theuser = this.user
      console.log(this.user)
      console.log(this.theuser)

      this.user.address = CoreUserHelper.formatAddress('', user.city, user.country);

  } catch (error) {
      CoreDomUtils.showErrorModalDefault(error, 'core.user.errorloaduser', true);
  }
}


async copy() {
    const toast = await this.toastCtrl.create({
      message: 'Đã sao chép',
      duration: 2000
    });
    toast.present();
}


// Onepay1() {
//   // this.iab.create('https://onepay.vn/paygate/?id=INV-T5RXKHL75WE37CHW&locale=vi','_blank','location=yes');
//   let target = "_system";
//   this.iab.create('https://onepay.vn/paygate/?id=INV-TV9382F8XUNDCM26&locale=vi',target,this.options);

// }

// Onepay2() {
//   let target = "_blank";
//   this.iab.create('https://pay.vnpay.vn/Transaction/PaymentMethod.html?token=a1aadbbf6ced44b997cac5387c5936a5',target,this.options);
// }

// Onepay() {
//   let target = "_self";
//   this.iab.create('https://pay.vnpay.vn/Transaction/PaymentMethod.html?token=a1aadbbf6ced44b997cac5387c5936a5',target,this.options);
// }


// public openWithSystemBrowser(url : string){
//   let target = "_system";
//   this.iab.create(url,target,this.options);
// }
// public openWithInAppBrowser(url : string){
//   let target = "_blank";
//   this.iab.create(url,target,this.options);
// }
// public openWithCordovaBrowser(url : string){
//   let target = "_self";
//   this.iab.create(url,target,this.options);
// }

checkphone() {
  var vnf_regex = /((09|03|07|08|05)+([0-9]{8})\b)/g;
  if(this.theuser.phone1 !== undefined){
      if (vnf_regex.test(this.theuser.phone1) == false)
      {
          this.validPhone = false;
      }else{
          this.validPhone = true;
      }
  }else if(this.theuser.phone1 == undefined){
      this.validPhone = false;
  }

  // if(!isNaN(this.user.phone1)) {
  //   validPhone = true;
  // } else {
  //   validPhone = false;
  //   this.toastCtrl.create({
  //     message: "Số điện thoại không hợp lệ",
  //     showCloseButton: true
  // }).present();
  // }
}

  async placeOrder() {
    console.log(this.phonenumber)
    if(this.phonenumber  == '') {
      console.log('hh')
      this.contact = this.theuser.phone1
    }else {
      this.contact = this.phonenumber
    }

    let orderItems: any[] = [];
    let data: any = {};
    let codecoupons: any[] = [];


    if(this.coupons != undefined && this.coupons.length != 0) {
      codecoupons.push({
        code: this.coupons[0].code,
      });
    }
    console.log(this.coupons)

    let paymentData: any = {};

    // this.paymentMethods.forEach((element, index) => {
    //   if (element.method_id == this.paymentMethod) {
    //     paymentData = element;
    //   }
    // });

    const site = await CoreSites.getSite();
    const userId = site.getUserId();
    const storage1 = await this.storage.create();
    this.storage = storage1;
    data = {
      payment_method: this.payload_bacs.id,
      payment_method_title: this.payload_bacs.method_title,
      //set_paid: true,

      billing: {
        address_1: this.address,
        last_name: this.theuser.fullname,
        email: this.theuser.email,
        phone: this.contact,
      },
      line_items: orderItems,
      coupon_lines: codecoupons,
    };
    if(this.cart) {
      orderItems.push({
        product_id: this.cart.id,
        price: this.price_new_post,
        total: this.price_new_post
      });
      data.line_items = orderItems;
      console.log(data.line_items)
    }else {
      const data = await storage1.get(`${userId}`);
        data.map((item) => {
          if(this.coupons != undefined && this.coupons.length != 0) {
            var sale_price_new = (Number(item.product.sale_price / 1000) - (Number(item.product.sale_price)/1000  * (Number(this.coupons[0].amount) / 100)))
            console.log(sale_price_new)
            if(!(Number.isInteger(sale_price_new))) {
              this.sale_price_new = Math.ceil(sale_price_new) * 1000
            }else {
              this.sale_price_new = (Number(item.product.sale_price) - (Number(item.product.sale_price)  * (Number(this.coupons[0].amount) / 100)))
            }
            orderItems.push({
              product_id: item.product.id,
              price: this.sale_price_new,
              total: this.sale_price_new,
              //quantity: 1
            })
            console.log(this.sale_price_new)
            console.log(orderItems)
          }else {
            this.sale_price_new = Number(item.product.sale_price)
            orderItems.push({
              product_id: item.product.id,
              price: this.sale_price_new,
              total: this.sale_price_new,
            })
            console.log(this.item)

          }
        });
      // })
    }






    data.line_items = orderItems;

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    if(this.phonenumber != '') {
      return new Promise(resolve => {
        this.http
          .post(
            `${this.url}/wp-json/wc/v3/orders/?consumer_key=${
              this.consumerKey
            }&consumer_secret=${this.consumersecret}`,
            data,
            { headers }
          )
          .subscribe(data => {
            resolve(data);
          });

          this.presentAlert();
          storage1.remove(`${userId}`);
          this.navController.navigateForward(['main/discover'])
        });
    }
    else if((this.phonenumber == '') && this.theuser.phone1 !== undefined && this.validPhone == true) {
      return new Promise(resolve => {
        this.http
          .post(
            `${this.url}/wp-json/wc/v3/orders/?consumer_key=${
              this.consumerKey
            }&consumer_secret=${this.consumersecret}`,
            data,
            { headers }
          )
          .subscribe(data => {
            resolve(data);
          });

          this.presentAlert();
          storage1.remove(`${userId}`);
          this.navController.navigateForward(['main/discover'])
        });
    }
    else if((this.theuser.phone1 == undefined || this.validPhone == false) && (this.phonenumber == '')) {
      console.log('TH3')
      let toast = await this.toastCtrl.create({
        message: 'Bạn chưa điền số điện thoại hoặc số điện thoại không hợp lệ!',
        duration: 3000,
        position: 'top'
      });
      toast.present();
    }else{
      console.log('TH4')
      let toast = await this.toastCtrl.create({
        message: 'Đơn hàng bị lỗi, bạn vui lòng thao tác lại',
        duration: 3000,
        position: 'top'
      });

      toast.present();
    }



}


async presentAlert() {
  const alert = await this.alertCtrl.create({
    header: 'Chờ xác nhận',
    message: 'Bạn đã đặt hàng thành công, sản phẩm sẽ được thêm vào khóa học sau khi hệ thống xác nhận trong thời gian sớm nhất!',
    buttons: ['OK']
  });

  await alert.present();
}


onBack() {
  this.navController.back()
}

}
