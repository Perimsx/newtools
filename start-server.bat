@echo off
REM newtools.cloud 服务器启动脚本

echo ===================================
echo   newtools.cloud 服务器启动中...
echo ===================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查依赖是否安装
if not exist "node_modules\" (
    echo [信息] 首次运行，正在安装依赖...
    call npm install
    echo.
)

REM 启动服务器
echo [信息] 正在启动服务器 (端口: 3002)...
echo.
node server.js

pause
