# CodeHue

一个为 TypeScript/JavaScript/TSX/JSX 代码提供**结构化颜色装饰**和**语义化注释**的 VSCode 扩展。

## ✨ 主要功能

### 🎨 智能函数着色
- **🌈 主题自动适配**：根据 VSCode 主题（亮色/暗色）自动切换最佳配色方案
- **React Hooks 统一着色**：同类型的 Hook 使用相同颜色
  - 亮色主题：`useEffect` → 深蓝、`useState` → 深橙红、`useMemo` → 深紫
  - 暗色主题：`useEffect` → 明亮红、`useState` → 明亮黄、`useMemo` → 明亮蓝
  - 支持所有官方 React Hooks（15+ 种）
- **组件函数着色**：React 组件自动识别并着色
- **事件处理函数着色**：handle/on 开头的函数自动识别
- **Region 区域着色**：`// #region` 标记的区域使用绿色

### 📝 中文语义化注释
- **函数类型识别**：自动识别函数类型并显示中文注释
  - `useEffect(() => {` → `// 副作用处理`
  - `useState(` → `// 状态管理`
  - `function ComponentName(` → `// 组件：ComponentName`
  - `handleClick(` → `// 处理点击`
- **虚拟注释**：不修改源文件，以悬浮形式显示
- **智能过滤**：自动忽略 JSX 内联函数和数组方法回调

### 🎯 智能识别
- **自动识别**：支持各种函数定义方式
  - `function name() {}`
  - `const name = () => {}`
  - `name = () => {}`
  - `useEffect(() => {})`
  - `React.useEffect(() => {})`
- **嵌套处理**：正确处理函数嵌套，避免重复着色
- **性能优化**：智能缓存，大文件也能流畅运行

## 🚀 快速开始

### 安装
1. 在 VSCode 扩展商店搜索 "CodeHue"
2. 点击安装
3. 打开任意 `.ts/.tsx/.js/.jsx` 文件即可看到效果

### 使用
- **自动生效**：安装后自动为函数添加颜色条和注释
- **手动刷新**：如果未显示，按 `Ctrl+Shift+P` 输入 "CodeHue: Refresh Decorations"
- **Region 标记**：使用 `// #region 区域名称` 和 `// #endregion` 标记区域

## 📖 使用示例

```typescript
// #region 用户管理
function UserProfile() {  // 组件：UserProfile
  const [user, setUser] = useState(null);  // 状态管理
  
  useEffect(() => {  // 副作用处理
    fetchUser();
  }, []);
  
  const handleSubmit = (data) => {  // 处理提交
    // ...
  };
  
  return (
    <div onClick={() => {}}>  {/* JSX 内联函数不着色 */}
      {users.map(user => (  {/* 数组方法回调不着色 */}
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
// #endregion
```

## ⚙️ 配置选项

在 VSCode 设置中可以配置：

- `codehue.regionColor`: Region 区域的背景颜色
- `codehue.regionBorder`: Region 区域的边框样式
- `codehue.colorScheme`: 颜色方案（vibrant/soft）
- `codehue.stripeWidth`: 左侧条纹宽度（2px/3px/4px/5px）
- `codehue.enableSemanticComments`: 是否显示语义化注释（true/false）

### 颜色方案说明
> **💡 智能主题适配**：扩展会自动检测当前 VSCode 主题类型（亮色/暗色），并为每种方案应用最佳配色

- **vibrant（鲜艳）**：默认方案，色彩鲜艳明亮，区分度高
  - 亮色主题下：深色调，对比度强
  - 暗色主题下：明亮色调，清晰易读
- **soft（柔和）**：柔和的配色，护眼舒适
  - 亮色主题下：中等饱和度，视觉舒适
  - 暗色主题下：淡雅色调，长时间使用不累眼

## 🎨 颜色方案详解

### 📊 主题适配对比

扩展会根据当前主题自动选择最佳配色，以下是 **vibrant 方案** 的配色对比：

#### 亮色主题配色（深色调）
| Hook/类型 | 颜色 | 说明 |
|----------|------|------|
| `useState` | 🟠 深橙红 `#E65100` | 状态管理（最常用） |
| `useEffect` | 🔵 深蓝 `#1565C0` | 副作用处理 |
| `useMemo` | 🟣 深紫 `#6A1B9A` | 缓存优化 |
| `useCallback` | 🟢 深青绿 `#00695C` | 回调优化 |
| `useRef` | 🔴 深粉红 `#AD1457` | 引用 |
| `useContext` | 🟠 深橙 `#EF6C00` | 上下文 |
| 组件 | 🟣 深靛蓝 `#311B92` | React 组件 |
| 事件处理 | 🔴 深红 `#C62828` | handle/on 函数 |
| Region | 🟢 深绿 `#2E7D32` | 区域标识 |

#### 暗色主题配色（明亮色调）
| Hook/类型 | 颜色 | 说明 |
|----------|------|------|
| `useState` | 🟡 明亮黄 `#FFD54F` | 状态管理（最常用） |
| `useEffect` | 🔴 明亮红 `#EF5350` | 副作用处理 |
| `useMemo` | 🔵 明亮蓝 `#42A5F5` | 缓存优化 |
| `useCallback` | 🔵 明亮青 `#26C6DA` | 回调优化 |
| `useRef` | 🟣 明亮紫 `#AB47BC` | 引用 |
| `useContext` | 🟠 明亮橙 `#FFB74D` | 上下文 |
| 组件 | 🟣 明亮紫 `#BA68C8` | React 组件 |
| 事件处理 | 🟣 明亮粉红 `#F48FB1` | handle/on 函数 |
| Region | 🟢 明亮绿 `#81C784` | 区域标识 |

### 🔧 支持的所有 React Hooks
`useState`、`useEffect`、`useMemo`、`useCallback`、`useRef`、`useReducer`、`useLayoutEffect`、`useContext`、`useImperativeHandle`、`useDebugValue`、`useDeferredValue`、`useTransition`、`useId`、`useSyncExternalStore`、`useInsertionEffect`

## 🔧 技术特性

- **零配置**：安装即用，无需额外设置
- **🎨 智能主题适配**：自动检测 VSCode 主题类型（亮色/暗色），动态切换最佳配色方案
- **高性能**：智能缓存，支持大文件（10000+ 行）
- **实时更新**：代码变化时自动更新装饰
- **主题切换响应**：切换主题时立即更新颜色，无需手动刷新
- **多语言支持**：TypeScript, JavaScript, TSX, JSX

## 🚧 计划功能

- [ ] 自定义颜色方案
- [ ] 支持更多编程语言
- [ ] AI 驱动的函数名翻译
- [ ] 集成 JSDoc 注释
- [ ] 函数复杂度可视化

## 📄 许可证

Apache License 2.0

---

**版本**: 3.1.1  
**兼容性**: VSCode ^1.85.0  
**支持语言**: TypeScript, JavaScript, TSX, JSX

## 💡 使用技巧

1. **🌈 主题切换**：按 `Cmd+K Cmd+T`（Mac）或 `Ctrl+K Ctrl+T`（Windows/Linux）切换主题，颜色会自动适配
   - 亮色主题：深色调配色，对比度高
   - 暗色主题：明亮色调配色，清晰易读
2. **Region 标记**：使用 `// #region` 标记代码块，获得统一的绿色着色
3. **函数命名**：使用 `handle` 或 `on` 开头的函数名，会自动识别为事件处理函数
4. **组件命名**：使用大写字母开头的函数名，会自动识别为 React 组件
5. **性能优化**：对于超大文件（>10000行），插件会自动跳过处理
6. **配色调整**：在设置中切换 `vibrant`（鲜艳）/ `soft`（柔和）方案，每种方案都有亮色/暗色版本

## 🐛 问题反馈

如果遇到问题或有建议，请在 [GitHub Issues](https://github.com/your-repo/codehue/issues) 中反馈。