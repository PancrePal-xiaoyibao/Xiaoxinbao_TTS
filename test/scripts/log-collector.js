const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const PROJECT_ROOT = path.join(__dirname, '..', '..');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

class LogCollector {
    constructor() {
        this.logFile = path.join(LOG_DIR, `app-test-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`);
        this.serverLogFile = path.join(LOG_DIR, `server-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`);
        this.testLogFile = path.join(LOG_DIR, `test-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`);
        this.serverProcess = null;
        this.startTime = new Date();
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toLocaleString();
        const logMessage = `[${timestamp}] [${type}] ${message}\n`;
        console.log(logMessage.trim());
        fs.appendFileSync(this.logFile, logMessage);
    }

    logServer(message) {
        const timestamp = new Date().toLocaleString();
        const logMessage = `[${timestamp}] ${message}\n`;
        fs.appendFileSync(this.serverLogFile, logMessage);
    }

    logTest(message) {
        const timestamp = new Date().toLocaleString();
        const logMessage = `[${timestamp}] ${message}\n`;
        fs.appendFileSync(this.testLogFile, logMessage);
    }

    async testServerHealth() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: '/health',
                method: 'GET',
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        this.log(`健康检查响应: ${res.statusCode} - ${JSON.stringify(response)}`, 'SUCCESS');
                        resolve(response);
                    } catch (e) {
                        this.log(`健康检查响应解析失败: ${e.message}`, 'ERROR');
                        resolve({ status: 'unknown', raw: data });
                    }
                });
            });

            req.on('error', (err) => {
                this.log(`健康检查失败: ${err.message}`, 'ERROR');
                reject(err);
            });

            req.on('timeout', () => {
                this.log('健康检查超时', 'ERROR');
                req.destroy();
                reject(new Error('Timeout'));
            });

            req.end();
        });
    }

    async testEndpoints() {
        const endpoints = [
            { path: '/', description: '主页' },
            { path: '/welcome.html', description: '欢迎页面' },
            { path: '/user-agreement.html', description: '用户协议页面' },
            { path: '/user-panel.html', description: '用户面板页面' },
            { path: '/admin-login.html', description: '管理员登录页面' },
            { path: '/health', description: '健康检查接口' },
            { path: '/api/chat', description: '聊天API接口' }
        ];

        this.log('开始测试所有端点...', 'INFO');

        for (const endpoint of endpoints) {
            try {
                await this.testEndpoint(endpoint.path, endpoint.description);
            } catch (error) {
                this.log(`测试 ${endpoint.description} 失败: ${error.message}`, 'ERROR');
            }
        }
    }

    async testEndpoint(path, description) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: path,
                method: 'GET',
                timeout: 10000
            };

            const startTime = Date.now();
            const req = http.request(options, (res) => {
                const duration = Date.now() - startTime;
                
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const size = Buffer.byteLength(data);
                    const status = res.statusCode;
                    
                    if (status >= 200 && status < 400) {
                        this.log(`✅ ${description}: ${status} (${duration}ms, ${size}bytes)`, 'SUCCESS');
                    } else {
                        this.log(`❌ ${description}: ${status} (${duration}ms)`, 'ERROR');
                    }
                    
                    resolve();
                });
            });

            req.on('error', (err) => {
                const duration = Date.now() - startTime;
                this.log(`❌ ${description}: 连接失败 (${duration}ms) - ${err.message}`, 'ERROR');
                resolve(); // 继续测试其他端点
            });

            req.on('timeout', () => {
                req.destroy();
                this.log(`❌ ${description}: 超时 (10s)`, 'ERROR');
                resolve();
            });

            req.end();
        });
    }

    async startServer() {
        return new Promise((resolve, reject) => {
            this.log('启动服务器...', 'INFO');
            
            this.serverProcess = spawn('npm', ['start'], {
                cwd: PROJECT_ROOT,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            this.serverProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                this.logServer(message);
                
                if (message.includes('服务器运行在端口') || message.includes('Server running on port')) {
                    this.log('服务器启动成功', 'SUCCESS');
                    resolve();
                }
            });

            this.serverProcess.stderr.on('data', (data) => {
                const message = data.toString().trim();
                this.logServer(`ERROR: ${message}`);
                this.log(`服务器错误: ${message}`, 'ERROR');
            });

            this.serverProcess.on('close', (code) => {
                this.log(`服务器进程关闭，退出码: ${code}`, 'INFO');
                if (code !== 0) {
                    reject(new Error(`服务器异常退出: ${code}`));
                }
            });

            this.serverProcess.on('error', (error) => {
                this.log(`启动服务器失败: ${error.message}`, 'ERROR');
                reject(error);
            });

            // 30秒后如果还没启动，则超时
            setTimeout(() => {
                reject(new Error('服务器启动超时'));
            }, 30000);
        });
    }

    async stopServer() {
        if (this.serverProcess) {
            this.log('停止服务器...', 'INFO');
            this.serverProcess.kill('SIGTERM');
            
            // 等待5秒，如果还没关闭则强制终止
            setTimeout(() => {
                if (this.serverProcess && !this.serverProcess.killed) {
                    this.log('强制终止服务器进程', 'WARNING');
                    this.serverProcess.kill('SIGKILL');
                }
            }, 5000);
        }
    }

    async runFullTest() {
        try {
            this.log('=== 开始完整测试 ===', 'INFO');
            
            // 启动服务器
            await this.startServer();
            
            // 等待服务器完全启动
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 测试健康检查
            await this.testServerHealth();
            
            // 测试所有端点
            await this.testEndpoints();
            
            // 运行时间统计
            const duration = (Date.now() - this.startTime) / 1000;
            this.log(`=== 测试完成，总耗时: ${duration}秒 ===`, 'SUCCESS');
            
        } catch (error) {
            this.log(`测试失败: ${error.message}`, 'ERROR');
            throw error;
        } finally {
            await this.stopServer();
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const collector = new LogCollector();
    collector.runFullTest()
        .then(() => {
            console.log('测试完成！');
            process.exit(0);
        })
        .catch(error => {
            console.error('测试失败:', error.message);
            process.exit(1);
        });
}

module.exports = LogCollector;