"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  data() {
    return {
      thumbsList: [],
      current: 1,
      size: 10,
      isLoading: false,
      hasMore: true,
      loadingStatus: "more",
      deviceId: "123456",
      total: 0,
      pages: 0,
      // 添加总页数记录
      stsCredentials: null,
      previewLoading: false,
      // 新增：预览加载状态
      app: null
      // 添加app引用
    };
  },
  computed: {
    // 按日期分组的缩略图数据
    groupedThumbs() {
      const groups = {};
      this.thumbsList.forEach((thumb) => {
        const date = this.getDateString(thumb.uploadTime);
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(thumb);
      });
      return Object.fromEntries(
        Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]))
      );
    }
  },
  async onLoad() {
    this.app = getApp();
    await this.ensureValidSts();
    this.initLoad();
  },
  // 监听页面滚动到底部
  onReachBottom() {
    console.log("触发底部加载");
    this.loadMore();
  },
  methods: {
    // 确保有有效的 STS 凭证
    async ensureValidSts() {
      try {
        const app = getApp();
        this.stsCredentials = await app.getValidStsCredentials();
      } catch (error) {
        console.error("获取STS凭证失败:", error);
        common_vendor.index.showToast({
          title: "获取访问凭证失败",
          icon: "none"
        });
      }
    },
    // 处理缩略图数据，添加签名URL
    async processThumbsData(records) {
      const processedRecords = [];
      for (const record of records) {
        try {
          const objectKey = record.thumbOssPath.replace("https://photograph-bucket.oss-cn-beijing.aliyuncs.com/", "");
          const signedUrl = await this.app.getOssUrl(objectKey);
          processedRecords.push({
            ...record,
            signedUrl
          });
        } catch (error) {
          console.error("处理缩略图URL失败:", error, record);
          processedRecords.push({
            ...record,
            signedUrl: record.thumbOssPath
          });
        }
      }
      return processedRecords;
    },
    async loadThumbsData() {
      var _a, _b;
      if (this.isLoading)
        return;
      try {
        await this.ensureValidSts();
        this.isLoading = true;
        this.loadingStatus = "loading";
        const res = await utils_request.requestUtil.request({
          url: `/photograph/thumbs/device/${this.deviceId}/page`,
          method: "GET",
          data: {
            current: this.current,
            size: this.size
          }
        });
        if ((_a = res.data) == null ? void 0 : _a.data) {
          const { records, total, pages, current } = res.data.data;
          if (records && records.length > 0) {
            const processedRecords = await this.processThumbsData(records);
            if (this.current === 1) {
              this.thumbsList = processedRecords;
            } else {
              const newData = processedRecords.filter(
                (newItem) => !this.thumbsList.some(
                  (existingItem) => existingItem.thumbId === newItem.thumbId
                )
              );
              this.thumbsList = [...this.thumbsList, ...newData];
            }
            this.total = total;
            this.pages = pages;
            this.hasMore = this.current < pages;
            this.loadingStatus = this.hasMore ? "more" : "noMore";
          } else {
            this.hasMore = false;
            this.loadingStatus = "noMore";
          }
        }
      } catch (error) {
        console.error("加载失败:", error);
        this.loadingStatus = "more";
        if ((_b = error.message) == null ? void 0 : _b.includes("AccessDenied")) {
          await this.app.updateStsCredentials();
          return this.loadThumbsData();
        }
      } finally {
        this.isLoading = false;
      }
    },
    loadMore() {
      if (!this.hasMore || this.isLoading) {
        console.log("无法加载更多:", {
          hasMore: this.hasMore,
          isLoading: this.isLoading,
          currentPage: this.current,
          totalLoaded: this.thumbsList.length,
          total: this.total
        });
        return;
      }
      this.current++;
      console.log("开始加载下一页:", this.current);
      this.loadThumbsData();
    },
    // 重置加载状态
    resetLoadState() {
      this.current = 1;
      this.thumbsList = [];
      this.hasMore = true;
      this.loadingStatus = "more";
      this.total = 0;
    },
    // 初始化数据加载
    initLoad() {
      this.resetLoadState();
      this.loadThumbsData();
    },
    // 获取日期字符串
    getDateString(dateStr) {
      try {
        const date = dateStr.replace(/-/g, "/");
        return new Date(date).toISOString().split("T")[0];
      } catch (error) {
        console.error("日期格式化错误:", dateStr, error);
        return dateStr;
      }
    },
    // 格式化日期显示
    formatDate(dateStr) {
      try {
        const date = new Date(dateStr.replace(/-/g, "/"));
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const weekDay = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
        return `${year}年${month}月${day}日 星期${weekDay}`;
      } catch (error) {
        console.error("日期显示格式化错误:", dateStr, error);
        return dateStr;
      }
    },
    handleImageError(thumbId) {
      console.error(`图片加载失败，ID: ${thumbId}`);
    },
    handleImageLoad(thumbId) {
      console.log(`图片加载成功，ID: ${thumbId}`);
    },
    // 修改预览图处理方法
    async handlePreviewImage(thumbInfo) {
      var _a, _b;
      if (this.previewLoading)
        return;
      try {
        this.previewLoading = true;
        common_vendor.index.showLoading({ title: "加载中..." });
        const res = await utils_request.requestUtil.request({
          url: "/photograph/api/preview_image",
          method: "POST",
          params: { deviceId: this.deviceId },
          data: thumbInfo
        });
        if ((_a = res.data) == null ? void 0 : _a.success) {
          const previewUrl = res.data.data.previewUrl;
          const objectKey = previewUrl.split(".com/")[1];
          const signedUrl = await this.app.getOssUrl(objectKey);
          common_vendor.index.previewImage({
            urls: [signedUrl],
            current: 0,
            success: () => console.log("预览成功"),
            fail: (err) => {
              console.error("预览失败:", err);
              common_vendor.index.showToast({
                title: "预览失败",
                icon: "none"
              });
            }
          });
        } else {
          throw new Error(((_b = res.data) == null ? void 0 : _b.message) || "获取预览图失败");
        }
      } catch (error) {
        console.error("预览图片失败:", error);
        common_vendor.index.showToast({
          title: "获取预览图失败",
          icon: "none"
        });
      } finally {
        this.previewLoading = false;
        common_vendor.index.hideLoading();
      }
    }
  }
};
if (!Array) {
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  _easycom_uni_load_more2();
}
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
if (!Math) {
  _easycom_uni_load_more();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($options.groupedThumbs, (group, date, i0) => {
      return {
        a: common_vendor.t($options.formatDate(date)),
        b: common_vendor.f(group, (item, k1, i1) => {
          return {
            a: item.signedUrl,
            b: common_vendor.o(($event) => $options.handleImageError(item.thumbId), item.thumbId),
            c: common_vendor.o(($event) => $options.handleImageLoad(item.thumbId), item.thumbId),
            d: common_vendor.o(($event) => $options.handlePreviewImage(item), item.thumbId),
            e: item.thumbId
          };
        }),
        c: date
      };
    }),
    b: common_vendor.p({
      status: $data.loadingStatus
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-791ae591"], ["__file", "E:/Project/Front/memhouse_front/pages/thumbs/index.vue"]]);
wx.createPage(MiniProgramPage);
