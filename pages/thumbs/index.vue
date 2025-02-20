<template>
  <view class="thumbs-container">
    <!-- 按日期分组显示缩略图 -->
    <view v-for="(group, date) in groupedThumbs" :key="date" class="date-group">
      <!-- 日期标题 -->
      <view class="date-header">
        {{ formatDate(date) }}
      </view>
      
      <!-- 该日期下的缩略图网格 -->
      <view class="thumbs-grid">
        <view class="thumb-item" v-for="item in group" :key="item.thumbId">
          <image 
            class="thumb-image" 
            :src="item.signedUrl"
            mode="aspectFill"
            lazy-load
            @error="handleImageError(item.thumbId)"
            @load="handleImageLoad(item.thumbId)"
            @click="handlePreviewImage(item)"
          />
        </view>
      </view>
    </view>
    
    <!-- 加载更多提示 -->
    <view class="loading-more">
      <uni-load-more :status="loadingStatus" />
    </view>
  </view>
</template>

<script>
import requestUtil from '@/utils/request.js'

export default {
  data() {
    return {
      thumbsList: [],
      current: 1,
      size: 10,
      isLoading: false,
      hasMore: true,
      loadingStatus: 'more',
      deviceId: '123456',
      total: 0,
      pages: 0,  // 添加总页数记录
      stsCredentials: null,
      previewLoading: false, // 新增：预览加载状态
      app: null // 添加app引用
    }
  },
  
  computed: {
    // 按日期分组的缩略图数据
    groupedThumbs() {
      const groups = {}
      this.thumbsList.forEach(thumb => {
        const date = this.getDateString(thumb.uploadTime)
        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(thumb)
      })
      // 按日期倒序排序
      return Object.fromEntries(
        Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]))
      )
    }
  },
  
  async onLoad() {
    this.app = getApp()
    await this.ensureValidSts()
    this.initLoad()
  },
  
  // 监听页面滚动到底部
  onReachBottom() {
    console.log('触发底部加载') // 调试是否触发了底部加载
    this.loadMore()
  },
  
  methods: {
    // 确保有有效的 STS 凭证
    async ensureValidSts() {
      try {
        const app = getApp()
        this.stsCredentials = await app.getValidStsCredentials()
      } catch (error) {
        console.error('获取STS凭证失败:', error)
        uni.showToast({
          title: '获取访问凭证失败',
          icon: 'none'
        })
      }
    },
    
    // 处理缩略图数据，添加签名URL
    async processThumbsData(records) {
      const processedRecords = []
      for (const record of records) {
        try {
          // 从完整URL中提取objectKey
          const objectKey = record.thumbOssPath.replace('https://photograph-bucket.oss-cn-beijing.aliyuncs.com/', '')
          // 获取签名URL
          const signedUrl = await this.app.getOssUrl(objectKey)
          processedRecords.push({
            ...record,
            signedUrl
          })
        } catch (error) {
          console.error('处理缩略图URL失败:', error, record)
          // 如果获取签名URL失败，使用原始URL
          processedRecords.push({
            ...record,
            signedUrl: record.thumbOssPath
          })
        }
      }
      return processedRecords
    },
    
    async loadThumbsData() {
      if (this.isLoading) return
      
      try {
        await this.ensureValidSts()
        this.isLoading = true
        this.loadingStatus = 'loading'
        
        const res = await requestUtil.request({
          url: `/photograph/thumbs/device/${this.deviceId}/page`,
          method: 'GET',
          data: {
            current: this.current,
            size: this.size
          }
        })
        
        if (res.data?.data) {
          const { records, total, pages, current } = res.data.data
          
          if (records && records.length > 0) {
            // 处理缩略图数据，添加签名URL
            const processedRecords = await this.processThumbsData(records)
            
            if (this.current === 1) {
              this.thumbsList = processedRecords
            } else {
              const newData = processedRecords.filter(newItem => 
                !this.thumbsList.some(existingItem => 
                  existingItem.thumbId === newItem.thumbId
                )
              )
              this.thumbsList = [...this.thumbsList, ...newData]
            }
            
            this.total = total
            this.pages = pages
            this.hasMore = this.current < pages
            this.loadingStatus = this.hasMore ? 'more' : 'noMore'
          } else {
            this.hasMore = false
            this.loadingStatus = 'noMore'
          }
        }
      } catch (error) {
        console.error('加载失败:', error)
        this.loadingStatus = 'more'
        
        if (error.message?.includes('AccessDenied')) {
          await this.app.updateStsCredentials()
          return this.loadThumbsData()
        }
      } finally {
        this.isLoading = false
      }
    },
    
    loadMore() {
      if (!this.hasMore || this.isLoading) {
        console.log('无法加载更多:', {
          hasMore: this.hasMore,
          isLoading: this.isLoading,
          currentPage: this.current,
          totalLoaded: this.thumbsList.length,
          total: this.total
        });
        return;
      }
      
      // 确保页码递增
      this.current++;
      console.log('开始加载下一页:', this.current);
      this.loadThumbsData();
    },
    
    // 重置加载状态
    resetLoadState() {
      this.current = 1
      this.thumbsList = []
      this.hasMore = true
      this.loadingStatus = 'more'
      this.total = 0
    },
    
    // 初始化数据加载
    initLoad() {
      this.resetLoadState()
      this.loadThumbsData()
    },
    
    // 获取日期字符串
    getDateString(dateStr) {
      try {
        // 处理 iOS 的日期兼容性问题
        const date = dateStr.replace(/-/g, '/');
        return new Date(date).toISOString().split('T')[0];
      } catch (error) {
        console.error('日期格式化错误:', dateStr, error);
        return dateStr;
      }
    },
    
    // 格式化日期显示
    formatDate(dateStr) {
      try {
        // 处理 iOS 的日期兼容性问题
        const date = new Date(dateStr.replace(/-/g, '/'));
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
        
        return `${year}年${month}月${day}日 星期${weekDay}`;
      } catch (error) {
        console.error('日期显示格式化错误:', dateStr, error);
        return dateStr;
      }
    },
    
    handleImageError(thumbId) {
      console.error(`图片加载失败，ID: ${thumbId}`)
    },
    
    handleImageLoad(thumbId) {
      console.log(`图片加载成功，ID: ${thumbId}`)
    },
    
    // 修改预览图处理方法
    async handlePreviewImage(thumbInfo) {
      if (this.previewLoading) return
      
      try {
        this.previewLoading = true
        uni.showLoading({ title: '加载中...' })
        
        const res = await requestUtil.request({
          url: '/photograph/api/preview_image',
          method: 'POST',
          params: { deviceId: this.deviceId },
          data: thumbInfo
        })
        
        if (res.data?.success) {
          const previewUrl = res.data.data.previewUrl
          // 从OSS URL中提取objectKey
          const objectKey = previewUrl.split('.com/')[1]
          // 获取签名URL
          const signedUrl = await this.app.getOssUrl(objectKey)
          
          uni.previewImage({
            urls: [signedUrl],
            current: 0,
            success: () => console.log('预览成功'),
            fail: (err) => {
              console.error('预览失败:', err)
              uni.showToast({
                title: '预览失败',
                icon: 'none'
              })
            }
          })
        } else {
          throw new Error(res.data?.message || '获取预览图失败')
        }
      } catch (error) {
        console.error('预览图片失败:', error)
        uni.showToast({
          title: '获取预览图失败',
          icon: 'none'
        })
      } finally {
        this.previewLoading = false
        uni.hideLoading()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.thumbs-container {
  padding: 10rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.date-group {
  margin-bottom: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}

.date-header {
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
  background-color: #f8f8f8;
  border-bottom: 1rpx solid #eee;
}

.thumbs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10rpx;
  padding: 10rpx;
}

.thumb-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: 8rpx;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
  cursor: pointer; // 添加鼠标手型
  transition: opacity 0.2s; // 添加过渡效果
  
  &:active {
    opacity: 0.8; // 点击时的视觉反馈
  }
}

.thumb-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-more {
  padding: 20rpx 0;
  text-align: center;
}
</style> 