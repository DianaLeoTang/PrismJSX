# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [3.4.0](https://github.com/DianaLeoTang/PrismJSX/compare/v3.3.0...v3.4.0) (2025-10-14)


### ✨ 新功能

* 创建环境变量，防止token暴露 ([d1f80f2](https://github.com/DianaLeoTang/PrismJSX/commit/d1f80f25706a9e2c9d05c36717f4922dd327ce48))
* 更新插件文档 ([eceb757](https://github.com/DianaLeoTang/PrismJSX/commit/eceb757dc0336761dae266a6be4859a04eb61449))
* 更新readme文件，增加私有云上AI的接入 ([539eae3](https://github.com/DianaLeoTang/PrismJSX/commit/539eae322a10f9634336d0e221fb8c16058fe8be))
* 集成优先级翻译到装饰器渲染流程 ([27b2cad](https://github.com/DianaLeoTang/PrismJSX/commit/27b2cad07b120523337b96d9e6c9b0d6890f9de1))
* 兼容两种写法，开发环境使用.env 环境变量，生产环境用构建脚本注入真实 token。 ([aa67516](https://github.com/DianaLeoTang/PrismJSX/commit/aa675161f2e49488b81be6d74704fe49f6c0db40))
* 进一步增强对函数名的识别 ([7d0ade0](https://github.com/DianaLeoTang/PrismJSX/commit/7d0ade09b1a8db3b0cb4bfa2de8c29bb137da3ef))
* 扩展激活时初始化翻译系统 ([8d1fd48](https://github.com/DianaLeoTang/PrismJSX/commit/8d1fd48df716bd1a1fec0d49cf72c6a51711bd36))
* 删除手动映射文件词汇，删除Deepseek API 的引入，引入私有云上的AI模型 ([103bb54](https://github.com/DianaLeoTang/PrismJSX/commit/103bb542226f8bd024e67843eb254dce601b111c))
* 文档函数名翻译完成后，强制刷新当前文件缓存 ([24bd842](https://github.com/DianaLeoTang/PrismJSX/commit/24bd842503e42105e563a075ec884f2d286e62f1))
* 细粒度调整函数和hooks混合在一起时，对函数的识别 ([80d7b0e](https://github.com/DianaLeoTang/PrismJSX/commit/80d7b0e092c80e50ab60317cc642648042a73a85))
* 修改打包命令 ([a6effa5](https://github.com/DianaLeoTang/PrismJSX/commit/a6effa5c4d2774196d7b62240bfcc284fff861eb))
* 修改翻译策略，解决性能问题，429限制问题 ([a1ac91c](https://github.com/DianaLeoTang/PrismJSX/commit/a1ac91c8ab9206289182ff28678c2a72865c9dbd))
* 增强函数名识别，支持export const func = (param = value): Complex.Type => {}等所有箭头函数变体 ([c8e947b](https://github.com/DianaLeoTang/PrismJSX/commit/c8e947b02744a891464243316bea17b9e3d7e2cf))

## [3.3.0](https://github.com/DianaLeoTang/PrismJSX/compare/v3.1.1...v3.3.0) (2025-10-13)


### ✨ 新功能

* 调整自动化版本管理工具 ([eb75a91](https://github.com/DianaLeoTang/PrismJSX/commit/eb75a91a88119e93268db907e9e7e93207dbfd28))
* 更新日志 ([ab222e5](https://github.com/DianaLeoTang/PrismJSX/commit/ab222e50737246478138893bb9fd823816fb96b3))
* 同步vscode配置 ([e63f680](https://github.com/DianaLeoTang/PrismJSX/commit/e63f680adf8f0f6cb0ee7dd6fd0488abd8639950))
* 增加对主题色适配的彩虹条颜色 ([a012821](https://github.com/DianaLeoTang/PrismJSX/commit/a0128210334603605e4402da698eaf66d9e12a97))
* 增加更多的主题色配置，允许用户选择 ([59fa8c6](https://github.com/DianaLeoTang/PrismJSX/commit/59fa8c60699706d7604bef7d8440824b29f609cd))


### 🔧 其他更改

* **release:** 3.2.0 ([682d937](https://github.com/DianaLeoTang/PrismJSX/commit/682d9379a473ac9178fcff93a8a4fa774e2ac884))
* **release:** 3.2.0 ([3f74fa4](https://github.com/DianaLeoTang/PrismJSX/commit/3f74fa41e0afe65d7b936cec54c4988ae93304c3))

## [3.2.0](https://github.com/DianaLeoTang/PrismJSX/compare/v3.1.1...v3.2.0) (2025-10-13)


### ✨ 新功能

* 调整自动化版本管理工具 ([eb75a91](https://github.com/DianaLeoTang/PrismJSX/commit/eb75a91a88119e93268db907e9e7e93207dbfd28))
* 更新日志 ([ab222e5](https://github.com/DianaLeoTang/PrismJSX/commit/ab222e50737246478138893bb9fd823816fb96b3))
* 同步vscode配置 ([e63f680](https://github.com/DianaLeoTang/PrismJSX/commit/e63f680adf8f0f6cb0ee7dd6fd0488abd8639950))
* 增加对主题色适配的彩虹条颜色 ([a012821](https://github.com/DianaLeoTang/PrismJSX/commit/a0128210334603605e4402da698eaf66d9e12a97))
* 增加更多的主题色配置，允许用户选择 ([59fa8c6](https://github.com/DianaLeoTang/PrismJSX/commit/59fa8c60699706d7604bef7d8440824b29f609cd))


### 🔧 其他更改

* **release:** 3.2.0 ([3f74fa4](https://github.com/DianaLeoTang/PrismJSX/commit/3f74fa41e0afe65d7b936cec54c4988ae93304c3))

## [3.2.0](https://github.com/DianaLeoTang/PrismJSX/compare/v3.1.1...v3.2.0) (2025-10-13)


### ✨ 新功能

* 调整自动化版本管理工具 ([eb75a91](https://github.com/DianaLeoTang/PrismJSX/commit/eb75a91a88119e93268db907e9e7e93207dbfd28))
* 更新日志 ([ab222e5](https://github.com/DianaLeoTang/PrismJSX/commit/ab222e50737246478138893bb9fd823816fb96b3))
* 同步vscode配置 ([e63f680](https://github.com/DianaLeoTang/PrismJSX/commit/e63f680adf8f0f6cb0ee7dd6fd0488abd8639950))
* 增加对主题色适配的彩虹条颜色 ([a012821](https://github.com/DianaLeoTang/PrismJSX/commit/a0128210334603605e4402da698eaf66d9e12a97))
* 增加更多的主题色配置，允许用户选择 ([59fa8c6](https://github.com/DianaLeoTang/PrismJSX/commit/59fa8c60699706d7604bef7d8440824b29f609cd))

### [3.1.1](https://github.com/DianaLeoTang/PrismJSX/compare/v3.2.1...v3.1.1) (2025-10-13)

### ♻️ 代码重构

* 删除注释代码 ([d8612b7](https://github.com/DianaLeoTang/PrismJSX/commit/d8612b79f1da37d9134cb33017760a9c490282b5))


### 🐛 Bug 修复

* 解决彩虹色标注没有包括函数尾部花括号的问题 ([c053ad2](https://github.com/DianaLeoTang/PrismJSX/commit/c053ad215b528e62d5be7ab6bff8bc728a659e18))
* 解决控制台警告WARNING  A 'repository' field is missing from the 'package.json' manifest file. ([13b5902](https://github.com/DianaLeoTang/PrismJSX/commit/13b590239f37750829b8a4b8bcdea8d6d97e27ac))
* 修复性能问题 ([ae339ca](https://github.com/DianaLeoTang/PrismJSX/commit/ae339ca8ed19eca9c56f07f6e3c8d8a93a22d1d2))


### ✨ 新功能

*  细粒度修改对react语法的适配，不同的hooks使用不同的颜色，同一用一种颜色 ([e366d4d](https://github.com/DianaLeoTang/PrismJSX/commit/e366d4d65fc7cdbe4ca45d732876e950b9f67cb0))
* 查一下插件机制如何同步到cursor ([edec7cc](https://github.com/DianaLeoTang/PrismJSX/commit/edec7ccd9adcdeec046d925271f5d2cc0d23e747))
* 调整对代码段的处理，解决性能问题 ([b7c5472](https://github.com/DianaLeoTang/PrismJSX/commit/b7c5472f33b7a8b14679a446da0465d47bd311ed))
* 调整对hooks的支持 ([e146623](https://github.com/DianaLeoTang/PrismJSX/commit/e146623311e4d7229707071b873c478761ce7fd1))
* 调整对react hooks的识别 ([ae6db01](https://github.com/DianaLeoTang/PrismJSX/commit/ae6db0151130e312f58087db7771a0852457dc2c))
* 调整用户说明文件Readme ([215a38e](https://github.com/DianaLeoTang/PrismJSX/commit/215a38eff4c941b42960a55b87c950eb9b0eba0c))
* 给函数方法增加注释 ([32637bf](https://github.com/DianaLeoTang/PrismJSX/commit/32637bf51e3d43b012e534ce4c5e365109dc22ac))
* 更加细致地对hooks的检测和识别，解决链式调用对识别useEffect的干扰 ([a4c06dc](https://github.com/DianaLeoTang/PrismJSX/commit/a4c06dc484efaa2991019322138205400fec5ce8))
* 更新版本号，发布新版 ([49f4cc0](https://github.com/DianaLeoTang/PrismJSX/commit/49f4cc0ba8e4456680b42b165ac95468d70fd6ad))
* 更新readme文件，同步项目功能到readme中 ([2810dd6](https://github.com/DianaLeoTang/PrismJSX/commit/2810dd6d7bba32ebc91879f9776da04adb190d91))
* 忽略数组的方法内部的函数，避免着色 ([28fdc27](https://github.com/DianaLeoTang/PrismJSX/commit/28fdc27d33068047f330a539f238ff6acaf64ecc))
* 进一步调整对函数的识别 ([2dadfeb](https://github.com/DianaLeoTang/PrismJSX/commit/2dadfeb48c6d3010dec7d2c3e403588000a20536))
* 修改函数注释到函数上一行 ([5b33032](https://github.com/DianaLeoTang/PrismJSX/commit/5b330321223701888fada9c9ac6ef5d1c7717c2d))
* 增加函数识别翻译成中文，但是没生效，需要进一步排查 ([86d728e](https://github.com/DianaLeoTang/PrismJSX/commit/86d728e19cea1f7d6c72b343c96e7bb9a4d94f4f))
* 增加VScode插件开发说明文档 ([1311852](https://github.com/DianaLeoTang/PrismJSX/commit/1311852ebf6d6ac155ca6b2975abbc5f628a2005))
* todo新增功能 ([76c25bc](https://github.com/DianaLeoTang/PrismJSX/commit/76c25bcd2a993782ad6ee4521bbe8cb1043ebf77))
* v2.0.0 changelog ([3b52398](https://github.com/DianaLeoTang/PrismJSX/commit/3b52398af3025df248c5e11ccde7061583b0fca6))

## 3.0.1 (2025-01-27)
- 修复装饰器性能问题，优化大文件渲染速度
- 减少不必要的重绘，提升响应速度
- 优化内存使用，降低资源占用

## 3.0.0 (2025-01-27)
- 优化调试体验，添加完整的 VSCode 调试配置
- 改进项目结构和开发工作流
- 增强代码可维护性和稳定性

## 2.0.0 (2025-09-28)
- 仅左侧彩虹条，不再给文字底色
- `#region ... #endregion` 段优先，内部函数不着色但保留语义化注释
- 修正跨行端点与嵌套重叠问题
- DOM/JSX 标签内注释不断条
- 函数内部注释不断条，仅裁边不分段
- 注释掉的独立方法：不着色，显示“已注释的方法”提示
- 默认调色板改为“赤橙黄绿青蓝紫”


### Features

* **config:** expose region block color/border settings ([04323e0](https://github.com/DianaLeoTang/PrismJSX/commit/04323e05c7b4b30b8204377656bd42941abc33cb))
* **core:** 新增 exclusion 总线用于广播最外层 #region 抑制范围 ([fc4db64](https://github.com/DianaLeoTang/PrismJSX/commit/fc4db646cb8b965af963a5529b43e639c619baba))
* **region:** 最外层闭合 #region 高亮；未闭合回退到大括号范围 ([a956224](https://github.com/DianaLeoTang/PrismJSX/commit/a956224ed8c0ed223a5a0f40796f1c3552a708ea))
* 不同的函数代码块增加不同的颜色处理 ([ac72668](https://github.com/DianaLeoTang/PrismJSX/commit/ac726689d9e71721aa0096b0c0547952163c7185))
* 为代码中的函数添加视觉装饰（如背景色），但会排除掉被#region等结构抑制的区域 ([0e21019](https://github.com/DianaLeoTang/PrismJSX/commit/0e210195f6f20c875dedafd3280898146e874867))
* 优化颜色处理，不同层级用不同的颜色 ([d469deb](https://github.com/DianaLeoTang/PrismJSX/commit/d469debb9aa7243d8621c0ec40eef5a1218c0d0a))
* 修改为彩虹色，新增识别 method（类方法）、变量里的箭头函数/函数表达式 ([511101b](https://github.com/DianaLeoTang/PrismJSX/commit/511101bb038f72d48f526f3baeeff958a8413ce4))
* 修改为缩进空白区域增加颜色 ([87759ec](https://github.com/DianaLeoTang/PrismJSX/commit/87759ec8ba214f26e2c840fe5ff7c01fbef032c4))
* 修改发布者姓名 ([6e25870](https://github.com/DianaLeoTang/PrismJSX/commit/6e2587056a0d35a668128a19a77d3e5788e9d4cb))
* 修改彩虹色搭配 ([8e19435](https://github.com/DianaLeoTang/PrismJSX/commit/8e1943578e74e27169d52d155cbe36998155110f))
* 修改版本号 ([1f6b1f3](https://github.com/DianaLeoTang/PrismJSX/commit/1f6b1f3f5f317bc68e7c35b800be0ffd54a5a90d))
* 增加logo ([75a8b73](https://github.com/DianaLeoTang/PrismJSX/commit/75a8b73963847834cc6026177508d1a807b0238b))
* 增加刷新命令 ([d28967d](https://github.com/DianaLeoTang/PrismJSX/commit/d28967df5322d7955bf4253e63611a65a0a155f3))
* 拆分主文件，修改颜色条件设置规则 ([9135804](https://github.com/DianaLeoTang/PrismJSX/commit/9135804c6cc92fd1a97a9a3b4f341a2f3c65c746))
* 格式化代码 ([d648142](https://github.com/DianaLeoTang/PrismJSX/commit/d648142d53e3a6634f1e09809882ec06a5f3bf28))
* 第一个版本，给TS代码增加不同颜色的代码块注释 ([f27652a](https://github.com/DianaLeoTang/PrismJSX/commit/f27652a0b945226b51285524792229c0884b30d2))
* 给插件增加右侧小地图展示代码块功能的功能 ([653815d](https://github.com/DianaLeoTang/PrismJSX/commit/653815d95091328cd38e04c784beae60613bd2b8))
* 解决空白行无法着色的问题 ([b607327](https://github.com/DianaLeoTang/PrismJSX/commit/b6073275b7ab32372238339367db8f2975ca3d81))
* 解决颜色块之间有断层的问题 ([f59d6a9](https://github.com/DianaLeoTang/PrismJSX/commit/f59d6a929a380f994ec1ec88643963abaf4c0c17))
* 调整函数花括号涵盖范围，保证一个函数内彩虹带颜色是一致的。 ([86e5ff6](https://github.com/DianaLeoTang/PrismJSX/commit/86e5ff6215da58c9f853c4eb17aa5c41a218a3b1))
* 调整颜色处理方式，解决覆盖问题 ([a14577b](https://github.com/DianaLeoTang/PrismJSX/commit/a14577baec1a648efc68ef6aa1afa16427c903ee))
* 调试阶段暂时打开sourcemap ([de60596](https://github.com/DianaLeoTang/PrismJSX/commit/de605964e9b2aea9d6d7345058f43ec9873ef5de))
