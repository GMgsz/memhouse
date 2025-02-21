<script>
import request from '@/utils/request.js'

export default {
	globalData: {
		deviceId: '123456',    // 设备ID默认值
		userId: 'default_user', // 用户ID默认值
		previewUrlCache: new Map(), // 预览图URL缓存
	},
	
	methods: {
		// 清理过期的预览图缓存
		cleanExpiredCache() {
			const now = Date.now()
			for (const [key, value] of this.globalData.previewUrlCache) {
				if (value.expireTime <= now) {
					this.globalData.previewUrlCache.delete(key)
				}
			}
		},

		// 获取预览图URL（带缓存）
		async getPreviewUrl(thumbInfo) {
			const cacheKey = thumbInfo.thumbId
			const now = Date.now()
			
			// 清理过期缓存
			this.cleanExpiredCache()
			
			const cached = this.globalData.previewUrlCache.get(cacheKey)
			
			// 检查缓存是否存在且未过期
			if (cached && cached.expireTime > now) {
				return cached.signedUrl
			}
			
			// 缓存不存在或已过期，重新请求
			try {
				const res = await request.request({
					url: '/photograph/api/preview_image',
					method: 'POST',
					params: { deviceId: this.globalData.deviceId },
					data: thumbInfo
				})
				
				if (res.data?.success) {
					const signedUrl = res.data.data.signedUrl
					const expireTime = this.parseExpirationFromUrl(signedUrl)
					
					// 更新缓存
					this.globalData.previewUrlCache.set(cacheKey, {
						signedUrl,
						expireTime
					})
					
					return signedUrl
				}
				throw new Error(res.data?.message || '获取预览图失败')
			} catch (error) {
				console.error('获取预览图失败:', error)
				throw error
			}
		},
		
		// 从URL中解析过期时间
		parseExpirationFromUrl(url) {
			try {
				// 获取问号后面的参数字符串
				const queryString = url.split('?')[1]
				if (!queryString) {
					throw new Error('URL没有参数部分')
				}
				
				// 手动解析参数
				const params = queryString.split('&').reduce((acc, param) => {
					const [key, value] = param.split('=')
					acc[key] = value
					return acc
				}, {})
				
				const expires = params['Expires']
				if (!expires) {
					throw new Error('URL中没有Expires参数')
				}
				
				return parseInt(expires) * 1000 // 转换为毫秒时间戳
			} catch (error) {
				console.error('解析URL过期时间失败:', error)
				// 默认设置1小时过期
				return Date.now() + 3600 * 1000
			}
		}
	}
}
</script>

<style>
	/*每个页面公共css */
</style>
