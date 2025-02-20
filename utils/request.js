// export default request;
const baseURL = 'http://localhost:789';
// const baseURL = 'http://119.45.18.3:789';

const request = (options) => {
  // GET请求处理
  let url = baseURL + options.url;
  
  // 处理URL参数
  if (options.params) {
    const queryString = Object.entries(options.params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    url += (url.includes('?') ? '&' : '?') + queryString;
  }
  
  // 打印完整请求信息
  console.log('完整请求URL:', url);
  console.log('请求方法:', options.method);
  console.log('请求体:', options.data);
  
  return new Promise((resolve, reject) => {
    uni.request({
      url: url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',  // 添加Content-Type头
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