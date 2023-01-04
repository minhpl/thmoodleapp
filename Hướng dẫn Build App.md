- [1. Hướng dẫn dựng Ứng dụng Moodle cho Mobile](#1-hướng-dẫn-dựng-ứng-dụng-moodle-cho-mobile)
  - [1.1. Tạo logo của Trường cần xây dựng Ứng dụng](#11-tạo-logo-của-trường-cần-xây-dựng-ứng-dụng)
  - [1.2. Việt hóa Ứng dụng](#12-việt-hóa-ứng-dụng)
  - [1.3. Làm thông báo (Notification) trên Ứng dụng](#13-làm-thông-báo-notification-trên-ứng-dụng)
  - [1.4. Cập nhật 1 số tệp cấu hình](#14-cập-nhật-1-số-tệp-cấu-hình)

# 1. Hướng dẫn dựng Ứng dụng Moodle cho Mobile
## 1.1. Tạo logo của Trường cần xây dựng Ứng dụng
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
## 1.2. Việt hóa Ứng dụng
- Copy tệp **vi.json** vào thư mục /src/assets/lang/
- Chạy lệnh:
  ```nodejs
  npx gulp
  ```
- Build lại app
  ```nodejs
  ionic cordova build android
  ```
## 1.3. Làm thông báo (Notification) trên Ứng dụng

## 1.4. Cập nhật 1 số tệp cấu hình
