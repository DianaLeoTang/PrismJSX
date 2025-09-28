# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 2.0.0 (2025-09-28)


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
