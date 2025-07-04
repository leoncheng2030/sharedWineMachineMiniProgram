# 小程序基础框架

这是一个纯净的小程序基础框架，已移除所有业务API，适合作为全新项目的起点。

## 项目结构

```
src/
├── components/            # 基础组件库
│   ├── andPrivacy/       # 隐私协议组件
│   ├── customDivder/     # 自定义分割线
│   ├── loginPopup/       # 登录弹窗组件
│   └── statusBar/        # 状态栏组件
├── config/               # 配置文件
├── constant/             # 常量定义
├── hooks/                # 自定义hooks
│   ├── index.ts         # 基础工具hooks
│   └── user.ts          # 用户相关hooks（模拟数据）
├── pages/                # 页面
│   ├── index/           # 首页
│   ├── user/            # 用户页面
│   └── webview/         # 网页视图
├── bundle/pages/         # 分包页面
│   └── server_explan/   # 服务协议页面
├── router/               # 路由配置
├── static/               # 静态资源
├── store/                # 状态管理
│   └── modules/
│       ├── config.ts    # 配置状态
│       └── user.ts      # 用户状态
├── types/                # 类型定义
│   ├── global.d.ts      # 全局类型
│   ├── home.d.ts        # 首页类型
│   ├── index.d.ts       # 基础类型
│   ├── result.d.ts      # 结果类型
│   └── user.d.ts        # 用户类型
├── utils/                # 工具函数
├── App.vue              # 应用入口
├── main.ts              # 主文件
├── pages.json           # 页面配置
└── uni.scss             # 全局样式
```

## 保留功能

### 核心功能
- ✅ 基础首页框架
- ✅ 用户登录授权（组件化实现）
- ✅ 隐私协议处理
- ✅ 小程序授权流程
- ✅ 基础组件库
- ✅ 状态管理框架
- ✅ 工具函数库
- ✅ TypeScript类型定义

### 页面结构
- **首页** (`pages/index/index`): 纯净的基础首页
- **用户页面** (`pages/user/user`): 个人中心，未登录时自动显示登录弹窗
- **网页视图** (`pages/webview/webview`): 内嵌网页
- **服务协议** (`bundle/pages/server_explan/server_explan`): 隐私政策和服务协议

### 组件功能
- **登录弹窗** (`LoginPopup`): 可复用的登录组件，支持底部弹出
- 隐私协议弹窗处理
- 基础UI组件（状态栏、分割线等）

## 技术栈

- **框架**: uni-app + Vue 3 + TypeScript
- **状态管理**: Pinia
- **UI库**: uview-plus
- **样式**: SCSS + UnoCSS
- **工具**: Vite + 小程序开发工具

## 特点

### ✨ 纯净框架
- 已移除所有业务相关API
- 无任何第三方业务依赖
- 适合作为全新项目起点

### 🛠️ 完整架构
- 保留完整的项目架构
- 包含必要的基础组件
- 提供模拟数据演示

### 🔧 易于扩展
- 清晰的目录结构
- 完整的TypeScript支持
- 模块化设计
- 组件化登录系统

## 登录组件使用

```vue
<template>
  <LoginPopup 
    v-model:show="showLogin" 
    :redirectUrl="'/pages/target/target'"
    @loginSuccess="handleLoginSuccess"
  />
</template>

<script setup>
const showLogin = ref(false)

const handleLoginSuccess = () => {
  console.log('登录成功')
}
</script>
```

## 开发说明

1. **配置管理**: 使用默认配置，可根据需要修改 `src/hooks/index.ts` 中的 `useGetConfig` 函数
2. **用户系统**: 提供模拟的用户登录和信息管理，可替换为实际API
3. **状态管理**: 完整的Pinia状态管理，包含用户和配置状态
4. **登录系统**: 组件化设计，可在任何页面使用
5. **组件系统**: 基础UI组件库，可根据需要扩展

## 启动项目

```bash
# 安装依赖
npm install

# 开发模式
npm run dev:mp-weixin

# 构建
npm run build:mp-weixin
```

## 🔥 真机热重载开发

### 快速开始

1. **安装依赖**
```bash
npm install
```

2. **启动真机热重载开发**
```bash
# 方式一：使用微信开发者工具真机调试
npm run dev:weixin-remote

# 方式二：使用自定义热重载服务器
npm run dev:weixin-hot
```

3. **在小程序中启用热重载**

在 `src/App.vue` 中添加：
```javascript
import { initHotReload } from '@/utils/hot-reload'

export default {
  onLaunch() {
    // 初始化热重载（仅开发环境）
    initHotReload()
  }
}
```

### 🎯 真机调试功能

#### 方式一：微信开发者工具真机调试2.0
- ✅ 官方支持，稳定可靠
- ✅ 代码修改后自动编译同步
- ✅ 支持断点调试
- ✅ 支持性能分析

**使用步骤：**
1. 运行 `npm run dev:weixin-remote`
2. 扫描二维码连接真机调试
3. 修改代码，自动同步到真机

#### 方式二：自定义热重载服务器
- ✅ 更快的同步速度
- ✅ 自定义刷新策略
- ✅ 实时编译状态提示
- ✅ WebSocket实时通信

**使用步骤：**
1. 运行 `npm run dev:weixin-hot`
2. 确保手机和电脑在同一网络
3. 修改代码，自动推送到真机

### 🔧 配置说明

#### 开发者工具配置
在微信开发者工具中：
1. 打开 **设置 → 安全设置**
2. 开启 **服务端口**
3. 开启 **CLI/HTTP 调用**

#### 项目配置
修改 `scripts/dev-remote.js` 中的配置：
```javascript
const config = {
  // 微信开发者工具CLI路径
  cliPath: 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat',
  // 项目路径
  projectPath: path.resolve(__dirname, '../'),
  // 真机调试端口
  port: 9420
}
```

### 📱 支持的功能

#### 实时同步
- ✅ Vue组件修改
- ✅ JavaScript/TypeScript代码
- ✅ 样式文件(SCSS/CSS)
- ✅ 配置文件(JSON)
- ✅ 页面结构(WXML)

#### 调试功能
- ✅ 控制台日志
- ✅ 网络请求监控
- ✅ 存储数据查看
- ✅ 页面性能分析

#### 自动化测试
- ✅ 页面元素定位
- ✅ 用户交互模拟
- ✅ 截图对比
- ✅ 业务流程测试

### 🚀 开发命令

```bash
# 基础开发命令
npm run dev:mp-weixin          # 标准小程序开发
npm run dev:weixin-remote      # 真机调试开发
npm run dev:weixin-hot         # 热重载开发

# 构建命令
npm run build:mp-weixin        # 构建小程序

# 测试命令
npm run test:auto              # 自动化测试
npm run test:login             # 登录功能测试
```

### ⚠️ 注意事项

1. **网络要求**
   - 手机和电脑必须在同一局域网
   - 确保防火墙允许相应端口

2. **微信版本要求**
   - 微信版本 ≥ 7.0.0
   - 小程序基础库 ≥ 2.7.3

3. **开发者工具要求**
   - 版本 ≥ 1.02.1907232
   - 开启安全设置中的服务端口

4. **性能建议**
   - 大文件修改可能需要等待几秒
   - 建议关闭不必要的调试功能
   - 网络不稳定时优先使用官方真机调试

### 🐛 常见问题

**Q: 真机调试连接失败？**
A: 检查网络连接、防火墙设置、开发者工具版本

**Q: 代码修改后没有同步？**
A: 检查文件监听、编译状态、WebSocket连接

**Q: 热重载影响性能？**
A: 仅在开发环境启用，生产环境会自动禁用

**Q: 如何调试网络请求？**
A: 使用开发者工具的Network面板或真机调试的网络监控

## 扩展指南

### 添加API
1. 创建 `src/api` 目录
2. 添加HTTP请求封装
3. 创建具体的API接口文件

### 添加页面
1. 在 `src/pages` 或 `src/bundle/pages` 中创建页面
2. 在 `src/pages.json` 中注册页面路由
3. 根据需要添加到tabBar配置

### 添加组件
1. 在 `src/components` 中创建组件
2. 在 `src/components/index.ts` 中注册全局组件
3. 在页面中使用组件

## 注意事项

- 当前所有数据都是模拟数据
- 登录功能为演示版本，需要替换为实际的微信登录API
- 隐私协议和授权流程已完整实现
- 登录系统已组件化，便于在任何页面使用
- 框架保持最小化，便于快速开发新功能
