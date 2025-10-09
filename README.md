
# CodeHue

一个为 TypeScript/JavaScript/TSX/JSX 代码提供**结构化颜色装饰**和**语义化注释**的 VSCode 扩展。

## ✨ 主要功能

### 🎨 结构着色
- **函数块着色**：为不同的函数、方法、箭头函数等代码块添加彩色左侧边条
- **Region 区域高亮**：支持 `// #region ... // #endregion` 标记的区域统一着色
- **Overview Ruler 显示**：在编辑器右侧标尺同步显示颜色条
- **智能嵌套处理**：自动处理函数嵌套，避免重复着色

### 📝 语义化注释
- **函数标识**：自动识别函数类型并显示中文语义化注释
  - `方法：functionName(…)` - 命名函数
  - `方法：methodName(…)` - 类/对象方法  
  - `箭头函数：arrowFunc(…)` - 箭头函数
  - `匿名函数` - 匿名函数
- **注释方法提示**：为被注释掉的独立方法显示"（已注释的方法）"提示
- **虚拟注释**：不修改源文件，以悬浮形式显示注释内容

### 🎯 智能过滤
- **代码段优化**：自动过滤纯注释和空白行，只对实质代码着色
- **Region 优先**：Region 标记的区域优先显示，内部函数不着色但保留注释
- **嵌套处理**：正确处理函数嵌套和区域重叠

## 🚀 安装与使用

### 本地开发
1. **安装依赖**
   ```bash
   npm install
   ```

2. **编译项目**
   ```bash
   npm run compile
   ```

3. **启动扩展**
   - 在 VSCode 中按 `F5` 启动扩展开发宿主
   - 或使用 `Run and Debug` → `Launch Extension`

4. **测试功能**
   - 在新打开的 VSCode 窗口中打开 `.ts/.tsx/.js/.jsx` 文件
   - 查看彩色侧边条和语义化注释
   - 如未显示，执行命令面板：`CodeHue: Refresh Decorations`

### 打包发布
```bash
npm run package
```

## ⚙️ 配置选项

在 VSCode 设置中可以配置：

- `codehue.regionColor`: Region 区域的背景颜色（默认：`rgba(76, 175, 80, 0.12)`）
- `codehue.regionBorder`: Region 区域的边框样式（默认：`1px solid rgba(76,175,80,0.45)`）

## 🎨 颜色方案

当前使用彩虹色板：`#FF0000`, `#FF7F00`, `#FFFF00`, `#00C853`, `#FADB14`, `#00E5FF`, `#c98bff`, `#2979FF`, `#7C4DFF`

- 不同函数块使用不同颜色
- Region 区域使用统一的绿色主题
- 颜色在 `src/functionDecorator.ts` 的 `PALETTE` 中可调整

## 📁 项目结构

```
src/
├── extension.ts          # 主扩展入口，事件监听和命令注册
├── functionDecorator.ts  # 函数装饰逻辑，颜色条和语义化注释
├── regionDecorator.ts    # Region 区域解析和装饰
└── exclusionBus.ts       # 排除范围总线，协调不同装饰器
```

## 🔧 技术特性

- **TypeScript 开发**：使用 TypeScript 编写，类型安全
- **VSCode API**：基于 VSCode 装饰器 API 实现
- **实时更新**：监听文档变化，实时更新装饰
- **性能优化**：智能缓存装饰类型，避免重复创建
- **错误处理**：完善的错误处理和资源清理

## 🚧 未来规划

- [ ] 集成 LLM 翻译服务（OpenAI/DeepSeek/Anthropic）
- [ ] 支持 JSDoc 注释翻译
- [ ] 添加"写入注释"功能
- [ ] 基于代码分析提供权重渲染
- [ ] 支持更多编程语言
- [ ] 自定义主题和配色方案

## 📄 许可证

Apache License 2.0

---

**版本**: 2.0.0  
**兼容性**: VSCode ^1.85.0  
**支持语言**: TypeScript, JavaScript, TSX, JSX
