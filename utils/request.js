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
const request = (options) => {
  const baseURL = 'http://localhost:789';
  
  // 只对 GET 请求特殊处理参数
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
      // POST等其他请求仍然使用原来的data方式
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

export default request;