
# # PrismJSX
**用不同颜色区分不同功能的JS/TS代码块**

**结构着色 + 英文直译占位注释（无规则映射）**，适用于 TS/JS/TSX/JSX。
- 依据 *结构*（组件 / Hook / 函数 / 类 / 导出）对代码块加彩色侧边条，并在 **Overview Ruler**（右侧标尺）显示。
- 从标识符自动提取英文 token，并在行尾以“虚拟注释”形式显示一个**直译占位**（未集成 LLM 前为原词组合）。
- 不修改源文件；可通过命令面板执行 `CodeHue: Refresh Decorations` 重新渲染。

> 这是一个最小可运行的 VSCode 扩展示例，方便你本地跑通与进一步开发。

## 安装与运行（本地开发）
1. 安装依赖
   ```bash
   npm install
   ```
2. 编译
   ```bash
   npm run compile
   ```
3. 在 VSCode 中按 `F5`（Run and Debug → **Launch Extension**）启动扩展开发宿主。
4. 在新打开的 VSCode 窗口里，打开一个包含 `.ts/.tsx/.js/.jsx` 的文件，即可看到彩色侧边条与行尾虚拟注释（鼠标悬浮可见详情）。
5. 若没有渲染，执行命令面板 `CodeHue: Refresh Decorations`。

## 说明
- 颜色含义（可在 `src/extension.ts` 的 `palette` 中调整）：
  - component: 组件（绿）
  - hook: Hook（青）
  - function: 普通函数（蓝）
  - class: 类（紫）
  - exported: 导出实体（橙）
- 最小直译为**占位**：仅把英文标识符拆词后拼回，避免误译。后续可接入 LLM 翻译服务。
- 目前未直接对 minimap 单独着色（VSCode API 对 minimap 装饰支持有限）；右侧 **Overview Ruler** 已同步显示色条。

## 后续扩展建议
- 添加 LLM 翻译提供者（OpenAI / DeepSeek / Anthropic / 本地模型）替换占位直译。
- 抓取上方英文注释/JSDoc 一并翻译展示。
- 提供“写入注释”命令（把虚拟注释写回文件，可撤销）。
- 综合调用图/改动频度/覆盖率，为“核心 vs 边缘”提供权重渲染（深浅）。

---
MIT
