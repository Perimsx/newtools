/**
 * Service Worker for newtools.cloud
 * 功能：
 * 1. 离线缓存支持
 * 2. 资源预缓存
 * 3. 动态缓存策略
 * 4. 后台同步
 */

// ========== 配置 ==========
const CACHE_NAME = 'newtools-cloud-v1';
const RUNTIME_CACHE = 'newtools-cloud-runtime-v1';

// 需要预缓存的静态资源列表（核心资源）
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/style.css',
  '/assets/js/store.js',
  '/assets/js/utils.js',
  '/assets/js/renderer.js',
  '/assets/js/events.js',
  '/assets/js/app.js'
  // 注意：图标文件会在 install 时自动添加
];

// ========== 安装事件 ==========
// Service Worker 首次安装或更新时触发
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...');

  // 使用 waitUntil 确保 Promise 完成后再进入激活状态
  event.waitUntil(
    (async () => {
      try {
        // 打开缓存
        const cache = await caches.open(CACHE_NAME);

        // 预缓存核心资源
        await cache.addAll(PRECACHE_URLS);
        console.log('[SW] 核心资源预缓存完成');

        // 立即激活新的 Service Worker（跳过等待）
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] 安装失败:', error);
      }
    })()
  );
});

// ========== 激活事件 ==========
// Service Worker 激活时触发（通常在 install 之后）
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...');

  event.waitUntil(
    (async () => {
      try {
        // 获取所有缓存的名称
        const cacheNames = await caches.keys();

        // 删除旧版本的缓存
        await Promise.all(
          cacheNames
            .filter((cacheName) => {
              // 保留当前版本的缓存，删除其他版本
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            })
        );

        // 立即控制所有客户端（页面）
        await self.clients.claim();
        console.log('[SW] 激活完成，已控制所有客户端');
      } catch (error) {
        console.error('[SW] 激活失败:', error);
      }
    })()
  );
});

// ========== 拦截网络请求 ==========
// 拦截所有网络请求，应用缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== self.location.origin) {
    return;
  }

  // 策略 1: 对于静态资源（JS、CSS、图片），使用 "Stale While Revalidate" 策略
  // 优先从缓存返回，同时在后台更新缓存
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image'
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 策略 2: 对于 HTML 文档，使用 "Network First" 策略
  // 优先从网络获取，网络失败时使用缓存
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // 策略 3: 对于其他请求，使用 "Cache First" 策略
  // 优先从缓存获取
  event.respondWith(cacheFirst(request));
});

// ========== 缓存策略实现 ==========

/**
 * Stale While Revalidate 策略
 * 适用场景：静态资源（JS、CSS、图片）
 * 逻辑：立即返回缓存（如果有），同时在后台更新缓存
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  // 同时获取缓存和网络资源
  const cachedResponse = await cache.match(request);
  const networkPromise = fetch(request).then((response) => {
    // 将新的响应存入缓存
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch((error) => {
    console.error('[SW] 网络请求失败:', error);
    // 如果网络请求失败且有缓存，返回缓存
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  });

  // 如果有缓存，立即返回缓存，否则等待网络响应
  return cachedResponse || networkPromise;
}

/**
 * Network First 策略
 * 适用场景：HTML 文档
 * 逻辑：优先从网络获取最新内容，网络失败时使用缓存
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // 尝试从网络获取
    const networkResponse = await fetch(request);

    // 如果成功，更新缓存
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] 网络请求失败，尝试从缓存加载:', error);

    // 网络失败，尝试从缓存获取
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 如果也没有缓存，返回离线页面（可选）
    return new Response('离线状态，无法访问此页面', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

/**
 * Cache First 策略
 * 适用场景：静态资源、API 响应
 * 逻辑：优先从缓存获取，缓存没有时才从网络获取
 */
async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  // 先查缓存
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // 缓存没有，从网络获取
  try {
    const networkResponse = await fetch(request);

    // 存入缓存
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] 网络请求失败:', error);
    throw error;
  }
}

// ========== 消息通信 ==========
// 接收来自客户端的消息
self.addEventListener('message', (event) => {
  console.log('[SW] 收到消息:', event.data);

  // 处理不同类型的消息
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // 跳过等待，立即激活新的 Service Worker
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    // 清除所有缓存
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] 删除缓存:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

// ========== 后台同步（可选）==========
// 支持后台数据同步
self.addEventListener('sync', (event) => {
  console.log('[SW] 后台同步:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(
      // 在这里执行后台同步任务
      // 例如：同步用户数据到服务器
      Promise.resolve()
    );
  }
});

// ========== 推送通知（可选）==========
// 支持推送通知
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      // 图标文件暂时禁用（需要先生成图标文件）
      // icon: '/icons/icon-192x192.png',
      // badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '通知', options)
    );
  }
});

// ========== 通知点击事件 ==========
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[SW] Service Worker 文件已加载');
