/**
 * Renderer.js - 渲染模块
 * 负责所有 UI 渲染逻辑，使用 DocumentFragment 优化性能
 */

((window) => {
    'use strict';

    const Renderer = {
        // DOM 元素缓存
        elements: {},

        /**
         * 初始化渲染器
         */
        init() {
            // 缓存 DOM 元素
            this.elements = {
                mainContent: document.getElementById('mainContent'),
                searchSuggestions: document.getElementById('searchSuggestions') || this.createSearchSuggestions()
            };
        },

        /**
         * 创建搜索建议容器
         */
        createSearchSuggestions() {
            const container = document.createElement('div');
            container.className = 'search-suggestions';
            container.id = 'searchSuggestions';
            container.innerHTML = `
                <div class="suggestions-header">搜索建议</div>
                <div class="suggestions-list"></div>
            `;
            document.querySelector('.search-container').appendChild(container);
            return container;
        },

        /**
         * 渲染主内容区域
         * @param {Object} state - 应用状态
         * @param {string} searchQuery - 搜索查询字符串
         */
        render(state, searchQuery = '') {
            const { mainContent } = this.elements;
            if (!mainContent) return;

            // 清空内容
            mainContent.innerHTML = '';

            // 过滤工具
            const filteredTools = this.filterTools(state.tools, searchQuery);

            // 获取所有分类
            const activeCategories = new Set(filteredTools.map(t => t.category));
            const allCategories = [...new Set([...state.categories, ...activeCategories])];

            // 创建 DocumentFragment
            const fragment = document.createDocumentFragment();

            // 如果有搜索查询，不显示分类
            if (searchQuery.trim()) {
                this.renderSearchResults(filteredTools, fragment, searchQuery);
            } else {
                // 渲染快速访问区域（如果有收藏的工具）
                const favorites = state.tools.filter(t => t.favorite);
                if (favorites.length > 0) {
                    this.renderQuickAccessSection(favorites, fragment);
                }

                // 渲染分类
                allCategories.forEach((category, index) => {
                    const catTools = filteredTools.filter(t => t.category === category);
                    if (catTools.length === 0) return;

                    const section = this.createCategorySection(
                        category,
                        catTools,
                        state.settings.collapsedCategories.includes(category),
                        index
                    );
                    fragment.appendChild(section);
                });
            }

            // 一次性插入所有内容
            mainContent.appendChild(fragment);
        },

        /**
         * 过滤工具
         * @param {Array} tools - 工具列表
         * @param {string} query - 搜索查询
         * @returns {Array} - 过滤后的工具列表
         */
        filterTools(tools, query) {
            if (!query.trim()) return tools;

            const lowerQuery = query.toLowerCase();
            return tools.filter(t =>
                t.title.toLowerCase().includes(lowerQuery) ||
                (t.desc && t.desc.toLowerCase().includes(lowerQuery)) ||
                (t.url && t.url.toLowerCase().includes(lowerQuery)) ||
                (t.category && t.category.toLowerCase().includes(lowerQuery))
            );
        },

        /**
         * 渲染搜索结果
         * @param {Array} tools - 工具列表
         * @param {DocumentFragment} fragment - 文档片段
         * @param {string} query - 搜索查询
         */
        renderSearchResults(tools, fragment, query) {
            if (tools.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = '未找到匹配的工具';
                fragment.appendChild(noResults);
                return;
            }

            const section = document.createElement('section');
            section.className = 'category-section';

            const header = document.createElement('div');
            header.className = 'category-header';
            header.innerHTML = `
                <span class="category-title">搜索结果</span>
                <span class="category-badge">${tools.length}</span>
            `;
            section.appendChild(header);

            const grid = this.createToolsGrid(tools, query);
            section.appendChild(grid);

            fragment.appendChild(section);
        },

        /**
         * 渲染快速访问区域
         * @param {Array} favorites - 收藏的工具列表
         * @param {DocumentFragment} fragment - 文档片段
         */
        renderQuickAccessSection(favorites, fragment) {
            const section = document.createElement('section');
            section.className = 'category-section quick-access-section';

            const header = document.createElement('div');
            header.className = 'category-header';
            header.innerHTML = `
                <span class="category-icon">⭐</span>
                <span class="category-title">快速访问</span>
                <span class="category-badge">${favorites.length}</span>
            `;
            section.appendChild(header);

            const grid = this.createToolsGrid(favorites, '');
            section.appendChild(grid);

            fragment.appendChild(section);
        },

        /**
         * 创建分类区块
         * @param {string} category - 分类名称
         * @param {Array} tools - 该分类下的工具列表
         * @param {boolean} collapsed - 是否折叠
         * @param {number} index - 索引（用于动画延迟）
         * @returns {Element} - 分类区块元素
         */
        createCategorySection(category, tools, collapsed, index) {
            const section = document.createElement('section');
            section.className = 'category-section';
            section.style.animationDelay = `${index * 50}ms`;
            section.classList.add('animate-fade-in');

            // 创建分类头部
            const header = document.createElement('div');
            header.className = 'category-header';
            header.setAttribute('data-category', category);

            header.innerHTML = `
                <button class="collapse-btn" data-category="${Utils.escapeHtml(category)}" aria-label="折叠/展开" aria-expanded="${!collapsed}">
                    <svg class="category-arrow ${collapsed ? 'collapsed' : ''}" width="12" height="12" viewBox="0 0 12 12">
                        <path d="M6 9L1 4h10z" fill="currentColor"/>
                    </svg>
                </button>
                <span class="category-title">${Utils.escapeHtml(category)}</span>
                <span class="category-badge">${tools.length}</span>
            `;

            section.appendChild(header);

            // 创建内容区域
            const content = document.createElement('div');
            content.className = `category-content ${collapsed ? 'collapsed' : ''}`;
            content.setAttribute('data-category', category);

            const grid = this.createToolsGrid(tools, '');
            content.appendChild(grid);

            section.appendChild(content);

            return section;
        },

        /**
         * 创建工具网格
         * @param {Array} tools - 工具列表
         * @param {string} highlightQuery - 要高亮的查询字符串
         * @returns {Element} - 网格元素
         */
        createToolsGrid(tools, highlightQuery = '') {
            const grid = document.createElement('div');
            grid.className = 'tools-grid';

            tools.forEach((tool, index) => {
                const card = this.createToolCard(tool, highlightQuery, index);
                grid.appendChild(card);
            });

            return grid;
        },

        /**
         * 创建工具卡片
         * @param {Object} tool - 工具对象
         * @param {string} highlightQuery - 要高亮的查询字符串
         * @param {number} index - 索引（用于动画延迟）
         * @returns {Element} - 工具卡片元素
         */
        createToolCard(tool, highlightQuery = '', index = 0) {
            const card = document.createElement('a');
            card.className = 'tool-card';
            card.href = tool.url;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.style.animationDelay = `${index * 30}ms`;
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `打开 ${tool.title}`);

            // 移动端优化：防止双击缩放，优化触摸响应
            if (Utils.isTouch()) {
                card.style.touchAction = 'manipulation';
                card.style.webkitUserSelect = 'none';
                card.style.webkitTapHighlightColor = 'transparent';
            }

            // 性能优化：添加 will-change 提示浏览器优化
            card.style.willChange = 'transform';

            // 使用 RAF 触发动画
            Utils.raf(() => {
                card.classList.add('animate-fade-in');
            });

            // 图标
            const icon = document.createElement('img');
            icon.src = Utils.getIconUrl(tool.url);
            icon.alt = Utils.escapeHtml(tool.title);
            icon.className = 'tool-icon';
            icon.loading = 'lazy';
            icon.onerror = function () { this.src = 'https://via.placeholder.com/48?text=Icon'; };

            // 内容
            const content = document.createElement('div');
            content.className = 'tool-content';

            const title = document.createElement('div');
            title.className = 'tool-title';
            title.innerHTML = highlightQuery ? Utils.highlightMatch(tool.title, highlightQuery) : Utils.escapeHtml(tool.title);

            const desc = document.createElement('div');
            desc.className = 'tool-desc';
            desc.innerHTML = highlightQuery ? Utils.highlightMatch(tool.desc || '', highlightQuery) : Utils.escapeHtml(tool.desc || '');

            content.appendChild(title);
            content.appendChild(desc);

            // 操作按钮
            const actions = document.createElement('div');
            actions.className = 'card-actions';

            // 收藏按钮
            const starBtn = document.createElement('button');
            starBtn.className = 'action-dot star';
            starBtn.setAttribute('data-id', tool.id);
            starBtn.setAttribute('title', tool.favorite ? '取消收藏' : '收藏');
            starBtn.setAttribute('aria-label', tool.favorite ? '取消收藏' : '收藏');
            starBtn.innerHTML = `<i class="${tool.favorite ? 'fa-solid' : 'fa-regular'} fa-star"></i>`;
            starBtn.style.touchAction = 'manipulation'; // 防止双击延迟
            starBtn.style.willChange = 'transform'; // 性能优化

            actions.appendChild(starBtn);

            // 检查管理员权限
            const hasPermission = Store.checkAdminPermission();

            // 根据权限控制收藏按钮显示/隐藏
            if (!hasPermission) {
                starBtn.style.display = 'none';
                starBtn.classList.add('hidden-by-permission');
            }

            // 编辑和删除按钮（需要权限）
            ['edit', 'delete'].forEach(type => {
                const btn = document.createElement('button');
                btn.className = `action-dot ${type}`;
                btn.setAttribute('data-id', tool.id);
                btn.setAttribute('title', type === 'edit' ? '编辑' : '删除');
                btn.setAttribute('aria-label', type === 'edit' ? '编辑工具' : '删除工具');
                btn.innerHTML = `<i class="fa-solid fa-${type === 'edit' ? 'pen' : 'trash'}"></i>`;
                btn.style.touchAction = 'manipulation'; // 防止双击延迟
                btn.style.willChange = 'transform'; // 性能优化

                // 根据权限控制显示/隐藏
                if (!hasPermission) {
                    btn.style.display = 'none';
                    btn.classList.add('hidden-by-permission');
                }

                actions.appendChild(btn);
            });

            card.appendChild(icon);
            card.appendChild(content);
            card.appendChild(actions);

            return card;
        },

        /**
         * 渲染搜索建议
         * @param {Array} tools - 工具列表
         * @param {string} query - 搜索查询
         * @param {number} selectedIndex - 选中的索引
         */
        renderSearchSuggestions(tools, query, selectedIndex = -1) {
            const { searchSuggestions } = this.elements;
            if (!searchSuggestions) return;

            const listContainer = searchSuggestions.querySelector('.suggestions-list');
            listContainer.innerHTML = '';

            if (!query.trim() || tools.length === 0) {
                searchSuggestions.classList.remove('active');
                return;
            }

            // 移动端优化：根据设备类型调整显示数量
            const maxSuggestions = Utils.isMobile() ? 5 : 8;

            const fragment = document.createDocumentFragment();

            tools.slice(0, maxSuggestions).forEach((tool, index) => {
                const item = document.createElement('div');
                item.className = `suggestion-item ${index === selectedIndex ? 'selected' : ''}`;
                item.setAttribute('data-tool-id', tool.id);
                item.setAttribute('tabindex', '0');
                item.setAttribute('role', 'button');
                item.setAttribute('aria-label', `打开 ${tool.title}`);

                item.innerHTML = `
                    <img src="${Utils.getIconUrl(tool.url)}" class="suggestion-icon" alt="">
                    <span class="suggestion-text">${Utils.highlightMatch(tool.title, query)}</span>
                    <span class="suggestion-category">${Utils.escapeHtml(tool.category)}</span>
                `;

                fragment.appendChild(item);
            });

            listContainer.appendChild(fragment);
            searchSuggestions.classList.add('active');

            // 移动端：确保搜索建议不被虚拟键盘遮挡
            if (Utils.isMobile()) {
                const viewportHeight = Utils.getViewportHeight();
                const searchContainer = document.querySelector('.search-container');
                const containerRect = searchContainer.getBoundingClientRect();

                const maxHeight = viewportHeight - containerRect.bottom - 20;
                searchSuggestions.style.maxHeight = `${Math.min(maxHeight, 300)}px`;
            }
        },

        /**
         * 隐藏搜索建议
         */
        hideSearchSuggestions() {
            const { searchSuggestions } = this.elements;
            if (searchSuggestions) {
                searchSuggestions.classList.remove('active');
            }
        },

        /**
         * 更新主题图标
         * @param {string} theme - 当前主题
         */
        updateThemeIcon(theme) {
            const themeToggle = document.getElementById('themeToggle');
            if (!themeToggle) return;

            const icon = themeToggle.querySelector('i');
            if (theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        },

        /**
         * 更新搜索引擎图标
         * @param {Object} engine - 搜索引擎对象
         */
        updateSearchEngineIcon(engine) {
            const searchEngineBtn = document.getElementById('searchEngine');
            if (!searchEngineBtn) return;

            const iconEl = searchEngineBtn.querySelector('i:first-child');
            iconEl.className = engine.icon;
        },

        /**
         * 应用背景图
         * @param {string} url - 背景图 URL
         */
        applyBackground(url) {
            const customBg = document.getElementById('customBg');
            if (!customBg) return;

            customBg.style.backgroundImage = url ? `url('${url}')` : '';
            customBg.style.opacity = url ? '1' : '0';
        },

        /**
         * 显示密码验证模态框
         */
        showPasswordModal() {
            const modal = document.getElementById('passwordModal');
            if (!modal) return;

            modal.classList.add('active');
            this.setupModalFocus(modal, 'adminPasswordInput');
        },

        /**
         * 显示初始密码设置模态框
         */
        showInitialSetupModal() {
            const modal = document.getElementById('initialSetupModal');
            if (!modal) return;

            modal.classList.add('active');
            this.setupModalFocus(modal, 'initialPasswordInput');
        },

        /**
         * 设置模态框焦点和移动端优化
         * @param {Element} modal - 模态框元素
         * @param {string} inputId - 输入框ID
         */
        setupModalFocus(modal, inputId) {
            // 移动端优化：阻止背景滚动
            if (Utils.isMobile() || Utils.isTouch()) {
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
                this.scrollPosition = window.pageYOffset;
                document.body.style.top = `-${this.scrollPosition}px`;
            }

            // 聚焦输入框
            const passwordInput = document.getElementById(inputId);
            if (passwordInput) {
                if (Utils.isMobile()) {
                    // 延迟聚焦，等待模态框动画完成
                    setTimeout(() => passwordInput.focus(), 400);
                } else {
                    passwordInput.focus();
                }
            }

            // 移动端：确保模态框在视口内
            if (Utils.isMobile()) {
                this.ensureModalInViewport(modal);
                this.setupModalKeyboardHandling(modal);
            }
        },

        /**
         * 隐藏密码验证模态框
         */
        hidePasswordModal() {
            const modal = document.getElementById('passwordModal');
            if (modal) {
                modal.classList.remove('active');

                // 清空密码输入框（正确的ID）
                const passwordInput = document.getElementById('adminPasswordInput');
                if (passwordInput) {
                    passwordInput.value = '';
                }

                // 恢复背景滚动
                if (Utils.isMobile() || Utils.isTouch()) {
                    document.body.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.width = '';
                    document.body.style.top = '';

                    // 恢复滚动位置
                    if (this.scrollPosition !== undefined) {
                        window.scrollTo(0, this.scrollPosition);
                        this.scrollPosition = undefined;
                    }
                }
            }
        },

        /**
         * 显示管理下拉菜单
         * @param {Element} button - 触发按钮
         */
        showAdminMenu(button) {
            // 先隐藏可能存在的其他菜单
            this.hideAdminMenu();

            // 创建或获取菜单
            let menu = document.getElementById('adminMenu');
            if (!menu) {
                menu = document.createElement('div');
                menu.id = 'adminMenu';
                menu.className = 'admin-dropdown-menu';
                menu.innerHTML = `
                    <div class="menu-item" data-action="changePassword">
                        <i class="fa-solid fa-key"></i>
                        <span>修改密码</span>
                    </div>
                    <div class="menu-item" data-action="logout">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span>退出登录</span>
                    </div>
                `;
                document.body.appendChild(menu);
            }

            // 计算菜单位置
            const buttonRect = button.getBoundingClientRect();
            menu.style.top = `${buttonRect.bottom + 8}px`;
            menu.style.left = `${buttonRect.left}px`;

            // 显示菜单
            menu.classList.add('active');

            // 添加动画
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';
            requestAnimationFrame(() => {
                menu.style.transition = 'all 0.2s ease';
                menu.style.opacity = '1';
                menu.style.transform = 'translateY(0)';
            });
        },

        /**
         * 隐藏管理菜单
         */
        hideAdminMenu() {
            const menu = document.getElementById('adminMenu');
            if (menu) {
                menu.classList.remove('active');
                menu.style.opacity = '0';
                menu.style.transform = 'translateY(-10px)';
            }
        },

        /**
         * 更新管理按钮状态
         * @param {boolean} isAuthenticated - 是否已认证
         */
        updateAdminButtonState(isAuthenticated) {
            const adminBtn = document.getElementById('adminBtn');
            if (!adminBtn) return;

            const icon = adminBtn.querySelector('i');
            const titleEl = adminBtn.querySelector('.button-title') || adminBtn;

            // 添加过渡效果
            adminBtn.style.transition = 'all 0.3s ease';

            if (isAuthenticated) {
                // 已认证：显示解锁图标
                icon.classList.remove('fa-lock');
                icon.classList.add('fa-unlock');
                adminBtn.setAttribute('title', '管理（已登录）');
                if (titleEl.classList.contains('button-title')) {
                    titleEl.textContent = '管理';
                }
            } else {
                // 未认证：显示锁定图标
                icon.classList.remove('fa-unlock');
                icon.classList.add('fa-lock');
                adminBtn.setAttribute('title', '管理');
                if (titleEl.classList.contains('button-title')) {
                    titleEl.textContent = '管理';
                }
            }
        },

        /**
         * 检查并显示初始设置
         */
        checkAndShowInitialSetup() {
            if (Store.state.settings && Store.state.settings.isInitialSetup) {
                this.showInitialSetupModal();
                return true;
            }
            return false;
        },

        /**
         * 更新工具卡片的权限状态（通用方法）
         * @param {string} selector - 按钮选择器
         * @param {boolean} hasPermission - 是否有权限
         */
        updateButtonsPermission(selector, hasPermission) {
            const buttons = document.querySelectorAll(selector);
            if (buttons.length === 0) return;

            // 使用 RAF 批量处理 DOM 更新
            const operations = [];

            buttons.forEach(btn => {
                if (hasPermission) {
                    operations.push({
                        element: btn,
                        action: 'style',
                        styles: { display: '', opacity: '0' }
                    });

                    // 延迟显示动画
                    Utils.raf(() => {
                        btn.classList.remove('hidden-by-permission');
                        Utils.raf(() => {
                            btn.style.transition = 'opacity 0.3s ease';
                            btn.style.opacity = '1';
                        });
                    });
                } else {
                    btn.style.transition = 'opacity 0.3s ease';
                    btn.style.opacity = '0';

                    // 延迟隐藏
                    setTimeout(() => {
                        Utils.raf(() => {
                            btn.style.display = 'none';
                            btn.classList.add('hidden-by-permission');
                        });
                    }, 300);
                }
            });

            // 批量执行初始状态设置
            Utils.batchClassOperations(operations);
        },

        /**
         * 更新所有工具卡片的权限状态
         * @param {boolean} hasPermission - 是否有权限
         */
        updateToolCardsPermission(hasPermission) {
            this.updateButtonsPermission('.action-dot.edit', hasPermission);
            this.updateButtonsPermission('.action-dot.delete', hasPermission);
            this.updateButtonsPermission('.action-dot.star', hasPermission);
        },

        /**
         * 更新分类标签删除按钮的权限状态
         * @param {boolean} hasPermission - 是否有权限
         */
        updateCategoryTagsPermission(hasPermission) {
            this.updateButtonsPermission('.delete-tag-btn', hasPermission);
        },

        /**
         * 显示模态框
         * @param {string} modalId - 模态框 ID
         * 优化：移动端虚拟键盘处理和滚动优化
         */
        showModal(modalId) {
            // 特殊处理密码验证模态框
            if (modalId === 'passwordModal') {
                this.showPasswordModal();
                return;
            }

            // 特殊处理初始设置模态框
            if (modalId === 'initialSetupModal') {
                this.showInitialSetupModal();
                return;
            }

            const modal = document.getElementById(modalId);
            if (!modal) return;

            // 使用 RAF 确保 CSS 过渡生效
            Utils.doubleRaf(() => {
                modal.classList.add('active');
            });

            // 移动端优化：阻止背景滚动并保存位置
            if (Utils.isMobile() || Utils.isTouch()) {
                Utils.raf(() => {
                    document.body.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.width = '100%';
                    this.scrollPosition = window.pageYOffset;
                    document.body.style.top = `-${this.scrollPosition}px`;
                });
            }

            // 聚焦第一个输入框 - 移动端延迟聚焦
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                if (Utils.isMobile()) {
                    // 使用 RAF 延迟聚焦，等待模态框动画完成
                    Utils.doubleRaf(() => {
                        setTimeout(() => firstInput.focus(), 400);
                    });
                } else {
                    Utils.raf(() => {
                        firstInput.focus();
                    });
                }
            }

            // 移动端：确保模态框在视口内
            if (Utils.isMobile()) {
                this.ensureModalInViewport(modal);

                // 监听虚拟键盘
                this.setupModalKeyboardHandling(modal);
            }
        },

        /**
         * 设置模态框虚拟键盘处理
         * @param {Element} modal - 模态框元素
         */
        setupModalKeyboardHandling(modal) {
            if (!window.visualViewport) return;

            const modalContent = modal.querySelector('.modal-content');
            if (!modalContent) return;

            // 使用 RAF 节流优化
            const handleResize = Utils.rafThrottle(() => {
                const viewport = window.visualViewport;
                const modalRect = modalContent.getBoundingClientRect();

                // 如果模态框被键盘遮挡，调整位置
                if (modalRect.bottom > viewport.height) {
                    const offset = modalRect.bottom - viewport.height + 20;

                    Utils.raf(() => {
                        modalContent.style.transform = `translateY(-${offset}px)`;
                    });
                }
            });

            // 使用 visualViewport API 监听键盘变化
            window.visualViewport.addEventListener('resize', handleResize);
        },

        /**
         * 确保模态框在视口内
         * @param {Element} modal - 模态框元素
         */
        ensureModalInViewport(modal) {
            const modalContent = modal.querySelector('.modal-content');
            if (!modalContent) return;

            // 检查模态框是否超出视口
            const rect = modalContent.getBoundingClientRect();
            const viewportHeight = Utils.getViewportHeight();

            if (rect.height > viewportHeight - 40) {
                // 模态框太高，启用滚动
                modalContent.style.maxHeight = `${viewportHeight - 40}px`;
                modalContent.style.overflowY = 'auto';
                modalContent.style.overflowX = 'hidden';
            }
        },

        /**
         * 隐藏所有模态框
         * 优化：移动端正确恢复滚动位置
         */
        hideModals() {
            const activeModals = document.querySelectorAll('.modal-overlay.active');

            // 使用 RAF 批量处理 DOM 更新
            Utils.raf(() => {
                activeModals.forEach(modal => {
                    modal.classList.remove('active');

                    // 恢复模态框样式
                    const modalContent = modal.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.style.transform = '';
                        modalContent.style.opacity = '';
                        modalContent.style.maxHeight = '';
                        modalContent.style.overflowY = '';
                    }
                });

                // 移动端：恢复背景滚动
                if (Utils.isMobile() || Utils.isTouch()) {
                    document.body.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.width = '';
                    document.body.style.top = '';

                    // 使用 RAF 恢复滚动位置
                    Utils.raf(() => {
                        if (this.scrollPosition !== undefined) {
                            window.scrollTo(0, this.scrollPosition);
                            this.scrollPosition = undefined;
                        }
                    });
                }
            });
        },

        /**
         * 显示确认对话框 (替代原生 confirm)
         * @param {string} message - 确认信息
         * @returns {Promise<boolean>}
         */
        confirmDialog(message) {
            return new Promise((resolve) => {
                const modal = document.getElementById('confirmModal');
                const msgEl = document.getElementById('confirmMessage');
                const okBtn = document.getElementById('confirmOkBtn');
                const cancelBtn = document.getElementById('confirmCancelBtn');

                if (!modal || !msgEl || !okBtn || !cancelBtn) {
                    // Fallback if modal elements missing
                    resolve(confirm(message));
                    return;
                }

                msgEl.textContent = message;
                modal.classList.add('active');

                const cleanup = () => {
                    modal.classList.remove('active');
                    okBtn.removeEventListener('click', onOk);
                    cancelBtn.removeEventListener('click', onCancel);
                    // 点击遮罩关闭也视为取消
                    modal.removeEventListener('click', onOverlayClick);
                };

                const onOk = () => {
                    cleanup();
                    resolve(true);
                };

                const onCancel = () => {
                    cleanup();
                    resolve(false);
                };

                const onOverlayClick = (e) => {
                    if (e.target === modal) {
                        onCancel();
                    }
                };

                okBtn.addEventListener('click', onOk);
                cancelBtn.addEventListener('click', onCancel);
                modal.addEventListener('click', onOverlayClick);
            });
        }
    };

    // 导出 Renderer
    window.Renderer = Renderer;

})(window);
