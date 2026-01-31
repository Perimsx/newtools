/**
 * AnimationOptimizer.js - 动画优化工具
 * 提供高性能的动画控制和优化功能
 */

((window) => {
    'use strict';

    const AnimationOptimizer = {
        // 动画队列
        animationQueue: new Map(),

        // 批量更新定时器
        batchUpdateTimer: null,

        // 待处理的更新
        pendingUpdates: new Set(),

        /**
         * 优化的动画函数 - 使用 requestAnimationFrame
         * @param {Function} callback - 动画回调函数
         * @param {string} id - 动画ID（用于取消）
         * @returns {Object} - 动画控制对象
         */
        animate(callback, id) {
            // 检查是否应该跳过动画
            if (!this.shouldAnimate()) {
                callback(1); // 直接完成
                return { cancel: () => {} };
            }

            // 注册动画
            if (id && !window.PerformanceMonitor.registerAnimation(id)) {
                // 超过并发限制
                callback(1);
                return { cancel: () => {} };
            }

            let startTime = null;
            let cancelled = false;
            let rafId = null;

            const animate = (timestamp) => {
                if (cancelled) {
                    if (id) window.PerformanceMonitor.unregisterAnimation(id);
                    return;
                }

                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / 300, 1); // 300ms 默认时长

                callback(progress);

                if (progress < 1) {
                    rafId = requestAnimationFrame(animate);
                } else {
                    if (id) window.PerformanceMonitor.unregisterAnimation(id);
                }
            };

            rafId = requestAnimationFrame(animate);

            return {
                cancel: () => {
                    cancelled = true;
                    if (rafId) {
                        cancelAnimationFrame(rafId);
                    }
                    if (id) window.PerformanceMonitor.unregisterAnimation(id);
                }
            };
        },

        /**
         * 判断是否应该执行动画
         */
        shouldAnimate() {
            // 检查性能监控器
            if (window.PerformanceMonitor) {
                const { deviceTier, isReducedMotion } = window.PerformanceMonitor.performanceData;

                // 如果用户偏好减少动画
                if (isReducedMotion) {
                    return false;
                }

                // 如果是低端设备
                if (deviceTier === 'low') {
                    return false;
                }
            }

            return true;
        },

        /**
         * 批量 DOM 更新（避免布局抖动）
         * @param {Function} updateFn - 更新函数
         */
        batchUpdate(updateFn) {
            this.pendingUpdates.add(updateFn);

            // 清除之前的定时器
            if (this.batchUpdateTimer) {
                return;
            }

            // 在下一帧执行所有更新
            this.batchUpdateTimer = requestAnimationFrame(() => {
                // 使用 DocumentFragment 批量更新
                const updates = Array.from(this.pendingUpdates);
                this.pendingUpdates.clear();
                this.batchUpdateTimer = null;

                // 在 requestAnimationFrame 后再执行
                requestAnimationFrame(() => {
                    updates.forEach(fn => {
                        try {
                            fn();
                        } catch (e) {
                            console.error('Batch update error:', e);
                        }
                    });
                });
            });
        },

        /**
         * 优化的元素动画
         * @param {Element} element - 目标元素
         * @param {Object} styles - 目标样式
         * @param {Object} options - 动画选项
         */
        animateElement(element, styles, options = {}) {
            if (!element || !this.shouldAnimate()) {
                // 直接应用样式
                Object.assign(element.style, styles);
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                const duration = options.duration || 300;
                const easing = options.easing || 'ease-out';
                const id = options.id || `anim-${Date.now()}`;

                // 设置初始状态和过渡
                element.style.transition = `all ${duration}ms ${easing}`;

                // 强制重排
                element.offsetHeight;

                // 应用目标样式
                Object.assign(element.style, styles);

                // 等待动画完成
                setTimeout(() => {
                    element.style.transition = '';
                    resolve();
                }, duration);
            });
        },

        /**
         * 优化的淡入动画
         * @param {Element} element - 目标元素
         * @param {number} duration - 动画时长（毫秒）
         */
        fadeIn(element, duration = 300) {
            if (!element) return Promise.resolve();

            return this.animateElement(element, {
                opacity: '1',
                transform: 'translateZ(0) scale(1)'
            }, {
                duration,
                id: `fade-in-${element.id || element.className}`
            });
        },

        /**
         * 优化的滑入动画
         * @param {Element} element - 目标元素
         * @param {number} duration - 动画时长（毫秒）
         */
        slideIn(element, duration = 300) {
            if (!element) return Promise.resolve();

            // 先设置初始状态
            element.style.opacity = '0';
            element.style.transform = 'translateZ(0) translateY(20px)';

            return this.animateElement(element, {
                opacity: '1',
                transform: 'translateZ(0) translateY(0)'
            }, {
                duration,
                id: `slide-in-${element.id || element.className}`
            });
        },

        /**
         * 优化的缩放动画
         * @param {Element} element - 目标元素
         * @param {number} duration - 动画时长（毫秒）
         */
        scaleIn(element, duration = 300) {
            if (!element) return Promise.resolve();

            // 先设置初始状态
            element.style.opacity = '0';
            element.style.transform = 'translateZ(0) scale(0.9)';

            return this.animateElement(element, {
                opacity: '1',
                transform: 'translateZ(0) scale(1)'
            }, {
                duration,
                id: `scale-in-${element.id || element.className}`
            });
        },

        /**
         * 优化的悬停效果
         * @param {Element} element - 目标元素
         * @param {boolean} isHover - 是否悬停
         */
        setHoverState(element, isHover) {
            if (!element) return;

            if (!this.shouldAnimate()) {
                // 直接应用样式
                if (isHover) {
                    element.style.transform = 'translateY(-2px)';
                    element.style.boxShadow = 'var(--shadow-md)';
                } else {
                    element.style.transform = '';
                    element.style.boxShadow = '';
                }
                return;
            }

            // 使用 CSS 类
            if (isHover) {
                element.classList.add('hovering');
            } else {
                element.classList.remove('hovering');
            }
        },

        /**
         * 节流的滚动事件处理
         * @param {Function} callback - 回调函数
         * @param {number} delay - 延迟时间（毫秒）
         */
        throttledScroll(callback, delay = 100) {
            let ticking = false;

            return (event) => {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        callback(event);
                        ticking = false;
                    });
                    ticking = true;
                }
            };
        },

        /**
         * 防抖的滚动事件处理
         * @param {Function} callback - 回调函数
         * @param {number} delay - 延迟时间（毫秒）
         */
        debouncedScroll(callback, delay = 100) {
            let timeout = null;

            return (event) => {
                if (timeout) {
                    clearTimeout(timeout);
                }

                timeout = setTimeout(() => {
                    callback(event);
                    timeout = null;
                }, delay);
            };
        },

        /**
         * 优化的懒加载
         * @param {Element} element - 目标元素
         * @param {Function} loadCallback - 加载回调
         */
        lazyLoad(element, loadCallback) {
            if (!element || !('IntersectionObserver' in window)) {
                // 不支持 IntersectionObserver，直接加载
                loadCallback();
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // 元素进入视口
                        loadCallback();
                        observer.unobserve(element);
                    }
                });
            }, {
                rootMargin: '50px' // 提前 50px 开始加载
            });

            observer.observe(element);

            // 返回取消函数
            return () => observer.disconnect();
        },

        /**
         * 优化的列表渲染（使用 DocumentFragment）
         * @param {Array} items - 数据项
         * @param {Function} renderItem - 渲染单项的函数
         * @param {Element} container - 容器元素
         * @param {number} batchSize - 每批渲染的数量
         */
        async renderList(items, renderItem, container, batchSize = 20) {
            if (!container || !items.length) return;

            // 清空容器
            container.innerHTML = '';

            const fragment = document.createDocumentFragment();

            for (let i = 0; i < items.length; i++) {
                const itemElement = renderItem(items[i], i);
                fragment.appendChild(itemElement);

                // 每 batchSize 个元素插入一次
                if ((i + 1) % batchSize === 0) {
                    container.appendChild(fragment);

                    // 让浏览器有机会处理其他任务
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            // 插入剩余的元素
            if (fragment.childNodes.length > 0) {
                container.appendChild(fragment);
            }
        },

        /**
         * 优化的布局计算（使用 ResizeObserver）
         * @param {Element} element - 目标元素
         * @param {Function} callback - 尺寸变化回调
         */
        observeLayout(element, callback) {
            if (!element || !('ResizeObserver' in window)) {
                return null;
            }

            const observer = new ResizeObserver(Utils.throttle((entries) => {
                entries.forEach(entry => {
                    callback({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height
                    });
                });
            }, 100));

            observer.observe(element);

            return observer;
        },

        /**
         * 清理所有动画
         */
        cleanup() {
            // 取消所有待处理的更新
            if (this.batchUpdateTimer) {
                cancelAnimationFrame(this.batchUpdateTimer);
                this.batchUpdateTimer = null;
            }

            this.pendingUpdates.clear();

            // 清空动画队列
            this.animationQueue.forEach((animation) => {
                if (animation.cancel) {
                    animation.cancel();
                }
            });

            this.animationQueue.clear();
        },

        /**
         * 获取动画性能统计
         */
        getStats() {
            return {
                activeAnimations: this.animationQueue.size,
                pendingUpdates: this.pendingUpdates.size,
                shouldAnimate: this.shouldAnimate(),
                performanceMonitor: window.PerformanceMonitor ?
                    window.PerformanceMonitor.getPerformanceReport() :
                    null
            };
        }
    };

    // 导出 AnimationOptimizer
    window.AnimationOptimizer = AnimationOptimizer;

})(window);
