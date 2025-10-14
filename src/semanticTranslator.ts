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

// 持久化缓存到本地存储（跨会话保留）
let globalStorageUri: vscode.Uri | undefined;

/**
 * 初始化缓存系统
 */
export function initializeCache(context: vscode.ExtensionContext): void {
  globalStorageUri = context.globalStorageUri;
  loadCacheFromDisk();
}

/**
 * 从磁盘加载缓存
 */
async function loadCacheFromDisk(): Promise<void> {
  if (!globalStorageUri) return;
  
  try {
    const cacheFile = vscode.Uri.joinPath(globalStorageUri, 'translation-cache.json');
    const data = await vscode.workspace.fs.readFile(cacheFile);
    const cache = JSON.parse(data.toString());
    
    Object.entries(cache).forEach(([key, value]) => {
      translationCache.set(key, value as string);
    });
    
    console.log(`加载了 ${translationCache.size} 条翻译缓存`);
  } catch (error) {
    // 缓存文件不存在或损坏，忽略
  }
}

/**
 * 保存缓存到磁盘
 */
async function saveCacheToDisk(): Promise<void> {
  if (!globalStorageUri) return;
  
  try {
    await vscode.workspace.fs.createDirectory(globalStorageUri);
    const cacheFile = vscode.Uri.joinPath(globalStorageUri, 'translation-cache.json');
    const cache = Object.fromEntries(translationCache);
    await vscode.workspace.fs.writeFile(cacheFile, Buffer.from(JSON.stringify(cache)));
  } catch (error) {
    console.error('保存缓存失败:', error);
  }
}

// 批量翻译队列
interface TranslationTask {
  functionName: string;
  resolve: (value: string) => void;
  reject: (reason: any) => void;
  priority: number; // 0=高优先级（可见区域），1=普通
}

let translationQueue: TranslationTask[] = [];
let processingBatch = false;

// 并发控制
const MAX_CONCURRENT_REQUESTS = 2; // 降低并发数
let activeRequests = 0;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 每次请求间隔至少1000ms（1秒）

/**
 * 批量翻译函数（一次API调用翻译多个函数名）
 */
async function translateBatch(functionNames: string[]): Promise<Map<string, string>> {
  const config = vscode.workspace.getConfiguration('codehue');
  const baseUrl = config.get<string>('aiModelBaseUrl', 'http://llm-model-hub-apis.sf-express.com');
  const model = config.get<string>('aiModelName', 'aiplat/qwen2.5-72b-instruct');
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('未配置 API Key');
  }

  // 等待请求间隔
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  const url = `${baseUrl}/v1/chat/completions`;
  
  // 构建批量翻译提示词
  const functionList = functionNames.map((name, idx) => `${idx + 1}. ${name}`).join('\n');
  
  try {
    const response = await axios.post(
      url,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的代码翻译助手。请将英文函数名翻译成简洁的中文语义描述。要求：1) 保持简洁（2-6个字）2) 体现函数的核心功能 3) 使用专业术语'
          },
          {
            role: 'user',
            content: `请将以下函数名翻译成中文，按序号返回，格式为"序号. 中文翻译"：\n\n${functionList}\n\n只返回翻译结果，每行一个，不要任何解释。`
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000,
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

    const content = response.data.choices[0]?.message?.content?.trim() || '';
    const lines = content.split('\n').filter((l: string) => l.trim());
    
    const results = new Map<string, string>();
    
    // 解析批量翻译结果
    lines.forEach((line: string, idx: number) => {
      if (idx < functionNames.length) {
        // 尝试解析 "序号. 翻译" 格式
        const match = line.match(/^\d+\.\s*(.+)$/);
        const translation = match ? match[1].trim() : line.trim();
        
        const cleaned = translation
          .replace(/^["'「『]|["'」』]$/g, '')
          .replace(/^翻译结果[：:]\s*/i, '')
          .replace(/^中文[：:]\s*/i, '')
          .trim();
        
        results.set(functionNames[idx], cleaned || functionNames[idx]);
      }
    });
    
    // 如果某些函数没有翻译结果，使用原函数名
    functionNames.forEach(name => {
      if (!results.has(name)) {
        results.set(name, name);
      }
    });
    
    return results;
  } catch (error: any) {
    console.error(`批量翻译失败: ${error.message}`);
    
    // 如果是 429 错误，等待更长时间
    if (error.response?.status === 429) {
      console.warn('触发速率限制，等待10秒后重试...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    throw error;
  }
}

/**
 * 处理翻译队列（批量处理）
 */
async function processBatchQueue(): Promise<void> {
  if (processingBatch || translationQueue.length === 0) {
    return;
  }

  processingBatch = true;

  try {
    while (translationQueue.length > 0) {
      // 等待并发槽位
      while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 按优先级排序
      translationQueue.sort((a, b) => a.priority - b.priority);

      // 取出一批待翻译的函数（最多5个一批，避免单次请求过大）
      const batchSize = Math.min(5, translationQueue.length);
      const batch = translationQueue.splice(0, batchSize);
      
      const functionNames = batch.map(task => task.functionName);
      
      activeRequests++;

      try {
        const results = await translateBatch(functionNames);
        
        // 更新缓存并返回结果
        batch.forEach(task => {
          const translation = results.get(task.functionName) || task.functionName;
          translationCache.set(task.functionName, translation);
          task.resolve(translation);
        });

        // 定期保存缓存
        if (translationCache.size % 20 === 0) {
          saveCacheToDisk();
        }
      } catch (error) {
        // 批量失败时，回退到单个翻译或直接返回原函数名
        batch.forEach(task => {
          console.warn(`翻译失败，保留原函数名: ${task.functionName}`);
          translationCache.set(task.functionName, task.functionName);
          task.resolve(task.functionName);
        });
      } finally {
        activeRequests--;
      }

      // 批次间增加延迟，避免触发速率限制
      if (translationQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } finally {
    processingBatch = false;
    
    // 最终保存缓存
    await saveCacheToDisk();
  }
}

/**
 * 使用私有云AI模型翻译函数名（队列化处理）
 */
async function translateWithAI(functionName: string, priority: number = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    translationQueue.push({
      functionName,
      resolve,
      reject,
      priority
    });

    // 触发批量处理
    processBatchQueue();
  });
}

/**
 * 将函数名转换为中文语义
 */
export async function translateFunctionNameToChinese(functionName: string, priority: number = 1): Promise<string> {
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

  if (!enableAI) {
    return functionName;
  }

  try {
    const translation = await translateWithAI(functionName, priority);
    return translation;
  } catch (error) {
    console.warn(`AI 翻译失败，保留原函数名: ${error}`);
    return functionName;
  }
}

// 回调函数：翻译完成后刷新界面
let onTranslationComplete: (() => void) | undefined;

/**
 * 设置翻译完成回调（用于刷新界面）
 */
export function setTranslationCompleteCallback(callback: () => void): void {
  onTranslationComplete = callback;
}

/**
 * 同步版本的翻译函数（用于向后兼容）
 * 如果启用 AI，会先尝试从缓存获取，否则返回原函数名并在后台异步翻译
 */
export function translateFunctionNameToChineseSync(functionName: string, isVisible: boolean = false): string {
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
    // 可见区域的函数设置高优先级
    const priority = isVisible ? 0 : 1;
    
    translateFunctionNameToChinese(functionName, priority).then(result => {
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
export function extractFunctionLabel(doc: vscode.TextDocument, startLine: number, isVisible: boolean = false): string {
  const l1 = doc.lineAt(startLine).text.trim();
  const l2 = startLine + 1 < doc.lineCount ? doc.lineAt(startLine + 1).text.trim() : '';
  const s = `${l1} ${l2}`;

  let functionName = '';

  // 0. 优先处理 React Hook 的变量赋值形式
  let hookVarMatch = s.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:React\.)?(use[A-Z]\w*)\s*\(/);
  if (hookVarMatch) {
    functionName = hookVarMatch[1];
  }
  
  // 如果没匹配到，尝试跨行匹配（函数名在上一行）
  if (!functionName && startLine > 0) {
    const prevLine = doc.lineAt(startLine - 1).text.trim();
    const twoLinesUp = startLine > 1 ? doc.lineAt(startLine - 2).text.trim() : '';
    
    // 检查上一行是否有 Hook 赋值
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
    const chineseName = translateFunctionNameToChineseSync(functionName, isVisible);
    return chineseName;
  }

  // 1. 直接的 Hook 调用（无变量赋值）
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

  // 2. 变量赋值 + 回调箭头函数作为参数
  if (!functionName) {
    let m2 = s.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*[^;]*\([^)]*\)\s*=>/);
    if (m2) {
      functionName = m2[1];
    }
  }

  // 3. 命名 function
  if (!functionName) {
    let m = s.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (m) {
      functionName = m[1];
    }
  }

  // 4. const/let/var 声明的箭头函数
  if (!functionName) {
    let m = s.match(/\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::\s*[^=>]+)?\s*=>/);
    if (m) {
      functionName = m[1];
    }
  }

  // 5. 赋值的箭头函数
  if (!functionName) {
    let m = s.match(/\b([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::\s*[^=>]+)?\s*=>/);
    if (m) {
      functionName = m[1];
    }
  }

  // 6. 其他箭头函数
  if (!functionName) {
    let m = s.match(/[=:\)]\s*=>/);
    if (m) {
      functionName = 'anonymous';
    }
  }

  // 7. async 方法
  if (!functionName) {
    let m = s.match(/^(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
    if (m) {
      functionName = m[1];
    }
  }

  // 8. 对象方法
  if (!functionName) {
    let m = s.match(/[:,]\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
    if (m) {
      functionName = m[1];
    }
  }

  // 9. 检查多行函数定义
  if (!functionName && startLine > 0) {
    const prevLine = doc.lineAt(startLine - 1).text.trim();
    const combined = `${prevLine} ${l1}`;
    
    let m = combined.match(/\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s+)?(?:<[^>]*>\s*)?\([^)]*\)\s*(?::\s*[^=>]+)?\s*=>/);
    if (m) {
      functionName = m[1];
    }
  }

  if (!functionName) {
    return '匿名函数';
  }

  // 使用同步版本的翻译（优先从缓存获取）
  const chineseName = translateFunctionNameToChineseSync(functionName, isVisible);
  return chineseName;
}

/**
 * 清空翻译缓存
 */
export function clearTranslationCache(): void {
  translationCache.clear();
  translationQueue = [];
  saveCacheToDisk();
}