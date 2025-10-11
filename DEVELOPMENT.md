# VSCode 插件开发指南

本文档详细说明如何开发、调试、发布和更新 VSCode 插件。

## 📋 目录

- [环境准备](#环境准备)
- [本地调试](#本地调试)
- [代码开发](#代码开发)
- [版本发布](#版本发布)
- [版本迭代](#版本迭代)
- [常见问题](#常见问题)

---

## 环境准备

### 1. 安装依赖

```bash
# 安装项目依赖
npm install

# 全局安装 vsce（VSCode 扩展打包和发布工具）
npm install -g @vscode/vsce
```

### 2. 项目结构

```
PrismJSX/
├─ src/                    # TypeScript 源代码
│  ├─ extension.ts         # 扩展主入口
│  ├─ functionDecorator.ts # 函数装饰逻辑
│  ├─ regionDecorator.ts   # Region 区域处理
│  └─ exclusionBus.ts      # 排除范围协调
├─ dist/                   # 编译后的 JavaScript
├─ images/                 # 图标资源
├─ .vscode/               
│  └─ launch.json          # 调试配置
├─ package.json            # 扩展清单
├─ tsconfig.json           # TypeScript 配置
└─ CHANGELOG.md            # 版本更新日志
```

---

## 本地调试

### 方法一：使用 F5 快捷键（推荐）

1. 在 VSCode 中打开项目根目录
2. 按 `F5` 键
3. VSCode 会自动：
   - 编译 TypeScript 代码
   - 启动扩展开发宿主（Extension Development Host）
   - 打开一个新的 VSCode 窗口用于测试

### 方法二：使用调试面板

1. 点击左侧活动栏的调试图标（或按 `Ctrl+Shift+D`）
2. 在调试配置下拉菜单中选择 **"Run Extension"**
3. 点击绿色播放按钮开始调试

### 方法三：使用命令面板

1. 按 `Ctrl+Shift+P`（Mac: `Cmd+Shift+P`）打开命令面板
2. 输入并选择：`Debug: Start Debugging`
3. 选择 **"Run Extension"** 配置

### 调试配置说明

`.vscode/launch.json` 配置：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": [
        "${workspaceFolder}/dist/**/*.js"
      ],
      "preLaunchTask": "${workspaceFolder}/npm: compile"
    }
  ]
}
```

---

## 代码开发

### 实时编译

在开发过程中，建议启动 TypeScript 监视模式：

```bash
npm run watch
```

这样每次保存文件时都会自动重新编译。

### 调试技巧

#### 1. 设置断点
- 在 TypeScript 源代码中点击行号左侧设置断点
- 断点会在扩展开发宿主中触发时暂停执行

#### 2. 重新加载扩展
在扩展开发宿主窗口中：
- 按 `Ctrl+R`（Mac: `Cmd+R`）或
- 按 `Ctrl+Shift+P` → 输入 `Developer: Reload Window`

#### 3. 查看日志
- 在主 VSCode 窗口中查看 **"调试控制台"**（Debug Console）
- 使用 `console.log()` 输出调试信息

#### 4. 测试扩展功能
在扩展开发宿主窗口中：
1. 打开 `.ts`、`.tsx`、`.js` 或 `.jsx` 文件
2. 查看彩色装饰和语义化注释
3. 如果没显示，执行命令：`CodeHue: Refresh Decorations`

### 代码编译

```bash
# 编译一次
npm run compile

# 监视模式（自动重新编译）
npm run watch
```

---

## 版本发布

### 第一次发布准备

#### 1. 创建 Azure DevOps 账号

访问：https://dev.azure.com

#### 2. 生成 Personal Access Token (PAT)

1. 登录 Azure DevOps
2. 点击右上角用户头像 → **"Personal access tokens"**
3. 点击 **"+ New Token"**
4. 填写信息：
   - **Name**: `VSCode Extension Publishing`
   - **Organization**: 选择 "All accessible organizations"
   - **Expiration**: 建议选择 1 年或自定义
   - **Scopes**: 选择 **"Custom defined"**
     - ✅ **Marketplace** → **Manage**
5. 点击 **"Create"**
6. **立即复制 Token**（只显示一次，请保存到安全位置）

#### 3. 创建发布者账号

如果是第一次发布：

1. 访问：https://marketplace.visualstudio.com/manage/createpublisher
2. 填写发布者信息：
   - **ID**: 发布者唯一标识（如：`codehue`）
   - **Name**: 显示名称
   - **Email**: 联系邮箱
3. 提交创建

#### 4. 登录 vsce

```bash
vsce login <publisher-id>
```

输入你的 Personal Access Token。

### 发布新版本

#### 方法一：直接发布（推荐）

```bash
# 发布当前版本
vsce publish
```

vsce 会自动：
1. 运行 `npm run vscode:prepublish`（编译代码）
2. 打包成 `.vsix` 文件
3. 上传到 Visual Studio Marketplace
4. 验证和发布

#### 方法二：先打包，再发布

```bash
# 1. 打包成 .vsix 文件
npm run package
# 或
vsce package

# 2. 发布 .vsix 文件
vsce publish --packagePath ./codehue-3.0.1.vsix
```

### 发布后验证

1. 访问扩展页面：
   ```
   https://marketplace.visualstudio.com/items?itemName=<publisher>.<extension>
   ```

2. 在发布者中心查看：
   ```
   https://marketplace.visualstudio.com/manage
   ```

3. 状态说明：
   - **Verifying...**: 正在验证（通常 5-15 分钟）
   - **Published**: 发布成功，用户可以安装

---

## 版本迭代

### 1. 版本号规则

遵循语义化版本（Semantic Versioning）：`MAJOR.MINOR.PATCH`

- **MAJOR**: 主版本号（重大变更，不兼容的 API 修改）
- **MINOR**: 次版本号（新增功能，向后兼容）
- **PATCH**: 补丁版本号（bug 修复，向后兼容）

### 2. 更新版本步骤

#### 手动更新版本

1. **修改 `package.json`**：
   ```json
   {
     "version": "3.0.1"
   }
   ```

2. **更新 `CHANGELOG.md`**：
   ```markdown
   ## 3.0.1 (2025-01-27)
   - 修复装饰器性能问题
   - 优化大文件渲染速度
   - 减少内存占用
   ```

3. **编译代码**：
   ```bash
   npm run compile
   ```

4. **发布**：
   ```bash
   vsce publish
   ```

#### 使用 vsce 自动更新版本（推荐）

```bash
# 发布补丁版本（3.0.0 → 3.0.1）
vsce publish patch

# 发布次要版本（3.0.0 → 3.1.0）
vsce publish minor

# 发布主要版本（3.0.0 → 4.0.0）
vsce publish major
```

vsce 会自动：
- 更新 `package.json` 中的版本号
- 创建 Git tag
- 编译和打包
- 发布到 Marketplace

### 3. 完整的版本迭代流程

```bash
# 1. 确保代码已提交
git status
git add .
git commit -m "fix: 修复性能问题"

# 2. 发布新版本（自动更新版本号）
vsce publish patch

# 3. 推送代码和标签到远程仓库
git push origin main
git push origin --tags
```

### 4. 版本回退

如果发布的版本有问题，可以下架：

```bash
# 下架指定版本
vsce unpublish <publisher>.<extension>@<version>

# 下架整个扩展
vsce unpublish <publisher>.<extension>
```

**注意**：下架后需要等待一段时间才能重新发布相同版本号。

---

## 常见问题

### 1. 如何查看已发布的插件？

访问 Visual Studio Marketplace 发布者中心：
- URL: https://marketplace.visualstudio.com/manage
- 使用微软账号登录
- 在 **"Extensions"** 标签下查看所有已发布的插件

### 2. Token 过期怎么办？

重新生成 Personal Access Token：
1. 访问：https://dev.azure.com
2. 用户头像 → **"Personal access tokens"**
3. 创建新 Token
4. 重新登录：`vsce login <publisher-id>`

### 3. 发布失败：repository 警告

在 `package.json` 中添加：

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/your-repo"
  }
}
```

### 4. 如何测试打包结果？

```bash
# 1. 打包
vsce package

# 2. 在本地安装测试
code --install-extension codehue-3.0.1.vsix
```

### 5. 如何添加扩展图标？

1. 准备图标文件（推荐 128x128 PNG）
2. 放在 `images/icon.png`
3. 在 `package.json` 中配置：
   ```json
   {
     "icon": "images/icon.png"
   }
   ```

### 6. 如何查看扩展统计数据？

访问发布者中心的 Analytics 页面：
- 下载量
- 安装量
- 用户评分
- 评论

### 7. 编译错误怎么办？

```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新编译
npm run compile
```

### 8. 调试时扩展没有加载？

1. 检查 `package.json` 中的 `activationEvents`
2. 确保 `main` 指向正确的入口文件：`./dist/extension.js`
3. 查看扩展开发宿主的输出面板（Output）

---

## 有用的命令速查

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监视模式
npm run watch

# 登录发布者账号
vsce login <publisher-id>

# 打包
vsce package

# 发布当前版本
vsce publish

# 发布并更新版本号
vsce publish patch   # 3.0.0 → 3.0.1
vsce publish minor   # 3.0.0 → 3.1.0
vsce publish major   # 3.0.0 → 4.0.0

# 查看当前登录状态
vsce ls-publishers

# 本地安装测试
code --install-extension ./codehue-3.0.1.vsix
```

---

## 相关链接

- **VSCode 扩展 API 文档**: https://code.visualstudio.com/api
- **发布扩展官方指南**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **Marketplace 发布者中心**: https://marketplace.visualstudio.com/manage
- **Azure DevOps**: https://dev.azure.com
- **vsce 工具文档**: https://github.com/microsoft/vscode-vsce

---

## 贡献指南

如果你想为项目做贡献：

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

---

**最后更新**: 2025-01-27  
**当前版本**: 3.0.1

