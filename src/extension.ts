
import * as vscode from 'vscode';
import ts from 'typescript';

type Block = { range: vscode.Range; kind: string; title: string; enText?: string; zhText?: string };

// ---------- simple structural detectors ----------
function isLikelyComponent(node: ts.Node, sf: ts.SourceFile) {
  const name = (node as any).name?.getText(sf) || '';
  const text = node.getText(sf);
  const returnsJSX = /return\s*<\w+/m.test(text);
  const pascal = /^[A-Z][A-Za-z0-9]+$/.test(name);
  return (returnsJSX || pascal);
}
function isHook(node: ts.Node, sf: ts.SourceFile) {
  const name = (node as any).name?.getText(sf) || '';
  return /^use[A-Z]/.test(name);
}
function nodeRange(node: ts.Node, sf: ts.SourceFile) {
  const s = sf.getLineAndCharacterOfPosition(node.getStart());
  const e = sf.getLineAndCharacterOfPosition(node.getEnd());
  return new vscode.Range(s.line, 0, e.line, 0);
}

function analyzeStructural(src: string, filename: string): Block[] {
  // auto-detect TS/JS/TSX/JSX by extension
  let kind = ts.ScriptKind.TSX;
  if (filename.endsWith(".ts")) kind = ts.ScriptKind.TS;
  if (filename.endsWith(".js")) kind = ts.ScriptKind.JS;
  if (filename.endsWith(".jsx")) kind = ts.ScriptKind.JSX;

  const sf = ts.createSourceFile(filename, src, ts.ScriptTarget.Latest, true, kind);
  const out: Block[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      const name = (node as any).name?.getText(sf) || '匿名函数';
      if (isHook(node, sf)) out.push({ range: nodeRange(node, sf), kind: 'hook',      title: name });
      else if (isLikelyComponent(node, sf)) out.push({ range: nodeRange(node, sf), kind: 'component', title: name });
      else out.push({ range: nodeRange(node, sf), kind: 'function',  title: name });
    }
    if (ts.isClassDeclaration(node)) {
      const name = node.name?.getText(sf) || '匿名类';
      out.push({ range: nodeRange(node, sf), kind: 'class', title: name });
    }
    if ((ts.getCombinedModifierFlags(node as any) & ts.ModifierFlags.Export) && !ts.isSourceFile(node)) {
      // mark exported regions roughly on the node
      out.push({ range: nodeRange(node, sf), kind: 'exported', title: 'exported' });
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sf, visit);

  return out;
}

// ---------- trivial tokenizer + placeholder translator ----------
function extractEnglishTokens(nameOrComment: string): string[] {
  const spaced = nameOrComment
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ');
  return spaced.split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w));
}
function localTranslateToZh(words: string[]): string {
  // Minimal placeholder: join tokens — avoids wrong auto-translation.
  // You can later switch to an LLM provider to get real translation.
  return words.join(' ');
}

const palette: Record<string, string> = {
  component: '#7cb342',
  hook:      '#26a69a',
  function:  '#42a5f5',
  class:     '#ab47bc',
  exported:  '#ff7043',
};

function makeDeco(color: string) {
  return vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    borderColor: color,
    borderWidth: '0 0 0 3px',
    borderStyle: 'solid',
    overviewRulerColor: color,
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    // Note: VSCode API does not currently expose explicit minimap decoration options in typings.
    // The overview ruler gives a good right-side summary bar; minimap often reflects background/border subtly.
    after: { margin: '0 0 0 1rem' }
  });
}

function applyDecorations(editor: vscode.TextEditor, blocks: Block[]) {
  const map = new Map<string, vscode.DecorationOptions[]>();
  Object.keys(palette).forEach(k => map.set(k, []));
  for (const b of blocks) {
    const arr = map.get(b.kind);
    if (!arr) continue;
    const tokens = extractEnglishTokens(b.title);
    const zh = tokens.length ? localTranslateToZh(tokens) : undefined;

    arr.push({
      range: b.range,
      hoverMessage: zh ? `$(comment) ${zh}\n\nEN: ${tokens.join(' ')}` : `$(symbol-function) ${b.title}`,
      renderOptions: zh ? { after: { contentText: `// ${zh}` } } : undefined
    });
  }

  for (const [kind, opts] of map) {
    const deco = makeDeco(palette[kind] || '#90a4ae');
    editor.setDecorations(deco, opts);
  }
}

function refreshActiveEditor() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const doc = editor.document;
  if (!['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(doc.languageId)) return;

  const text = doc.getText();
  const blocks = analyzeStructural(text, doc.fileName);
  applyDecorations(editor, blocks);
}

// ---------- extension entry ----------
export function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand('codehue.refresh', refreshActiveEditor),
    vscode.workspace.onDidChangeTextDocument(e => {
      if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
        refreshActiveEditor();
      }
    }),
    vscode.window.onDidChangeActiveTextEditor(() => refreshActiveEditor())
  );
  // initial
  setTimeout(refreshActiveEditor, 200);
}

export function deactivate() {}
