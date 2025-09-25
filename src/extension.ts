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
  component: '#6dd17c', // green
  hook: '#2ec8a0', // teal
  function: '#5aa9ff', // blue（仅作为基色，函数类最终走彩虹）
  method: '#8c7bff', // indigo（仅作为基色）
  class: '#c774ff', // purple
  exported: '#ff8b4d', // orange
  constant: '#a2b1b8', // gray
  type: '#ffd65a', // yellow
  interface: '#ffc371', // amber
  enum: '#ff9db5', // pink
};

// 函数/方法/Hook/组件：按缩进层级循环配色（类似 indent-rainbow）
const functionDepthRainbow = ['#5aa9ff', '#26a69a', '#8c7bff', '#ff7043', '#ffd65a'];

// ---------- Decoration 工具 ----------
function makeDeco(color: string) {
  return vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    borderColor: color,
    borderWidth: '0 0 0 3px',
    borderStyle: 'solid',
    overviewRulerColor: color,
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    after: { margin: '0 0 0 1rem' },
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
    if (!['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(doc.languageId)) return;

    const text = doc.getText();
    const blocks = analyze(text, doc.fileName);

    // 以“颜色”为 key 聚合，避免 setDecorations 反复覆盖
    const colorBuckets = new Map<string, vscode.DecorationOptions[]>();

    for (const b of blocks) {
      // 计算注释
      const tokens = extractEnglishTokens(b.title);
      const zh = tokens.length ? localTranslateToZh(tokens) : undefined;
      const afterText = zh ? `// ${zh}` : `// ${b.title}`;

      // 计算颜色：函数/方法/Hook/组件 → 彩虹按 depth；其它 → 固定色
      const isFunctionKind = b.kind === 'function' || b.kind === 'method' || b.kind === 'hook' || b.kind === 'component';
      let color = palette[b.kind] || '#90a4ae';
      if (isFunctionKind) {
        const idx = Math.abs(b.depth) % functionDepthRainbow.length;
        color = functionDepthRainbow[idx];
      }

      const deco = getColorDeco(color);
      const arr = colorBuckets.get(color) || [];
      arr.push({
        range: b.range,
        hoverMessage: zh ? `$(comment) ${zh}\n\nEN: ${tokens.join(' ')}` : `$(symbol-function) ${b.title}`,
        renderOptions: { after: { contentText: afterText } },
      });
      colorBuckets.set(color, arr);
    }

    // 一次性应用不同颜色的装饰
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
