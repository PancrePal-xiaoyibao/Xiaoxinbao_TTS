const https = require('https');
const fs = require('fs');
const path = require('path');

// 检查证书文件是否存在
const certPath = path.join(__dirname, '..', 'cert.pem');
const keyPath = path.join(__dirname, '..', 'key.pem');

// 如果证书不存在，生成自签名证书
if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('正在生成自签名SSL证书...');
    
    const { execSync } = require('child_process');
    
    try {
        // 生成私钥
        execSync('openssl genrsa -out "' + keyPath + '" 2048');
        
        // 生成证书签名请求
        execSync('openssl req -new -key "' + keyPath + '" -out cert.csr -subj "/C=CN/ST=Beijing/L=Beijing/O=Xiaoxinbao/CN=localhost"');
        
        // 生成自签名证书
        execSync('openssl x509 -req -in cert.csr -signkey "' + keyPath + '" -out "' + certPath + '" -days 365');
        
        // 清理临时文件
        fs.unlinkSync('cert.csr');
        
        console.log('✅ SSL证书生成成功');
    } catch (error) {
        console.error('❌ SSL证书生成失败:', error.message);
        console.log('💡 请确保已安装OpenSSL并添加到PATH环境变量');
        process.exit(1);
    }
}

// 导出证书和密钥路径
module.exports = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
};