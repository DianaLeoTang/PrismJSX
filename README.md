# CodeHue

一个为 TypeScript/JavaScript/TSX/JSX 代码提供**结构化颜色装饰**和**语义化注释**的 VSCode 扩展。

## ✨ 主要功能

### 🎨 智能函数着色
- **React Hooks 统一着色**：同类型的 Hook 使用相同颜色
  - `useEffect` → 红色 (#FF6B6B)
  - `useState` → 黄色 (#FADB14)
  - `useMemo` → 蓝色 (#45B7D1)
  - `useCallback` → 青色 (#00E5FF)
  - `useRef` → 紫色 (#7C4DFF)
  - 更多 Hook 类型...
- **组件函数着色**：React 组件使用统一颜色 (#DDA0DD)
- **事件处理函数着色**：handle/on 开头的函数使用粉色 (#FFB6C1)
- **Region 区域着色**：`// #region` 标记的区域使用绿色 (#85e0a3)

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

## 🎨 颜色方案

### React Hooks
- `useEffect` → 🔴 红色
- `useState` → 🟡 黄色  
- `useMemo` → 🔵 蓝色
- `useCallback` → 🔵 青色
- `useRef` → 🟣 紫色
- `useReducer` → 🟣 粉色
- `useLayoutEffect` → 🟢 绿色
- `useContext` → 🟠 橙色
- 更多 Hook...

### 其他函数类型
- React 组件 → 🟣 紫色
- 事件处理函数 → 🟣 粉色
- Region 区域 → 🟢 绿色
- 默认函数 → 🟠 橙色

## 🔧 技术特性

- **零配置**：安装即用，无需额外设置
- **高性能**：智能缓存，支持大文件
- **实时更新**：代码变化时自动更新装饰
- **主题适配**：自动适配 VSCode 主题
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

**版本**: 3.0.0  
**兼容性**: VSCode ^1.85.0  
**支持语言**: TypeScript, JavaScript, TSX, JSX

## 💡 使用技巧

1. **Region 标记**：使用 `// #region` 标记代码块，获得统一的绿色着色
2. **函数命名**：使用 `handle` 或 `on` 开头的函数名，会自动识别为事件处理函数
3. **组件命名**：使用大写字母开头的函数名，会自动识别为 React 组件
4. **性能优化**：对于超大文件（>10000行），插件会自动跳过处理

## 🐛 问题反馈

如果遇到问题或有建议，请在 [GitHub Issues](https://github.com/your-repo/codehue/issues) 中反馈。