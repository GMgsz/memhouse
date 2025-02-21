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
    deviceId: "123456",
    // 设备ID默认值
    userId: "default_user",
    // 用户ID默认值
    previewUrlCache: /* @__PURE__ */ new Map()
    // 预览图URL缓存
  },
  methods: {
    // 清理过期的预览图缓存
    cleanExpiredCache() {
      const now = Date.now();
      for (const [key, value] of this.globalData.previewUrlCache) {
        if (value.expireTime <= now) {
          this.globalData.previewUrlCache.delete(key);
        }
      }
    },
    // 获取预览图URL（带缓存）
    async getPreviewUrl(thumbInfo) {
      var _a, _b;
      const cacheKey = thumbInfo.thumbId;
      const now = Date.now();
      this.cleanExpiredCache();
      const cached = this.globalData.previewUrlCache.get(cacheKey);
      if (cached && cached.expireTime > now) {
        return cached.signedUrl;
      }
      try {
        const res = await utils_request.requestUtil.request({
          url: "/photograph/api/preview_image",
          method: "POST",
          params: { deviceId: this.globalData.deviceId },
          data: thumbInfo
        });
        if ((_a = res.data) == null ? void 0 : _a.success) {
          const signedUrl = res.data.data.signedUrl;
          const expireTime = this.parseExpirationFromUrl(signedUrl);
          this.globalData.previewUrlCache.set(cacheKey, {
            signedUrl,
            expireTime
          });
          return signedUrl;
        }
        throw new Error(((_b = res.data) == null ? void 0 : _b.message) || "获取预览图失败");
      } catch (error) {
        console.error("获取预览图失败:", error);
        throw error;
      }
    },
    // 从URL中解析过期时间
    parseExpirationFromUrl(url) {
      try {
        const queryString = url.split("?")[1];
        if (!queryString) {
          throw new Error("URL没有参数部分");
        }
        const params = queryString.split("&").reduce((acc, param) => {
          const [key, value] = param.split("=");
          acc[key] = value;
          return acc;
        }, {});
        const expires = params["Expires"];
        if (!expires) {
          throw new Error("URL中没有Expires参数");
        }
        return parseInt(expires) * 1e3;
      } catch (error) {
        console.error("解析URL过期时间失败:", error);
        return Date.now() + 3600 * 1e3;
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
