import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// ============ 私有云 AI API 集成 ============

/**
 * 从 .env 文件读取 API Key
 * 开发时使用 .env（不提交到 Git）
 * 发布时会被构建脚本替换为硬编码的值
 */
function getBuiltinApiKey(): string {
  // 如果是编译后的代码，这里会被构建脚本替换为真实的 token
  const COMPILED_KEY = '__BUILTIN_API_KEY_PLACEHOLDER__';
  
  if (COMPILED_KEY !== '__BUILTIN_API_KEY_PLACEHOLDER__') {
    return COMPILED_KEY;
  }
  
  // 开发环境：从 .env 文件读取
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/BUILTIN_API_KEY\s*=\s*(.+)/);
      if (match) {
        return match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch (error) {
    console.warn('无法读取 .env 文件');
  }
  
  return '';
}

/**
 * 获取 API Key（优先顺序：VSCode 配置 → 系统环境变量 → 内置）
 */
function getApiKey(): string {
  // 1. 优先从 VSCode 配置读取（给高级用户自定义的选项）
  const config = vscode.workspace.getConfiguration('codehue');
  const fromConfig = (config.get<string>('aiApiKey', '') || '').trim();
  if (fromConfig) return fromConfig;
  
  // 2. 从系统环境变量读取
  const fromEnv = (process.env.CODEHUE_API_KEY || '').trim();
  if (fromEnv) return fromEnv;
  
  // 3. 使用内置 API Key（开箱即用）
  return getBuiltinApiKey();
}

// 翻译缓存（避免重复调用 API）
const translationCache = new Map<string, string>();

// API 调用限流（避免并发过多）
let pendingRequests = new Map<string, Promise<string>>();

// 并发控制：同时最多处理的请求数
const MAX_CONCURRENT_REQUESTS = 3;
let activeRequests = 0;
let requestQueue: Array<() => void> = [];

/**
 * 等待并发槽位
 */
async function waitForSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return;
  }
  
  // 等待有空闲槽位
  return new Promise(resolve => {
    requestQueue.push(() => {
      activeRequests++;
      resolve();
    });
  });
}

/**
 * 释放并发槽位
 */
function releaseSlot(): void {
  activeRequests--;
  const next = requestQueue.shift();
  if (next) {
    next();
  }
}

/**
 * 使用私有云AI模型翻译函数名（带重试机制和并发控制）
 */
async function translateWithAI(functionName: string, retryCount = 0): Promise<string> {
  const config = vscode.workspace.getConfiguration('codehue');
  const baseUrl = config.get<string>('aiModelBaseUrl', 'http://llm-model-hub-apis.sf-express.com');
  const model = config.get<string>('aiModelName', 'aiplat/qwen2.5-72b-instruct');
  const maxRetries = 2; // 最多重试2次
  
  // 获取 API Key
  const apiKey = getApiKey();
  
  // 检查 API Key 是否有效
  if (!apiKey) {
    console.warn('未配置有效的 API Key，AI 翻译功能不可用');
    throw new Error('未配置 API Key');
  }

  // 检查是否已有相同请求正在进行
  if (pendingRequests.has(functionName)) {
    return await pendingRequests.get(functionName)!;
  }

  const requestPromise = (async () => {
    try {
      // 等待并发槽位
      await waitForSlot();
      
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
          timeout: 30000, // 增加到30秒超时
          // 添加 keepAlive 和其他配置
          httpAgent: new (require('http').Agent)({ 
            keepAlive: true,
            keepAliveMsecs: 30000,
            maxSockets: MAX_CONCURRENT_REQUESTS
          }),
          httpsAgent: new (require('https').Agent)({ 
            keepAlive: true,
            keepAliveMsecs: 30000,
            maxSockets: MAX_CONCURRENT_REQUESTS
          })
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
      // 如果是网络错误且还有重试次数，进行重试
      const isNetworkError = error.code === 'ECONNRESET' || 
                            error.code === 'ETIMEDOUT' || 
                            error.message?.includes('socket hang up') ||
                            error.message?.includes('timeout');
      
      if (isNetworkError && retryCount < maxRetries) {
        console.warn(`AI翻译网络错误，重试 ${retryCount + 1}/${maxRetries}: ${functionName}`);
        // 指数退避：等待更长时间后重试
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
        pendingRequests.delete(functionName); // 清理旧请求
        return translateWithAI(functionName, retryCount + 1);
      }
      
      console.error(`AI模型调用失败（已重试${maxRetries}次）: ${error.message}`);
      throw error;
    } finally {
      // 释放并发槽位
      releaseSlot();
      // 清理pending请求
      pendingRequests.delete(functionName);
    }
  })();

  pendingRequests.set(functionName, requestPromise);
  return await requestPromise;
}


/**
 * 将函数名转换为中文语义
 * 完全依赖 AI 模型进行翻译（使用内置 API Key）
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

  let translation: string;

  // 如果启用 AI，使用私有云AI服务（内置API Key）
  if (enableAI) {
    try {
      translation = await translateWithAI(functionName);
    } catch (error) {
      console.warn(`AI 翻译失败，保留原函数名: ${error}`);
      translation = functionName; // AI失败时保留原函数名
    }
  } else {
    // 未启用AI，保留原函数名
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

// 回调函数：翻译完成后刷新界面
let onTranslationComplete: (() => void) | undefined;

/**
 * 设置翻译完成回调（用于刷新界面）
 */
export function setTranslationCompleteCallback(callback: () => void) {
  onTranslationComplete = callback;
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

  // 如果启用 AI，在后台异步获取翻译
  if (enableAI) {
    translateFunctionNameToChinese(functionName).then(result => {
      // 翻译完成后触发界面刷新
      if (onTranslationComplete) {
        onTranslationComplete();
      }
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

  // 0. 优先处理 React Hook 的变量赋值形式
  // 如: const onChooseSomeAddress = useCallback(...)
  // 如: const mixedPay = useMemo(...)
  // 如: const handleAnalysisAddr = useMemoizedFn(async (...) => {  (跨行)
  // 关键：优先提取变量名并翻译，而不是使用 Hook 的通用标签
  
  // 先尝试匹配单行形式
  let hookVarMatch = s.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:React\.)?(use[A-Z]\w*)\s*\(/);
  if (hookVarMatch) {
    functionName = hookVarMatch[1];
  }
  
  // 如果没匹配到，尝试跨行匹配（函数名在上一行）
  if (!functionName && startLine > 0) {
    const prevLine = doc.lineAt(startLine - 1).text.trim();
    const twoLinesUp = startLine > 1 ? doc.lineAt(startLine - 2).text.trim() : '';
    
    // 检查上一行是否有 Hook 赋值（如 const foo = useXxx( ）
    const prevHookMatch = prevLine.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:React\.)?(use[A-Z]\w*)\s*\(/);
    if (prevHookMatch) {
      functionName = prevHookMatch[1];
    }
    
    // 检查上上一行（三行跨度）
    if (!functionName) {
      const twoLinesHookMatch = twoLinesUp.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:React\.)?(use[A-Z]\w*)\s*\(/);
      if (twoLinesHookMatch) {
        functionName = twoLinesHookMatch[1];
      }
    }
  }
  
  // 如果找到了 Hook 变量赋值的函数名，直接翻译并返回
  if (functionName) {
    const chineseName = translateFunctionNameToChineseSync(functionName);
    return chineseName;
  }

  // 1. 直接的 Hook 调用（无变量赋值）
  // 如: useEffect(() => {})
  const directHookMatch = s.match(/\b(?:React\.)?(useEffect|useState|useMemo|useCallback|useRef|useReducer|useLayoutEffect|useContext|useImperativeHandle|useDebugValue|useDeferredValue|useTransition|useId|useSyncExternalStore|useInsertionEffect)\s*\(/);
  if (directHookMatch) {
    const HOOK_LABELS: Record<string, string> = {
      useEffect: '副作用处理',
      useState: '状态管理',
      useMemo: '记忆化计算',
      useCallback: '回调记忆',
      useRef: '引用持久化',
      useReducer: '状态归约',
      useLayoutEffect: '布局副作用',
      useContext: '上下文读取',
      useImperativeHandle: '暴露实例方法',
      useDebugValue: '调试标记',
      useDeferredValue: '延迟值',
      useTransition: '并发过渡',
      useId: '稳定ID',
      useSyncExternalStore: '外部存储同步',
      useInsertionEffect: '样式插入副作用',
    };
    const hook = directHookMatch[1];
    return HOOK_LABELS[hook] || 'Hook 调用';
  }

  // 2. 变量赋值 + 回调箭头函数作为参数：const foo = await bar(..., () => { ... })
  //    或 const foo = bar(..., async () => { ... })
  if (!functionName) {
    let m2 = s.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*[^;]*\([^)]*\)\s*=>/);
    if (m2) {
      functionName = m2[1];
    }
  }

  // 3. 命名 function: function foo(...) {
  if (!functionName) {
    let m = s.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (m) {
      functionName = m[1];
    }
  }

  // 4. const/let/var 声明的箭头函数（支持 export、泛型、返回类型）
  // 如: export const aa = () => { 
  // 如: const aa: Type = async <T>() : ReturnType =>
  // 如: export const initOrderTemplate = (): API.Order.OrderTemplateInfo => {
  if (!functionName) {
    let m = s.match(/\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::\s*[^=>]+)?\s*=>/);
    if (m) {
      functionName = m[1];
    }
  }

  // 5. 赋值的箭头函数（支持泛型）: aa = () => { / aa = async <T>() : ReturnType =>
  if (!functionName) {
    let m = s.match(/\b([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::\s*[^=>]+)?\s*=>/);
    if (m) {
      functionName = m[1];
    }
  }

  // 6. 其他箭头函数（如回调）: [=:)] => { / 跨行
  if (!functionName) {
    let m = s.match(/[=:\)]\s*=>/);
    if (m) {
      functionName = 'anonymous';
    }
  }

  // 7. async 方法: async method() { 或 method() {
  if (!functionName) {
    let m = s.match(/^(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
    if (m) {
      functionName = m[1];
    }
  }

  // 8. 对象方法: foo: function() { 或 { method() {
  if (!functionName) {
    let m = s.match(/[:,]\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
    if (m) {
      functionName = m[1];
    }
  }

  // 9. 检查多行函数定义（函数名在上一行）
  if (!functionName && startLine > 0) {
    const prevLine = doc.lineAt(startLine - 1).text.trim();
    const combined = `${prevLine} ${l1}`;
    
    // 检查上一行是否有函数名
    let m = combined.match(/\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::\s*[^=>]+)?\s*=>/);
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