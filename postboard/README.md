# 公告板系统

基于 Tauri + React + Typescript + Vite 开发的公告板系统，支持 Markdown 编辑、图片上传、数学公式渲染等功能。

## 功能特性

- 📝 **Markdown 编辑**：支持完整的 Markdown 语法
- 🖼️ **图片上传**：支持在 Markdown 中直接上传图片
- 📊 **数学公式**：支持 KaTeX 数学公式渲染
- 🏷️ **分类管理**：支持公告分类
- 📅 **定时发布**：支持设置定时发布时间
- 📌 **置顶功能**：支持公告置顶和优先级管理
- 👤 **用户认证**：简单的用户登录系统
- 🌓 **暗黑模式**：支持深色/浅色主题切换，自动适应系统设置

## 技术栈

- **前端**：React + TypeScript + Vite
- **后端**：Node.js + Express + SQLite
- **构建工具**：Tauri
- **编辑器**：@uiw/react-md-editor
- **数学公式**：KaTeX
- **状态管理**：zustand

## 安装与运行

### 前端开发

```bash
npm install
npm run dev
```

### 后端开发

```bash
cd server
npm install
node index.js
```

## 使用说明

### 图片上传与尺寸控制

#### 上传图片

在创建或编辑公告时，可以通过以下方式上传图片：
1. 点击编辑器上方的🖼️ 上传图片按钮
2. 直接将图片拖拽到编辑器中
3. 在编辑器工具栏中点击图片图标

支持的图片格式：jpg、jpeg、png、gif、webp、svg
图片大小限制：5MB

#### 控制图片尺寸

上传图片后，你可以通过以下方式控制图片尺寸：

1. **使用 HTML 标签**（推荐）：
   ```html
   <img src="图片URL" width="300" alt="图片描述">
   <img src="图片URL" height="200" alt="图片描述">
   <img src="图片URL" width="50%" alt="图片描述">
   ```

2. **使用 Markdown 语法**（自动适应宽度）：
   ```markdown
   ![图片描述](图片URL)
   ```
   这种方式会自动适应容器宽度，保持图片比例

3. **指定具体尺寸**：
   ```markdown
   ![图片描述](图片URL =300x200)
   ```

所有图片都会自动添加圆角和边距，确保良好的显示效果。

### 数学公式

使用 KaTeX 语法编写数学公式：
- 行内公式：`$E=mc^2$`
- 块级公式：`$$E=mc^2$$`

## 更新日志

### 最新更新
- 🌓 新增暗黑模式功能，支持深色/浅色主题切换
- 主题切换按钮添加到导航栏，提供直观的视觉反馈
- 主题状态持久化存储，下次访问时保持用户偏好
- 自动适应系统主题设置
- 优化了主题切换的平滑过渡效果
- 新增图片上传功能，支持在 Markdown 编辑器中直接上传图片
- 优化了 Markdown 编辑器的使用体验
- 修复了一些已知问题

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
