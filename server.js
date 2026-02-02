/**
 * Server.js - newtools.cloud 数据存储服务器
 * 提供基于 Session 验证的数据存储 API
 */

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;
const DATA_FILE = path.join(__dirname, 'data', 'mytools-data.json');

// 中间件配置
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// 静态文件服务
app.use(express.static(__dirname));

// Session 配置
app.use(session({
    secret: 'newtools-cloud-session-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // 如果使用 HTTPS，设置为 true
        httpOnly: true,
        maxAge: 30 * 60 * 1000 // 30分钟
    },
    name: 'newtools.sid'
}));

// 确保数据目录存在
const ensureDataDir = async () => {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
};

// 验证管理员权限的中间件
const authenticateAdmin = async (req, res, next) => {
    const { password } = req.body;

    if (!password) {
        return res.status(401).json({
            success: false,
            error: '需要提供密码'
        });
    }

    // 读取当前数据以获取密码哈希
    try {
        const data = await readDataFile();
        const crypto = require('crypto');

        // 计算密码哈希（与前端保持一致）
        const hash = crypto
            .createHash('sha256')
            .update(password + 'newtools.cloud_salt')
            .digest('hex');

        if (hash === data.settings?.adminPasswordHash) {
            // 设置 session
            req.session.isAdmin = true;
            req.session.authExpiry = Date.now() + (30 * 60 * 1000);
            next();
        } else {
            res.status(401).json({
                success: false,
                error: '密码错误'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '服务器错误'
        });
    }
};

// 验证 Session 的中间件
const requireSession = (req, res, next) => {
    if (req.session.isAdmin && req.session.authExpiry > Date.now()) {
        next();
    } else {
        res.status(401).json({
            success: false,
            error: '未授权或会话已过期'
        });
    }
};

// 读取数据文件
const readDataFile = async () => {
    try {
        const content = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        // 如果文件不存在，返回默认数据
        return {
            settings: {
                backgroundImage: "",
                searchEngine: "bing",
                collapsedCategories: [],
                adminPasswordHash: "",
                isInitialSetup: true,
                authSessionExpiry: 0
            },
            categories: ["常用", "开发", "设计", "学习", "娱乐"],
            tools: [
                { id: "1", title: "GitHub", url: "https://github.com", category: "开发", desc: "代码托管平台", favorite: false, order: 0 },
                { id: "2", title: "ChatGPT", url: "https://chat.openai.com", category: "常用", desc: "AI 助手", favorite: false, order: 1 },
                { id: "3", title: "Bilibili", url: "https://www.bilibili.com", category: "娱乐", desc: "弹幕视频网站", favorite: false, order: 2 },
                { id: "4", title: "Figma", url: "https://www.figma.com", category: "设计", desc: "在线界面设计工具", favorite: false, order: 3 },
                { id: "5", title: "MDN Web Docs", url: "https://developer.mozilla.org", category: "学习", desc: "Web 开发文档", favorite: false, order: 4 }
            ],
            theme: "light"
        };
    }
};

// 写入数据文件
const writeDataFile = async (data) => {
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

// ===== API 路由 =====

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString()
    });
});

// 登录验证（创建 session）
app.post('/api/auth/login', authenticateAdmin, (req, res) => {
    res.json({
        success: true,
        message: '登录成功'
    });
});

// 登出（清除 session）
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({
        success: true,
        message: '已登出'
    });
});

// 检查会话状态
app.get('/api/auth/check', (req, res) => {
    if (req.session.isAdmin && req.session.authExpiry > Date.now()) {
        res.json({
            success: true,
            authenticated: true
        });
    } else {
        res.json({
            success: true,
            authenticated: false
        });
    }
});

// 读取数据（需要 Session）
app.get('/api/data', requireSession, async (req, res) => {
    try {
        const data = await readDataFile();
        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '读取数据失败'
        });
    }
});

// 保存数据（需要 Session）
app.post('/api/data', requireSession, async (req, res) => {
    try {
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                error: '缺少数据'
            });
        }

        await writeDataFile(data);

        res.json({
            success: true,
            message: '数据已保存'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '保存数据失败'
        });
    }
});

// 初始化服务器（设置默认密码）
app.post('/api/init', async (req, res) => {
    try {
        const existingData = await readDataFile();

        // 如果已经设置过密码，拒绝再次初始化
        if (existingData.settings?.adminPasswordHash) {
            return res.status(400).json({
                success: false,
                error: '服务器已经初始化'
            });
        }

        const crypto = require('crypto');
        const defaultPassword = 'admin';
        const hash = crypto
            .createHash('sha256')
            .update(defaultPassword + 'newtools.cloud_salt')
            .digest('hex');

        existingData.settings.adminPasswordHash = hash;
        existingData.settings.isInitialSetup = false;

        await writeDataFile(existingData);

        // 自动登录
        req.session.isAdmin = true;
        req.session.authExpiry = Date.now() + (30 * 60 * 1000);

        res.json({
            success: true,
            message: '服务器已初始化',
            defaultPassword
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '初始化失败'
        });
    }
});

// 备份数据（手动备份到服务器）
app.post('/api/backup', requireSession, async (req, res) => {
    try {
        const data = await readDataFile();
        const backupDir = path.join(__dirname, 'backups');
        await fs.mkdir(backupDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

        await fs.writeFile(backupFile, JSON.stringify(data, null, 2), 'utf-8');

        res.json({
            success: true,
            message: '备份已创建',
            filename: `backup-${timestamp}.json`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '备份失败'
        });
    }
});

// 获取备份列表
app.get('/api/backups', requireSession, async (req, res) => {
    try {
        const backupDir = path.join(__dirname, 'backups');
        let files = [];

        try {
            const fileList = await fs.readdir(backupDir);
            files = await Promise.all(
                fileList
                    .filter(f => f.endsWith('.json'))
                    .map(async (filename) => {
                        const filePath = path.join(backupDir, filename);
                        const stats = await fs.stat(filePath);
                        return {
                            filename,
                            size: stats.size,
                            created: stats.mtime
                        };
                    })
            );
        } catch (error) {
            // 备份目录不存在，返回空列表
        }

        res.json({
            success: true,
            backups: files.sort((a, b) => b.created - a.created)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取备份列表失败'
        });
    }
});

// 启动服务器
const startServer = async () => {
    await ensureDataDir();

    app.listen(PORT, () => {
        console.log('=================================');
        console.log(`🚀 newtools.cloud 服务器已启动`);
        console.log(`📡 端口: ${PORT}`);
        console.log(`📁 数据文件: ${DATA_FILE}`);
        console.log('=================================');
    });
};

startServer();
