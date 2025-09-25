import * as vscode from 'vscode';
import ts from 'typescript';

type Kind = 'function'|'method'|'hook'|'component';
type Block = {
  range: vscode.Range;
  kind: Kind;
  title: string;
  depth: number;
  children: Block[];
};

// ========== 基础工具 ==========
function getName(node: ts.Node, sf: ts.SourceFile): string {
  if ((node as any).name) return (node as any).name.getText(sf);
  if (ts.isVariableDeclaration(node) && node.name) return node.name.getText(sf);
  return '';
}
function nodeRangeFullLines(node: ts.Node, sf: ts.SourceFile) {
  const s = sf.getLineAndCharacterOfPosition(node.getStart());
  const e = sf.getLineAndCharacterOfPosition(node.getEnd());
  return new vscode.Range(s.line, 0, e.line, 0);
}
function isLikelyComponentNode(node: ts.Node, sf: ts.SourceFile) {
  const name = getName(node, sf);
  const text = node.getText(sf);
  return /return\s*<\w+/m.test(text) || /^[A-Z][A-Za-z0-9]+$/.test(name);
}
function isHookName(name: string) {
  return /^use[A-Z]/.test(name);
}
function isFuncNode(n: ts.Node): n is ts.FunctionLikeDeclaration | ts.FunctionExpression | ts.ArrowFunction {
  return ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n);
}
function kindOf(node: ts.Node, sf: ts.SourceFile): Kind {
  const name = getName(node, sf);
  if (ts.isMethodDeclaration(node)) return 'method';
  if (isHookName(name)) return 'hook';
  if (isLikelyComponentNode(node, sf)) return 'component';
  return 'function';
}

// ========== 直译占位（可接 LLM） ==========
function extractEnglishTokens(s: string): string[] {
  if (!s) return [];
  const spaced = s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-]+/g, ' ');
  return spaced.split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w));
}
function localTranslateToZh(words: string[]): string { return words.join(' '); }

// ========== 配色 ==========
const RAINBOW = [
  'rgba(90,169,255,0.18)',   // 蓝
  'rgba(38,166,154,0.18)',   // 青
  'rgba(140,123,255,0.18)',  // 靛
  'rgba(255,112,67,0.18)',   // 橙
  'rgba(255,214,90,0.18)',   // 黄
  'rgba(109,209,124,0.18)',  // 绿
];

// 只做容器；具体“块”用 before 渲染，不依赖背景区间
const decoByColor = new Map<string, vscode.TextEditorDecorationType>();
function getDeco(color: string) {
  if (!decoByColor.has(color)) {
    decoByColor.set(
      color,
      vscode.window.createTextEditorDecorationType({
        isWholeLine: false,
        overviewRulerColor: color,
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      })
    );
  }
  return decoByColor.get(color)!;
}

function hashStr(s: string): number { let h=0; for (let i=0;i<s.length;i++) h=((h<<5)-h)+s.charCodeAt(i)|0; return Math.abs(h); }
function colorFor(block: Block): string {
  const idx = hashStr(block.title+':'+block.range.start.line) % RAINBOW.length;
  return RAINBOW[idx];
}

// ========== AST 解析 → 函数树 ==========
function analyzeFunctionTree(src: string, filename: string): Block[] {
  let sk = ts.ScriptKind.TSX;
  if (filename.endsWith('.ts')) sk = ts.ScriptKind.TS;
  if (filename.endsWith('.js')) sk = ts.ScriptKind.JS;
  if (filename.endsWith('.jsx')) sk = ts.ScriptKind.JSX;

  const sf = ts.createSourceFile(filename, src, ts.ScriptTarget.Latest, true, sk);
  type Raw = { node: ts.Node; title: string; kind: Kind; range: vscode.Range; start: number; end: number; };
  const raws: Raw[] = [];

  function push(node: ts.Node, depth: number) {
    if (!isFuncNode(node)) return;
    const k = kindOf(node, sf);
    const title = getName(node, sf) || (ts.isMethodDeclaration(node) ? 'anonymousMethod' : 'anonymousFunction');
    const range = nodeRangeFullLines(node, sf);
    raws.push({ node, title, kind: k, range, start: range.start.line, end: range.end.line });
  }
  function walk(n: ts.Node, depth: number) {
    if (isFuncNode(n)) push(n, depth);
    ts.forEachChild(n, c => walk(c, depth+1));
  }
  walk(sf, 0);

  raws.sort((a,b) => (a.start - b.start) || (b.end - a.end));
  const roots: Block[] = [];
  const stack: Block[] = [];
  for (const r of raws) {
    const b: Block = { range: r.range, kind: r.kind, title: r.title, depth: stack.length, children: [] };
    while (stack.length && !(stack[stack.length-1].range.start.line <= b.range.start.line && stack[stack.length-1].range.end.line >= b.range.end.line)) {
      stack.pop();
    }
    if (stack.length) stack[stack.length-1].children.push(b);
    else roots.push(b);
    stack.push(b);
  }
  return roots;
}

// ========== 计算“函数基准缩进” ==========
function computeBaseIndent(doc: vscode.TextDocument, block: Block): number {
  const start = block.range.start.line;
  const end   = block.range.end.line;

  const childIntervals = block.children
    .map(ch => [ch.range.start.line, ch.range.end.line] as [number, number])
    .sort((a,b)=> a[0]-b[0]);

  let i = 0;
  let base = Number.MAX_SAFE_INTEGER;

  for (let line=start; line<=end; line++) {
    while (i < childIntervals.length && childIntervals[i][1] < line) i++;
    if (i < childIntervals.length) {
      const [cs, ce] = childIntervals[i];
      if (line >= cs && line <= ce) { line = ce; continue; }
    }
    if (line < 0 || line >= doc.lineCount) break;
    const li = doc.lineAt(line);
    const trimmed = li.text.trim();
    if (trimmed === '') continue;
    const ind = li.firstNonWhitespaceCharacterIndex;
    if (ind > 0 && ind < base) base = ind;
    if (base === 1) break;
  }
  if (!isFinite(base) || base === Number.MAX_SAFE_INTEGER) return 0;
  return Math.max(1, base);
}

// ========== 计算函数块的着色宽度 ==========
function computeColoringWidth(doc: vscode.TextDocument, block: Block): number {
  const start = block.range.start.line;
  const base = computeBaseIndent(doc, block);
  if (base > 0) return base;
  if (start >= 0 && start < doc.lineCount) {
    return Math.max(1, doc.lineAt(start).firstNonWhitespaceCharacterIndex || 1);
  }
  return 1;
}

// ========== 渲染函数块（父/子互斥；整块连续） ==========
// 关键思路：每行用 before + NBSP 造“虚拟缩进块”，并用 textDecoration 做绝对定位，
// 把块向上/向下各扩 GAP_PAD 像素，吃掉行间缝，视觉连续。
function decorateFunctionBlock(doc: vscode.TextDocument, block: Block, buckets: Map<string, vscode.DecorationOptions[]>) {
  const color = colorFor(block);
  getDeco(color);

  const start = block.range.start.line;
  const end   = block.range.end.line;

  const coloringWidth = computeColoringWidth(doc, block);
  if (coloringWidth <= 0) return;

  const childIntervals = block.children
    .map(ch => [ch.range.start.line, ch.range.end.line] as [number, number])
    .sort((a,b)=> a[0]-b[0]);

  let ci = 0;
  let firstHoverDone = false;

  const NBSP = '\u00A0';
  const ghost = NBSP.repeat(coloringWidth);

  const arr = buckets.get(color) || [];

  // 每行绘制
  for (let line=start; line<=end; line++) {
    while (ci < childIntervals.length && childIntervals[ci][1] < line) ci++;
    if (ci < childIntervals.length) {
      const [cs, ce] = childIntervals[ci];
      if (line >= cs && line <= ce) { line = ce; continue; }
    }

    if (line < 0 || line >= doc.lineCount) break;
    const li = doc.lineAt(line);
    const trimmed = li.text.trim();

    // 上下各扩的像素（可按需要调大一些：3 或 4）
    const GAP_PAD = 0;

    const opt: vscode.DecorationOptions = {
      range: new vscode.Range(line, 0, line, 0),
      renderOptions: {
        before: {
          contentText: ghost,
          color: 'transparent',
          // 这里不用 backgroundColor，而是用 textDecoration 注入绝对定位的背景，能越过行缝
          textDecoration: `;position:absolute; left:0; width:${coloringWidth}ch; top:-${GAP_PAD}px; bottom:-${GAP_PAD}px; background:${color};`,
          margin: '0 0 0 0',
        }
      }
    };

    if (!firstHoverDone && trimmed !== '') {
      const tokens = extractEnglishTokens(block.title);
      const zh = tokens.length ? localTranslateToZh(tokens) : undefined;
      opt.hoverMessage = zh
        ? `$(comment) ${zh}\n\nEN: ${tokens.join(' ')}`
        : `$(symbol-function) ${block.title}`;
      firstHoverDone = true;
    }

    arr.push(opt);
  }

  buckets.set(color, arr);

  // 子函数递归绘制（同样只画“外层缩进块”）
  for (const ch of block.children) {
    decorateFunctionBlock(doc, ch, buckets);
  }
}

// ========== Provider ==========
class Provider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  refresh() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const doc = editor.document;
    if (!['typescript','javascript','typescriptreact','javascriptreact'].includes(doc.languageId)) return;

    const roots = analyzeFunctionTree(doc.getText(), doc.fileName);

    const buckets = new Map<string, vscode.DecorationOptions[]>();
    for (const root of roots) decorateFunctionBlock(doc, root, buckets);

    for (const [color, opts] of buckets) {
      const deco = getDeco(color);
      editor.setDecorations(deco, opts);
    }

    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const roots = analyzeFunctionTree(document.getText(), document.fileName);
    const lenses: vscode.CodeLens[] = [];

    function addLenses(b: Block) {
      const tokens = extractEnglishTokens(b.title);
      const zh = tokens.length ? localTranslateToZh(tokens) : undefined;
      const title = zh ? `// ${zh}  (${b.kind})` : `// ${b.title}  (${b.kind})`;
      const ln = Math.max(0, b.range.start.line);
      lenses.push(new vscode.CodeLens(new vscode.Range(ln, 0, ln, 0), { title, command: '' }));
      b.children.forEach(addLenses);
    }
    roots.forEach(addLenses);
    return lenses;
  }
}

// ========== 激活 ==========
export function activate(ctx: vscode.ExtensionContext) {
  const provider = new Provider();
  ctx.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [
        { language: 'typescript' },
        { language: 'javascript' },
        { language: 'typescriptreact' },
        { language: 'javascriptreact' },
      ],
      provider
    ),
    vscode.commands.registerCommand('codehue.refresh', () => provider.refresh()),
    vscode.workspace.onDidChangeTextDocument(e => {
      if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) provider.refresh();
    }),
    vscode.window.onDidChangeActiveTextEditor(() => provider.refresh())
  );
  setTimeout(() => provider.refresh(), 120);
}

export function deactivate() {}
