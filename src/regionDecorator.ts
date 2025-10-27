import * as vscode from 'vscode';
import { publishExclusionRanges, getLastExclusionRanges } from './exclusionBus';
import { COLOR_SCHEMES_LIGHT, COLOR_SCHEMES_DARK } from './colorSchemes';
import { getExplicitSetting } from './configUtils';

let regionDecorationType: vscode.TextEditorDecorationType | null = null;
let lastRegionColor: string | null = null;
let cachedRegions: vscode.Range[] = [];

// 允许“行尾注释里的标记”，大小写不敏感
// 例：code ... // #region 费用明细弹窗
//      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ← 只要这一段出现即可
const REGION_OPEN_RE  = /\/\/\s*#region\b(?:\s+(.+?))?\s*$/i;
const REGION_CLOSE_RE = /\/\/\s*#endregion\b(?:\s+(.+?))?\s*$/i;

// --- 事件：region 变化（供外部需要时订阅；当前由 extension.ts 统一刷新） ---
const _regionEmitter = new vscode.EventEmitter<void>();
export const onRegionsChanged = _regionEmitter.event;

function isDarkTheme(): boolean {
  const themeKind = vscode.window.activeColorTheme.kind;
  return themeKind === vscode.ColorThemeKind.Dark || themeKind === vscode.ColorThemeKind.HighContrast;
}

// 颜色格式化：支持多种颜色格式
// 支持格式：#eef, #ffeeff, rgb(1,1,1), rgba(1,1,1,0.5)
function formatColor(color: string): string {
  // 如果已经有透明度（rgba），直接返回
  if (color.includes('rgba')) {
    return color;
  }
  
  // 如果是 rgb 格式，转换为 rgba 并添加默认透明度 1
  const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
  if (rgbMatch) {
    const r = rgbMatch[1];
    const g = rgbMatch[2];
    const b = rgbMatch[3];
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }
  
  // 处理十六进制颜色
  let hexColor = color;
  // 处理短格式 #eef 转换为 #eeeeff
  if (color.match(/^#([0-9a-fA-F]{3})$/i)) {
    const short = color.slice(1);
    hexColor = `#${short[0]}${short[0]}${short[1]}${short[1]}${short[2]}${short[2]}`;
  }
  
  // 处理完整格式十六进制 #ffeeff 或 #00ccff
  const fullHexMatch = hexColor.match(/^#([0-9a-fA-F]{6})$/i);
  if (fullHexMatch) {
    // 转换为 RGBA 格式，添加默认透明度 1
    const hex = fullHexMatch[1];
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }
  
  // 其他格式直接返回
  return color;
}
let lastThemeKind: vscode.ColorThemeKind | null = null;

// 仅左侧细条，不涂底色
// 确保装饰类型
let lastConfigString: string = '';

function ensureDecorationType(forceRecreate: boolean = false): vscode.TextEditorDecorationType {
  const config = vscode.workspace.getConfiguration('codehue');
  const explicitRegionColor = config.get<string>('regionColor');
  
  // 👇 生成配置指纹，包含所有影响颜色的因素
  const currentConfigString = JSON.stringify({
    regionColor: explicitRegionColor,
    colorScheme: config.get<string>('colorScheme'),
    themeKind: vscode.window.activeColorTheme.kind
  });
  
  let rawColor = explicitRegionColor && explicitRegionColor.trim() !== ''
    ? explicitRegionColor
    : undefined;

  if (!rawColor) {
    const schemeName = config.get<string>('colorScheme', 'vibrant');
    const schemes = isDarkTheme() ? COLOR_SCHEMES_DARK : COLOR_SCHEMES_LIGHT;
    const scheme = schemes[schemeName] || schemes.vibrant;
    rawColor = scheme['region'] || 'rgba(76, 175, 80, 0.12)';
  }
  
  const regionColor = formatColor(rawColor);
  
  console.log('[CodeHue] 读取 regionColor 配置:', rawColor);
  console.log('[CodeHue] 格式化后的颜色:', regionColor);
  
  // 👇 关键改动：配置指纹变化或强制重建时，重新创建
  if (!regionDecorationType || lastConfigString !== currentConfigString || forceRecreate) {
    console.log('[CodeHue] 重新创建装饰类型'); // 👈 添加日志确认是否重建
    
    if (regionDecorationType) {
      regionDecorationType.dispose();
    }
    
    regionDecorationType = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: regionColor,
      overviewRulerColor: regionColor,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    });
    
    lastRegionColor = regionColor;
    lastConfigString = currentConfigString;
  }
  
  return regionDecorationType!;
}

// 统一把标签做“可宽松匹配”的规范化
// 规范化标签
function normLabel(raw?: string | null): string {
  if (!raw) return '__default__';
  return raw
    .replace(/\u3000/g, ' ')      // 全角空格 -> 半角
    .trim()
    .replace(/\s+/g, ' ')         // 多空格合一
    .toLowerCase();
}

// 行 -> 覆盖整行（到行末），不吃下一行的列0
// 行范围
function lineRange(doc: vscode.TextDocument, startLine: number, endLine: number): vscode.Range {
  const start = new vscode.Position(startLine, 0);
  const end = new vscode.Position(endLine, doc.lineAt(endLine).range.end.character);
  return new vscode.Range(start, end);
}

/**
 * 解析配对的 region 段：
 * - 支持行尾注释里的 #region / #endregion
 * - 标签大小写/多空格不敏感；无标签的 #endregion 关闭最近一次 #region
 * - 结果区间包含两端标记行
 */
// 解析区域
function parseRegions(doc: vscode.TextDocument): vscode.Range[] {
  type Frame = { label: string; line: number };
  const stack: Frame[] = [];
  const out: vscode.Range[] = [];

  for (let i = 0; i < doc.lineCount; i++) {
    const text = doc.lineAt(i).text;

    // 优先判断 close；避免同一行先 open 后 close 的极端写法导致顺序问题
    const closeM = text.match(REGION_CLOSE_RE);
    if (closeM) {
      const lbl = normLabel(closeM[1] ?? null);
      if (stack.length) {
        if (lbl === '__default__') {
          // 无标签：关最近一次
          const frame = stack.pop()!;
          out.push(lineRange(doc, frame.line, i));
        } else {
          // 有标签：从栈顶往上找最近的同标签
          let idx = -1;
          for (let k = stack.length - 1; k >= 0; k--) {
            if (stack[k].label === lbl) { idx = k; break; }
          }
          if (idx >= 0) {
            const frame = stack.splice(idx, 1)[0];
            out.push(lineRange(doc, frame.line, i));
          }
          // 若未找到同标签，忽略该 close（容错）
        }
      }
      continue; // 若同一行既有 close 又有 open，优先 close；下一轮再处理 open
    }

    const openM = text.match(REGION_OPEN_RE);
    if (openM) {
      const lbl = normLabel(openM[1] ?? null);
      stack.push({ label: lbl, line: i });
      continue;
    }
  }

  // 未闭合的 #region 直接忽略（不生成区间），让函数装饰来处理该区域

  // 仅保留“外层段”（去掉被完全包裹的嵌套段），避免叠条带
  return outermostOnly(sortByStart(out));
}

// 按开始位置排序
function sortByStart(ranges: vscode.Range[]): vscode.Range[] {
  return ranges.slice().sort((a, b) =>
    a.start.line - b.start.line || a.end.line - b.end.line
  );
}

// 仅保留最外层
function outermostOnly(ranges: vscode.Range[]): vscode.Range[] {
  const out: vscode.Range[] = [];
  for (const r of ranges) {
    const last = out[out.length - 1];
    if (!last) { out.push(r); continue; }
    // 若当前完全被上一个覆盖，则跳过（保留外层）
    if (r.start.isAfterOrEqual(last.start) && r.end.isBeforeOrEqual(last.end)) continue;
    // 若有交叠但不包含：把两段分开保留（不再强行合并成“大区间”，避免跨模块）
    if (!r.start.isAfter(last.end) && !r.end.isBefore(last.start)) {
      // 若需要“合并相邻仅空行”可在此加贴边合并逻辑；目前严格分段以避免串色
      if (r.end.isAfter(last.end)) {
        // 防止顺序错乱，直接追加
        out.push(r);
      }
      continue;
    }
    out.push(r);
  }
  return out;
}

// 应用区域装饰
export function applyRegionDecorations(editor: vscode.TextEditor, forceRecreate: boolean = false) {
  const doc = editor.document;
  const dt = ensureDecorationType(forceRecreate); // 🔥 传递 forceRecreate 参数
  cachedRegions = parseRegions(doc);

  // 渲染左侧条
  editor.setDecorations(dt, cachedRegions);
  // 发布排除范围（函数装饰据此做相减）
  publishExclusionRanges(cachedRegions);
  _regionEmitter.fire();
}

// 清理区域装饰
export function disposeRegionDecorations() {
  if (regionDecorationType) {
    regionDecorationType.dispose();
    regionDecorationType = null;
  }
  lastRegionColor = null;
  lastConfigString = ''; // 🔥 清空配置指纹，确保配置变更时能重建装饰
  cachedRegions = [];
}

// // 获取区域抑制范围
// export function getRegionSuppressionRanges(): vscode.Range[] {
//   // 给函数装饰用
//   return cachedRegions.length ? cachedRegions : getLastExclusionRanges();
// }
