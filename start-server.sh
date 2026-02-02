#!/bin/bash
# newtools.cloud 服务器启动脚本

echo "==================================="
echo "  newtools.cloud 服务器启动中..."
echo "==================================="
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "[信息] 首次运行，正在安装依赖..."
    npm install
    echo ""
fi

# 启动服务器
echo "[信息] 正在启动服务器 (端口: 3002)..."
echo ""
node server.js
