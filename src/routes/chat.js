const express = require('express');
const axios = require('axios');
const router = express.Router();

// 智能URL处理函数
function normalizeApiUrl(baseUrl, endpoint) {
    if (!baseUrl) return '';
    
    // 移除末尾的斜杠
    let cleanUrl = baseUrl.replace(/\/+$/, '');
    
    // 常见API提供商的URL模式
    const apiPatterns = {
        'api.openai.com': '/v1',
        'api.anthropic.com': '/v1',
        'api.siliconflow.cn': '/v1',
        'api.deepseek.com': '/v1',
        'dashscope.aliyuncs.com': '/compatible-mode/v1',
        'open.bigmodel.cn': '/api/paas/v4',
        'api.moonshot.cn': '/v1'
    };
    
    // 检查是否已经包含版本路径
    const hasVersionPath = /\/(v1|v2|v3|v4|api\/v\d+|compatible-mode\/v\d+|api\/paas\/v\d+)$/i.test(cleanUrl);
    
    // 如果没有版本路径，根据域名添加标准路径
    if (!hasVersionPath) {
        for (const [domain, path] of Object.entries(apiPatterns)) {
            if (cleanUrl.includes(domain)) {
                cleanUrl += path;
                break;
            }
        }
        // 如果不是已知域名，默认添加/v1
        if (!hasVersionPath && !Object.keys(apiPatterns).some(domain => cleanUrl.includes(domain))) {
            cleanUrl += '/v1';
        }
    }
    
    // 添加端点
    return `${cleanUrl}/${endpoint}`;
}

// 获取API端点URL
function getApiEndpoint(baseUrl, provider, endpoint) {
    if (provider === 'custom') {
        return normalizeApiUrl(baseUrl, endpoint);
    }
    return `${baseUrl}${endpoint}`;
}

// API配置
const API_CONFIGS = {
    fastgpt: {
        key: process.env.FASTGPT_API_KEY,
        baseUrl: process.env.FASTGPT_BASE_URL || 'https://api.fastgpt.in/api/v1',
        endpoint: '/chat/completions'
    },
    openai: {
        key: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        endpoint: '/chat/completions'
    },
    anthropic: {
        key: process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
        endpoint: '/v1/messages'
    },
    custom: {
        key: null, // 从请求中获取
        baseUrl: null, // 从请求中获取
        endpoint: '' // 从请求中获取
    }
};

// 创建聊天完成
router.post('/completion', async (req, res) => {
    try {
        const { message, history = [], provider = 'fastgpt', model = 'fastgpt-3.5' } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: '消息不能为空' });
        }

        // 获取配置
        let config = API_CONFIGS[provider];
        
        if (provider === 'custom') {
            // 自定义提供商从请求中获取配置
            const { apiKey, baseUrl, model } = req.body;
            if (!apiKey || !baseUrl) {
                return res.status(400).json({ 
                    error: '自定义API需要提供apiKey和baseUrl参数' 
                });
            }
            config = {
                key: apiKey,
                baseUrl: baseUrl,
                endpoint: '' // 自定义API的endpoint包含在baseUrl中
            };
        } else if (provider === 'fastgpt') {
            // FastGPT特殊处理：优先使用请求中的配置
            const { apiKey, baseUrl } = req.body;
            if (apiKey && baseUrl) {
                // 使用请求中的配置
                config = {
                    key: apiKey,
                    baseUrl: baseUrl,
                    endpoint: '/chat/completions'
                };
            } else if (!config || !config.key) {
                return res.status(500).json({ 
                    error: `${provider} API密钥未配置，请在管理面板中配置API密钥` 
                });
            }
        } else if (!config || !config.key) {
            return res.status(500).json({ 
                error: `${provider} API密钥未配置，请在管理面板中配置API密钥` 
            });
        }

        let response;
        
        if (provider === 'fastgpt') {
            // FastGPT应用特定API调用
            const { chatId } = req.body;
            const fastgptChatId = chatId || "111"; // 默认chatId
            
            console.log('FastGPT配置:', {
                apiKey: config.key ? '***已配置***' : '未配置',
                baseUrl: config.baseUrl,
                chatId: fastgptChatId,
                endpoint: config.endpoint
            });
            
            // 尝试不同的 FastGPT API 端点
            const possibleEndpoints = [
                '/chat/completions',
                '/api/v1/chat/completions', 
                '/v1/chat/completions',
                '/completions'
            ];
            
            let lastError = null;
            let success = false;
            
            for (const endpoint of possibleEndpoints) {
                try {
                    // FastGPT应用API的请求体格式
                    const requestBody = {
                        chatId: fastgptChatId,
                        stream: false,
                        detail: false,
                        messages: [
                            {
                                content: message,
                                role: "user"
                            }
                        ]
                    };
                    
                    const apiUrl = `${config.baseUrl}${endpoint}`;
                    console.log(`尝试 FastGPT API 端点: ${apiUrl}`);
                    console.log('FastGPT请求体:', requestBody);
                    
                    response = await axios.post(
                        apiUrl,
                        requestBody,
                        {
                            headers: {
                                'Authorization': `Bearer ${config.key}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 30000
                        }
                    );
                    
                    console.log('FastGPT响应成功:', response.data);
                    success = true;
                    break;
                    
                } catch (error) {
                    console.log(`端点 ${endpoint} 失败:`, error.response?.status, error.response?.statusText);
                    lastError = error;
                    continue;
                }
            }
            
            if (!success) {
                throw lastError;
            }
        } else if (provider === 'openai') {
            response = await axios.post(
                `${config.baseUrl}${config.endpoint}`,
                {
                    model: model || 'gpt-3.5-turbo',
                    messages: [
                        {
                            content: message,
                            role: "user"
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.key}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
        } else if (provider === 'anthropic') {
            response = await axios.post(
                `${config.baseUrl}${config.endpoint}`,
                {
                    model: model || 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [
                        {
                            role: "user",
                            content: message
                        }
                    ]
                },
                {
                    headers: {
                        'x-api-key': config.key,
                        'Content-Type': 'application/json',
                        'anthropic-version': '2023-06-01'
                    },
                    timeout: 30000
                }
            );
        } else if (provider === 'custom') {
            // 自定义API调用
            const requestBody = {
                model: model || 'kimi2',
                messages: [
                    {
                        role: "user",
                        content: message
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            };
            
            // 使用智能URL处理
            const completionUrl = normalizeApiUrl(config.baseUrl, 'chat/completions');
            console.log('聊天完成URL:', completionUrl);
            
            response = await axios.post(
                completionUrl,
                requestBody,
                {
                    headers: {
                        'Authorization': `Bearer ${config.key}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
        } else {
            return res.status(400).json({ error: '不支持的API提供商' });
        }

        let aiResponse;
        if (provider === 'fastgpt') {
            aiResponse = response.data.choices[0]?.message?.content || response.data.text || '抱歉，我现在无法回复您。';
        } else if (provider === 'openai') {
            aiResponse = response.data.choices[0]?.message?.content || '抱歉，我现在无法回复您。';
        } else if (provider === 'anthropic') {
            aiResponse = response.data.content[0]?.text || '抱歉，我现在无法回复您。';
        } else if (provider === 'custom') {
            aiResponse = response.data.choices[0]?.message?.content || response.data.text || '抱歉，我现在无法回复您。';
        }
        
        res.json({
            response: aiResponse
        });

    } catch (error) {
        console.error(`${req.body.provider || 'API'} API错误:`, error.response?.data || error.message);
        
        const currentProvider = req.body.provider || 'API';
        
        if (error.response?.status === 401) {
            res.status(401).json({ error: `${currentProvider} API密钥无效，请检查配置` });
        } else if (error.response?.status === 429) {
            res.status(429).json({ error: '请求过于频繁，请稍后再试' });
        } else if (error.code === 'ECONNABORTED') {
            res.status(408).json({ error: '请求超时，请检查网络连接' });
        } else {
            res.status(500).json({ 
                error: `${currentProvider} AI服务暂时不可用，请检查API配置或稍后再试` 
            });
        }
    }
});

// 预览API端点URL
router.post('/preview-urls', (req, res) => {
    try {
        const { baseUrl, provider } = req.body;
        
        if (!baseUrl) {
            return res.status(400).json({ error: '请提供baseUrl参数' });
        }
        
        let chatUrl, modelsUrl;
        
        if (provider === 'custom') {
            chatUrl = normalizeApiUrl(baseUrl, 'chat/completions');
            modelsUrl = normalizeApiUrl(baseUrl, 'models');
        } else {
            // 对于标准提供商，使用固定的端点
            const config = API_CONFIGS[provider];
            if (config) {
                chatUrl = `${config.baseUrl}${config.endpoint}`;
                modelsUrl = provider === 'openai' ? `${config.baseUrl}/models` : '固定模型列表';
            }
        }
        
        res.json({
            success: true,
            urls: {
                chat: chatUrl,
                models: modelsUrl
            }
        });
        
    } catch (error) {
        console.error('预览URL错误:', error);
        res.status(500).json({ error: '预览URL失败' });
    }
});

// 获取可用模型列表
router.get('/models', async (req, res) => {
    try {
        const { provider, apiKey, baseUrl } = req.query;
        
        if (!provider) {
            return res.status(400).json({ error: '请提供provider参数' });
        }

        let models = [];
        
        if (provider === 'openai') {
            if (!apiKey) {
                return res.status(400).json({ error: 'OpenAI需要提供API密钥' });
            }
            
            try {
                const response = await axios.get(
                    `${baseUrl || 'https://api.openai.com/v1'}/models`,
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`
                        },
                        timeout: 10000
                    }
                );
                
                if (response.data && response.data.data) {
                    models = response.data.data
                        .filter(model => model.id.includes('gpt'))
                        .map(model => ({
                            id: model.id,
                            name: model.id,
                            description: `OpenAI ${model.id}`
                        }))
                        .sort((a, b) => a.name.localeCompare(b.name));
                }
            } catch (error) {
                console.error('获取OpenAI模型列表失败:', error.response?.data || error.message);
                return res.status(500).json({ 
                    error: '获取OpenAI模型列表失败，请检查API密钥和网络连接' 
                });
            }
        } else if (provider === 'anthropic') {
            // Anthropic API不提供模型列表接口，返回固定模型
            models = [
                { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Claude 3 Sonnet模型' },
                { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Claude 3 Opus模型' },
                { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Claude 3 Haiku模型' }
            ];
        } else if (provider === 'fastgpt') {
            // FastGPT应用特定API Key已包含应用配置，不需要获取模型列表
            // 模型在FastGPT云端应用中已经预配置
            models = [
                { 
                    id: 'fastgpt-app', 
                    name: 'FastGPT应用', 
                    description: '使用FastGPT应用中预配置的模型（模型在云端应用中设置）' 
                }
            ];
        } else if (provider === 'custom') {
            // 自定义API尝试获取模型列表
            if (!apiKey || !baseUrl) {
                return res.status(400).json({ error: '自定义API需要提供apiKey和baseUrl参数' });
            }
            
            try {
                // 智能处理URL，避免重复路径
                let modelsUrl = normalizeApiUrl(baseUrl, 'models');
                console.log('正在获取模型列表，URL:', modelsUrl);
                
                const response = await axios.get(modelsUrl, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                });
                
                console.log('模型列表响应:', response.data);
                
                if (response.data && response.data.data) {
                    // OpenAI格式的响应
                    models = response.data.data.map(model => ({
                        id: model.id || model.name,
                        name: model.name || model.id,
                        description: model.description || `模型 ${model.id || model.name}`
                    }));
                } else if (Array.isArray(response.data)) {
                    // 直接数组格式的响应
                    models = response.data.map(model => ({
                        id: model.id || model.name || model,
                        name: model.name || model.id || model,
                        description: model.description || `模型 ${model.name || model.id || model}`
                    }));
                } else if (response.data && response.data.models) {
                    // 其他格式的响应
                    models = response.data.models.map(model => ({
                        id: model.id || model.name,
                        name: model.name || model.id,
                        description: model.description || `模型 ${model.id || model.name}`
                    }));
                }
                
                console.log(`成功获取到 ${models.length} 个模型`);
                
            } catch (error) {
                console.error('获取自定义API模型列表失败:', error.response?.data || error.message);
                console.error('错误详情:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    url: error.config?.url,
                    headers: error.config?.headers
                });
                
                // 如果获取失败，返回常用的模型列表
                models = [
                    { id: 'kimi2', name: 'Kimi 2', description: 'Kimi 2模型' },
                    { id: 'qwen-turbo', name: 'Qwen Turbo', description: 'Qwen Turbo模型' },
                    { id: 'qwen-plus', name: 'Qwen Plus', description: 'Qwen Plus模型' },
                    { id: 'qwen-max', name: 'Qwen Max', description: 'Qwen Max模型' },
                    { id: 'glm-4', name: 'GLM-4', description: 'GLM-4模型' },
                    { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'DeepSeek Chat模型' },
                    { id: 'qwen2.5-7b-instruct', name: 'Qwen2.5-7B-Instruct', description: 'Qwen2.5-7B-Instruct模型' },
                    { id: 'custom-model', name: '自定义模型', description: '自定义模型' }
                ];
                
                // 抛出错误让前端知道获取失败了
                return res.status(500).json({ 
                    error: `获取模型列表失败: ${error.message}`,
                    fallback: true,
                    models: models
                });
            }
        } else {
            return res.status(400).json({ error: '不支持的provider类型' });
        }
        
        res.json({
            success: true,
            provider: provider,
            models: models,
            count: models.length
        });
        
    } catch (error) {
        console.error('获取模型列表错误:', error);
        res.status(500).json({ 
            error: '获取模型列表失败，请稍后再试' 
        });
    }
});

module.exports = router;