# 内容维护与部署指南

新版个人主页已经将**页面代码 (`src/`)** 与**个人内容数据 (`content/`、`public/`)** 完全解耦。日常更新论文、简历、项目或生活相册，无需修改前端组件代码。

---

## 1. 新增学术成果 / 论文

1. 将论文 PDF 放入 `public/papers/` 目录，例如：`public/papers/2025-urban-heat-island.pdf`。
2. 复制模板文件 `content/publications/_template.md`，重命名为非下划线开头的 `.md` 文件（例如 `content/publications/2025-urban-heat-island.md`）。
   > 以 `_` 开头的文件（如 `_template.md`）会被构建自动忽略，不会发布到页面。
3. 填写 YAML Frontmatter 字段：
   - `type`：可选 `journal` / `conference` / `preprint` / `thesis`
   - `indexing`：标签数组，如 `["SCI Q1", "First Author"]` 或 `["EI", "Co-First Author"]`
   - `pdf`：填写 `"/papers/2025-urban-heat-island.pdf"`（如暂不公开 PDF 可留空 `""`）
   - `bibtex`：填写标准 BibTeX，页面会自动提供折叠预览与 HTTP/HTTPS 兼容的一键复制按钮。
4. 正文 Markdown 区域可写 2–4 条「核心研究发现 / Highlights」，会在展开 Abstract 抽屉时一并展示。

---

## 2. 更新个人简介、学历、研究方向与履历

编辑 `content/academic/cv.json`：

- `position`、`affiliation`：当前身份、学位或所在单位
- `cvPdf`：如果放置了个人简历 PDF（如 `public/papers/cv.pdf`），填入 `"/papers/cv.pdf"` 即可在学术页顶部显示下载按钮
- `bioParagraphs`：研究背景介绍段落
- `researchInterests`：研究方向卡片（编号、中英文标题、简介、关键词）
- `education` / `experience`：教育经历与实习/工作履历
- `honorsAndProjects` / `serviceAndSkills`：代表项目与技术栈标签

首页幕布文案、四列背景图组与基础个人信息位于 `content/site.json`。

---

## 3. 新增实践项目与生活相册

- **实践项目**：在 `content/projects/` 下新增 `.md` 文件（按 `order` 排序），封面图放入 `public/media/projects/`。
- **生活相册**：在 `content/albums/` 下新增 `.md` 文件，`layout` 支持两种模式：
  - `masonry-gallery`：瀑布流/网格相册，支持灯箱预览与可选 `tags` 筛选（如美食、朋友、校园影集）
  - `editorial-stories`：大图与长文双栏交替阅读模式（如《不止篮球》《杭州》）

---

## 4. 隐私保护与非明文数据分离

为避免在公开 Git 仓库中直接暴露私人邮箱、微信号等明文信息：

1. **方式 A：本地私有覆盖文件（推荐）**
   - 复制 `content/private.example.json` 为 `content/private.local.json`（已加入 `.gitignore`，不会被 Git 提交）。
   - 在其中填写 `email`、`affiliation`、`scholarUrl`、`orcidUrl`、`wechatId`、`cvPdf` 等字段，构建时会自动与 `content/site.json` 和 `content/academic/cv.json` 合并。
   - 填写后的邮箱在静态 HTML 中会经过字符位移编码，点击按钮时才在浏览器端解码，防止简单爬虫直接抓取 `mailto:` 明文。
   - 如不希望将微信二维码图片留在公开仓库，也可将 `public/media/profile/wechat.jpg` 移出仓库，仅在本地或服务器构建前放入，或将 `private.local.json` 中的 `wechatQr` 设为 `""` 隐藏微信入口。

2. **方式 B：独立私有内容目录 (`CONTENT_DIR`)**
   - 可以把整套 `content/` 复制到仓库外部的私有目录（或私有 Git 仓库），构建时指定环境变量：
     ```bash
     CONTENT_DIR=/path/to/private-content npm run build
     ```

---

## 5. 本地预览与腾讯云部署

### 本地开发与检查

```bash
npm install
npm run dev      # 本地实时预览 (http://localhost:4321)
npm run check    # TypeScript 与 Astro 模板类型检查
npm run build    # 生成纯静态产物到 dist/
```

### 部署到腾讯云服务器（Nginx · 支持无域名裸 IP 访问）

1. 在本地或云服务器上执行 `npm run build`，生成纯静态目录 `dist/`。
2. 将 `dist/` 同步到服务器目录（例如 `/var/www/homepage/`）：
   ```bash
   rsync -avz --delete dist/ root@你的服务器IP:/var/www/homepage/
   ```
3. 参考仓库内置的 `deploy/nginx.conf` 配置 Nginx（已包含静态路由、Gzip、资源缓存与自定义 404，且未启用强制 HTTPS/HSTS，裸 IP HTTP 即可直接访问）：
   ```bash
   sudo cp deploy/nginx.conf /etc/nginx/sites-available/homepage.conf
   sudo ln -sf /etc/nginx/sites-available/homepage.conf /etc/nginx/sites-enabled/homepage.conf
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. 如果日后部署在子路径（例如 GitHub Pages 的 `/homepage/`），可通过环境变量构建：
   ```bash
   SITE_BASE=/homepage/ npm run build
   ```
