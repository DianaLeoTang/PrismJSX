import * as vscode from 'vscode';

// ============ 中文语义转换字典 ============

// 常见动词映射
const VERB_MAP: Record<string, string> = {
  'handle': '处理',
  'handler': '处理',
  'create': '创建',
  'update': '更新',
  'delete': '删除',
  'remove': '移除',
  'add': '添加',
  'insert': '插入',
  'get': '获取',
  'fetch': '获取',
  'set': '设置',
  'init': '初始化',
  'initialize': '初始化',
  'load': '加载',
  'save': '保存',
  'open': '打开',
  'close': '关闭',
  'show': '显示',
  'hide': '隐藏',
  'toggle': '切换',
  'check': '检查',
  'validate': '验证',
  'submit': '提交',
  'send': '发送',
  'receive': '接收',
  'parse': '解析',
  'format': '格式化',
  'render': '渲染',
  'draw': '绘制',
  'clear': '清空',
  'reset': '重置',
  'refresh': '刷新',
  'reload': '重载',
  'search': '搜索',
  'filter': '过滤',
  'sort': '排序',
  'calculate': '计算',
  'compute': '计算',
  'process': '处理',
  'transform': '转换',
  'convert': '转换',
  'connect': '连接',
  'disconnect': '断开',
  'start': '开始',
  'stop': '停止',
  'pause': '暂停',
  'resume': '恢复',
  'cancel': '取消',
  'confirm': '确认',
  'apply': '应用',
  'execute': '执行',
  'run': '运行',
  'build': '构建',
  'compile': '编译',
  'deploy': '部署',
  'publish': '发布',
  'subscribe': '订阅',
  'unsubscribe': '取消订阅',
  'register': '注册',
  'unregister': '注销',
  'login': '登录',
  'logout': '登出',
  'auth': '认证',
  'authorize': '授权',
  'navigate': '导航',
  'redirect': '重定向',
  'route': '路由',
  'emit': '触发',
  'dispatch': '分发',
  'broadcast': '广播',
  'notify': '通知',
  'alert': '警告',
  'warn': '警告',
  'error': '错误',
  'debug': '调试',
  'log': '记录',
  'print': '打印',
  'download': '下载',
  'upload': '上传',
  'import': '导入',
  'export': '导出',
  'copy': '复制',
  'paste': '粘贴',
  'cut': '剪切',
  'clone': '克隆',
  'merge': '合并',
  'split': '拆分',
  'join': '连接',
  'append': '追加',
  'prepend': '前置',
  'replace': '替换',
  'swap': '交换',
  'move': '移动',
  'resize': '调整大小',
  'scale': '缩放',
  'rotate': '旋转',
  'flip': '翻转',
  'animate': '动画',
  'transition': '过渡',
};

// 常见名词映射
const NOUN_MAP: Record<string, string> = {
  'data': '数据',
  'config': '配置',
  'setting': '设置',
  'option': '选项',
  'param': '参数',
  'parameter': '参数',
  'value': '值',
  'result': '结果',
  'response': '响应',
  'request': '请求',
  'error': '错误',
  'message': '消息',
  'reason': '原因',
  'event': '事件',
  'callback': '回调',
  'listener': '监听器',
  'observer': '观察者',
  'subscriber': '订阅者',
  'user': '用户',
  'account': '账户',
  'profile': '资料',
  'info': '信息',
  'information': '信息',
  'detail': '详情',
  'list': '列表',
  'item': '项目',
  'element': '元素',
  'node': '节点',
  'component': '组件',
  'module': '模块',
  'service': '服务',
  'controller': '控制器',
  'model': '模型',
  'view': '视图',
  'page': '页面',
  'dialog': '对话框',
  'modal': '模态框',
  'popup': '弹窗',
  'menu': '菜单',
  'button': '按钮',
  'input': '输入框',
  'form': '表单',
  'table': '表格',
  'chart': '图表',
  'image': '图片',
  'file': '文件',
  'folder': '文件夹',
  'directory': '目录',
  'path': '路径',
  'url': '链接',
  'link': '链接',
  'token': '令牌',
  'session': '会话',
  'cache': '缓存',
  'storage': '存储',
  'database': '数据库',
  'query': '查询',
  'filter': '过滤器',
  'sort': '排序',
  'order': '顺序',
  'index': '索引',
  'key': '键',
  'id': 'ID',
  'name': '名称',
  'title': '标题',
  'content': '内容',
  'text': '文本',
  'html': 'HTML',
  'style': '样式',
  'class': '类',
  'type': '类型',
  'status': '状态',
  'state': '状态',
  'flag': '标志',
  'count': '计数',
  'total': '总数',
  'size': '大小',
  'length': '长度',
  'width': '宽度',
  'height': '高度',
  'position': '位置',
  'offset': '偏移',
  'distance': '距离',
  'time': '时间',
  'date': '日期',
  'timestamp': '时间戳',
  'duration': '持续时间',
  'interval': '间隔',
  'delay': '延迟',
  'timeout': '超时',
  'timer': '定时器',
  'animation': '动画',
  'transition': '过渡',
  'effect': '效果',
  'theme': '主题',
  'color': '颜色',
  'background': '背景',
  'border': '边框',
  'margin': '外边距',
  'padding': '内边距',
  'socket': '套接字',
  'websocket': 'WebSocket',
  'connection': '连接',
  'stream': '流',
  'buffer': '缓冲区',
  'queue': '队列',
  'stack': '栈',
  'array': '数组',
  'object': '对象',
  'map': '映射',
  'set': '集合',
  'tree': '树',
  'graph': '图',
  'range': '范围',
  'scope': '作用域',
  'context': '上下文',
  'instance': '实例',
  'prototype': '原型',
  'constructor': '构造函数',
  'method': '方法',
  'function': '函数',
  'property': '属性',
  'attribute': '属性',
  'field': '字段',
  'variable': '变量',
  'constant': '常量',
  'enum': '枚举',
  'interface': '接口',
  'abstract': '抽象',
  'static': '静态',
  'public': '公开',
  'private': '私有',
  'protected': '受保护',
};

// 特殊前缀/后缀处理
const PREFIX_MAP: Record<string, string> = {
  'on': '当',
  'is': '是否',
  'has': '是否有',
  'can': '是否可以',
  'should': '是否应该',
  'will': '将要',
  'did': '已经',
};

const SUFFIX_MAP: Record<string, string> = {
  'ing': '中',
  'ed': '完成',
  'able': '可',
};

/**
 * 将驼峰命名转换为单词数组
 * handleCloseModal -> ['handle', 'Close', 'Modal']
 */
function camelCaseToWords(name: string): string[] {
  // 处理常见缩写（保持大写）
  name = name.replace(/ID([A-Z]|$)/g, 'Id$1');
  name = name.replace(/URL([A-Z]|$)/g, 'Url$1');
  name = name.replace(/HTTP([A-Z]|$)/g, 'Http$1');
  name = name.replace(/API([A-Z]|$)/g, 'Api$1');
  
  // 按大写字母拆分，保留大写字母
  const words: string[] = [];
  let currentWord = '';
  
  for (let i = 0; i < name.length; i++) {
    const char = name[i];
    const nextChar = name[i + 1];
    
    if (char === char.toUpperCase() && char !== char.toLowerCase()) {
      // 当前是大写字母
      if (currentWord) {
        words.push(currentWord);
        currentWord = '';
      }
      // 检查是否是连续大写（如 HTTP）
      if (nextChar && nextChar === nextChar.toUpperCase() && nextChar !== nextChar.toLowerCase()) {
        currentWord += char;
      } else {
        currentWord = char;
      }
    } else {
      currentWord += char;
    }
  }
  
  if (currentWord) {
    words.push(currentWord);
  }
  
  return words;
}

/**
 * 将函数名转换为中文语义
 */
export function translateFunctionNameToChinese(functionName: string): string {
  if (!functionName || functionName === 'anonymous') {
    return '匿名函数';
  }
  // 拆分为单词
  const words = camelCaseToWords(functionName);
  if (words.length === 0) return functionName;
  
  const translations: string[] = [];
  let i = 0;
  
  while (i < words.length) {
    const word = words[i].toLowerCase();
    const nextWord = i + 1 < words.length ? words[i + 1].toLowerCase() : '';
    
    // 检查前缀
    if (i === 0 && PREFIX_MAP[word]) {
      translations.push(PREFIX_MAP[word]);
      i++;
      continue;
    }
    
    // 检查动词
    if (VERB_MAP[word]) {
      translations.push(VERB_MAP[word]);
      i++;
      continue;
    }
    
    // 检查名词
    if (NOUN_MAP[word]) {
      translations.push(NOUN_MAP[word]);
      i++;
      continue;
    }
    
    // 检查组合词（如 websocket）
    if (nextWord) {
      const combined = word + nextWord;
      if (NOUN_MAP[combined]) {
        translations.push(NOUN_MAP[combined]);
        i += 2;
        continue;
      }
    }
    
    // 未找到翻译，保留原词
    translations.push(words[i]);
    i++;
  }
  
  // 组合翻译结果
  return translations.join('');
}

/**
 * 改进的 extractFunctionLabel - 返回中文语义
 * 与 computeFunctionRanges 保持一致的检测逻辑
 */
/** 提取函数名并翻译为中文 */
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
      // 对于匿名箭头函数，尝试从上下文推断名称
      // 这里可能需要更复杂的逻辑，暂时标记为匿名
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

  // 翻译为中文
  const chineseName = translateFunctionNameToChinese(functionName);
  return chineseName;
}