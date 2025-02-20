"use strict";
const common_vendor = require("../common/vendor.js");
const baseURL = "http://localhost:789";
const request = (options) => {
  let url = baseURL + options.url;
  if (options.params) {
    const queryString = Object.entries(options.params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
    url += (url.includes("?") ? "&" : "?") + queryString;
  }
  console.log("完整请求URL:", url);
  console.log("请求方法:", options.method);
  console.log("请求体:", options.data);
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url,
      method: options.method || "GET",
      data: options.data,
      header: {
        "Content-Type": "application/json",
        // 添加Content-Type头
        ...options.header
      },
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
const requestUtil = {
  request,
  uploadFile
};
exports.requestUtil = requestUtil;
