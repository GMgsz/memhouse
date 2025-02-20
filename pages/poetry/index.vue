<template>
  <view 
    class="poetry-creation" 
    v-show="isPageShowing && !isTransitioning"
  >
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="header-content">
        <view class="header-left" @tap="goBack">
          <uni-icons type="back" size="24" color="#333"/>
        </view>
        <view class="header-center">
          <text class="title">诗歌创作</text>
        </view>
        <view class="header-right"></view>
      </view>
    </view>
    
    <!-- 主体内容 -->
    <view class="content">
      <!-- 步骤条 -->
      <view class="steps-container">
        <uni-steps
          :options="steps"
          :active="currentStep"
          direction="row"
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
          <text class="poem-text" user-select>{{ generatedPoem }}</text>
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
  <canvas 
    id="shareCanvas"
    canvas-id="shareCanvas" 
    :style="{
      width: '600px',
      height: canvasHeight + 'px',
      position: 'fixed',
      left: '-9999px',
      visibility: 'hidden'
    }"
  />
  
  <!-- 分享卡片预览弹窗 -->
  <view 
    class="share-preview-mask"
    v-if="showSharePreview"
    @tap="closeSharePreview"
  >
    <view 
      class="share-preview-content"
      @tap.stop
    >
      <view class="preview-header">
        <text class="preview-title">分享卡片预览</text>
        <view 
          class="preview-close"
          @tap="closeSharePreview"
        >
          <uni-icons type="close" size="24" color="#333"/>
        </view>
      </view>
      
      <view class="preview-content">
        <image 
          v-if="shareImagePath"
          :src="shareImagePath" 
          mode="widthFix"
          class="preview-image"
        />
      </view>
      
      <view class="preview-actions">
        <button 
          class="preview-btn save-btn"
          @tap="saveToAlbum"
        >保存到相册</button>
      </view>
    </view>
  </view>
</template>

<script>
import { analyzeImage, createPoem } from '@/utils/ai-service'

export default {
  data() {
    return {
      statusBarHeight: 0,
      steps: [
        { title: '上传图片' },
        { title: '选择标签' },
        { title: '生成诗歌' }
      ],
      currentStep: 0,
      imageUrl: '',
      keywords: [],
      selectedTags: [],
      poetryStyles: ['唐诗', '宋词', '元曲', '现代诗'],
      selectedStyle: '',
      generatedPoem: '',
      isDirectEntry: false,
      isPageShowing: true,
      isTransitioning: false,
      showSharePreview: false,
      shareImagePath: '',
      canvasHeight: 900,
    }
  },
  
  computed: {
    canCreate() {
      return this.selectedTags.length > 0 && this.selectedStyle
    }
  },
  
  onLoad() {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight
    
    // 检查页面栈
    const pages = getCurrentPages()
    if (pages.length === 1) {
      // 如果直接打开本页面，添加一个标记
      this.isDirectEntry = true
    }
  },
  
  onShow() {
    this.isPageShowing = true
  },
  
  onHide() {
    this.isPageShowing = false
  },
  
  onUnload() {
    this.isPageShowing = false
  },
  
  // 添加页面切换步骤的控制
  watch: {
    currentStep(newVal) {
      // 步骤切换时，确保页面内容正确显示
      this.$nextTick(() => {
        this.isPageShowing = true
      })
    }
  },
  
  methods: {
    goBack() {
      if (this.currentStep > 0) {
        // 如果不是第一步，返回上一步
        this.currentStep--
        
        // 如果返回到第一步，清空关键词和选择
        if (this.currentStep === 0) {
          this.keywords = []
          this.selectedTags = []
          this.selectedStyle = ''
        }
      } else {
        // 如果是第一步，才判断是否返回首页
        const pages = getCurrentPages()
        if (pages.length === 1) {
          uni.switchTab({
            url: '/pages/index/index'
          })
        } else {
          uni.navigateBack()
        }
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
    
    formatPoem(poem) {
      if (!poem) return ''
      
      // 修改格式化方法，减少空行
      let formatted = poem
        // 在句号和逗号后添加换行
        .replace(/([，。])/g, '$1\n')
        // 删除多余的换行
        .replace(/\n+/g, '\n')
        // 删除行首和行尾的空白
        .trim();
      
      return formatted; // 移除了额外添加空行的处理
    },
    
    async createPoem() {
      try {
        this.isTransitioning = true;
        uni.showLoading({ title: '创作中...' });
        const result = await createPoem(this.selectedTags, this.selectedStyle);
        
        if (result && result.status === 'success') {
          this.generatedPoem = this.formatPoem(result.poem);
          this.$nextTick(() => {
            this.currentStep = 2;
            setTimeout(() => {
              this.isTransitioning = false;
            }, 100);
          });
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
        this.isTransitioning = false;
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
    
    async shareCard() {
      try {
        uni.showLoading({ title: '生成中...' });
        
        const ctx = uni.createCanvasContext('shareCanvas', this);
        const canvasWidth = 600;
        
        // 计算诗歌需要的高度
        const poemLines = this.generatedPoem.split('\n');
        const lineHeight = 70; // 行高
        const poemStartY = 420; // 诗歌起始y坐标
        const footerHeight = 120; // 底部装饰和名称的高度
        const bottomPadding = 80; // 底部额外留白
        
        // 计算诗歌实际需要的总高度
        const poemHeight = poemLines.length * lineHeight;
        // 计算画布需要的最小高度 = 诗歌起始位置 + 诗歌高度 + 底部装饰区域 + 底部边距
        const minHeight = poemStartY + poemHeight + footerHeight + bottomPadding;
        
        // 更新画布高度
        this.canvasHeight = Math.max(900, minHeight);
        
        // 等待视图更新
        await this.$nextTick();
        
        // 绘制背景
        ctx.setFillStyle('#FFF5E7');
        ctx.fillRect(0, 0, canvasWidth, this.canvasHeight);
        
        // 绘制图片白色背景
        ctx.setFillStyle('#FFFFFF');
        ctx.fillRect(40, 40, 520, 320);
        
        // 加载并绘制图片
        await new Promise((resolve, reject) => {
          ctx.drawImage(this.imageUrl, 50, 50, 500, 300);
          ctx.draw(true, resolve);
        });
        
        // 设置诗歌文字样式
        ctx.setFillStyle('#333333');
        ctx.setFontSize(36);
        ctx.setTextAlign('center');
        ctx.font = '36px KaiTi';
        
        // 绘制诗歌文本
        let y = poemStartY;
        poemLines.forEach(line => {
          ctx.fillText(line, canvasWidth / 2, y);
          y += lineHeight;
        });
        
        // 绘制底部装饰和小程序名称
        const footerY = this.canvasHeight - footerHeight + 40; // 调整底部位置
        ctx.setFillStyle('#FF9500');
        ctx.fillRect(50, footerY, 500, 2);
        
        ctx.setFontSize(24);
        ctx.setFillStyle('#666666');
        ctx.fillText('AI诗歌创作', canvasWidth / 2, footerY + 40);
        
        // 完成绘制
        ctx.draw(true);
        
        // 等待绘制完成后转换为图片路径
        setTimeout(async () => {
          try {
            const res = await new Promise((resolve, reject) => {
              uni.canvasToTempFilePath({
                canvasId: 'shareCanvas',
                width: canvasWidth,
                height: this.canvasHeight, // 使用计算后的高度
                destWidth: canvasWidth * 2, // 2倍分辨率，提高清晰度
                destHeight: this.canvasHeight * 2,
                success: resolve,
                fail: reject
              }, this);
            });
            
            this.shareImagePath = res.tempFilePath;
            this.showSharePreview = true;
            uni.hideLoading();
            
          } catch (error) {
            uni.hideLoading();
            uni.showToast({
              title: '生成失败',
              icon: 'none'
            });
          }
        }, 300); // 增加等待时间，确保绘制完成
        
      } catch (error) {
        uni.hideLoading();
        uni.showToast({
          title: '生成失败',
          icon: 'none'
        });
      }
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
      const pages = getCurrentPages()
      if (this.isDirectEntry || pages.length === 1) {
        // 如果是直接打开的页面或者只有一个页面，使用 redirectTo
        uni.redirectTo({
          url: '/pages/index/index'
        })
      } else {
        // 如果有多个页面，使用 navigateBack
        uni.navigateBack({
          delta: pages.length - 1 // 返回到首页
        })
      }
    },
    
    closeSharePreview() {
      this.showSharePreview = false;
      this.shareImagePath = '';
    },
    
    async saveToAlbum() {
      try {
        uni.showLoading({ title: '保存中...' });
        
        await new Promise((resolve, reject) => {
          uni.saveImageToPhotosAlbum({
            filePath: this.shareImagePath,
            success: resolve,
            fail: reject
          });
        });
        
        uni.hideLoading();
        uni.showToast({
          title: '已保存到相册',
          icon: 'success'
        });
        
        // 关闭预览
        this.closeSharePreview();
        
      } catch (error) {
        uni.hideLoading();
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    }
  }
}
</script>

<style lang="scss">
.poetry-creation {
  min-height: 100vh;
  background: #FFF5E7;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
  
  .header {
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;
    background-color: #FFF5E7;
    
    .status-bar {
      width: 100%;
      background-color: #FFF5E7;
    }
    
    .header-content {
      position: relative;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 15px;
      
      .header-left {
        position: relative;
        z-index: 1;
        height: 44px;
        display: flex;
        align-items: center;
      }
      
      .header-center {
        position: absolute;
        left: 0;
        right: 0;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .title {
          font-size: 18px;
          font-weight: 600;
          color: #4B5563;
        }
      }
      
      .header-right {
        width: 24px; // 保持左右对称
      }
    }
  }
  
  .content {
    padding-top: calc(44px + var(--status-bar-height));
    padding-left: 30rpx;
    padding-right: 30rpx;
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 30rpx;
    
    .steps-container {
      margin: 40rpx 0;
      
      :deep(.uni-steps) {
        .uni-steps__column-title {
          font-size: 36rpx;
          font-weight: 600;
          color: #333;
          margin-top: 16rpx;
        }
        
        .uni-steps__column-circle {
          width: 56rpx;
          height: 56rpx;
        }
        
        .uni-steps__column-line {
          background-color: #ddd;
          height: 4px;
          margin-top: 28rpx;
        }
        
        .uni-steps__column-circle-active {
          width: 56rpx;
          height: 56rpx;
          background-color: #FF9500;
        }
      }
    }
  }
  
  .step-content {
    margin: 30rpx 0;
    
    &:last-child {
      min-height: calc(100vh - 44px - var(--status-bar-height) - 140rpx);
      display: flex;
      flex-direction: column;
      
      .poem-display {
        flex: 1;
        margin-bottom: 30rpx;
      }
      
      .action-buttons {
        margin-top: auto;
        position: relative;
        z-index: 2;
        background: #FFF5E7;
        padding-top: 20rpx;
      }
    }
  }
  
  .upload-box {
    margin: 30rpx 0;
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
    border-radius: 12rpx;
    object-fit: contain;
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
      background: #FF9500;
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
      background: #FF9500;
      color: #fff;
    }
  }
  
  .analyze-btn,
  .create-btn {
    margin-top: 40rpx;
    width: 100%;
    background: #FF9500;
    color: #fff;
    border-radius: 100rpx;
    font-size: 32rpx;
    font-weight: 500;
    
    &:disabled {
      background: #ccc;
    }
    
    &:active {
      opacity: 0.9;
    }
  }
  
  .poem-display {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    padding: 80rpx 40rpx;
    border-radius: 24rpx;
    box-shadow: 0 4rpx 30rpx rgba(0, 0, 0, 0.08);
    margin: 30rpx 0;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 500rpx;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6rpx;
      background: linear-gradient(90deg, #FF9500, #FFB700);
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 6rpx;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: linear-gradient(rgba(255, 149, 0, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 149, 0, 0.03) 1px, transparent 1px);
      background-size: 20px 20px;
      z-index: 0;
    }
  }
  
  .poem-text {
    font-size: 48rpx;
    line-height: 1.8;
    white-space: pre-wrap;
    font-family: "楷体", "KaiTi", "STKaiti", serif;
    text-align: center;
    color: #333;
    position: relative;
    z-index: 1;
    width: 100%;
    padding: 0 40rpx;
    
    display: block;
    margin: 0 auto;
  }
  
  .action-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
    margin: 30rpx 0;
    padding: 0;
  }
  
  .action-btn {
    height: 96rpx;
    line-height: 96rpx;
    background: #fff;
    color: #333;
    border-radius: 100rpx;
    font-size: 32rpx;
    font-weight: 500;
    border: 2rpx solid #eee;
    transition: all 0.2s ease;
    
    &:active {
      background-color: #FF9500 !important;
      border-color: #FF9500;
      opacity: 0.9;
      transform: scale(0.98);
    }
  }
}

.image-preview-container {
  position: relative;
  width: 100%;
  margin: 30rpx 0;
  padding: 20rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  
  .reupload-btn {
    margin-top: 20rpx;
    width: 100%;
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    background: #f5f5f5;
    color: #333;
    font-size: 28rpx;
    border-radius: 100rpx;
    border: none;
    
    &:active {
      opacity: 0.8;
    }
  }
}

.steps-container {
  margin: 30rpx 0;
  padding: 20rpx;
  
  :deep(.uni-steps) {
    .uni-steps__column-title {
      font-size: 28rpx;
      font-weight: 500;
    }
    
    .uni-steps__column-circle {
      width: 36rpx;
      height: 36rpx;
    }
    
    .uni-steps__column-line {
      background-color: #ddd;
      height: 4rpx;
    }
    
    .uni-steps__column-container {
      margin-bottom: 20rpx;
    }
  }
}

.transitioning {
  transition: all 0.3s ease;
}

.share-preview-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 180rpx;
  
  .share-preview-content {
    width: 80%;
    max-width: 600rpx;
    max-height: calc(90vh - 180rpx);
    background: #fff;
    border-radius: 24rpx;
    display: flex;
    flex-direction: column;
    
    .preview-header {
      padding: 30rpx 30rpx 20rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff;
      border-radius: 24rpx 24rpx 0 0;
      position: sticky;
      top: 0;
      z-index: 10;
      
      .preview-title {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
      }
      
      .preview-close {
        padding: 10rpx;
      }
    }
    
    .preview-content {
      flex: 1;
      overflow-y: auto;
      padding: 0 30rpx;
      -webkit-overflow-scrolling: touch;
      
      .preview-image {
        width: 100%;
        border-radius: 12rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
      }
    }
    
    .preview-actions {
      padding: 20rpx 30rpx 30rpx;
      background: #fff;
      border-radius: 0 0 24rpx 24rpx;
      position: sticky;
      bottom: 0;
      z-index: 10;
      
      .preview-btn {
        width: 100%;
        height: 88rpx;
        line-height: 88rpx;
        border-radius: 44rpx;
        font-size: 32rpx;
        
        &.save-btn {
          background: #FF9500;
          color: #fff;
          
          &:active {
            opacity: 0.9;
          }
        }
      }
    }
  }
}
</style> 