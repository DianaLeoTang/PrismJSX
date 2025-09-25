import * as vscode from 'vscode';
import ts from 'typescript';

type Block = {
  range: vscode.Range;
  kind: string;
  title: string;
  enText?: string;
  zhText?: string;
  depth: number;
};

// ---------- utils ----------
function nodeRangeFullLines(node: ts.Node, sf: ts.SourceFile) {
  const s = sf.getLineAndCharacterOfPosition(node.getStart());
  const e = sf.getLineAndCharacterOfPosition(node.getEnd());
  return new vscode.Range(s.line, 0, e.line, 0);
}
function getName(node: ts.Node, sf: ts.SourceFile): string {
  if ((node as any).name) return (node as any).name.getText(sf);
  if (ts.isVariableDeclaration(node) && node.name) return node.name.getText(sf);
  return '';
}
function isLikelyComponentNode(node: ts.Node, sf: ts.SourceFile) {
  // 函数返回 JSX 或者名字是 PascalCase → 认为是 React 组件
  const name = getName(node, sf);
  const text = node.getText(sf);
  const returnsJSX = /return\s*<\w+/m.test(text);
  const pascal = /^[A-Z][A-Za-z0-9]+$/.test(name);
  return returnsJSX || pascal;
}
function isHookName(name: string) {
  return /^use[A-Z]/.test(name);
}

// ---------- 英文 token 抽取 + 本地“直译占位” ----------
function extractEnglishTokens(nameOrComment: string): string[] {
  if (!nameOrComment) return [];
  const spaced = nameOrComment
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ');
  return spaced.split(/\s+/).filter((w) => /^[A-Za-z]+$/.test(w));
}
function localTranslateToZh(words: string[]): string {
  // 占位直译：先拼回原词，后续可接入 LLM 做真正翻译
  return words.join(' ');
}

// ---------- 固定色（非函数类） ----------
const palette: Record<string, string> = {
  component: 'rgba(109,209,124,0.18)',
  hook:      'rgba(46,200,160,0.18)',
  function:  'rgba(90,169,255,0.18)',
  method:    'rgba(140,123,255,0.18)',
  class:     'rgba(199,116,255,0.18)',
  exported:  'rgba(255,139,77,0.18)',
  constant:  'rgba(162,177,184,0.18)',
  type:      'rgba(255,214,90,0.18)',
  interface: 'rgba(255,195,113,0.18)',
  enum:      'rgba(255,157,181,0.18)',
};


// 函数/方法/Hook/组件：按缩进层级循环配色（类似 indent-rainbow）
// 缩进条带用的半透明彩虹
const functionDepthRainbow = [
  'rgba(90,169,255,0.18)',  // 蓝
  'rgba(38,166,154,0.18)',  // 青
  'rgba(140,123,255,0.18)', // 靛
  'rgba(255,112,67,0.18)',  // 橙
  'rgba(255,214,90,0.18)',  // 黄
];

// ---------- Decoration 工具 ----------
function makeDeco(color: string) {
  return vscode.window.createTextEditorDecorationType({
    // 用半透明背景色给缩进区染色（真正的范围我们在 refresh 里算）
    backgroundColor: color,
    isWholeLine: false,
    overviewRulerColor: color,
    overviewRulerLane: vscode.OverviewRulerLane.Right,
  });
}


// 以“颜色”为 key 做缓存，避免重复创建大量装饰器
const decoByColor = new Map<string, vscode.TextEditorDecorationType>();
function getColorDeco(color: string) {
  if (!decoByColor.has(color)) {
    decoByColor.set(color, makeDeco(color));
  }
  return decoByColor.get(color)!;
}

// ---------- 语法分析（含 depth） ----------
function analyze(src: string, filename: string): Block[] {
  let sk = ts.ScriptKind.TSX;
  if (filename.endsWith('.ts')) sk = ts.ScriptKind.TS;
  if (filename.endsWith('.js')) sk = ts.ScriptKind.JS;
  if (filename.endsWith('.jsx')) sk = ts.ScriptKind.JSX;

  const sf = ts.createSourceFile(filename, src, ts.ScriptTarget.Latest, true, sk);
  const out: Block[] = [];

  function push(node: ts.Node, kind: string, title: string, depth: number) {
    out.push({ range: nodeRangeFullLines(node, sf), kind, title, depth });
  }

  function walk(node: ts.Node, depth: number) {
    // class + methods
    if (ts.isClassDeclaration(node)) {
      const name = node.name?.getText(sf) || '匿名类';
      push(node, 'class', name, depth);
      node.members.forEach((m) => {
        if (ts.isMethodDeclaration(m)) {
          const mn = m.name?.getText(sf) || '匿名方法';
          push(m, 'method', `${name}.${mn}`, depth + 1);
        }
      });
    }

    // 函数（声明 / 表达式 / 箭头）
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      const name = getName(node, sf) || '匿名函数';
      if (isHookName(name)) push(node, 'hook', name, depth);
      else if (isLikelyComponentNode(node, sf)) push(node, 'component', name, depth);
      else push(node, 'function', name, depth);
    }

    // 变量声明里包裹的函数
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const nm = getName(node, sf);
      const init = node.initializer;
      if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
        if (isHookName(nm)) push(node, 'hook', nm, depth);
        else if (isLikelyComponentNode(init, sf) || isLikelyComponentNode(node, sf)) push(node, 'component', nm, depth);
        else push(node, 'function', nm, depth);
      } else if (init && (ts.isObjectLiteralExpression(init) || ts.isArrayLiteralExpression(init))) {
        push(node, 'constant', nm || '常量', depth);
      }
    }

    // 类型 / 接口 / 枚举
    if (ts.isTypeAliasDeclaration(node)) push(node, 'type', node.name.getText(sf), depth);
    if (ts.isInterfaceDeclaration(node)) push(node, 'interface', node.name.getText(sf), depth);
    if (ts.isEnumDeclaration(node)) push(node, 'enum', node.name.getText(sf), depth);

    // 导出标记
    const isExported = (ts.getCombinedModifierFlags(node as any) & ts.ModifierFlags.Export) !== 0;
    if (isExported && !ts.isSourceFile(node)) {
      const nm = getName(node, sf) || 'exported';
      push(node, 'exported', nm, depth);
    }

    ts.forEachChild(node, (ch) => walk(ch, depth + 1));
  }
  walk(sf, 0);

  // 去重
  const uniq = new Map<string, Block>();
  for (const b of out) {
    const key = `${b.range.start.line}-${b.range.end.line}-${b.kind}-${b.title}`;
    if (!uniq.has(key)) uniq.set(key, b);
  }
  return Array.from(uniq.values());
}

// ---------- Provider：渲染 + CodeLens ----------
class Provider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

    refresh() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const doc = editor.document;
    if (!['typescript','javascript','typescriptreact','javascriptreact'].includes(doc.languageId)) return;

    const text = doc.getText();
    const blocks = analyze(text, doc.fileName);

    // 颜色 -> 装饰区间列表
    const colorBuckets = new Map<string, vscode.DecorationOptions[]>();

    for (const b of blocks) {
      // 1) 先决定这个 block 用什么颜色
      const isFunctionKind =
        b.kind === 'function' || b.kind === 'method' || b.kind === 'hook' || b.kind === 'component';
      let color = palette[b.kind] || 'rgba(144,164,174,0.18)'; // 默认灰
      if (isFunctionKind) {
        const idx = Math.abs(b.depth) % functionDepthRainbow.length;
        color = functionDepthRainbow[idx];
      }

      // 2) 在 block 覆盖的每一行，只给“缩进区域”着色
      const startLine = b.range.start.line;
      const endLine   = b.range.end.line;
      for (let line = startLine; line <= endLine; line++) {
        // 跳过越界
        if (line < 0 || line >= doc.lineCount) continue;

        const li = doc.lineAt(line);
        // 空行 / 全空白行：可以跳过，或者给一个很小的条带（这里跳过）
        if (li.isEmptyOrWhitespace) continue;

        const indentCols = li.firstNonWhitespaceCharacterIndex;
        if (indentCols <= 0) continue; // 顶格不需要染色

        // 只染 [列0, 列 indentCols) 的空白区
        const range = new vscode.Range(line, 0, line, indentCols);

        // 构造 hover / after 文本（放在 block 的第一行，避免每行都显示挤占空间）
        const opts: vscode.DecorationOptions = { range };
        if (line === startLine) {
          const tokens = extractEnglishTokens(b.title);
          const zh = tokens.length ? localTranslateToZh(tokens) : undefined;
          opts.hoverMessage = zh
            ? `$(comment) ${zh}\n\nEN: ${tokens.join(' ')}`
            : `$(symbol-function) ${b.title}`;
          // 只在首行显示一个行尾注释（避免每行重复）
          opts.renderOptions = { after: { contentText: `// ${zh ?? b.title}` } };
        }

        const arr = colorBuckets.get(color) || [];
        arr.push(opts);
        colorBuckets.set(color, arr);
      }
    }

    // 3) 应用装饰（按颜色一次性 setDecorations）
    for (const [color, opts] of colorBuckets) {
      const deco = getColorDeco(color);
      editor.setDecorations(deco, opts);
    }

    this._onDidChangeCodeLenses.fire();
  }


  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const text = document.getText();
    const blocks = analyze(text, document.fileName);
    return blocks.map(
      (b) => new vscode.CodeLens(b.range, { title: `● ${b.kind}  ${b.title}`, command: '' })
    );
  }
}

// ---------- 激活 ----------
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
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
        provider.refresh();
      }
    }),
    vscode.window.onDidChangeActiveTextEditor(() => provider.refresh())
  );

  // 初次渲染
  setTimeout(() => provider.refresh(), 200);
}

export function deactivate() {}
