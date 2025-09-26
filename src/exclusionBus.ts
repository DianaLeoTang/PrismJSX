import * as vscode from 'vscode';
export const exclusionEmitter = new vscode.EventEmitter<vscode.Range[]>();
export const onExclusionRanges = exclusionEmitter.event;