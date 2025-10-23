import * as vscode from 'vscode';
import { onExclusionRanges } from './exclusionBus';
import { COLOR_SCHEMES_LIGHT, COLOR_SCHEMES_DARK } from './colorSchemes';
import { translateFunctionNameToChinese, TranslationPriority } from './semanticTranslator';

let suppressRanges: vscode.Range[] = [];
onExclusionRanges((rs) => { suppressRanges = rs; });

/** 颜色条缓存：不同颜色 → 独立 DecorationType */
const stripeTypeCache = new Map<string, vscode.TextEditorDecorationType>();

/** 行尾中文语义化注释 */
const annotationType = vscode.window.createTextEditorDecorationType({
  isWholeLine: false,
  rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
  after: {
    margin: '0 0 0 8px',
    color: new vscode.ThemeColor('editorCodeLens.foreground'),
  },
});

/** Vue 组件识别缓存 */
const vueItemCache = new Map<string, { items: VueDecoratedItem[]; version: number }>();

/** 防重复执行标志 */
let isApplyingVueDecorations = false;

interface VueDecoratedItem {
  range: vscode.Range;
  type: VueComponentType;
  lineContent: string;
  section?: 'template' | 'script' | 'style';
}

/** Vue 组件类型 */
type VueComponentType = 
  | 'vue-composition-api'  // Composition API
  | 'vue-lifecycle'        // 生命周期钩子
  | 'vue-directive'        // 模板指令
  | 'vue-event'           // 事件处理
  | 'vue-computed'        // 计算属性
  | 'vue-watch'           // 监听器
  | 'vue-ref'             // ref/reactive
  | 'vue-function'        // Vue函数
  | 'vue-div-block';      // 模板div块

/** Vue Composition API 关键字 */
const VUE_COMPOSITION_API = [
  'ref', 'reactive', 'computed', 'watch', 'watchEffect',
  'onMounted', 'onUnmounted', 'onUpdated', 'onBeforeMount', 'onBeforeUnmount', 'onBeforeUpdate',
  'provide', 'inject', 'nextTick', 'defineProps', 'defineEmits', 'defineExpose'
] as const;

/** Vue 生命周期钩子 */
const VUE_LIFECYCLE_HOOKS = [
  'onMounted', 'onUnmounted', 'onUpdated', 'onBeforeMount', 
  'onBeforeUnmount', 'onBeforeUpdate', 'onActivated', 'onDeactivated'
] as const;

/** Vue 模板指令 */
const VUE_DIRECTIVES = [
  'v-if', 'v-else', 'v-else-if', 'v-for', 'v-show', 'v-model',
  'v-bind', 'v-on', 'v-slot', 'v-text', 'v-html', 'v-once', 'v-cloak'
] as const;

/** 彩虹色数组 - 马卡龙色系，用于div块区分 */
const RAINBOW_COLORS = [
  'rgba(255, 182, 193, 0.3)',  // 樱花粉
  'rgba(173, 216, 230, 0.3)',   // 浅蓝
  'rgba(221, 160, 221, 0.3)',  // 淡紫
  'rgba(144, 238, 144, 0.3)',   // 薄荷绿
  'rgba(255, 218, 185, 0.3)',  // 桃色
  'rgba(255, 192, 203, 0.3)',  // 粉红
  'rgba(176, 224, 230, 0.3)',  // 淡青
  'rgba(230, 230, 250, 0.3)',  // 薰衣草
  'rgba(152, 251, 152, 0.3)',  // 春绿
  'rgba(255, 228, 196, 0.3)',  // 米色
  'rgba(255, 239, 213, 0.3)',  // 香草
  'rgba(240, 248, 255, 0.3)',  // 爱丽丝蓝
  'rgba(255, 240, 245, 0.3)',  // 薰衣草雾
  'rgba(240, 255, 240, 0.3)',  // 蜜瓜
  'rgba(255, 250, 240, 0.3)',  // 亚麻
  'rgba(248, 248, 255, 0.3)',  // 幽灵白
  'rgba(255, 245, 238, 0.3)',  // 海贝壳
  'rgba(245, 255, 250, 0.3)',  // 薄荷奶油
  'rgba(250, 240, 230, 0.3)'   // 亚麻布
];

/** 常用组件识别配置 - 马卡龙色系 */
const COMMON_COMPONENTS = [
  { name: 'Popup', pattern: /<Popup\b/i, color: 'rgba(255, 182, 193,0.3)', type: '弹出层' },      // 樱花粉
  { name: 'Toast', pattern: /<Toast\b/i, color: 'rgba(173, 216, 230,0.3)', type: '轻提示' },      // 浅蓝
  { name: 'List', pattern: /<List\b/i, color: 'rgba(221, 160, 221,0.3)', type: '列表' },         // 淡紫
  { name: 'Field', pattern: /<Field\b/i, color: 'rgba(144, 238, 144,0.3)', type: '输入框' },     // 薄荷绿
  { name: 'Tabs', pattern: /<Tabs\b/i, color: 'rgba(255, 218, 185,0.3)', type: '标签页' },       // 桃色
  { name: 'Picker', pattern: /<Picker\b/i, color: 'rgba(255, 192, 203,0.3)', type: '选择器' },   // 粉红
  { name: 'Tab', pattern: /<Tab\b/i, color: 'rgba(176, 224, 230,0.3)', type: '标签页项' },        // 淡青
  { name: 'Cell', pattern: /<Cell\b/i, color: 'rgba(230, 230, 250,0.3)', type: '单元格' },        // 薰衣草
  { name: 'Dialog', pattern: /<Dialog\b/i, color: 'rgba(152, 251, 152,0.3)', type: '对话框' },   // 春绿
  { name: 'CellGroup', pattern: /<CellGroup\b/i, color: 'rgba(255, 228, 196,0.3)', type: '单元格组' } // 米色
];

/** 函数颜色数组 - 马卡龙色系，用于长函数区分 */
const FUNCTION_COLORS = [
  'rgba(255, 182, 193, 0.3)',  // 樱花粉
  'rgba(173, 216, 230, 0.3)',   // 浅蓝
  'rgba(221, 160, 221, 0.3)',  // 淡紫
  'rgba(144, 238, 144, 0.3)',   // 薄荷绿
  'rgba(255, 218, 185, 0.3)',  // 桃色
  'rgba(255, 192, 203, 0.3)',  // 粉红
  'rgba(176, 224, 230, 0.3)',  // 淡青
  'rgba(230, 230, 250, 0.3)',  // 薰衣草
  'rgba(152, 251, 152, 0.3)',  // 春绿
  'rgba(255, 228, 196, 0.3)',  // 米色
  'rgba(255, 239, 213, 0.3)',  // 香草
  'rgba(240, 248, 255, 0.3)',  // 爱丽丝蓝
  'rgba(255, 240, 245, 0.3)',  // 薰衣草雾
  'rgba(240, 255, 240, 0.3)',  // 蜜瓜
  'rgba(255, 250, 240, 0.3)',  // 亚麻
  'rgba(248, 248, 255, 0.3)',  // 幽灵白
  'rgba(255, 245, 238, 0.3)',  // 海贝壳
  'rgba(245, 255, 250, 0.3)',  // 薄荷奶油
  'rgba(250, 240, 230, 0.3)'   // 亚麻布
];

/**
 * 检测当前主题是否为暗色
 */
function isDarkTheme(): boolean {
  const themeKind = vscode.window.activeColorTheme.kind;
  return themeKind === vscode.ColorThemeKind.Dark || themeKind === vscode.ColorThemeKind.HighContrast;
}

/**
 * 获取当前配置的颜色方案（合并自定义颜色）
 */
function getColorScheme(): Record<string, string> {
  const config = vscode.workspace.getConfiguration('codehue');
  const schemeName = config.get<string>('colorScheme', 'vibrant');
  const schemes = isDarkTheme() ? COLOR_SCHEMES_DARK : COLOR_SCHEMES_LIGHT;
  const baseScheme = schemes[schemeName] || schemes.vibrant;
  
  // Vue 专用颜色方案
  const vueColors: Record<string, string> = {
    'vue-composition-api': 'rgba(66, 184, 131, 0.3)',
    'vue-lifecycle': 'rgba(53, 73, 94, 0.3)',
    'vue-directive':'rgba(255, 107, 107, 0.3)', 
    'vue-event':'rgba(60, 179, 113, 0.3)',
    'vue-computed':'rgba(45, 112, 255, 0.3)',
    'vue-watch': '#96ceb4',
    'vue-ref': '#feca57',
    'vue-template': 'rgba(66, 184, 131, 0.3)',
    'vue-script': 'rgba(53, 73, 94, 0.3)',
    'vue-style': 'rgba(255, 107, 107, 0.3)',
    'vue-function': '#8e44ad',
    'vue-div-block': '#e74c3c', // 默认红色，实际会使用彩虹色
  };
  
  return { ...baseScheme, ...vueColors };
}

/**
 * 获取背景色装饰
 */
function getBackgroundDecoration(color: string): vscode.TextEditorDecorationType {
  const cacheKey = `${color}-vue-bg`;

  if (stripeTypeCache.has(cacheKey)) {
    return stripeTypeCache.get(cacheKey)!;
  }

  const dt = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    backgroundColor: color,
    overviewRulerColor: color,
    overviewRulerLane: vscode.OverviewRulerLane.Left,
  });

  stripeTypeCache.set(cacheKey, dt);
  return dt;
}

/**
 * 检测Vue Composition API调用
 */
function detectVueCompositionAPI(text: string): string | undefined {
  const normalized = text.replace(/\s+/g, ' ').trim();
  
  for (const api of VUE_COMPOSITION_API) {
    const pattern = new RegExp(`\\b${api}\\s*\\(`, 'i');
    if (pattern.test(normalized)) {
      return api;
    }
  }
  
  return undefined;
}

/**
 * 检测Vue生命周期钩子
 */
function detectVueLifecycle(text: string): string | undefined {
  const normalized = text.replace(/\s+/g, ' ').trim();
  
  for (const hook of VUE_LIFECYCLE_HOOKS) {
    const pattern = new RegExp(`\\b${hook}\\s*\\(`, 'i');
    if (pattern.test(normalized)) {
      return hook;
    }
  }
  
  return undefined;
}

/**
 * 检测Vue模板指令
 */
function detectVueDirective(text: string): string | undefined {
  for (const directive of VUE_DIRECTIVES) {
    const pattern = new RegExp(`\\b${directive}(?:\\s*=|\\s*:)`, 'i');
    if (pattern.test(text)) {
      return directive;
    }
  }
  
  return undefined;
}

/**
 * 检测Vue事件处理
 */
function detectVueEvent(text: string): string | undefined {
  const eventPattern = /@(\w+)(?:\s*=|:)/;
  const match = text.match(eventPattern);
  return match ? match[1] : undefined;
}

/**
 * 提取Vue函数名
 */
function extractVueFunctionName(text: string): string {
  // 1. 箭头函数: const func = () => {}
  let match = text.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/);
  if (match) return match[1];

  // 2. 普通函数: function func() {}
  match = text.match(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (match) return match[1];

  // 3. 对象方法: method() {}
  match = text.match(/^\s*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/);
  if (match) return match[1];

  // 4. 箭头函数赋值: func = () => {}
  match = text.match(/\b([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/);
  if (match) return match[1];

  return '';
}

/**
 * 检测div标签块并识别组件信息
 */
function detectDivBlocks(doc: vscode.TextDocument, templateRange: vscode.Range): Array<{range: vscode.Range, componentInfo: string}> {
  const divBlocks: Array<{range: vscode.Range, componentInfo: string}> = [];
  const divStack: { startLine: number, startChar: number, componentInfo: string }[] = [];
  
  for (let i = templateRange.start.line; i <= templateRange.end.line; i++) {
    const line = doc.lineAt(i).text;
    
    // 查找div开始标签
    const openDivMatch = line.match(/<div\b[^>]*>/gi);
    if (openDivMatch) {
      for (const match of openDivMatch) {
        const startIndex = line.indexOf(match);
        const componentInfo = extractComponentInfo(line, match);
        divStack.push({ startLine: i, startChar: startIndex, componentInfo });
      }
    }
    
    // 查找div结束标签
    const closeDivMatch = line.match(/<\/div>/gi);
    if (closeDivMatch && divStack.length > 0) {
      for (const match of closeDivMatch) {
        const endIndex = line.indexOf(match) + match.length;
        const start = divStack.pop()!;
        
        // 确保范围有效
        if (start && start.startLine <= i) {
          divBlocks.push({
            range: new vscode.Range(
              new vscode.Position(start.startLine, start.startChar),
              new vscode.Position(i, endIndex)
            ),
            componentInfo: start.componentInfo
          });
        }
      }
    }
  }
  
  return divBlocks;
}

/**
 * 检测常用组件
 */
function detectCommonComponent(line: string): { name: string, color: string, type: string } | null {
  for (const component of COMMON_COMPONENTS) {
    if (component.pattern.test(line)) {
      return {
        name: component.name,
        color: component.color,
        type: component.type
      };
    }
  }
  return null;
}

/**
 * 从div标签中提取组件信息
 */
function extractComponentInfo(line: string, divMatch: string): string {
  // 0. 优先检查常用组件
  const commonComponent = detectCommonComponent(line);
  if (commonComponent) {
    return `${commonComponent.name} (${commonComponent.type})`;
  }
  
  // 1. 检查是否有class属性
  const classMatch = divMatch.match(/class\s*=\s*["']([^"']+)["']/i);
  if (classMatch) {
    const className = classMatch[1];
    // 提取主要的类名（去掉修饰符）
    const mainClass = className.split(/\s+/)[0];
    return `组件: ${mainClass}`;
  }
  
  // 2. 检查是否有id属性
  const idMatch = divMatch.match(/id\s*=\s*["']([^"']+)["']/i);
  if (idMatch) {
    return `ID: ${idMatch[1]}`;
  }
  
  // 3. 检查是否有Vue指令
  if (divMatch.includes('v-if')) {
    return '条件渲染块';
  }
  if (divMatch.includes('v-for')) {
    return '循环渲染块';
  }
  if (divMatch.includes('v-show')) {
    return '显示控制块';
  }
  
  // 4. 检查是否有事件监听器
  const eventMatch = divMatch.match(/@(\w+)/);
  if (eventMatch) {
    return `事件: ${eventMatch[1]}`;
  }
  
  // 5. 检查是否有数据绑定
  if (divMatch.includes('v-model')) {
    return '双向绑定块';
  }
  if (divMatch.includes('v-bind') || divMatch.includes(':')) {
    return '属性绑定块';
  }
  
  // 6. 检查内容类型（通过分析div内容）
  const content = line.trim();
  if (content.includes('<h1>') || content.includes('<h2>') || content.includes('<h3>')) {
    return '标题区域';
  }
  if (content.includes('<button>') || content.includes('<input>')) {
    return '交互区域';
  }
  if (content.includes('<ul>') || content.includes('<ol>')) {
    return '列表区域';
  }
  if (content.includes('<form>')) {
    return '表单区域';
  }
  if (content.includes('<nav>') || content.includes('导航')) {
    return '导航区域';
  }
  if (content.includes('<header>') || content.includes('头部')) {
    return '头部区域';
  }
  if (content.includes('<footer>') || content.includes('底部')) {
    return '底部区域';
  }
  if (content.includes('<main>') || content.includes('主要内容')) {
    return '主内容区域';
  }
  if (content.includes('<aside>') || content.includes('侧边')) {
    return '侧边栏区域';
  }
  
  // 7. 默认返回
  return '通用容器';
}

/**
 * 获取彩虹色（基于位置）
 */
function getRainbowColor(index: number): string {
  return RAINBOW_COLORS[index % RAINBOW_COLORS.length];
}

/**
 * 获取函数颜色（基于位置，确保相邻函数不同色）
 */
function getFunctionColor(index: number): string {
  return FUNCTION_COLORS[index % FUNCTION_COLORS.length];
}

/**
 * 检测多行ref/reactive声明
 */
function detectMultilineReactive(doc: vscode.TextDocument, scriptRange: vscode.Range): Array<{range: vscode.Range, variableName: string, type: string}> {
  const multilineReactive: Array<{range: vscode.Range, variableName: string, type: string}> = [];
  
  for (let i = scriptRange.start.line; i <= scriptRange.end.line; i++) {
    const line = doc.lineAt(i).text;
    
    // 检测ref/reactive开始
    const reactiveMatch = line.match(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(ref|reactive)\s*\(/);
    
    if (reactiveMatch) {
      const variableName = reactiveMatch[1];
      const type = reactiveMatch[2];
      const startLine = i;
      
      // 查找结束位置
      let braceCount = 0;
      let foundStartBrace = false;
      let endLine = i;
      
      // 查找第一个大括号
      for (let j = i; j <= scriptRange.end.line; j++) {
        const currentLine = doc.lineAt(j).text;
        if (currentLine.includes('{')) {
          foundStartBrace = true;
          break;
        }
        if (j > i + 3) break; // 最多向前查找3行
      }
      
      if (foundStartBrace) {
        // 从找到的大括号开始计数
        for (let j = i; j <= scriptRange.end.line; j++) {
          const currentLine = doc.lineAt(j).text;
          
          for (let k = 0; k < currentLine.length; k++) {
            if (currentLine[k] === '{') {
              braceCount++;
            } else if (currentLine[k] === '}') {
              braceCount--;
              if (braceCount === 0) {
                endLine = j;
                break;
              }
            }
          }
          
          if (braceCount === 0) break;
        }
        
        // 检查是否是多行（超过1行）
        const lineCount = endLine - startLine + 1;
        if (lineCount > 1) {
          multilineReactive.push({
            range: new vscode.Range(
              new vscode.Position(startLine, 0),
              new vscode.Position(endLine, doc.lineAt(endLine).text.length)
            ),
            variableName,
            type
          });
        }
      }
    }
  }
  
  return multilineReactive;
}

/**
 * 检测长函数（超过10行）
 */
function detectLongFunctions(doc: vscode.TextDocument, scriptRange: vscode.Range): Array<{range: vscode.Range, functionName: string, lineCount: number}> {
  const longFunctions: Array<{range: vscode.Range, functionName: string, lineCount: number}> = [];
  
  for (let i = scriptRange.start.line; i <= scriptRange.end.line; i++) {
    const line = doc.lineAt(i).text;
    
    // 检测函数开始 - 支持更多函数声明格式
    const functionPatterns = [
      /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\s*)?\([^)]*\)\s*=>\s*\{/,  // 箭头函数
      /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\s*)?\([^)]*\)\s*\{/,     // 函数表达式
      /^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/,                                   // 函数声明
      /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{/,                // 箭头函数（无function关键字）
    ];
    
    let functionName = '';
    let matchFound = false;
    
    for (const pattern of functionPatterns) {
      const match = line.match(pattern);
      if (match) {
        functionName = match[1];
        matchFound = true;
        break;
      }
    }
    
    if (matchFound) {
      const startLine = i;
      let braceCount = 0;
      let foundStartBrace = false;
      let endLine = i;
      
      // 查找第一个大括号
      for (let j = i; j <= scriptRange.end.line; j++) {
        const currentLine = doc.lineAt(j).text;
        if (currentLine.includes('{')) {
          foundStartBrace = true;
          break;
        }
        if (j > i + 3) break; // 最多向前查找3行
      }
      
      if (foundStartBrace) {
        // 从找到的大括号开始计数
        for (let j = i; j <= scriptRange.end.line; j++) {
          const currentLine = doc.lineAt(j).text;
          
          for (let k = 0; k < currentLine.length; k++) {
            if (currentLine[k] === '{') {
              braceCount++;
            } else if (currentLine[k] === '}') {
              braceCount--;
              if (braceCount === 0) {
                endLine = j;
                break;
              }
            }
          }
          
          if (braceCount === 0) break;
        }
        
        // 检查函数长度
        const lineCount = endLine - startLine + 1;
        if (lineCount > 10) {
          longFunctions.push({
            range: new vscode.Range(
              new vscode.Position(startLine, 0),
              new vscode.Position(endLine, doc.lineAt(endLine).text.length)
            ),
            functionName,
            lineCount
          });
        }
      }
    }
  }
  
  return longFunctions;
}

/**
 * 解析Vue单文件组件结构
 */
function parseVueSFC(doc: vscode.TextDocument): { template: vscode.Range | null, script: vscode.Range | null, style: vscode.Range | null } {
  let template: vscode.Range | null = null;
  let script: vscode.Range | null = null;
  let style: vscode.Range | null = null;
  
  let currentSection: 'template' | 'script' | 'style' | null = null;
  let sectionStart = -1;
  
  for (let i = 0; i < doc.lineCount; i++) {
    const line = doc.lineAt(i).text.trim();
    
    // 检测section开始
    if (line.startsWith('<template')) {
      currentSection = 'template';
      sectionStart = i;
    } else if (line.startsWith('<script')) {
      currentSection = 'script';
      sectionStart = i;
    } else if (line.startsWith('<style')) {
      currentSection = 'style';
      sectionStart = i;
    }
    // 检测section结束
    else if (line.startsWith('</template>') && currentSection === 'template') {
      template = new vscode.Range(sectionStart, 0, i, line.length);
      currentSection = null;
    } else if (line.startsWith('</script>') && currentSection === 'script') {
      script = new vscode.Range(sectionStart, 0, i, line.length);
      currentSection = null;
    } else if (line.startsWith('</style>') && currentSection === 'style') {
      style = new vscode.Range(sectionStart, 0, i, line.length);
      currentSection = null;
    }
  }
  
  return { template, script, style };
}

/**
 * 识别Vue组件中的所有装饰项
 */
function findVueDecoratedItems(doc: vscode.TextDocument): VueDecoratedItem[] {
  const items: VueDecoratedItem[] = [];
  const processed = new Set<number>();
  
  // 解析Vue SFC结构
  const sfc = parseVueSFC(doc);
  
  // 处理script区域
  if (sfc.script) {
    // 检测多行ref/reactive声明
    const multilineReactive = detectMultilineReactive(doc, sfc.script);
    multilineReactive.forEach((reactive, index) => {
      items.push({
        range: reactive.range,
        type: 'vue-ref',
        lineContent: `${reactive.variableName} (${reactive.type})`,
        section: 'script'
      });
      // 标记多行reactive的所有行为已处理
      for (let line = reactive.range.start.line; line <= reactive.range.end.line; line++) {
        processed.add(line);
      }
    });
    
    // 检测长函数
    const longFunctions = detectLongFunctions(doc, sfc.script);
    longFunctions.forEach((func, index) => {
      items.push({
        range: func.range,
        type: 'vue-function',
        lineContent: `${func.functionName} (${func.lineCount}行)`,
        section: 'script'
      });
      // 标记长函数的所有行为已处理
      for (let line = func.range.start.line; line <= func.range.end.line; line++) {
        processed.add(line);
      }
    });
    
    for (let i = sfc.script.start.line; i <= sfc.script.end.line; i++) {
      if (processed.has(i)) continue;
      
      const line = doc.lineAt(i).text;
      const trimmed = line.trim();
      
      // 检测Composition API
      const compositionAPI = detectVueCompositionAPI(trimmed);
      if (compositionAPI) {
        const range = new vscode.Range(i, 0, i, line.length);
        items.push({
          range,
          type: 'vue-composition-api',
          lineContent: trimmed,
          section: 'script'
        });
        processed.add(i);
        continue;
      }
      
      // 检测生命周期钩子
      const lifecycle = detectVueLifecycle(trimmed);
      if (lifecycle) {
        const range = new vscode.Range(i, 0, i, line.length);
        items.push({
          range,
          type: 'vue-lifecycle',
          lineContent: trimmed,
          section: 'script'
        });
        processed.add(i);
        continue;
      }
      
      // 检测单行ref/reactive（不在多行检测中）
      if (/^\s*(?:const|let|var)\s+\w+\s*=\s*(?:ref|reactive)\s*\([^)]*\)\s*;?\s*$/.test(trimmed)) {
        const range = new vscode.Range(i, 0, i, line.length);
        items.push({
          range,
          type: 'vue-ref',
          lineContent: trimmed,
          section: 'script'
        });
        processed.add(i);
        continue;
      }
      
      // 检测computed
      if (/^\s*(?:const|let|var)\s+\w+\s*=\s*computed\s*\(/.test(trimmed)) {
        const range = new vscode.Range(i, 0, i, line.length);
        items.push({
          range,
          type: 'vue-computed',
          lineContent: trimmed,
          section: 'script'
        });
        processed.add(i);
        continue;
      }
      
      // 检测watch
      if (/^\s*watch\s*\(/.test(trimmed)) {
        const range = new vscode.Range(i, 0, i, line.length);
        items.push({
          range,
          type: 'vue-watch',
          lineContent: trimmed,
          section: 'script'
        });
        processed.add(i);
        continue;
      }
      
      // 检测Vue函数（非Composition API）
      const functionName = extractVueFunctionName(trimmed);
      if (functionName && !compositionAPI && !lifecycle) {
        const range = new vscode.Range(i, 0, i, line.length);
        items.push({
          range,
          type: 'vue-function',
          lineContent: trimmed,
          section: 'script'
        });
        processed.add(i);
        continue;
      }
    }
  }
  
  // 处理template区域
  if (sfc.template) {
    // 检测div块
    const divBlocks = detectDivBlocks(doc, sfc.template);
    divBlocks.forEach((divBlock, index) => {
      items.push({
        range: divBlock.range,
        type: 'vue-div-block',
        lineContent: `<div> ${divBlock.componentInfo}`,
        section: 'template'
      });
    });
    
    for (let i = sfc.template.start.line; i <= sfc.template.end.line; i++) {
      if (processed.has(i)) continue;
      
      const line = doc.lineAt(i).text;
      
      // 检测Vue指令
      const directive = detectVueDirective(line);
      if (directive) {
        const range = new vscode.Range(i, 0, i, line.length);
        items.push({
          range,
          type: 'vue-directive',
          lineContent: line.trim(),
          section: 'template'
        });
        processed.add(i);
        continue;
      }
      
      // 检测Vue事件
      const event = detectVueEvent(line);
      if (event) {
        const range = new vscode.Range(i, 0, i, line.length);
        items.push({
          range,
          type: 'vue-event',
          lineContent: line.trim(),
          section: 'template'
        });
        processed.add(i);
        continue;
      }
    }
  }
  
  // 不再为大的template、script、style标签添加装饰
  // 这些是Vue单文件组件的结构约定，不需要特殊标注
  
  return items;
}

/**
 * 获取Vue组件的中文标签
 */
function getVueChineseLabel(type: VueComponentType): string {
  const labels: Record<VueComponentType, string> = {
    'vue-composition-api': '组合式API',
    'vue-lifecycle': '生命周期',
    'vue-directive': '模板指令',
    'vue-event': '事件处理',
    'vue-computed': '计算属性',
    'vue-watch': '监听器',
    'vue-ref': '响应式数据',
    'vue-function': 'Vue函数',
    'vue-div-block': '模板块',
  };

  return labels[type] || type;
}

/**
 * 应用Vue组件装饰
 */
export function applyVueDecorations(editor: vscode.TextEditor): void {
  // 防重复执行
  if (isApplyingVueDecorations) {
    return;
  }
  
  isApplyingVueDecorations = true;
  
  try {
    const doc = editor.document;
    
    // 只处理Vue文件
    if (doc.languageId !== 'vue') {
      return;
    }
    
    // 性能检查
    if (doc.lineCount > 10000) {
      return;
    }
  
  // 获取缓存或计算
  const docUri = doc.uri.toString();
  const docVersion = doc.version;
  
  let items: VueDecoratedItem[] = [];
  
  const cached = vueItemCache.get(docUri);
  if (cached && cached.version === docVersion) {
    items = cached.items;
  } else {
    items = findVueDecoratedItems(doc);
    vueItemCache.set(docUri, { items, version: docVersion });
    
    // 限制缓存大小
    if (vueItemCache.size > 50) {
      const firstKey = vueItemCache.keys().next().value;
      if (firstKey) vueItemCache.delete(firstKey);
    }
  }
  
  // 清除旧装饰
  stripeTypeCache.forEach((dt) => editor.setDecorations(dt, []));
  editor.setDecorations(annotationType, []);
  
  // 按类型分组并应用颜色
  const groups = new Map<string, vscode.Range[]>();
  const colorScheme = getColorScheme();
  
  for (const item of items) {
    if (!groups.has(item.type)) {
      groups.set(item.type, []);
    }
    groups.get(item.type)!.push(item.range);
  }
  
  for (const [type, ranges] of groups) {
    let color = colorScheme[type] || colorScheme['default'];
    
    // 特殊处理div块 - 使用彩虹色或常用组件颜色
    if (type === 'vue-div-block') {
      ranges.forEach((range, index) => {
        // 检查是否是常用组件
        const line = doc.lineAt(range.start.line).text;
        const commonComponent = detectCommonComponent(line);
        
        let finalColor: string;
        if (commonComponent) {
          finalColor = commonComponent.color;
        } else {
          finalColor = getRainbowColor(index);
        }
        
        const dt = getBackgroundDecoration(finalColor);
        editor.setDecorations(dt, [range]);
      });
    } 
    // 特殊处理长函数 - 使用函数颜色
    else if (type === 'vue-function') {
      ranges.forEach((range, index) => {
        const functionColor = getFunctionColor(index);
        const dt = getBackgroundDecoration(functionColor);
        editor.setDecorations(dt, [range]);
      });
    } 
    else {
      const dt = getBackgroundDecoration(color);
      editor.setDecorations(dt, ranges);
    }
  }
  
  // 应用中文语义注释
  const config = vscode.workspace.getConfiguration('codehue');
  const enableSemanticComments = config.get<boolean>('enableSemanticComments', true);
  
  const annotations: vscode.DecorationOptions[] = [];
  
  if (enableSemanticComments) {
    const annotationMap = new Map<string, string>();
    
    for (const item of items) {
      // 不再为section区域添加注释，这些是结构约定
      
      const line = item.range.start.line;
      let chineseLabel = getVueChineseLabel(item.type);
      
      // 如果是div块，显示组件信息
      if (item.type === 'vue-div-block') {
        // 从lineContent中提取组件信息
        const componentInfo = item.lineContent.replace('<div>', '').trim();
        if (componentInfo) {
          chineseLabel = componentInfo;
        }
      }
      
      // 如果是Vue函数，尝试翻译函数名
      if (item.type === 'vue-function') {
        const functionName = extractVueFunctionName(item.lineContent);
        if (functionName) {
          // 异步获取翻译，但不阻塞主流程
          translateFunctionNameToChinese(functionName, TranslationPriority.INVISIBLE_CURRENT_FILE, docUri)
            .then(translation => {
              // 翻译完成后刷新装饰 - 移除死循环
              // 注释：翻译完成后会自动触发重新渲染，不需要手动调用
            })
            .catch(() => {
              // 翻译失败，使用默认标签
            });
        }
      }
      
      const targetLine = line > 0 ? line - 1 : line;
      const targetPos = doc.lineAt(targetLine).range.end;
      
      const key = `${targetLine}:${targetPos.character}`;
      
      if (!annotationMap.has(key)) {
        annotationMap.set(key, chineseLabel);
      }
    }
    
    for (const [key, label] of annotationMap) {
      const [lineStr, charStr] = key.split(':');
      const line = parseInt(lineStr);
      const char = parseInt(charStr);
      const targetPos = new vscode.Position(line, char);
      
      annotations.push({
        range: new vscode.Range(targetPos, targetPos),
        renderOptions: {
          after: {
            contentText: ` // ${label}`,
          },
        },
      });
    }
  }
  
  editor.setDecorations(annotationType, annotations);
  
  } finally {
    isApplyingVueDecorations = false;
  }
}

/**
 * 清理资源
 */
export function disposeVueDecorations(): void {
  stripeTypeCache.forEach((dt) => dt.dispose());
  stripeTypeCache.clear();
  vueItemCache.clear();
}

/**
 * 获取当前文件中所有的Vue装饰项
 */
export function getVueDecoratedItems(doc: vscode.TextDocument): VueDecoratedItem[] {
  return findVueDecoratedItems(doc);
}
