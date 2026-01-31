/**
 * Utils.js - 工具函数模块
 * 包含安全防护、验证、防抖等工具函数
 */

((window) => {
    'use strict';

    const Utils = {
        /**
         * XSS 防护 - 转义 HTML 特殊字符
         * @param {string} unsafe - 未安全的字符串
         * @returns {string} - 转义后的安全字符串
         */
        escapeHtml(unsafe) {
            if (typeof unsafe !== 'string') return '';
            const div = document.createElement('div');
            div.textContent = unsafe;
            return div.innerHTML;
        },

        /**
         * URL 验证
         * @param {string} string - 要验证的字符串
         * @returns {boolean} - 是否为有效 URL
         */
        isValidUrl(string) {
            try {
                new URL(string);
                return true;
            } catch {
                return false;
            }
        },

        /**
         * 防抖函数
         * @param {Function} fn - 要防抖的函数
         * @param {number} delay - 延迟时间（毫秒）
         * @returns {Function} - 防抖后的函数
         */
        debounce(fn, delay) {
            let timeoutId;
            return function (...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn.apply(this, args), delay);
            };
        },

        /**
         * 获取网站图标 URL
         * @param {string} url - 网站 URL
         * @returns {string} - 图标 URL
         */
        getIconUrl(url) {
            try {
                const domain = new URL(url).hostname;
                return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            } catch {
                return 'https://via.placeholder.com/48?text=Icon';
            }
        },

        /**
         * 高亮搜索关键词
         * @param {string} text - 原始文本
         * @param {string} query - 搜索关键词
         * @returns {string} - 高亮后的 HTML
         */
        highlightMatch(text, query) {
            if (!query) return this.escapeHtml(text);
            const escaped = this.escapeHtml(text);
            const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
            return escaped.replace(regex, '<mark>$1</mark>');
        },

        /**
         * 转义正则表达式特殊字符
         * @param {string} string - 要转义的字符串
         * @returns {string} - 转义后的字符串
         */
        escapeRegex(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },

        /**
         * 生成唯一 ID
         * @returns {string} - 唯一 ID
         */
        generateId() {
            return Date.now().toString() + Math.random().toString(36).substr(2, 9);
        },

        /**
         * 下载文件
         * @param {string} content - 文件内容
         * @param {string} filename - 文件名
         * @param {string} mimeType - MIME 类型
         */
        downloadFile(content, filename, mimeType = 'application/json') {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        /**
         * 读取并解析 JSON 文件
         * @param {File} file - 文件对象
         * @returns {Promise<Object>} - 解析后的 JSON 对象
         */
        readJsonFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        resolve(data);
                    } catch (err) {
                        reject(new Error('无效的 JSON 文件'));
                    }
                };
                reader.onerror = () => reject(new Error('文件读取失败'));
                reader.readAsText(file);
            });
        },

        /**
         * 格式化日期
         * @param {Date} date - 日期对象
         * @returns {string} - 格式化后的日期字符串
         */
        formatDate(date) {
            return date.toISOString().slice(0, 10);
        },

        /**
         * 检测是否为移动设备
         * @returns {boolean} - 是否为移动设备
         */
        isMobile() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },

        /**
         * 检测是否支持触摸事件
         * @returns {boolean} - 是否支持触摸
         */
        isTouch() {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },

        /**
         * 创建涟漪效果（触摸反馈）
         * @param {Event} event - 点击/触摸事件
         * @param {Element} element - 目标元素
         */
        createRipple(event, element) {
            // 如果是触摸事件，获取第一个触摸点
            const x = event.touches ? event.touches[0].clientX : event.clientX;
            const y = event.touches ? event.touches[0].clientY : event.clientY;

            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const ripple = document.createElement('span');

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x - rect.left - size / 2}px;
                top: ${y - rect.top - size / 2}px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out;
                pointer-events: none;
            `;

            // 确保元素有相对定位
            const position = window.getComputedStyle(element).position;
            if (position !== 'relative' && position !== 'absolute') {
                element.style.position = 'relative';
            }
            element.style.overflow = 'hidden';

            element.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        },

        /**
         * 节流函数（用于滚动等高频事件）
         * @param {Function} fn - 要节流的函数
         * @param {number} limit - 时间限制（毫秒）
         * @returns {Function} - 节流后的函数
         */
        throttle(fn, limit) {
            let inThrottle;
            return function (...args) {
                if (!inThrottle) {
                    fn.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /**
         * 获取视口高度（移动端处理虚拟键盘）
         * @returns {number} - 视口高度
         */
        getViewportHeight() {
            // 移动端虚拟键盘弹出时，使用 innerHeight 会被压缩
            // 返回较小的值以避免内容被遮挡
            return Math.min(window.innerHeight, window.outerHeight);
        },

        /**
         * 平滑滚动到元素
         * @param {Element} element - 目标元素
         * @param {number} offset - 偏移量
         */
        scrollToElement(element, offset = 80) {
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        },

        /**
         * requestAnimationFrame 包装器
         * 用于批量处理 DOM 操作，避免重排
         * @param {Function} callback - 要执行的回调函数
         * @returns {number} - RAF ID
         */
        raf(callback) {
            return window.requestAnimationFrame(() => {
                window.requestAnimationFrame(callback);
            });
        },

        /**
         * 取消 RAF
         * @param {number} id - RAF ID
         */
        cancelRaf(id) {
            if (id) {
                window.cancelAnimationFrame(id);
            }
        },

        /**
         * RAF 节流函数（专用于滚动和动画）
         * @param {Function} fn - 要节流的函数
         * @returns {Function} - 节流后的函数
         */
        rafThrottle(fn) {
            let rafId = null;
            let lastArgs = null;

            return function (...args) {
                lastArgs = args;

                if (rafId === null) {
                    rafId = window.requestAnimationFrame(() => {
                        fn.apply(this, lastArgs);
                        rafId = null;
                        lastArgs = null;
                    });
                }
            };
        },

        /**
         * 批量 DOM 操作队列
         * 将多个 DOM 操作批量处理，减少重排
         * @param {Function} operations - DOM 操作函数
         */
        batchDomUpdates(operations) {
            // 使用 RAF 确保在下一帧执行
            window.requestAnimationFrame(() => {
                // 读取 DOM 属性（强制重排前）
                const measurements = operations.read ? operations.read() : null;

                // 在同一帧内写入 DOM
                if (operations.write) {
                    operations.write(measurements);
                }
            });
        },

        /**
         * 双 RAF 确保过渡动画生效
         * 用于在修改 DOM 属性后确保 CSS 过渡生效
         * @param {Function} callback - 要执行的回调函数
         */
        doubleRaf(callback) {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(callback);
            });
        },

        /**
         * 优化的 class 切换（使用 RAF）
         * @param {Element} element - 目标元素
         * @param {string} className - 类名
         * @param {boolean} force - 添加或移除
         */
        toggleClass(element, className, force) {
            if (!element) return;
            window.requestAnimationFrame(() => {
                element.classList.toggle(className, force);
            });
        },

        /**
         * 批量 class 操作
         * @param {Array} operations - 操作数组 [{element, className, action}]
         * action: 'add' | 'remove' | 'toggle'
         */
        batchClassOperations(operations) {
            window.requestAnimationFrame(() => {
                operations.forEach(({ element, className, action, force }) => {
                    if (!element) return;
                    if (action === 'add') {
                        element.classList.add(className);
                    } else if (action === 'remove') {
                        element.classList.remove(className);
                    } else if (action === 'toggle') {
                        element.classList.toggle(className, force);
                    }
                });
            });
        },

        /**
         * 平滑数值过渡（用于动画）
         * @param {number} from - 起始值
         * @param {number} to - 目标值
         * @param {number} duration - 持续时间（毫秒）
         * @param {Function} callback - 回调函数，接收当前值
         * @param {string} easing - 缓动函数
         */
        animateValue(from, to, duration, callback, easing = 'easeOutCubic') {
            const startTime = performance.now();
            const change = to - from;

            // 缓动函数
            const easingFunctions = {
                linear: t => t,
                easeOutCubic: t => 1 - Math.pow(1 - t, 3),
                easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
                easeOutQuart: t => 1 - Math.pow(1 - t, 4),
            };

            const easingFn = easingFunctions[easing] || easingFunctions.easeOutCubic;

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easingFn(progress);

                const currentValue = from + (change * easedProgress);
                callback(currentValue);

                if (progress < 1) {
                    window.requestAnimationFrame(animate);
                }
            };

            window.requestAnimationFrame(animate);
        },

        /**
         * 检测元素是否在视口中
         * @param {Element} element - 目标元素
         * @param {number} threshold - 阈值（0-1）
         * @returns {boolean} - 是否在视口中
         */
        isInViewport(element, threshold = 0) {
            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const windowWidth = window.innerWidth || document.documentElement.clientWidth;

            const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
            const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);

            return vertInView && horInView;
        }

    };

    // 导出 Utils
    window.Utils = Utils;

})(window);
