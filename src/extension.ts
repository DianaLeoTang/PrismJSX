
import * as vscode from 'vscode';
import ts from 'typescript';

type Block = { range: vscode.Range; kind: string; title: string; enText?: string; zhText?: string; depth: number };

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
  // function/arrow that returns JSX OR PascalCase identifier
  const name = getName(node, sf);
  const text = node.getText(sf);
  const returnsJSX = /return\s*<\w+/m.test(text);
  const pascal = /^[A-Z][A-Za-z0-9]+$/.test(name);
  return (returnsJSX || pascal);
}
function isHookName(name: string) {
  return /^use[A-Z]/.test(name);
}

// ---------- english token extraction + placeholder "translation" ----------
function extractEnglishTokens(nameOrComment: string): string[] {
  if (!nameOrComment) return [];
  const spaced = nameOrComment
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ');
  return spaced.split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w));
}
function localTranslateToZh(words: string[]): string {
  return words.join(' ');
}

// ---------- palette (richer colors) ----------
const palette: Record<string, string> = {
  component: '#6dd17c', // green
  hook:      '#2ec8a0', // teal
  function:  '#5aa9ff', // blue
  method:    '#8c7bff', // indigo
  class:     '#c774ff', // purple
  exported:  '#ff8b4d', // orange
  constant:  '#a2b1b8', // gray
  type:      '#ffd65a', // yellow
  interface: '#ffc371', // amber
  enum:      '#ff9db5'  // pink
};

function makeDeco(color: string) {
  return vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    borderColor: color,
    borderWidth: '0 0 0 3px',
    borderStyle: 'solid',
    overviewRulerColor: color,
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    after: { margin: '0 0 0 1rem' }
  });
}

const decoCache = new Map<string, vscode.TextEditorDecorationType>();
function getDeco(kind: string) {
  if (!decoCache.has(kind)) {
    decoCache.set(kind, makeDeco(palette[kind] || '#90a4ae'));
  }
  return decoCache.get(kind)!;
}

// ---------- analyzer: finer-grained ----------
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
    // classes
    if (ts.isClassDeclaration(node)) {
      const name = node.name?.getText(sf) || '匿名类';
      push(node, 'class', name, depth);
      // methods
      node.members.forEach(m => {
        if (ts.isMethodDeclaration(m)) {
          const mn = m.name?.getText(sf) || '匿名方法';
          push(m, 'method', `${name}.${mn}`, depth+1);
        }
      });
    }

    // functions (decl/expr/arrow)
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      const name = getName(node, sf) || '匿名函数';
      if (isHookName(name)) push(node, 'hook', name, depth);
      else if (isLikelyComponentNode(node, sf)) push(node, 'component', name, depth);
      else push(node, 'function', name, depth);
    }

    // variable declarations with arrow/function initializer
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

    // types / interfaces / enums
    if (ts.isTypeAliasDeclaration(node)) push(node, 'type', node.name.getText(sf), depth);
    if (ts.isInterfaceDeclaration(node)) push(node, 'interface', node.name.getText(sf), depth);
    if (ts.isEnumDeclaration(node)) push(node, 'enum', node.name.getText(sf), depth);

    // exported (mark any exported node)
    const isExported = (ts.getCombinedModifierFlags(node as any) & ts.ModifierFlags.Export) !== 0;
    if (isExported && !ts.isSourceFile(node)) {
      const nm = getName(node, sf) || 'exported';
      push(node, 'exported', nm, depth);
    }

    ts.forEachChild(node, (ch)=>walk(ch, depth+1));
  }
  walk(sf, 0);

  // de-duplicate overlapping identical ranges/kinds
  const uniq = new Map<string, Block>();
  for (const b of out) {
    const key = `${b.range.start.line}-${b.range.end.line}-${b.kind}-${b.title}`;
    if (!uniq.has(key)) uniq.set(key, b);
  }
  return Array.from(uniq.values());
}

// ---------- decorations + CodeLens ----------
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

    // group by kind
    const grouped = new Map<string, vscode.DecorationOptions[]>();
    Object.keys(palette).forEach(k=>grouped.set(k, []));
    for (const b of blocks) {
      const tokens = extractEnglishTokens(b.title);
      const zh = tokens.length ? localTranslateToZh(tokens) : undefined;
      const afterText = zh ? `// ${zh}` : `// ${b.title}`;
      const opts: vscode.DecorationOptions = {
        range: b.range,
        hoverMessage: zh ? `$(comment) ${zh}\n\nEN: ${tokens.join(' ')}` : `$(symbol-function) ${b.title}`,
        renderOptions: { after: { contentText: afterText } }
      };
      const arr = grouped.get(b.kind) || [];
      arr.push(opts);
      grouped.set(b.kind, arr);
    }

    // for (const [kind, opts] of grouped) {
    //   const deco = getDeco(kind);
    //   editor.setDecorations(deco, opts);
    // }
    // 给函数类单独配一组彩虹色
  const functionColors = ['#5aa9ff','#26a69a','#8c7bff','#ff7043','#ffd65a'];

  for (const b of blocks) {
    const tokens = extractEnglishTokens(b.title);
    const zh = tokens.length ? localTranslateToZh(tokens) : undefined;
    const afterText = zh ? `// ${zh}` : `// ${b.title}`;

    let color = palette[b.kind] || '#90a4ae';

    if (b.kind === 'function' || b.kind === 'method' || b.kind === 'hook' || b.kind === 'component') {
      const idx = b.depth % functionColors.length;
      color = functionColors[idx];
    }

  const deco = makeDeco(color);
  editor.setDecorations(deco, [{
    range: b.range,
    hoverMessage: zh ? `$(comment) ${zh}\\n\\nEN: ${tokens.join(' ')}` : `$(symbol-function) ${b.title}`,
    renderOptions: { after: { contentText: afterText } }
  }]);
}

    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const text = document.getText();
    const blocks = analyze(text, document.fileName);
    return blocks.map(b => new vscode.CodeLens(b.range, { title: `● ${b.kind}  ${b.title}`, command: '' }));
  }
}

// ---------- activate ----------
export function activate(ctx: vscode.ExtensionContext) {
  const provider = new Provider();
  ctx.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      [{language:'typescript'},{language:'javascript'},{language:'typescriptreact'},{language:'javascriptreact'}],
      provider
    ),
    vscode.commands.registerCommand('codehue.refresh', ()=>provider.refresh()),
    vscode.workspace.onDidChangeTextDocument(e=>{
      if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) provider.refresh();
    }),
    vscode.window.onDidChangeActiveTextEditor(()=>provider.refresh())
  );
  setTimeout(()=>provider.refresh(), 200);
}
function shadeColor(hex: string, depth: number): string {
  let col = parseInt(hex.substring(1), 16);
  let r = (col >> 16) & 0xff;
  let g = (col >> 8) & 0xff;
  let b = col & 0xff;
  const factor = 1 - Math.min(depth * 0.1, 0.5); // 最多变暗 50%
  r = Math.floor(r * factor);
  g = Math.floor(g * factor);
  b = Math.floor(b * factor);
  return `rgb(${r},${g},${b})`;
}


export function deactivate() {}
