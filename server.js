const app = require('./src/app');
const os = require('os');
const https = require('https');
const PORT = process.env.PORT || 3000;
const SSL_PORT = process.env.SSL_PORT || 3443;

// 尝试加载SSL配置
let sslConfig = null;
try {
    sslConfig = require('./src/ssl-config');
} catch (error) {
    console.log('⚠️ SSL证书未配置，仅支持HTTP访问');
}

// 获取本机所有网络接口的IP地址
function getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // 跳过内部地址和非IPv4地址
            if (interface.family === 'IPv4' && !interface.internal) {
                addresses.push({
                    name: name,
                    address: interface.address
                });
            }
        }
    }
    
    return addresses;
}

// 启动HTTP服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 小馨宝语音助手服务器启动成功！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📡 HTTP服务器运行在端口: ${PORT}`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    
    // 本地HTTP访问地址
    console.log('\n📱 HTTP访问地址:');
    console.log(`   本机访问: http://localhost:${PORT}`);
    console.log(`   本机访问: http://127.0.0.1:${PORT}`);
    
    // 获取并显示所有内网IP地址
    const networkInterfaces = getNetworkInterfaces();
    
    if (networkInterfaces.length > 0) {
        console.log('\n🏠 局域网HTTP访问地址:');
        networkInterfaces.forEach((iface, index) => {
            console.log(`   ${iface.name}: http://${iface.address}:${PORT}`);
        });
    }
    
    // 如果SSL配置可用，启动HTTPS服务器
    if (sslConfig) {
        const httpsServer = https.createServer(sslConfig, app);
        httpsServer.listen(SSL_PORT, '0.0.0.0', () => {
            console.log(`🔒 HTTPS服务器运行在端口: ${SSL_PORT}`);
            console.log('\n📱 HTTPS访问地址 (支持麦克风):');
            console.log(`   本机访问: https://localhost:${SSL_PORT}`);
            console.log(`   本机访问: https://127.0.0.1:${SSL_PORT}`);
            
            if (networkInterfaces.length > 0) {
                console.log('\n🏠 局域网HTTPS访问地址 (推荐用于麦克风):');
                networkInterfaces.forEach((iface, index) => {
                    console.log(`   ${iface.name}: https://${iface.address}:${SSL_PORT}`);
                });
            }
        });
    }
    
    console.log('\n💡 提示:');
    console.log('   • HTTPS地址支持麦克风权限 (推荐)');
    console.log('   • HTTP地址在localhost下支持麦克风');
    console.log('   • 首次访问HTTPS地址时需要接受自签名证书警告');
    console.log('   • 确保设备连接在同一WiFi网络下');
    console.log('   • 如无法访问，请检查防火墙设置');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎤 服务器已就绪，等待连接...\n');
});