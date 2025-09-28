import * as vscode from 'vscode';
import { onExclusionRanges } from './exclusionBus';

let suppressRanges: vscode.Range[] = [];
onExclusionRanges((rs) => { suppressRanges = rs; });

/** 颜色条缓存：不同颜色 → 独立 DecorationType（只画左侧） */
const stripeTypeCache = new Map<string, vscode.TextEditorDecorationType>();
/** 行尾中文语义化注释（虚拟文本，不改源码） */
const annotationType = vscode.window.createTextEditorDecorationType({
  isWholeLine: false,
  rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
  after: {
    margin: '0 0 0 8px',
    color: new vscode.ThemeColor('editorCodeLens.foreground'), // 跟随主题
    // contentText 走每条 DecorationOptions 的 renderOptions 传入
  },
});

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
const PALETTE = ['#FF0000', '#FF7F00', '#FFFF00', '#00C853','#FADB14', '#00E5FF', '#c98bff','#2979FF', '#7C4DFF'];



/**
 * —— 函数范围提取（按花括号外层范围）——
 * - 识别外层函数开始：function 关键字 或 典型的箭头/方法模式后跟 `{`
 * - 通过 { } 计数找到对应的结束行
 * - 仅保留“外层函数”，丢弃被完全包裹的内层（父级优先）
 * - 统一半开区间并收束到“结束行行末”
 */
export function computeFunctionRanges(doc: vscode.TextDocument): vscode.Range[] {
  const ranges: vscode.Range[] = [];
  const maybeFuncStart = (line: string) => {
    const s = line.trim();
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
    }
    if (!foundBrace) continue;

    // 从找到的第一个 '{' 开始做 { } 计数直到闭合
    let open = 0;
    let endLine = braceLine;

    const countBraces = (s: string) => {
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

    countBraces(doc.lineAt(braceLine).text);

    while (open > 0 && endLine + 1 < doc.lineCount) {
      endLine++;
      const done = countBraces(doc.lineAt(endLine).text);
      if (done) break;
    }

    const start = new vscode.Position(i, 0);
    const endChar = doc.lineAt(endLine).range.end.character;
    const end = new vscode.Position(endLine, endChar);
    ranges.push(new vscode.Range(start, end));

    i = endLine; // 跳过函数体
  }

  return dropNested(ranges);
}

/** 父级优先：去掉被完全包裹的内层函数 */
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
      continue; // 内层，丢弃
    }
    out.push(r);
  }
  return out;
}

/** Region 抑制：在 suppress 段内的部分全部裁掉（可能产生“残片”） */
function filterOutSuppressed(ranges: vscode.Range[], suppress: vscode.Range[]): vscode.Range[] {
  if (!suppress.length) return ranges;
  const out: vscode.Range[] = [];
  for (const r of ranges) {
    let pieces: vscode.Range[] = [r];
    for (const s of suppress) {
      const next: vscode.Range[] = [];
      for (const p of pieces) {
        if (p.end.isBeforeOrEqual(s.start) || p.start.isAfterOrEqual(s.end)) {
          next.push(p); // 无相交
          continue;
        }
        // 左残片
        if (p.start.isBefore(s.start)) next.push(new vscode.Range(p.start, s.start));
        // 右残片
        if (p.end.isAfter(s.end))     next.push(new vscode.Range(s.end, p.end));
      }
      pieces = next;
      if (!pieces.length) break;
    }
    out.push(...pieces);
  }
  return out;
}

/** —— 新增 —— 只保留“包含实质代码”的行段，去掉纯空白/注释的行 */
// function splitToCodeSegments(doc: vscode.TextDocument, range: vscode.Range): vscode.Range[] {
//   const startLine = range.start.line;
//   const endLine = range.end.line;
//   const segments: vscode.Range[] = [];

//   let inBlockComment = false;
//   let segStart = -1;

//   const isIgnorableLine = (line: string): boolean => {
//     const t = line.trim();
//     if (t === '') return true;           // 空行
//     if (!inBlockComment && t.startsWith('//')) return true; // 单行注释
//     // 处理块注释开始/结束
//     if (!inBlockComment && t.startsWith('/*') && !t.includes('*/')) {
//       inBlockComment = true;
//       return true;
//     }
//     if (inBlockComment) {
//       if (t.includes('*/')) inBlockComment = false;
//       return true;
//     }
//     // 纯块注释一行：/* ... */
//     if (/^\/\*.*\*\/$/.test(t)) return true;

//     // 其余当作“有代码”
//     return false;
//   };

//   for (let i = startLine; i <= endLine; i++) {
//     const text = doc.lineAt(i).text;
//     const ignorable = isIgnorableLine(text);

//     if (ignorable) {
//       if (segStart !== -1) {
//         // 关闭当前代码段（收束到上一行行末）
//         const endChar = doc.lineAt(i - 1).range.end.character;
//         segments.push(new vscode.Range(new vscode.Position(segStart, 0), new vscode.Position(i - 1, endChar)));
//         segStart = -1;
//       }
//       continue;
//     }

//     // 有代码
//     if (segStart === -1) segStart = i;
//   }

//   // 文件末尾/range 末尾收尾
//   if (segStart !== -1) {
//     const endChar = doc.lineAt(endLine).range.end.character;
//     segments.push(new vscode.Range(new vscode.Position(segStart, 0), new vscode.Position(endLine, endChar)));
//   }

//   return segments;
// }
/** —— 仅代码段“裁边”版（不在中间切段） —— */
function splitToCodeSegments(doc: vscode.TextDocument, range: vscode.Range): vscode.Range[] {
  const startLine = range.start.line;
  const endLine = range.end.line;

  let first = -1;
  let last = -1;

  let inBlockComment = false;

  const isOnlyPunct = (t: string) => /^[()\[\]{};,]+$/.test(t);
  const isIgnorableLine = (line: string): boolean => {
    const t = line.trim();
    if (t === '') return true;                 // 空行
    if (!inBlockComment && t.startsWith('//')) return true;   // 单行注释
    if (!inBlockComment && t.startsWith('/*') && !t.includes('*/')) { inBlockComment = true; return true; }
    if (inBlockComment) { if (t.includes('*/')) inBlockComment = false; return true; }
    if (/^\/\*.*\*\/$/.test(t)) return true;   // 同行块注释
    if (isOnlyPunct(t)) return true;          // 仅 } , 等
    return false;
  };

  for (let i = startLine; i <= endLine; i++) {
    const raw = doc.lineAt(i).text;
    if (!isIgnorableLine(raw)) {
      if (first === -1) first = i;
      last = i;
    }
  }

  // 整段都是注释/空白：丢弃
  if (first === -1) return [];

  // 仅裁掉首尾的注释/空白，中间保持连续（不分段）
  const endChar = doc.lineAt(last).range.end.character;
  return [new vscode.Range(new vscode.Position(first, 0), new vscode.Position(last, endChar))];
}



/** 把一组范围做“仅裁边”，不拆分中间逻辑 */
function keepCodeOnly(doc: vscode.TextDocument, ranges: vscode.Range[]): vscode.Range[] {
  const out: vscode.Range[] = [];
  for (const r of ranges) {
    const trimmed = splitToCodeSegments(doc, r); // 现在最多返回 0 或 1 段
    if (trimmed.length) out.push(trimmed[0]);
  }
  return out;
}


/** 渲染函数左侧条（不同函数不同颜色；仅左侧，不涂背景） */
export function applyFunctionDecorations(editor: vscode.TextEditor, suppress: vscode.Range[]) {
  const doc = editor.document;

  // 计算外层函数范围
  const all = computeFunctionRanges(doc);
  // Region 优先：把 Region 覆盖的部分去掉（可能产生“夹在两个 region 之间”的残片）
  const visible = filterOutSuppressed(all, suppress);
  // 关键：把这些残片进一步裁成“只包含实质代码”的行段；纯空行/注释段全部丢弃
  const codeOnly = keepCodeOnly(doc, visible);

  // 清空旧的（保证不会残留旧范围）
  stripeTypeCache.forEach((dt) => editor.setDecorations(dt, []));

  // 分配颜色并 set
  const groups = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();
  codeOnly.forEach((r, i) => {
    const color = PALETTE[i % PALETTE.length];
    const dt = getLeftStripeDecoration(color);
    if (!groups.has(dt)) groups.set(dt, []);
    groups.get(dt)!.push(r);
  });

  groups.forEach((ranges, dt) => editor.setDecorations(dt, ranges));
    // —— 新增：中文语义化注释 —— //
  const annotations: vscode.DecorationOptions[] = [];

  // 1) 正常可见或被 Region 压制的“外层函数”，都加注释（Region 内不画条，但有注释）
  const forNoteRanges = all; // 不用 visible，这样 Region 内也会有注释
  for (const r of forNoteRanges) {
    const line = r.start.line;
    const text = extractFunctionLabel(doc, line);
    annotations.push({
      range: new vscode.Range(new vscode.Position(line, doc.lineAt(line).range.end.character), new vscode.Position(line, doc.lineAt(line).range.end.character)),
      renderOptions: { after: { contentText: ` // ${text}` } }
    });
  }

  // 2) 整段被注释掉的“单独方法”，只加注释
  const commented = findCommentedOutFunctionNotes(doc);
  // 同行去重（避免和 1）重复）
  const usedLines = new Set(annotations.map(a => a.range.start.line));
  for (const c of commented) {
    if (!usedLines.has(c.range.start.line)) annotations.push(c);
  }

  editor.setDecorations(annotationType, annotations);

}

export function refreshFunctionDecorations() {
  // 这里留空即可；真正刷新在 extension.ts 里通过 applyAll 触发
}

export function disposeFunctionDecorations() {
  stripeTypeCache.forEach((dt) => dt.dispose());
  stripeTypeCache.clear();
}
/** 提取函数行的中文语义化注释 */
function extractFunctionLabel(doc: vscode.TextDocument, startLine: number): string {
  // 取当前行 + 下一行，容错多行定义
  const l1 = doc.lineAt(startLine).text.trim();
  const l2 = startLine + 1 < doc.lineCount ? doc.lineAt(startLine + 1).text.trim() : '';
  const s = `${l1} ${l2}`;

  // 命名 function
  let m = s.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (m) return `方法：${m[1]}(…)`;

  // 类/对象方法 foo(...) {
  m = s.match(/\b([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
  if (m) return `方法：${m[1]}(…)`;

  // 赋值的箭头函数 const foo = (...) => {
  m = s.match(/\b([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/);
  if (m) return `箭头函数：${m[1]}(…)`;

  // 匿名
  return '匿名函数';
}

/** 扫描“被注释掉的单独方法”行，生成注释装饰（不画条） */
function findCommentedOutFunctionNotes(doc: vscode.TextDocument): vscode.DecorationOptions[] {
  const notes: vscode.DecorationOptions[] = [];
  for (let i = 0; i < doc.lineCount; i++) {
    const raw = doc.lineAt(i).text;
    const t = raw.trim();
    if (!t.startsWith('//')) continue;

    const s = t.replace(/^\/\//, '').trim();
    // 三类：function / 方法定义 / 箭头函数
    if (/\bfunction\b/.test(s) || /\b[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/.test(s) || /[=:\)]\s*=>\s*\{/.test(s)) {
      const label = '（已注释的方法）';
      notes.push({
        range: new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, 0)),
        renderOptions: { after: { contentText: ` ${label}` } }
      });
    }
  }
  return notes;
}

