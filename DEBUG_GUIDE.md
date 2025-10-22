# CodeHue 调试指南

## 🔍 如何验证自定义颜色配置

### 方法一：使用扩展调试模式（推荐）

1. **启动调试**
   - 在 VSCode 中按 `F5` 或点击"运行和调试"
   - 选择 "Launch Extension" 配置
   - 这会打开一个新的 VSCode 窗口（扩展开发主机）

2. **打开测试文件**
   - 在新窗口中打开 `test-example/HooksTest.tsx` 文件
   - 你应该能看到左侧的彩色条纹

3. **验证自定义颜色**
   - 打开新窗口的设置（`Cmd/Ctrl + ,`）
   - 搜索 "codehue custom"
   - 修改 `Codehue: Custom Colors` 配置，例如：
     ```json
     {
       "codehue.customColors": {
         "useState": "#FF8A65",
         "useEffect": "#5E35B1",
         "useMemo": "#FFEB3B",
         "useCallback": "#A5F3A5"
       }
     }
     ```
   - 保存后，颜色应该立即更新

4. **刷新装饰**
   - 如果颜色没有立即更新，按 `Cmd/Ctrl + Shift + P`
   - 输入并执行 `CodeHue: Refresh Decorations`

### 方法二：使用工作区配置

1. **编辑测试配置**
   - 打开 `test-example/.vscode/settings.json`
   - 修改 `codehue.customColors` 中的颜色值
   - 保存文件

2. **重新启动调试**
   - 停止当前调试会话
   - 按 `F5` 重新启动
   - 打开 `test-example/HooksTest.tsx` 查看效果

### 方法三：使用控制台验证

1. **打开开发者工具**
   - 在扩展开发主机窗口中按 `Cmd/Ctrl + Shift + I`
   - 切换到 "Console" 标签

2. **添加调试日志**（可选）
   - 在 `src/hooksDecorator.ts` 的 `getColorScheme()` 函数中添加：
     ```typescript
     console.log('Custom Colors:', customColors);
     console.log('Merged Scheme:', mergedScheme);
     ```
   - 重新编译：`npm run compile`
   - 重启调试窗口
   - 查看控制台输出，确认配置已读取

## 🎨 测试文件说明

`test-example/HooksTest.tsx` 包含了所有支持的 Hooks：
- **useState** (第 9-11 行) - 应显示你配置的 useState 颜色
- **useEffect** (第 14、20、25 行) - 应显示你配置的 useEffect 颜色
- **useMemo** (第 30、35 行) - 应显示你配置的 useMemo 颜色
- **useCallback** (第 40、45、50 行) - 应显示你配置的 useCallback 颜色

## 🔧 配置示例

### 高对比度配置
```json
{
  "codehue.customColors": {
    "useState": "#FF0000",
    "useEffect": "#00FF00",
    "useMemo": "#0000FF",
    "useCallback": "#FFFF00"
  }
}
```

### 柔和配色
```json
{
  "codehue.customColors": {
    "useState": "#FFB3BA",
    "useEffect": "#BAE1FF",
    "useMemo": "#BAFFC9",
    "useCallback": "#FFFFBA"
  }
}
```

### 部分自定义（只改 useState 和 useEffect）
```json
{
  "codehue.customColors": {
    "useState": "#E74C3C",
    "useEffect": "#3498DB"
  }
}
```

## 🐛 调试技巧

1. **查看装饰应用情况**
   - 左侧应该有彩色条纹
   - 鼠标悬停查看颜色值

2. **检查配置是否生效**
   - 修改配置后，颜色应立即变化
   - 如果没有，执行 `CodeHue: Refresh Decorations`

3. **验证优先级**
   - 自定义颜色 > 颜色方案
   - 即使设置了 `colorScheme: "ocean"`，自定义颜色仍会覆盖

4. **常见问题**
   - ❌ 颜色格式错误：必须使用 `#RRGGBB` 格式
   - ❌ 大小写敏感：使用 `useState` 而不是 `UseState`
   - ❌ 空字符串：空字符串会被忽略，使用默认颜色

## 📝 快速验证流程

1. `F5` 启动调试
2. 打开 `test-example/HooksTest.tsx`
3. 在新窗口设置中配置自定义颜色
4. 保存并观察左侧条纹颜色变化
5. ✅ 完成！

---

**提示**：每次修改源代码后，需要重新编译（`npm run compile`）并重启调试窗口。

