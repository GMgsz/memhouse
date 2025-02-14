// const request = (options) => {
//   const baseURL = 'http://localhost:789'; // 设置基础URL
  
//   return new Promise((resolve, reject) => {
//     uni.request({
//       url: baseURL + options.url,
//       method: options.method || 'GET',
//       data: options.data,
//       header: options.header || {},
//       success: (res) => {
//         resolve(res);
//       },
//       fail: (err) => {
//         reject(err);
//       }
//     });
//   });
// };

// export default request;
const baseURL = 'http://localhost:789';

const request = (options) => {
  // GET请求处理
  let url = baseURL + options.url;
  if (options.method === 'GET' && options.data) {
    const queryString = Object.entries(options.data)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    url += (url.includes('?') ? '&' : '?') + queryString;
  }
  
  return new Promise((resolve, reject) => {
    uni.request({
      url: url,
      method: options.method || 'GET',
      data: options.method === 'GET' ? undefined : options.data,
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

// 添加文件上传方法
const uploadFile = (options) => {
  const url = baseURL + options.url;
  
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: url,
      filePath: options.filePath,
      name: options.name || 'file',
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

export default {
  request,
  uploadFile
};