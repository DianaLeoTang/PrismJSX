/**
 * 颜色方案配置文件
 * 定义了不同主题下的所有颜色方案
 */

/** 颜色方案类型定义 */
export type ColorSchemeMap = Record<string, string>;

/** 颜色方案定义 - 亮色主题 */
export const COLOR_SCHEMES_LIGHT: Record<string, ColorSchemeMap> = {
  vibrant: {
    // === 高频 Hooks（6大主色，差异巨大）===
    'usestate': '#E65100',         // 🔴 深橙红 → 状态（最常用！）
    'useeffect': '#1565C0',        // 🔵 深蓝 → 副作用（第二常用！）
    'usememo': '#6A1B9A',          // 🟣 深紫 → 缓存优化
    'usecallback': '#00695C',      // 🟢 深青绿 → 回调优化
    // 'useref': '#AD1457',           // 🔴 深粉红 → 引用
    // 'usecontext': '#EF6C00',       // 🟠 深橙 → 上下文
    
    // === 低频 Hooks（复用相近色系）===
    // 'usereducer': '#BF360C',       // 深橙红系（复用 useState 色系）
    // 'uselayouteffect': '#0D47A1',  // 深蓝系（复用 useEffect 色系）
    // 'useimperativehandle': '#004D40', // 深青绿系（复用 useCallback 色系）
    // 'usedebugvalue': '#880E4F',    // 深粉红系（复用 useRef 色系）
    // 'usedeferredvalue': '#4A148C', // 深紫系（复用 useMemo 色系）
    // 'usetransition': '#7B1FA2',    // 中紫系（复用 useMemo 色系）
    // 'useid': '#00796B',            // 中青系（复用 useCallback 色系）
    // 'usesyncexternalstore': '#F57F17', // 金黄（特殊标识）
    // 'useinsertioneffect': '#01579B', // 深蓝系（复用 useEffect 色系）
    
    // === 其他 ===
    'region': '#2E7D32',           // 深绿 → 区域标识
    // 'component': '#311B92',        // 深靛蓝 → 组件
    // 'handler': '#C62828',          // 深红 → 事件处理
    'default': '#424242'           // 深灰 → 默认函数
  },
  soft: {
    // === 高频 Hooks（6大主色，差异明显）===
    'usestate': '#FF9800',         // 🟠 橙色 → 状态
    'useeffect': '#42A5F5',        // 🔵 蓝色 → 副作用
    'usememo': '#AB47BC',          // 🟣 紫色 → 缓存优化
    'usecallback': '#26A69A',      // 🟢 青绿 → 回调优化
    // 'useref': '#EC407A',           // 🔴 粉红 → 引用
    // 'usecontext': '#FFA726',       // 🟠 浅橙 → 上下文
    
    // === 低频 Hooks（复用相近色系）===
    // 'usereducer': '#FB8C00',       // 橙色系（复用 useState 色系）
    // 'uselayouteffect': '#1E88E5',  // 蓝色系（复用 useEffect 色系）
    // 'useimperativehandle': '#00897B', // 青绿系（复用 useCallback 色系）
    // 'usedebugvalue': '#D81B60',    // 粉红系（复用 useRef 色系）
    // 'usedeferredvalue': '#8E24AA', // 紫色系（复用 useMemo 色系）
    // 'usetransition': '#9C27B0',    // 紫色系（复用 useMemo 色系）
    // 'useid': '#4DB6AC',            // 青色系（复用 useCallback 色系）
    // 'usesyncexternalstore': '#FFD54F', // 金黄（特殊标识）
    // 'useinsertioneffect': '#1976D2', // 蓝色系（复用 useEffect 色系）
    
    // === 其他 ===
    'region': '#66BB6A',           // 绿色 → 区域标识
    // 'component': '#5E35B1',        // 靛蓝 → 组件
    // 'handler': '#E53935',          // 红色 → 事件处理
    'default': '#757575'           // 灰色 → 默认函数
  },
  ocean: {
    // === 海洋主题：蓝绿色系 ===
    'usestate': '#0277BD',         // 深海蓝 → 状态
    'useeffect': '#00838F',        // 青蓝 → 副作用
    'usememo': '#4A148C',          // 深紫 → 缓存
    'usecallback': '#00695C',      // 深青 → 回调
    // 'useref': '#006064',           // 深蓝绿 → 引用 （未使用）
    // 'usecontext': '#01579B',       // 靛蓝 → 上下文
    // 'usereducer': '#0288D1',       // 海蓝 → 状态管理
    // 'uselayouteffect': '#00ACC1',  // 青色 → 布局副作用
    // 'useimperativehandle': '#00796B', // 绿松石 → 句柄
    // 'usedebugvalue': '#5E35B1',    // 深靛 → 调试
    // 'usedeferredvalue': '#1565C0', // 钴蓝 → 延迟值
    // 'usetransition': '#283593',    // 靛蓝 → 过渡
    // 'useid': '#26A69A',            // 青绿 → ID
    // 'usesyncexternalstore': '#0097A7', // 深青 → 外部同步
    // 'useinsertioneffect': '#00838F', // 青蓝 → 插入副作用
    'region': '#00796B',           // 深绿 → 区域
    // 'component': '#1A237E',        // 深靛蓝 → 组件
    // 'handler': '#004D40',          // 深绿 → 事件处理
    'default': '#37474F'           // 蓝灰 → 默认
  },
  sunset: {
    // === 日落主题：暖色系 ===
    'usestate': '#E65100',         // 深橙 → 状态
    'useeffect': '#D84315',        // 深橙红 → 副作用
    'usememo': '#BF360C',          // 深红橙 → 缓存
    'usecallback': '#E64A19',      // 橙红 → 回调
    // 'useref': '#C62828',           // 深红 → 引用 （未使用）
    // 'usecontext': '#F57C00',       // 琥珀 → 上下文
    // 'usereducer': '#D84315',       // 深橙红 → 状态管理
    // 'uselayouteffect': '#EF6C00',  // 橙色 → 布局副作用
    // 'useimperativehandle': '#E65100', // 深橙 → 句柄 （未使用）  
    // 'usedebugvalue': '#C62828',    // 深红 → 调试 （未使用）  
    // 'usedeferredvalue': '#BF360C', // 深红橙 → 延迟值 （未使用）
    // 'usetransition': '#D84315',    // 深橙红 → 过渡
    // 'useid': '#F57C00',            // 琥珀 → ID （未使用）  
    // 'usesyncexternalstore': '#FF6F00', // 琥珀 → 外部同步 （未使用）  
    // 'useinsertioneffect': '#E64A19', // 橙红 → 插入副作用 （未使用）  
    'region': '#689F38',           // 橄榄绿 → 区域
    // 'component': '#5D4037',        // 棕色 → 组件 （未使用）  
    // 'handler': '#B71C1C',          // 深红 → 事件处理 （未使用）  
    'default': '#6D4C41'           // 棕灰 → 默认
  },
  forest: {
    // === 森林主题：绿色系 ===
    'usestate': '#2E7D32',         // 深绿 → 状态
    'useeffect': '#1B5E20',        // 墨绿 → 副作用
    'usememo': '#33691E',          // 橄榄绿 → 缓存
    'usecallback': '#00695C',      // 深青绿 → 回调
    'useref': '#004D40',           // 深青 → 引用
    // 'usecontext': '#558B2F',       // 草绿 → 上下文
    // 'usereducer': '#388E3C',       // 绿色 → 状态管理
    // 'uselayouteffect': '#2E7D32',  // 深绿 → 布局副作用
    // 'useimperativehandle': '#00796B', // 绿松石 → 句柄
    // 'usedebugvalue': '#1B5E20',    // 墨绿 → 调试
    // 'usedeferredvalue': '#33691E', // 橄榄绿 → 延迟值
    // 'usetransition': '#43A047',    // 翠绿 → 过渡
    // 'useid': '#00897B',            // 青绿 → ID
    // 'usesyncexternalstore': '#689F38', // 橄榄绿 → 外部同步
    // 'useinsertioneffect': '#00695C', // 深青绿 → 插入副作用
    'region': '#1B5E20',           // 墨绿 → 区域
    // 'component': '#33691E',        // 橄榄绿 → 组件
    // 'handler': '#827717',          // 橄榄 → 事件处理
    'default': '#424242'           // 深灰 → 默认
  },
  neon: {
    // === 霓虹主题：高对比度荧光色 ===
    'usestate': '#D500F9',         // 荧光紫 → 状态
    'useeffect':  '#FFEA00',        // 荧光蓝 → 副作用
    'usememo': '#651FFF',          // 深荧光紫 → 缓存
    'usecallback': '#00E5FF',      // 荧光青 → 回调
    // 'useref': '#E040FB',           // 亮紫 → 引用
    // 'usecontext': '#FF6E40',       // 荧光橙 → 上下文
    // 'usereducer': '#D500F9',       // 荧光紫 → 状态管理
    // 'uselayouteffect': '#2979FF',  // 荧光蓝 → 布局副作用
    // 'useimperativehandle': '#1DE9B6', // 荧光绿 → 句柄
    // 'usedebugvalue': '#E040FB',    // 亮紫 → 调试
    // 'usedeferredvalue': '#651FFF', // 深荧光紫 → 延迟值
    // 'usetransition': '#7C4DFF',    // 荧光紫 → 过渡
    // 'useid': '#00E5FF',            // 荧光青 → ID
    // 'usesyncexternalstore': '#FFEA00', // 荧光黄 → 外部同步
    // 'useinsertioneffect': '#00B0FF', // 荧光蓝 → 插入副作用
    'region': '#00E676',           // 荧光绿 → 区域
    // 'component': '#AA00FF',        // 荧光紫 → 组件
    // 'handler': '#FF1744',          // 荧光红 → 事件处理
    'default': '#9E9E9E'           // 灰色 → 默认
  }
};

/** 颜色方案定义 - 暗色主题 */
export const COLOR_SCHEMES_DARK: Record<string, ColorSchemeMap> = {
  vibrant: {
    'region': '#81C784',           // 明亮绿 → 区域标识
    'useeffect': '#EF5350',        // 明亮红 → 副作用
    'usestate': '#FFD54F',         // 明亮黄 → 状态
    'usememo': '#42A5F5',          // 明亮蓝 → 缓存
    'usecallback': '#26C6DA',      // 明亮青 → 回调
    // 'useref': '#AB47BC',           // 明亮紫 → 引用
    // 'usereducer': '#EC407A',       // 明亮粉红 → 状态管理
    // 'uselayouteffect': '#81C784',  // 明亮浅绿 → 布局副作用
    // 'usecontext': '#FFB74D',       // 明亮橙 → 上下文
    // 'useimperativehandle': '#26C6DA', // 明亮蓝绿 → 句柄
    // 'usedebugvalue': '#F48FB1',    // 明亮洋红 → 调试
    // 'usedeferredvalue': '#7986CB', // 明亮靛蓝 → 延迟值
    // 'usetransition': '#CE93D8',    // 明亮紫罗兰 → 过渡
    // 'useid': '#80CBC4',            // 明亮蓝绿 → ID
    // 'usesyncexternalstore': '#FFD54F', // 明亮金黄 → 外部同步
    // 'useinsertioneffect': '#F48FB1', // 明亮玫红 → 插入副作用
    // 'component': '#BA68C8',        // 明亮紫 → 组件
    // 'handler': '#F48FB1',          // 明亮粉红 → 事件处理
    'default': '#FFB74D'           // 明亮橙 → 默认
  },
  soft: {
    'region': '#AED581',           // 淡雅绿 → 区域标识
    'useeffect': '#F48FB1',        // 淡雅玫瑰粉 → 副作用
    'usestate': '#FFF176',         // 淡雅鹅黄 → 状态
    'usememo': '#81D4FA',          // 淡雅天蓝 → 缓存
    'usecallback': '#D1C4E9',      // 淡雅青绿 → 回调
    // 'useref': '#CE93D8',           // 淡雅淡紫 → 引用
    // 'usereducer': '#F48FB1',       // 淡雅粉红 → 状态管理
    // 'uselayouteffect': '#C5E1A5',  // 淡雅草绿 → 布局副作用
    // 'usecontext': '#FFD54F',       // 淡雅黄橙 → 上下文
    // 'useimperativehandle': '#B2EBF2', // 淡雅浅青 → 句柄
    // 'usedebugvalue': '#F8BBD0',    // 淡雅浅粉 → 调试
    // 'usedeferredvalue': '#9FA8DA', // 淡雅藕紫蓝 → 延迟值
    // 'usetransition': '#D1C4E9',    // 淡雅柔紫 → 过渡
    // 'useid': '#B2DFDB',            // 淡雅薄荷绿 → ID
    // 'usesyncexternalstore': '#FFF59D', // 淡雅明黄 → 外部同步
    // 'useinsertioneffect': '#F48FB1', // 淡雅玫瑰粉 → 插入副作用
    // 'component': '#B39DDB',        // 淡雅淡紫蓝 → 组件
    // 'handler': '#FFB6B9',          // 淡雅粉橙 → 事件处理
    'default': '#FFE0B2'           // 淡雅米杏色 → 默认
  },
  ocean: {
    // === 海洋主题：亮蓝绿色系 ===
    'usestate': '#4FC3F7',         // 亮天蓝 → 状态
    'useeffect': '#26C6DA',        // 亮青 → 副作用
    'usememo': '#9575CD',          // 亮紫 → 缓存
    'usecallback': '#5C6BC0',      // 亮青绿 → 回调
    // 'useref': '#26A69A',           // 亮绿松石 → 引用
    // 'usecontext': '#42A5F5',       // 亮蓝 → 上下文
    // 'usereducer': '#29B6F6',       // 亮海蓝 → 状态管理
    // 'uselayouteffect': '#4DD0E1',  // 亮青色 → 布局副作用
    // 'useimperativehandle': '#80CBC4', // 亮绿松石 → 句柄
    // 'usedebugvalue': '#7986CB',    // 亮靛蓝 → 调试
    // 'usedeferredvalue': '#64B5F6', // 亮蓝 → 延迟值
    // 'usetransition': '#5C6BC0',    // 亮靛蓝 → 过渡
    // 'useid': '#4DD0E1',            // 亮青 → ID
    // 'usesyncexternalstore': '#26C6DA', // 亮青 → 外部同步
    // 'useinsertioneffect': '#26C6DA', // 亮青 → 插入副作用
    'region': '#4DB6AC',           // 亮绿松石 → 区域
    // 'component': '#7986CB',        // 亮靛蓝 → 组件
    // 'handler': '#26A69A',          // 亮绿松石 → 事件处理
    'default': '#90A4AE'           // 亮蓝灰 → 默认
  },
  sunset: {
    // === 日落主题：亮暖色系 ===
    'usestate': '#FF8A65',         // 亮橙 → 状态
    'useeffect': '#FFB6B9',        // 亮橙红 → 副作用
    'usememo': '#E57373',          // 亮红 → 缓存
    'usecallback': '#FF7043',      // 亮深橙 → 回调
    // 'useref': '#F06292',           // 亮粉红 → 引用
    // 'usecontext': '#FFB74D',       // 亮琥珀 → 上下文
    // 'usereducer': '#EF5350',       // 亮橙红 → 状态管理
    // 'uselayouteffect': '#FFA726',  // 亮橙色 → 布局副作用
    // 'useimperativehandle': '#FF8A65', // 亮橙 → 句柄
    // 'usedebugvalue': '#F06292',    // 亮粉红 → 调试
    // 'usedeferredvalue': '#E57373', // 亮红 → 延迟值
    // 'usetransition': '#EF5350',    // 亮橙红 → 过渡
    // 'useid': '#FFB74D',            // 亮琥珀 → ID
    // 'usesyncexternalstore': '#FFCA28', // 亮琥珀 → 外部同步
    // 'useinsertioneffect': '#FF7043', // 亮深橙 → 插入副作用
    'region': '#AED581',           // 亮橄榄绿 → 区域
    // 'component': '#A1887F',        // 亮棕色 → 组件
    // 'handler': '#E57373',          // 亮红 → 事件处理
    'default': '#BCAAA4'           // 亮棕灰 → 默认
  },
  forest: {
    // === 森林主题：亮绿色系 ===
    'usestate': '#81C784',         // 亮绿 → 状态
    'useeffect': '#C0CA33',        // 亮草绿 → 副作用
    'usememo': '#9CCC65',          // 亮橄榄绿 → 缓存
    'usecallback': '#4DB6AC',      // 亮青绿 → 回调
    // 'useref': '#26A69A',           // 亮青 → 引用
    // 'usecontext': '#AED581',       // 亮草绿 → 上下文
    // 'usereducer': '#66BB6A',       // 亮绿 → 状态管理
    // 'uselayouteffect': '#81C784',  // 亮绿 → 布局副作用
    // 'useimperativehandle': '#80CBC4', // 亮绿松石 → 句柄
    // 'usedebugvalue': '#66BB6A',    // 亮草绿 → 调试
    // 'usedeferredvalue': '#9CCC65', // 亮橄榄绿 → 延迟值
    // 'usetransition': '#66BB6A',    // 亮草绿 → 过渡
    // 'useid': '#4DB6AC',            // 亮青绿 → ID
    // 'usesyncexternalstore': '#AED581', // 亮草绿 → 外部同步
    // 'useinsertioneffect': '#4DB6AC', // 亮青绿 → 插入副作用
    'region': '#66BB6A',           // 亮草绿 → 区域
    // 'component': '#9CCC65',        // 亮橄榄绿 → 组件
    // 'handler': '#C0CA33',          // 亮橄榄 → 事件处理
    'default': '#E0E0E0'           // 亮灰 → 默认
  },
  neon: {
    // === 霓虹主题：超亮荧光色（暗色主题下更炫） ===
    'usestate': '#E040FB',         // 超亮紫 → 状态
    'useeffect': '#69F0AE',        // 超亮蓝 → 副作用
    'usememo': '#B388FF',          // 超亮紫 → 缓存
    'usecallback': '#18FFFF',      // 超亮青 → 回调
    // 'useref': '#EA80FC',           // 超亮粉紫 → 引用
    // 'usecontext': '#FF9E80',       // 超亮橙 → 上下文
    // 'usereducer': '#E040FB',       // 超亮紫 → 状态管理
    // 'uselayouteffect': '#448AFF',  // 超亮蓝 → 布局副作用
    // 'useimperativehandle': '#64FFDA', // 超亮绿 → 句柄
    // 'usedebugvalue': '#EA80FC',    // 超亮粉紫 → 调试
    // 'usedeferredvalue': '#B388FF', // 超亮紫 → 延迟值
    // 'usetransition': '#B388FF',    // 超亮紫 → 过渡
    // 'useid': '#18FFFF',            // 超亮青 → ID
    // 'usesyncexternalstore': '#FFFF00', // 超亮黄 → 外部同步
    // 'useinsertioneffect': '#40C4FF', // 超亮蓝 → 插入副作用
    'region': '#69F0AE',           // 超亮绿 → 区域
    // 'component': '#E040FB',        // 超亮紫 → 组件
    // 'handler': '#FF5252',          // 超亮红 → 事件处理
    'default': '#BDBDBD'           // 亮灰 → 默认
  }
};

