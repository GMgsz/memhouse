"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  data() {
    return {
      imageUrl: "",
      // 上传后的图片URL
      questionText: "",
      // 问题描述
      presetQuestions: [
        "这张照片是什么时候拍的？",
        "照片中的人物是谁？",
        "这是在哪里拍摄的？",
        "有什么特别的回忆吗？"
      ],
      // OSS相关数据
      ossData: {
        key: "",
        policy: "",
        xOssSecurityToken: "",
        xOssSignatureVersion: "",
        xOssCredential: "",
        xOssDate: "",
        xOssSignature: ""
      },
      tempFilePath: ""
      // 临时文件路径
    };
  },
  computed: {
    canSubmit() {
      return this.imageUrl && this.questionText.trim().length > 0;
    }
  },
  methods: {
    // 选择图片
    async chooseImage() {
      try {
        const { tempFilePaths } = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"]
        });
        this.tempFilePath = tempFilePaths[0];
        this.imageUrl = tempFilePaths[0];
      } catch (err) {
        console.error("选择图片失败:", err);
        common_vendor.index.showToast({
          title: "选择图片失败",
          icon: "none"
        });
      }
    },
    // 删除已选择的图片
    deleteImage() {
      this.imageUrl = "";
      this.tempFilePath = "";
    },
    // 选择预设问题
    selectQuestion(question) {
      this.questionText = question;
    },
    // 提交处理
    async handleSubmit() {
      if (!this.canSubmit)
        return;
      try {
        const isDeviceOnline = await this.checkDevice();
        if (!isDeviceOnline) {
          common_vendor.index.showToast({
            title: "电子相册设备不在线",
            icon: "none"
          });
          return;
        }
        const hasSignature = await this.getSignature();
        if (!hasSignature)
          return;
        common_vendor.index.showLoading({ title: "上传中..." });
        const imageUrl = await this.uploadFileToOSS(this.tempFilePath);
        await this.submitQuestionAndImage(imageUrl);
        common_vendor.index.showToast({
          title: "提交成功",
          icon: "success"
        });
        this.resetForm();
      } catch (err) {
        console.error("提交失败:", err);
        common_vendor.index.showToast({
          title: "提交失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // 重置表单
    resetForm() {
      this.imageUrl = "";
      this.questionText = "";
      this.tempFilePath = "";
    },
    // 提交问题和图片URL到服务器
    async submitQuestionAndImage(imageUrl, deviceId = "123456") {
      try {
        const res = await utils_request.requestUtil({
          url: "/photograph/api/save_photo",
          method: "POST",
          data: {
            photoUrl: imageUrl,
            question: this.questionText,
            uploadTime: (/* @__PURE__ */ new Date()).toISOString(),
            fileName: this.ossData.key,
            deviceId
          }
        });
        if (!res.data.success) {
          throw new Error("保存信息失败");
        }
        return res.data;
      } catch (err) {
        console.error("提交到服务器失败:", err);
        throw err;
      }
    },
    // 检查设备是否在线
    async checkDevice(deviceId = "123456") {
      try {
        const res = await utils_request.requestUtil({
          url: "/photograph/api/check_device",
          method: "GET",
          data: {
            deviceId
          }
        });
        console.log("设备状态检查结果:", res.data);
        return res.data;
      } catch (err) {
        console.error("检查设备状态失败:", err);
        throw err;
      }
    },
    // 获取签名信息
    async getSignature() {
      try {
        const res = await this.$request({
          url: "/photograph/api/generate_signature",
          method: "GET"
        });
        if (res.data) {
          this.ossData = {
            policy: res.data.policy,
            xOssSecurityToken: res.data.security_token,
            xOssSignatureVersion: res.data.x_oss_signature_version,
            xOssCredential: res.data.x_oss_credential,
            xOssDate: res.data.x_oss_date,
            xOssSignature: res.data.signature
          };
          return true;
        }
        return false;
      } catch (err) {
        console.error("获取签名失败:", err);
        common_vendor.index.showToast({
          title: "获取上传凭证失败",
          icon: "none"
        });
        return false;
      }
    },
    // 上传文件到OSS
    async uploadFileToOSS(filePath) {
      try {
        const originalFileName = filePath.split("/").pop();
        const fileName = this.generateFileName(originalFileName);
        this.ossData.key = fileName;
        const formData = {
          key: this.ossData.key,
          policy: this.ossData.policy,
          "x-oss-signature-version": this.ossData.xOssSignatureVersion,
          "x-oss-credential": this.ossData.xOssCredential,
          "x-oss-date": this.ossData.xOssDate,
          "x-oss-signature": this.ossData.xOssSignature,
          "x-oss-security-token": this.ossData.xOssSecurityToken,
          success_action_status: "200"
        };
        return new Promise((resolve, reject) => {
          common_vendor.index.uploadFile({
            url: "https://photograph-bucket.oss-cn-beijing.aliyuncs.com",
            filePath,
            name: "file",
            formData,
            success: (res) => {
              if (res.statusCode === 200) {
                const imageUrl = `https://photograph-bucket.oss-cn-beijing.aliyuncs.com/${fileName}`;
                resolve(imageUrl);
              } else {
                reject(new Error("上传失败"));
              }
            },
            fail: (err) => {
              console.error("上传失败:", err);
              reject(err);
            }
          });
        });
      } catch (err) {
        console.error("处理文件名失败:", err);
        throw err;
      }
    },
    // 生成文件名
    generateFileName(originalFileName) {
      const uuid = this.generateUUID();
      const datePath = this.getDatePath();
      return `${datePath}/${uuid}-${originalFileName}`;
    },
    // 生成UUID
    generateUUID() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : r & 3 | 8;
        return v.toString(16);
      }).replaceAll("-", "");
    },
    // 获取日期路径
    getDatePath() {
      const date = /* @__PURE__ */ new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}/${month}/${day}`;
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.imageUrl
  }, !$data.imageUrl ? {
    b: common_vendor.p({
      type: "camera-filled",
      size: "32",
      color: "#999"
    }),
    c: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args))
  } : {}, {
    d: $data.imageUrl
  }, $data.imageUrl ? {
    e: $data.imageUrl,
    f: common_vendor.p({
      type: "trash",
      size: "20",
      color: "#FF4D4F"
    }),
    g: common_vendor.o((...args) => $options.deleteImage && $options.deleteImage(...args))
  } : {}, {
    h: $data.questionText,
    i: common_vendor.o(($event) => $data.questionText = $event.detail.value),
    j: common_vendor.t($data.questionText.length),
    k: common_vendor.f($data.presetQuestions, (question, index, i0) => {
      return {
        a: common_vendor.t(question),
        b: index,
        c: common_vendor.o(($event) => $options.selectQuestion(question), index)
      };
    }),
    l: !$options.canSubmit,
    m: !$options.canSubmit ? 1 : "",
    n: common_vendor.o((...args) => $options.handleSubmit && $options.handleSubmit(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "E:/Project/Front/memhouse_front/pages/create/oss-test.vue"]]);
wx.createPage(MiniProgramPage);
