/**
 * Store.js - 状态管理模块
 * 实现发布-订阅模式进行状态管理
 */

((window) => {
    'use strict';

    // 默认数据
    const DEFAULT_DATA = {
        settings: {
            backgroundImage: "",
            searchEngine: "bing",
            collapsedCategories: [], // 存储已折叠的分类
            adminPasswordHash: "", // 管理员密码的SHA-256哈希值
            isInitialSetup: true, // 是否首次设置
            authSessionExpiry: 0 // 会话过期时间戳
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

    // 搜索引擎配置
    const SEARCH_ENGINES = {
        google: { url: "https://www.google.com/search?q=", icon: "fa-brands fa-google", name: "Google" },
        baidu: { url: "https://www.baidu.com/s?wd=", icon: "fa-solid fa-paw", name: "Baidu" },
        bing: { url: "https://www.bing.com/search?q=", icon: "fa-brands fa-microsoft", name: "Bing" }
    };

    // Store 对象
    const Store = {
        state: JSON.parse(JSON.stringify(DEFAULT_DATA)),
        listeners: [],

        /**
         * 获取当前状态
         */
        getState() {
            return this.state;
        },

        /**
         * 更新状态
         * @param {Object} newState - 新的状态对象
         */
        setState(newState) {
            this.state = { ...this.state, ...newState };
            this.save();
            this.notify();
        },

        /**
         * 更新特定工具
         * @param {string} id - 工具ID
         * @param {Object} updates - 更新的属性
         */
        updateTool(id, updates) {
            const idx = this.state.tools.findIndex(t => t.id === id);
            if (idx !== -1) {
                this.state.tools[idx] = { ...this.state.tools[idx], ...updates };
                this.save();
                this.notify();
            }
        },

        /**
         * 添加新工具
         * @param {Object} tool - 工具对象
         */
        addTool(tool) {
            this.state.tools.push(tool);
            if (!this.state.categories.includes(tool.category)) {
                this.state.categories.push(tool.category);
            }
            this.save();
            this.notify();
        },

        /**
         * 删除工具
         * @param {string} id - 工具ID
         */
        deleteTool(id) {
            this.state.tools = this.state.tools.filter(t => t.id !== id);
            this.save();
            this.notify();
        },

        /**
         * 切换工具收藏状态
         * @param {string} id - 工具ID
         */
        toggleFavorite(id) {
            const tool = this.state.tools.find(t => t.id === id);
            if (tool) {
                tool.favorite = !tool.favorite;
                this.save();
                this.notify();
                return tool.favorite;
            }
            return false;
        },

        /**
         * 切换分类折叠状态
         * @param {string} category - 分类名称
         */
        toggleCategoryCollapse(category) {
            const { collapsedCategories } = this.state.settings;
            const idx = collapsedCategories.indexOf(category);

            if (idx === -1) {
                collapsedCategories.push(category);
            } else {
                collapsedCategories.splice(idx, 1);
            }

            this.save();
            this.notify();
        },

        /**
         * 删除分类
         * @param {string} category - 分类名称
         */
        deleteCategory(category) {
            const idx = this.state.categories.indexOf(category);
            if (idx !== -1) {
                this.state.categories.splice(idx, 1);
                this.save();
                this.notify();
                return true;
            }
            return false;
        },

        /**
         * 切换主题
         */
        toggleTheme() {
            this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
            this.save();
            this.notify();
        },

        /**
         * 切换搜索引擎
         */
        cycleSearchEngine() {
            const keys = Object.keys(SEARCH_ENGINES);
            const current = this.state.settings.searchEngine || 'google';
            let idx = keys.indexOf(current);
            idx = (idx + 1) % keys.length;
            this.state.settings.searchEngine = keys[idx];
            this.save();
            this.notify();
            return SEARCH_ENGINES[keys[idx]];
        },

        /**
         * 保存到 localStorage
         */
        save() {
            try {
                localStorage.setItem('myToolsData', JSON.stringify(this.state));
            } catch (e) {
                console.error('Failed to save data:', e);
            }
        },

        /**
         * 从 localStorage 加载
         */
        load() {
            try {
                const stored = localStorage.getItem('myToolsData');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // 合并设置（迁移支持）
                    if (!parsed.settings) parsed.settings = DEFAULT_DATA.settings;
                    if (!parsed.settings.collapsedCategories) {
                        parsed.settings.collapsedCategories = [];
                    }
                    // 为旧数据添加 favorite 字段
                    parsed.tools = parsed.tools.map(t => ({
                        favorite: false,
                        order: 0,
                        ...t
                    }));
                    this.state = parsed;
                }
            } catch (e) {
                console.error('Failed to load data:', e);
                this.state = JSON.parse(JSON.stringify(DEFAULT_DATA));
            }
        },

        /**
         * 导出数据
         */
        exportData() {
            return JSON.stringify(this.state, null, 2);
        },

        /**
         * 导入数据
         * @param {Object} data - 导入的数据对象
         * @returns {boolean} - 是否成功
         */
        importData(data) {
            if (data.tools && data.categories) {
                this.state = data;
                this.save();
                this.notify();
                return true;
            }
            return false;
        },

        /**
         * 重置为默认数据
         */
        reset() {
            this.state = JSON.parse(JSON.stringify(DEFAULT_DATA));
            this.save();
            this.notify();
        },

        /**
         * 订阅状态变化
         * @param {Function} listener - 监听器函数
         * @returns {Function} - 取消订阅函数
         */
        subscribe(listener) {
            this.listeners.push(listener);
            // 返回取消订阅函数
            return () => {
                const idx = this.listeners.indexOf(listener);
                if (idx !== -1) {
                    this.listeners.splice(idx, 1);
                }
            };
        },

        /**
         * 通知所有监听器
         */
        notify() {
            this.listeners.forEach(fn => fn(this.state));
        },

        /**
         * 获取搜索引擎配置
         */
        getSearchEngine() {
            const current = this.state.settings.searchEngine || 'google';
            return SEARCH_ENGINES[current] || SEARCH_ENGINES.google;
        },

        /**
         * 使用 SHA-256 对密码进行哈希
         * @param {string} password - 明文密码
         * @returns {Promise<string>} - 哈希后的密码（十六进制字符串）
         */
        async hashPassword(password) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + 'newtools.cloud_salt');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        },

        /**
         * 验证管理员密码
         * @param {string} password - 明文密码
         * @returns {Promise<boolean>} - 是否验证成功
         */
        async authenticateAdmin(password) {
            const hash = await this.hashPassword(password);
            if (hash === this.state.settings.adminPasswordHash) {
                // 设置30分钟会话
                this.state.settings.authSessionExpiry = Date.now() + (30 * 60 * 1000);
                this.save();
                this.notify();
                return true;
            }
            return false;
        },

        /**
         * 设置初始密码
         * @param {string} password - 明文密码
         * @returns {Promise<boolean>} - 是否设置成功
         */
        async setInitialPassword(password) {
            if (!this.state.settings.isInitialSetup) {
                return false;
            }
            const hash = await this.hashPassword(password);
            this.state.settings.adminPasswordHash = hash;
            this.state.settings.isInitialSetup = false;
            this.state.settings.authSessionExpiry = Date.now() + (30 * 60 * 1000);
            this.save();
            this.notify();
            return true;
        },

        /**
         * 检查管理员权限
         * @returns {boolean} - 是否有有效会话
         */
        checkAdminPermission() {
            const expiry = this.state.settings.authSessionExpiry || 0;
            return Date.now() < expiry;
        },

        /**
         * 清除认证会话
         */
        clearAuthSession() {
            this.state.settings.authSessionExpiry = 0;
            this.save();
            this.notify();
        },

        /**
         * 初始化 Store
         * 检查 localStorage 并更新 isInitialSetup 状态
         */
        async initialize() {
            try {
                const stored = localStorage.getItem('myToolsData');
                let needsSave = false;

                if (stored) {
                    const parsed = JSON.parse(stored);
                    // 如果已存在 adminPasswordHash，则不是首次设置
                    if (parsed.settings && parsed.settings.adminPasswordHash) {
                        this.state.settings.isInitialSetup = false;
                    } else {
                        // 如果不存在密码哈希，设置默认密码
                        const defaultPassword = 'admin';
                        this.state.settings.adminPasswordHash = await this.hashPassword(defaultPassword);
                        this.state.settings.isInitialSetup = false;
                        needsSave = true;
                    }
                } else {
                    // 首次使用，设置默认密码
                    const defaultPassword = 'admin';
                    this.state.settings.adminPasswordHash = await this.hashPassword(defaultPassword);
                    this.state.settings.isInitialSetup = false;
                    needsSave = true;
                }

                if (needsSave) {
                    this.save();
                }
            } catch (e) {
                console.error('Failed to initialize admin password:', e);
            }
        }

    };

    // 导出 Store
    window.Store = Store;

})(window);
