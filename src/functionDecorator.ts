import * as vscode from 'vscode';
import { onExclusionRanges } from './exclusionBus';


let suppressRanges: vscode.Range[] = [];


onExclusionRanges((ranges) => {
suppressRanges = ranges;
const ed = vscode.window.activeTextEditor;
if (ed) apply(ed);
});


function filterOutSuppressed(ranges: vscode.Range[]) {
return ranges.filter(r => !suppressRanges.some(s => !!r.intersection(s)));
}


function computeFunctionRanges(doc: vscode.TextDocument): vscode.Range[] {
// 这里用你现有的函数范围计算逻辑
return [];
}


const functionDecorationType = vscode.window.createTextEditorDecorationType({
isWholeLine: true,
// 你的函数底色样式
});


export function apply(editor: vscode.TextEditor) {
const funcRanges = computeFunctionRanges(editor.document);
const visible = filterOutSuppressed(funcRanges);
editor.setDecorations(functionDecorationType, visible);
}