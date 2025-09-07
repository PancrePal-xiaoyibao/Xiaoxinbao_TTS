# AI语音助手 - 肿瘤患者心理支持

一个基于Web技术的AI语音助手，专为肿瘤患者和家属提供心理支持和情感疏导的公益项目。

## 🎯 项目特色

- **语音交互**: 支持语音识别和语音合成，无需手动输入
- **智能对话**: 集成FastGPT工作流，提供专业的心理支持
- **温暖陪伴**: 专门为肿瘤患者设计的对话场景和回应方式
- **简单易用**: 界面简洁，一键开始语音对话

## 🛠️ 技术栈

- **后端**: Node.js + Express.js
- **前端**: HTML + JavaScript + Tailwind CSS
- **AI服务**: FastGPT API工作流
- **语音识别**: Web Speech API
- **语音合成**: SpeechSynthesis API

## 📦 安装部署

### 1. 克隆项目

```bash
git clone https://github.com/your-username/Xiaoxinbao-TTS.git
cd Xiaoxinbao-TTS
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env` 文件并填入你的FastGPT API密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# FastGPT API配置
FASTGPT_API_KEY=your_fastgpt_api_key_here
FASTGPT_BASE_URL=https://api.fastgpt.in/api/v1

# 服务器配置
PORT=3000
NODE_ENV=development
```

### 4. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 5. 访问应用

打开浏览器访问：http://localhost:3000

## 🚀 使用说明

### 基本操作

1. **启动应用**: 访问 http://localhost:3000
2. **开始对话**: 点击"开始语音识别"按钮
3. **语音输入**: 说出你的问题或想法
4. **AI回复**: 系统会自动识别语音并生成回复
5. **语音播放**: AI回复会通过语音合成播放出来

### 功能按钮

- **🎤 开始语音识别**: 点击后开始录音，再次点击停止
- **⏹️ 停止识别**: 停止当前录音并发送到AI
- **🔊 重新播放**: 重新播放AI的语音回复
- **📋 查看文本**: 查看语音识别的文本内容

## ⚙️ 配置说明

### 配置架构概述

本项目采用**双层配置机制**，支持灵活的模型参数管理：

- **环境变量配置**（`.env`文件）：作为默认配置和备用配置
- **前端动态配置**（管理面板）：存储在浏览器localStorage，优先级更高

**配置优先级：前端配置 > 环境变量配置**

### 1. 环境变量配置（.env文件）

#### 基础配置
```env
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT密钥
JWT_SECRET=your_jwt_secret_key_here

# 管理员账户（首次启动时创建）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

#### FastGPT配置
```env
# FastGPT API配置
FASTGPT_API_KEY=your_fastgpt_api_key_here
FASTGPT_BASE_URL=https://api.fastgpt.in/api/v1
FASTGPT_CHAT_MODEL=gpt-3.5-turbo
```

#### 其他AI服务配置（可选）
```env
# OpenAI配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1

# Anthropic配置
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_BASE_URL=https://api.anthropic.com
```

### 2. 前端动态配置（管理面板）

#### 访问管理面板
1. 启动服务后访问：`http://localhost:3000/admin-login.html`
2. 使用环境变量中设置的管理员账户登录
3. 进入管理面板进行配置

#### 支持的配置参数
- **供应商选择**：OpenAI、Anthropic、FastGPT、自定义API
- **API密钥**：各供应商的API密钥
- **基础URL**：API服务的基础URL
- **模型名称**：具体使用的模型（支持自动获取可用模型列表）
- **FastGPT特有参数**：
  - `chatId`：对话ID，用于关联对话上下文
- **模型参数**：
  - `maxTokens`：最大令牌数
  - `temperature`：温度参数（0-2）

#### 配置存储机制
```javascript
// 前端配置存储在localStorage中
const config = {
    provider: 'fastgpt',           // 供应商
    apiKey: 'your_api_key',        // API密钥
    baseUrl: 'https://api.xxx.com', // 基础URL
    modelName: 'gpt-3.5-turbo',    // 模型名称
    chatId: '111',                 // FastGPT对话ID
    maxTokens: 1000,               // 最大令牌数
    temperature: 0.7               // 温度参数
};
localStorage.setItem('adminConfig', JSON.stringify(config));
```

### 3. 配置联动机制

#### 后端处理逻辑
```javascript
// 优先使用前端传来的配置
if (provider === 'fastgpt') {
    const { apiKey, baseUrl } = req.body;
    if (apiKey && baseUrl) {
        // 使用前端配置
        config = {
            key: apiKey,
            baseUrl: baseUrl,
            endpoint: '/chat/completions'
        };
    } else if (!config || !config.key) {
        // 回退到环境变量配置
        config = API_CONFIGS[provider];
    }
}
```

#### 配置流程
1. **初始状态**：系统使用`.env`文件中的默认配置
2. **管理员配置**：通过管理面板设置参数，保存到localStorage
3. **用户使用**：前端发送请求时携带localStorage中的配置
4. **后端处理**：优先使用前端配置，如果没有则回退到环境变量

### 4. 支持的AI服务商

#### FastGPT
- **特点**：支持自定义工作流，专为特定场景优化
- **必需参数**：`apiKey`, `baseUrl`, `chatId`
- **默认chatId**：`111`

##### ⚠️ FastGPT BaseURL格式重要说明

**FastGPT的baseURL格式与标准OpenAI兼容格式不同，需要特别注意：**

```bash
# ❌ 错误格式（标准OpenAI兼容格式）
https://your-fastgpt-domain.com

# ✅ 正确格式（FastGPT专用格式）
https://your-fastgpt-domain.com/api/v1
```

**配置示例：**

1. **如果FastGPT给你的URL是：** `https://fastgpt.example.com`
   ```env
   # 需要手动添加 /api/v1 后缀
   FASTGPT_BASE_URL=https://fastgpt.example.com/api/v1
   ```

2. **如果FastGPT给你的URL已经包含路径：** `https://fastgpt.example.com/api/v1`
   ```env
   # 直接使用，无需修改
   FASTGPT_BASE_URL=https://fastgpt.example.com/api/v1
   ```

3. **私有化部署的FastGPT：**
   ```env
   # 根据你的部署情况调整端口和路径
   FASTGPT_BASE_URL=https://your-server.com:3000/api/v1
   ```

**常见错误和解决方案：**

| 错误现象 | 可能原因 | 解决方案 |
|---------|---------|---------|
| `404 Not Found` | baseURL格式错误 | 确保URL以`/api/v1`结尾 |
| `401 Unauthorized` | API密钥错误 | 检查FastGPT控制台中的API密钥 |
| `chatId not found` | chatId参数错误 | 使用FastGPT应用中的正确chatId |

**验证配置是否正确：**
```bash
# 测试API连接（替换为你的实际配置）
curl -X POST "https://your-fastgpt-domain.com/api/v1/chat/completions" \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "111",
    "stream": false,
    "detail": false,
    "messages": [{"content": "测试连接", "role": "user"}]
  }'
```

#### OpenAI
- **支持模型**：GPT-3.5-turbo, GPT-4等
- **必需参数**：`apiKey`, `baseUrl`（可选）

#### Anthropic
- **支持模型**：Claude-3系列
- **必需参数**：`apiKey`, `baseUrl`（可选）

#### 自定义API
- **特点**：支持兼容OpenAI格式的任意API
- **必需参数**：`apiKey`, `baseUrl`
- **自动URL处理**：系统会智能补全API端点路径

### 5. 配置最佳实践

#### 开发环境
- 在`.env`文件中设置基础配置
- 使用管理面板进行测试和调试

#### 生产环境
- 确保`.env`文件中的敏感信息安全
- 定期更新API密钥
- 监控API调用配额和费用

#### 安全建议
- 不要在代码中硬编码API密钥
- 使用环境变量管理敏感配置
- 定期轮换API密钥
- 限制API密钥的访问权限

### 环境变量参考表

| 变量名 | 描述 | 默认值 | 必填 |
|--------|------|--------|------|
| `PORT` | 服务器端口 | `3000` | 否 |
| `NODE_ENV` | 运行环境 | `development` | 否 |
| `JWT_SECRET` | JWT密钥 | - | 是 |
| `ADMIN_USERNAME` | 管理员用户名 | `admin` | 否 |
| `ADMIN_PASSWORD` | 管理员密码 | `admin123` | 否 |
| `FASTGPT_API_KEY` | FastGPT API密钥 | - | 否* |
| `FASTGPT_BASE_URL` | FastGPT API基础URL | `https://api.fastgpt.in/api/v1` | 否 |
| `OPENAI_API_KEY` | OpenAI API密钥 | - | 否* |
| `OPENAI_BASE_URL` | OpenAI API基础URL | `https://api.openai.com/v1` | 否 |
| `ANTHROPIC_API_KEY` | Anthropic API密钥 | - | 否* |
| `ANTHROPIC_BASE_URL` | Anthropic API基础URL | `https://api.anthropic.com` | 否 |

*注：至少需要配置一个AI服务商的API密钥，或通过管理面板进行配置

## 🧪 测试功能

### API测试

```bash
# 测试聊天API
curl -X POST http://localhost:3000/api/chat/completion \
  -H "Content-Type: application/json" \
  -d '{"message": "你好，我感觉有点焦虑"}'
```

### 语音功能测试

1. 确保使用Chrome浏览器（Web Speech API支持最好）
2. 检查麦克风权限
3. 测试语音识别准确度
4. 测试语音合成播放效果

## 🐛 故障排除

### 常见问题

1. **服务器启动失败**
   - 检查端口是否被占用
   - 确认所有依赖已安装
   - 查看错误日志

2. **语音识别不工作**
   - 确保浏览器支持Web Speech API
   - 检查麦克风权限
   - 建议使用Chrome浏览器

3. **AI回复失败**
   - 检查FastGPT API密钥是否正确
   - 确认网络连接正常
   - 查看API调用日志

4. **语音合成不播放**
   - 检查浏览器语音合成支持
   - 确认音频设备正常
   - 检查浏览器音频权限

### 日志查看

```bash
# 查看实时日志
npm run dev

# 查看错误日志
tail -f logs/error.log
```

## 📁 项目结构

```
Xiaoxinbao-TTS/
├── server.js              # 服务器入口文件
├── .env                   # 环境变量配置
├── .env.example          # 环境变量模板
├── package.json           # 项目依赖
├── README.md             # 项目说明
├── CLAUDE.md             # Claude AI项目记忆
├── frontend/
│   └── index.html        # 主前端界面
└── src/
    ├── app.js            # Express应用主文件
    └── routes/
        ├── chat.js       # 聊天API路由
        ├── auth.js       # 认证路由（待实现）
        └── tts.js        # TTS路由（待实现）
```

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- FastGPT团队提供的AI工作流服务
- Web Speech API提供的语音识别能力
- 所有为肿瘤患者心理支持事业贡献的开发者

## 📞 联系我们

如有问题或建议，请通过以下方式联系：

- 项目Issues: [GitHub Issues](https://github.com/your-username/Xiaoxinbao-TTS/issues)

---

**注意**: 本项目为公益性质，旨在为肿瘤患者提供心理支持。请勿用于商业用途。