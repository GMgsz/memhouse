"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  data() {
    return {
      imageUrl: "",
      questionText: "",
      presetQuestions: [
        "这张照片是什么时候拍的？",
        "照片中的人物是谁？",
        "这是在哪里拍摄的？",
        "有什么特别的回忆吗？"
      ],
      tempFilePath: "",
      originalFileName: ""
    };
  },
  computed: {
    canSubmit() {
      return this.imageUrl && this.questionText.trim().length > 0;
    }
  },
  methods: {
    async chooseImage() {
      try {
        const { tempFilePaths, tempFiles } = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"]
        });
        this.tempFilePath = tempFilePaths[0];
        this.imageUrl = tempFilePaths[0];
        this.originalFileName = tempFiles[0].name || tempFilePaths[0].split("/").pop();
      } catch (err) {
        console.error("选择图片失败:", err);
        common_vendor.index.showToast({
          title: "选择图片失败",
          icon: "none"
        });
      }
    },
    deleteImage() {
      this.imageUrl = "";
      this.tempFilePath = "";
    },
    selectQuestion(question) {
      this.questionText = question;
    },
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
        common_vendor.index.showLoading({ title: "上传中..." });
        await this.uploadToServer();
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
    resetForm() {
      this.imageUrl = "";
      this.questionText = "";
      this.tempFilePath = "";
    },
    async checkDevice(deviceId = "123456") {
      try {
        const res = await utils_request.request.request({
          url: "/photograph/api/check_device",
          method: "GET",
          data: {
            deviceId
          }
        });
        return res.data;
      } catch (err) {
        console.error("检查设备状态失败:", err);
        throw err;
      }
    },
    async uploadToServer(deviceId = "123456") {
      try {
        const timestamp = (/* @__PURE__ */ new Date()).getTime();
        const extension = this.originalFileName.split(".").pop() || "jpg";
        const fileName = `photo_${timestamp}.${extension}`;
        const res = await utils_request.request.uploadFile({
          url: "/photograph/api/upload_photo",
          filePath: this.tempFilePath,
          name: "photo",
          header: {
            "Content-Type": "multipart/form-data"
          },
          formData: {
            question: this.questionText,
            deviceId,
            fileName
            // 添加文件名
          }
        });
        console.log("上传响应:", res);
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              return data;
            } else {
              console.error("服务器返回错误:", data);
              throw new Error(data.message || "上传失败");
            }
          } catch (error) {
            console.error("解析响应数据失败:", error, res.data);
            throw new Error("解析响应数据失败");
          }
        } else {
          console.error("HTTP状态码错误:", res.statusCode);
          throw new Error(`上传失败: ${res.statusCode}`);
        }
      } catch (err) {
        console.error("上传请求失败:", err);
        throw err;
      }
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
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "E:/Project/Front/memhouse_front/pages/test/device-upload.vue"]]);
wx.createPage(MiniProgramPage);
