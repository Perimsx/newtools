/**
 * Events.js - 事件管理模块
 * 集中管理所有事件处理，使用事件委托优化性能
 */

((window) => {
    'use strict';

    const Events = {
        // 状态引用
        state: null,
        searchDebounced: null,
        searchSuggestionsIndex: -1,

        // 权限验证状态
        authState: {
            isAdmin: false,
            passwordAttempts: 0,
            maxAttempts: 3
        },

        // 会话检查定时器
        authSessionCheckInterval: null,

        // 移动端触摸状态
        touchState: {
            startX: 0,
            startY: 0,
            startTime: 0,
            longPressTimer: null,
            modalSwipeStart: 0
        },

        // 滚动优化状态
        scrollState: {
            lastScrollY: 0,
            rafId: null,
            ticking: false,
            headerThreshold: 50,
            headerResetThreshold: 20
        },

        /**
         * 初始化事件管理器
         * @param {Object} store - Store 对象
         */
        init(store) {
            this.state = store.getState();

            // 创建防抖搜索函数
            this.searchDebounced = Utils.debounce((query) => {
                this.handleSearch(query);
            }, 300);

            // 恢复登录状态（检查会话是否有效）
            this.restoreAuthState();

            // 绑定所有事件
            this.bindGlobalEvents();
            this.bindHeaderEvents();
            this.bindModalEvents();
            this.bindContentEvents();
            this.bindSearchEvents();
            this.bindKeyboardShortcuts();

            // 移动端优化初始化
            this.initMobileOptimizations();

            // 启动会话过期检查定时器（每分钟检查一次）
            this.startAuthSessionCheck();
        },

        /**
         * 绑定全局事件
         */
        bindGlobalEvents() {
            // 主题切换
            document.getElementById('themeToggle').addEventListener('click', () => {
                Store.toggleTheme();
            });

            // 导出数据 - 需要权限检查
            document.getElementById('exportBtn').addEventListener('click', async () => {
                const hasPermission = await this.checkPermission();
                if (!hasPermission) return;

                const data = Store.exportData();
                const filename = `myspace_backup_${Utils.formatDate(new Date())}.json`;
                Utils.downloadFile(data, filename);
                Toast.show('备份已下载', 'success');
            });

            // 导入数据 - 需要权限检查
            document.getElementById('importFile').addEventListener('change', async (e) => {
                const hasPermission = await this.checkPermission();
                if (!hasPermission) {
                    e.target.value = '';
                    return;
                }

                const file = e.target.files[0];
                if (!file) return;

                try {
                    const data = await Utils.readJsonFile(file);
                    if (Store.importData(data)) {
                        Toast.show('数据恢复成功', 'success');
                        Renderer.hideModals();
                    } else {
                        Toast.show('无效的备份文件', 'error');
                    }
                } catch (err) {
                    Toast.show(err.message, 'error');
                }
                // 重置文件输入
                e.target.value = '';
            });

            // 重置数据 - 需要权限检查
            document.getElementById('resetBtn').addEventListener('click', async () => {
                const hasPermission = await this.checkPermission();
                if (!hasPermission) return;

                if (confirm('确定要清空所有数据吗？此操作无法撤销。')) {
                    Store.reset();
                    Renderer.hideModals();
                    Toast.show('数据已重置', 'success');
                }
            });

            // 保存背景 - 需要权限检查
            document.getElementById('saveBgBtn').addEventListener('click', async () => {
                const hasPermission = await this.checkPermission();
                if (!hasPermission) return;

                const url = document.getElementById('bgInput').value.trim();
                Store.setState({
                    settings: { ...this.state.settings, backgroundImage: url }
                });
                Renderer.applyBackground(url);
                Toast.show('背景已更新', 'success');
            });

            // 密码验证相关事件
            const togglePasswordBtn = document.getElementById('togglePasswordBtn');
            const confirmPasswordBtn = document.getElementById('confirmPasswordBtn');
            const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
            const passwordInput = document.getElementById('adminPasswordInput');

            if (togglePasswordBtn && passwordInput) {
                togglePasswordBtn.addEventListener('click', () => {
                    const type = passwordInput.type === 'password' ? 'text' : 'password';
                    passwordInput.type = type;
                    togglePasswordBtn.classList.toggle('fa-eye');
                    togglePasswordBtn.classList.toggle('fa-eye-slash');
                });
            }

            if (confirmPasswordBtn) {
                confirmPasswordBtn.addEventListener('click', () => {
                    this.handlePasswordConfirm();
                });
            }

            if (cancelPasswordBtn) {
                cancelPasswordBtn.addEventListener('click', () => {
                    Renderer.hideModals();
                    this.authState.passwordAttempts = 0; // 重置尝试次数
                });
            }

            // 回车确认密码
            if (passwordInput) {
                passwordInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.handlePasswordConfirm();
                    }
                });
            }

            // 初始密码设置相关事件
            const toggleInitialPasswordBtn = document.getElementById('toggleInitialPasswordBtn');
            const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPasswordBtn');
            const confirmInitialSetupBtn = document.getElementById('confirmInitialSetupBtn');
            const initialPasswordInput = document.getElementById('initialPasswordInput');
            const confirmPasswordSetupInput = document.getElementById('confirmPasswordInput');

            if (toggleInitialPasswordBtn && initialPasswordInput) {
                toggleInitialPasswordBtn.addEventListener('click', () => {
                    const type = initialPasswordInput.type === 'password' ? 'text' : 'password';
                    initialPasswordInput.type = type;
                    toggleInitialPasswordBtn.classList.toggle('fa-eye');
                    toggleInitialPasswordBtn.classList.toggle('fa-eye-slash');
                });
            }

            if (toggleConfirmPasswordBtn && confirmPasswordSetupInput) {
                toggleConfirmPasswordBtn.addEventListener('click', () => {
                    const type = confirmPasswordSetupInput.type === 'password' ? 'text' : 'password';
                    confirmPasswordSetupInput.type = type;
                    toggleConfirmPasswordBtn.classList.toggle('fa-eye');
                    toggleConfirmPasswordBtn.classList.toggle('fa-eye-slash');
                });
            }

            if (confirmInitialSetupBtn) {
                confirmInitialSetupBtn.addEventListener('click', () => {
                    this.confirmInitialPassword();
                });
            }

            // 模态框点击外部关闭 - 优化触摸支持
            document.querySelectorAll('.modal-overlay').forEach(overlay => {
                // 使用 pointerdown 替代 click，响应更快
                overlay.addEventListener('pointerdown', (e) => {
                    if (e.target === overlay) {
                        Renderer.hideModals();
                        this.authState.passwordAttempts = 0; // 重置尝试次数
                    }
                });
            });

            // 滚动监听 (Header 动画) - 使用 RAF 节流优化
            this.initOptimizedScrollHandler();
        },

        /**
         * 初始化优化的滚动处理
         * 使用 RAF 节流，避免在滚动事件中直接操作 DOM
         */
        initOptimizedScrollHandler() {
            const header = document.querySelector('.main-header');
            if (!header) return;

            // 使用 RAF 节流的滚动处理
            const scrollHandler = Utils.rafThrottle(() => {
                this.handleScrollUpdate(header);
            });

            // 使用 passive 监听器提升滚动性能
            window.addEventListener('scroll', scrollHandler, { passive: true });
        },

        /**
         * 处理滚动更新（在 RAF 中调用）
         * @param {Element} header - 头部元素
         */
        handleScrollUpdate(header) {
            const scrollY = window.scrollY;
            const { headerThreshold, headerResetThreshold } = this.scrollState;

            // 只在状态改变时才更新 DOM
            if (scrollY > headerThreshold && !header.classList.contains('scrolled')) {
                // 批量处理 DOM 更新
                Utils.toggleClass(header, 'scrolled', true);
            } else if (scrollY < headerResetThreshold && header.classList.contains('scrolled')) {
                // 批量处理 DOM 更新
                Utils.toggleClass(header, 'scrolled', false);
            }

            this.scrollState.lastScrollY = scrollY;
        },

        /**
         * 绑定头部事件
         */
        bindHeaderEvents() {
            // 管理员按钮
            const adminBtn = document.getElementById('adminBtn');
            const adminMenu = document.getElementById('adminMenu');

            if (adminBtn) {
                adminBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleAdminMenu();
                });
            }

            // 搜索引擎切换
            document.getElementById('searchEngine').addEventListener('click', () => {
                const engine = Store.cycleSearchEngine();
                Toast.show(`搜索引擎切换为: ${engine.name}`, 'success');
            });

            // 执行搜索
            document.getElementById('doSearchBtn').addEventListener('click', () => {
                this.performWebSearch();
            });

            // 管理菜单项事件
            const addToolMenuItem = document.getElementById('addToolMenuItem');
            const settingsMenuItem = document.getElementById('settingsMenuItem');
            const logoutAdminMenuItem = document.getElementById('logoutAdminMenuItem');

            if (addToolMenuItem) {
                addToolMenuItem.addEventListener('click', () => {
                    this.handleAdminMenu(); // 关闭菜单
                    this.openAddModal();
                });
            }

            if (settingsMenuItem) {
                settingsMenuItem.addEventListener('click', () => {
                    this.handleAdminMenu(); // 关闭菜单
                    const bg = this.state.settings.backgroundImage || '';
                    document.getElementById('bgInput').value = bg;
                    Renderer.showModal('settingsModal');
                });
            }

            if (logoutAdminMenuItem) {
                logoutAdminMenuItem.addEventListener('click', () => {
                    this.handleLogoutAdmin();
                });
            }

            // 点击页面其他地方关闭管理菜单
            document.addEventListener('click', (e) => {
                const adminMenu = document.getElementById('adminMenu');
                if (adminMenu && !e.target.closest('#adminBtn') && !e.target.closest('#adminMenu')) {
                    adminMenu.classList.remove('active');
                }
            });
        },

        /**
         * 绑定模态框事件
         */
        bindModalEvents() {
            // 关闭按钮
            document.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', () => Renderer.hideModals());
            });

            // 工具表单提交
            document.getElementById('toolForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleToolSubmit();
            });

            // 自动填充名称 (智能功能)
            const urlInput = document.getElementById('toolUrl');
            const nameInput = document.getElementById('toolName');

            urlInput.addEventListener('blur', () => {
                const url = urlInput.value.trim();
                if (url && !nameInput.value.trim()) {
                    try {
                        const hostname = new URL(url).hostname;
                        const domain = hostname.replace('www.', '').split('.')[0];
                        if (domain) {
                            nameInput.value = domain.charAt(0).toUpperCase() + domain.slice(1);
                        }
                    } catch (e) {
                        // 忽略无效 URL
                    }
                }
            });
        },

        /**
         * 绑定内容区域事件（使用事件委托）
         * 优化：同时支持鼠标和触摸事件，防止双击延迟
         */
        bindContentEvents() {
            const mainContent = document.getElementById('mainContent');

            // 统一处理分类折叠/展开
            const handleCategoryToggle = (header) => {
                const category = header.dataset.category;
                if (category) {
                    Store.toggleCategoryCollapse(category);
                }
            };

            // 分类折叠/展开 (点击整个标题栏均可折叠)
            mainContent.addEventListener('click', (e) => {
                const header = e.target.closest('.category-header');
                if (header) {
                    e.preventDefault();
                    handleCategoryToggle(header);
                    return;
                }

                // 工具卡片操作按钮
                const actionDot = e.target.closest('.action-dot');
                if (actionDot) {
                    e.preventDefault();
                    e.stopPropagation();
                    const id = actionDot.dataset.id;

                    if (actionDot.classList.contains('star')) {
                        this.handleToggleFavorite(id);
                    } else if (actionDot.classList.contains('edit')) {
                        this.handleEditTool(id);
                    } else if (actionDot.classList.contains('delete')) {
                        this.handleDeleteTool(id);
                    }
                }
            });

            // 触摸设备优化：使用 touchend 消除300ms延迟
            if (Utils.isTouch()) {
                let lastTouchTime = 0;
                let lastTouchTarget = null;

                mainContent.addEventListener('touchstart', (e) => {
                    const header = e.target.closest('.category-header');
                    const actionDot = e.target.closest('.action-dot');

                    if (header || actionDot) {
                        lastTouchTime = Date.now();
                        lastTouchTarget = header || actionDot;

                        // 添加视觉反馈
                        const target = header || actionDot;
                        target.classList.add('touch-active');
                    }
                }, { passive: true });

                mainContent.addEventListener('touchend', (e) => {
                    if (!lastTouchTarget) return;

                    const header = e.target.closest('.category-header');
                    const actionDot = e.target.closest('.action-dot');
                    const target = header || actionDot;

                    // 移除视觉反馈
                    if (target) {
                        target.classList.remove('touch-active');
                    }

                    // 确保是同一个元素且快速点击
                    if (target === lastTouchTarget && Date.now() - lastTouchTime < 300) {
                        // 阻止默认行为，防止触发后续click事件导致双击
                        e.preventDefault();

                        if (header) {
                            handleCategoryToggle(header);
                        } else if (actionDot) {
                            e.stopPropagation();
                            const id = actionDot.dataset.id;

                            if (actionDot.classList.contains('star')) {
                                this.handleToggleFavorite(id);
                            } else if (actionDot.classList.contains('edit')) {
                                this.handleEditTool(id);
                            } else if (actionDot.classList.contains('delete')) {
                                this.handleDeleteTool(id);
                            }
                        }
                    }

                    lastTouchTarget = null;
                }, { passive: false });
            }

            // 阻止工具卡片的默认拖拽行为
            mainContent.addEventListener('dragstart', (e) => {
                if (e.target.closest('.tool-card')) {
                    e.preventDefault();
                }
            });
        },

        /**
         * 绑定搜索事件
         * 优化：同时支持鼠标和触摸事件
         */
        bindSearchEvents() {
            const searchInput = document.getElementById('searchInput');

            // 搜索输入 - 防抖处理
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value;
                this.searchDebounced(query);
            });

            // 回车搜索
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // 防止表单提交
                    // 如果搜索建议激活，选择当前项
                    if (document.querySelector('.search-suggestions.active')) {
                        const selected = document.querySelector('.suggestion-item.selected');
                        if (selected) {
                            const id = selected.dataset.toolId;
                            const tool = this.state.tools.find(t => t.id === id);
                            if (tool) {
                                window.open(tool.url, '_blank');
                                Renderer.hideSearchSuggestions();
                            }
                        } else {
                            this.performWebSearch();
                        }
                    } else {
                        this.performWebSearch();
                    }
                }
            });

            // 搜索建议点击 - 统一处理指针事件
            document.addEventListener('click', (e) => {
                const suggestionItem = e.target.closest('.suggestion-item');
                if (suggestionItem) {
                    e.preventDefault();
                    const id = suggestionItem.dataset.toolId;
                    const tool = this.state.tools.find(t => t.id === id);
                    if (tool) {
                        window.open(tool.url, '_blank');
                        Renderer.hideSearchSuggestions();
                    }
                } else if (!e.target.closest('.search-container')) {
                    Renderer.hideSearchSuggestions();
                }
            });

            // 触摸设备优化：防止搜索建议点击延迟
            if (Utils.isTouch()) {
                const suggestionItems = () => document.querySelectorAll('.suggestion-item');

                // 使用 touchend 提前响应
                document.addEventListener('touchend', (e) => {
                    const suggestionItem = e.target.closest('.suggestion-item');
                    if (suggestionItem) {
                        // 阻止默认行为，防止触发后续的 click 事件
                        e.preventDefault();

                        const id = suggestionItem.dataset.toolId;
                        const tool = this.state.tools.find(t => t.id === id);
                        if (tool) {
                            // 添加视觉反馈
                            suggestionItem.classList.add('touch-active');
                            setTimeout(() => {
                                window.open(tool.url, '_blank');
                                Renderer.hideSearchSuggestions();
                            }, 100);
                        }
                    }
                }, { passive: false });
            }
        },

        /**
         * 绑定键盘快捷键
         */
        bindKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Cmd/Ctrl + K - 聚焦搜索
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    document.getElementById('searchInput').focus();
                }

                // Escape - 关闭模态框或搜索建议
                if (e.key === 'Escape') {
                    if (document.querySelector('.modal-overlay.active')) {
                        Renderer.hideModals();
                    }
                    Renderer.hideSearchSuggestions();
                }

                // 搜索建议导航
                if (document.querySelector('.search-suggestions.active')) {
                    const items = document.querySelectorAll('.suggestion-item');
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        this.searchSuggestionsIndex = Math.min(this.searchSuggestionsIndex + 1, items.length - 1);
                        this.updateSearchSuggestionSelection(items);
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        this.searchSuggestionsIndex = Math.max(this.searchSuggestionsIndex - 1, -1);
                        this.updateSearchSuggestionSelection(items);
                    }
                }
            });

            // 工具卡片键盘导航
            document.getElementById('mainContent').addEventListener('keydown', (e) => {
                const card = e.target.closest('.tool-card');
                if (card && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    window.open(card.href, '_blank');
                }
            });
        },

        /**
         * 更新搜索建议选中状态
         * @param {NodeList} items - 建议项列表
         */
        updateSearchSuggestionSelection(items) {
            items.forEach((item, index) => {
                if (index === this.searchSuggestionsIndex) {
                    item.classList.add('selected');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('selected');
                }
            });
        },

        /**
         * 处理搜索
         * @param {string} query - 搜索查询
         */
        handleSearch(query) {
            const filteredTools = Renderer.filterTools(this.state.tools, query);

            // 如果有查询，显示建议
            if (query.trim()) {
                this.searchSuggestionsIndex = -1;
                Renderer.renderSearchSuggestions(filteredTools, query);
            } else {
                Renderer.hideSearchSuggestions();
            }

            // 重新渲染主内容
            Renderer.render(this.state, query);
        },

        /**
         * 执行网络搜索
         */
        performWebSearch() {
            const query = document.getElementById('searchInput').value.trim();
            if (!query) return;

            const engine = Store.getSearchEngine();
            window.open(engine.url + encodeURIComponent(query), '_blank');
        },

        /**
         * 打开添加工具模态框
         */
        openAddModal() {
            document.getElementById('toolForm').reset();
            document.getElementById('toolId').value = '';
            document.getElementById('modal-title').textContent = '添加工具';

            // 渲染分类标签
            this.renderCategoryTags();

            Renderer.showModal('toolModal');
        },

        /**
         * 渲染分类标签
         */
        renderCategoryTags() {
            const container = document.getElementById('categoryTags');
            const input = document.getElementById('toolCategory');
            if (!container || !input) return;

            container.innerHTML = '';
            const categories = this.state.categories;

            // 检查管理员权限
            const hasPermission = Store.checkAdminPermission();

            categories.forEach(cat => {
                const tag = document.createElement('span');
                tag.className = 'tag-chip';

                // 内容
                const textSpan = document.createElement('span');
                textSpan.textContent = Utils.escapeHtml(cat);
                tag.appendChild(textSpan);

                // 删除按钮（需要权限）
                const deleteBtn = document.createElement('i');
                deleteBtn.className = 'fa-solid fa-xmark delete-tag-btn';
                deleteBtn.setAttribute('title', '删除分类');

                // 根据权限控制显示/隐藏
                if (!hasPermission) {
                    deleteBtn.style.display = 'none';
                    deleteBtn.classList.add('hidden-by-permission');
                } else {
                    deleteBtn.style.display = '';
                    deleteBtn.classList.remove('hidden-by-permission');
                }

                tag.appendChild(deleteBtn);

                // 检查当前输入是否匹配
                if (input.value === cat) {
                    tag.classList.add('active');
                }

                // 点击标签填入
                tag.addEventListener('click', (e) => {
                    // 如果点击的是删除按钮，不填入
                    if (e.target.classList.contains('delete-tag-btn')) return;

                    input.value = cat;
                    // 更新选中状态
                    container.querySelectorAll('.tag-chip').forEach(t => t.classList.remove('active'));
                    tag.classList.add('active');
                });

                // 删除逻辑（仅在有权限时）
                if (hasPermission) {
                    deleteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation(); // 阻止冒泡
                        const confirmed = await Renderer.confirmDialog(`确定要删除分类 "${cat}" 吗？此操作不会删除分类下的工具。`);
                        if (confirmed) {
                            Store.deleteCategory(cat);
                            // 手动重新渲染标签
                            this.renderCategoryTags();
                        }
                    });
                }

                container.appendChild(tag);
            });
        },

        /**
         * 处理工具表单提交
         */
        async handleToolSubmit() {
            const id = document.getElementById('toolId').value;
            const name = document.getElementById('toolName').value.trim();
            const url = document.getElementById('toolUrl').value.trim();
            const category = document.getElementById('toolCategory').value.trim() || '未分类';
            const desc = document.getElementById('toolDesc').value.trim();

            // 如果是新增工具（没有 id），需要权限检查
            if (!id) {
                const hasPermission = await this.checkPermission();
                if (!hasPermission) return;
            }

            // 验证
            if (!name) {
                Toast.show('请输入工具名称', 'error');
                return;
            }

            if (!url || !Utils.isValidUrl(url)) {
                Toast.show('请输入有效的 URL', 'error');
                return;
            }

            if (id) {
                // 更新
                Store.updateTool(id, { title: name, url, category, desc });
                Toast.show('工具更新成功', 'success');
            } else {
                // 添加
                const newTool = {
                    id: Utils.generateId(),
                    title: name,
                    url,
                    category,
                    desc,
                    favorite: false,
                    order: this.state.tools.length
                };
                Store.addTool(newTool);
                Toast.show('新工具添加成功', 'success');
            }

            Renderer.hideModals();
        },

        /**
         * 处理编辑工具
         * @param {string} id - 工具 ID
         */
        async handleEditTool(id) {
            // 权限检查
            const hasPermission = await this.checkPermission();
            if (!hasPermission) return;

            const tool = this.state.tools.find(t => t.id === id);
            if (!tool) return;

            document.getElementById('toolId').value = tool.id;
            document.getElementById('toolName').value = tool.title;
            document.getElementById('toolUrl').value = tool.url;
            document.getElementById('toolCategory').value = tool.category;
            document.getElementById('toolDesc').value = tool.desc || '';

            document.getElementById('modal-title').textContent = '编辑工具';

            // 渲染分类标签并高亮当前分类
            this.renderCategoryTags();

            Renderer.showModal('toolModal');
        },

        /**
         * 处理删除工具
         * @param {string} id - 工具 ID
         */
        async handleDeleteTool(id) {
            // 权限检查
            const hasPermission = await this.checkPermission();
            if (!hasPermission) return;

            const confirmed = await Renderer.confirmDialog('确定要删除这个工具/站点吗？');
            if (confirmed) {
                Store.deleteTool(id);
                Toast.show('已删除工具', 'success');
            }
        },

        /**
         * 处理切换收藏
         * @param {string} id - 工具 ID
         */
        handleToggleFavorite(id) {
            // 检查管理员权限
            if (!Store.checkAdminPermission()) {
                Toast.show('请先登录以使用收藏功能', 'error');
                return;
            }

            const isFavorite = Store.toggleFavorite(id);

            // 使用 RAF 优化星标动画
            const card = document.querySelector(`.action-dot.star[data-id="${id}"]`);
            if (card) {
                Utils.doubleRaf(() => {
                    card.classList.add('toggling');
                    // 使用 RAF 确保动画完成后移除类
                    Utils.raf(() => {
                        setTimeout(() => {
                            Utils.raf(() => {
                                card.classList.remove('toggling');
                            });
                        }, 300);
                    });
                });
            }

            Toast.show(isFavorite ? '已添加到收藏' : '已取消收藏', 'success');
        },

        /**
         * 初始化移动端优化
         */
        initMobileOptimizations() {
            if (!Utils.isTouch()) return;

            // 防止双击缩放延迟 - 只阻止多指触摸
            document.addEventListener('touchstart', function(event) {
                if (event.touches.length > 1) {
                    event.preventDefault();
                }
            }, { passive: false });

            // 为所有交互元素添加触摸动作优化
            this.addTouchActionOptimizations();

            // 添加移动端触摸反馈
            this.addTouchFeedback();

            // 移动端搜索框优化
            this.initMobileSearchOptimization();

            // 添加长按支持
            this.initLongPressSupport();

            // 模态框手势关闭
            this.initModalSwipeToClose();

            // 分类滑动手势
            this.initCategorySwipeGestures();

            // 优化移动端滚动性能
            this.initMobileScrollOptimization();

            // 处理虚拟键盘视口变化
            this.initVisualViewportAPI();
        },

        /**
         * 添加触摸反馈（涟漪效果）
         * 优化：同时支持鼠标和触摸事件
         */
        addTouchFeedback() {
            // 为所有按钮和卡片添加触摸反馈
            const handleInteraction = (e) => {
                const target = e.target.closest('button, .tool-card, .action-dot, .category-header');
                if (target && !target.disabled) {
                    // 添加视觉反馈类
                    target.classList.add('touch-active');

                    // 创建涟漪效果
                    Utils.createRipple(e, target);

                    // 移除反馈类
                    setTimeout(() => {
                        target.classList.remove('touch-active');
                    }, 200);
                }
            };

            // 触摸事件
            document.addEventListener('touchstart', handleInteraction, { passive: true });

            // 鼠标事件（桌面端）
            if (!Utils.isTouch()) {
                document.addEventListener('mousedown', handleInteraction);
            }
        },

        /**
         * 添加触摸动作优化
         * 防止双击缩放延迟，同时保留原生滚动体验
         */
        addTouchActionOptimizations() {
            // 为交互元素设置 touch-action
            const interactiveElements = document.querySelectorAll(
                'button, .tool-card, .action-dot, input, .category-header, .suggestion-item'
            );

            interactiveElements.forEach(el => {
                el.style.touchAction = 'manipulation';
            });
        },

        /**
         * 优化移动端滚动性能
         * 使用 passive 事件监听器和硬件加速
         */
        initMobileScrollOptimization() {
            const mainContent = document.getElementById('mainContent');
            if (!mainContent) return;

            // 启用硬件加速
            mainContent.style.transform = 'translateZ(0)';
            mainContent.style.willChange = 'transform';

            // 注意：滚动处理已在 initOptimizedScrollHandler 中统一处理
            // 这里只做硬件加速优化，避免重复绑定
        },

        /**
         * 使用 VisualViewport API 处理虚拟键盘
         * 更精确地处理移动端键盘弹出/收起
         */
        initVisualViewportAPI() {
            if (!window.visualViewport) return;

            const searchInput = document.getElementById('searchInput');
            const searchSuggestions = document.getElementById('searchSuggestions');

            // 使用 RAF 节流优化
            const handleResize = Utils.rafThrottle(() => {
                const viewport = window.visualViewport;
                const heightDiff = window.innerHeight - viewport.height;

                // 虚拟键盘弹出
                if (heightDiff > 150) {
                    Utils.batchDomUpdates({
                        read: () => {
                            const inputRect = searchInput.getBoundingClientRect();
                            return {
                                inputRect,
                                availableHeight: viewport.height - inputRect.bottom - 20
                            };
                        },
                        write: (data) => {
                            if (searchSuggestions && searchSuggestions.classList.contains('active')) {
                                searchSuggestions.style.maxHeight = `${Math.min(data.availableHeight, 300)}px`;
                                searchSuggestions.style.top = `${data.inputRect.bottom + viewport.pageTop}px`;
                            }

                            // 确保输入框可见
                            if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                                const activeRect = document.activeElement.getBoundingClientRect();
                                if (activeRect.top < 0 || activeRect.bottom > viewport.height) {
                                    document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }
                        }
                    });
                }
            });

            window.visualViewport.addEventListener('resize', handleResize);

            // 处理视口位置变化（键盘弹出时页面滚动）
            const handleScroll = Utils.rafThrottle(() => {
                // 批量更新固定定位元素的位置
                Utils.batchDomUpdates({
                    read: () => {
                        const viewport = window.visualViewport;
                        return {
                            scale: viewport.scale,
                            pageTop: viewport.pageTop
                        };
                    },
                    write: (data) => {
                        const modals = document.querySelectorAll('.modal-content.active');
                        modals.forEach(modal => {
                            modal.style.transform = `translateY(${data.pageTop}px) scale(${data.scale})`;
                        });
                    }
                });
            });

            window.visualViewport.addEventListener('scroll', handleScroll);
        },

        /**
         * 移动端搜索优化
         * 处理虚拟键盘弹出时的布局问题
         */
        initMobileSearchOptimization() {
            const searchInput = document.getElementById('searchInput');
            if (!searchInput) return;

            // 优化触摸响应 - 添加 touch-action
            searchInput.style.touchAction = 'manipulation';

            // 监听虚拟键盘弹出 - 使用 RAF 优化
            searchInput.addEventListener('focus', () => {
                if (Utils.isMobile()) {
                    Utils.raf(() => {
                        // 延迟执行，等待键盘完全弹出
                        setTimeout(() => {
                            Utils.raf(() => {
                                // 滚动到搜索框可见
                                const searchContainer = searchInput.closest('.search-container');
                                if (searchContainer) {
                                    Utils.scrollToElement(searchContainer, 20);
                                }

                                // 确保搜索建议有足够空间
                                const suggestions = document.getElementById('searchSuggestions');
                                if (suggestions) {
                                    const viewportHeight = Utils.getViewportHeight();
                                    const containerRect = searchContainer.getBoundingClientRect();
                                    const maxHeight = viewportHeight - containerRect.bottom - 20;

                                    // 使用 RAF 确保样式更新
                                    Utils.raf(() => {
                                        suggestions.style.maxHeight = `${Math.min(maxHeight, 300)}px`;
                                    });
                                }
                            });
                        }, 300);
                    });
                }
            });

            // 键盘收起时恢复 - 使用 RAF 优化
            searchInput.addEventListener('blur', () => {
                const suggestions = document.getElementById('searchSuggestions');
                if (suggestions) {
                    // 延迟隐藏，允许点击建议项
                    Utils.raf(() => {
                        setTimeout(() => {
                            Utils.raf(() => {
                                if (!suggestions.matches(':hover')) {
                                    Renderer.hideSearchSuggestions();
                                }
                            });
                        }, 200);
                    });
                }
            });

            // 阻止搜索框的双击缩放
            searchInput.addEventListener('touchstart', (e) => {
                // 记录触摸时间
                searchInput._lastTouchStart = Date.now();
            }, { passive: true });

            searchInput.addEventListener('touchend', (e) => {
                const now = Date.now();
                const lastTouch = searchInput._lastTouchStart || 0;

                // 如果是快速双击，阻止默认行为（防止缩放）
                if (now - lastTouch < 300) {
                    e.preventDefault();
                }
            });

            // 监听视口高度变化（虚拟键盘弹出/收起）- 使用节流优化
            let initialHeight = window.innerHeight;
            window.addEventListener('resize', Utils.throttle(() => {
                const currentHeight = window.innerHeight;
                const heightDiff = initialHeight - currentHeight;

                // 如果高度差大于150px，认为是虚拟键盘弹出
                if (heightDiff > 150 && document.activeElement === searchInput) {
                    // 虚拟键盘弹出，确保搜索建议不被遮挡
                    const suggestions = document.getElementById('searchSuggestions');
                    if (suggestions && suggestions.classList.contains('active')) {
                        Utils.raf(() => {
                            suggestions.style.maxHeight = `${currentHeight - 200}px`;
                        });
                    }
                }

                initialHeight = currentHeight;
            }, 100));
        },

        /**
         * 初始化长按支持
         * 用于工具卡片显示更多选项
         */
        initLongPressSupport() {
            const mainContent = document.getElementById('mainContent');
            if (!mainContent) return;

            let longPressTimer;
            let touchStartTime = 0;
            let touchStartPosition = { x: 0, y: 0 };

            mainContent.addEventListener('touchstart', (e) => {
                const card = e.target.closest('.tool-card');
                if (!card) return;

                // 记录触摸开始状态
                touchStartTime = Date.now();
                touchStartPosition = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };

                // 设置长按定时器（500ms）
                longPressTimer = setTimeout(() => {
                    // 检查是否移动了太多（超过10px取消长按）
                    const currentTouch = e.changedTouches[0] || e.touches[0];
                    const moveX = Math.abs(currentTouch.clientX - touchStartPosition.x);
                    const moveY = Math.abs(currentTouch.clientY - touchStartPosition.y);

                    if (moveX < 10 && moveY < 10) {
                        // 触发长按振动反馈
                        if (navigator.vibrate) {
                            navigator.vibrate(50);
                        }

                        // 显示操作菜单
                        const actions = card.querySelector('.card-actions');
                        if (actions) {
                            // 检查是否有权限
                            const hasPermission = Store.checkAdminPermission();
                            if (hasPermission) {
                                actions.classList.add('visible');
                                // 添加高亮效果
                                card.classList.add('long-pressed');

                                // 3秒后自动隐藏
                                setTimeout(() => {
                                    actions.classList.remove('visible');
                                    card.classList.remove('long-pressed');
                                }, 3000);
                            }
                        }
                    }
                }, 500);
            }, { passive: true });

            mainContent.addEventListener('touchend', (e) => {
                clearTimeout(longPressTimer);

                // 检查是否是短按（单击）
                const touchDuration = Date.now() - touchStartTime;
                if (touchDuration < 300) {
                    const currentTouch = e.changedTouches[0];
                    const moveX = Math.abs(currentTouch.clientX - touchStartPosition.x);
                    const moveY = Math.abs(currentTouch.clientY - touchStartPosition.y);

                    // 如果移动小于5px，认为是有效点击
                    if (moveX < 5 && moveY < 5) {
                        const card = e.target.closest('.tool-card');
                        if (card && !e.target.closest('.action-dot')) {
                            // 允许默认链接行为
                            return;
                        }
                    }
                }
            });

            mainContent.addEventListener('touchmove', () => {
                clearTimeout(longPressTimer);
            }, { passive: true });
        },

        /**
         * 初始化模态框滑动手势关闭
         */
        initModalSwipeToClose() {
            const modals = document.querySelectorAll('.modal-content');
            if (modals.length === 0) return;

            modals.forEach(modal => {
                let startY = 0;
                let currentY = 0;
                let isDragging = false;
                let startTime = 0;
                let rafId = null;

                // 优化触摸响应
                modal.style.touchAction = 'pan-y'; // 允许垂直滑动

                modal.addEventListener('touchstart', (e) => {
                    // 只在模态框顶部区域响应（向下拉动关闭）
                    const rect = modal.getBoundingClientRect();
                    const touchY = e.touches[0].clientY - rect.top;

                    // 响应顶部100px区域
                    if (touchY < 100) {
                        startY = e.touches[0].clientY;
                        startTime = Date.now();
                        isDragging = true;
                        modal.style.transition = 'none';
                    }
                }, { passive: true });

                modal.addEventListener('touchmove', (e) => {
                    if (!isDragging) return;

                    currentY = e.touches[0].clientY;
                    const diff = currentY - startY;

                    // 只允许向下拖动
                    if (diff > 0) {
                        // 使用 RAF 节流样式更新
                        if (rafId === null) {
                            rafId = window.requestAnimationFrame(() => {
                                // 使用阻尼效果
                                const dampened = diff * 0.5;
                                modal.style.transform = `translateY(${dampened}px)`;
                                modal.style.opacity = 1 - (diff / 400);
                                rafId = null;
                            });
                        }
                    }
                }, { passive: true });

                modal.addEventListener('touchend', (e) => {
                    if (!isDragging) return;

                    // 取消未完成的 RAF
                    if (rafId !== null) {
                        window.cancelAnimationFrame(rafId);
                        rafId = null;
                    }

                    const diff = currentY - startY;
                    const duration = Date.now() - startTime;
                    const velocity = diff / duration;

                    modal.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';

                    // 拖动超过150px 或快速向下滑动，关闭模态框
                    if (diff > 150 || velocity > 0.5) {
                        modal.style.transform = 'translateY(100%)';
                        modal.style.opacity = '0';
                        setTimeout(() => {
                            Renderer.hideModals();
                            modal.style.transform = '';
                            modal.style.opacity = '';
                        }, 300);
                    } else {
                        // 回弹
                        modal.style.transform = '';
                        modal.style.opacity = '';
                    }

                    isDragging = false;
                }, { passive: true });

                // 鼠标事件支持（桌面端测试用）
                if (!Utils.isTouch()) {
                    let isMouseDown = false;
                    modal.addEventListener('mousedown', (e) => {
                        const rect = modal.getBoundingClientRect();
                        if (e.clientY - rect.top < 100) {
                            startY = e.clientY;
                            startTime = Date.now();
                            isDragging = true;
                            isMouseDown = true;
                            modal.style.transition = 'none';
                        }
                    });

                    window.addEventListener('mousemove', (e) => {
                        if (!isMouseDown || !isDragging) return;
                        currentY = e.clientY;
                        const diff = currentY - startY;
                        if (diff > 0) {
                            if (rafId === null) {
                                rafId = window.requestAnimationFrame(() => {
                                    modal.style.transform = `translateY(${diff * 0.5}px)`;
                                    modal.style.opacity = 1 - (diff / 400);
                                    rafId = null;
                                });
                            }
                        }
                    });

                    window.addEventListener('mouseup', () => {
                        if (!isMouseDown || !isDragging) return;
                        isMouseDown = false;

                        // 取消未完成的 RAF
                        if (rafId !== null) {
                            window.cancelAnimationFrame(rafId);
                            rafId = null;
                        }

                        const diff = currentY - startY;
                        const duration = Date.now() - startTime;
                        const velocity = diff / duration;

                        modal.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';

                        if (diff > 150 || velocity > 0.5) {
                            modal.style.transform = 'translateY(100%)';
                            modal.style.opacity = '0';
                            setTimeout(() => {
                                Renderer.hideModals();
                                modal.style.transform = '';
                                modal.style.opacity = '';
                            }, 300);
                        } else {
                            modal.style.transform = '';
                            modal.style.opacity = '';
                        }
                        isDragging = false;
                    });
                }
            });
        },

        /**
         * 初始化分类滑动手势
         * 支持左右滑动切换分类
         */
        initCategorySwipeGestures() {
            const mainContent = document.getElementById('mainContent');
            if (!mainContent) return;

            let startX = 0;
            let startTime = 0;
            let currentSection = null;

            mainContent.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startTime = Date.now();
                currentSection = e.target.closest('.category-section');
            }, { passive: true });

            mainContent.addEventListener('touchend', (e) => {
                if (!currentSection) return;

                const endX = e.changedTouches[0].clientX;
                const endTime = Date.now();
                const diff = endX - startX;
                const duration = endTime - startTime;

                // 判断是否为有效滑动：快速滑动（<300ms）且距离>100px
                // 或者慢速滑动但距离>150px
                const isValidSwipe = (duration < 300 && Math.abs(diff) > 100) ||
                                   (Math.abs(diff) > 150);

                if (isValidSwipe) {
                    if (diff > 0) {
                        // 向右滑动 - 下一个分类
                        this.navigateToAdjacentCategory(currentSection, 'next');
                    } else {
                        // 向左滑动 - 上一个分类
                        this.navigateToAdjacentCategory(currentSection, 'prev');
                    }
                }
            }, { passive: true });
        },

        /**
         * 导航到相邻分类
         * @param {Element} currentSection - 当前分类区块
         * @param {string} direction - 'next' 或 'prev'
         */
        navigateToAdjacentCategory(currentSection, direction) {
            const allSections = Array.from(document.querySelectorAll('.category-section'));
            const currentIndex = allSections.indexOf(currentSection);

            if (currentIndex === -1) return;

            let targetIndex;
            if (direction === 'next') {
                targetIndex = (currentIndex + 1) % allSections.length;
            } else {
                targetIndex = currentIndex === 0 ? allSections.length - 1 : currentIndex - 1;
            }

            const targetSection = allSections[targetIndex];
            if (targetSection) {
                // 平滑滚动到目标分类
                Utils.scrollToElement(targetSection, 60);

                // 添加高亮提示
                targetSection.classList.add('highlighted');
                setTimeout(() => {
                    targetSection.classList.remove('highlighted');
                }, 1000);

                // 显示提示
                const categoryName = targetSection.querySelector('.category-title').textContent;
                Toast.show(`切换到: ${categoryName}`, 'success');
            }
        },

        /**
         * 检查权限
         * @returns {Promise<boolean>} 是否有权限
         */
        async checkPermission() {
            // 如果已经登录，再次验证会话是否仍然有效
            if (this.authState.isAdmin) {
                const hasPermission = Store.checkAdminPermission();
                if (!hasPermission) {
                    // 会话已过期，清除登录状态
                    this.authState.isAdmin = false;
                    this.updateAdminUI(false);
                    Renderer.updateToolCardsPermission(false);
                    Renderer.updateCategoryTagsPermission(false);
                } else {
                    return true;
                }
            }

            // 检查是否有有效会话（可能之前登录过但状态未同步）
            const hasPermission = Store.checkAdminPermission();
            if (hasPermission) {
                this.authState.isAdmin = true;
                this.updateAdminUI(true);
                Renderer.updateToolCardsPermission(true);
                Renderer.updateCategoryTagsPermission(true);
                return true;
            }

            // 检查是否设置了密码
            const storedPasswordHash = Store.state.settings.adminPasswordHash;
            if (!storedPasswordHash) {
                // 未设置密码，引导用户设置
                await this.setupInitialPassword();
                return this.authState.isAdmin;
            }

            // 已设置密码，提示用户输入
            return await this.promptPassword();
        },

        /**
         * 显示密码验证模态框并处理验证逻辑
         * @returns {Promise<boolean>} 验证是否成功
         */
        async promptPassword() {
            return new Promise((resolve) => {
                // 显示密码验证模态框
                Renderer.showModal('passwordModal');

                // 清空输入框
                const passwordInput = document.getElementById('adminPasswordInput');
                const passwordError = document.getElementById('passwordError');

                if (passwordInput) {
                    passwordInput.value = '';
                    passwordInput.focus();
                }
                if (passwordError) {
                    passwordError.style.display = 'none';
                }

                // 定义验证处理函数
                const handleConfirm = async () => {
                    const inputPassword = passwordInput ? passwordInput.value : '';
                    const passwordError = document.getElementById('passwordError');

                    if (!inputPassword) {
                        if (passwordError) {
                            passwordError.textContent = '请输入密码';
                            passwordError.style.display = 'block';
                        }
                        return;
                    }

                    // 使用 Store 的验证方法
                    const isValid = await Store.authenticateAdmin(inputPassword);

                    if (isValid) {
                        // 密码正确
                        this.authState.isAdmin = true;
                        this.authState.passwordAttempts = 0;
                        Renderer.hideModals();
                        this.updateAdminUI(true);

                        // 更新工具卡片的权限状态
                        Renderer.updateToolCardsPermission(true);

                        // 更新分类标签的权限状态
                        Renderer.updateCategoryTagsPermission(true);

                        // 自动显示管理菜单
                        const adminMenu = document.getElementById('adminMenu');
                        if (adminMenu) {
                            adminMenu.classList.add('active');
                        }

                        Toast.show('验证成功', 'success');
                        if (passwordError) passwordError.style.display = 'none';
                        resolve(true);
                    } else {
                        // 密码错误
                        this.authState.passwordAttempts++;
                        const remainingAttempts = this.authState.maxAttempts - this.authState.passwordAttempts;

                        if (remainingAttempts <= 0) {
                            // 达到最大尝试次数
                            Renderer.hideModals();
                            Toast.show('密码错误次数过多，请稍后再试', 'error');
                            this.authState.passwordAttempts = 0;
                            if (passwordError) passwordError.style.display = 'none';
                            resolve(false);
                        } else {
                            if (passwordError) {
                                passwordError.textContent = `密码错误，还剩 ${remainingAttempts} 次尝试机会`;
                                passwordError.style.display = 'block';
                            }
                            Toast.show(`密码错误，还剩 ${remainingAttempts} 次尝试机会`, 'error');
                            if (passwordInput) {
                                passwordInput.value = '';
                                passwordInput.focus();
                            }
                        }
                    }
                };

                // 临时存储处理函数，以便在 handlePasswordConfirm 中调用
                this._currentPasswordResolve = { resolve, handleConfirm };
            });
        },

        /**
         * 处理密码确认
         */
        async handlePasswordConfirm() {
            if (this._currentPasswordResolve) {
                await this._currentPasswordResolve.handleConfirm();
            }
        },

        /**
         * 处理初始密码设置流程
         * @returns {Promise<boolean>} 设置是否成功
         */
        async setupInitialPassword() {
            return new Promise((resolve) => {
                // 显示初始密码设置模态框
                Renderer.showModal('initialSetupModal');

                // 清空输入框
                const initialPasswordInput = document.getElementById('initialPasswordInput');
                const confirmPasswordSetupInput = document.getElementById('confirmPasswordInput');
                const initialSetupError = document.getElementById('initialSetupError');

                if (initialPasswordInput) initialPasswordInput.value = '';
                if (confirmPasswordSetupInput) confirmPasswordSetupInput.value = '';
                if (initialSetupError) initialSetupError.style.display = 'none';
                if (initialPasswordInput) initialPasswordInput.focus();

                // 定义设置处理函数
                const handleSetup = async () => {
                    const password = initialPasswordInput ? initialPasswordInput.value : '';
                    const confirmPassword = confirmPasswordSetupInput ? confirmPasswordSetupInput.value : '';

                    // 验证密码
                    if (!password || password.length < 4) {
                        if (initialSetupError) {
                            initialSetupError.textContent = '密码长度至少为4位';
                            initialSetupError.style.display = 'block';
                        }
                        Toast.show('密码长度至少为4位', 'error');
                        return;
                    }

                    if (password !== confirmPassword) {
                        if (initialSetupError) {
                            initialSetupError.textContent = '两次输入的密码不一致';
                            initialSetupError.style.display = 'block';
                        }
                        Toast.show('两次输入的密码不一致', 'error');
                        return;
                    }

                    // 保存密码（使用 Store 方法）
                    const success = await Store.setInitialPassword(password);
                    if (success) {
                        this.authState.isAdmin = true;
                        Renderer.hideModals();
                        Toast.show('密码设置成功', 'success');
                        this.updateAdminUI(true);

                        // 自动显示管理菜单
                        const adminMenu = document.getElementById('adminMenu');
                        if (adminMenu) {
                            adminMenu.classList.add('active');
                        }

                        resolve(true);
                    } else {
                        if (initialSetupError) {
                            initialSetupError.textContent = '密码设置失败，请稍后重试';
                            initialSetupError.style.display = 'block';
                        }
                        Toast.show('密码设置失败', 'error');
                    }
                };

                // 临时存储处理函数
                this._currentInitialPasswordResolve = { resolve, handleSetup };
            });
        },

        /**
         * 确认初始密码设置
         */
        confirmInitialPassword() {
            if (this._currentInitialPasswordResolve) {
                this._currentInitialPasswordResolve.handleSetup();
            }
        },

        /**
         * 显示/隐藏管理菜单
         */
        async handleAdminMenu() {
            // 如果未登录，显示密码验证框
            if (!this.authState.isAdmin) {
                await this.promptPassword();
                return;
            }

            // 已登录，切换管理菜单显示状态
            const adminMenu = document.getElementById('adminMenu');
            if (adminMenu) {
                adminMenu.classList.toggle('active');
            }
        },

        /**
         * 退出管理模式
         */
        handleLogoutAdmin() {
            this.authState.isAdmin = false;
            Store.clearAuthSession();
            this.updateAdminUI(false);

            // 更新工具卡片的权限状态
            Renderer.updateToolCardsPermission(false);

            // 更新分类标签的权限状态
            Renderer.updateCategoryTagsPermission(false);

            Toast.show('已退出管理模式', 'success');

            // 关闭菜单
            const adminMenu = document.getElementById('adminMenu');
            if (adminMenu) {
                adminMenu.classList.remove('active');
            }
        },

        /**
         * 恢复认证状态（页面加载时调用）
         */
        restoreAuthState() {
            const hasPermission = Store.checkAdminPermission();
            if (hasPermission) {
                this.authState.isAdmin = true;
                this.updateAdminUI(true);

                // 更新工具卡片的权限状态
                Renderer.updateToolCardsPermission(true);

                // 更新分类标签的权限状态
                Renderer.updateCategoryTagsPermission(true);
            } else {
                this.authState.isAdmin = false;
                this.updateAdminUI(false);
            }
        },

        /**
         * 启动会话过期检查定时器
         */
        startAuthSessionCheck() {
            // 清除之前的定时器（如果存在）
            if (this.authSessionCheckInterval) {
                clearInterval(this.authSessionCheckInterval);
            }

            // 每分钟检查一次会话是否过期
            this.authSessionCheckInterval = setInterval(() => {
                if (this.authState.isAdmin) {
                    const hasPermission = Store.checkAdminPermission();
                    if (!hasPermission) {
                        // 会话已过期，自动登出
                        this.authState.isAdmin = false;
                        this.updateAdminUI(false);

                        // 更新工具卡片的权限状态
                        Renderer.updateToolCardsPermission(false);

                        // 更新分类标签的权限状态
                        Renderer.updateCategoryTagsPermission(false);

                        // 关闭管理菜单
                        const adminMenu = document.getElementById('adminMenu');
                        if (adminMenu) {
                            adminMenu.classList.remove('active');
                        }

                        Toast.show('会话已过期，请重新登录', 'error');
                    }
                }
            }, 60 * 1000); // 每分钟检查一次
        },

        /**
         * 更新管理员 UI 状态
         * @param {boolean} isAdmin - 是否为管理员
         */
        updateAdminUI(isAdmin) {
            const adminBtn = document.getElementById('adminBtn');
            const adminIcon = document.getElementById('adminIcon');

            if (adminBtn) {
                if (isAdmin) {
                    adminBtn.classList.add('admin-active');
                    adminBtn.title = '管理菜单（已登录）';
                    // 更新图标为解锁状态
                    if (adminIcon) {
                        adminIcon.className = 'fa-solid fa-lock-open';
                    }
                } else {
                    adminBtn.classList.remove('admin-active');
                    adminBtn.title = '管理员（点击登录）';
                    // 更新图标为锁定状态
                    if (adminIcon) {
                        adminIcon.className = 'fa-solid fa-lock';
                    }
                }
            }
        }
    };

    // Toast 通知对象
    const Toast = {
        container: null,

        init() {
            this.container = document.getElementById('toastContainer');
        },

        show(message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;

            // 移动端使用更简洁的图标
            const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

            toast.innerHTML = `
                <i class="fa-solid ${iconClass}"></i>
                <span>${Utils.escapeHtml(message)}</span>
            `;

            this.container.appendChild(toast);

            // 移动端优化：根据设备类型调整显示时长
            const duration = Utils.isMobile() ? 2500 : 3000;

            // 自动移除
            setTimeout(() => {
                toast.style.animation = 'fadeOut 0.3s forwards';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    };

    // 初始化 Toast
    Toast.init();

    // 导出
    window.Events = Events;
    window.Toast = Toast;

})(window);
