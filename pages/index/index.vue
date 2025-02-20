<template>
  <view class="container background-gradient">
    <!-- 侧边菜单 -->
    <view class="side-menu" :style="{ left: isMenuOpen ? '0' : '-100%' }">
      <view class="menu-header">
        <view class="close-btn" @tap="toggleMenu">
          <uni-icons type="bars" size="24" color="#333"/>
        </view>
      </view>
      <view class="menu-content">
        <view class="menu-items">
          <view 
            class="menu-item" 
            v-for="(item, index) in menuItems" 
            :key="index" 
            @tap="navigateToPage(item)"
          >
            <uni-icons :type="item.icon" size="24" color="#4B5563"/>
            <text class="menu-text">{{ item.name }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 遮罩层 -->
    <view 
      class="mask" 
      v-if="isMenuOpen" 
      @tap="closeMenu"
      @touchmove.prevent.stop
    ></view>

    <!-- 主要内容区域 -->
    <view class="main-content">
      <!-- 固定部分 -->
      <view class="fixed-content">
        <!-- 顶部导航栏 -->
        <view class="header">
          <view class="header-left" @tap="toggleMenu">
            <uni-icons type="bars" size="24" color="#333"/>
          </view>
          <text class="title">记忆暖房</text>
          <view class="header-right"></view>
        </view>

        <!-- 日期显示区域 -->
        <view class="date-section">
          <text class="date">{{ currentDate }}</text>
          <text class="accompany">已陪伴您度过{{ days }}天</text>
        </view>

        <!-- IP形象区域 -->
        <view class="ip-section" @click="changeIpStatus">
          <image :src="currentIp.image" mode="aspectFit" class="ip-image"></image>
          <view class="mood-container">
            <text class="mood">{{ currentIp.mood }}</text>
            <text class="mood-desc">{{ currentIp.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 可滚动部分 -->
      <view class="scrollable-content">
        <view class="divider"></view>
        <scroll-view 
          scroll-y 
          class="function-scroll"
          :show-scrollbar="false"
        >
          <view class="function-entries">
            <!-- 诗歌创作 -->
            <view class="entry-item" hover-class="entry-hover" @tap="navigateToPoetry">
              <view class="entry-left">
                <text class="entry-title">诗歌创作</text>
                <text class="entry-desc">记录今日的诗意时光</text>
              </view>
              <view class="entry-icon">
                <uni-icons type="compose" size="28" color="#6B7280"/>
              </view>
            </view>
            
            <!-- 每日训练 -->
            <view class="entry-item" hover-class="entry-hover" @tap="navigateToCreate">
              <view class="entry-left">
                <text class="entry-title">每日训练</text>
                <text class="entry-desc">提升创作的能力</text>
              </view>
              <view class="entry-icon">
                <uni-icons type="paperplane" size="28" color="#6B7280"/>
              </view>
            </view>

            <!-- 智力挑战 -->
            <view class="entry-item" hover-class="entry-hover" @tap="navigateToThumbs">
              <view class="entry-left">
                <text class="entry-title">智力挑战</text>
                <text class="entry-desc">激发思维的火花</text>
              </view>
              <view class="entry-icon">
                <uni-icons type="flag" size="28" color="#6B7280"/>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      scrollHeight: 0,
      currentDate: '',
      days: 0,
      firstLoginDate: null,
      isMenuOpen: false,
      menuItems: [
        { 
          name: '设置', 
          icon: 'gear', 
          path: '/pages/settings/index'
        },
        { 
          name: '全部', 
          icon: 'grid',
          path: '/pages/all/index'
        },
        { 
          name: '数据', 
          icon: 'chart',
          path: '/pages/statistics/index'
        }
      ],
      ipStates: [
        {
          image: '/static/ip.png',
          mood: '今天心情不错呢~',
          desc: '想和主人一起看看窗外的风景'
        },
        {
          image: '/static/ip_happy.png',
          mood: '主人来陪我玩吧！',
          desc: '今天阳光真好呢'
        },
        {
          image: '/static/ip_thinking.png',
          mood: '让我想想今天写什么诗...',
          desc: '灵感正在酝酿中'
        }
      ],
      currentIpIndex: 0
    }
  },
  computed: {
    currentIp() {
      return this.ipStates[this.currentIpIndex]
    }
  },
  onLoad() {
    this.setCurrentDate()
    this.initAccompanyDays()
    this.startDateTimer()
    this.initScrollHeight()
  },
  onUnload() {
    this.clearTimers()
  },
  methods: {
    startDateTimer() {
      // 每分钟更新一次时间
      this.dateTimer = setInterval(() => {
        this.setCurrentDate()
      }, 60000)
    },
    clearTimers() {
      if (this.dateTimer) {
        clearInterval(this.dateTimer)
      }
    },
    toggleMenu() {
      console.log('Toggle menu')
      this.isMenuOpen = !this.isMenuOpen
    },
    closeMenu() {
      console.log('Close menu')
      this.isMenuOpen = false
    },
    initScrollHeight() {
      const systemInfo = uni.getSystemInfoSync()
      // 计算可滚动区域高度：屏幕高度 - 固定内容高度（估算值，需要根据实际调整）
      this.scrollHeight = systemInfo.windowHeight - 580 // 调整这个值以适配实际内容
    },
    handleMenuItem(item) {
      console.log('Menu item clicked:', item.name)
      this.closeMenu()
      // 处理菜单项点击
      switch(item.name) {
        case '设置':
          // 处理设置
          break
        case '全部':
          // 处理全部
          break
        case '数据':
          // 处理数据
          break
      }
    },
    changeIpStatus() {
      this.currentIpIndex = (this.currentIpIndex + 1) % this.ipStates.length
    },
    setCurrentDate() {
      const date = new Date()
      const year = date.getFullYear()
      const month = this.getChineseMonth(date.getMonth())
      const day = date.getDate()
      const weekday = this.getChineseWeekday(date.getDay())
      
      this.currentDate = `${weekday} ${day} ${month} ${year}`
    },
    getChineseWeekday(day) {
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      return weekdays[day]
    },
    getChineseMonth(month) {
      const months = ['一月', '二月', '三月', '四月', '五月', '六月', 
                     '七月', '八月', '九月', '十月', '十一月', '十二月']
      return months[month]
    },
    async initAccompanyDays() {
      try {
        // 获取存储的首次登录时间
        let firstLogin = uni.getStorageSync('firstLoginDate')
        
        if (!firstLogin) {
          // 如果是首次登录，记录当前时间
          firstLogin = new Date().toISOString()
          uni.setStorageSync('firstLoginDate', firstLogin)
        }
        
        // 计算陪伴天数
        const startDate = new Date(firstLogin)
        const today = new Date()
        const diffTime = Math.abs(today - startDate)
        this.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      } catch (e) {
        console.error('初始化陪伴天数失败:', e)
        this.days = 0
      }
    },
    navigateToPoetry() {
      uni.navigateTo({
        url: '/pages/poetry/index',
        fail: (err) => {
          console.error('导航失败:', err)
          uni.showToast({
            title: '页面开发中',
            icon: 'none'
          })
        }
      })
    },
    navigateToCreate() {
      uni.navigateTo({
        url: '/pages/create/device-upload',  // 确保路径正确
        success: (res) => {
          console.log('跳转成功');
        },
        fail: (err) => {
          console.error('跳转失败:', err)
          uni.showToast({
            title: '跳转失败：' + err.errMsg,
            icon: 'none'
          })
        }
      })
    },
    navigateToThumbs() {
      uni.navigateTo({
        url: '/pages/thumbs/index',  // 确保路径正确
        success: (res) => {
          console.log('跳转成功');
        },
        fail: (err) => {
          console.error('跳转失败:', err)
          uni.showToast({
            title: '跳转失败：' + err.errMsg,
            icon: 'none'
          })
        }
      })
    },
    showUnderDevelopment() {
      uni.showToast({
        title: '页面开发中',
        icon: 'none'
      })
    },
    navigateToPage(item) {
      this.showUnderDevelopment()
    }
  }
}
</script>

<style>
.background-gradient {
  background: linear-gradient(135deg, #FFF6E5 0%, #FFF0F0 100%);
  min-height: 100vh;
  padding-bottom: 20px; /* 添加底部间距 */
}

.container {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 44px 16px 10px;
  background-color: transparent; /* 移除白色背景 */
}

.header-left, .header-right {
  width: 87px; /* 与胶囊按钮宽度一致 */
  height: 32px;
  display: flex;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #4B5563; /* 更深的颜色 */
}

.date-section {
  margin-top: 30px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date {
  font-size: 18px;
  color: #333;
  font-weight: 500;
  letter-spacing: 1px;
}

.accompany {
  font-size: 16px;
  color: #666;
}

.ip-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ip-image {
  width: 280px;
  height: 280px;
}

.mood-container {
  margin-top: 24px;
  text-align: center;
}

.mood {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  display: block;
}

.mood-desc {
  font-size: 16px;
  color: #666;
  display: block;
}

.divider {
  height: 2px;
  background-color: #E0E0E0;
  margin: 20px 20px;
}

.function-entries {
  padding: 0 20px;
}

.entry-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.05),
    0 1px 3px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.entry-hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 8px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
}

.entry-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.entry-title {
  font-size: 20px;
  font-weight: 600;
  color: #4B5563;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.entry-desc {
  font-size: 14px;
  color: #6B7280;
  opacity: 0.9;
}

.entry-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8));
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.side-menu {
  position: fixed;
  top: 0;
  width: 75%;
  height: 100vh;
  background: linear-gradient(135deg, rgba(255, 246, 229, 0.95), rgba(255, 240, 240, 0.95));
  backdrop-filter: blur(10px);
  z-index: 1000;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.menu-header {
  padding: 44px 20px 20px;
  display: flex;
  justify-content: flex-end;
}

.close-btn {
  padding: 8px;
}

.menu-content {
  height: calc(100% - 100px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 20px;
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.3);
  margin-bottom: 16px;
}

.menu-text {
  font-size: 16px;
  color: #4B5563;
  font-weight: 500;
  margin-left: 12px;
}

.menu-item:active {
  background: rgba(255, 255, 255, 0.7);
  transform: scale(0.98);
}

.mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(0, 0, 0, 0.2);
  z-index: 999;
}

.scrollable-content {
  position: relative;
  z-index: 1;
  background: transparent;
}

.main-content {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.fixed-content {
  position: relative;
  flex-shrink: 0; /* 防止内容被压缩 */
  background: linear-gradient(135deg, #FFF6E5 0%, #FFF0F0 100%);
  z-index: 2;
}

.scrollable-content {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: linear-gradient(135deg, #FFF6E5 0%, #FFF0F0 100%);
}

.divider {
  position: relative;
  height: 2px;
  background-color: #E0E0E0;
  margin: 0 20px;
}

.function-scroll {
  height: 100%;
  padding-top: 20px;
}

.function-entries {
  padding: 0 20px;
  padding-bottom: 40px;
}

.entry-item {
  height: 90px; /* 固定每个功能块的高度 */
  margin-bottom: 16px;
}

/* 确保最后一个条目有足够的底部边距 */
.entry-item:last-child {
  margin-bottom: 40px;
}

.ip-image {
  width: 280px;
  height: 280px;
  transition: all 0.3s ease;
}

.ip-section {
  cursor: pointer;
}

.ip-section:active .ip-image {
  transform: scale(0.98);
}

.header-left {
  padding: 8px;
  cursor: pointer;
}
</style>
