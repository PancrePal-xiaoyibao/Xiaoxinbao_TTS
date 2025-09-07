# PowerShell 测试启动脚本
param(
    [switch]$Debug,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
小馨宝测试启动器

用法:
  .\start-test.ps1 [选项]

选项:
  -Debug        运行服务器诊断
  -Help         显示帮助信息

示例:
  .\start-test.ps1           # 完整测试流程
  .\start-test.ps1 -Debug    # 诊断服务器问题
"@
    exit 0
}

Write-Host "=== 小馨宝测试启动器 ===" -ForegroundColor Green
Write-Host "开始时间: $(Get-Date)" -ForegroundColor Yellow

# 检查 Node.js 是否安装
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 检查依赖是否安装
if (!(Test-Path "node_modules")) {
    Write-Host "安装依赖..." -ForegroundColor Yellow
    npm install
}

# 如果是调试模式，运行服务器诊断
if ($Debug) {
    Write-Host "运行服务器诊断..." -ForegroundColor Blue
    
    # 检查端口占用情况
    Write-Host "检查端口3000占用情况..." -ForegroundColor Cyan
    $portCheck = netstat -ano | findstr :3000
    if ($portCheck) {
        Write-Host "端口3000被占用:" -ForegroundColor Yellow
        Write-Host $portCheck
        Write-Host "尝试使用端口3001..." -ForegroundColor Yellow
        $env:PORT = "3001"
    }
    
    node test/debug-server.js
    exit $LASTEXITCODE
}

# 执行测试
Write-Host "执行测试..." -ForegroundColor Cyan
Write-Host "日志将保存在: test/logs/ 目录中" -ForegroundColor Gray

$process = Start-Process -FilePath "node" -ArgumentList "test/test-runner.js" -NoNewWindow -Wait -PassThru

if ($process.ExitCode -eq 0) {
    Write-Host "测试完成！" -ForegroundColor Green
} else {
    Write-Host "测试失败！" -ForegroundColor Red
    exit 1
}

Write-Host "测试报告已生成在: test/reports/ 目录中" -ForegroundColor Yellow
Write-Host "结束时间: $(Get-Date)" -ForegroundColor Yellow