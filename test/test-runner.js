#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { cleanPort } = require('./scripts/port-cleaner');
const { cleanCache } = require('./scripts/cache-cleaner');
const LogCollector = require('./scripts/log-collector');

const LOG_DIR = path.join(__dirname, 'logs');
const TEST_REPORT_DIR = path.join(__dirname, 'reports');

// 确保目录存在
[LOG_DIR, TEST_REPORT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

class TestRunner {
    constructor() {
        this.startTime = new Date();
        this.testLogFile = path.join(LOG_DIR, `test-run-${this.startTime.toISOString().slice(0, 19).replace(/:/g, '-')}.log`);
        this.summary = {
            startTime: this.startTime,
            endTime: null,
            duration: null,
            tests: [],
            errors: [],
            success: false
        };
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toLocaleString();
        const logMessage = `[${timestamp}] [${type}] ${message}`;
        console.log(logMessage);
        fs.appendFileSync(this.testLogFile, logMessage + '\n');
    }

    async runCommand(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            this.log(`执行命令: ${command} ${args.join(' ')}`);
            
            const process = spawn(command, args, {
                stdio: 'inherit',
                ...options
            });

            process.on('close', (code) => {
                if (code === 0) {
                    this.log(`命令执行成功: ${command}`, 'SUCCESS');
                    resolve();
                } else {
                    this.log(`命令执行失败: ${command} (退出码: ${code})`, 'ERROR');
                    reject(new Error(`命令失败: ${command}`));
                }
            });

            process.on('error', (error) => {
                this.log(`命令执行错误: ${error.message}`, 'ERROR');
                reject(error);
            });
        });
    }

    async preTestCleanup() {
        this.log('=== 开始测试前清理 ===', 'INFO');
        
        try {
            // 清理端口
            this.log('清理端口3000...', 'INFO');
            await cleanPort();
            
            // 清理缓存
            this.log('清理缓存...', 'INFO');
            await cleanCache();
            
            this.log('清理完成', 'SUCCESS');
        } catch (error) {
            this.log(`清理失败: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async installDependencies() {
        this.log('检查依赖...', 'INFO');
        
        const packageLockPath = path.join(__dirname, '..', '..', 'package-lock.json');
        const nodeModulesPath = path.join(__dirname, '..', '..', 'node_modules');
        
        if (!fs.existsSync(nodeModulesPath) || !fs.existsSync(packageLockPath)) {
            this.log('安装依赖...', 'INFO');
            await this.runCommand('npm', ['install'], { cwd: path.join(__dirname, '..', '..') });
        } else {
            this.log('依赖已安装', 'INFO');
        }
    }

    async runTests() {
        this.log('=== 开始测试 ===', 'INFO');
        
        const collector = new LogCollector();
        
        try {
            await collector.runFullTest();
            this.summary.success = true;
            this.log('所有测试通过！', 'SUCCESS');
        } catch (error) {
            this.summary.success = false;
            this.summary.errors.push(error.message);
            this.log(`测试失败: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    generateReport() {
        this.summary.endTime = new Date();
        this.summary.duration = (this.summary.endTime - this.startTime) / 1000;
        
        const report = {
            ...this.summary,
            logs: {
                testLog: this.testLogFile,
                serverLog: path.join(LOG_DIR, `server-${this.startTime.toISOString().slice(0, 19).replace(/:/g, '-')}.log`),
                portCleanerLog: path.join(LOG_DIR, `port-cleaner-${this.startTime.toISOString().slice(0, 19).replace(/:/g, '-')}.log`),
                cacheCleanerLog: path.join(LOG_DIR, `cache-cleaner-${this.startTime.toISOString().slice(0, 19).replace(/:/g, '-')}.log`)
            }
        };
        
        const reportPath = path.join(TEST_REPORT_DIR, `test-report-${this.startTime.toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        this.log(`测试报告已生成: ${reportPath}`, 'SUCCESS');
        
        return report;
    }

    async run() {
        try {
            this.log('=== 小馨宝测试运行器启动 ===', 'INFO');
            
            // 预测试清理
            await this.preTestCleanup();
            
            // 安装依赖
            await this.installDependencies();
            
            // 运行测试
            await this.runTests();
            
            // 生成报告
            const report = this.generateReport();
            
            this.log(`=== 测试运行完成 ===`, 'SUCCESS');
            this.log(`总耗时: ${report.duration}秒`);
            this.log(`结果: ${report.success ? '成功' : '失败'}`);
            
            return report;
            
        } catch (error) {
            this.log(`测试运行失败: ${error.message}`, 'ERROR');
            const report = this.generateReport();
            process.exit(1);
        }
    }
}

// 命令行参数处理
const args = process.argv.slice(2);
const runner = new TestRunner();

// 支持不同的运行模式
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
小馨宝测试运行器

用法:
  node test-runner.js [选项]

选项:
  --help, -h     显示帮助信息
  --clean-only   仅执行清理操作
  --test-only    仅执行测试（跳过清理）
  --no-deps      跳过依赖检查

示例:
  node test-runner.js           # 完整测试流程
  node test-runner.js --clean-only
  node test-runner.js --test-only
`);
    process.exit(0);
}

// 根据参数运行不同模式
if (args.includes('--clean-only')) {
    runner.log('仅执行清理操作');
    runner.preTestCleanup()
        .then(() => {
            runner.log('清理完成');
            process.exit(0);
        })
        .catch(() => process.exit(1));
} else if (args.includes('--test-only')) {
    runner.log('仅执行测试');
    if (!args.includes('--no-deps')) {
        runner.installDependencies()
            .then(() => runner.runTests())
            .then(() => runner.generateReport())
            .catch(() => process.exit(1));
    } else {
        runner.runTests()
            .then(() => runner.generateReport())
            .catch(() => process.exit(1));
    }
} else {
    // 完整流程
    runner.run()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = TestRunner;