# 苏云雷的个人主页 · Yunlei Su's Personal Homepage

基于 **Astro 7 + Tailwind CSS v4 + TypeScript + GSAP 3** 重构的个人主页与学术展示站点。

保留了原版主页极具辨识度的冷灰（`#afb6bc`）与炭黑（`#252528`）编辑美学、四列视差照片墙与巨型描边字体交互幕布，同时统一翻新了全部子页面，并新增独立、可持续维护的**学术成果**主板块。

## 核心特性

- **统一视觉体系**：首页交互幕布与 `Academic` / `Projects` / `Life` / `Contact` 全站风格统一，本地自托管字体（Space Grotesk + JetBrains Mono），零外网 CDN 依赖，国内服务器裸 IP 直连秒开。
- **新增学术成果板块 (`/academic/`)**：包含学者简介、研究方向、论文检索与分类筛选（类型 / 年份 / 关键词）、Abstract 折叠抽屉、PDF 直链、HTTP 兼容的一键 BibTeX 复制、教育与实践履历。
- **内容与代码解耦 (`content/`)**：所有个人资料、论文、项目与影集均独立存放于 `content/`，支持 `content/private.local.json`（不入库）与 `CONTENT_DIR` 外部私有目录构建。
- **完整迁移历史记忆**：完整保留并翻新了原版《生活碎片》（朋友们、不止篮球、杭州、安大四年、唯美食不可辜负）与全部早期工程/制图项目。

## 常用命令

```bash
npm install       # 安装依赖
npm run dev       # 本地开发预览
npm run check     # 运行 Astro 与 TypeScript 类型检查
npm run build     # 构建纯静态产物至 dist/
npm run preview   # 本地预览构建产物
```

## 文档与部署

- 内容维护与隐私隔离说明：[CONTENT_GUIDE.md](./CONTENT_GUIDE.md)
- 腾讯云 Nginx 参考配置：[deploy/nginx.conf](./deploy/nginx.conf)
