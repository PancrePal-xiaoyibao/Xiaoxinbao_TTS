# 项目概述
AI语音助手 - 为肿瘤患者提供心理支持的公益项目

## 当前状态
### 完成的核心功能
- ✅ Express后端服务器 (src/app.js)
- ✅ FastGPT API集成 (src/routes/chat.js)
- ✅ 前端语音识别界面 (user.html)
- ✅ 前后端API连接
- ✅ 静态文件服务配置
- ✅ CORS和安全配置
- ✅ 错误处理机制

### 技术栈
- **后端**: Node.js + Express.js
- **前端**: HTML + JavaScript + Tailwind CSS
- **AI服务**: FastGPT API
- **语音识别**: Web Speech API
- **语音合成**: SpeechSynthesis API

### 项目结构
```
Xiaoxinbao-TTS2/
├── server.js              # 服务器入口文件
├── .env                   # 环境变量配置
├── frontend/
│   └── index.html        # 主前端界面
├── src/
│   ├── app.js            # Express应用主文件
│   └── routes/
│       ├── chat.js       # 聊天API路由
│       ├── auth.js       # 认证路由（待实现）
│       └── tts.js        # TTS路由（待实现）
└── package.json
```

## 使用说明
1. 安装依赖: `npm install`
2. 配置环境变量: 修改`.env`文件中的FastGPT API密钥
3. 启动服务器: `npm start`
4. 访问应用: http://localhost:3000

## 待测试功能
- 服务器启动和API调用
- 完整的语音识别对话流程
- 错误处理和用户友好提示

## 注意事项
- 需要有效的FastGPT API密钥
- 浏览器需要支持Web Speech API
- 建议使用Chrome浏览器以获得最佳语音识别效果