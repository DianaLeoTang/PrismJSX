import * as vscode from 'vscode';
import ts from 'typescript';

type Block = {
  range: vscode.Range;
  kind: 'function'|'method'|'hook'|'component'|'class'|'exported'|'constant'|'type'|'interface'|'enum'|string;
  title: string;
  depth: number;
};

// ---------- utils (AST) ----------
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
  const name = getName(node, sf);
  const text = node.getText(sf);
  const returnsJSX = /return\s*<\w+/m.test(text);
  const pascal = /^[A-Z][A-Za-z0-9]+$/.test(name);
  return returnsJSX || pascal;
}
function isHookName(name: string) {
  return /^use[A-Z]/.test(name);
}

// ---------- tokens + placeholder "translation" ----------
function extractEnglishTokens(s: string): string[] {
  if (!s) return [];
  const spaced = s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-]+/g, ' ');
  return spaced.split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w));
}
function localTranslateToZh(words: string[]): string {
  // 占位直译（避免误译；后续可换 LLM）
  return words.join(' ');
}

// ---------- colors ----------
const RAINBOW = [
  'rgba(90,169,255,0.18)',   // 蓝
  'rgba(38,166,154,0.18)',   // 青
  'rgba(140,123,255,0.18)',  // 靛
  'rgba(255,112,67,0.18)',   // 橙
  'rgba(255,214,90,0.18)',   // 黄
  'rgba(109,209,124,0.18)',  // 绿
];

const FIXED_KIND_COLOR: Record<string, string> = {
  class:     'rgba(199,116,255,0.18)',
  exported:  'rgba(255,139,77,0.18)',
  constant:  'rgba(162,177,184,0.18)',
  type:      'rgba(255,214,90,0.18)',
  interface: 'rgba(255,195,113,0.18)',
  enum:      'rgba(255,157,181,0.18)',
};

// ---------- decoration cache (by color) ----------
const decoByColor = new Map<string, vscode.TextEditorDecorationType>();
function getDeco(color: string) {
  if (!decoByColor.has(color)) {
    decoByColor.set(color, vscode.window.createTextEditorDecorationType({
      isWholeLine: false,
      backgroundColor: color,
      overviewRulerColor: color,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
    }));
  }
  return decoByColor.get(color)!;
}

// ---------- simple hash for per-function color offset ----------
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

// ---------- analyze AST ----------
function analyze(src: string, filename: string): Block[] {
  let sk = ts.ScriptKind.TSX;
  if (filename.endsWith('.ts')) sk = ts.ScriptKind.TS;
  if (filename.endsWith('.js')) sk = ts.ScriptKind.JS;
  if (filename.endsWith('.jsx')) sk = ts.ScriptKind.JSX;

  const sf = ts.createSourceFile(filename, src, ts.ScriptTarget.Latest, true, sk);
  const out: Block[] = [];

  function push(node: ts.Node, kind: Block['kind'], title: string, depth: number) {
    out.push({ range: nodeRangeFullLines(node, sf), kind, title, depth });
  }

  function walk(node: ts.Node, depth: number) {
    if (ts.isClassDeclaration(node)) {
      const name = node.name?.getText(sf) || '匿名类';
      push(node, 'class', name, depth);
      node.members.forEach(m => {
        if (ts.isMethodDeclaration(m)) {
          const mn = m.name?.getText(sf) || '匿名方法';
          push(m, 'method', `${name}.${mn}`, depth + 1);
        }
      });
    }

    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      const name = getName(node, sf) || '匿名函数';
      if (isHookName(name)) push(node, 'hook', name, depth);
      else if (isLikelyComponentNode(node, sf)) push(node, 'component', name, depth);
      else push(node, 'function', name, depth);
    }

    if (ts.isVariableDeclaration(node) && node.initializer) {
      const nm = getName(node, sf);
      const init = node.initializer;
      if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
        if (isHookName(nm)) push(node, 'hook', nm, depth);
        else if (isLikelyComponentNode(init, sf) || isLikelyComponentNode(node, sf)) push(node, 'component', nm, depth);
        else push(node, 'function', nm, depth);
      } else if (ts.isObjectLiteralExpression(init) || ts.isArrayLiteralExpression(init)) {
        push(node, 'constant', nm || '常量', depth);
      }
    }

    if (ts.isTypeAliasDeclaration(node)) push(node, 'type', node.name.getText(sf), depth);
    if (ts.isInterfaceDeclaration(node)) push(node, 'interface', node.name.getText(sf), depth);
    if (ts.isEnumDeclaration(node)) push(node, 'enum', node.name.getText(sf), depth);

    const isExported = (ts.getCombinedModifierFlags(node as any) & ts.ModifierFlags.Export) !== 0;
    if (isExported && !ts.isSourceFile(node)) {
      const nm = getName(node, sf) || 'exported';
      push(node, 'exported', nm, depth);
    }

    ts.forEachChild(node, ch => walk(ch, depth + 1));
  }
  walk(sf, 0);

  // de-dup
  const uniq = new Map<string, Block>();
  for (const b of out) {
    const key = `${b.range.start.line}-${b.range.end.line}-${b.kind}-${b.title}`;
    if (!uniq.has(key)) uniq.set(key, b);
  }
  return Array.from(uniq.values());
}

// ---------- Provider (decorate + CodeLens) ----------
class Provider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  refresh() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const doc = editor.document;
    if (!['typescript','javascript','typescriptreact','javascriptreact'].includes(doc.languageId)) return;

    const tabSize = Number(editor.options.tabSize) || 2;

    const text = doc.getText();
    const blocks = analyze(text, doc.fileName);

    // color -> ranges
    const buckets = new Map<string, vscode.DecorationOptions[]>();

    for (const b of blocks) {
      // 1) 每个“函数族”有自己的颜色偏移（不同函数不同配色）
      const isFuncFamily = b.kind === 'function' || b.kind === 'method' || b.kind === 'hook' || b.kind === 'component';
      const fnOffset = isFuncFamily ? (hashStr(b.title + ':' + b.range.start.line) % RAINBOW.length) : 0;

      const startLine = b.range.start.line;
      const endLine   = b.range.end.line;

      for (let line = startLine; line <= endLine; line++) {
        if (line < 0 || line >= doc.lineCount) continue;
        const li = doc.lineAt(line);
        if (li.isEmptyOrWhitespace) continue;

        // 计算“缩进级别”和每一级的列范围（按 tabSize）
        const leading = li.firstNonWhitespaceCharacterIndex;
        if (leading <= 0) continue;

        // 把 [0, leading) 切成多段，每段宽度 = tabSize（最后一段可小于 tabSize）
        let col = 0;
        let level = 0;
        while (col < leading) {
          const next = Math.min(col + tabSize, leading);

          // 2) 给每个缩进级别选择颜色：
          //    - 函数族：使用 (fnOffset + level) 做彩虹索引
          //    - 其他种类：固定色（按 kind）
          let color = 'rgba(144,164,174,0.18)'; // default gray
          if (isFuncFamily) {
            const idx = (fnOffset + level) % RAINBOW.length;
            color = RAINBOW[idx];
          } else if (FIXED_KIND_COLOR[b.kind]) {
            color = FIXED_KIND_COLOR[b.kind];
          }

          const range = new vscode.Range(line, col, line, next);
          const opt: vscode.DecorationOptions = { range };

          // 仅在函数块“首行”的第一个缩进段放注释/hover，避免重复
          if (isFuncFamily && line === startLine && level === 0) {
            const tokens = extractEnglishTokens(b.title);
            const zh = tokens.length ? localTranslateToZh(tokens) : undefined;
            opt.hoverMessage = zh ? `$(comment) ${zh}\n\nEN: ${tokens.join(' ')}` : `$(symbol-function) ${b.title}`;
            // 不放行尾 after，避免与缩进条带叠色；注释放到 CodeLens（见下）
          }

          const arr = buckets.get(color) || [];
          arr.push(opt);
          buckets.set(color, arr);

          col = next;
          level++;
        }
      }
    }

    for (const [color, opts] of buckets) {
      const deco = getDeco(color);
      editor.setDecorations(deco, opts);
    }

    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const text = document.getText();
    const blocks = analyze(text, document.fileName);

    const lenses: vscode.CodeLens[] = [];
    for (const b of blocks) {
      const isFuncFamily = b.kind === 'function' || b.kind === 'method' || b.kind === 'hook' || b.kind === 'component';
      if (!isFuncFamily) continue;

      const tokens = extractEnglishTokens(b.title);
      const zh = tokens.length ? localTranslateToZh(tokens) : undefined;
      const title = zh ? `// ${zh}  (${b.kind})` : `// ${b.title}  (${b.kind})`;

      // CodeLens 显示在“函数开始的上一行”（自然出现在上方）
      const startLine = b.range.start.line;
      const lensRange = new vscode.Range(Math.max(0, startLine), 0, Math.max(0, startLine), 0);
      lenses.push(new vscode.CodeLens(lensRange, { title, command: '' }));
    }
    return lenses;
  }
}

// ---------- activate ----------
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
  setTimeout(() => provider.refresh(), 150);
}

export function deactivate() {}
