const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const PORT = 3000;

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFile = path.join(LOG_DIR, `port-cleaner-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`);

function log(message) {
    const timestamp = new Date().toLocaleString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(logFile, logMessage);
}

function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                log(`执行命令失败: ${command} - ${error.message}`);
                reject(error);
            } else {
                log(`执行成功: ${command}`);
                if (stdout) log(`输出: ${stdout}`);
                if (stderr) log(`错误输出: ${stderr}`);
                resolve({ stdout, stderr });
            }
        });
    });
}

async function cleanPort() {
    log('开始清理端口3000...');
    
    try {
        // Windows系统
        log('检测操作系统...');
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            log('使用Windows命令清理端口...');
            const { stdout } = await executeCommand(`netstat -ano | findstr :${PORT}`);
            
            const lines = stdout.split('\n').filter(line => line.trim());
            const pids = new Set();
            
            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 5) {
                    const pid = parts[parts.length - 1];
                    if (pid !== '0' && !isNaN(pid)) {
                        pids.add(pid);
                    }
                }
            });
            
            if (pids.size > 0) {
                log(`发现占用端口的PID: ${Array.from(pids).join(', ')}`);
                
                for (const pid of pids) {
                    try {
                        log(`正在终止PID ${pid}...`);
                        await executeCommand(`taskkill /F /PID ${pid}`);
                        log(`PID ${pid} 已终止`);
                    } catch (error) {
                        log(`终止PID ${pid} 失败: ${error.message}`);
                    }
                }
            } else {
                log('端口3000未被占用');
            }
        } else {
            // Unix/Linux/Mac系统
            log('使用Unix命令清理端口...');
            const { stdout } = await executeCommand(`lsof -ti:${PORT}`);
            
            const pids = stdout.split('\n').filter(line => line.trim());
            
            if (pids.length > 0) {
                log(`发现占用端口的PID: ${pids.join(', ')}`);
                
                for (const pid of pids) {
                    try {
                        log(`正在终止PID ${pid}...`);
                        await executeCommand(`kill -9 ${pid}`);
                        log(`PID ${pid} 已终止`);
                    } catch (error) {
                        log(`终止PID ${pid} 失败: ${error.message}`);
                    }
                }
            } else {
                log('端口3000未被占用');
            }
        }
        
        log('端口清理完成');
        
    } catch (error) {
        log(`清理端口时出错: ${error.message}`);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    cleanPort()
        .then(() => {
            log('端口清理脚本执行完毕');
            process.exit(0);
        })
        .catch(error => {
            log(`脚本执行失败: ${error.message}`);
            process.exit(1);
        });
}

module.exports = { cleanPort };