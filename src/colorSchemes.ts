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
    'usestate': '#FF8A65',         // 🔴 亮橙红 → 状态（最常用！）
    'useeffect': '#E8E0F0',        // 🔵 浅紫色 → 副作用（第二常用！）
    'usememo': '#FFEB3B',          // 🟡 黄色 → 缓存优化
    'usecallback': '#A5F3A5',      // 🟢 浅绿色 → 回调优化
    'useref': '#FFB74D',           // 🟠 橙色 → 引用管理
    'usecontext': '#BA68C8',       // 🟣 紫色 → 上下文消费
    'usereducer': '#4DB6AC',       // 🔵 青色 → 状态管理
    'uselayouteffect': '#64B5F6',   // 🔵 蓝色 → 布局副作用
    'useimperativehandle': '#F06292', // 🔴 粉色 → 命令式句柄
    'usedebugvalue': '#90A4AE',     // ⚫ 灰色 → 调试值
    'usedeferredvalue': '#FF7043',  // 🔴 橙红 → 延迟值
    'usetransition': '#AB47BC',     // 🟣 紫色 → 过渡状态
    'useid': '#26A69A',            // 🟢 青绿 → 唯一标识
    'usesyncexternalstore': '#FFD54F', // 🟡 金黄 → 外部同步
    'useinsertioneffect': '#42A5F5', // 🔵 蓝色 → 插入副作用
    // 'useref': '#EC407A',           // 🔴 亮粉红 → 引用
    // 'usecontext': '#FFB74D',       // 🟠 亮橙 → 上下文
    
    // === 低频 Hooks（复用相近色系）===
    // 'usereducer': '#FF7043',       // 亮橙红系（复用 useState 色系）
    // 'uselayouteffect': '#1E88E5',  // 亮蓝系（复用 useEffect 色系）
    // 'useimperativehandle': '#4DB6AC', // 亮青绿系（复用 useCallback 色系）
    // 'usedebugvalue': '#F06292',    // 亮粉红系（复用 useRef 色系）
    // 'usedeferredvalue': '#8E24AA', // 亮紫系（复用 useMemo 色系）
    // 'usetransition': '#9C27B0',    // 亮紫系（复用 useMemo 色系）
    // 'useid': '#4DB6AC',            // 亮青系（复用 useCallback 色系）
    // 'usesyncexternalstore': '#FFD54F', // 亮金黄（特殊标识）
    // 'useinsertioneffect': '#1976D2', // 亮蓝系（复用 useEffect 色系）
    
    // === 其他 ===
    'region': '#66BB6A',           // 亮绿 → 区域标识
    // 'component': '#5E35B1',        // 亮靛蓝 → 组件
    // 'handler': '#E57373',          // 亮红 → 事件处理
    'default': '#757575'           // 亮灰 → 默认函数
  },
  soft: {
    // === 高频 Hooks（6大主色，差异明显）===
    'usestate': '#FF8A65',         // 🟠 橙色 → 状态
    'useeffect': '#E8E0F0',        // 🔵 浅紫色 → 副作用
    'usememo': '#FFEB3B',          // 🟡 黄色 → 缓存优化
    'usecallback': '#A5F3A5',      // 🟢 浅绿色 → 回调优化
    'useref': '#FFB74D',           // 🟠 橙色 → 引用管理
    'usecontext': '#BA68C8',       // 🟣 紫色 → 上下文消费
    'usereducer': '#4DB6AC',       // 🔵 青色 → 状态管理
    'uselayouteffect': '#64B5F6',   // 🔵 蓝色 → 布局副作用
    'useimperativehandle': '#F06292', // 🔴 粉色 → 命令式句柄
    'usedebugvalue': '#90A4AE',     // ⚫ 灰色 → 调试值
    'usedeferredvalue': '#FF7043',  // 🔴 橙红 → 延迟值
    'usetransition': '#AB47BC',     // 🟣 紫色 → 过渡状态
    'useid': '#26A69A',            // 🟢 青绿 → 唯一标识
    'usesyncexternalstore': '#FFD54F', // 🟡 金黄 → 外部同步
    'useinsertioneffect': '#42A5F5', // 🔵 蓝色 → 插入副作用
    // 'useref': '#F06292',           // 🔴 亮粉红 → 引用
    // 'usecontext': '#FFCC02',       // 🟠 亮浅橙 → 上下文
    
    // === 低频 Hooks（复用相近色系）===
    // 'usereducer': '#FFA726',       // 亮橙色系（复用 useState 色系）
    // 'uselayouteffect': '#42A5F5',  // 亮蓝色系（复用 useEffect 色系）
    // 'useimperativehandle': '#26A69A', // 亮青绿系（复用 useCallback 色系）
    // 'usedebugvalue': '#E91E63',    // 亮粉红系（复用 useRef 色系）
    // 'usedeferredvalue': '#9C27B0', // 亮紫色系（复用 useMemo 色系）
    // 'usetransition': '#AB47BC',    // 亮紫色系（复用 useMemo 色系）
    // 'useid': '#80CBC4',            // 亮青色系（复用 useCallback 色系）
    // 'usesyncexternalstore': '#FFEB3B', // 亮金黄（特殊标识）
    // 'useinsertioneffect': '#2196F3', // 亮蓝色系（复用 useEffect 色系）
    
    // === 其他 ===
    'region': '#81C784',           // 亮绿色 → 区域标识
    // 'component': '#7986CB',        // 亮靛蓝 → 组件
    // 'handler': '#EF5350',          // 亮红色 → 事件处理
    'default': '#90A4AE'           // 亮灰色 → 默认函数
  },
  ocean: {
    // === 海洋主题：亮蓝绿色系 ===
    'usestate': '#FF8A65',         // 橙色 → 状态
    'useeffect': '#E8E0F0',        // 浅紫色 → 副作用
    'usememo': '#FFEB3B',          // 黄色 → 缓存
    'usecallback': '#A5F3A5',      // 浅绿色 → 回调
    'useref': '#FFB74D',           // 🟠 橙色 → 引用管理
    'usecontext': '#BA68C8',       // 🟣 紫色 → 上下文消费
    'usereducer': '#4DB6AC',       // 🔵 青色 → 状态管理
    'uselayouteffect': '#64B5F6',   // 🔵 蓝色 → 布局副作用
    'useimperativehandle': '#F06292', // 🔴 粉色 → 命令式句柄
    'usedebugvalue': '#90A4AE',     // ⚫ 灰色 → 调试值
    'usedeferredvalue': '#FF7043',  // 🔴 橙红 → 延迟值
    'usetransition': '#AB47BC',     // 🟣 紫色 → 过渡状态
    'useid': '#26A69A',            // 🟢 青绿 → 唯一标识
    'usesyncexternalstore': '#FFD54F', // 🟡 金黄 → 外部同步
    'useinsertioneffect': '#42A5F5', // 🔵 蓝色 → 插入副作用
    // 'useref': '#26A69A',           // 亮蓝绿 → 引用 （未使用）
    // 'usecontext': '#42A5F5',       // 亮靛蓝 → 上下文
    // 'usereducer': '#4FC3F7',       // 亮海蓝 → 状态管理
    // 'uselayouteffect': '#4DD0E1',  // 亮青色 → 布局副作用
    // 'useimperativehandle': '#80CBC4', // 亮绿松石 → 句柄
    // 'usedebugvalue': '#7986CB',    // 亮靛 → 调试
    // 'usedeferredvalue': '#64B5F6', // 亮钴蓝 → 延迟值
    // 'usetransition': '#5C6BC0',    // 亮靛蓝 → 过渡
    // 'useid': '#80CBC4',            // 亮青绿 → ID
    // 'usesyncexternalstore': '#4DD0E1', // 亮深青 → 外部同步
    // 'useinsertioneffect': '#26C6DA', // 亮青蓝 → 插入副作用
    'region': '#4DB6AC',           // 亮绿 → 区域
    // 'component': '#7986CB',        // 亮靛蓝 → 组件
    // 'handler': '#26A69A',          // 亮绿 → 事件处理
    'default': '#90A4AE'           // 亮蓝灰 → 默认
  },
  sunset: {
    // === 日落主题：亮暖色系 ===
    'usestate': '#FF8A65',         // 橙色 → 状态
    'useeffect': '#E8E0F0',        // 浅紫色 → 副作用
    'usememo': '#FFEB3B',          // 黄色 → 缓存
    'usecallback': '#A5F3A5',      // 浅绿色 → 回调
    // 'useref': '#EF5350',           // 亮红 → 引用 （未使用）
    // 'usecontext': '#FFB74D',       // 亮琥珀 → 上下文
    // 'usereducer': '#FF7043',       // 亮橙红 → 状态管理
    // 'uselayouteffect': '#FFA726',  // 亮橙色 → 布局副作用
    // 'useimperativehandle': '#FF8A65', // 亮橙 → 句柄 （未使用）  
    // 'usedebugvalue': '#EF5350',    // 亮红 → 调试 （未使用）  
    // 'usedeferredvalue': '#E57373', // 亮红橙 → 延迟值 （未使用）
    // 'usetransition': '#FF7043',    // 亮橙红 → 过渡
    // 'useid': '#FFB74D',            // 亮琥珀 → ID （未使用）  
    // 'usesyncexternalstore': '#FFCA28', // 亮琥珀 → 外部同步 （未使用）  
    // 'useinsertioneffect': '#FF7043', // 亮橙红 → 插入副作用 （未使用）  
    'region': '#AED581',           // 亮橄榄绿 → 区域
    // 'component': '#A1887F',        // 亮棕色 → 组件 （未使用）  
    // 'handler': '#E57373',          // 亮红 → 事件处理 （未使用）  
    'default': '#BCAAA4'           // 亮棕灰 → 默认
  },
  forest: {
    // === 森林主题：亮绿色系 ===
    'usestate': '#FF8A65',         // 橙色 → 状态
    'useeffect': '#E8E0F0',        // 浅紫色 → 副作用
    'usememo': '#FFEB3B',          // 黄色 → 缓存
    'usecallback': '#A5F3A5',      // 浅绿色 → 回调
    'useref': '#26A69A',           // 亮青 → 引用
    'usecontext': '#AED581',       // 亮草绿 → 上下文
    'usereducer': '#66BB6A',       // 亮绿色 → 状态管理
    'uselayouteffect': '#81C784',  // 亮绿 → 布局副作用
    'useimperativehandle': '#80CBC4', // 亮绿松石 → 句柄
    'usedebugvalue': '#66BB6A',    // 亮墨绿 → 调试
    'usedeferredvalue': '#9CCC65', // 亮橄榄绿 → 延迟值
    'usetransition': '#8BC34A',    // 亮翠绿 → 过渡
    'useid': '#4DB6AC',            // 亮青绿 → ID
    'usesyncexternalstore': '#AED581', // 亮橄榄绿 → 外部同步
    'useinsertioneffect': '#4DB6AC', // 亮青绿 → 插入副作用
    'region': '#66BB6A',           // 亮墨绿 → 区域
    // 'component': '#9CCC65',        // 亮橄榄绿 → 组件
    // 'handler': '#C0CA33',          // 亮橄榄 → 事件处理
    'default': '#90A4AE'           // 亮灰 → 默认
  },
  neon: {
    // === 霓虹主题：超亮荧光色 ===
    'usestate': '#FF8A65',         // 橙色 → 状态
    'useeffect': '#E8E0F0',        // 浅紫色 → 副作用
    'usememo': '#FFEB3B',          // 黄色 → 缓存
    'usecallback': '#A5F3A5',      // 浅绿色 → 回调
    'useref': '#EA80FC',           // 超亮紫 → 引用
    'usecontext': '#FF9E80',       // 超亮荧光橙 → 上下文
    'usereducer': '#E040FB',       // 超亮荧光紫 → 状态管理
    'uselayouteffect': '#448AFF',  // 超亮荧光蓝 → 布局副作用
    'useimperativehandle': '#64FFDA', // 超亮荧光绿 → 句柄
    'usedebugvalue': '#EA80FC',    // 超亮紫 → 调试
    'usedeferredvalue': '#B388FF', // 超亮荧光紫 → 延迟值
    'usetransition': '#B388FF',    // 超亮荧光紫 → 过渡
    'useid': '#18FFFF',            // 超亮荧光青 → ID
    'usesyncexternalstore': '#FFFF00', // 超亮荧光黄 → 外部同步
    'useinsertioneffect': '#40C4FF', // 超亮荧光蓝 → 插入副作用
    'region': '#69F0AE',           // 超亮荧光绿 → 区域
    // 'component': '#E040FB',        // 超亮荧光紫 → 组件
    // 'handler': '#FF5252',          // 超亮荧光红 → 事件处理
    'default': '#BDBDBD'           // 亮灰色 → 默认
  }
};

/** 颜色方案定义 - 暗色主题 */
export const COLOR_SCHEMES_DARK: Record<string, ColorSchemeMap> = {
  vibrant: {
    'region': '#A5D6A7',           // 超亮绿 → 区域标识
    'usestate': '#FF8A65',         // 橙色 → 状态
    'useeffect': '#E8E0F0',        // 浅紫色 → 副作用
    'usememo': '#FFEB3B',          // 黄色 → 缓存
    'usecallback': '#A5F3A5',      // 浅绿色 → 回调
    'useref': '#BA68C8',           // 超亮紫 → 引用
    'usereducer': '#F06292',       // 超亮粉红 → 状态管理
    'uselayouteffect': '#A5D6A7',  // 超亮浅绿 → 布局副作用
    'usecontext': '#FFCC02',       // 超亮橙 → 上下文
    'useimperativehandle': '#4DD0E1', // 超亮蓝绿 → 句柄
    'usedebugvalue': '#F8BBD9',    // 超亮洋红 → 调试
    'usedeferredvalue': '#9FA8DA', // 超亮靛蓝 → 延迟值
    'usetransition': '#D1C4E9',    // 超亮紫罗兰 → 过渡
    'useid': '#B2DFDB',            // 超亮蓝绿 → ID
    'usesyncexternalstore': '#FFF176', // 超亮金黄 → 外部同步
    'useinsertioneffect': '#F8BBD9', // 超亮玫红 → 插入副作用
    // 'component': '#CE93D8',        // 超亮紫 → 组件
    // 'handler': '#F8BBD9',          // 超亮粉红 → 事件处理
    'default': '#FFCC02'           // 超亮橙 → 默认
  },
  soft: {
    'region': '#C8E6C9',           // 超淡雅绿 → 区域标识
    'usestate': '#FF8A65',         // 橙色 → 状态
    'useeffect': '#E8E0F0',        // 浅紫色 → 副作用
    'usememo': '#FFEB3B',          // 黄色 → 缓存
    'usecallback': '#A5F3A5',      // 浅绿色 → 回调
    'useref': '#D1C4E9',           // 超淡雅淡紫 → 引用
    'usereducer': '#F8BBD9',       // 超淡雅粉红 → 状态管理
    'uselayouteffect': '#DCEDC8',  // 超淡雅草绿 → 布局副作用
    'usecontext': '#FFECB3',       // 超淡雅黄橙 → 上下文
    'useimperativehandle': '#E0F2F1', // 超淡雅浅青 → 句柄
    'usedebugvalue': '#FCE4EC',    // 超淡雅浅粉 → 调试
    'usedeferredvalue': '#C5CAE9', // 超淡雅藕紫蓝 → 延迟值
    'usetransition': '#E1BEE7',    // 超淡雅柔紫 → 过渡
    'useid': '#E0F2F1',            // 超淡雅薄荷绿 → ID
    'usesyncexternalstore': '#FFFDE7', // 超淡雅明黄 → 外部同步
    'useinsertioneffect': '#F8BBD9', // 超淡雅玫瑰粉 → 插入副作用
    // 'component': '#D1C4E9',        // 超淡雅淡紫蓝 → 组件
    // 'handler': '#FFCDD2',          // 超淡雅粉橙 → 事件处理
    'default': '#FFF3E0'           // 超淡雅米杏色 → 默认
  },
  ocean: {
    // === 海洋主题：超亮蓝绿色系 ===
    'usestate': '#FF8A65',         // 橙色 → 状态
    'useeffect': '#E8E0F0',        // 浅紫色 → 副作用
    'usememo': '#FFEB3B',          // 黄色 → 缓存
    'usecallback': '#A5F3A5',      // 浅绿色 → 回调
    'useref': '#80CBC4',           // 超亮绿松石 → 引用
    'usecontext': '#64B5F6',       // 超亮蓝 → 上下文
    'usereducer': '#4FC3F7',       // 超亮海蓝 → 状态管理
    'uselayouteffect': '#80DEEA',  // 超亮青色 → 布局副作用
    'useimperativehandle': '#B2DFDB', // 超亮绿松石 → 句柄
    'usedebugvalue': '#9FA8DA',    // 超亮靛蓝 → 调试
    'usedeferredvalue': '#90CAF9', // 超亮蓝 → 延迟值
    'usetransition': '#9FA8DA',    // 超亮靛蓝 → 过渡
    'useid': '#80DEEA',            // 超亮青 → ID
    'usesyncexternalstore': '#4DD0E1', // 超亮青 → 外部同步
    'useinsertioneffect': '#4DD0E1', // 超亮青 → 插入副作用
    'region': '#80CBC4',           // 超亮绿松石 → 区域
    // 'component': '#9FA8DA',        // 超亮靛蓝 → 组件
    // 'handler': '#80CBC4',          // 超亮绿松石 → 事件处理
    'default': '#B0BEC5'           // 超亮蓝灰 → 默认
  },
  sunset: {
    // === 日落主题：超亮暖色系 ===
    'usestate': '#FF8A65',         // 橙色 → 状态
    'useeffect': '#E8E0F0',        // 浅紫色 → 副作用
    'usememo': '#FFEB3B',          // 黄色 → 缓存
    'usecallback': '#A5F3A5',      // 浅绿色 → 回调
    'useref': '#F8BBD9',           // 超亮粉红 → 引用
    'usecontext': '#FFCC02',       // 超亮琥珀 → 上下文
    'usereducer': '#FF8A80',       // 超亮橙红 → 状态管理
    'uselayouteffect': '#FFCC02',  // 超亮橙色 → 布局副作用
    'useimperativehandle': '#FFAB91', // 超亮橙 → 句柄
    'usedebugvalue': '#F8BBD9',    // 超亮粉红 → 调试
    'usedeferredvalue': '#FFAB91', // 超亮红 → 延迟值
    'usetransition': '#FF8A80',    // 超亮橙红 → 过渡
    'useid': '#FFCC02',            // 超亮琥珀 → ID
    'usesyncexternalstore': '#FFECB3', // 超亮琥珀 → 外部同步
    'useinsertioneffect': '#FFAB91', // 超亮深橙 → 插入副作用
    'region': '#C8E6C9',           // 超亮橄榄绿 → 区域
    // 'component': '#D7CCC8',        // 超亮棕色 → 组件
    // 'handler': '#FFAB91',          // 超亮红 → 事件处理
    'default': '#D7CCC8'           // 超亮棕灰 → 默认
  },
  forest: {
    // === 森林主题：超亮绿色系 ===
    'usestate': '#FF8A65',         // 橙色 → 状态
    'useeffect': '#E8E0F0',        // 浅紫色 → 副作用
    'usememo': '#FFEB3B',          // 黄色 → 缓存
    'usecallback': '#A5F3A5',      // 浅绿色 → 回调
    'useref': '#80CBC4',           // 超亮青 → 引用
    'usecontext': '#C8E6C9',       // 超亮草绿 → 上下文
    'usereducer': '#A5D6A7',       // 超亮绿 → 状态管理
    'uselayouteffect': '#A5D6A7',  // 超亮绿 → 布局副作用
    'useimperativehandle': '#B2DFDB', // 超亮绿松石 → 句柄
    'usedebugvalue': '#A5D6A7',    // 超亮草绿 → 调试
    'usedeferredvalue': '#C5E1A5', // 超亮橄榄绿 → 延迟值
    'usetransition': '#A5D6A7',    // 超亮草绿 → 过渡
    'useid': '#80CBC4',            // 超亮青绿 → ID
    'usesyncexternalstore': '#C8E6C9', // 超亮草绿 → 外部同步
    'useinsertioneffect': '#80CBC4', // 超亮青绿 → 插入副作用
    'region': '#A5D6A7',           // 超亮草绿 → 区域
    // 'component': '#C5E1A5',        // 超亮橄榄绿 → 组件
    // 'handler': '#DCE775',          // 超亮橄榄 → 事件处理
    'default': '#F5F5F5'           // 超亮灰 → 默认
  },
  neon: {
    // === 霓虹主题：极亮荧光色（暗色主题下更炫） ===
    'usestate': '#FF8A65',         // 橙色 → 状态
    'useeffect': '#E8E0F0',        // 浅紫色 → 副作用
    'usememo': '#FFEB3B',          // 黄色 → 缓存
    'usecallback': '#A5F3A5',      // 浅绿色 → 回调
    'useref': '#F48FB1',           // 极亮粉紫 → 引用
    'usecontext': '#FFB74D',       // 极亮橙 → 上下文
    'usereducer': '#EA80FC',       // 极亮紫 → 状态管理
    'uselayouteffect': '#82B1FF',  // 极亮蓝 → 布局副作用
    'useimperativehandle': '#A7FFEB', // 极亮绿 → 句柄
    'usedebugvalue': '#F48FB1',    // 极亮粉紫 → 调试
    'usedeferredvalue': '#C5A3FF', // 极亮紫 → 延迟值
    'usetransition': '#C5A3FF',    // 极亮紫 → 过渡
    'useid': '#84FFFF',            // 极亮青 → ID
    'usesyncexternalstore': '#FFFF8D', // 极亮黄 → 外部同步
    'useinsertioneffect': '#80D8FF', // 极亮蓝 → 插入副作用
    'region': '#A5F3A5',           // 极亮绿 → 区域
    // 'component': '#EA80FC',        // 极亮紫 → 组件
    // 'handler': '#FF8A80',          // 极亮红 → 事件处理
    'default': '#E0E0E0'           // 极亮灰 → 默认
  }
};

