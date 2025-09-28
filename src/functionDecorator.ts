import * as vscode from 'vscode';
import * as ts from 'typescript';
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
	if (!['typescript','javascript','typescriptreact','javascriptreact'].includes(doc.languageId)) {
		return [];
	}

	// 使用TypeScript AST来解析函数
	let scriptKind = ts.ScriptKind.TSX;
	if (doc.fileName.endsWith('.ts')) scriptKind = ts.ScriptKind.TS;
	if (doc.fileName.endsWith('.js')) scriptKind = ts.ScriptKind.JS;
	if (doc.fileName.endsWith('.jsx')) scriptKind = ts.ScriptKind.JSX;

	const sourceFile = ts.createSourceFile(
		doc.fileName,
		doc.getText(),
		ts.ScriptTarget.Latest,
		true,
		scriptKind
	);

	const ranges: vscode.Range[] = [];

	function isFunctionNode(node: ts.Node): node is ts.FunctionLikeDeclaration | ts.FunctionExpression | ts.ArrowFunction {
		return ts.isFunctionDeclaration(node) ||
			   ts.isMethodDeclaration(node) ||
			   ts.isFunctionExpression(node) ||
			   ts.isArrowFunction(node);
	}

	function nodeToFullLineRange(node: ts.Node): vscode.Range {
		const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
		const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
		return new vscode.Range(start.line, 0, end.line, 0);
	}

	function visit(node: ts.Node) {
		if (isFunctionNode(node)) {
			ranges.push(nodeToFullLineRange(node));
		}
		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
	return ranges;
}


// const functionDecorationType = vscode.window.createTextEditorDecorationType({
// 	isWholeLine: false,
// 	backgroundColor: 'rgba(255, 255, 0, 0.1)', // 浅黄色背景
// 	border: '1px solid rgba(255, 255, 0, 0.3)',
// 	overviewRulerColor: 'rgba(255, 255, 0, 0.8)',
// 	overviewRulerLane: vscode.OverviewRulerLane.Right,
// });
/** 用颜色 -> decorationType 的简单缓存，支持“不同函数不同颜色” */
const stripeTypeCache = new Map<string, vscode.TextEditorDecorationType>();

function getLeftStripeDecoration(color: string) {
  if (stripeTypeCache.has(color)) return stripeTypeCache.get(color)!;
  const dt = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    // 只画“左侧”边框，不涂背景
    borderStyle: 'solid',
    borderColor: color,
    borderWidth: '0 0 0 3px',
    // 可选：让 minimap/概览标尺也能看到
    overviewRulerColor: color,
    overviewRulerLane: vscode.OverviewRulerLane.Left,
  });
  stripeTypeCache.set(color, dt);
  return dt;
}
export function apply(editor: vscode.TextEditor) {
const funcRanges = computeFunctionRanges(editor.document);
const visible = filterOutSuppressed(funcRanges);
editor.setDecorations(functionDecorationType, visible);
}