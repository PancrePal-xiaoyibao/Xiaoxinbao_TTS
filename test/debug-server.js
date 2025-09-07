const axios = require('axios');
const app = require('../src/app');

// 测试服务器启动和API端点
async function debugServer() {
    const PORT = process.env.PORT || 3000;

    console.log('🔍 开始服务器诊断...\n');

    // 启动服务器
    const server = app.listen(PORT, async () => {
        console.log(`✅ 服务器已启动在端口 ${PORT}`);

        try {
            // 测试健康检查
            console.log('\n📡 测试健康检查端点...');
            const healthResponse = await axios.get(`http://localhost:${PORT}/health`);
            console.log('✅ 健康检查通过:', healthResponse.data);

            // 测试模型列表端点
            console.log('\n📡 测试模型列表端点...');
            const modelsResponse = await axios.get(`http://localhost:${PORT}/api/chat/models?provider=custom&apiKey=test&baseUrl=https://api.siliconflow.cn`);
            console.log('✅ 模型列表端点响应:', modelsResponse.data);

        } catch (error) {
            console.error('❌ API测试失败:');
            console.error('状态码:', error.response?.status);
            console.error('错误信息:', error.response?.data || error.message);
            console.error('请求URL:', error.config?.url);
        }

        // 关闭服务器
        server.close(() => {
            console.log('\n🔚 诊断完成，服务器已关闭');
            process.exit(0);
        });
    });

    server.on('error', (error) => {
        console.error('❌ 服务器启动失败:', error.message);
        if (error.code === 'EADDRINUSE') {
            console.error(`端口 ${PORT} 已被占用，请尝试其他端口或关闭占用该端口的程序`);
        }
        process.exit(1);
    });
}

// 运行诊断
debugServer().catch(console.error);