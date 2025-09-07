const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');
const ttsRoutes = require('./routes/tts');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件 - 开发环境放宽限制
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'", "https://api.fastgpt.in", "https://cdn.tailwindcss.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "data:"],
            frameSrc: ["'self'", "data:", "blob:"],
            workerSrc: ["'self'", "blob:"]
        }
    } : false // 开发环境禁用CSP
}));

// 跨域配置 - 开发环境允许所有来源
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com', 'https://www.yourdomain.com']
        : true, // 开发环境允许所有来源
    credentials: true
}));

// 强制HTTP访问中间件 - 必须在所有路由之前
app.use((req, res, next) => {
    // 移除可能导致HTTPS升级的响应头
    res.removeHeader('Strict-Transport-Security');
    
    // 设置响应头防止浏览器升级到HTTPS
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // 明确告诉浏览器这是HTTP服务
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    
    // 添加防止HTTPS升级的头
    res.setHeader('X-Forwarded-Proto', 'http');
    res.setHeader('X-Forwarded-SSL', 'off');
    res.setHeader('X-Url-Scheme', 'http');
    
    next();
});

// 压缩中间件
app.use(compression());

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 禁用缓存以解决开发时的缓存问题
app.use(express.static(path.join(__dirname, '../frontend'), {
    maxAge: 0, // 禁用缓存
    etag: false,
    lastModified: false
}));
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: 0, // 禁用缓存
    etag: false,
    lastModified: false
}));

// API路由
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tts', ttsRoutes);

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// 根路由重定向到欢迎页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/welcome.html'));
});

// 用户面板路由
app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/user-panel.html'));
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ error: '请求的资源不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err.stack);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : err.message
    });
});

// 启动服务器
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`服务器运行在端口 ${PORT}`);
        console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`访问: http://localhost:${PORT}`);
    });
}

module.exports = app;