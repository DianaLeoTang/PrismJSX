const fs = require('fs');

// 从环境变量读取真实 token
const apiKey = process.env.BUILTIN_API_KEY;

// 替换占位符
let content = fs.readFileSync('out/semanticTranslator.js', 'utf8');
content = content.replace('__BUILTIN_API_KEY_PLACEHOLDER__', apiKey);
fs.writeFileSync('out/semanticTranslator.js', content);