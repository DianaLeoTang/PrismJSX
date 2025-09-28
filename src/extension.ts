import * as vscode from 'vscode';
import { applyFunctionDecorations, disposeFunctionDecorations, refreshFunctionDecorations } from './functionDecorator';
import { applyRegionDecorations, disposeRegionDecorations, getRegionSuppressionRanges, onRegionsChanged } from './regionDecorator';

function applyAll(editor: vscode.TextEditor) {
  if (!editor || editor.document.isClosed) return;
  // 先渲染 region（也会计算并发布 suppress 范围）
  applyRegionDecorations(editor);
  // 再渲染函数，并对 region 进行相减
  applyFunctionDecorations(editor, getRegionSuppressionRanges());
}

export function activate(context: vscode.ExtensionContext) {
  // 首次启动对激活编辑器应用
  if (vscode.window.activeTextEditor) {
    applyAll(vscode.window.activeTextEditor);
  }

  // 编辑器切换
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((ed) => {
      if (ed) applyAll(ed);
    })
  );

  // 文档内容变化
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      const ed = vscode.window.activeTextEditor;
      if (ed && e.document === ed.document) {
        applyAll(ed);
      }
    })
  );

  // Region 变化（例如颜色或解析到的新范围）
  context.subscriptions.push(
    onRegionsChanged(() => {
      const ed = vscode.window.activeTextEditor;
      if (ed) applyAll(ed);
    })
  );

  // 手动刷新命令
  context.subscriptions.push(
    vscode.commands.registerCommand('codehue.refresh', () => {
      const ed = vscode.window.activeTextEditor;
      if (ed) {
        refreshFunctionDecorations();
        applyAll(ed);
      }
    })
  );

  // 退出清理
  context.subscriptions.push({ dispose: disposeAll });
}

function disposeAll() {
  disposeFunctionDecorations();
  disposeRegionDecorations();
}

export function deactivate() {
  disposeAll();
}
