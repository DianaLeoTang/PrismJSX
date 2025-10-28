# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [4.4.0](https://github.com/DianaLeoTang/PrismJSX/compare/v4.3.0...v4.4.0) (2025-10-28)


### ♻️ 代码重构

* delete demo code ([6f1b533](https://github.com/DianaLeoTang/PrismJSX/commit/6f1b53311d314e85f968b76f9bcccf8da630779a))


### 🐛 Bug 修复

* 解决多次修改配置文件，配置不生效的问题 ([23dee52](https://github.com/DianaLeoTang/PrismJSX/commit/23dee5233787e2779f186ff4b30da82593e1f0c1))


### ✨ 新功能

*  更新项目配置项支持底色和彩虹条两种颜色切换 ([f75a7a6](https://github.com/DianaLeoTang/PrismJSX/commit/f75a7a6298baccedb3361975c2d49f2e7878e0c2))
* region区域功能调整，更新readme文件 ([9321b07](https://github.com/DianaLeoTang/PrismJSX/commit/9321b0770b63c2e2d133d816ec2eec06ac26769a))
* 仅在颜色发生变化时重新创建装饰类型 ([1b3b4ef](https://github.com/DianaLeoTang/PrismJSX/commit/1b3b4ef76f5a9a5fd3a19cf408e079b57ad6ff51))
* 在底色模式下，如果用户配置了透明度，使用用户配置的；如果用户配置的透明度 >= 0.9，使用 0.9，为了保持鼠标高亮的效果可以展示出来 ([21a4ff2](https://github.com/DianaLeoTang/PrismJSX/commit/21a4ff2d8417aaa2ee2a6d9e3ee072b3f38b3ac7))
* 增加两种配置可选项hooks也支持底色展示或者边上彩虹条展示，彩虹条时可配置宽度，底色展示时最大透明度是0.9 ([3c21c2f](https://github.com/DianaLeoTang/PrismJSX/commit/3c21c2fa80aae92006655216c112baf2d56fb544))
* 增加对多种颜色设置的适配，包括rgb,rgba,#aaa,#aaaaaa这四种格式 ([c30cf65](https://github.com/DianaLeoTang/PrismJSX/commit/c30cf65278f75fb634a0cdb3b55c3d95e7de7db4))
* 开启两种配置，如果选择侧边彩虹条展示，用用户自定义的原生颜色，如果选择为底色展示，没有配置透明度，默认调整为0.9 ([a4aaa24](https://github.com/DianaLeoTang/PrismJSX/commit/a4aaa2458c1698c6da4829b0138f608d8dbaa996))
* 根据最新的核心代码，更新对项目功能的说明文件 ([7edb784](https://github.com/DianaLeoTang/PrismJSX/commit/7edb7845fe75dcd0251b49ad2d409b6c71e0e7c9))
* 读取用户显式配置的设置值（工作区文件夹 > 工作区 > 全局） ([86c77fa](https://github.com/DianaLeoTang/PrismJSX/commit/86c77fa9905d44c0d1a6eeab2f8a360856b91705))
* 调整颜色不透明度，解决鼠标高亮展示不出来的问题 ([3811e69](https://github.com/DianaLeoTang/PrismJSX/commit/3811e69d003cf24eaed413884e6dbef2718104d4))

## [4.3.0](https://github.com/DianaLeoTang/PrismJSX/compare/v4.2.0...v4.3.0) (2025-10-24)


### 🐛 Bug 修复

* 解决vant标签识别只标注出来第一行的问题 ([2aaf7e1](https://github.com/DianaLeoTang/PrismJSX/commit/2aaf7e18f88ead48a902a2adc3a562474cd25231))
* 解决vue生命周期函数,只识别了第一行的问题 ([625fd05](https://github.com/DianaLeoTang/PrismJSX/commit/625fd0593783c9bbe10a663bed9b4088f92e568d))


### ✨ 新功能

*  增加Vue示例文件 ([833bb62](https://github.com/DianaLeoTang/PrismJSX/commit/833bb62222ef42b4b0a1947711cf0babdd4f5463))
*  增加对Vue模板函数，生命周期，部分vant组件的识别支持 ([087df46](https://github.com/DianaLeoTang/PrismJSX/commit/087df46fd63dd4e0858a79c60dd9e0b20112775c))
*  增加对Vue模板函数，生命周期，部分vant组件的识别支持，增加对应的马卡龙颜色 ([79fc448](https://github.com/DianaLeoTang/PrismJSX/commit/79fc448a8c499fa4e680b2a65a2c11c0207e96a5))
* AI翻译函数在Vue模板里生效了 ([9671213](https://github.com/DianaLeoTang/PrismJSX/commit/9671213fa9170a06f84b81443ac1f8d2c8c7af28))
* 在插件系统里引入Vue模板支持文件 ([576f598](https://github.com/DianaLeoTang/PrismJSX/commit/576f598cccba08053fa6130c47dad5c555243d20))
* 增加对Vant高频组件的识别和颜色标注 ([6a4a7c0](https://github.com/DianaLeoTang/PrismJSX/commit/6a4a7c0b97fa9c760332ad906f78a0415ee5cfba))
* 增加对Vue不同生命周期钩子的颜色处理 ([a756a93](https://github.com/DianaLeoTang/PrismJSX/commit/a756a93b36f77ec57fd163d0fe1e0910cc8568b0))
* 引入Ai翻译，但没生效，明天继续看，下班 ([e67dc16](https://github.com/DianaLeoTang/PrismJSX/commit/e67dc165c58474dee0f6ad24f3432c9e6ddc913f))
* 当遇到嵌套组件时，颜色展示外层组件的颜色 ([d12bb45](https://github.com/DianaLeoTang/PrismJSX/commit/d12bb4501a3199cc8ea40eee1c717f8ed5713019))
* 忽略对单行div的组件识别和标识 ([7d4f0c5](https://github.com/DianaLeoTang/PrismJSX/commit/7d4f0c5dc7526fa07ae24e9611f9b92574a406ef))
* 支持更多AI模型的接入 ([2ca3713](https://github.com/DianaLeoTang/PrismJSX/commit/2ca3713deff70c61f6f4ac647c407f6310b06ef3))
* 更新readme文件，同步识别Vue模板文件的功能 ([2494298](https://github.com/DianaLeoTang/PrismJSX/commit/2494298e8a29e8e570b04681c1a2fbf4e1811a7b))
* 重构 Vue 模块架构并修复颜色方案，确保主题切换正常工作 ([119495e](https://github.com/DianaLeoTang/PrismJSX/commit/119495e37f7db8d3b544150e2f0814afbcc5fcfb))

## [4.2.0](https://github.com/DianaLeoTang/PrismJSX/compare/v4.1.0...v4.2.0) (2025-10-22)


### ✨ 新功能

* 同步默认hooks颜色配置 ([befeda9](https://github.com/DianaLeoTang/PrismJSX/commit/befeda92709e7637dde5c067cf31638e2f14a629))
* 增加对其他hooks支持的示例文件 ([56d1d82](https://github.com/DianaLeoTang/PrismJSX/commit/56d1d828f1eae420c2b27ab797f3f8b3ca87c987))
* 把颜色修改改成这种配置方式{ ([559df2e](https://github.com/DianaLeoTang/PrismJSX/commit/559df2efb7f3e9233ea15ca9893d6947a46b9a2b)), closes [#FF8A65](https://github.com/DianaLeoTang/PrismJSX/issues/FF8A65)
* 支持更多的hooks区域颜色自定义 ([2e10216](https://github.com/DianaLeoTang/PrismJSX/commit/2e10216b938dd4803bf4274fdfed2e18ebe9c609))
* 更新readme文件 ([c1241f1](https://github.com/DianaLeoTang/PrismJSX/commit/c1241f1ce0c1b05bb702f2aa839bcd2a4ee4d908))

## [4.1.0](https://github.com/DianaLeoTang/PrismJSX/compare/v4.0.0...v4.1.0) (2025-10-22)


### ✨ 新功能

*  修改支持region区域也是自定义颜色 ([4cbd583](https://github.com/DianaLeoTang/PrismJSX/commit/4cbd5831f850781b31564a346fd653c475583b4d))
* 修改代码区域展示从左侧彩虹条改成全屏底色展示 ([e2a5b8f](https://github.com/DianaLeoTang/PrismJSX/commit/e2a5b8f7f66d93535cc6f36585707efe1467503e))
* 删除不支持的功能以及敏感地址 ([4e5e678](https://github.com/DianaLeoTang/PrismJSX/commit/4e5e6787d532d3ad79ad312fac31349fb88e9dcb))
* 扁平化配置，获取用户自定义颜色 ([be5c6a0](https://github.com/DianaLeoTang/PrismJSX/commit/be5c6a0cd1bb466b919b0725ae074be8a52b97fd))
* 支持用户自定义四种hooks的颜色 ([6060782](https://github.com/DianaLeoTang/PrismJSX/commit/6060782d4a3c9c2b5e152bfb80333fa146c378ec))
* 更新readme文件，增加对自定义hooks颜色的说明 ([3d5a144](https://github.com/DianaLeoTang/PrismJSX/commit/3d5a144ae034e1534721befae55e923869cbe7de))
* 更新示例文件 ([adb9fe0](https://github.com/DianaLeoTang/PrismJSX/commit/adb9fe0c0de6323cfd964e2e27a1256743bf3e76))
* 测试代码 ([5c4c548](https://github.com/DianaLeoTang/PrismJSX/commit/5c4c548812921042b335e05271c9c40691b309a8))
* 调整默认主题色配置 ([900d00d](https://github.com/DianaLeoTang/PrismJSX/commit/900d00dd33178130a7a3a9874bcf4ab32fb7ea05))

## [4.0.0](https://github.com/DianaLeoTang/PrismJSX/compare/v3.5.0...v4.0.0) (2025-10-17)


### 🐛 Bug 修复

* 解决中文标记出现多次的问题 ([dbe98c2](https://github.com/DianaLeoTang/PrismJSX/commit/dbe98c2e2bb84e1dc5f8a88dca246cc67d164463))


### ♻️ 代码重构

*  注释不使用的代码 ([4146a55](https://github.com/DianaLeoTang/PrismJSX/commit/4146a55434c9561c37eebcb54d0bf6885a0a7d26))
* 删除console ([7a2efcf](https://github.com/DianaLeoTang/PrismJSX/commit/7a2efcf5116fd2abba222eb7eaacc027135c931f))
* 删除console ([7deccd4](https://github.com/DianaLeoTang/PrismJSX/commit/7deccd46d6682a3b7907a6ed7736558edf0a41b8))


### ✨ 新功能

*  根据最新功能调整readme文件 ([d313637](https://github.com/DianaLeoTang/PrismJSX/commit/d31363768354bf9218f4b9b63cd94a18afb5cf52))
* 'useMemo' | 'useCallback'｜'useState'的识别都可以了，还差use Effect ([99d6ea5](https://github.com/DianaLeoTang/PrismJSX/commit/99d6ea52bd855788a1634170f232f42b43f828d5))
* 不同hooks匹配不同的规则颜色 ([3df78a7](https://github.com/DianaLeoTang/PrismJSX/commit/3df78a78d6554f12936522f13e4df503c6fef096))
* 拆分文件，避免文件代码体积过大 ([b6e3f59](https://github.com/DianaLeoTang/PrismJSX/commit/b6e3f5963d06b196843d1cf20a165d0c609fc332))
* 调整对hooks的检查 ([e29c88e](https://github.com/DianaLeoTang/PrismJSX/commit/e29c88ee3a32fd4018a02b24e1b31bb3be04aed9))
* 调整hooks识别的边界问题，之前useeffect.的识别存在边界溢出的问题 ([2d97748](https://github.com/DianaLeoTang/PrismJSX/commit/2d97748246c3c1a9722f710c5be9e799042ef33b))
* 这次修改解决了对useState周边函数被检测到函数范围里做了修复 ([0353651](https://github.com/DianaLeoTang/PrismJSX/commit/0353651b375c1cad0955524681fa51e2b21116c0))

## [3.5.0](https://github.com/DianaLeoTang/PrismJSX/compare/v3.4.0...v3.5.0) (2025-10-16)


### ✨ 新功能

*  注释对其他hooks、函数的颜色标注 ([18b74a1](https://github.com/DianaLeoTang/PrismJSX/commit/18b74a19bc2cedf581fd88e91d55f420c1e94d27))
* 1调整代码结构，函数检测边界进行更严格的约束。2hooks的识别在最优先级别。3JSX里的hooks也要能被识别 ([a6fca7e](https://github.com/DianaLeoTang/PrismJSX/commit/a6fca7e3507fa2da679dfd0f39869bc5f5a286a4))
* 打包Vscode插件时，忽略.env文件 ([8c914ee](https://github.com/DianaLeoTang/PrismJSX/commit/8c914ee9348d73dd3768264e4402d5bcd77a3216))
* 调整主题色亮度 ([c6939b1](https://github.com/DianaLeoTang/PrismJSX/commit/c6939b1ccb79cffe9bf67db588bddc9828612e45))
* 更新readme文件 ([8dbc4b2](https://github.com/DianaLeoTang/PrismJSX/commit/8dbc4b26fe72e397031c88a9b5a35695bd6c280a))
* 忽略JSX标签里的函数识别 ([39ef749](https://github.com/DianaLeoTang/PrismJSX/commit/39ef749b17935972e00a3d0234425f8434baad88))
* 进一步优化TS类型定义里的函数忽略 ([baca4cd](https://github.com/DianaLeoTang/PrismJSX/commit/baca4cd329c0a91a858dc0e386f4e4cb694812f2))
* 取消对低频hooks的识别 ([bb9d57a](https://github.com/DianaLeoTang/PrismJSX/commit/bb9d57a93b5449ffb169c2db7e932842ca65a91d))
* 去掉不使用的命令 ([2b8d526](https://github.com/DianaLeoTang/PrismJSX/commit/2b8d526899213cd25a99129cc91b9fb873c3bb2b))
* 同步新功能介绍到readme文件 ([035e209](https://github.com/DianaLeoTang/PrismJSX/commit/035e20910fce494436f584877f31dcafe4df1037))
* 修改打包目录结构 ([843baa0](https://github.com/DianaLeoTang/PrismJSX/commit/843baa049e67274c3190511f85ae433d07c20442))

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
