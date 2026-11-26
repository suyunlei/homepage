# 内容维护与部署指南

新版个人主页已经将**页面代码 (`src/`)** 与**个人内容数据 (`content/`、`public/`)** 完全解耦。日常更新首页照片、论文、简历、项目或生活相册，无需修改前端组件代码。

---

## 1. 如何更换首页图片（背景照片墙与点击预览图）

首页包含两部分图片配置，均位于 `content/site.json`，对应图片存放在 `public/media/home/` 目录：

### 方式一：最快原地替换（不动 JSON，只换照片）
1. 进入 `public/media/home/` 查看对应编号的照片（共 `1`–`23` 号，目前为 `.webp` 或 `.jpg`）。
2. 用你的新照片替换目标图片文件，或者直接把新照片（`.jpg` / `.png` / `.webp` 都可以）拖进 `public/media/home/`。
3. **压缩优化图片**（重要，保持首页秒开与自动修正手机 EXIF 旋转）：
   ```bash
   npm run optimize:media -- home
   ```
   > 脚本会自动按 EXIF 修正方向、限制最大尺寸、转换为轻量 `.webp`（如果原小图已经比 WebP 更小则自动保留原图不膨胀），并同步更新 `content/site.json` 里的后缀路径。
4. 运行 `npm run build` 并部署到服务器（或推送 GitHub 后同步上线）。

### 方式二：新增 / 调整首页照片墙排版或板块预览图
编辑 `content/site.json`：

1. **四列背景照片墙 (`homeColumns`)**：
   - 共 4 列数组（从左到右第 1–4 列），每列建议放 **6 张**照片，填满首屏且不会生成多余隐藏节点。
   - `"bottom": false`：从顶部对齐向下排；该列的**前 2 张**会优先高优先级加载（首屏立刻显示），其余在后台懒加载。
   - `"bottom": true`：从底部对齐向上排；该列的**最后 2 张**在底部首屏可见，同样优先加载。
   - 因此如果想第一时间换掉"一打开最显眼的照片"，优先替换：
     - 第 1 列（`"bottom": false`）的前 2 项
     - 第 2 列（`"bottom": true`）的后 2 项
     - 第 3 列（`"bottom": false`）的前 2 项
     - 第 4 列（`"bottom": true`）的后 2 项
2. **点击大字菜单后的左侧预览大图 (`homePanels[].image`)**：
   - 分别对应 `Author` / `Academic` / `Life Style` / `Project` / `Contact` 5 个面板的左侧预览图（懒加载，不拖慢首屏）。
   - 修改对应项的 `"image"` 字段（例如 `"/media/home/my-new-photo.webp"`），把原图放入 `public/media/home/` 后执行 `npm run optimize:media -- home` 即可。

---

## 2. 图片体积一键优化工具 (`npm run optimize:media`)

每当向 `public/media/` 的任意子目录（首页 `home/`、生活相册 `life/`、项目 `projects/`、头像微信 `profile/`）放入高清原图后，都可以运行：

```bash
npm run optimize:media           # 优化并转换 public/media/ 全部新增或未压缩图片
npm run optimize:media -- home   # 仅处理 public/media/home/
npm run optimize:media -- life   # 仅处理 public/media/life/
```

脚本内置安全机制：
- 按拍摄方向（EXIF Orientation）自动旋正再缩放（`home` ≤ 520×780、`life/covers` ≤ 1000px、`life` 相册 ≤ 1280px、`projects` ≤ 1000px、`profile/wechat` 保持高清晰度 ≤ 900×1200）。
- **防膨胀保护**：如果某张本来很小的图片转成 WebP 后体积没有变小，会自动保留原图不动，并保持引用一致。
- **幂等跳过**：已经达标的 `.webp` 图片重复运行脚本时会自动跳过，不会二次有损压缩。
- **自动更新引用**：原图 `.jpg/.png` 转为 `.webp` 并清理原文件后，会自动把 `content/` 下对应 `.json` 和 `.md` 里的路径同步改好。

---

## 3. 新增学术成果 / 论文

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

## 4. 更新个人简介、学历、研究方向与履历

编辑 `content/academic/cv.json`（支持中英文双语字段，如 `position` / `positionEn`）：

- `position`、`affiliation`：当前身份、学位或所在单位
- `cvPdf`：如果放置了个人简历 PDF（如 `public/papers/cv.pdf`），填入 `"/papers/cv.pdf"` 即可在学术页顶部显示下载按钮
- `bioParagraphs` / `bioParagraphsEn`：研究背景介绍段落
- `researchInterests`：研究方向卡片（编号、中英文标题、简介、关键词）
- `education` / `experience`：教育经历与实习/工作履历
- `honorsAndProjects` / `serviceAndSkills`：荣誉、代表项目与技术栈标签

---

## 5. 新增实践项目、播客与生活相册

- **实践项目 / 播客**：在 `content/projects/` 下新增 `.md` 文件（按 `order` 排序），封面图放入 `public/media/projects/` 后运行 `npm run optimize:media -- projects`。
- **生活相册**：在 `content/albums/` 下新增 `.md` 文件，`layout` 支持两种模式（图片放入 `public/media/life/<相册名>/` 后运行 `npm run optimize:media -- life`）：
  - `masonry-gallery`：瀑布流/网格相册，支持灯箱预览与可选 `tags` 筛选（如美食、朋友、校园影集）
  - `editorial-stories`：大图与长文双栏交替阅读模式（如《不止篮球》《杭州》）

---

## 6. 隐私保护与非明文数据分离

为避免在公开 Git 仓库中直接暴露私人邮箱、微信号等明文信息：

1. **方式 A：本地私有覆盖文件（推荐）**
   - 复制 `content/private.example.json` 为 `content/private.local.json`（已加入 `.gitignore`，不会被 Git 提交）。
   - 在其中填写 `email`、`affiliation`、`scholarUrl`、`orcidUrl`、`wechatId`、`cvPdf` 等字段，构建时会自动与 `content/site.json` 和 `content/academic/cv.json` 合并。
   - 填写后的邮箱在静态 HTML 中会经过字符位移编码，点击按钮时才在浏览器端解码，防止简单爬虫直接抓取 `mailto:` 明文。
   - 如不希望将微信二维码图片留在公开仓库，也可将 `public/media/profile/wechat.webp` 移出仓库，仅在本地或服务器构建前放入，或将 `private.local.json` 中的 `wechatQr` 设为 `""` 隐藏微信入口。

2. **方式 B：独立私有内容目录 (`CONTENT_DIR`)**
   - 可以把整套 `content/` 复制到仓库外部的私有目录（或私有 Git 仓库），构建时指定环境变量：
     ```bash
     CONTENT_DIR=/path/to/private-content npm run build
     ```

---

## 7. 本地预览与线上部署 (`suyunlei.cn`)

### 本地开发与检查

```bash
npm install
npm run optimize:media   # 新增图片时建议先压缩优化
npm run dev              # 本地实时预览 (http://localhost:4321)
npm run check            # TypeScript 与 Astro 模板类型检查
npm run build            # 生成纯静态产物到 dist/
```

### 部署到线上服务器

1. 在本地执行 `npm run check` 与 `npm run build`，生成纯静态目录 `dist/`（已包含加密邮箱等 `private.local.json` 注入内容）。
2. 将 `dist/` 打包上传并原子替换服务器上的 `/opt/homepage/dist/`，再重启静态容器使挂载生效：
   ```bash
   sudo docker restart homepage-web
   ```
3. 如果需要部署在子路径（例如 GitHub Pages 的 `/homepage/`），可通过环境变量构建：
   ```bash
   SITE_BASE=/homepage/ npm run build
   ```
