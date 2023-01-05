- [1. Hướng dẫn dựng Ứng dụng Moodle cho Mobile](#1-hướng-dẫn-dựng-ứng-dụng-moodle-cho-mobile)
  - [1.1. Cập nhật Mã nguồn](#11-cập-nhật-mã-nguồn)
    - [1.1.1. Tạo logo của Trường cần xây dựng Ứng dụng](#111-tạo-logo-của-trường-cần-xây-dựng-ứng-dụng)
    - [1.1.2. Việt hóa Ứng dụng](#112-việt-hóa-ứng-dụng)
  - [1.2. Cập nhật thông báo (Notification) trên Ứng dụng](#12-cập-nhật-thông-báo-notification-trên-ứng-dụng)
  - [1.3. Cập nhật 1 số tệp cấu hình](#13-cập-nhật-1-số-tệp-cấu-hình)
    - [1.3.1. Tệp /root/config.xml](#131-tệp-rootconfigxml)
    - [1.3.2. Tệp /root/moodle.config.json](#132-tệp-rootmoodleconfigjson)
  - [1.4. Ẩn một số thông số](#14-ẩn-một-số-thông-số)
  - [1.5. Thiết lập Moodle App trong setting trên Web và cập nhật CSS của Moodle App](#15-thiết-lập-moodle-app-trong-setting-trên-web-và-cập-nhật-css-của-moodle-app)
    - [1.5.1. Thiết lập Moodle App trong setting trên Web](#151-thiết-lập-moodle-app-trong-setting-trên-web)
    - [1.5.2. Cập nhật CSS của Moodle App](#152-cập-nhật-css-của-moodle-app)
  - [1.6. Build App](#16-build-app)
  - [1.7. Update App lên Chợ](#17-update-app-lên-chợ)

# 1. Hướng dẫn dựng Ứng dụng Moodle cho Mobile
## 1.1. Cập nhật Mã nguồn
### 1.1.1. Tạo logo của Trường cần xây dựng Ứng dụng
- Ứng dụng chỉnh sửa logo:
  - https://www.faststone.org/download.htm
  - https://photoshoponlinemienphi.com
- Thư mục resources
  - logo.png: kích thước 1024x1024 , background transparent -> dạng icon
  - login_logo.png: kích thước 600x154, logo ở chính giữa
  - splash.png: kích thước 2732x2732, logo chính giữa kích thước 1024x1024

- Thư mục resources>android
  - icon-background.png: kích thước 1024x1024, white background.
  - icon-foregound.png: kích thước 1024x1024, white background.

- Thư mục resources>android>icon: 4 ảnh transparenent background: kích thước 18,24,36,48 => dạng icon
  - drawable-xhdpi-smallicon.png: kích thước 48x48
  - drawable-hdpi-smallicon.png: kích thước 36x36
  - drawable-mdpi-smallicon.png: kích thước 24x24
  - drawable-ldpi-smallicon.png: kích thước 18x18

- Thư mục www>assets>img:
  - splash.png: kích thước 2732x2732, logo chính giữa kích thước 1024x1024
  - login_logo.png: kích thước 600x154, login logo
  - top_logo.png: kích thước 600x154

- Xong chạy lệnh:
  ```nodejs
  npm install -g cordova-res
  cordova-res
  ```
### 1.1.2. Việt hóa Ứng dụng
- Copy tệp **vi.json** vào thư mục **/src/assets/lang/**
- Chạy lệnh:
  ```nodejs
  npx gulp
  ```
- Build lại app
  ```nodejs
  ionic cordova build android
  ```
## 1.2. Cập nhật thông báo (Notification) trên Ứng dụng
- Thiết lập trên website của moodle
  - Truy cập Site administration> Messaging > Mobile

    - Airnotifier URL: IP or domainame of airnotifer server
    - Airnotifer port: 8801 default
    mobile app name: The Mobile app unique identifier
    - Airnotifier app name: tên app trên airnotifier
    - Airnotifer access key: access key tạo ra trong ứng dụng trên airnotifer

- Thiết lập airnotifer server
  - Hướng dẫn cài đặt airnotifer trong readme.md của airnotifer folder
  - Truy cập airnotifer tại http://elearning.vmcvietnam.org:8801/ Create App với App shortname: ví dụ th_tuaf_app Trong accesskey: Create access key, and grant all permission Trong settings:

  - Firebase cloud messaging settings: => thiết lập cho thiết bị android Project ID: trong thiết lập firebase > project settings> general > projectID Json key: trong thiết lập firebase > project settings > generate new private key> copy nội dung của file tải về

  - APNs HTTP/2 => thiết lập cho thiết bị Apple
    - Team ID: thiết lập developer.apple.com > account > membership> team id
    - App bundle ID: app unique identifier
    - Key ID: thiết lập developer.apple.com> certificates, IDs & profiles > keys > keyID
    - Auth key (content of .p8 file): thiết lập developer.apple.com> certificates, IDs & profiles > keys > copy nội dung của file .p8 tải về

- Thiết lập Firebase: https://console.firebase.google.com/

  - Create project -tạo App cho android và IOS, để ý app app unique identifier, ví dụ: vn.edu.aum.tuaf - - -Tải file google-services.json và GoogleService-Info.plist và ghi đè vào file trong thư mục gốc của moodleapp > trong Project settings> general > your apps -ProjectID trong project settings> general > projectID -Trong project settings> cloud messaging > Apple apps > upload file "APNs Auth Key" trong "APNs Authentication Key"

- Thiết lập APNs: https://developer.apple.com/

    Team ID: truy cập account > membership
    keyID: truy cập account> certificates, IDs & profiles > keys > tạo key mới > tải file và cất trữ

- Chú ý:
  - bundle_id, packagename trong file google-service.json  cần giống với id của app
  - BUNDLE_ID của GoogleService-Info.plist  cần giống với id của app,
--> nếu không build app sẽ báo lỗi trên android hoặc IOS

## 1.3. Cập nhật 1 số tệp cấu hình
### 1.3.1. Tệp /root/config.xml
- Trên id của tag widgets: bằng app unique identifier
- Mỗi lập update lên appstore cần cập nhật lại:
  - android-versionCode: của android
  - version
  - versionCode: của IOS
- Thay đổi tag name: appname ví dụ : TUAF-e
- Thay đổi  description: ví dụ: TUAF-e official app
- Thay đổi thẻ author: ví dụ: TH Mobile team

### 1.3.2. Tệp /root/moodle.config.json
- Dưới đây là ví dụ:
```json
"app_id": app id, ví dụ "vn.edu.aum.tuaf",
"appname": appname, ví dụ: "TUAF-e",
"versioncode": 40200,
"versionname": "4.0.2",
"siteurl": site to connects, ví dụ: "http://tuaf.aum.edu.vn"
"languages": {
        "en": "English",
        "vi": "Vietnamese",
    },
"notificoncolor": ứng với màu của app
```
## 1.4. Ẩn một số thông số

- Tệp: src\core\features\login\pages\credentials\credentials.html
        =>  comment line with **class="core-siteurl"**
    và comment block

  ```html
    <ng-container *ngIf="showScanQR">
            <div class="ion-text-center ion-padding">{{ 'core.login.or' | translate }}</div>
            <ion-button expand="block" fill="outline" class="ion-margin" (click)="showInstructionsAndScanQR()">
                <ion-icon slot="start" name="fas-qrcode" aria-hidden="true"></ion-icon>
                {{ 'core.scanqr' | translate }}
            </ion-button>
    </ng-container>
  ```

- Tệp: src\core\features\login\pages\reconnect\reconnect.html
        => comment line with **class="core-siteurl"**

- Thay đổi docURL:
  - Trong tệp: src\core\services\utils\url.ts
    - đặt  docsUrl = "https://tuaf.aum.edu.vn/"; bên trên câu lệnh:
    ```ts
          try {
            let lang = await CoreLang.getCurrentLanguage();
            lang = CoreLang.getParentLanguage(lang) || lang;

            return docsUrl.replace('/en/', '/' + lang + '/');
          } catch (error) {
            return docsUrl;
          }
    ```
## 1.5. Thiết lập Moodle App trong setting trên Web và cập nhật CSS của Moodle App
### 1.5.1. Thiết lập Moodle App trong setting trên Web
- Truy cập Administration > Mobile app
  - Check enable web services for mobilde devices
  - App plolicy URL
    - https://www.privacypolicytemplate.net/
    - https://app-privacy-policy-generator.nisrulz.com/
  - Tạo static page là file HTML có nội dung giống privacy.html
replace TNU-e with another AppName
vào Site administration > Statics Pages > Documents -> upload privacy.html

  - Custom lang string: copy nội dung file /translate/remote_lang.vi.txt

### 1.5.2. Cập nhật CSS của Moodle App
- Mobile appearance > CSS > đặt link dẫn đến file CSS
  - Ví dụ: https://tuaf.aum.edu.vn/local/th_appcss_tuaf/moodlemobileapp4.css

## 1.6. Build App
- Android
  - Cập nhật platform android
    ```nodejs
    npx ionic cordova platform remove android
    npx ionic cordova platform add android
    ```
    ```nodejs
    npx gulp
    ```
  - Bản product:
    ```nodejs
    npx ionic cordova run android --prod --release --aot
    ```
  - Bản debug:
    ```nodejs
    npx ionic cordova run android
    ```
  - Build dưới dạng apk file:
    ```nodejs
    ionic cordova build android --release --aot --prod -- -- --packageType=apk
    ```
  ---
  - sign .aab file
    - Cần add path of jarsigner to path of system
    - see verbose:
    ```java
    jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore xample.jks bundle.aab keystoreAlias
    ```
    - not see verbose:
    ```java
    jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore xample.jks bundle.aab keystoreAlias
    ```
    - Ví dụ:
      - see verbose:
      ```java
      jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore vmc-e.jks app-release.aab vmc-e
      ```
      - not see verbose:
      ```java
      jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore vmc-e.jks app-release.aab vmc-e
      ```
  - sign apk file
    ```java
    sign_apk.cmd app.apk
    ```
  - Cách install apk file bằng adb
    ```java
    adb install app.apk
    ```
- IOS
  - Cập nhật platform ios
  ```nodejs
  npx ionic cordova platform remove ios
  npx ionic cordova platform add ios
  ```
  - Build App:
  ```nodejs
  ionic cordova build ios
  ```
## 1.7. Update App lên Chợ
- Play Store
  - Truy cập : https://play.google.com/
  - product , create new release:
    - upload abb file

  - Vào Setup your app
    - Set privacy policy:
    - Ads:
    - Seting up main storing list
    - Product > country/regions
- App Store
  - Sau khi build thành công App mới, trong platform/ios mở file có đuôi e.xcworkspace
  - Sau đó, chọn phần General trong XCode. Ở đây, ta điền đầy đủ Display name ứng dụng và Bundle Identifiter
  - Tiếp theo, chọn Sgining & Capabilities và All, sau đó chọn Team là tài khoản đăng ký appstoreconnect và Bundle Identifier
  - Tiếp theo, cắm máy thật rồi chọn Product -> Archive rồi đợi build
  - Sau khi build xong, chọn Distribute App -> App Store Connect -> Export -> Automatically manage signing -> Export
  - Khi export xong ngoài desktop sẽ có folder đã export. Mở Transporter sau đó Add file e.ipa trong folder đã export.
  - Transporter tự nhận biết Bundle ID App và truyền đén đúng Bundle ID App đã tạo trên App Store Connect
  - Cuối cùng, ở phần tạo app trên App Store Connect, ta chọn new App, điền đầy đủ thông tin Platforms, Name, Primary, Bundle ID, Sku.
  - Tạo App Previews and Screenshots theo đúng kích thước app store quy định
    - Đối với màn Iphone 6.5 kích cỡ ảnh là: 1242 x 2688
    - Đối với àm Iphone 5.5 kích cỡ ảnh là: 1242 x 2208
    - Đối với àm Ipad 12.9 kích cỡ ảnh là: 2048 x 2732
  - Điền thông tin vào các phần Description, Keywords, Support URL, App Review Information như các App trước và chọn app được đẩy bằng transporter
  - Trong phần General ta phải cung cấp đầy đủ thông tin và App. Khi đã cung cấp đầy đủ ta chọn Save và Submit App lên App Store
