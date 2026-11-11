/**
 * 本地预览统一走 http://127.0.0.1:8766
 * Cursor / IDE 若以 file:// 打开 HTML，立即跳到静态服务地址，避免点击失效。
 */
(function () {
    try {
        if (typeof location === 'undefined' || location.protocol !== 'file:') return;
        var PORT = 8766;
        var href = String(location.href || '').replace(/\\/g, '/');
        var key = '/web3-app-prototype/';
        var i = href.toLowerCase().lastIndexOf(key);
        if (i < 0) return;
        var rest = href.slice(i + key.length);
        try {
            rest = decodeURI(rest);
        } catch (e) { /* keep raw */ }
        if (!rest) rest = 'pages-web/home.html';
        location.replace('http://127.0.0.1:' + PORT + '/' + rest);
    } catch (err) { /* ignore */ }
})();
