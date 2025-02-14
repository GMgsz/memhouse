"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      scrollHeight: 0,
      currentDate: "",
      days: 0,
      firstLoginDate: null,
      isMenuOpen: false,
      menuItems: [
        {
          name: "设置",
          icon: "gear",
          path: "/pages/settings/index"
        },
        {
          name: "全部",
          icon: "grid",
          path: "/pages/all/index"
        },
        {
          name: "数据",
          icon: "chart",
          path: "/pages/statistics/index"
        }
      ],
      ipStates: [
        {
          image: "/static/ip.png",
          mood: "今天心情不错呢~",
          desc: "想和主人一起看看窗外的风景"
        },
        {
          image: "/static/ip_happy.png",
          mood: "主人来陪我玩吧！",
          desc: "今天阳光真好呢"
        },
        {
          image: "/static/ip_thinking.png",
          mood: "让我想想今天写什么诗...",
          desc: "灵感正在酝酿中"
        }
      ],
      currentIpIndex: 0
    };
  },
  computed: {
    currentIp() {
      return this.ipStates[this.currentIpIndex];
    }
  },
  onLoad() {
    this.setCurrentDate();
    this.initAccompanyDays();
    this.startDateTimer();
    this.initScrollHeight();
  },
  onUnload() {
    this.clearTimers();
  },
  methods: {
    startDateTimer() {
      this.dateTimer = setInterval(() => {
        this.setCurrentDate();
      }, 6e4);
    },
    clearTimers() {
      if (this.dateTimer) {
        clearInterval(this.dateTimer);
      }
    },
    toggleMenu() {
      console.log("Toggle menu");
      this.isMenuOpen = !this.isMenuOpen;
    },
    closeMenu() {
      console.log("Close menu");
      this.isMenuOpen = false;
    },
    initScrollHeight() {
      const systemInfo = common_vendor.index.getSystemInfoSync();
      this.scrollHeight = systemInfo.windowHeight - 580;
    },
    handleMenuItem(item) {
      console.log("Menu item clicked:", item.name);
      this.closeMenu();
      switch (item.name) {
      }
    },
    changeIpStatus() {
      this.currentIpIndex = (this.currentIpIndex + 1) % this.ipStates.length;
    },
    setCurrentDate() {
      const date = /* @__PURE__ */ new Date();
      const year = date.getFullYear();
      const month = this.getChineseMonth(date.getMonth());
      const day = date.getDate();
      const weekday = this.getChineseWeekday(date.getDay());
      this.currentDate = `${weekday} ${day} ${month} ${year}`;
    },
    getChineseWeekday(day) {
      const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      return weekdays[day];
    },
    getChineseMonth(month) {
      const months = [
        "一月",
        "二月",
        "三月",
        "四月",
        "五月",
        "六月",
        "七月",
        "八月",
        "九月",
        "十月",
        "十一月",
        "十二月"
      ];
      return months[month];
    },
    async initAccompanyDays() {
      try {
        let firstLogin = common_vendor.index.getStorageSync("firstLoginDate");
        if (!firstLogin) {
          firstLogin = (/* @__PURE__ */ new Date()).toISOString();
          common_vendor.index.setStorageSync("firstLoginDate", firstLogin);
        }
        const startDate = new Date(firstLogin);
        const today = /* @__PURE__ */ new Date();
        const diffTime = Math.abs(today - startDate);
        this.days = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
      } catch (e) {
        console.error("初始化陪伴天数失败:", e);
        this.days = 0;
      }
    },
    navigateToPoetry() {
      common_vendor.index.navigateTo({
        url: "/pages/poetry/index",
        fail: (err) => {
          console.error("导航失败:", err);
          common_vendor.index.showToast({
            title: "页面开发中",
            icon: "none"
          });
        }
      });
    },
    navigateToTest() {
      common_vendor.index.navigateTo({
        url: "/pages/test/device-upload",
        // 确保路径正确
        success: (res) => {
          console.log("跳转成功");
        },
        fail: (err) => {
          console.error("跳转失败:", err);
          common_vendor.index.showToast({
            title: "跳转失败：" + err.errMsg,
            icon: "none"
          });
        }
      });
    },
    showUnderDevelopment() {
      common_vendor.index.showToast({
        title: "页面开发中",
        icon: "none"
      });
    },
    navigateToPage(item) {
      this.showUnderDevelopment();
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.p({
      type: "bars",
      size: "24",
      color: "#333"
    }),
    b: common_vendor.o((...args) => $options.toggleMenu && $options.toggleMenu(...args)),
    c: common_vendor.f($data.menuItems, (item, index, i0) => {
      return {
        a: "2e516088-1-" + i0,
        b: common_vendor.p({
          type: item.icon,
          size: "24",
          color: "#4B5563"
        }),
        c: common_vendor.t(item.name),
        d: index,
        e: common_vendor.o(($event) => $options.navigateToPage(item), index)
      };
    }),
    d: $data.isMenuOpen ? "0" : "-100%",
    e: $data.isMenuOpen
  }, $data.isMenuOpen ? {
    f: common_vendor.o((...args) => $options.closeMenu && $options.closeMenu(...args)),
    g: common_vendor.o(() => {
    })
  } : {}, {
    h: common_vendor.p({
      type: "bars",
      size: "24",
      color: "#333"
    }),
    i: common_vendor.o((...args) => $options.toggleMenu && $options.toggleMenu(...args)),
    j: common_vendor.t($data.currentDate),
    k: common_vendor.t($data.days),
    l: $options.currentIp.image,
    m: common_vendor.t($options.currentIp.mood),
    n: common_vendor.t($options.currentIp.desc),
    o: common_vendor.o((...args) => $options.changeIpStatus && $options.changeIpStatus(...args)),
    p: common_vendor.p({
      type: "compose",
      size: "28",
      color: "#6B7280"
    }),
    q: common_vendor.o((...args) => $options.navigateToPoetry && $options.navigateToPoetry(...args)),
    r: common_vendor.p({
      type: "paperplane",
      size: "28",
      color: "#6B7280"
    }),
    s: common_vendor.o((...args) => $options.navigateToTest && $options.navigateToTest(...args)),
    t: common_vendor.p({
      type: "flag",
      size: "28",
      color: "#6B7280"
    }),
    v: common_vendor.o((...args) => $options.showUnderDevelopment && $options.showUnderDevelopment(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "E:/Project/Front/memhouse_front/pages/index/index.vue"]]);
wx.createPage(MiniProgramPage);
