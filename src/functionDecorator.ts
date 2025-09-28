import * as vscode from 'vscode';
import { onExclusionRanges } from './exclusionBus';

let suppressRanges: vscode.Range[] = [];
onExclusionRanges((rs) => { suppressRanges = rs; });

/** 颜色条缓存：不同颜色 → 独立 DecorationType（只画左侧） */
const stripeTypeCache = new Map<string, vscode.TextEditorDecorationType>();

function getLeftStripeDecoration(color: string) {
  if (stripeTypeCache.has(color)) return stripeTypeCache.get(color)!;
  const dt = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    borderStyle: 'solid',
    borderColor: color,
    borderWidth: '0 0 0 3px',
    overviewRulerColor: color,
    overviewRulerLane: vscode.OverviewRulerLane.Left,
  });
  stripeTypeCache.set(color, dt);
  return dt;
}

/** 简单色板：可替换为你的配色或按语义分配 */
const PALETTE = ['#6bc579', '#51b3ff', '#ffb84d', '#c98bff', '#ff6b6b', '#00c2b2', '#7f8cff'];

/**
 * —— 函数范围提取（最小实现，按花括号外层范围）——
 * - 识别外层函数开始：function 关键字 或 典型的箭头/方法模式后跟 `{`
 * - 通过 { } 计数找到对应的结束行
 * - 仅保留“外层函数”，丢弃被完全包裹的内层（父级优先）
 * - 统一半开区间并收束到“结束行行末”
 */
export function computeFunctionRanges(doc: vscode.TextDocument): vscode.Range[] {
  const ranges: vscode.Range[] = [];
  const maybeFuncStart = (line: string) => {
    const s = line.trim();
    // 非注释的常见函数起点（可按需扩展）
    if (s.startsWith('//') || s.startsWith('*') || s.startsWith('/*')) return false;
    return (
      /\bfunction\b/.test(s) ||                             // function foo(...) {
      /[=:\)]\s*=>\s*\{/.test(s) ||                         // const a = (...) => {
      /\b[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/.test(s)        // foo(...) {
    );
  };

  for (let i = 0; i < doc.lineCount; i++) {
    const text = doc.lineAt(i).text;
    if (!maybeFuncStart(text)) continue;

    // 必须找到本行或后续行的第一个 '{'
    let braceLine = i;
    let foundBrace = text.includes('{');
    while (!foundBrace && braceLine + 1 < doc.lineCount) {
      braceLine++;
      if (doc.lineAt(braceLine).text.includes('{')) {
        foundBrace = true;
        break;
      }
      // 若遇到空行或注释行继续找
    }
    if (!foundBrace) continue;

    // 从找到的第一个 '{' 开始做 { } 计数直到闭合
    let open = 0;
    let endLine = braceLine;

    const countBraces = (s: string) => {
      // 极简计数：不处理字符串/模板内花括号，足以满足多数工程注释/结构上色
      for (let k = 0; k < s.length; k++) {
        const ch = s[k];
        if (ch === '{') open++;
        else if (ch === '}') {
          open--;
          if (open === 0) return true;
        }
      }
      return false;
    };

    // 初始把之前读到的 '{' 计入
    countBraces(doc.lineAt(braceLine).text);

    while (open > 0 && endLine + 1 < doc.lineCount) {
      endLine++;
      const done = countBraces(doc.lineAt(endLine).text);
      if (done) break;
    }

    // 形成范围（首行从 i，尾行收束到 endLine 的行末）
    const start = new vscode.Position(i, 0);
    const endChar = doc.lineAt(endLine).range.end.character;
    const end = new vscode.Position(endLine, endChar);
    ranges.push(new vscode.Range(start, end));

    // 跳过到 endLine，避免在函数体内部再次命中“方法起点”导致重复扫描
    i = endLine;
  }

  // 父级优先：去掉被完全包裹的内层函数（匿名/回调不再上色）
  return dropNested(ranges);
}

function dropNested(ranges: vscode.Range[]): vscode.Range[] {
  const sorted = ranges.slice().sort((a, b) =>
    a.start.line - b.start.line || a.end.line - b.end.line
  );
  const out: vscode.Range[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last &&
        r.start.isAfterOrEqual(last.start) &&
        r.end.isBeforeOrEqual(last.end)) {
      // 内层，丢弃
      continue;
    }
    out.push(r);
  }
  return out;
}

/** 对函数范围做 Region 抑制：在 suppress 段内的部分全部裁掉 */
function filterOutSuppressed(ranges: vscode.Range[], suppress: vscode.Range[]): vscode.Range[] {
  if (!suppress.length) return ranges;
  const out: vscode.Range[] = [];
  for (const r of ranges) {
    let pieces: vscode.Range[] = [r];
    for (const s of suppress) {
      const next: vscode.Range[] = [];
      for (const p of pieces) {
        // 无相交
        if (p.end.isBeforeOrEqual(s.start) || p.start.isAfterOrEqual(s.end)) {
          next.push(p);
          continue;
        }
        // 左残片
        if (p.start.isBefore(s.start)) {
          next.push(new vscode.Range(p.start, s.start));
        }
        // 右残片
        if (p.end.isAfter(s.end)) {
          next.push(new vscode.Range(s.end, p.end));
        }
      }
      pieces = next;
      if (!pieces.length) break;
    }
    out.push(...pieces);
  }
  return out;
}

/** 渲染函数左侧条（不同函数不同颜色；仅左侧，不涂背景） */
export function applyFunctionDecorations(editor: vscode.TextEditor, suppress: vscode.Range[]) {
  const doc = editor.document;
  // 计算外层函数范围
  const all = computeFunctionRanges(doc);
  // Region 优先：把 Region 覆盖的部分去掉
  const visible = filterOutSuppressed(all, suppress);

  // 清空旧的（保证不会残留旧范围）
  stripeTypeCache.forEach((dt) => editor.setDecorations(dt, []));

  // 分配颜色并 set
  const groups = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();
  visible.forEach((r, i) => {
    const color = PALETTE[i % PALETTE.length];
    const dt = getLeftStripeDecoration(color);
    if (!groups.has(dt)) groups.set(dt, []);
    groups.get(dt)!.push(r);
  });

  groups.forEach((ranges, dt) => editor.setDecorations(dt, ranges));
}

export function refreshFunctionDecorations() {
  // 这里留空即可；真正刷新在 extension.ts 里通过 applyAll 触发
}

export function disposeFunctionDecorations() {
  stripeTypeCache.forEach((dt) => dt.dispose());
  stripeTypeCache.clear();
}
