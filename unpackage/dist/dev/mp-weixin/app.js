"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const utils_request = require("./utils/request.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/poetry/index.js";
  "./pages/create/oss-test.js";
  "./pages/create/device-upload.js";
  "./pages/thumbs/index.js";
}
const _sfc_main = {
  globalData: {
    stsCredentials: null,
    // STS凭证
    stsExpireTime: null,
    // 凭证过期时间
    deviceId: "123456",
    // 设备ID默认值
    userId: "default_user",
    // 用户ID默认值
    ossClient: null,
    // 添加OSS客户端
    endpoint: "oss-cn-beijing.aliyuncs.com",
    // OSS endpoint
    bucket: "photograph-bucket",
    // OSS bucket名称
    signedUrls: /* @__PURE__ */ new Map()
    // 用于缓存签名URL
  },
  onLaunch: function() {
    this.initStsCredentials();
  },
  methods: {
    // 初始化 STS 凭证
    async initStsCredentials() {
      try {
        await this.updateStsCredentials();
      } catch (error) {
        console.error("初始化 STS 凭证失败:", error);
        common_vendor.index.showToast({
          title: "获取访问凭证失败",
          icon: "none"
        });
      }
    },
    // 更新 STS 凭证
    async updateStsCredentials() {
      try {
        const res = await utils_request.requestUtil.request({
          url: "/photograph/api/get-sts",
          // 更新为正确的接口路径
          method: "GET",
          data: {
            deviceId: this.globalData.deviceId,
            userId: this.globalData.userId
          }
        });
        if (res.data && res.data.success) {
          const credentials = res.data.data;
          this.globalData.stsCredentials = {
            accessKeyId: credentials.accessKeyId,
            accessKeySecret: credentials.accessKeySecret,
            securityToken: credentials.securityToken,
            regionId: credentials.regionId
          };
          this.globalData.stsExpireTime = new Date(credentials.expiration).getTime();
          console.log("STS凭证更新成功，过期时间:", credentials.expiration);
          return this.globalData.stsCredentials;
        } else {
          throw new Error("获取STS凭证失败: " + (res.data.message || "未知错误"));
        }
      } catch (error) {
        console.error("更新STS凭证失败:", error);
        throw error;
      }
    },
    // 获取有效的 STS 凭证
    async getValidStsCredentials() {
      const now = Date.now();
      const expireTime = this.globalData.stsExpireTime;
      if (!this.globalData.stsCredentials || !expireTime || now + 10 * 60 * 1e3 >= expireTime) {
        console.log("STS凭证不存在或即将过期，开始更新");
        return await this.updateStsCredentials();
      }
      return this.globalData.stsCredentials;
    },
    // 获取OSS客户端
    async getOssClient() {
      try {
        const credentials = await this.getValidStsCredentials();
        this.globalData.ossClient = new common_vendor.OSS({
          accessKeyId: credentials.accessKeyId,
          accessKeySecret: credentials.accessKeySecret,
          stsToken: credentials.securityToken,
          region: credentials.regionId,
          bucket: this.globalData.bucket,
          endpoint: this.globalData.endpoint
        });
        return this.globalData.ossClient;
      } catch (error) {
        console.error("获取OSS客户端失败:", error);
        throw error;
      }
    },
    // 获取OSS资源URL
    async getOssUrl(objectKey) {
      try {
        const now = Date.now();
        const cachedUrl = this.globalData.signedUrls.get(objectKey);
        if (cachedUrl && cachedUrl.expireTime - now > this.globalData.urlRefreshTime) {
          return cachedUrl.url;
        }
        const client = await this.getOssClient();
        const expires = Math.floor((this.globalData.stsExpireTime - now - 10 * 60 * 1e3) / 1e3);
        const url = await client.signatureUrl(objectKey, { expires });
        this.globalData.signedUrls.set(objectKey, {
          url,
          expireTime: now + expires * 1e3
        });
        return url;
      } catch (error) {
        console.error("获取OSS URL失败:", error);
        throw error;
      }
    }
  }
};
const App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "E:/Project/Front/memhouse_front/App.vue"]]);
function createApp() {
  const app = common_vendor.createSSRApp(App);
  app.config.globalProperties.$request = utils_request.requestUtil;
  return { app };
}
createApp().app.mount("#app");
exports.createApp = createApp;
