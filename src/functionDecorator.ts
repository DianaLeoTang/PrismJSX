import * as vscode from 'vscode';
import { onExclusionRanges } from './exclusionBus';
import { extractFunctionLabel, translateFunctionNameToChinese, translateFunctionNameToChineseSync,TranslationPriority } from './semanticTranslator';
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
 * 增强的函数名提取器 - 支持各种箭头函数写法
 * 支持: export const func = (params) => {}
 * 支持: const func = (param = defaultValue) => {}
 * 支持: export const func = () => {}
 * 支持: export const func = (): ReturnType => {
 * 等各种变体
 */
function extractFunctionName(text: string): string {
  // 1. 传统 function 声明: function myFunc() 或 export function myFunc() 或 export async function myFunc()
  let m = text.match(/\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (m) return m[1];

  // 2. const/let/var 箭头函数 - 最宽松的匹配，支持所有变体
  // 匹配: export const getLocationCoord = (needAuth = false) => {
  // 匹配: const func = () => {}
  // 匹配: export const func = async (param: Type = default) => {
  // 匹配: export const initOrderTemplate = (): API.Order.OrderTemplateInfo => {
  // 关键改进：返回类型可以包含点号、泛型等复杂类型
  m = text.match(/\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::\s*[^=>]+)?\s*=>/);
  if (m) return m[1];

  // 3. 简化的箭头函数赋值（无 const/let/var 关键字）
  // 匹配: myFunc = (params) => {}
  m = text.match(/\b([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::\s*[^=>]+)?\s*=>/);
  if (m) return m[1];

  // 4. 对象方法（async 或普通）
  // 匹配: async myMethod() {}
  m = text.match(/^(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
  if (m) return m[1];

  // 5. 对象字面量中的方法
  // 匹配: obj = { myMethod() {} }
  m = text.match(/[:,]\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
  if (m) return m[1];

  return '';
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
  // 增强的箭头函数模式 - 支持默认参数、类型注解、export 等
  // 匹配: export const func = (param = value) => {}
  // 匹配: const func = (a, b = 1) => {}
  // 匹配: const func = () => {}
  // 匹配: export const initOrderTemplate = (): API.Order.OrderTemplateInfo => {
  // 关键：返回类型注解可以包含点号、泛型等复杂结构，所以用 [^=>]+ 而不是 [^=>{]+
  const constArrowPattern = /\b(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*(?::[^=]+)?=\s*(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::\s*[^=>]+)?\s*=>/;
  const assignArrowPattern = /\b[A-Za-z_$][\w$]*\s*(?::[^=]+)?=\s*(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::\s*[^=>]+)?\s*=>/;
  const genericArrowPattern = /[=:\)]\s*=>/;
  // 变量赋值 + 回调箭头函数作为参数的启发式检测
  const assignedWithCallbackPattern = /\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*(?::[^=]+)?=\s*[^;]*\([^)]*\)\s*=>/;
  // 放宽方法检测：仅要求方法名后出现 '('，不要求同一行闭合 ')'
  // 类方法（可含可见性、static、override、async 等）
  const methodPattern = /^(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:override\s+)?(?:async\s+)?[A-Za-z_$][\w$]*\s*\(/;
  // 对象字面量方法（前面可能出现 ':' 或 ',' 连接）
  const objectMethodPattern = /[:,]\s*(?:async\s+)?[A-Za-z_$][\w$]*\s*\(/;
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
    
    // 排除简单的 Hook 变量赋值（如 const outlet = useOutlet();）
    if (hookAssignedPattern.test(s)) {
      // 检查是否是简单的 Hook 调用赋值，如果是则不识别为函数
      const simpleHookMatch = s.match(/^\s*(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:React\.)?use[A-Z]\w*\s*\(\s*\)\s*;?\s*$/);
      if (simpleHookMatch) {
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

    // 改为：先配平参数括号直到匹配到 ')', 再在其后寻找第一个 '{'
    let braceLine = i;
    let foundBrace = false;
    const maxScanLines = 50; // 有界扫描，避免无穷回溯
    let scannedLines = 0;
    let parenDepth = 0;
    let startedParams = false; // 是否已遇到第一个 '('

    // 跨行逐字符扫描
    while (!foundBrace && braceLine < doc.lineCount && scannedLines <= maxScanLines) {
      const lineText = doc.lineAt(braceLine).text;

      for (let idx = 0; idx < lineText.length; idx++) {
        const ch = lineText[idx];

        if (ch === '(') {
          startedParams = true;
          parenDepth++;
        } else if (ch === ')') {
          if (parenDepth > 0) parenDepth--;
        }

        // 只有当未进入参数区或参数已闭合 (parenDepth === 0) 时，遇到 '{' 才视为函数体开始
        if (ch === '{' && (!startedParams || parenDepth === 0)) {
          foundBrace = true;
          break;
        }

        // 如果参数已闭合且遇到分号，说明这不是块体函数（如类型/声明行），提前放弃
        if (ch === ';' && startedParams && parenDepth === 0) {
          foundBrace = false;
          break;
        }
      }

      if (!foundBrace) {
        braceLine++;
        scannedLines++;
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

    const functionName = extractFunctionName(s);
    
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
// export function applyFunctionDecorations(editor: vscode.TextEditor, suppress: vscode.Range[]) {
//   const doc = editor.document;

//   // 性能检查：跳过过大的文件
//   if (doc.lineCount > 10000) return;

//   const all = computeFunctionRanges(doc);
//   const visible = filterOutSuppressed(all, suppress);
//   const codeOnly = keepCodeOnly(doc, visible);

//   // 在后台预加载翻译（不阻塞渲染）
//   preloadTranslations(doc, all).catch(err => {
//     console.debug('预加载翻译失败', err);
//   });

//   // 清空旧的
//   stripeTypeCache.forEach((dt) => editor.setDecorations(dt, []));

//   // 分配颜色并设置装饰
//   const groups = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();
//   const colorScheme = getColorScheme();
  
//   codeOnly.forEach((r) => {
//     const functionType = getFunctionType(doc, r.start.line);
    
//     // 跳过 JSX 内联函数和数组回调函数
//     if (functionType === 'jsx-inline' || functionType === 'array-callback') {
//       return;
//     }
    
//     const color = colorScheme[functionType] || colorScheme['default'];
//     const dt = getLeftStripeDecoration(color);
//     if (!groups.has(dt)) groups.set(dt, []);
//     groups.get(dt)!.push(r);
//   });

//   groups.forEach((ranges, dt) => editor.setDecorations(dt, ranges));

//   // 中文语义化注释（受配置控制）
//   const config = vscode.workspace.getConfiguration('codehue');
//   const enableSemanticComments = config.get<boolean>('enableSemanticComments', true);
  
//   const annotations: vscode.DecorationOptions[] = [];

//   if (enableSemanticComments) {
//     for (const r of all) {
//       const line = r.start.line;
//       const chineseLabel = extractFunctionLabel(doc, line);
      
//       const targetLine = line > 0 ? line - 1 : line;
//       const targetPos = doc.lineAt(targetLine).range.end;
//       annotations.push({
//         range: new vscode.Range(targetPos, targetPos),
//         renderOptions: { after: { contentText: ` // ${chineseLabel}` } }
//       });
//     }

//     // 整段被注释掉的函数
//     const commented = findCommentedOutFunctionNotes(doc);
//     const usedLines = new Set(annotations.map(a => a.range.start.line));
//     for (const c of commented) {
//       if (!usedLines.has(c.range.start.line)) annotations.push(c);
//     }
//   }

//   editor.setDecorations(annotationType, annotations);
// }

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
    
    // 使用统一的函数名提取器
    const functionName = extractFunctionName(line);
    
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

/**
 * 判断某个范围是否在可见区域内
 */
function isRangeVisible(editor: vscode.TextEditor, range: vscode.Range): boolean {
  return editor.visibleRanges.some(visibleRange => 
    range.start.line >= visibleRange.start.line && 
    range.end.line <= visibleRange.end.line
  );
}

/**
 * 判断某个范围是否部分可见
 */
function isRangePartiallyVisible(editor: vscode.TextEditor, range: vscode.Range): boolean {
  return editor.visibleRanges.some(visibleRange => 
    !(range.end.line < visibleRange.start.line || range.start.line > visibleRange.end.line)
  );
}

/**
 * 预加载所有函数的翻译（按优先级分层）
 */
async function preloadTranslationsWithPriority(
  editor: vscode.TextEditor,
  doc: vscode.TextDocument, 
  ranges: vscode.Range[]
): Promise<void> {
  const config = vscode.workspace.getConfiguration('codehue');
  const enableAI = config.get<boolean>('enableAITranslation', true);

  if (!enableAI) {
    return;
  }

  // 判断是否是当前活动编辑器
  const isActiveEditor = vscode.window.activeTextEditor === editor;
  const docUri = doc.uri.toString();

  // 按优先级分类函数
  const visibleFunctions: Array<{ name: string; line: number }> = [];
  const invisibleFunctions: Array<{ name: string; line: number }> = [];
  const otherFileFunctions: Array<{ name: string; line: number }> = [];

  for (const r of ranges) {
    const line = r.start.line;
    const l1 = doc.lineAt(line).text.trim();
    const l2 = line + 1 < doc.lineCount ? doc.lineAt(line + 1).text.trim() : '';
    const s = `${l1} ${l2}`;

    const functionName = extractFunctionName(s);
    
    if (functionName && functionName !== 'anonymous') {
      if (isActiveEditor) {
        // 判断是否在可见区域
        if (isRangePartiallyVisible(editor, r)) {
          visibleFunctions.push({ name: functionName, line });
        } else {
          invisibleFunctions.push({ name: functionName, line });
        }
      } else {
        otherFileFunctions.push({ name: functionName, line });
      }
    }
  }

  console.log(`📊 翻译队列统计 [${doc.fileName}]:`);
  console.log(`  - 可见区域: ${visibleFunctions.length} 个函数`);
  console.log(`  - 不可见区域: ${invisibleFunctions.length} 个函数`);
  console.log(`  - 其他文件: ${otherFileFunctions.length} 个函数`);

  // 按优先级依次加载
  const allPromises: Promise<any>[] = [];

  // 1. 最高优先级：可见区域
  visibleFunctions.forEach(({ name, line }) => {
    allPromises.push(
      translateFunctionNameToChinese(name, TranslationPriority.VISIBLE_CURRENT_FILE, docUri)
        .catch(err => console.debug(`翻译失败 [可见]: ${name}`, err))
    );
  });

  // 2. 中优先级：当前文件不可见区域
  invisibleFunctions.forEach(({ name, line }) => {
    allPromises.push(
      translateFunctionNameToChinese(name, TranslationPriority.INVISIBLE_CURRENT_FILE, docUri)
        .catch(err => console.debug(`翻译失败 [不可见]: ${name}`, err))
    );
  });

  // 3. 低优先级：其他文件
  otherFileFunctions.forEach(({ name, line }) => {
    allPromises.push(
      translateFunctionNameToChinese(name, TranslationPriority.OTHER_OPEN_FILES, docUri)
        .catch(err => console.debug(`翻译失败 [其他]: ${name}`, err))
    );
  });

  // 不等待完成，让翻译在后台异步进行
  Promise.allSettled(allPromises).then(() => {
    console.log(`✓ 完成翻译请求提交 [${doc.fileName}]`);
  });
}

/** 渲染函数左侧条（不同函数不同颜色；仅左侧，不涂背景） */
export function applyFunctionDecorations(editor: vscode.TextEditor, suppress: vscode.Range[]) {
  const doc = editor.document;

  // 性能检查：跳过过大的文件
  if (doc.lineCount > 10000) return;

  const all = computeFunctionRanges(doc);
  const visible = filterOutSuppressed(all, suppress);
  const codeOnly = keepCodeOnly(doc, visible);

  // 🔥 关键修改：使用带优先级的预加载函数
  preloadTranslationsWithPriority(editor, doc, all).catch(err => {
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
    // 判断是否是当前活动编辑器
    const isActiveEditor = vscode.window.activeTextEditor === editor;

    for (const r of all) {
      const line = r.start.line;
      
      // 🔥 关键修改：根据可见性传递优先级
      let priority = TranslationPriority.OTHER_OPEN_FILES;
      if (isActiveEditor) {
        if (isRangePartiallyVisible(editor, r)) {
          priority = TranslationPriority.VISIBLE_CURRENT_FILE;
        } else {
          priority = TranslationPriority.INVISIBLE_CURRENT_FILE;
        }
      }
      
      const chineseLabel = extractFunctionLabel(doc, line, priority);
      
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