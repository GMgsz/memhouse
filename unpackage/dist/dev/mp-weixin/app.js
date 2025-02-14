"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const utils_request = require("./utils/request.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/poetry/index.js";
  "./pages/test/oss-test.js";
  "./pages/test/device-upload.js";
}
const _sfc_main = {
  onLaunch: function() {
    console.log("App Launch");
  },
  onShow: function() {
    console.log("App Show");
  },
  onHide: function() {
    console.log("App Hide");
  }
};
const App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "E:/Project/Front/memhouse_front/App.vue"]]);
function createApp() {
  const app = common_vendor.createSSRApp(App);
  app.config.globalProperties.$request = utils_request.request;
  return { app };
}
createApp().app.mount("#app");
exports.createApp = createApp;
