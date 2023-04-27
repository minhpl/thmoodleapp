# Tài liệu Chức năng "Hỏi/đáp" trong khóa học trên App

1. **Tên tính năng**: Hỏi/đáp trong khóa học trên App
2. **Project**:  tnu,aof,tnut,tuaf,hcct,vmc
3. **Người phát triển**: huytq72@wru.vn
4. **Người yêu cầu**: minhpl@aum.edu.vn
5. **Tham chiếu ERP:**
6. **Mã nguồn:**
	1. **branch**: https://github.com/minhpl/thmoodleapp/tree/31-feature_chuc_nang_hoi_dap_tren_app
	2. **Bắt đầu từ commit:** https://github.com/minhpl/thmoodleapp/tree/main-TUAF

# 1. Yêu cầu:

Người dùng hỏi/đáp trong khóa học trên ứng dụng Mobile App.

# 2. Mô tả chi tiết/ hướng dẫn sử dụng/ hướng dẫn cài đặt

**B1: Người dùng truy cập vào khóa học trên thiết bị mobile và bấm chọn vào phần hỏi đáp như hình dưới đây**:

![image](https://user-images.githubusercontent.com/58178423/234742690-1c8f999a-a182-4e39-b413-dafc0ae64117.png)


**B2: Sau khi giao diện hỏi đáp hiển thị, tùy vào vai trò của người dùng trong khóa học sẽ có các quyền tương ứng trong hỏi đáp**:

- Đối với người dùng có vai trò là giảng viên trong khóa học, người dùng sẽ có quyền trả lời và sửa câu trả lời và xen chi tiết câu hỏi. Giao diện cũng được chia thành 2 phần gồm các câu hỏi đã có câu trả lời của giảng viên và những câu hỏi chưa có câu trả lời của giảng viên:

![image](https://user-images.githubusercontent.com/58178423/234744125-70985027-15f1-4fc4-908a-542969284691.png)


![image](https://user-images.githubusercontent.com/58178423/234744376-16ff2979-5bb2-4ca5-a47b-c7403b9a8479.png)

- Khi người dùng có vai trò là giảng viên bấm vào nút trả lời, sửa trả lời, xem chi tiết hệ thống sẽ hiển thị giao diện như hình vẽ:

![image](https://user-images.githubusercontent.com/58178423/234746096-8e6333c7-6b9d-4196-a28d-1d3e082571b2.png)

![image](https://user-images.githubusercontent.com/58178423/234746272-493eb34e-8abc-4362-9a6b-9ab4d408a616.png)

![image](https://user-images.githubusercontent.com/58178423/234748037-96d8e0ed-9dac-4bdf-b5aa-0282bf7e362c.png)

Sau khi sửa trả lời hoặc trả lời xong thì người dùng bấm nút Gửi câu trả lời lên hỏi đáp. Nếu thành công sẽ có thông báo thành công, còn nếu thất bại thì sẽ có thông báo thất bại kèm theo lỗi và bấm nút đồng ý như hình vẽ:

![image](https://user-images.githubusercontent.com/58178423/234746867-a5cf3ed1-6232-4ed2-b90f-2513f5ef99ae.png)

![image](https://user-images.githubusercontent.com/58178423/234747375-39ec3e15-76fe-4167-9fe1-0688ed54ce3f.png)

- Đối với người dùng có vai trò là học viên trong khóa học, người dùng sẽ có quyền thêm câu hỏi và xem chi tiết câu hỏi.

![image](https://user-images.githubusercontent.com/58178423/234749553-a8eb6ada-a1fc-4555-a388-816059f19215.png)

Người dùng bấm vào nút dấu + để thêm câu hỏi như hình vẽ và sẽ xuất hiện giao diện như sau:

![image](https://user-images.githubusercontent.com/58178423/234749829-f87d69dd-88a5-4b56-b226-4d4fc846076d.png)

Sau khi thêm câu hỏi xong thì người dùng bấm nút Gửi câu hỏi lên hỏi đáp. Nếu thành công sẽ có thông báo thành công, còn nếu thất bại thì sẽ có thông báo thất bại kèm theo lỗi và bấm nút đồng ý như hình vẽ:

![image](https://user-images.githubusercontent.com/58178423/234750163-54e622c1-3553-4396-ad5b-f2a52dd68250.png)

![image](https://user-images.githubusercontent.com/58178423/234750319-ae5c1de0-287c-40eb-bdc8-295e33eecc88.png)

Khi người dùng là học viên bấm vào nút xem chi tiết, người dùng sẽ có quyền sửa câu hỏi nếu câu hỏi đó do chính người dùng đó đặt câu hỏi và câu hỏi đó chưa có giảng viên trả lời.

![image](https://user-images.githubusercontent.com/58178423/234750636-19ac556a-b8f2-4a55-934f-0e94a79039e5.png)

Giao diện và chức năng của sửa câu hỏi tương tự như thêm câu hỏi.

# 3. Phân tích thiết kế (database, cách viết functions, method call flowchart nếu cần)

Trong file src\addons\mod\qaa\components\index\index.ts ta dùng function getquestion() để call list câu hỏi và câu trả lời để hiển thị trên giao diện:

    async getquestion(): Promise<void> {
        const site = await CoreSites.getSite();

        const userId = site.getUserId()

        var data: any = {
            "qaa": {
                userid: userId,
                courseid: this.courseId,
                cmid: this.module.id
            }

        };

        const preSets = {
            getFromCache: false,
        };

        await site.write('mod_qaa_getquestion', data, preSets).then((data) => {
            let response = JSON.parse(JSON.stringify(data))
            console.log(data)
        if(response.answerquest == true){
            this.answerquest = true
        }else {
            this.answerquest = false
        }

        if(response.makequest == true){
            this.makequest = true
        }else {
            this.makequest = false
        }

        if(response.list_answered.length != 0) {
            this.list_answered = response.list_answered
            let i = 0
            response.list_answered.forEach(obj => {
                i  += obj.qaap.length
            })
            this.number_answered = i
            this.answered = true
        }else {
            this.answered = false
        }

        if(response.list_unanswered.length != 0) {
            this.list_unanswered = response.list_unanswered
            let i = 0
            response.list_unanswered.forEach(obj => {
                i  += obj.qaap.length
            })
            this.number_unanswered = i
            this.unanswered = true
        }else {
            this.unanswered = false
        }

        }).catch((e) => {
            console.log(e)
        });

    }

Trong file src\addons\mod\qaa\components\add-question\add.ts ta dùng function add_question() để thêm câu hỏi:

    async add_question() {
        if(this.textareaValue != undefined) {
            const loading = await this.loadingController.create({
                message: 'Vui lòng chờ...',
              });
              loading.present();
                const site = await CoreSites.getSite();

                var data: any = {
                        courseid: this.courseId,
                        cmid: this.cmid,
                        question: this.textareaValue
                };

                console.log(data)


                const preSets = {
                    getFromCache: false,
                };

                await site.read('mod_qaa_makequestion', data, preSets).then(async (data) => {
                    const alert = await this.alertCtrl.create({
                        header: 'Thêm câu hỏi',
                        message: 'Bạn đã thêm câu hỏi thành công!',
                        buttons: [ {
                            text: 'Đồng ý',
                            role: 'destructive',
                            handler: () => this.back()
                          }]
                    });
                    await alert.present();


                }).catch(async (e) => {
                    const jsonValue = JSON.stringify(e);
                    let temp = JSON.parse(jsonValue)
                    console.log(temp.name, temp.exception)
                    const alert = await this.alertCtrl.create({
                        header: 'Thông báo',
                        message: e,
                        buttons: [ {
                            text: 'Đồng ý',
                            role: 'destructive',
                            }]
                    });

                    await alert.present();
            });
                loading.dismiss();
        }else {
            const alert = await this.alertCtrl.create({
                header: 'Thông báo',
                message: 'Bạn vui lòng nhập nội dung!',
                buttons: [ {
                    text: 'Đồng ý',
                    role: 'destructive',
                  }]
            });
            await alert.present();
        }
    }

Trong file src\addons\mod\qaa\components\edit_question\edit.ts ta dùng function edit_question() để sửa nội dung câu hỏi:

    async edit_question() {
        if(this.textareaValue != undefined) {
            const loading = await this.loadingController.create({
                message: 'Vui lòng chờ...',
              });
              loading.present();
                const site = await CoreSites.getSite();

                var data: any = {
                    courseid: this.courseId,
                    cmid: this.cmid,
                    questionid: this.qapp.id,
                    action: 'edit_question',
                    newquestion: this.textareaValue
                };

                console.log(data)


                const preSets = {
                    getFromCache: false,
                };

                await site.read('mod_qaa_updatequestion', data, preSets).then(async (data) => {
                    const alert = await this.alertCtrl.create({
                        header: 'Sửa câu hỏi',
                        message: 'Bạn đã sửa câu hỏi thành công!',
                        buttons: [ {
                            text: 'Đồng ý',
                            role: 'destructive',
                            handler: () => this.back()
                          }]
                    });
                    await alert.present();


                }).catch(async (e) => {
                    const jsonValue = JSON.stringify(e);
                    let temp = JSON.parse(jsonValue)
                    console.log(temp.name, temp.exception)
                    const alert = await this.alertCtrl.create({
                        header: 'Thông báo',
                        message: e,
                        buttons: [ {
                            text: 'Đồng ý',
                            role: 'destructive',
                            }]
                    });

                    await alert.present();
            });
                loading.dismiss();
        }else {
            const alert = await this.alertCtrl.create({
                header: 'Thông báo',
                message: 'Bạn vui lòng nhập nội dung!',
                buttons: [ {
                    text: 'Đồng ý',
                    role: 'destructive',
                  }]
            });
            await alert.present();
        }
    }

Trong file src\addons\mod\qaa\components\answer\answer.ts ta dùng function add_answer() để thêm câu trả lời:

    async add_answer() {
        if(this.textareaValue != undefined) {
            const loading = await this.loadingController.create({
                message: 'Vui lòng chờ...',
              });
              loading.present();
                const site = await CoreSites.getSite();

                var data: any = {
                        courseid: this.courseId,
                        cmid: this.cmid,
                        questionid: this.qapp.id,
                        action: 'add_answer',
                        newanswer: this.textareaValue
                };

                console.log(data)


                const preSets = {
                    getFromCache: false,
                };

                await site.read('mod_qaa_updatequestion', data, preSets).then(async (data) => {
                    console.log(data)
                    const alert = await this.alertCtrl.create({
                        header: 'Thêm câu trả lời',
                        message: 'Bạn đã thêm câu trả lời thành công!',
                        buttons: [ {
                            text: 'Đồng ý',
                            role: 'destructive',
                            handler: () => this.back()
                          }]
                    });
                    await alert.present();


                }).catch(async (e) => {
                    const jsonValue = JSON.stringify(e);
                    let temp = JSON.parse(jsonValue)
                    console.log(temp.name, temp.exception)
                    const alert = await this.alertCtrl.create({
                        header: 'Thông báo',
                        message: e,
                        buttons: [ {
                            text: 'Đồng ý',
                            role: 'destructive',
                            }]
                    });

                    await alert.present();
            });
                loading.dismiss();
        }else {
            const alert = await this.alertCtrl.create({
                header: 'Thông báo',
                message: 'Bạn vui lòng nhập nội dung!',
                buttons: [ {
                    text: 'Đồng ý',
                    role: 'destructive',
                  }]
            });
            await alert.present();
        }
    }

Trong file src\addons\mod\qaa\components\answer\answer.ts ta dùng function edit_question() để sửa câu trả lời:

    async edit_answer() {
        if(this.textareaValue != undefined) {
            const loading = await this.loadingController.create({
                message: 'Vui lòng chờ...',
              });
              loading.present();
                const site = await CoreSites.getSite();

                var data: any = {
                    courseid: this.courseId,
                    cmid: this.cmid,
                    questionid: this.qapp.id,
                    action: 'add_answer',
                    newanswer: this.textareaValue
                };

                console.log(data)


                const preSets = {
                    getFromCache: false,
                };

                await site.read('mod_qaa_updatequestion', data, preSets).then(async (data) => {
                    const alert = await this.alertCtrl.create({
                        header: 'Sửa câu trả lời',
                        message: 'Bạn đã sửa câu trả lời thành công!',
                        buttons: [ {
                            text: 'Đồng ý',
                            role: 'destructive',
                            handler: () => this.back()
                          }]
                    });
                    await alert.present();


                }).catch(async (e) => {
                    const jsonValue = JSON.stringify(e);
                    let temp = JSON.parse(jsonValue)
                    console.log(temp.name, temp.exception)
                    const alert = await this.alertCtrl.create({
                        header: 'Thông báo',
                        message: e,
                        buttons: [ {
                            text: 'Đồng ý',
                            role: 'destructive',
                            }]
                    });

                    await alert.present();
            });
                loading.dismiss();
        }else {
            const alert = await this.alertCtrl.create({
                header: 'Thông báo',
                message: 'Bạn vui lòng nhập nội dung!',
                buttons: [ {
                    text: 'Đồng ý',
                    role: 'destructive',
                  }]
            });
            await alert.present();
        }
    }

cài đặt thư viện  ngx-quill và khai báo trong src\addons\mod\qaa\components\components.module.ts
import { QuillModule } from 'ngx-quill';

const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // toggled buttons
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }], // custom button values
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
      [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
      [{ direction: 'rtl' }], // text direction
      [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [], // dropdown with defaults from theme
      [{ font: [] }],
      [{ align: [] }],
      ['clean'], // remove formatting button
      ['link', 'image', 'video']  // link and image, video
    ]
  };

  Thêm đoạn code style và js vào angular.json để thư viện quill hoạt động
    "styles": [
              {
                "input": "src/theme/theme.scss"
              },
                "./node_modules/quill/dist/quill.core.css",
                "./node_modules/quill/dist/quill.bubble.css",
                "./node_modules/quill/dist/quill.snow.css"
            ],
            "scripts": [ "node_modules/quill/dist/quill.min.js"]


# 4. Mã nguồn (nếu cần hướng dẫn viết mã nguồn chi tiết, những thay đổi mã nguồn cần để viết tính năng này)

https://github.com/minhpl/thmoodleapp/compare/main-TUAF...31-feature_chuc_nang_hoi_dap_tren_app

# 5. Kiểm thử (nếu cần)


# 6. Triển khai (Hướng dẫn triển khai, lưu ý khi upload nên appstore. nếu cần)
