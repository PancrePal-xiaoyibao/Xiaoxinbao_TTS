@echo off
color 0A
echo.
echo === 小馨宝测试启动器 ===
echo 开始时间: %date% %time%
echo.

REM 检查参数
set "args="
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help

if "%1"=="--clean-only" set "args=%args% --clean-only"
if "%1"=="--test-only" set "args=%args% --test-only"
if "%1"=="--no-deps" set "args=%args% --no-deps"

REM 执行测试
echo 执行测试...
echo 日志将保存在: test/logs/ 目录中
echo.

node test/test-runner.js %args%

if %errorlevel% neq 0 (
    echo.
    echo 测试失败！
    pause
    exit /b 1
)

echo.
echo 测试完成！
echo 测试报告已生成在: test/reports/ 目录中
echo 结束时间: %date% %time%
echo.
pause
exit /b 0

:show_help
echo.
echo 小馨宝测试启动器
echo.
echo 用法:
echo   start-test.bat [选项]
echo.
echo 选项:
echo   --help         显示帮助信息
echo   --clean-only   仅执行清理操作
echo   --test-only    仅执行测试（跳过清理）
echo   --no-deps      跳过依赖检查
echo.
echo 示例:
echo   start-test.bat           完整测试流程
echo   start-test.bat --clean-only
echo   start-test.bat --test-only
echo.
pause