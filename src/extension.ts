import * as vscode from 'vscode';
import { applyFunctionDecorations, disposeFunctionDecorations, refreshFunctionDecorations } from './functionDecorator';
import { applyRegionDecorations, disposeRegionDecorations, getRegionSuppressionRanges, onRegionsChanged } from './regionDecorator';
import { clearTranslationCache } from './semanticTranslator';

// 防抖定时器
let debounceTimer: NodeJS.Timeout | undefined;

// 性能限制：最大文件行数
const MAX_FILE_LINES = 10000;

// 上次处理的文档版本，用于避免重复处理
let lastProcessedVersion = new Map<string, number>();

// 应用所有装饰
function applyAll(editor: vscode.TextEditor) {
  if (!editor || editor.document.isClosed) return;
  
  const docUri = editor.document.uri.toString();
  const docVersion = editor.document.version;
  
  // 检查是否已经处理过这个版本
  if (lastProcessedVersion.get(docUri) === docVersion) {
    return;
  }
  
  // 性能检查：跳过过大的文件
  if (editor.document.lineCount > MAX_FILE_LINES) {
    console.log(`跳过过大文件: ${editor.document.fileName} (${editor.document.lineCount} 行)`);
    return;
  }
  
  // 先渲染 region（也会计算并发布 suppress 范围）
  applyRegionDecorations(editor);
  // 再渲染函数，并对 region 进行相减
  applyFunctionDecorations(editor, getRegionSuppressionRanges());
  
  // 记录已处理的版本
  lastProcessedVersion.set(docUri, docVersion);
  
  // 限制版本缓存大小
  if (lastProcessedVersion.size > 100) {
    const firstKey = lastProcessedVersion.keys().next().value;
    if (firstKey) {
      lastProcessedVersion.delete(firstKey);
    }
  }
}

// 防抖版本的应用函数
function applyAllDebounced(editor: vscode.TextEditor) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  debounceTimer = setTimeout(() => {
    applyAll(editor);
  }, 150); // 150ms 防抖延迟
}

// 激活扩展
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

  // 文档内容变化 - 使用防抖版本
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      const ed = vscode.window.activeTextEditor;
      if (ed && e.document === ed.document) {
        applyAllDebounced(ed);
      }
    })
  );

  // Region 变化（例如颜色或解析到的新范围）- 使用防抖版本
  context.subscriptions.push(
    onRegionsChanged(() => {
      const ed = vscode.window.activeTextEditor;
      if (ed) applyAllDebounced(ed);
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

  // 清空翻译缓存命令
  context.subscriptions.push(
    vscode.commands.registerCommand('codehue.clearCache', () => {
      clearTranslationCache();
      vscode.window.showInformationMessage('翻译缓存已清空');
      const ed = vscode.window.activeTextEditor;
      if (ed) {
        applyAll(ed);
      }
    })
  );

  // 退出清理
  context.subscriptions.push({ 
    dispose: () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      lastProcessedVersion.clear();
      disposeAll();
    }
  });
}

// 清理所有资源
function disposeAll() {
  disposeFunctionDecorations();
  disposeRegionDecorations();
}

// 停用扩展
export function deactivate() {
  disposeAll();
}
