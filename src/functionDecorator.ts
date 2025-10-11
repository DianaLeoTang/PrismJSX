import * as vscode from 'vscode';
import { onExclusionRanges } from './exclusionBus';
import { extractFunctionLabel, translateFunctionNameToChinese } from './semanticTranslator';

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

// 获取左侧条纹装饰
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
// 计算函数范围
export function computeFunctionRanges(doc: vscode.TextDocument): vscode.Range[] {
  const ranges: vscode.Range[] = [];
  const maybeFuncStart = (line: string) => {
  const s = line.trim();
  if (s.startsWith('//') || s.startsWith('*') || s.startsWith('/*')) return false;
  
  // 需要排除的关键字（控制流语句等）
  const keywords = /\b(if|else|while|for|switch|catch|with)\s*\(/;
  if (keywords.test(s)) return false;
  
  return (
    /\bfunction\b/.test(s) ||                                    // function foo(...) {
    /\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*\([^)]*\)\s*=>\s*\{/.test(s) || // const aa = () => {
    /\b[A-Za-z_$][\w$]*\s*=\s*\([^)]*\)\s*=>\s*\{/.test(s) ||   // aa = () => {
    /[=:\)]\s*=>\s*\{/.test(s) ||                                // 其他箭头函数（如回调）
    // 方法定义：必须在特定上下文中（对象字面量、类、或有修饰符）
    /^(?:async\s+)?[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/.test(s) || // async method() { 或 method() {
    /[:,]\s*(?:async\s+)?[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/.test(s) // 对象方法: foo: function() { 或 { method() {
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
  }

  return dropNested(ranges);
}

/** 父级优先：去掉被完全包裹的内层函数 */
// 删除嵌套范围
function dropNested(ranges: vscode.Range[]): vscode.Range[] {
  const sorted = ranges.slice().sort((a, b) =>
    a.start.line - b.start.line || a.end.line - b.end.line
  );
  const out: vscode.Range[] = [];
  for (const r of sorted) {
    while (out.length &&
           r.start.isAfterOrEqual(out[out.length - 1].start) &&
           r.end.isBeforeOrEqual(out[out.length - 1].end)) {
      out.pop(); // 去掉父级，保留内层
    }
    out.push(r);
  }
  return out;
}

/** Region 抑制：在 suppress 段内的部分全部裁掉（可能产生“残片”） */
// 过滤掉被抑制的范围
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
/** —— 仅代码段“裁边”版（不在中间切段） —— */
// 分割为代码段
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
    // 不要忽略只包含 } 的行，因为这是函数结束花括号
    if (isOnlyPunct(t) && !t.includes('}')) return true;  // 仅其他标点符号，但不包括 }
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
// 仅保留代码
function keepCodeOnly(doc: vscode.TextDocument, ranges: vscode.Range[]): vscode.Range[] {
  const out: vscode.Range[] = [];
  for (const r of ranges) {
    const trimmed = splitToCodeSegments(doc, r); // 现在最多返回 0 或 1 段
    if (trimmed.length) out.push(trimmed[0]);
  }
  return out;
}


/** 渲染函数左侧条（不同函数不同颜色；仅左侧，不涂背景） */
// 应用函数装饰
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
    const chineseLabel = extractFunctionLabel(doc, line);
    // 添加这行调试
    console.log(`Line ${line}: ${doc.lineAt(line).text.trim()} -> ${chineseLabel}`);
    
    const targetLine = line > 0 ? line - 1 : line;
    const targetPos = doc.lineAt(targetLine).range.end;
    annotations.push({
      range: new vscode.Range(targetPos, targetPos),
      renderOptions: { after: { contentText: ` // ${chineseLabel}` } }
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

// 刷新函数装饰
export function refreshFunctionDecorations() {
  // 这里留空即可；真正刷新在 extension.ts 里通过 applyAll 触发
}

// 清理函数装饰
export function disposeFunctionDecorations() {
  stripeTypeCache.forEach((dt) => dt.dispose());
  stripeTypeCache.clear();
}
/** 提取函数行的中文语义化注释 */
// 提取函数标签
// function extractFunctionLabel(doc: vscode.TextDocument, startLine: number): string {
//   const l1 = doc.lineAt(startLine).text.trim();
//   const l2 = startLine + 1 < doc.lineCount ? doc.lineAt(startLine + 1).text.trim() : '';
//   const s = `${l1} ${l2}`;

//   // 命名 function
//   let m = s.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/);
//   if (m) return `方法：${m[1]}(…)`;

//   // const/let/var 声明的箭头函数
//   m = s.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/);
//   if (m) return `箭头函数：${m[1]}(…)`;

//   // 赋值的箭头函数（无 const/let/var）
//   m = s.match(/\b([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/);
//   if (m) return `箭头函数：${m[1]}(…)`;

//   // async 方法
//   m = s.match(/\basync\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
//   if (m) return `异步方法：${m[1]}(…)`;

//   // 类/对象方法 foo(...) { （在行首或冒号/逗号后）
//   m = s.match(/^([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
//   if (m) return `方法：${m[1]}(…)`;
  
//   m = s.match(/[:,]\s*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
//   if (m) return `方法：${m[1]}(…)`;

//   // 匿名
//   return '匿名函数';
// }

/** 自动为函数添加中文注释 */
// 为函数添加中文注释
export function addFunctionComments(editor: vscode.TextEditor) {
  const doc = editor.document;
  const edit = new vscode.WorkspaceEdit();
  
  let addedComments = 0;
  
  // 需要排除的关键字
  const keywords = /\b(if|else|while|for|switch|catch|with)\s*\(/;
  
  for (let i = 0; i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text.trim();
    
    // 跳过空行和注释行
    if (!line || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) {
      continue;
    }
    
    // 排除控制流语句
    if (keywords.test(line)) {
      continue;
    }
    
    let functionName = '';
    
    // function 声明
    let match = line.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) functionName = match[1];
    
    // const/let/var 箭头函数
    if (!functionName) {
      match = line.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/);
      if (match) functionName = match[1];
    }
    
    // 赋值箭头函数
    if (!functionName) {
      match = line.match(/\b([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/);
      if (match) functionName = match[1];
    }
    
    // async 方法
    if (!functionName) {
      match = line.match(/\basync\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
      if (match) functionName = match[1];
    }
    
    // 对象方法或类方法（在行首或有前置符号）
    if (!functionName) {
      match = line.match(/^([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
      if (match) functionName = match[1];
    }
    
    if (!functionName) {
      match = line.match(/[:,]\s*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
      if (match) functionName = match[1];
    }
    
    if (functionName) {
      // 检查函数上方是否已有注释
      const hasComment = i > 0 && (
        doc.lineAt(i - 1).text.trim().startsWith('//') ||
        doc.lineAt(i - 1).text.trim().startsWith('/*') ||
        doc.lineAt(i - 1).text.trim().startsWith('*')
      );
      
      if (!hasComment) {
        const comment = `// ${functionName}`;
        const insertPosition = new vscode.Position(i, 0);
        edit.insert(doc.uri, insertPosition, comment + '\n');
        addedComments++;
      }
    }
  }
  
  if (edit.size > 0) {
    vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage(`成功为 ${addedComments} 个函数添加了注释`);
  } else {
    vscode.window.showInformationMessage('没有找到需要添加注释的函数');
  }
}

/** 扫描"被注释掉的单独方法"行，生成注释装饰（不画条） */
// 查找被注释掉的函数注释
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
