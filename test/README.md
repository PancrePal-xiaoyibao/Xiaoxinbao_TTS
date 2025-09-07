# 小馨宝测试工具包

## 🚀 快速开始

### 一键测试
```bash
# Windows PowerShell
.\test\start-test.ps1

# Windows CMD
test\start-test.bat

# 直接使用Node.js
node test\test-runner.js
```

## 📋 功能特性

### ✅ 测试前自动清理
- **端口清理**: 自动检测并终止占用3000端口的进程
- **缓存清理**: 清理Node.js缓存、浏览器缓存、临时文件
- **依赖检查**: 自动安装缺失的npm依赖

### 📊 全面测试
- **服务器启动**: 自动启动并监控服务器状态
- **健康检查**: 测试/health接口响应
- **端点测试**: 测试所有主要页面接口
- **性能监控**: 记录响应时间和状态码

### 📁 日志管理
- **详细日志**: 记录所有操作和测试结果
- **分类存储**: 按类型存储不同日志文件
- **测试报告**: 生成JSON格式的测试报告

## 🎯 使用模式

### 完整测试流程
```bash
node test\test-runner.js
```

### 仅清理模式
```bash
node test\test-runner.js --clean-only
# 或
.\test\start-test.ps1 -CleanOnly
```

### 仅测试模式（跳过清理）
```bash
node test\test-runner.js --test-only
# 或
.\test\start-test.ps1 -TestOnly
```

### 跳过依赖检查
```bash
node test\test-runner.js --test-only --no-deps
```

## 📊 输出文件

### 日志文件
```
test/
├── logs/
│   ├── test-run-YYYY-MM-DD-HH-MM-SS.log      # 主测试日志
│   ├── server-YYYY-MM-DD-HH-MM-SS.log        # 服务器输出
│   ├── port-cleaner-YYYY-MM-DD-HH-MM-SS.log  # 端口清理日志
│   └── cache-cleaner-YYYY-MM-DD-HH-MM-SS.log # 缓存清理日志
├── reports/
│   └── test-report-YYYY-MM-DD-HH-MM-SS.json  # 测试报告
```

### 测试报告内容
```json
{
  "startTime": "2024-08-02T10:00:00.000Z",
  "endTime": "2024-08-02T10:00:15.000Z",
  "duration": 15.5,
  "success": true,
  "errors": [],
  "logs": {
    "testLog": "test/logs/test-run-...log",
    "serverLog": "test/logs/server-...log",
    "portCleanerLog": "test/logs/port-cleaner-...log",
    "cacheCleanerLog": "test/logs/cache-cleaner-...log"
  }
}
```

## 🔧 脚本功能

### 1. 端口清理器 (port-cleaner.js)
- 检测端口3000占用情况
- 自动终止相关进程
- 支持Windows和Unix系统

### 2. 缓存清理器 (cache-cleaner.js)
- 清理Node.js缓存目录
- 清理浏览器缓存文件
- 清理临时日志文件

### 3. 日志收集器 (log-collector.js)
- 启动并监控服务器
- 测试所有API端点
- 收集详细的性能数据

### 4. 测试运行器 (test-runner.js)
- 协调整个测试流程
- 生成测试报告
- 支持多种运行模式

## 🚨 常见问题

### 端口被占用
测试会自动检测并清理端口3000的占用，无需手动操作。

### 权限问题
如果遇到权限错误，请确保以管理员身份运行：
- Windows: 右键 → 以管理员身份运行
- Unix: 使用 `sudo`

### 网络问题
测试会在本地运行，不依赖外部网络连接。

### 依赖问题
测试会自动检查并安装缺失的npm依赖。

## 📞 技术支持

如果测试失败，请检查以下文件：
1. `test/logs/test-run-*.log` - 主测试日志
2. `test/logs/server-*.log` - 服务器输出日志
3. 控制台输出的错误信息

## 🔄 持续集成

可以将测试脚本集成到CI/CD流程中：

```yaml
# GitHub Actions 示例
- name: 运行测试
  run: node test/test-runner.js
```