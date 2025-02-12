"use strict";
const common_vendor = require("../common/vendor.js");
const request = (options) => {
  const baseURL = "http://localhost:789";
  let url = baseURL + options.url;
  if (options.method === "GET" && options.data) {
    const queryString = Object.entries(options.data).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
    url += (url.includes("?") ? "&" : "?") + queryString;
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: options.method || "GET",
      // POST等其他请求仍然使用原来的data方式
      data: options.method === "GET" ? void 0 : options.data,
      header: options.header || {},
      success: (res) => {
        resolve(res);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};
exports.request = request;
