import * as vscode from 'vscode';
import { onExclusionRanges } from './exclusionBus';
import { extractFunctionLabel, translateFunctionNameToChinese, translateFunctionNameToChineseSync } from './semanticTranslator';
import { COLOR_SCHEMES_LIGHT, COLOR_SCHEMES_DARK } from './colorSchemes';

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
  },
});

/** 函数解析缓存：文档URI → 解析结果 */
const functionCache = new Map<string, { ranges: vscode.Range[], version: number }>();

// 获取左侧条纹装饰
function getLeftStripeDecoration(color: string) {
  const config = vscode.workspace.getConfiguration('codehue');
  const stripeWidth = config.get<string>('stripeWidth', '3px');
  const cacheKey = `${color}-${stripeWidth}`;
  
  if (stripeTypeCache.has(cacheKey)) return stripeTypeCache.get(cacheKey)!;
  const dt = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    borderStyle: 'solid',
    borderColor: color,
    borderWidth: `0 0 0 ${stripeWidth}`,
    overviewRulerColor: color,
    overviewRulerLane: vscode.OverviewRulerLane.Left,
  });
  stripeTypeCache.set(cacheKey, dt);
  return dt;
}


/** 检测当前主题是否为暗色 */
function isDarkTheme(): boolean {
  const themeKind = vscode.window.activeColorTheme.kind;
  return themeKind === vscode.ColorThemeKind.Dark || themeKind === vscode.ColorThemeKind.HighContrast;
}

/** 获取当前配置的颜色方案（根据主题自动适配） */
function getColorScheme(): Record<string, string> {
  const config = vscode.workspace.getConfiguration('codehue');
  const schemeName = config.get<string>('colorScheme', 'vibrant');
  const schemes = isDarkTheme() ? COLOR_SCHEMES_DARK : COLOR_SCHEMES_LIGHT;
  return schemes[schemeName] || schemes.vibrant;
}

/** React Hooks 关键字列表 - 包含所有官方 Hooks */
const HOOK_KEYWORDS = [
  'useEffect',
  'useState',
  'useMemo',
  'useCallback',
  'useRef',
  'useReducer',
  'useLayoutEffect',
  'useContext',
  'useImperativeHandle',
  'useDebugValue',
  'useDeferredValue',
  'useTransition',
  'useId',
  'useSyncExternalStore',
  'useInsertionEffect'
] as const;

type HookKeyword = typeof HOOK_KEYWORDS[number];

/**
 * 检测一行或多行文本中是否包含 Hook 调用
 * 支持各种模式:
 * - useEffect(() => {})
 * - React.useEffect(() => {})
 * - useEffect(function() {})
 * - useEffect(async () => {})
 */
function detectHookInText(text: string): HookKeyword | undefined {
  const normalized = text.replace(/\s+/g, ' ').trim();
  
  for (const hook of HOOK_KEYWORDS) {
    // 匹配 hook 名称后跟开括号，支持可选的 React. 前缀
    const pattern = new RegExp(`(?:React\\.)?${hook}\\s*\\(`, 'i');
    if (pattern.test(normalized)) {
      return hook.toLowerCase() as HookKeyword;
    }
  }
  
  return undefined;
}

/**
 * 判断是否是裸箭头函数的开始
 */
function isLikelyBareArrowStart(line: string): boolean {
  const trimmed = line.trim();
  return /^(?:async\s+)?(?:\/\*.*?\*\/)?\s*\([^)]*\)\s*=>\s*\{/.test(trimmed);
}

/**
 * 检查某行是否是数组方法链式调用的一部分
 * 这些不应该被识别为独立函数
 */
function isArrayMethodChain(doc: vscode.TextDocument, lineIndex: number): boolean {
  // 向上查找几行，看是否有数组方法调用
  const maxLookback = 5;
  let currentLine = lineIndex;
  
  for (let i = 0; i < maxLookback && currentLine >= 0; currentLine--, i++) {
    const text = doc.lineAt(currentLine).text.trim();
    
    // 如果找到数组方法（.map, .filter 等），说明是链式调用
    if (/\.(map|filter|forEach|reduce|find|some|every|sort|flatMap|reduceRight|findIndex)\s*\(/.test(text)) {
      return true;
    }
    
    // 如果遇到语句结束或新的赋值，停止查找
    if (/^(const|let|var|return|if|while|for)\s/.test(text) || /;\s*$/.test(text)) {
      // 但要检查这一行本身是否包含数组方法
      if (/\.(map|filter|forEach|reduce|find|some|every|sort|flatMap|reduceRight|findIndex)\s*\(/.test(text)) {
        return true;
      }
      break;
    }
    
    // 如果这行以点开头，继续向上查找（链式调用）
    if (!text.startsWith('.')) {
      // 检查这一行是否有数组方法
      if (/\.(map|filter|forEach|reduce|find|some|every|sort|flatMap|reduceRight|findIndex)\s*\(/.test(text)) {
        return true;
      }
      break;
    }
  }
  
  return false;
}

/**
 * 向上回溯查找 Hook 上下文
 * 当遇到裸箭头函数时使用
 * 增强版：排除数组方法链式调用
 */
function lookupHookAbove(doc: vscode.TextDocument, startLine: number): HookKeyword | undefined {
  const maxLookback = 8;
  let checkedLines = 0;
  let accumulatedText = '';
  let inBlockComment = false;

  for (let line = startLine - 1; line >= 0 && checkedLines < maxLookback; line--) {
    const raw = doc.lineAt(line).text;
    const trimmed = raw.trim();

    if (!trimmed) continue;

    // 处理块注释
    if (inBlockComment) {
      if (trimmed.includes('/*')) inBlockComment = false;
      continue;
    }
    if (trimmed.includes('*/')) {
      inBlockComment = true;
      continue;
    }

    // 跳过单行注释
    if (trimmed.startsWith('//')) continue;

    checkedLines++;
    
    // 检查是否遇到数组方法 - 如果是，立即停止并返回 undefined
    if (/\.(map|filter|forEach|reduce|find|some|every|sort|flatMap|reduceRight|findIndex)\s*\(/.test(trimmed)) {
      return undefined;
    }
    
    // 累积文本
    accumulatedText = trimmed + ' ' + accumulatedText;

    // 检测累积的文本中是否包含 Hook
    const hook = detectHookInText(accumulatedText);
    if (hook) return hook;

    // 如果遇到明显的语句开始（const/let/var/return 等），停止回溯
    if (/^(const|let|var|return|if|while|for|function)\s/.test(trimmed)) {
      break;
    }
    
    // 如果遇到分号或大括号结束，停止回溯
    if (/[;{}]\s*$/.test(trimmed)) {
      break;
    }
  }

  return undefined;
}

/**
 * 根据函数名和上下文识别函数类型
 */
function getFunctionType(doc: vscode.TextDocument, startLine: number): string {
  const currentLine = doc.lineAt(startLine).text;
  const trimmed = currentLine.trim();
  const nextLine = startLine + 1 < doc.lineCount ? doc.lineAt(startLine + 1).text : '';
  const combined = `${currentLine} ${nextLine}`;

  // 0. 优先检查：如果是数组方法链式调用的一部分，直接返回 'array-callback'
  if (isArrayMethodChain(doc, startLine)) {
    return 'array-callback';
  }

  // 1. 检查 JSX 内联函数（需要过滤掉）
  const jsxEventPattern = /\b(onClick|onChange|onSubmit|onFocus|onBlur|onMouse|onKey|onLoad|onError|onScroll|onResize|onTouch|onInput|onSelect|onContextMenu|onDrag|onDrop|onWheel|onAnimation|onTransition)\s*=\s*\{/i;
  if (jsxEventPattern.test(combined)) {
    return 'jsx-inline';
  }

  // 2. 检查当前行本身是否包含数组方法回调（单行形式）
  if (/\.(map|filter|forEach|reduce|find|some|every|sort|flatMap|reduceRight|findIndex)\s*\(\s*\([^)]*\)\s*=>\s*\{/.test(combined)) {
    return 'array-callback';
  }

  // 3. 检查当前行是否直接包含 Hook 调用
  const directHook = detectHookInText(currentLine);
  if (directHook) return directHook;

  // 4. 检查跨行的 Hook 调用
  const combinedHook = detectHookInText(combined);
  if (combinedHook) return combinedHook;

  // 5. 如果是裸箭头函数，向上回溯查找 Hook 上下文（已增强，会排除数组方法）
  if (isLikelyBareArrowStart(trimmed)) {
    const hookFromAbove = lookupHookAbove(doc, startLine);
    if (hookFromAbove) return hookFromAbove;
  }

  // 6. 检查 React 组件（大写字母开头的函数）
  const componentPattern = /\b(?:function\s+([A-Z][A-Za-z_$]*)|(?:const|let|var)\s+([A-Z][A-Za-z_$]*)\s*=)/;
  if (componentPattern.test(combined)) return 'component';

  // 7. 检查事件处理函数（handle, on 开头）
  if (/\b(handle|on)[A-Z][a-zA-Z_$]/.test(combined)) return 'handler';

  // 8. 检查 region 标注
  if (combined.includes('#region')) return 'region';

  return 'default';
}

/**
 * 计算函数范围（带缓存）
 */
export function computeFunctionRanges(doc: vscode.TextDocument): vscode.Range[] {
  const docUri = doc.uri.toString();
  const docVersion = doc.version;
  
  // 检查缓存
  const cached = functionCache.get(docUri);
  if (cached && cached.version === docVersion) {
    return cached.ranges;
  }
  
  const ranges: vscode.Range[] = [];
  
  // 预编译正则表达式
  const commentPattern = /^\s*(\/\/|\*|\/\*)/;
  const controlFlowPattern = /\b(if|else|while|for|switch|catch|with|try)\s*\(/;
  const functionPattern = /\bfunction\b/;
  const constArrowPattern = /\b(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*(?::[^=]+)?=\s*(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::[^=>{]+)?\s*=>/;
  const assignArrowPattern = /\b[A-Za-z_$][\w$]*\s*(?::[^=]+)?=\s*(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::[^=>{]+)?\s*=>/;
  const genericArrowPattern = /[=:\)]\s*=>/;
  // 变量赋值 + 回调箭头函数作为参数的启发式检测
  const assignedWithCallbackPattern = /\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*(?::[^=]+)?=\s*[^;]*\([^)]*\)\s*=>/;
  const methodPattern = /^(?:async\s+)?[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/;
  const objectMethodPattern = /[:,]\s*(?:async\s+)?[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/;
  // Hook 调用模式：匹配任何 useXxx( 格式
  const hookCallPattern = /\b(?:React\.)?use[A-Z]\w*\s*\(/;
  const hookAssignedPattern = /\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:React\.)?use[A-Z]\w*\s*\(/;

  const maybeFuncStart = (line: string, lineIndex: number) => {
    const s = line.trim();
    if (commentPattern.test(s)) return false;
    if (controlFlowPattern.test(s)) return false;
    
    // 如果匹配到 genericArrowPattern，需要额外检查是否是数组方法链式调用
    if (genericArrowPattern.test(s)) {
      // 检查是否是数组方法的回调
      if (isArrayMethodChain(doc, lineIndex)) {
        return false;
      }
    }
    
    return (
      functionPattern.test(s) ||
      constArrowPattern.test(s) ||
      assignArrowPattern.test(s) ||
      genericArrowPattern.test(s) ||
      methodPattern.test(s) ||
      objectMethodPattern.test(s) ||
      hookCallPattern.test(s) ||
      hookAssignedPattern.test(s) ||
      assignedWithCallbackPattern.test(s)
    );
  };

  for (let i = 0; i < doc.lineCount; i++) {
    const text = doc.lineAt(i).text;
    if (!maybeFuncStart(text, i)) continue;

    // 查找第一个 '{'
    let braceLine = i;
    let foundBrace = text.includes('{');
    
    // 允许跨行查找（最多 5 行）
    let lookAhead = 0;
    while (!foundBrace && braceLine + 1 < doc.lineCount && lookAhead < 5) {
      braceLine++;
      lookAhead++;
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

  const result = dropNested(ranges);
  
  // 缓存结果
  functionCache.set(docUri, { ranges: result, version: docVersion });
  
  // 限制缓存大小
  if (functionCache.size > 50) {
    const firstKey = functionCache.keys().next().value;
    if (firstKey) functionCache.delete(firstKey);
  }
  
  return result;
}

/** 父级优先：去掉被完全包裹的内层函数 */
function dropNested(ranges: vscode.Range[]): vscode.Range[] {
  const sorted = ranges.slice().sort((a, b) =>
    a.start.line - b.start.line || a.end.line - b.end.line
  );
  const out: vscode.Range[] = [];
  for (const r of sorted) {
    while (out.length &&
           r.start.isAfterOrEqual(out[out.length - 1].start) &&
           r.end.isBeforeOrEqual(out[out.length - 1].end)) {
      out.pop();
    }
    out.push(r);
  }
  return out;
}

/** Region 抑制：在 suppress 段内的部分全部裁掉 */
function filterOutSuppressed(ranges: vscode.Range[], suppress: vscode.Range[]): vscode.Range[] {
  if (!suppress.length) return ranges;
  const out: vscode.Range[] = [];
  for (const r of ranges) {
    let pieces: vscode.Range[] = [r];
    for (const s of suppress) {
      const next: vscode.Range[] = [];
      for (const p of pieces) {
        if (p.end.isBeforeOrEqual(s.start) || p.start.isAfterOrEqual(s.end)) {
          next.push(p);
          continue;
        }
        if (p.start.isBefore(s.start)) next.push(new vscode.Range(p.start, s.start));
        if (p.end.isAfter(s.end)) next.push(new vscode.Range(s.end, p.end));
      }
      pieces = next;
      if (!pieces.length) break;
    }
    out.push(...pieces);
  }
  return out;
}

/** 分割为代码段（仅裁边，不在中间切段） */
function splitToCodeSegments(doc: vscode.TextDocument, range: vscode.Range): vscode.Range[] {
  const startLine = range.start.line;
  const endLine = range.end.line;

  let first = -1;
  let last = -1;
  let inBlockComment = false;

  const isOnlyPunct = (t: string) => /^[()\[\]{};,]+$/.test(t);
  const isIgnorableLine = (line: string): boolean => {
    const t = line.trim();
    if (t === '') return true;
    if (!inBlockComment && t.startsWith('//')) return true;
    if (!inBlockComment && t.startsWith('/*') && !t.includes('*/')) {
      inBlockComment = true;
      return true;
    }
    if (inBlockComment) {
      if (t.includes('*/')) inBlockComment = false;
      return true;
    }
    if (/^\/\*.*\*\/$/.test(t)) return true;
    if (isOnlyPunct(t) && !t.includes('}')) return true;
    return false;
  };

  for (let i = startLine; i <= endLine; i++) {
    const raw = doc.lineAt(i).text;
    if (!isIgnorableLine(raw)) {
      if (first === -1) first = i;
      last = i;
    }
  }

  if (first === -1) return [];

  const endChar = doc.lineAt(last).range.end.character;
  return [new vscode.Range(new vscode.Position(first, 0), new vscode.Position(last, endChar))];
}

/** 把一组范围做"仅裁边"，不拆分中间逻辑 */
function keepCodeOnly(doc: vscode.TextDocument, ranges: vscode.Range[]): vscode.Range[] {
  const out: vscode.Range[] = [];
  for (const r of ranges) {
    const trimmed = splitToCodeSegments(doc, r);
    if (trimmed.length) out.push(trimmed[0]);
  }
  return out;
}

/**
 * 预加载所有函数的翻译（异步，在后台进行）
 */
async function preloadTranslations(doc: vscode.TextDocument, ranges: vscode.Range[]): Promise<void> {
  const config = vscode.workspace.getConfiguration('codehue');
  const translationMode = config.get<string>('translationMode', 'ai');
  const apiKey = config.get<string>('deepseekApiKey', '');

  // 只在 AI 模式且配置了 API Key 时预加载
  if (translationMode !== 'ai' || !apiKey) {
    return;
  }

  // 提取所有函数名
  const functionNames: string[] = [];
  for (const r of ranges) {
    const line = r.start.line;
    const l1 = doc.lineAt(line).text.trim();
    const l2 = line + 1 < doc.lineCount ? doc.lineAt(line + 1).text.trim() : '';
    const s = `${l1} ${l2}`;

    let functionName = '';
    let m = s.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (m) functionName = m[1];

    if (!functionName) {
      m = s.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/);
      if (m) functionName = m[1];
    }

    if (!functionName) {
      m = s.match(/\b([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/);
      if (m) functionName = m[1];
    }

    if (!functionName) {
      m = s.match(/^(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
      if (m) functionName = m[1];
    }

    if (!functionName) {
      m = s.match(/[:,]\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
      if (m) functionName = m[1];
    }

    if (functionName && functionName !== 'anonymous') {
      functionNames.push(functionName);
    }
  }

  // 在后台批量预加载翻译
  const promises = functionNames.map(name => 
    translateFunctionNameToChinese(name).catch(err => {
      // 静默失败，不影响主流程
      console.debug(`预加载翻译失败: ${name}`, err);
    })
  );

  // 并发限制：每次最多处理 10 个
  const batchSize = 10;
  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize);
    await Promise.allSettled(batch);
  }
}

/** 渲染函数左侧条（不同函数不同颜色；仅左侧，不涂背景） */
export function applyFunctionDecorations(editor: vscode.TextEditor, suppress: vscode.Range[]) {
  const doc = editor.document;

  // 性能检查：跳过过大的文件
  if (doc.lineCount > 10000) return;

  const all = computeFunctionRanges(doc);
  const visible = filterOutSuppressed(all, suppress);
  const codeOnly = keepCodeOnly(doc, visible);

  // 在后台预加载翻译（不阻塞渲染）
  preloadTranslations(doc, all).catch(err => {
    console.debug('预加载翻译失败', err);
  });

  // 清空旧的
  stripeTypeCache.forEach((dt) => editor.setDecorations(dt, []));

  // 分配颜色并设置装饰
  const groups = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();
  const colorScheme = getColorScheme();
  
  codeOnly.forEach((r) => {
    const functionType = getFunctionType(doc, r.start.line);
    
    // 跳过 JSX 内联函数和数组回调函数
    if (functionType === 'jsx-inline' || functionType === 'array-callback') {
      return;
    }
    
    const color = colorScheme[functionType] || colorScheme['default'];
    const dt = getLeftStripeDecoration(color);
    if (!groups.has(dt)) groups.set(dt, []);
    groups.get(dt)!.push(r);
  });

  groups.forEach((ranges, dt) => editor.setDecorations(dt, ranges));

  // 中文语义化注释（受配置控制）
  const config = vscode.workspace.getConfiguration('codehue');
  const enableSemanticComments = config.get<boolean>('enableSemanticComments', true);
  
  const annotations: vscode.DecorationOptions[] = [];

  if (enableSemanticComments) {
    for (const r of all) {
      const line = r.start.line;
      const chineseLabel = extractFunctionLabel(doc, line);
      
      const targetLine = line > 0 ? line - 1 : line;
      const targetPos = doc.lineAt(targetLine).range.end;
      annotations.push({
        range: new vscode.Range(targetPos, targetPos),
        renderOptions: { after: { contentText: ` // ${chineseLabel}` } }
      });
    }

    // 整段被注释掉的函数
    const commented = findCommentedOutFunctionNotes(doc);
    const usedLines = new Set(annotations.map(a => a.range.start.line));
    for (const c of commented) {
      if (!usedLines.has(c.range.start.line)) annotations.push(c);
    }
  }

  editor.setDecorations(annotationType, annotations);
}

export function refreshFunctionDecorations() {
  // 留空，真正刷新在 extension.ts 里通过 applyAll 触发
}

export function disposeFunctionDecorations() {
  stripeTypeCache.forEach((dt) => dt.dispose());
  stripeTypeCache.clear();
  functionCache.clear();
}

/** 自动为函数添加中文注释 */
export function addFunctionComments(editor: vscode.TextEditor) {
  const doc = editor.document;
  const edit = new vscode.WorkspaceEdit();
  
  let addedComments = 0;
  const keywords = /\b(if|else|while|for|switch|catch|with)\s*\(/;
  
  for (let i = 0; i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text.trim();
    
    if (!line || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) {
      continue;
    }
    
    if (keywords.test(line)) continue;
    
    let functionName = '';
    
    let match = line.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) functionName = match[1];
    
    if (!functionName) {
      match = line.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/);
      if (match) functionName = match[1];
    }
    
    if (!functionName) {
      match = line.match(/\b([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/);
      if (match) functionName = match[1];
    }
    
    if (!functionName) {
      match = line.match(/\basync\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
      if (match) functionName = match[1];
    }
    
    if (!functionName) {
      match = line.match(/^([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
      if (match) functionName = match[1];
    }
    
    if (!functionName) {
      match = line.match(/[:,]\s*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
      if (match) functionName = match[1];
    }
    
    if (functionName) {
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
function findCommentedOutFunctionNotes(doc: vscode.TextDocument): vscode.DecorationOptions[] {
  const notes: vscode.DecorationOptions[] = [];
  for (let i = 0; i < doc.lineCount; i++) {
    const raw = doc.lineAt(i).text;
    const t = raw.trim();
    if (!t.startsWith('//')) continue;

    const s = t.replace(/^\/\//, '').trim();
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