<template>
  <view class="poetry-creation">
    <!-- 顶部导航栏 -->
    <uni-nav-bar
      left-icon="left"
      @clickLeft="handleBack"
      title="诗歌创作"
      :border="false"
      status-bar
      fixed
    />
    
    <!-- 主体内容，使用steps组件来显示创作步骤 -->
    <view class="content">
      <view class="steps-container">
        <uni-steps
          :options="steps"
          :active="currentStep"
          direction="column"
          activeColor="#FF9500"
        />
      </view>
      
      <!-- 步骤1：上传图片 -->
      <view v-if="currentStep === 0" class="step-content">
        <view class="upload-section">
          <view class="upload-box" @tap="chooseImage" v-if="!imageUrl">
            <uni-icons type="camera-filled" size="48" color="#666"></uni-icons>
            <text>点击上传图片</text>
          </view>
          <view v-else class="image-preview-container">
            <image :src="imageUrl" mode="aspectFit" class="preview-image" />
            <button class="reupload-btn" @tap="chooseImage">重新上传</button>
          </view>
          <button 
            class="analyze-btn" 
            :disabled="!imageUrl"
            @tap="analyzeImage"
          >开始分析</button>
        </view>
      </view>
      
      <!-- 步骤2：选择标签和体裁 -->
      <view v-if="currentStep === 1" class="step-content">
        <view class="section-title">选择关键词</view>
        <view class="tags-container">
          <view 
            v-for="(tag, index) in keywords" 
            :key="index"
            :class="['tag', selectedTags.includes(tag) ? 'tag-selected' : '']"
            @tap="toggleTag(tag)"
          >{{ tag }}</view>
        </view>
        
        <view class="section-title">选择诗歌体裁</view>
        <view class="style-container">
          <view 
            v-for="(style, index) in poetryStyles" 
            :key="index"
            :class="['style-item', selectedStyle === style ? 'style-selected' : '']"
            @tap="selectStyle(style)"
          >{{ style }}</view>
        </view>
        
        <button 
          class="create-btn" 
          :disabled="!canCreate"
          @tap="createPoem"
        >生成诗歌</button>
      </view>
      
      <!-- 步骤3：展示结果 -->
      <view v-if="currentStep === 2" class="step-content">
        <view class="poem-display">
          <text class="poem-text">{{ generatedPoem }}</text>
        </view>
        
        <view class="action-buttons">
          <button @tap="copyPoem" class="action-btn">复制诗歌</button>
          <button @tap="shareCard" class="action-btn">生成分享卡片</button>
          <button @tap="restart" class="action-btn">重新创作</button>
          <button @tap="goHome" class="action-btn">返回首页</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { analyzeImage, createPoem } from '@/utils/ai-service'

export default {
  data() {
    return {
      steps: [
        { title: '上传图片' },
        { title: '选择标签' },
        { title: '生成诗歌' }
      ],
      currentStep: 0,
      imageUrl: '',
      keywords: [],
      selectedTags: [],
      poetryStyles: ['唐诗', '宋词', '元曲', '现代诗', '藏头诗'],
      selectedStyle: '',
      generatedPoem: ''
    }
  },
  
  computed: {
    canCreate() {
      return this.selectedTags.length > 0 && this.selectedStyle
    }
  },
  
  methods: {
    handleBack() {
      if (this.currentStep > 0) {
        this.currentStep--
      } else {
        uni.navigateBack()
      }
    },
    
    async chooseImage() {
      try {
        const { tempFilePaths } = await new Promise((resolve, reject) => {
          uni.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: resolve,
            fail: reject
          });
        });
        
        if (tempFilePaths && tempFilePaths.length > 0) {
          this.imageUrl = tempFilePaths[0];
        }
      } catch (error) {
        uni.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    },
    
    async analyzeImage() {
      try {
        uni.showLoading({ title: '分析中...' });
        const result = await analyzeImage(this.imageUrl);
        
        if (result && result.status === 'success') {
          this.keywords = result.keywords;
          this.currentStep = 1;
        } else {
          throw new Error(result?.message || '未能识别图片特征');
        }
      } catch (error) {
        console.error('分析失败:', error);
        uni.showToast({
          title: error.message || '分析失败，请重试',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    toggleTag(tag) {
      const index = this.selectedTags.indexOf(tag)
      if (index > -1) {
        this.selectedTags.splice(index, 1)
      } else {
        this.selectedTags.push(tag)
      }
    },
    
    selectStyle(style) {
      this.selectedStyle = style
    },
    
    async createPoem() {
      try {
        uni.showLoading({ title: '创作中...' });
        const result = await createPoem(this.selectedTags, this.selectedStyle);
        
        if (result && result.status === 'success') {
          this.generatedPoem = result.poem;
          this.currentStep = 2;
        } else {
          throw new Error(result?.message || '未能生成诗歌');
        }
      } catch (error) {
        console.error('创作失败:', error);
        uni.showToast({
          title: error.message || '创作失败，请重试',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    copyPoem() {
      uni.setClipboardData({
        data: this.generatedPoem,
        success: () => {
          uni.showToast({
            title: '复制成功'
          })
        }
      })
    },
    
    shareCard() {
      // TODO: 实现分享卡片功能
    },
    
    restart() {
      this.currentStep = 0
      this.imageUrl = ''
      this.keywords = []
      this.selectedTags = []
      this.selectedStyle = ''
      this.generatedPoem = ''
    },
    
    goHome() {
      uni.navigateBack({
        delta: 1
      })
    }
  }
}
</script>

<style lang="scss">
.poetry-creation {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF5E7 0%, #FFFFFF 100%);
  
  :deep(.uni-nav-bar) {
    background: transparent !important;
    
    .uni-nav-bar__text {
      font-size: 32rpx;
      font-weight: 500;
      color: #222222;
    }
    
    .uni-nav-bar__header {
      padding: 0 30rpx;
    }
    
    .uni-nav-bar__left-icon {
      color: #222222;
    }
  }
  
  .content {
    padding: 180rpx 30rpx 30rpx;
  }
  
  .step-content {
    margin-top: 40rpx;
  }
  
  .upload-box {
    width: 100%;
    height: 400rpx;
    border: 2rpx dashed #ddd;
    border-radius: 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fff;
    
    text {
      margin-top: 20rpx;
      color: #666;
      font-size: 28rpx;
    }
  }
  
  .preview-image {
    width: 100%;
    height: 400rpx;
    border-radius: 16rpx;
  }
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    margin: 40rpx 0 20rpx;
  }
  
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }
  
  .tag {
    padding: 16rpx 32rpx;
    background: #f5f5f5;
    border-radius: 100rpx;
    font-size: 28rpx;
    color: #333;
    
    &.tag-selected {
      background: #007AFF;
      color: #fff;
    }
  }
  
  .style-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }
  
  .style-item {
    padding: 16rpx 32rpx;
    background: #f5f5f5;
    border-radius: 100rpx;
    font-size: 28rpx;
    color: #333;
    
    &.style-selected {
      background: #007AFF;
      color: #fff;
    }
  }
  
  .analyze-btn,
  .create-btn {
    margin-top: 40rpx;
    width: 100%;
    background: #007AFF;
    color: #fff;
    border-radius: 100rpx;
    font-size: 32rpx;
    font-weight: 500;
    
    &:disabled {
      background: #ccc;
    }
  }
  
  .poem-display {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    padding: 40rpx;
    border-radius: 24rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  }
  
  .poem-text {
    font-size: 32rpx;
    line-height: 1.8;
    white-space: pre-wrap;
  }
  
  .action-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
  }
  
  .action-btn {
    background: #f5f5f5;
    color: #333;
    border-radius: 100rpx;
    font-size: 28rpx;
    font-weight: 500;
    
    &:active {
      opacity: 0.8;
    }
  }
}

.image-preview-container {
  position: relative;
  width: 100%;
  
  .reupload-btn {
    position: absolute;
    right: 20rpx;
    bottom: 20rpx;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 24rpx;
    padding: 10rpx 20rpx;
    border-radius: 30rpx;
    border: none;
  }
}

.steps-container {
  margin: 30rpx 0;
  padding: 20rpx;
  
  :deep(.uni-steps) {
    .uni-steps__column-title {
      font-size: 32rpx;
      font-weight: 600;
    }
    
    .uni-steps__column-circle {
      width: 40rpx;
      height: 40rpx;
    }
    
    .uni-steps__column-line {
      background-color: #ddd;
      height: 4rpx;
    }
    
    .uni-steps__column-container {
      margin-bottom: 30rpx;
    }
  }
}
</style> 