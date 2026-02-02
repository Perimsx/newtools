<div align="center">

  <img src="./logo.svg" alt="newtools.cloud logo" width="120" height="120">

  # newtools.cloud

  **个人云工具箱 - 极简高效的 PWA 应用**

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)](https://www.w3.org/TR/appmanifest/)
  [![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://www.ecma-international.org/)
  [![Mobile](https://img.shields.io/badge/Mobile-Optimized-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

  [在线演示](#在线演示) • [快速开始](#快速开始) • [功能特性](#功能特性) • [贡献指南](#贡献指南)

</div>

---

## 项目简介

**newtools.cloud** 是一个轻量级、现代化的个人云工具箱 PWA（Progressive Web App）应用。它帮助您快速访问常用工具和网站，支持书签管理、搜索集成、数据备份等功能。

### 核心特点

- **极简设计** - 界面简洁，专注于核心功能
- **PWA 支持** - 可安装到桌面和主屏幕，支持离线使用
- **响应式布局** - 完美适配桌面、平板和移动设备
- **数据本地化** - 所有数据存储在浏览器本地，保护隐私
- **性能优化** - 自动检测设备性能并优化动画和交互
- **主题切换** - 支持深色/浅色主题
- **搜索集成** - 支持多个搜索引擎快速切换

---

## 功能特性

### 核心功能

#### 🎯 工具管理

- **添加/编辑/删除工具** - 简单直观的工具管理界面
- **分类管理** - 自定义分类，快速组织您的工具
- **收藏功能** - 标记常用工具，快速访问
- **搜索过滤** - 实时搜索，快速找到目标工具
- **拖拽排序** - 自由调整工具显示顺序

#### 🔍 搜索集成

- **多引擎支持** - 内置 Google、百度、Bing 等搜索引擎
- **快速切换** - 一键切换不同搜索引擎
- **直接搜索** - 在工具内直接执行搜索，无需跳转

#### 🎨 界面定制

- **深色/浅色主题** - 护眼模式，适应不同环境
- **自定义背景** - 支持设置自定义背景图片
- **毛玻璃效果** - 现代化的毛玻璃 UI 设计
- **响应式布局** - 自适应各种屏幕尺寸

#### 📱 PWA 特性

- **离线使用** - Service Worker 缓存，支持离线访问
- **桌面安装** - 可安装到桌面，像原生应用一样使用
- **主屏幕快捷方式** - 添加到手机主屏幕
- **应用快捷方式** - 快速访问常用功能

#### ⚡ 性能优化

- **自动性能检测** - 智能识别设备性能等级
- **动画降级** - 低性能设备自动禁用复杂动画
- **FPS 监控** - 实时监控帧率，确保流畅体验
- **懒加载** - 按需加载内容，减少资源消耗
- **防抖节流** - 优化滚动和输入性能

#### 🔐 安全与隐私

- **管理员密码** - 保护管理功能，防止误操作
- **本地存储** - 所有数据存储在浏览器本地
- **数据加密** - 密码使用加密存储
- **无追踪** - 不收集任何用户数据

#### 💾 数据管理

- **数据导出** - 导出 JSON 格式备份
- **数据导入** - 从备份文件恢复数据
- **数据重置** - 一键重置到初始状态
- **自动保存** - 所有操作实时自动保存

---

## 技术栈

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **HTML5** | - | 页面结构和语义化标签 |
| **CSS3** | - | 样式和动画，支持 GPU 加速 |
| **JavaScript (ES6+)** | ES6+ | 应用逻辑，模块化开发 |
| **Font Awesome** | 6.4.0 | 图标库 |
| **Google Fonts** | Noto Sans SC | 中文字体 |

### PWA 技术

| 技术 | 用途 |
|------|------|
| **Service Worker** | 离线缓存和资源管理 |
| **Web App Manifest** | 应用元数据和安装配置 |
| **Cache API** | 资源缓存策略 |
| **IndexedDB** | 本地数据存储（通过 localStorage 封装） |

### 存储方案

- **LocalStorage** - 工具数据、设置、主题等
- **Cache Storage** - 静态资源缓存（Service Worker）

### 核心库

- **Font Awesome** - 图标显示
- **Google Fonts** - 字体加载优化
- **DNS Prefetch** - 外部资源预解析
- **Resource Hints** - 资源预加载优化

---

## 在线演示

### 部署状态

暂无在线演示，您可以在本地部署运行。

### 功能截图描述

#### 主界面
- 顶部导航栏：Logo、主题切换按钮、管理菜单
- 搜索框：搜索引擎选择、工具搜索
- 工具列表：按分类展示，支持搜索过滤

#### 工具管理
- 添加/编辑弹窗：名称、分类、链接、备注
- 分类标签：快速选择常用分类
- 确认对话框：删除确认操作

#### 偏好设置
- 背景设置：自定义背景图片 URL
- 数据管理：备份、恢复、重置功能
- 密码验证：管理员保护

---

## 快速开始

### 环境要求

- **浏览器**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **Node.js**: 14+ （可选，用于图标生成）
- **本地服务器**: Python 3, PHP, 或 Node.js任选其一

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/Perimsx/newtools.git
cd newtools.cloud
```

#### 2. 本地运行

**方法 A: 使用 Python（推荐）**

```bash
# Python 3
python -m http.server 8000

# 访问 http://localhost:8000
```

**方法 B: 使用 Node.js**

```bash
# 安装 serve
npx serve .

# 访问显示的地址（通常是 http://localhost:3000）
```

**方法 C: 使用 PHP**

```bash
php -S localhost:8000

# 访问 http://localhost:8000
```

#### 3. 生成图标（可选）

如果您想自定义应用图标：

```bash
# 安装依赖
npm install

# 准备一个 1024x1024 的 PNG 图标
# 命名为 icon-source.png，放在项目根目录

# 生成图标
npm run generate-icons
```

#### 4. 初始化应用

1. 在浏览器中打开应用
2. 首次访问会提示设置管理员密码
3. 设置密码后即可开始使用

### 首次使用

1. **设置密码** - 进入应用后设置管理员密码
2. **添加工具** - 点击右上角锁图标 → 添加工具
3. **自定义分类** - 在添加工具时输入分类名称
4. **切换主题** - 点击右上角月亮图标切换深色模式
5. **自定义背景** - 设置 → 自定义背景图 URL

---

## 使用说明

### 基本操作

#### 添加工具

1. 点击右上角锁图标进入管理模式
2. 输入管理员密码
3. 点击"添加工具"
4. 填写工具信息：
   - **名称**: 工具显示名称（如：GitHub）
   - **分类**: 工具分类（如：开发、设计）
   - **链接地址**: 完整的 URL（如：https://github.com）
   - **备注**: 可选的简短描述
5. 点击"保存"

#### 搜索工具

在搜索框中输入关键词：
- **实时过滤** - 自动筛选匹配的工具
- **回车搜索** - 在当前搜索引擎中搜索关键词
- **点击箭头** - 执行搜索

#### 切换搜索引擎

点击搜索框左侧的搜索引擎图标，在弹出菜单中选择：
- Google
- 百度
- Bing

#### 管理工具

在管理模式下：
- **编辑**: 点击工具卡片上的编辑按钮
- **删除**: 点击工具卡片上的删除按钮
- **收藏**: 点击星标图标收藏常用工具

### 管理员功能

#### 进入管理模式

点击右上角锁图标，输入管理员密码。

#### 管理菜单

- **添加工具** - 添加新的工具
- **偏好设置** - 打开设置面板
- **退出管理模式** - 返回普通用户模式

#### 偏好设置

**自定义背景**
1. 输入图片 URL（建议使用 Unsplash 等图床）
2. 点击"应用背景"
3. 背景会自动保存并应用

**数据备份**
1. 点击"备份数据"按钮
2. 浏览器会下载 JSON 格式的备份文件

**数据恢复**
1. 点击"恢复数据"按钮
2. 选择之前的备份文件（.json）
3. 确认恢复

**重置数据**
- 点击"重置所有数据"按钮
- 确认后将清除所有工具和设置
- 此操作不可恢复，请谨慎使用

### PWA 安装

#### 桌面端安装（Chrome/Edge）

1. 在浏览器中打开应用
2. 点击地址栏右侧的安装图标
3. 点击"安装"按钮
4. 应用会添加到桌面和开始菜单

#### 移动端安装（iOS Safari）

1. 在 Safari 中打开应用
2. 点击底部分享按钮
3. 向下滚动，选择"添加到主屏幕"
4. 点击"添加"按钮

#### 移动端安装（Android Chrome）

1. 在 Chrome 中打开应用
2. 点击浏览器菜单（三个点）
3. 选择"添加到主屏幕"或"安装应用"
4. 点击"添加"或"安装"

---

## 配置说明

### 环境变量

本项目不需要配置环境变量，所有设置通过 UI 界面完成。

### 配置文件

#### manifest.json

PWA 应用配置文件：

```json
{
  "name": "newtools.cloud - 我的工具箱",
  "short_name": "工具箱",
  "description": "个人云工具箱 - 快速访问常用工具和网站",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4A90E2",
  "lang": "zh-CN",
  "categories": ["productivity", "utilities", "tools"]
}
```

### 自定义选项

#### 修改默认搜索引擎

编辑 `assets/js/store.js` 中的 `searchEngines` 配置：

```javascript
searchEngines: {
    google: {
        url: "https://www.google.com/search?q=",
        icon: "fa-brands fa-google",
        name: "Google"
    },
    // 添加新的搜索引擎
    duckduckgo: {
        url: "https://duckduckgo.com/?q=",
        icon: "fa-solid fa-duck",
        name: "DuckDuckGo"
    }
}
```

#### 修改默认工具

编辑 `assets/js/store.js` 中的初始工具列表：

```javascript
tools: [
    {
        id: "1",
        title: "GitHub",
        url: "https://github.com",
        category: "开发",
        desc: "代码托管平台",
        favorite: false,
        order: 0
    }
]
```

#### 修改主题颜色

编辑 `assets/css/style.css` 中的 CSS 变量：

```css
:root {
    --primary-color: #4A90E2;
    --success-color: #52c41a;
    --warning-color: #faad14;
    --danger-color: #ff4d4f;
    /* ... 其他颜色 */
}
```

---

## 项目结构

```
newtools.cloud/
├── index.html                      # 主页面
├── manifest.json                   # PWA 应用配置
├── sw.js                           # Service Worker（离线缓存）
├── logo.svg                        # 项目 Logo
├── LICENSE                         # MIT 许可证
├── README.md                       # 项目文档
│
├── package.json                    # 前端项目配置
├── package-lock.json               # npm 锁定文件
├── generate-icons.js               # 图标生成工具
│
├── server.js                       # 服务器端数据存储 API
├── server-package.json             # 服务器依赖配置
├── start-server.bat                # Windows 启动脚本
├── start-server.sh                 # Linux/macOS 启动脚本
│
├── assets/
│   ├── css/
│   │   ├── style.css               # 主样式文件
│   │   └── performance.css         # 性能优化样式
│   │
│   ├── icons/                      # PWA 应用图标
│   │   ├── icon-48x48.png
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   │
│   └── js/
│       ├── app.js                  # 应用入口
│       ├── store.js                # 状态管理
│       ├── renderer.js             # 渲染逻辑
│       ├── events.js               # 事件处理
│       ├── utils.js                # 工具函数
│       ├── performance-monitor.js  # 性能监控器
│       ├── animation-optimizer.js  # 动画优化器
│       └── fontawesome-fallback.js # 图标降级方案
│
└── data/
    └── mytools-data.json           # 服务器端数据存储
```

### 核心模块说明

| 模块 | 文件 | 行数 | 功能 |
|------|------|------|------|
| **应用入口** | app.js | 125 | 应用初始化、模块集成 |
| **状态管理** | store.js | 375 | 数据存储、状态更新、持久化 |
| **渲染器** | renderer.js | 895 | DOM 渲染、界面更新 |
| **事件处理** | events.js | 1801 | 用户交互、事件绑定 |
| **工具函数** | utils.js | ~400 | 通用工具函数、辅助方法 |
| **性能监控** | performance-monitor.js | ~600 | 性能检测、FPS 监控 |
| **动画优化** | animation-optimizer.js | ~400 | 动画优化、降级策略 |

---

## 开发指南

### 安装依赖

```bash
# 安装开发依赖（用于生成图标）
npm install
```

### 开发命令

```bash
# 启动本地开发服务器
python -m http.server 8000

# 或使用 npx serve
npx serve .

# 生成图标
npm run generate-icons
```

### 构建部署

本项目支持两种部署方式：**纯静态部署** 和 **服务器模式部署**。

---

#### 方式一：纯静态部署

数据存储在浏览器 localStorage，无需后端服务器。

**部署到 GitHub Pages**

1. 推送代码到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择主分支作为源
4. 访问 `https://Perimsx.github.io/newtools`

**部署到 Vercel**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

**部署到 Netlify**

```bash
# 拖拽部署
# 或使用 Netlify CLI
npm i -g netlify-cli
netlify deploy
```

**使用 Nginx 静态托管**

```nginx
server {
    listen 80;
    server_name newtools.yourdomain.com;
    root /var/www/newtools;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

#### 方式二：服务器模式部署（推荐）

使用 `server.js` 提供服务器端数据存储 API，支持多设备数据同步。

**1. 上传项目到服务器**

```bash
# 使用 scp 或 git clone
scp -r newtools/ user@your-server:/var/www/newtools
# 或
git clone https://github.com/Perimsx/newtools.git /var/www/newtools
```

**2. 安装依赖**

```bash
cd /var/www/newtools
npm install
```

**3. 启动服务器**

```bash
# Linux/macOS
./start-server.sh

# Windows
start-server.bat

# 或直接使用 Node.js
node server.js
```

服务器默认运行在 `http://localhost:3002`

**4. 使用 PM2 守护进程（推荐生产环境）**

```bash
# 安装 PM2
npm install -g pm2

# 启动并守护进程
pm2 start server.js --name newtools

# 查看状态
pm2 status

# 查看日志
pm2 logs newtools

# 设置开机自启
pm2 save
pm2 startup
```

**5. Nginx 反向代理配置**

```nginx
server {
    listen 80;
    server_name newtools.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**6. 配置 HTTPS（推荐）**

```bash
# 使用 Certbot 自动获取 SSL 证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d newtools.yourdomain.com
```

---

#### 服务器 API 说明

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/auth/login` | POST | 管理员登录 |
| `/api/auth/logout` | POST | 登出 |
| `/api/auth/check` | GET | 检查登录状态 |
| `/api/data` | GET | 读取数据（需登录） |
| `/api/data` | POST | 保存数据（需登录） |
| `/api/backup` | POST | 创建备份（需登录） |
| `/api/backups` | GET | 获取备份列表（需登录） |

### 代码规范

- **ES6+** - 使用现代 JavaScript 语法
- **模块化** - 使用 IIFE 模块模式
- **注释** - 关键函数添加 JSDoc 注释
- **命名** - 使用驼峰命名法
- **缩进** - 使用 4 空格缩进

### 性能优化建议

1. **资源压缩** - 使用构建工具压缩 CSS 和 JS
2. **图片优化** - 使用 WebP 格式，提供多种尺寸
3. **CDN 加速** - 将静态资源部署到 CDN
4. **代码分割** - 按需加载非关键资源
5. **缓存策略** - 配置合适的 Cache-Control 头

---

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 如何贡献

1. **Fork 项目** - 在 GitHub 上 fork 本仓库
2. **创建分支** - 创建您的特性分支
   ```bash
   git checkout -b feature/your-feature
   ```
3. **提交更改** - 提交您的更改
   ```bash
   git commit -m "Add some feature"
   ```
4. **推送分支** - 推送到您的 fork
   ```bash
   git push origin feature/your-feature
   ```
5. **提交 PR** - 创建 Pull Request

### 代码规范

- 遵循现有代码风格
- 添加适当的注释和文档
- 确保代码在主流浏览器中测试通过
- 更新相关文档

### 提交 PR 流程

1. 描述您的更改目的
2. 关联相关 Issue（如果有）
3. 确保所有测试通过
4. 等待代码审查
5. 根据反馈进行修改

### 报告问题

使用 GitHub Issues 报告问题，请提供：

- 详细的问题描述
- 复现步骤
- 浏览器和版本信息
- 截图或错误信息（如适用）

---

## 常见问题

### Q: 如何重置管理员密码？

A: 目前版本需要手动清除 LocalStorage。打开浏览器控制台，执行：

```javascript
localStorage.clear();
location.reload();
```

### Q: 为什么图标不显示？

A: 可能是 CDN 加载问题。请检查网络连接或尝试刷新页面。

### Q: 如何完全离线使用？

A: 首次访问时，Service Worker 会缓存所有资源。之后即使断网也能访问。将应用安装到桌面可获得更好的离线体验。

### Q: 数据会同步到其他设备吗？

A: 不会。所有数据存储在浏览器本地，不会上传到服务器。如需同步，可以使用"数据备份"功能手动导出/导入。

### Q: 支持哪些浏览器？

A: 支持所有现代浏览器：
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- 移动端浏览器

---

## 性能监控

本项目包含完整的性能监控系统：

### 自动优化

- **高性能设备** - 完整动画效果
- **中等性能设备** - 简化动画，保持流畅
- **低性能设备** - 禁用复杂动画，优先性能

### 性能报告

在浏览器控制台执行：

```javascript
window.__performanceMonitor.getPerformanceReport();
```

### 测试页面

访问 `performance-test.html` 查看实时性能数据和压力测试。

---

## 许可证

MIT License

Copyright (c) 2026 Perimsx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 致谢

### 使用的第三方库

- **[Font Awesome](https://fontawesome.com/)** - 图标库
- **[Google Fonts](https://fonts.google.com/)** - Noto Sans SC 字体
- **[Sharp](https://sharp.pixelplumbing.com/)** - 图像处理库（图标生成）

### 灵感来源

- 现代化 PWA 设计模式
- 云工具箱应用理念
- 极简主义设计哲学

### 特别感谢

感谢所有为 Web 标准和 PWA 技术做出贡献的开发者。

---

## 联系方式

- **GitHub**: [@Perimsx](https://github.com/Perimsx)
- **项目地址**: [https://github.com/Perimsx/newtools](https://github.com/Perimsx/newtools)

---

<div align="center">

**如果这个项目对您有帮助，请给一个 ⭐️ Star！**

Made with ❤️ by Perimsx

</div>
