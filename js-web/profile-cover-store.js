/**
 * 个人/创作者主页封面 · 按用户 localStorage 隔离
 */
(function (global) {
    var BASE_KEY = 'fl_profile_cover_v1';
    var DEFAULT = 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=2000';
    var MAX_BYTES = 8 * 1024 * 1024;

    function storageKey() {
        var uid = global.GoodfansAuth && global.GoodfansAuth.getUserId
            ? global.GoodfansAuth.getUserId()
            : '';
        return uid ? BASE_KEY + '_' + uid : BASE_KEY;
    }

    function readRaw() {
        try {
            return localStorage.getItem(storageKey()) || sessionStorage.getItem(storageKey()) || '';
        } catch (e) {
            return '';
        }
    }

    function get() {
        return readRaw() || DEFAULT;
    }

    function isDefault(url) {
        return !url || url === DEFAULT;
    }

    function persist(url) {
        var key = storageKey();
        try {
            localStorage.setItem(key, url);
            try { sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
            return 'local';
        } catch (e) {
            try {
                sessionStorage.setItem(key, url);
                return 'session';
            } catch (e2) {
                return false;
            }
        }
    }

    function set(url) {
        if (!url) url = DEFAULT;
        persist(url);
        try {
            global.dispatchEvent(new CustomEvent('fl-profile-cover-change', { detail: { url: url } }));
        } catch (e) { /* ignore */ }
        return url;
    }

    function reset() {
        try { localStorage.removeItem(storageKey()); } catch (e) { /* ignore */ }
        try { sessionStorage.removeItem(storageKey()); } catch (e) { /* ignore */ }
        set(DEFAULT);
    }

    function acceptFile(file, cb) {
        cb = cb || function () {};
        if (!file) {
            cb({ ok: false, message: '未选择文件' });
            return;
        }
        if (!file.type || file.type.indexOf('image/') !== 0) {
            cb({ ok: false, message: '请选择图片或 GIF 动图' });
            return;
        }
        if (file.size > MAX_BYTES) {
            cb({ ok: false, message: '文件不能超过 8 MB' });
            return;
        }
        var reader = new FileReader();
        reader.onload = function () {
            var url = reader.result;
            var where = persist(url);
            try {
                global.dispatchEvent(new CustomEvent('fl-profile-cover-change', { detail: { url: url } }));
            } catch (e) { /* ignore */ }
            cb({
                ok: true,
                url: url,
                persisted: where !== false,
                sessionOnly: where === 'session',
                isAnimated: file.type === 'image/gif' || file.type === 'image/webp'
            });
        };
        reader.onerror = function () {
            cb({ ok: false, message: '读取文件失败，请重试' });
        };
        reader.readAsDataURL(file);
    }

    global.FLProfileCoverStore = {
        DEFAULT: DEFAULT,
        get: get,
        set: set,
        reset: reset,
        isDefault: isDefault,
        acceptFile: acceptFile
    };
})(typeof window !== 'undefined' ? window : this);
