"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_aiService = require("../../utils/ai-service.js");
const _sfc_main = {
  data() {
    return {
      steps: [
        { title: "上传图片" },
        { title: "选择标签" },
        { title: "生成诗歌" }
      ],
      currentStep: 0,
      imageUrl: "",
      keywords: [],
      selectedTags: [],
      poetryStyles: ["唐诗", "宋词", "元曲", "现代诗", "藏头诗"],
      selectedStyle: "",
      generatedPoem: ""
    };
  },
  computed: {
    canCreate() {
      return this.selectedTags.length > 0 && this.selectedStyle;
    }
  },
  methods: {
    handleBack() {
      if (this.currentStep > 0) {
        this.currentStep--;
      } else {
        common_vendor.index.navigateBack();
      }
    },
    async chooseImage() {
      try {
        const { tempFilePaths } = await new Promise((resolve, reject) => {
          common_vendor.index.chooseImage({
            count: 1,
            sizeType: ["compressed"],
            sourceType: ["album", "camera"],
            success: resolve,
            fail: reject
          });
        });
        if (tempFilePaths && tempFilePaths.length > 0) {
          this.imageUrl = tempFilePaths[0];
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "选择图片失败",
          icon: "none"
        });
      }
    },
    async analyzeImage() {
      try {
        common_vendor.index.showLoading({ title: "分析中..." });
        const result = await utils_aiService.analyzeImage(this.imageUrl);
        if (result && result.status === "success") {
          this.keywords = result.keywords;
          this.currentStep = 1;
        } else {
          throw new Error((result == null ? void 0 : result.message) || "未能识别图片特征");
        }
      } catch (error) {
        console.error("分析失败:", error);
        common_vendor.index.showToast({
          title: error.message || "分析失败，请重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    toggleTag(tag) {
      const index = this.selectedTags.indexOf(tag);
      if (index > -1) {
        this.selectedTags.splice(index, 1);
      } else {
        this.selectedTags.push(tag);
      }
    },
    selectStyle(style) {
      this.selectedStyle = style;
    },
    async createPoem() {
      try {
        common_vendor.index.showLoading({ title: "创作中..." });
        const result = await utils_aiService.createPoem(this.selectedTags, this.selectedStyle);
        if (result && result.status === "success") {
          this.generatedPoem = result.poem;
          this.currentStep = 2;
        } else {
          throw new Error((result == null ? void 0 : result.message) || "未能生成诗歌");
        }
      } catch (error) {
        console.error("创作失败:", error);
        common_vendor.index.showToast({
          title: error.message || "创作失败，请重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    copyPoem() {
      common_vendor.index.setClipboardData({
        data: this.generatedPoem,
        success: () => {
          common_vendor.index.showToast({
            title: "复制成功"
          });
        }
      });
    },
    shareCard() {
    },
    restart() {
      this.currentStep = 0;
      this.imageUrl = "";
      this.keywords = [];
      this.selectedTags = [];
      this.selectedStyle = "";
      this.generatedPoem = "";
    },
    goHome() {
      common_vendor.index.navigateBack({
        delta: 1
      });
    }
  }
};
if (!Array) {
  const _easycom_uni_nav_bar2 = common_vendor.resolveComponent("uni-nav-bar");
  const _easycom_uni_steps2 = common_vendor.resolveComponent("uni-steps");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  (_easycom_uni_nav_bar2 + _easycom_uni_steps2 + _easycom_uni_icons2)();
}
const _easycom_uni_nav_bar = () => "../../uni_modules/uni-nav-bar/components/uni-nav-bar/uni-nav-bar.js";
const _easycom_uni_steps = () => "../../uni_modules/uni-steps/components/uni-steps/uni-steps.js";
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  (_easycom_uni_nav_bar + _easycom_uni_steps + _easycom_uni_icons)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o($options.handleBack),
    b: common_vendor.p({
      ["left-icon"]: "left",
      title: "诗歌创作",
      border: false,
      ["status-bar"]: true,
      fixed: true
    }),
    c: common_vendor.p({
      options: $data.steps,
      active: $data.currentStep,
      direction: "column",
      activeColor: "#FF9500"
    }),
    d: $data.currentStep === 0
  }, $data.currentStep === 0 ? common_vendor.e({
    e: !$data.imageUrl
  }, !$data.imageUrl ? {
    f: common_vendor.p({
      type: "camera-filled",
      size: "48",
      color: "#666"
    }),
    g: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args))
  } : {
    h: $data.imageUrl,
    i: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args))
  }, {
    j: !$data.imageUrl,
    k: common_vendor.o((...args) => $options.analyzeImage && $options.analyzeImage(...args))
  }) : {}, {
    l: $data.currentStep === 1
  }, $data.currentStep === 1 ? {
    m: common_vendor.f($data.keywords, (tag, index, i0) => {
      return {
        a: common_vendor.t(tag),
        b: index,
        c: common_vendor.n($data.selectedTags.includes(tag) ? "tag-selected" : ""),
        d: common_vendor.o(($event) => $options.toggleTag(tag), index)
      };
    }),
    n: common_vendor.f($data.poetryStyles, (style, index, i0) => {
      return {
        a: common_vendor.t(style),
        b: index,
        c: common_vendor.n($data.selectedStyle === style ? "style-selected" : ""),
        d: common_vendor.o(($event) => $options.selectStyle(style), index)
      };
    }),
    o: !$options.canCreate,
    p: common_vendor.o((...args) => $options.createPoem && $options.createPoem(...args))
  } : {}, {
    q: $data.currentStep === 2
  }, $data.currentStep === 2 ? {
    r: common_vendor.t($data.generatedPoem),
    s: common_vendor.o((...args) => $options.copyPoem && $options.copyPoem(...args)),
    t: common_vendor.o((...args) => $options.shareCard && $options.shareCard(...args)),
    v: common_vendor.o((...args) => $options.restart && $options.restart(...args)),
    w: common_vendor.o((...args) => $options.goHome && $options.goHome(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "E:/Project/Front/memhouse_front/pages/poetry/index.vue"]]);
wx.createPage(MiniProgramPage);
