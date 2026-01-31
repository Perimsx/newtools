/**
 * Font Awesome 加载检测和降级方案
 *
 * 使用方法：
 * 1. 在 index.html 中，在 </body> 标签之前引入此文件：
 *    <script src="assets/js/fontawesome-fallback.js"></script>
 * 2. 或将此代码添加到 assets/js/main.js 或 assets/js/events.js 的开头
 */

(function() {
    'use strict';

    // 检测 Font Awesome 是否已加载
    function isFontAwesomeLoaded() {
        const testIcon = document.createElement('i');
        testIcon.className = 'fa-solid fa-test';
        testIcon.style.position = 'absolute';
        testIcon.style.visibility = 'hidden';
        testIcon.style.left = '-9999px';
        document.body.appendChild(testIcon);

        const styles = window.getComputedStyle(testIcon);
        const fontFamily = styles.fontFamily;
        const content = styles.content;

        document.body.removeChild(testIcon);

        // 检查是否加载了 Font Awesome 字体
        return fontFamily.includes('Font Awesome') || fontFamily.includes('FontAwesome');
    }

    // 添加降级样式
    function addFallbackStyles() {
        const style = document.createElement('style');
        style.id = 'fontawesome-fallback-styles';

        const css = `
            /* Font Awesome 未加载时的降级方案 */
            body.no-fontawesome .fa-solid::before,
            body.no-fontawesome .fa-regular::before,
            body.no-fontawesome .fa-brands::before {
                font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif !important;
            }

            /* 关闭按钮 × */
            body.no-fontawesome .fa-xmark::before {
                content: "×" !important;
                font-size: 1.2em !important;
            }

            /* 锁定图标 */
            body.no-fontawesome .fa-lock::before {
                content: "🔒" !important;
            }

            /* 开锁图标 */
            body.no-fontawesome .fa-unlock::before,
            body.no-fontawesome .fa-lock-open::before {
                content: "🔓" !important;
            }

            /* 盾牌图标 */
            body.no-fontawesome .fa-shield-halved::before {
                content: "🛡️" !important;
            }

            /* 下载图标 */
            body.no-fontawesome .fa-download::before {
                content: "⬇️" !important;
            }

            /* 上传图标 */
            body.no-fontawesome .fa-upload::before {
                content: "⬆️" !important;
            }

            /* 删除图标 */
            body.no-fontawesome .fa-trash::before {
                content: "🗑️" !important;
            }

            /* 眼睛图标 */
            body.no-fontawesome .fa-eye::before {
                content: "👁️" !important;
            }

            /* 隐藏密码图标 */
            body.no-fontawesome .fa-eye-slash::before {
                content: "👁️‍🗨️" !important;
            }

            /* 星星图标 */
            body.no-fontawesome .fa-star::before {
                content: "⭐" !important;
            }

            /* 云图标 */
            body.no-fontawesome .fa-cloud::before {
                content: "☁️" !important;
            }

            /* 月亮图标 */
            body.no-fontawesome .fa-moon::before {
                content: "🌙" !important;
            }

            /* 太阳图标 */
            body.no-fontawesome .fa-sun::before {
                content: "☀️" !important;
            }

            /* 加号图标 */
            body.no-fontawesome .fa-plus::before {
                content: "+" !important;
                font-weight: bold !important;
            }

            /* 编辑图标 */
            body.no-fontawesome .fa-pen::before {
                content: "✏️" !important;
            }

            /* 谷歌图标 */
            body.no-fontawesome .fa-google::before {
                content: "G" !important;
                font-weight: bold !important;
                color: #4285f4 !important;
            }

            /* 箭头图标 */
            body.no-fontawesome .fa-chevron-down::before {
                content: "▼" !important;
                font-size: 0.7em !important;
            }

            body.no-fontawesome .fa-arrow-right::before {
                content: "→" !important;
            }

            body.no-fontawesome .fa-right-from-bracket::before {
                content: "↪️" !important;
            }

            /* 设置滑块图标 */
            body.no-fontawesome .fa-sliders::before {
                content: "⚙️" !important;
            }

            /* 钥匙图标 */
            body.no-fontawesome .fa-key::before {
                content: "🔑" !important;
            }

            /* 检查图标 */
            body.no-fontawesome .fa-check-circle::before {
                content: "✅" !important;
            }

            /* 感叹号图标 */
            body.no-fontawesome .fa-exclamation-circle::before {
                content: "⚠️" !important;
            }
        `;

        style.textContent = css;
        document.head.appendChild(style);
    }

    // 等待 DOM 加载完成
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAndApply);
        } else {
            checkAndApply();
        }
    }

    // 检查并应用降级方案
    function checkAndApply() {
        // 延迟检查，确保字体有时间加载
        setTimeout(() => {
            const isLoaded = isFontAwesomeLoaded();

            if (!isLoaded) {
                console.warn('⚠️ Font Awesome 未正确加载，启用 Emoji 降级方案');
                document.body.classList.add('no-fontawesome');
                addFallbackStyles();

                // 在控制台显示提示
                console.log('%c🔧 Font Awesome 降级方案已启用', 'color: #ff9800; font-size: 14px; font-weight: bold;');
                console.log('图标将使用 Emoji 字符显示。如果需要完全解决，请检查：');
                console.log('1. CDN 链接是否正确');
                console.log('2. 网络连接是否正常');
                console.log('3. 浏览器控制台是否有错误信息');
            } else {
                console.log('✅ Font Awesome 已成功加载');
            }
        }, 1000); // 延迟 1 秒检查
    }

    // 启动检测
    init();

})();
