<!-- V1.0测试 小程序端直接上传图片到OSS，服务器端通知设备端根据URL下载图片 -->

<template>
  <view class="container">
    <!-- 顶部标题栏 -->
    <view class="header">
      <text class="title">图片与问题上传</text>
    </view>

    <!-- 图片选择和预览区域 -->
    <view class="image-section">
      <view class="image-picker" @tap="chooseImage" v-if="!imageUrl">
        <uni-icons type="camera-filled" size="32" color="#999"/>
        <text class="picker-text">点击选择图片</text>
      </view>
      
      <view class="preview" v-if="imageUrl">
        <image :src="imageUrl" mode="aspectFit"></image>
        <view class="delete-btn" @tap="deleteImage">
          <uni-icons type="trash" size="20" color="#FF4D4F"/>
        </view>
      </view>
    </view>

    <!-- 问题描述区域 -->
    <view class="question-section">
      <textarea
        class="question-input"
        v-model="questionText"
        placeholder="请输入您的问题描述..."
        maxlength="200"
      />
      <text class="word-count">{{questionText.length}}/200</text>
      
      <!-- 预设问题选择区域 -->
      <view class="preset-questions">
        <text class="section-title">常见问题</text>
        <view class="question-tags">
          <view 
            class="question-tag" 
            v-for="(question, index) in presetQuestions" 
            :key="index"
            @tap="selectQuestion(question)"
          >
            {{question}}
          </view>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <button 
      class="submit-btn" 
      :disabled="!canSubmit"
      :class="{'submit-btn-disabled': !canSubmit}"
      @tap="handleSubmit"
    >
      提交
    </button>
  </view>
</template>

<script>
import request from '@/utils/request.js';

export default {
  data() {
    return {
      imageUrl: '', // 上传后的图片URL
      questionText: '', // 问题描述
      presetQuestions: [
        '这张照片是什么时候拍的？',
        '照片中的人物是谁？',
        '这是在哪里拍摄的？',
        '有什么特别的回忆吗？'
      ],
      // OSS相关数据
      ossData: {
        key: '',
        policy: '',
        xOssSecurityToken: '',
        xOssSignatureVersion: '',
        xOssCredential: '',
        xOssDate: '',
        xOssSignature: ''
      },
      tempFilePath: '' // 临时文件路径
    };
  },
  
  computed: {
    canSubmit() {
      return this.imageUrl && this.questionText.trim().length > 0;
    }
  },

  methods: {
    // 选择图片
    async chooseImage() {
      try {
        const { tempFilePaths } = await uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        });
        
        this.tempFilePath = tempFilePaths[0];
        this.imageUrl = tempFilePaths[0];
      } catch(err) {
        console.error('选择图片失败:', err);
        uni.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    },

    // 删除已选择的图片
    deleteImage() {
      this.imageUrl = '';
      this.tempFilePath = '';
    },

    // 选择预设问题
    selectQuestion(question) {
      this.questionText = question;
    },

    // 提交处理
    async handleSubmit() {
      if (!this.canSubmit) return;
      
      try {
        // 检查设备状态
        const isDeviceOnline = await this.checkDevice();
        if (!isDeviceOnline) {
          uni.showToast({
            title: '电子相册设备不在线',
            icon: 'none'
          });
          return;
        }

        // 获取签名
        const hasSignature = await this.getSignature();
        if (!hasSignature) return;

        uni.showLoading({ title: '上传中...' });
        
        // 上传图片
        const imageUrl = await this.uploadFileToOSS(this.tempFilePath);
        
        // 上传问题和图片URL到服务器
        await this.submitQuestionAndImage(imageUrl);
        
        uni.showToast({
          title: '提交成功',
          icon: 'success'
        });
        
        // 清空表单
        this.resetForm();
        
      } catch(err) {
        console.error('提交失败:', err);
        uni.showToast({
          title: '提交失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },

    // 重置表单
    resetForm() {
      this.imageUrl = '';
      this.questionText = '';
      this.tempFilePath = '';
    },

    // 提交问题和图片URL到服务器
    async submitQuestionAndImage(imageUrl, deviceId = '123456') {
      try {
        const res = await request({
          url: '/photograph/api/save_photo',
          method: 'POST',
          data: {
            photoUrl: imageUrl,
            question: this.questionText,
            uploadTime: new Date().toISOString(),
            fileName: this.ossData.key,
            deviceId: deviceId,
          }
        });
        
        if (!res.data.success) {
          throw new Error('保存信息失败');
        }
        
        return res.data;
      } catch (err) {
        console.error('提交到服务器失败:', err);
        throw err;
      }
    },

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
        const originalFileName = filePath.split('/').pop();
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
            success: (res) => {
              if (res.statusCode === 200) {
                const imageUrl = `https://photograph-bucket.oss-cn-beijing.aliyuncs.com/${fileName}`;
                resolve(imageUrl);
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
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF6E5 0%, #FFF0F0 100%);
  padding: 0 0 40px 0;
}

.header {
  padding: 44px 16px 10px;
  text-align: center;
  background: transparent;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #4B5563;
}

.image-section {
  margin: 20px;
  border-radius: 12px;
  overflow: hidden;
}

.image-picker {
  height: 200px;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #DDD;
  border-radius: 12px;
}

.picker-text {
  margin-top: 12px;
  color: #999;
  font-size: 14px;
}

.preview {
  position: relative;
  width: 100%;
  height: 200px;
  background: #FFF;
  border-radius: 12px;
}

.preview image {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}

.delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 50%;
}

.question-section {
  margin: 20px;
}

.question-input {
  width: 100%;
  height: 120px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  padding: 12px;
  font-size: 16px;
  box-sizing: border-box;
}

.word-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.preset-questions {
  margin-top: 20px;
}

.section-title {
  font-size: 16px;
  color: #666;
  margin-bottom: 12px;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.question-tag {
  background: rgba(255, 255, 255, 0.6);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
}

.submit-btn {
  width: 90%;
  height: 44px;
  line-height: 44px;
  background: #4CAF50;
  color: white;
  border-radius: 22px;
  font-size: 16px;
  margin-top: 30px;
}

.submit-btn-disabled {
  background: #CCCCCC;
  color: #FFFFFF;
}
</style>