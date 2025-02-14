"use strict";
const common_vendor = require("../common/vendor.js");
const baseURL = "http://119.45.18.3:789";
const request = (options) => {
  let url = baseURL + options.url;
  if (options.method === "GET" && options.data) {
    const queryString = Object.entries(options.data).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
    url += (url.includes("?") ? "&" : "?") + queryString;
  }
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: options.method || "GET",
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
const uploadFile = (options) => {
  const url = baseURL + options.url;
  return new Promise((resolve, reject) => {
    common_vendor.index.uploadFile({
      url,
      filePath: options.filePath,
      name: options.name || "file",
      formData: options.formData || {},
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
const request$1 = {
  request,
  uploadFile
};
exports.request = request$1;
