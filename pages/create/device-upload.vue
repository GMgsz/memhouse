<!-- V2.0测试 小程序端通过服务器中转图片 -->

<template>
  <!-- 保持与oss-test.vue相同的模板结构 -->
  <view class="container">
    <view class="header">
      <text class="title">图片与问题上传</text>
    </view>

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

    <view class="question-section">
      <textarea
        class="question-input"
        v-model="questionText"
        placeholder="请输入您的问题描述..."
        maxlength="200"
      />
      <text class="word-count">{{questionText.length}}/200</text>
      
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
      imageUrl: '',
      questionText: '',
      presetQuestions: [
        '这张照片是什么时候拍的？',
        '照片中的人物是谁？',
        '这是在哪里拍摄的？',
        '有什么特别的回忆吗？'
      ],
      tempFilePath: '',
      originalFileName: ''
    };
  },
  
  computed: {
    canSubmit() {
      return this.imageUrl && this.questionText.trim().length > 0;
    }
  },

  methods: {
    async chooseImage() {
      try {
        const { tempFilePaths, tempFiles } = await uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        });
        
        // 保存文件信息
        this.tempFilePath = tempFilePaths[0];
        this.imageUrl = tempFilePaths[0];
        // 保存原始文件名，用于获取扩展名
        this.originalFileName = tempFiles[0].name || tempFilePaths[0].split('/').pop();
      } catch(err) {
        console.error('选择图片失败:', err);
        uni.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    },

    deleteImage() {
      this.imageUrl = '';
      this.tempFilePath = '';
    },

    selectQuestion(question) {
      this.questionText = question;
    },

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

        uni.showLoading({ title: '上传中...' });
        
        // 直接上传图片和问题到服务器
        await this.uploadToServer();
        
        uni.showToast({
          title: '提交成功',
          icon: 'success'
        });
        
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

    resetForm() {
      this.imageUrl = '';
      this.questionText = '';
      this.tempFilePath = '';
    },

    async checkDevice(deviceId = '123456') {
      try {
        const res = await request.request({
          url: '/photograph/api/check_device',
          method: 'GET',
          data: {
            deviceId: deviceId
          }
        });
        
        return res.data;
      } catch (err) {
        console.error('检查设备状态失败:', err);
        throw err;
      }
    },

    async uploadToServer(deviceId = '123456') {
      try {
        // 构建一个合适的文件名
        const timestamp = new Date().getTime();
        const extension = this.originalFileName.split('.').pop() || 'jpg'; // 获取文件扩展名，默认jpg
        const fileName = `photo_${timestamp}.${extension}`;

        const res = await request.uploadFile({
          url: '/photograph/api/upload_photo',
          filePath: this.tempFilePath,
          name: 'photo',
          header: {
            'Content-Type': 'multipart/form-data'
          },
          formData: {
            question: this.questionText,
            deviceId: deviceId,
            fileName: fileName // 添加文件名
          }
        });

        console.log('上传响应:', res);
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              return data;
            } else {
              console.error('服务器返回错误:', data);
              throw new Error(data.message || '上传失败');
            }
          } catch (error) {
            console.error('解析响应数据失败:', error, res.data);
            throw new Error('解析响应数据失败');
          }
        } else {
          console.error('HTTP状态码错误:', res.statusCode);
          throw new Error(`上传失败: ${res.statusCode}`);
        }
      } catch (err) {
        console.error('上传请求失败:', err);
        throw err;
      }
    }
  }
};
</script>

<style>
/* 保持与oss-test.vue完全相同的样式 */
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