// 强制刷新缓存的版本号
const CACHE_VERSION = '20240802';

// 为所有链接添加版本号
function addCacheBuster() {
    const links = document.querySelectorAll('a[href$=".html"]');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.includes('?')) {
            link.setAttribute('href', href + '?v=' + CACHE_VERSION);
        }
    });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', addCacheBuster);

// 强制清除浏览器缓存的函数
function clearBrowserCache() {
    if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
            cacheNames.forEach(function(cacheName) {
                caches.delete(cacheName);
            });
        });
    }
    
    // 清除本地存储的缓存标记
    localStorage.removeItem('userAgreed');
    
    console.log('缓存已清除，请刷新页面');
}