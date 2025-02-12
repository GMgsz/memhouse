<template>
  <view class="container">
    <button @tap="chooseAndUploadImage" type="primary">选择并上传图片</button>
    
    <!-- 预览区域 -->
    <view class="preview" v-if="imageUrl">
      <image :src="imageUrl" mode="aspectFit"></image>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js';

export default {
  data() {
    return {
      imageUrl: '', // 上传后的图片URL
      ossData: {
        key: '', // 文件名
        policy: '',
        xOssSecurityToken: '',
        xOssSignatureVersion: '',
        xOssCredential: '', 
        xOssDate: '',
        xOssSignature: ''
      }
    };
  },
  methods: {
	// 检查设备是否在线
	async checkDevice(deviceId = '123456') {
	  try {
		const res = await request({
		  url: '/photograph/api/check_device',
		  method: 'GET',
		  data: {
			deviceId: deviceId
		  }
		});
		
		console.log('设备状态检查结果:', res.data);
		return res.data;
	  } catch (err) {
		console.error('检查设备状态失败:', err);
		throw err;
	  }
	},
    // 获取签名信息
    async getSignature() {
      try {
        const res = await this.$request({
          url: '/photograph/api/generate_signature',
          method: 'GET'
        });
        
        if(res.data) {
          this.ossData = {
            policy: res.data.policy,
            xOssSecurityToken: res.data.security_token,
            xOssSignatureVersion: res.data.x_oss_signature_version,
            xOssCredential: res.data.x_oss_credential,
            xOssDate: res.data.x_oss_date, 
            xOssSignature: res.data.signature
          }
          return true;
        }
        return false;
      } catch(err) {
        console.error('获取签名失败:', err);
        uni.showToast({
          title: '获取上传凭证失败',
          icon: 'none'
        });
        return false;
      }
    },

    // 上传文件到OSS
    async uploadFileToOSS(filePath) {
      try {
        // 获取原始文件名
        const originalFileName = filePath.split('/').pop();
        // 生成新的文件名（包含路径）
        const fileName = this.generateFileName(originalFileName);
        this.ossData.key = fileName;
    
        const formData = {
          key: this.ossData.key,
          policy: this.ossData.policy,
          'x-oss-signature-version': this.ossData.xOssSignatureVersion,
          'x-oss-credential': this.ossData.xOssCredential,
          'x-oss-date': this.ossData.xOssDate,
          'x-oss-signature': this.ossData.xOssSignature,
          'x-oss-security-token': this.ossData.xOssSecurityToken,
          success_action_status: "200"
        };
    
        return new Promise((resolve, reject) => {
          uni.uploadFile({
            url: 'https://photograph-bucket.oss-cn-beijing.aliyuncs.com',
            filePath: filePath,
            name: 'file',
            formData: formData,
            success: async (res) => {
              if (res.statusCode === 200) {
                const imageUrl = `https://photograph-bucket.oss-cn-beijing.aliyuncs.com/${fileName}`;
                try {
                  // 通知服务端
                  await this.notifyServer(imageUrl);
                  resolve(imageUrl);
                } catch (err) {
                  console.error('通知服务端失败:', err);
                  reject(err);
                }
              } else {
                reject(new Error('上传失败'));
              }
            },
            fail: (err) => {
              console.error('上传失败:', err);
              reject(err);
            }
          });
        });
      } catch (err) {
        console.error('处理文件名失败:', err);
        throw err;
      }
    },

    // 选择并上传图片
    async chooseAndUploadImage() {
      try {
		// 首先检查设备是否在线
		const isDeviceOnline = await this.checkDevice();
		if (!isDeviceOnline) {
		  uni.showToast({
			title: '电子相册设备不在线',
			icon: 'none',
			duration: 2000
		  });
		  return;
		}
        // 选择图片
        const { tempFilePaths } = await uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        });
        
        // 获取签名
        const hasSignature = await this.getSignature();
        if(!hasSignature) return;
        
        // 显示上传loading
        uni.showLoading({
          title: '上传中...'
        });
        
        // 上传图片
        const imageUrl = await this.uploadFileToOSS(tempFilePaths[0]);
        this.imageUrl = imageUrl;
        
        uni.showToast({
          title: '上传成功',
          icon: 'success'
        });
        
      } catch(err) {
        console.error('操作失败:', err);
        uni.showToast({
          title: '上传失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },

    async notifyServer(imageUrl,deviceId = '123456') {
    try {
      const res = await request({
        url: '/photograph/api/save_photo',
        method: 'POST',
        data: {
          photoUrl: imageUrl,
          uploadTime: new Date().toISOString(),
          // 可以添加其他需要的信息
          fileName: this.ossData.key,
		  deviceId: deviceId,
        }
      });
      
      if (!res.data.success) {
        throw new Error('保存图片信息失败');
      }
      
      return res.data;
    } catch (err) {
      console.error('通知服务端失败:', err);
      throw err;
    }
  },
  // 生成文件名
    generateFileName(originalFileName) {
      // 生成UUID
      const uuid = this.generateUUID();
      // 获取当前日期路径 yyyy/MM/dd
      const datePath = this.getDatePath();
      // 拼接完整路径
      return `${datePath}/${uuid}-${originalFileName}`;
    },
  
    // 生成UUID
    generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }).replaceAll('-', '');
    },
  
    // 获取日期路径
    getDatePath() {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    }
  
  
  }
};
</script>

<style>
.container {
  padding: 20px;
}

.preview {
  margin-top: 20px;
}

.preview image {
  width: 100%;
  height: 200px;
}
</style>