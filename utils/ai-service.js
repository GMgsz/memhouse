// const BASE_URL = 'http://192.168.200.173:8000';  // 服务器IP
const BASE_URL = 'http://localhost:8000';  // 服务器IP
// const BASE_URL = 'http://192.168.201.169:8000';  // 服务器IP

// 分析图片
export function analyzeImage(tempFilePath) {
  return new Promise((resolve, reject) => {
    console.log('开始上传图片:', tempFilePath); // 添加日志
    
    uni.uploadFile({
      url: `${BASE_URL}/analyze_image`,
      filePath: tempFilePath,
      name: 'file',
      header: {
        'content-type': 'multipart/form-data', // 添加正确的 content-type
      },
      success: (uploadRes) => {
        console.log('上传成功，响应:', uploadRes); // 添加日志
        
        if (uploadRes.statusCode !== 200) {
          reject(new Error(`HTTP 错误: ${uploadRes.statusCode}`));
          return;
        }
        
        let result;
        try {
          result = JSON.parse(uploadRes.data);
          console.log('解析后的响应数据:', result); // 添加日志
          resolve(result);
        } catch (error) {
          console.error('解析响应数据失败:', error, uploadRes.data); // 添加错误日志
          reject(new Error('解析响应数据失败'));
        }
      },
      fail: (error) => {
        console.error('上传失败:', error); // 添加错误日志
        reject(new Error('图片上传失败'));
      }
    });
  });
}

// 创建诗歌
export function createPoem(keywords, poemType = '古诗') {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/create_poem`,
      method: 'POST',
      data: {
        keywords: keywords,
        poem_type: poemType
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error('生成诗歌失败: ' + JSON.stringify(res.data)));
        }
      },
      fail: (error) => {
        console.error('请求失败：', error);
        reject(error);
      }
    });
  });
} 