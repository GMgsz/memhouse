"use strict";
const common_vendor = require("../common/vendor.js");
const BASE_URL = "http://localhost:8000";
function analyzeImage(tempFilePath) {
  return new Promise((resolve, reject) => {
    console.log("开始上传图片:", tempFilePath);
    common_vendor.index.uploadFile({
      url: `${BASE_URL}/analyze_image`,
      filePath: tempFilePath,
      name: "file",
      header: {
        "content-type": "multipart/form-data"
        // 添加正确的 content-type
      },
      success: (uploadRes) => {
        console.log("上传成功，响应:", uploadRes);
        if (uploadRes.statusCode !== 200) {
          reject(new Error(`HTTP 错误: ${uploadRes.statusCode}`));
          return;
        }
        let result;
        try {
          result = JSON.parse(uploadRes.data);
          console.log("解析后的响应数据:", result);
          resolve(result);
        } catch (error) {
          console.error("解析响应数据失败:", error, uploadRes.data);
          reject(new Error("解析响应数据失败"));
        }
      },
      fail: (error) => {
        console.error("上传失败:", error);
        reject(new Error("图片上传失败"));
      }
    });
  });
}
function createPoem(keywords, poemType = "古诗") {
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: `${BASE_URL}/create_poem`,
      method: "POST",
      data: {
        keywords,
        poem_type: poemType
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error("生成诗歌失败: " + JSON.stringify(res.data)));
        }
      },
      fail: (error) => {
        console.error("请求失败：", error);
        reject(error);
      }
    });
  });
}
exports.analyzeImage = analyzeImage;
exports.createPoem = createPoem;
