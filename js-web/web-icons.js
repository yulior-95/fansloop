/**
 * GOODFANS Web · 全局图标：Font Awesome 标记 → Lucide SVG（MicroKit / shadcn 同款线条体系）
 * https://microkit.co/
 */
(function (global) {
    if (global.__flWebIconsBooted) return;
    global.__flWebIconsBooted = true;

    var LUCIDE_CDN = 'https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js';
    var FA_SKIP = { 'fa-solid': 1, 'fa-regular': 1, 'fa-brands': 1, 'fa-light': 1, 'fa-thin': 1, 'fa-duotone': 1 };

    /** Font Awesome 名称 → Lucide 名称（其余默认同名） */
    var FA_TO_LUCIDE = {
        xmark: 'x',
        times: 'x',
        close: 'x',
        'magnifying-glass': 'search',
        'magnifying-glass-plus': 'zoom-in',
        'magnifying-glass-minus': 'zoom-out',
        'angles-left': 'chevrons-left',
        'angles-right': 'chevrons-right',
        'angle-left': 'chevron-left',
        'angle-right': 'chevron-right',
        'angle-up': 'chevron-up',
        'angle-down': 'chevron-down',
        'circle-check': 'circle-check',
        'circle-exclamation': 'circle-alert',
        'circle-info': 'info',
        'circle-question': 'circle-help',
        'circle-xmark': 'circle-x',
        'triangle-exclamation': 'triangle-alert',
        'delete-left': 'delete',
        'arrow-up-right-from-square': 'external-link',
        'up-right-and-down-left-from-center': 'minimize-2',
        share: 'share-2',
        'share-nodes': 'share-2',
        'pen-to-square': 'square-pen',
        'user-group': 'users',
        'people-group': 'users-round',
        'shield-halved': 'shield',
        gear: 'settings',
        cog: 'settings',
        gears: 'settings',
        sliders: 'sliders-horizontal',
        bars: 'menu',
        'bars-staggered': 'menu',
        'table-cells': 'layout-grid',
        'chart-line': 'trending-up',
        'chart-simple': 'chart-no-axes-column',
        'chart-bar': 'chart-column',
        'chart-pie': 'pie-chart',
        'arrow-trend-up': 'trending-up',
        'arrow-trend-down': 'trending-down',
        bolt: 'zap',
        'wand-magic-sparkles': 'wand-sparkles',
        'wand-magic': 'wand-sparkles',
        'location-dot': 'map-pin',
        'earth-americas': 'globe',
        'cart-shopping': 'shopping-cart',
        'bag-shopping': 'shopping-bag',
        'building-columns': 'landmark',
        qrcode: 'qr-code',
        mobile: 'smartphone',
        'mobile-screen': 'smartphone',
        desktop: 'monitor',
        display: 'monitor',
        'volume-high': 'volume-2',
        'volume-xmark': 'volume-x',
        language: 'languages',
        'window-restore': 'picture-in-picture-2',
        expand: 'maximize-2',
        compress: 'minimize-2',
        microphone: 'mic',
        'microphone-slash': 'mic-off',
        'video-slash': 'video-off',
        'photo-film': 'clapperboard',
        'circle-play': 'circle-play',
        'circle-pause': 'circle-pause',
        'closed-captioning': 'captions',
        'tower-broadcast': 'radio',
        'paper-plane': 'send',
        comment: 'message-circle',
        'comment-dots': 'message-circle-more',
        comments: 'messages-square',
        message: 'message-square',
        envelope: 'mail',
        'envelope-open': 'mail-open',
        'file-lines': 'file-text',
        'file-alt': 'file-text',
        clone: 'copy',
        rotate: 'rotate-cw',
        'rotate-right': 'rotate-cw',
        'clock-rotate-left': 'history',
        'arrow-rotate-left': 'history',
        'arrows-rotate': 'refresh-cw',
        sync: 'refresh-cw',
        'right-from-bracket': 'log-out',
        'right-to-bracket': 'log-in',
        'user-xmark': 'user-x',
        'user-slash': 'user-x',
        'user-gear': 'user-cog',
        reply: 'reply',
        'comment-slash': 'message-circle-off',
        'user-shield': 'shield-user',
        bullhorn: 'megaphone',
        shuffle: 'shuffle',
        'hand-fist': 'hand',
        'microphone-lines': 'mic-vocal',
        'power-off': 'power',
        'address-book': 'contact',
        'ranking-star': 'medal',
        'circle-notch': 'loader-circle',
        spinner: 'loader',
        trash: 'trash-2',
        'trash-can': 'trash-2',
        'eye-slash': 'eye-off',
        'link-slash': 'unlink',
        'quote-left': 'quote',
        hashtag: 'hash',
        at: 'at-sign',
        'dollar-sign': 'dollar-sign',
        'layer-group': 'layers',
        cubes: 'boxes',
        'face-smile': 'smile',
        'face-frown': 'frown',
        'square-xmark': 'square-x',
        home: 'house',
        'house-chimney': 'house',
        gamepad: 'gamepad-2',
        filter: 'funnel',
        retweet: 'repeat-2',
        'list-ol': 'list-ordered',
        'list-ul': 'list',
        'cloud-arrow-up': 'cloud-upload',
        'cloud-arrow-down': 'cloud-download',
        'arrow-left-long': 'arrow-left',
        'arrow-right-long': 'arrow-right',
        'up-right-from-square': 'external-link',
        print: 'printer',
        'money-bill': 'banknote',
        'money-bill-wave': 'banknote',
        'file-invoice-dollar': 'receipt',
        'receipt-long': 'receipt-text',
        'ellipsis-h': 'ellipsis',
        'ellipsis-v': 'ellipsis-vertical',
        'caret-left': 'chevron-left',
        'caret-right': 'chevron-right',
        'caret-up': 'chevron-up',
        'caret-down': 'chevron-down',
        'note-sticky': 'sticky-note',
        'paper-plane-top': 'send',
        'thumbtack': 'pin',
        'location-arrow': 'navigation',
        'signs-post': 'signpost',
        lightbulb: 'lightbulb',
        'hand-holding-dollar': 'hand-coins',
        'comments-dollar': 'messages-square',
        'comment-dollar': 'message-circle',
        'hand-holding-heart': 'heart-handshake',
        'circle-user': 'circle-user',
        'user-large': 'user',
        ethereum: 'circle-dollar-sign',
        'bitcoin-sign': 'bitcoin',
        'x-twitter': 'twitter',
        coins: 'coins',
        crown: 'crown',
        store: 'store',
        wallet: 'wallet',
        compass: 'compass',
        'list-check': 'list-todo',
        'list-ul': 'list',
        'box-archive': 'archive',
        'life-ring': 'life-buoy',
        'file-export': 'file-up',
        'file-contract': 'file-text',
        'bell-slash': 'bell-off',
        'cookie-bite': 'cookie',
        'circle-half-stroke': 'contrast',
        'broadcast-tower': 'radio-tower',
        'building-shield': 'shield-check',
        'hand-pointer': 'mouse-pointer',
        fire: 'flame',
        'floppy-disk': 'save',
        'gas-pump': 'fuel',
        'gauge-high': 'gauge',
        'info-circle': 'info',
        'id-card-clip': 'id-card',
        'image-portrait': 'user',
        'box-open': 'package-open',
        'check-double': 'check-check',
        'file-invoice': 'receipt',
        'file-pdf': 'file-text',
        'file-csv': 'file-spreadsheet',
        'file-excel': 'file-spreadsheet',
        'file-zipper': 'file-archive',
        'hourglass-half': 'hourglass',
        'hourglass-end': 'hourglass',
        'house-user': 'house',
        'id-badge': 'badge',
        'laptop-code': 'laptop',
        'mug-hot': 'coffee',
        'money-bill-transfer': 'banknote',
        'arrow-right-to-bracket': 'log-in',
        'arrow-up-from-bracket': 'share',
        'arrow-rotate-right': 'rotate-cw',
        'arrows-up-down': 'arrow-up-down',
        'bell-concierge': 'concierge-bell',
        broom: 'brush',
        bullseye: 'target',
        'calendar-day': 'calendar',
        'calendar-week': 'calendar-days',
        'camera-retro': 'camera',
        'camera-rotate': 'camera',
        'circle-dollar-to-slot': 'circle-dollar-sign',
        infinity: 'infinity'
    };

    var FILL_WHEN_SOLID = { heart: 1, star: 1, bookmark: 1 };

    var observer = null;
    var pending = null;
    var suppressObs = false;

    function parseFaIcon(el) {
        var style = 'regular';
        var icon = null;
        (el.className || '').split(/\s+/).forEach(function (cls) {
            if (cls === 'fa-solid') style = 'solid';
            else if (cls === 'fa-regular') style = 'regular';
            else if (cls === 'fa-brands') style = 'brand';
            else if (cls.indexOf('fa-') === 0 && !FA_SKIP[cls]) icon = cls.slice(3);
        });
        return { icon: icon, style: style };
    }

    function resolveLucide(faName) {
        if (!faName) return null;
        return FA_TO_LUCIDE[faName] || faName;
    }

    function stripFaClasses(className) {
        return (className || '')
            .split(/\s+/)
            .filter(function (c) {
                return c && c.indexOf('fa-') !== 0;
            })
            .join(' ');
    }

    function restoreFaIcon(el) {
        var restore = el.getAttribute('data-fl-fa-restore');
        if (!restore) return;
        el.className = restore;
        el.removeAttribute('data-lucide');
        el.setAttribute('data-fl-icon-skip', '1');
    }

    function repairMissingSvg(root) {
        var scope = root || document;
        if (!scope.querySelectorAll) return;
        scope.querySelectorAll('i.web-icon[data-lucide]').forEach(function (el) {
            if (el.querySelector('svg.lucide')) return;
            restoreFaIcon(el);
        });
    }

    function migrateRoot(root) {
        var scope = root || document;
        var nodes = scope.querySelectorAll ? scope.querySelectorAll('i[class*="fa-"]') : [];
        nodes.forEach(function (el) {
            if (el.getAttribute('data-fl-icon-skip') === '1') return;
            if (el.getAttribute('data-lucide')) return;
            var info = parseFaIcon(el);
            if (!info.icon) return;
            /* Lucide 无完整 FA Brands 集；迁移失败会隐藏 ::before 导致空图标 */
            if (info.style === 'brand') return;
            var name = resolveLucide(info.icon);
            if (!name) return;
            if (!el.getAttribute('data-fl-fa-restore')) {
                el.setAttribute('data-fl-fa-restore', el.className);
            }
            var keep = stripFaClasses(el.className);
            el.className = (keep + ' web-icon').trim();
            if (info.style === 'solid') el.classList.add('web-icon--solid');
            if (info.style === 'solid' && FILL_WHEN_SOLID[name]) el.classList.add('web-icon--fill');
            el.setAttribute('data-lucide', name);
            if (!el.hasAttribute('aria-hidden') && !el.hasAttribute('aria-label')) {
                el.setAttribute('aria-hidden', 'true');
            }
        });
    }

    function paintIcons() {
        if (!global.lucide || typeof global.lucide.createIcons !== 'function') return;
        var stroke = '1.75';
        try {
            stroke = getComputedStyle(document.documentElement).getPropertyValue('--web-icon-stroke').trim() || stroke;
        } catch (e) { /* ignore */ }
        global.lucide.createIcons({
            attrs: {
                class: ['lucide'],
                'stroke-width': stroke
            },
            nameAttr: 'data-lucide'
        });
        document.documentElement.setAttribute('data-fl-web-icons', '1');
    }

    function refresh(root) {
        suppressObs = true;
        migrateRoot(root || document);
        paintIcons();
        repairMissingSvg(root || document);
        suppressObs = false;
    }

    function scheduleRefresh() {
        if (pending) clearTimeout(pending);
        pending = setTimeout(function () {
            pending = null;
            refresh(document);
        }, 48);
    }

    function watchDom() {
        if (observer || !document.body) return;
        observer = new MutationObserver(function () {
            if (suppressObs) return;
            scheduleRefresh();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function loadLucide(cb) {
        if (global.lucide && global.lucide.createIcons) {
            cb();
            return;
        }
        if (global.__flWebIconsLoading) {
            global.addEventListener('fl-web-icons-ready', function once() {
                global.removeEventListener('fl-web-icons-ready', once);
                cb();
            });
            return;
        }
        global.__flWebIconsLoading = true;
        var s = document.createElement('script');
        s.src = LUCIDE_CDN;
        s.async = true;
        s.onload = function () {
            global.__flWebIconsLoading = false;
            cb();
        };
        s.onerror = function () {
            global.__flWebIconsLoading = false;
        };
        document.head.appendChild(s);
    }

    function boot() {
        loadLucide(function () {
            refresh(document);
            watchDom();
            try {
                global.dispatchEvent(new CustomEvent('fl-web-icons-ready'));
            } catch (e) { /* ignore */ }
        });
    }

    global.FLWebIcons = {
        refresh: refresh,
        migrate: migrateRoot,
        resolve: resolveLucide
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})(typeof window !== 'undefined' ? window : this);
