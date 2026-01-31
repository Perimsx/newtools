/**
 * PerformanceMonitor.js - 动画性能监控和降级方案
 * 提供设备性能检测、动画优化和优雅降级策略
 */

((window) => {
    'use strict';

    const PerformanceMonitor = {
        // 性能配置
        config: {
            // 性能阈值
            thresholds: {
                lowFPS: 30,              // 低帧率阈值
                mediumFPS: 50,           // 中等帧率阈值
                highFPS: 58,             // 高帧率阈值
                longTaskThreshold: 50,   // 长任务阈值（毫秒）
                memoryLimit: 100         // 内存限制（MB，如果可用）
            },

            // 监控配置
            monitoring: {
                sampleInterval: 1000,    // 采样间隔（毫秒）
                sampleCount: 5,          // 采样次数
                fpsWindow: 2000,         // FPS 计算窗口（毫秒）
                enableLogging: true,     // 是否启用日志
                logInterval: 5000        // 日志输出间隔（毫秒）
            },

            // 降级策略
            degradation: {
                disableComplexAnimations: false,  // 禁用复杂动画
                reduceAnimationDuration: false,    // 减少动画时长
                disableParallax: false,            // 禁用视差效果
                reduceBlurEffects: false,          // 减少模糊效果
                limitConcurrentAnimations: 3       // 限制并发动画数量
            }
        },

        // 性能数据
        performanceData: {
            fps: 60,
            fpsHistory: [],
            frameTime: 0,
            longTasks: [],
            memoryUsage: null,
            deviceTier: 'high',  // 'low', 'medium', 'high'
            isReducedMotion: false,
            activeAnimations: new Set(),
            isMonitoring: false
        },

        // 监控定时器
        monitoringInterval: null,
        loggingInterval: null,

        /**
         * 初始化性能监控器
         */
        init() {
            // 检测用户是否偏好减少动画
            this.detectReducedMotion();

            // 检测设备性能等级
            this.detectDevicePerformance();

            // 应用初始降级策略
            this.applyDegradationStrategy();

            // 启动性能监控
            this.startMonitoring();

            // 监听页面可见性变化
            this.setupVisibilityListener();

            // 监听窗口大小变化（可能影响性能）
            this.setupResizeListener();

            // 在开发模式下输出性能日志
            if (this.config.monitoring.enableLogging) {
                this.startPerformanceLogging();
            }

            // 将性能信息暴露到全局（方便调试）
            if (typeof window !== 'undefined') {
                window.__performanceMonitor = this;
            }

            this.log('PerformanceMonitor initialized', {
                deviceTier: this.performanceData.deviceTier,
                isReducedMotion: this.performanceData.isReducedMotion
            });
        },

        /**
         * 检测用户是否偏好减少动画
         */
        detectReducedMotion() {
            // 检测 CSS 媒体查询
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.performanceData.isReducedMotion = mediaQuery.matches;

            // 监听媒体查询变化
            mediaQuery.addEventListener('change', (e) => {
                this.performanceData.isReducedMotion = e.matches;
                this.applyDegradationStrategy();
                this.log('Reduced motion preference changed', e.matches);
            });

            // 检测用户代理（移动设备或低端设备）
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isLowEnd = this.detectLowEndDevice();

            // 如果是移动设备或低端设备，默认启用减少动画
            if (isMobile || isLowEnd) {
                this.performanceData.isReducedMotion = true;
            }
        },

        /**
         * 检测低端设备特征
         */
        detectLowEndDevice() {
            // 检测硬件并发数（CPU 核心数）
            const hardwareConcurrency = navigator.hardwareConcurrency || 2;
            if (hardwareConcurrency <= 2) return true;

            // 检测设备内存（如果可用）
            const deviceMemory = (navigator.deviceMemory || 4);
            if (deviceMemory <= 2) return true;

            // 检测连接类型（如果可用）
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
                return true;
            }

            return false;
        },

        /**
         * 检测设备性能等级
         */
        detectDevicePerformance() {
            const startTime = performance.now();

            // 执行一些计算密集型任务来测量性能
            const iterations = 1000000;
            let result = 0;

            for (let i = 0; i < iterations; i++) {
                result += Math.sqrt(i);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            // 根据执行时间判断性能等级
            if (duration > 100) {
                this.performanceData.deviceTier = 'low';
            } else if (duration > 50) {
                this.performanceData.deviceTier = 'medium';
            } else {
                this.performanceData.deviceTier = 'high';
            }

            // 考虑其他硬件因素
            const hardwareConcurrency = navigator.hardwareConcurrency || 2;
            const deviceMemory = navigator.deviceMemory || 4;

            // 调整性能等级
            if (hardwareConcurrency <= 2 || deviceMemory <= 2) {
                if (this.performanceData.deviceTier === 'high') {
                    this.performanceData.deviceTier = 'medium';
                }
            }

            this.log('Device performance detected', {
                tier: this.performanceData.deviceTier,
                benchmarkDuration: duration,
                cores: hardwareConcurrency,
                memory: deviceMemory
            });
        },

        /**
         * 启动性能监控
         */
        startMonitoring() {
            if (this.performanceData.isMonitoring) return;

            this.performanceData.isMonitoring = true;

            // 监控 FPS
            this.startFPSMonitoring();

            // 监控长任务（使用 Performance Observer）
            this.startLongTaskMonitoring();

            // 定期采样性能数据
            this.monitoringInterval = setInterval(() => {
                this.samplePerformance();
            }, this.config.monitoring.sampleInterval);
        },

        /**
         * 启动 FPS 监控
         */
        startFPSMonitoring() {
            let frameCount = 0;
            let lastTime = performance.now();

            const measureFPS = () => {
                frameCount++;
                const currentTime = performance.now();
                const elapsed = currentTime - lastTime;

                if (elapsed >= this.config.monitoring.fpsWindow) {
                    const fps = Math.round((frameCount * 1000) / elapsed);

                    // 更新 FPS
                    this.performanceData.fps = fps;
                    this.performanceData.fpsHistory.push(fps);

                    // 只保留最近 30 个样本
                    if (this.performanceData.fpsHistory.length > 30) {
                        this.performanceData.fpsHistory.shift();
                    }

                    // 检测性能下降并自动降级
                    this.checkPerformanceDegradation();

                    frameCount = 0;
                    lastTime = currentTime;
                }

                requestAnimationFrame(measureFPS);
            };

            requestAnimationFrame(measureFPS);
        },

        /**
         * 启动长任务监控
         */
        startLongTaskMonitoring() {
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.duration > this.config.thresholds.longTaskThreshold) {
                                this.performanceData.longTasks.push({
                                    duration: entry.duration,
                                    startTime: entry.startTime,
                                    timestamp: Date.now()
                                });

                                // 只保留最近 10 个长任务
                                if (this.performanceData.longTasks.length > 10) {
                                    this.performanceData.longTasks.shift();
                                }

                                this.log('Long task detected', {
                                    duration: entry.duration,
                                    startTime: entry.startTime
                                });
                            }
                        }
                    });

                    observer.observe({ entryTypes: ['measure', 'longtask'] });
                } catch (e) {
                    // PerformanceObserver 不支持 longtask
                    this.log('PerformanceObserver for longtask not supported', null, 'warn');
                }
            }
        },

        /**
         * 检测性能降级并调整策略
         */
        checkPerformanceDegradation() {
            const avgFPS = this.getAverageFPS();

            // 如果 FPS 持续低于阈值，调整设备等级
            if (avgFPS < this.config.thresholds.lowFPS && this.performanceData.fpsHistory.length >= 5) {
                if (this.performanceData.deviceTier !== 'low') {
                    this.performanceData.deviceTier = 'low';
                    this.applyDegradationStrategy();
                    this.log('Performance degraded to low tier', { avgFPS });
                }
            } else if (avgFPS < this.config.thresholds.mediumFPS && this.performanceData.fpsHistory.length >= 5) {
                if (this.performanceData.deviceTier === 'high') {
                    this.performanceData.deviceTier = 'medium';
                    this.applyDegradationStrategy();
                    this.log('Performance degraded to medium tier', { avgFPS });
                }
            } else if (avgFPS >= this.config.thresholds.highFPS && this.performanceData.fpsHistory.length >= 5) {
                if (this.performanceData.deviceTier !== 'high') {
                    this.performanceData.deviceTier = 'high';
                    this.applyDegradationStrategy();
                    this.log('Performance improved to high tier', { avgFPS });
                }
            }
        },

        /**
         * 采样性能数据
         */
        samplePerformance() {
            // 采样内存使用情况（如果可用）
            if (performance.memory) {
                const memoryUsage = {
                    usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576),
                    jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
                };

                this.performanceData.memoryUsage = memoryUsage;

                // 检查内存限制
                if (memoryUsage.usedJSHeapSize > this.config.thresholds.memoryLimit) {
                    this.log('Memory usage high', memoryUsage, 'warn');
                }
            }

            // 采样导航时序（如果可用）
            if (performance.timing) {
                const timing = performance.timing;
                const pageLoadTime = timing.loadEventEnd - timing.navigationStart;

                if (pageLoadTime > 3000) {
                    this.log('Page load time high', { pageLoadTime }, 'warn');
                }
            }
        },

        /**
         * 应用降级策略
         */
        applyDegradationStrategy() {
            const { deviceTier, isReducedMotion } = this.performanceData;
            const config = this.config.degradation;

            // 重置所有降级策略
            config.disableComplexAnimations = false;
            config.reduceAnimationDuration = false;
            config.disableParallax = false;
            config.reduceBlurEffects = false;
            config.limitConcurrentAnimations = 3;

            // 如果用户偏好减少动画，应用最严格的降级
            if (isReducedMotion) {
                config.disableComplexAnimations = true;
                config.disableParallax = true;
                config.reduceBlurEffects = true;
                config.limitConcurrentAnimations = 1;
            } else {
                // 根据设备性能等级应用降级策略
                switch (deviceTier) {
                    case 'low':
                        config.disableComplexAnimations = true;
                        config.reduceAnimationDuration = true;
                        config.disableParallax = true;
                        config.reduceBlurEffects = true;
                        config.limitConcurrentAnimations = 1;
                        break;

                    case 'medium':
                        config.reduceAnimationDuration = true;
                        config.disableParallax = true;
                        config.limitConcurrentAnimations = 2;
                        break;

                    case 'high':
                    default:
                        // 不需要降级
                        config.limitConcurrentAnimations = 5;
                        break;
                }
            }

            // 应用 CSS 变量
            this.applyCSSVariables();

            // 应用 CSS 类
            this.applyCSSClasses();

            this.log('Degradation strategy applied', {
                deviceTier,
                isReducedMotion,
                strategy: config
            });
        },

        /**
         * 应用 CSS 变量
         */
        applyCSSVariables() {
            const root = document.documentElement;
            const { reduceAnimationDuration, reduceBlurEffects } = this.config.degradation;

            // 根据降级策略调整动画时长
            if (reduceAnimationDuration) {
                root.style.setProperty('--duration-fast', '100ms');
                root.style.setProperty('--duration-base', '150ms');
                root.style.setProperty('--duration-slow', '250ms');
            } else {
                root.style.setProperty('--duration-fast', '150ms');
                root.style.setProperty('--duration-base', '300ms');
                root.style.setProperty('--duration-slow', '500ms');
            }

            // 根据降级策略调整模糊效果
            if (reduceBlurEffects) {
                root.style.setProperty('--glass-blur', '10px');
            } else {
                root.style.setProperty('--glass-blur', '20px');
            }
        },

        /**
         * 应用 CSS 类
         */
        applyCSSClasses() {
            const root = document.documentElement;
            const { disableComplexAnimations, disableParallax, reduceBlurEffects } = this.config.degradation;

            // 移除所有性能相关的类
            root.classList.remove('perf-low', 'perf-medium', 'perf-high');
            root.classList.remove('reduced-motion');
            root.classList.remove('no-complex-animations');
            root.classList.remove('no-parallax');
            root.classList.remove('reduced-blur');

            // 添加设备性能等级类
            root.classList.add(`perf-${this.performanceData.deviceTier}`);

            // 添加降级策略类
            if (this.performanceData.isReducedMotion) {
                root.classList.add('reduced-motion');
            }

            if (disableComplexAnimations) {
                root.classList.add('no-complex-animations');
            }

            if (disableParallax) {
                root.classList.add('no-parallax');
            }

            if (reduceBlurEffects) {
                root.classList.add('reduced-blur');
            }
        },

        /**
         * 注册动画
         */
        registerAnimation(animationId) {
            const { limitConcurrentAnimations } = this.config.degradation;
            const { activeAnimations } = this.performanceData;

            // 检查是否超过限制
            if (activeAnimations.size >= limitConcurrentAnimations) {
                this.log('Animation limit reached, skipping', {
                    active: activeAnimations.size,
                    limit: limitConcurrentAnimations
                });
                return false;
            }

            activeAnimations.add(animationId);
            return true;
        },

        /**
         * 注销动画
         */
        unregisterAnimation(animationId) {
            this.performanceData.activeAnimations.delete(animationId);
        },

        /**
         * 获取平均 FPS
         */
        getAverageFPS() {
            const history = this.performanceData.fpsHistory;
            if (history.length === 0) return 60;

            const sum = history.reduce((a, b) => a + b, 0);
            return Math.round(sum / history.length);
        },

        /**
         * 获取性能报告
         */
        getPerformanceReport() {
            return {
                deviceTier: this.performanceData.deviceTier,
                fps: this.performanceData.fps,
                averageFPS: this.getAverageFPS(),
                fpsHistory: [...this.performanceData.fpsHistory],
                memoryUsage: this.performanceData.memoryUsage,
                activeAnimations: this.performanceData.activeAnimations.size,
                longTasks: [...this.performanceData.longTasks],
                isReducedMotion: this.performanceData.isReducedMotion,
                degradation: { ...this.config.degradation }
            };
        },

        /**
         * 启动性能日志
         */
        startPerformanceLogging() {
            this.loggingInterval = setInterval(() => {
                const report = this.getPerformanceReport();
                this.log('Performance report', report);
            }, this.config.monitoring.logInterval);
        },

        /**
         * 设置可见性监听器
         */
        setupVisibilityListener() {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    // 页面隐藏时，停止监控
                    this.pauseMonitoring();
                } else {
                    // 页面显示时，恢复监控
                    this.resumeMonitoring();
                }
            });
        },

        /**
         * 设置窗口大小监听器
         */
        setupResizeListener() {
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    // 窗口大小变化后，重新检测性能
                    this.detectDevicePerformance();
                    this.applyDegradationStrategy();
                }, 500);
            });
        },

        /**
         * 暂停监控
         */
        pauseMonitoring() {
            // 清除活动动画
            this.performanceData.activeAnimations.clear();
            this.log('Monitoring paused');
        },

        /**
         * 恢复监控
         */
        resumeMonitoring() {
            this.log('Monitoring resumed');
        },

        /**
         * 停止监控
         */
        stopMonitoring() {
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
            }

            if (this.loggingInterval) {
                clearInterval(this.loggingInterval);
                this.loggingInterval = null;
            }

            this.performanceData.isMonitoring = false;
            this.log('Monitoring stopped');
        },

        /**
         * 日志输出
         */
        log(message, data = null, level = 'info') {
            if (!this.config.monitoring.enableLogging) return;

            const timestamp = new Date().toISOString();
            const logMessage = `[PerformanceMonitor ${timestamp}] ${message}`;

            if (data) {
                console[level](logMessage, data);
            } else {
                console[level](logMessage);
            }
        }
    };

    // 导出 PerformanceMonitor
    window.PerformanceMonitor = PerformanceMonitor;

})(window);
