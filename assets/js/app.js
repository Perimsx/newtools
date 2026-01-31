/**
 * App.js - 应用程序入口
 * 整合所有模块，初始化应用程序
 */

((window) => {
    'use strict';

    /**
     * 应用程序类
     */
    class MyApp {
        constructor() {
            this.store = null;
            this.renderer = null;
            this.events = null;
            this.unsubscribe = null;
        }

        /**
         * 初始化应用程序
         */
        async init() {
            // 等待 DOM 加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', async () => await this.start());
            } else {
                await this.start();
            }
        }

        /**
         * 启动应用程序
         */
        async start() {
            // 0. 初始化性能监控器（必须在最前面）
            if (window.PerformanceMonitor) {
                window.PerformanceMonitor.init();
            }

            // 1. 初始化 Store（状态管理）
            this.store = window.Store;
            this.store.load();
            await this.store.initialize();

            // 2. 初始化 Renderer（渲染器）
            this.renderer = window.Renderer;
            this.renderer.init();

            // 3. 初始化 Events（事件管理）
            this.events = window.Events;
            this.events.init(this.store);

            // 4. 订阅状态变化
            this.unsubscribe = this.store.subscribe((state) => {
                this.onStateChange(state);
            });

            // 5. 初始渲染
            this.initialRender();
        }

        /**
         * 初始渲染
         */
        initialRender() {
            const state = this.store.getState();

            // 渲染主内容
            this.renderer.render(state);

            // 应用主题
            this.renderer.updateThemeIcon(state.theme);

            // 应用搜索引擎图标
            const engine = this.store.getSearchEngine();
            this.renderer.updateSearchEngineIcon(engine);

            // 应用背景
            this.renderer.applyBackground(state.settings.backgroundImage);

            // 更新事件管理器中的状态引用
            this.events.state = state;
        }

        /**
         * 状态变化处理
         * @param {Object} state - 新的状态
         */
        onStateChange(state) {
            // 更新事件管理器中的状态引用
            this.events.state = state;

            // 重新渲染
            const searchQuery = document.getElementById('searchInput').value;
            this.renderer.render(state, searchQuery);

            // 更新主题图标
            this.renderer.updateThemeIcon(state.theme);

            // 更新搜索引擎图标
            const engine = this.store.getSearchEngine();
            this.renderer.updateSearchEngineIcon(engine);

            // 应用主题到文档
            document.documentElement.setAttribute('data-theme', state.theme);
        }

        /**
         * 销毁应用程序（清理）
         */
        destroy() {
            if (this.unsubscribe) {
                this.unsubscribe();
            }
        }
    }

    // 创建全局应用实例
    window.app = new MyApp();

    // 自动启动应用
    window.app.init();

})(window);
