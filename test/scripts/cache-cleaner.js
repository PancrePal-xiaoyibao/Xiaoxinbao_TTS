const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const PROJECT_ROOT = path.join(__dirname, '..', '..');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFile = path.join(LOG_DIR, `cache-cleaner-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`);

function log(message) {
    const timestamp = new Date().toLocaleString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(logFile, logMessage);
}

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
                log(`删除文件: ${curPath}`);
            }
        });
        fs.rmdirSync(folderPath);
        log(`删除目录: ${folderPath}`);
    }
}

function cleanCache() {
    log('开始清理缓存...');
    
    try {
        // 清理Node.js缓存
        const nodeModulesCache = path.join(PROJECT_ROOT, 'node_modules', '.cache');
        if (fs.existsSync(nodeModulesCache)) {
            deleteFolderRecursive(nodeModulesCache);
            log('已清理Node.js缓存');
        }
        
        // 清理前端缓存
        const cachePatterns = [
            path.join(PROJECT_ROOT, '*.log'),
            path.join(PROJECT_ROOT, 'npm-debug.log*'),
            path.join(PROJECT_ROOT, 'yarn-debug.log*'),
            path.join(PROJECT_ROOT, 'yarn-error.log*'),
            path.join(PROJECT_ROOT, 'lerna-debug.log*'),
            path.join(PROJECT_ROOT, '.npm'),
            path.join(PROJECT_ROOT, '.eslintcache'),
            path.join(PROJECT_ROOT, '.node_repl_history'),
            path.join(PROJECT_ROOT, '*.tgz'),
            path.join(PROJECT_ROOT, '.yarn-integrity'),
            path.join(PROJECT_ROOT, '.env.local'),
            path.join(PROJECT_ROOT, '.env.development.local'),
            path.join(PROJECT_ROOT, '.env.test.local'),
            path.join(PROJECT_ROOT, '.env.production.local'),
        ];
        
        cachePatterns.forEach(pattern => {
            if (fs.existsSync(pattern)) {
                if (fs.lstatSync(pattern).isDirectory()) {
                    deleteFolderRecursive(pattern);
                } else {
                    fs.unlinkSync(pattern);
                    log(`删除文件: ${pattern}`);
                }
            }
        });
        
        // 清理浏览器缓存模拟（通过修改文件时间戳）
        const frontendFiles = [
            path.join(PROJECT_ROOT, 'frontend', '*.html'),
            path.join(PROJECT_ROOT, 'public', '**', '*')
        ];
        
        frontendFiles.forEach(filePattern => {
            const dir = path.dirname(filePattern.replace('**', ''));
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    if (fs.lstatSync(filePath).isFile()) {
                        // 修改文件时间戳来强制浏览器重新加载
                        const now = new Date();
                        fs.utimesSync(filePath, now, now);
                        log(`更新时间戳: ${filePath}`);
                    }
                });
            }
        });
        
        log('缓存清理完成');
        
    } catch (error) {
        log(`清理缓存时出错: ${error.message}`);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    cleanCache()
        .then(() => {
            log('缓存清理脚本执行完毕');
            process.exit(0);
        })
        .catch(error => {
            log(`脚本执行失败: ${error.message}`);
            process.exit(1);
        });
}

module.exports = { cleanCache };