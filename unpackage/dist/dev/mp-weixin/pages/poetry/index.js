"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_aiService = require("../../utils/ai-service.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: 0,
      steps: [
        { title: "上传图片" },
        { title: "选择标签" },
        { title: "生成诗歌" }
      ],
      currentStep: 0,
      imageUrl: "",
      keywords: [],
      selectedTags: [],
      poetryStyles: ["唐诗", "宋词", "元曲", "现代诗"],
      selectedStyle: "",
      generatedPoem: "",
      isDirectEntry: false,
      isPageShowing: true,
      isTransitioning: false,
      showSharePreview: false,
      shareImagePath: "",
      canvasHeight: 900
    };
  },
  computed: {
    canCreate() {
      return this.selectedTags.length > 0 && this.selectedStyle;
    }
  },
  onLoad() {
    const systemInfo = common_vendor.index.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight;
    const pages = getCurrentPages();
    if (pages.length === 1) {
      this.isDirectEntry = true;
    }
  },
  onShow() {
    this.isPageShowing = true;
  },
  onHide() {
    this.isPageShowing = false;
  },
  onUnload() {
    this.isPageShowing = false;
  },
  // 添加页面切换步骤的控制
  watch: {
    currentStep(newVal) {
      this.$nextTick(() => {
        this.isPageShowing = true;
      });
    }
  },
  methods: {
    goBack() {
      if (this.currentStep > 0) {
        this.currentStep--;
        if (this.currentStep === 0) {
          this.keywords = [];
          this.selectedTags = [];
          this.selectedStyle = "";
        }
      } else {
        const pages = getCurrentPages();
        if (pages.length === 1) {
          common_vendor.index.switchTab({
            url: "/pages/index/index"
          });
        } else {
          common_vendor.index.navigateBack();
        }
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
    formatPoem(poem) {
      if (!poem)
        return "";
      let formatted = poem.replace(/([，。])/g, "$1\n").replace(/\n+/g, "\n").trim();
      return formatted;
    },
    async createPoem() {
      try {
        this.isTransitioning = true;
        common_vendor.index.showLoading({ title: "创作中..." });
        const result = await utils_aiService.createPoem(this.selectedTags, this.selectedStyle);
        if (result && result.status === "success") {
          this.generatedPoem = this.formatPoem(result.poem);
          this.$nextTick(() => {
            this.currentStep = 2;
            setTimeout(() => {
              this.isTransitioning = false;
            }, 100);
          });
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
        this.isTransitioning = false;
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
    async shareCard() {
      try {
        common_vendor.index.showLoading({ title: "生成中..." });
        const ctx = common_vendor.index.createCanvasContext("shareCanvas", this);
        const canvasWidth = 600;
        const poemLines = this.generatedPoem.split("\n");
        const lineHeight = 70;
        const poemStartY = 420;
        const footerHeight = 120;
        const bottomPadding = 80;
        const poemHeight = poemLines.length * lineHeight;
        const minHeight = poemStartY + poemHeight + footerHeight + bottomPadding;
        this.canvasHeight = Math.max(900, minHeight);
        await this.$nextTick();
        ctx.setFillStyle("#FFF5E7");
        ctx.fillRect(0, 0, canvasWidth, this.canvasHeight);
        ctx.setFillStyle("#FFFFFF");
        ctx.fillRect(40, 40, 520, 320);
        await new Promise((resolve, reject) => {
          ctx.drawImage(this.imageUrl, 50, 50, 500, 300);
          ctx.draw(true, resolve);
        });
        ctx.setFillStyle("#333333");
        ctx.setFontSize(36);
        ctx.setTextAlign("center");
        ctx.font = "36px KaiTi";
        let y = poemStartY;
        poemLines.forEach((line) => {
          ctx.fillText(line, canvasWidth / 2, y);
          y += lineHeight;
        });
        const footerY = this.canvasHeight - footerHeight + 40;
        ctx.setFillStyle("#FF9500");
        ctx.fillRect(50, footerY, 500, 2);
        ctx.setFontSize(24);
        ctx.setFillStyle("#666666");
        ctx.fillText("AI诗歌创作", canvasWidth / 2, footerY + 40);
        ctx.draw(true);
        setTimeout(async () => {
          try {
            const res = await new Promise((resolve, reject) => {
              common_vendor.index.canvasToTempFilePath({
                canvasId: "shareCanvas",
                width: canvasWidth,
                height: this.canvasHeight,
                // 使用计算后的高度
                destWidth: canvasWidth * 2,
                // 2倍分辨率，提高清晰度
                destHeight: this.canvasHeight * 2,
                success: resolve,
                fail: reject
              }, this);
            });
            this.shareImagePath = res.tempFilePath;
            this.showSharePreview = true;
            common_vendor.index.hideLoading();
          } catch (error) {
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: "生成失败",
              icon: "none"
            });
          }
        }, 300);
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "生成失败",
          icon: "none"
        });
      }
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
      const pages = getCurrentPages();
      if (this.isDirectEntry || pages.length === 1) {
        common_vendor.index.redirectTo({
          url: "/pages/index/index"
        });
      } else {
        common_vendor.index.navigateBack({
          delta: pages.length - 1
          // 返回到首页
        });
      }
    },
    closeSharePreview() {
      this.showSharePreview = false;
      this.shareImagePath = "";
    },
    async saveToAlbum() {
      try {
        common_vendor.index.showLoading({ title: "保存中..." });
        await new Promise((resolve, reject) => {
          common_vendor.index.saveImageToPhotosAlbum({
            filePath: this.shareImagePath,
            success: resolve,
            fail: reject
          });
        });
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "已保存到相册",
          icon: "success"
        });
        this.closeSharePreview();
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "none"
        });
      }
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_steps2 = common_vendor.resolveComponent("uni-steps");
  (_easycom_uni_icons2 + _easycom_uni_steps2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_steps = () => "../../uni_modules/uni-steps/components/uni-steps/uni-steps.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_steps)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.statusBarHeight + "px",
    b: common_vendor.p({
      type: "back",
      size: "24",
      color: "#333"
    }),
    c: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    d: common_vendor.p({
      options: $data.steps,
      active: $data.currentStep,
      direction: "row",
      activeColor: "#FF9500"
    }),
    e: $data.currentStep === 0
  }, $data.currentStep === 0 ? common_vendor.e({
    f: !$data.imageUrl
  }, !$data.imageUrl ? {
    g: common_vendor.p({
      type: "camera-filled",
      size: "48",
      color: "#666"
    }),
    h: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args))
  } : {
    i: $data.imageUrl,
    j: common_vendor.o((...args) => $options.chooseImage && $options.chooseImage(...args))
  }, {
    k: !$data.imageUrl,
    l: common_vendor.o((...args) => $options.analyzeImage && $options.analyzeImage(...args))
  }) : {}, {
    m: $data.currentStep === 1
  }, $data.currentStep === 1 ? {
    n: common_vendor.f($data.keywords, (tag, index, i0) => {
      return {
        a: common_vendor.t(tag),
        b: index,
        c: common_vendor.n($data.selectedTags.includes(tag) ? "tag-selected" : ""),
        d: common_vendor.o(($event) => $options.toggleTag(tag), index)
      };
    }),
    o: common_vendor.f($data.poetryStyles, (style, index, i0) => {
      return {
        a: common_vendor.t(style),
        b: index,
        c: common_vendor.n($data.selectedStyle === style ? "style-selected" : ""),
        d: common_vendor.o(($event) => $options.selectStyle(style), index)
      };
    }),
    p: !$options.canCreate,
    q: common_vendor.o((...args) => $options.createPoem && $options.createPoem(...args))
  } : {}, {
    r: $data.currentStep === 2
  }, $data.currentStep === 2 ? {
    s: common_vendor.t($data.generatedPoem),
    t: common_vendor.o((...args) => $options.copyPoem && $options.copyPoem(...args)),
    v: common_vendor.o((...args) => $options.shareCard && $options.shareCard(...args)),
    w: common_vendor.o((...args) => $options.restart && $options.restart(...args)),
    x: common_vendor.o((...args) => $options.goHome && $options.goHome(...args))
  } : {}, {
    y: $data.isPageShowing && !$data.isTransitioning,
    z: $data.canvasHeight + "px",
    A: $data.showSharePreview
  }, $data.showSharePreview ? common_vendor.e({
    B: common_vendor.p({
      type: "close",
      size: "24",
      color: "#333"
    }),
    C: common_vendor.o((...args) => $options.closeSharePreview && $options.closeSharePreview(...args)),
    D: $data.shareImagePath
  }, $data.shareImagePath ? {
    E: $data.shareImagePath
  } : {}, {
    F: common_vendor.o((...args) => $options.saveToAlbum && $options.saveToAlbum(...args)),
    G: common_vendor.o(() => {
    }),
    H: common_vendor.o((...args) => $options.closeSharePreview && $options.closeSharePreview(...args))
  }) : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "E:/Project/Front/memhouse_front/pages/poetry/index.vue"]]);
wx.createPage(MiniProgramPage);
