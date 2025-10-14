import * as vscode from 'vscode';
import axios from 'axios';

// ============ 私有云 AI API 集成 ============

// 翻译缓存（避免重复调用 API）
const translationCache = new Map<string, string>();

// API 调用限流（避免并发过多）
let pendingRequests = new Map<string, Promise<string>>();

/**
 * 使用私有云AI模型翻译函数名
 */
async function translateWithAI(functionName: string): Promise<string> {
  const config = vscode.workspace.getConfiguration('codehue');
  const baseUrl = config.get<string>('aiModelBaseUrl', 'http://llm-model-hub-apis.sf-express.com');
  const apiKey = config.get<string>('aiModelApiKey', '');
  const model = config.get<string>('aiModelName', 'aiplat/qwen2.5-72b-instruct');

  if (!apiKey) {
    throw new Error('AI模型 API Key 未配置');
  }

  // 检查是否已有相同请求正在进行
  if (pendingRequests.has(functionName)) {
    return await pendingRequests.get(functionName)!;
  }

  const requestPromise = (async () => {
    try {
      const url = `${baseUrl}/v1/chat/completions`;
      
      const response = await axios.post(
        url,
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的代码翻译助手。请将英文函数名翻译成简洁的中文语义描述，只返回翻译结果，不要解释。要求：1) 保持简洁（2-6个字）2) 体现函数的核心功能 3) 使用专业术语'
            },
            {
              role: 'user',
              content: `将这个函数名翻译成中文：${functionName}\n\n只返回翻译结果，不要任何解释。`
            }
          ],
          temperature: 0.3,
          max_tokens: 50,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5秒超时
        }
      );

      const translation = response.data.choices[0]?.message?.content?.trim() || functionName;
      
      // 清理可能的引号或额外文字
      const cleaned = translation
        .replace(/^["'「『]|["'」』]$/g, '')
        .replace(/^翻译结果[：:]\s*/i, '')
        .replace(/^中文[：:]\s*/i, '')
        .trim();

      return cleaned;
    } catch (error: any) {
      console.error(`AI模型调用失败: ${error.message}`);
      throw error;
    } finally {
      // 清理pending请求
      pendingRequests.delete(functionName);
    }
  })();

  pendingRequests.set(functionName, requestPromise);
  return await requestPromise;
}


/**
 * 将函数名转换为中文语义
 * 完全依赖 AI 模型进行翻译
 */
export async function translateFunctionNameToChinese(functionName: string): Promise<string> {
  if (!functionName || functionName === 'anonymous') {
    return '匿名函数';
  }

  // 检查缓存
  const cached = translationCache.get(functionName);
  if (cached) {
    return cached;
  }

  const config = vscode.workspace.getConfiguration('codehue');
  const enableAI = config.get<boolean>('enableAITranslation', true);
  const apiKey = config.get<string>('aiModelApiKey', '');

  let translation: string;

  // 如果启用 AI 且配置了 API Key，使用私有云AI服务
  if (enableAI && apiKey) {
    try {
      translation = await translateWithAI(functionName);
    } catch (error) {
      console.warn(`AI 翻译失败，保留原函数名: ${error}`);
      translation = functionName; // AI失败时保留原函数名
    }
  } else {
    // 未启用AI或未配置API Key，保留原函数名
    translation = functionName;
  }

  // 缓存结果
  translationCache.set(functionName, translation);
  
  // 限制缓存大小
  if (translationCache.size > 500) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) {
      translationCache.delete(firstKey);
    }
  }

  return translation;
}

/**
 * 同步版本的翻译函数（用于向后兼容）
 * 如果启用 AI，会先尝试从缓存获取，否则返回原函数名并在后台异步翻译
 */
export function translateFunctionNameToChineseSync(functionName: string): string {
  if (!functionName || functionName === 'anonymous') {
    return '匿名函数';
  }

  // 先检查缓存
  const cached = translationCache.get(functionName);
  if (cached) {
    return cached;
  }

  const config = vscode.workspace.getConfiguration('codehue');
  const enableAI = config.get<boolean>('enableAITranslation', true);
  const apiKey = config.get<string>('aiModelApiKey', '');

  // 如果启用 AI，在后台异步获取翻译
  if (enableAI && apiKey) {
    translateFunctionNameToChinese(functionName).then(result => {
      // 翻译完成后会自动缓存，下次就能用了
    }).catch(() => {
      // 错误已在 async 函数中处理
    });
  }

  // 立即返回原函数名（等待异步AI翻译完成后会自动更新）
  return functionName;
}

/**
 * 改进的 extractFunctionLabel - 返回中文语义
 * 与 computeFunctionRanges 保持一致的检测逻辑
 */
export function extractFunctionLabel(doc: vscode.TextDocument, startLine: number): string {
  const l1 = doc.lineAt(startLine).text.trim();
  const l2 = startLine + 1 < doc.lineCount ? doc.lineAt(startLine + 1).text.trim() : '';
  const s = `${l1} ${l2}`;

  let functionName = '';

  // 1. 命名 function: function foo(...) {
  let m = s.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (m) {
    functionName = m[1];
  }

  // 2. const/let/var 声明的箭头函数: const aa = () => {
  if (!functionName) {
    m = s.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/);
    if (m) {
      functionName = m[1];
    }
  }

  // 3. 赋值的箭头函数: aa = () => {
  if (!functionName) {
    m = s.match(/\b([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/);
    if (m) {
      functionName = m[1];
    }
  }

  // 4. 其他箭头函数（如回调）: [=:)] => {
  if (!functionName) {
    m = s.match(/[=:\)]\s*=>\s*\{/);
    if (m) {
      functionName = 'anonymous';
    }
  }

  // 5. async 方法: async method() { 或 method() {
  if (!functionName) {
    m = s.match(/^(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
    if (m) {
      functionName = m[1];
    }
  }

  // 6. 对象方法: foo: function() { 或 { method() {
  if (!functionName) {
    m = s.match(/[:,]\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
    if (m) {
      functionName = m[1];
    }
  }

  // 7. 检查多行函数定义（函数名在上一行）
  if (!functionName && startLine > 0) {
    const prevLine = doc.lineAt(startLine - 1).text.trim();
    const combined = `${prevLine} ${l1}`;
    
    // 检查上一行是否有函数名
    m = combined.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\([^)]*\)\s*=>\s*\{/);
    if (m) {
      functionName = m[1];
    }
  }

  if (!functionName) {
    return '匿名函数';
  }

  // 使用同步版本的翻译（优先从缓存获取）
  const chineseName = translateFunctionNameToChineseSync(functionName);
  return chineseName;
}

/**
 * 清空翻译缓存
 */
export function clearTranslationCache(): void {
  translationCache.clear();
  pendingRequests.clear();
}
