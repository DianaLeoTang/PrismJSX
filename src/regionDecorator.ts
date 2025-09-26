import * as vscode from 'vscode';
import { exclusionEmitter } from './exclusionBus';

const REGION_START = /^\s*\/\/\s*#region\s+(.+?)\s*$/;
const REGION_END   = /^\s*\/\/\s*#endregion\s+(.+?)\s*$/;

interface Pair { name: string; startLine: number; endLine: number; }

export class RegionDecorator implements vscode.Disposable {
  private regionDecoration: vscode.TextEditorDecorationType;
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {
    this.regionDecoration = this.createDecoration();
  }

  private createDecoration(): vscode.TextEditorDecorationType {
    const cfg = vscode.workspace.getConfiguration('codehue');
    const backgroundColor = cfg.get<string>('regionColor', 'rgba(255, 215, 0, 0.10)');
    const border = cfg.get<string>('regionBorder', '1px solid rgba(255, 215, 0, 0.45)');
    return vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor,
    //   border:0,
      overviewRulerColor: 'rgba(255, 215, 0, 0.8)',
      overviewRulerLane: vscode.OverviewRulerLane.Full,
    });
  }

  public refreshDecorationType() {
    this.regionDecoration.dispose();
    this.regionDecoration = this.createDecoration();
  }

  public bindToEditor(editor: vscode.TextEditor) { this.apply(editor); }

  public apply(editor: vscode.TextEditor) {
    if (!editor) return;
    const doc = editor.document;

    const pairs: Pair[] = [];
    const startStack: { name: string; line: number }[] = [];

    // Scan to collect closed and unmatched regions
    for (let line = 0; line < doc.lineCount; line++) {
      const text = doc.lineAt(line).text;
      let m = text.match(REGION_START);
      if (m) { startStack.push({ name: m[1].trim(), line }); continue; }
      m = text.match(REGION_END);
      if (m) {
        const name = m[1].trim();
        for (let i = startStack.length - 1; i >= 0; i--) {
          if (startStack[i].name === name) {
            const start = startStack[i].line;
            startStack.splice(i);
            pairs.push({ name, startLine: start, endLine: line });
            break;
          }
        }
      }
    }

    // Keep only outermost closed regions
    const outermostPairs = this.collapseToOutermost(pairs);

    // Unmatched #region => fallback to brace block
    const unmatchedStarts = [...startStack];
    const braceFallbackRanges: vscode.Range[] = [];
    for (const s of unmatchedStarts) {
      const r = this.findBraceRange(doc, s.line);
      if (r && !this.intersectsAny(r, outermostPairs.map(p => this.toRange(doc, p)))) {
        braceFallbackRanges.push(r);
      }
    }

    // Final decorations: outermost closed > unmatched fallback
    const finalRanges: vscode.DecorationOptions[] = [
      ...outermostPairs.map(p => ({ range: this.toRange(doc, p) })),
      ...braceFallbackRanges.map(r => ({ range: r })),
    ];
    editor.setDecorations(this.regionDecoration, finalRanges);

    // Broadcast suppression ranges so function decorators can skip coloring inside outermost regions
    exclusionEmitter.fire(outermostPairs.map(p => this.toRange(doc, p)));
  }

  private toRange(doc: vscode.TextDocument, p: Pair): vscode.Range {
    const start = new vscode.Position(p.startLine, 0);
    const end   = new vscode.Position(p.endLine, doc.lineAt(p.endLine).text.length);
    return new vscode.Range(start, end);
  }

  private intersects(a: vscode.Range, b: vscode.Range) { return a.intersection(b) !== undefined; }
  private intersectsAny(r: vscode.Range, arr: vscode.Range[]) { return arr.some(x => this.intersects(r, x)); }

  private collapseToOutermost(pairs: Pair[]): Pair[] {
    const sorted = [...pairs].sort((x, y) => x.startLine - y.startLine || y.endLine - x.endLine);
    const result: Pair[] = [];
    for (const p of sorted) {
      const last = result[result.length - 1];
      if (!last) { result.push(p); continue; }
      if (p.startLine >= last.startLine && p.endLine <= last.endLine) continue; // drop inner
      result.push(p);
    }
    return result;
  }

  // From start line, find first '{' and match to its '}', return full brace block; if not closed, end of file.
  private findBraceRange(doc: vscode.TextDocument, startLine: number): vscode.Range | null {
    let openLine = -1, openChar = -1;
    outer: for (let l = startLine; l < doc.lineCount; l++) {
      const text = doc.lineAt(l).text;
      const idx = text.indexOf('{');
      if (idx !== -1) { openLine = l; openChar = idx; break outer; }
    }
    if (openLine === -1) return null;

    let depth = 0;
    for (let l = openLine; l < doc.lineCount; l++) {
      const text = doc.lineAt(l).text;
      const startC = (l === openLine) ? openChar : 0;
      for (let c = startC; c < text.length; c++) {
        const ch = text.charAt(c);
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        if (depth === 0) {
          const start = new vscode.Position(openLine, 0);
          const end   = new vscode.Position(l, text.length);
          return new vscode.Range(start, end);
        }
      }
    }
    const start = new vscode.Position(openLine, 0);
    const lastLine = doc.lineCount - 1;
    const end = new vscode.Position(lastLine, doc.lineAt(lastLine).text.length);
    return new vscode.Range(start, end);
  }

  public watchActiveEditor() {
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((ed) => ed && this.apply(ed)),
      vscode.workspace.onDidChangeTextDocument((e) => {
        const ed = vscode.window.activeTextEditor;
        if (ed && e.document === ed.document) this.apply(ed);
      }),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('codehue.regionColor') || e.affectsConfiguration('codehue.regionBorder')) {
          this.refreshDecorationType();
          const ed = vscode.window.activeTextEditor; if (ed) this.apply(ed);
        }
      }),
    );
  }

  public dispose() {
    this.regionDecoration.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}
