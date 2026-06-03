/**
 * 私信 · 分享作品弹窗：选作品 → 预览 → 发送 → 成功
 */
(function () {
    var WORKS = [
        { id: 'w1', title: '富士山晨雾 · 35mm 实拍', cover: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400', meta: 'Luna 🌙 · 2.4k 赞 · 图文' },
        { id: 'w2', title: '京都夜景 Vlog 预告', cover: 'https://images.unsplash.com/photo-1542642745-f03d8e3aa54c?w=400', meta: 'Luna 🌙 · 890 赞 · 视频' },
        { id: 'w3', title: '订阅者专属 · 幕后花絮', cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', meta: '仅订阅者 · 付费' },
        { id: 'w4', title: '巴黎街头胶片集', cover: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400', meta: '1.8k 赞 · 图文' },
        { id: 'w5', title: '直播回放精华', cover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400', meta: '3.2k 播放 · 视频' },
        { id: 'w6', title: '晨间咖啡与阅读', cover: 'https://images.unsplash.com/photo-1542435503-956c469947f6?w=400', meta: '620 赞 · 图文' }
    ];

    var selected = null;

    function $(id) { return document.getElementById(id); }

    function openOvl(id) {
        var o = $(id);
        if (!o) return;
        o.classList.add('show');
        o.setAttribute('aria-hidden', 'false');
    }

    function closeOvl(id) {
        var o = $(id);
        if (!o) return;
        o.classList.remove('show');
        o.setAttribute('aria-hidden', 'true');
    }

    function renderGrid(filter) {
        var grid = $('imShareGrid');
        if (!grid) return;
        var q = (filter || '').toLowerCase();
        grid.innerHTML = WORKS.filter(function (w) {
            return !q || w.title.toLowerCase().indexOf(q) >= 0;
        }).map(function (w) {
            var sel = selected && selected.id === w.id ? ' selected' : '';
            return '<button type="button" class="im-share-item' + sel + '" data-id="' + w.id + '">' +
                '<img src="' + w.cover + '" alt="">' +
                '<div class="cap">' + w.title + '</div>' +
                '<div class="meta">' + w.meta + '</div></button>';
        }).join('');
    }

    function selectWork(id) {
        for (var i = 0; i < WORKS.length; i++) {
            if (WORKS[i].id === id) { selected = WORKS[i]; break; }
        }
        var prev = $('imSharePreview');
        var btn = $('imShareSendBtn');
        if (!selected) return;
        if (prev) {
            prev.hidden = false;
            $('imSharePreviewImg').src = selected.cover;
            $('imSharePreviewTitle').textContent = selected.title;
            $('imSharePreviewMeta').textContent = selected.meta;
        }
        if (btn) btn.disabled = false;
        renderGrid(($('imShareSearch') || {}).value || '');
    }

    function reset() {
        selected = null;
        var prev = $('imSharePreview');
        if (prev) prev.hidden = true;
        var btn = $('imShareSendBtn');
        if (btn) btn.disabled = true;
        var search = $('imShareSearch');
        if (search) search.value = '';
    }

    window.FL_openShareWorkModal = function () {
        reset();
        renderGrid('');
        openOvl('imShareOverlay');
    };

    function bind() {
        document.querySelectorAll('[data-close]').forEach(function (el) {
            el.addEventListener('click', function () {
                closeOvl(el.getAttribute('data-close'));
            });
        });

        var grid = $('imShareGrid');
        if (grid) {
            grid.addEventListener('click', function (e) {
                var item = e.target.closest('.im-share-item');
                if (!item) return;
                selectWork(item.getAttribute('data-id'));
            });
        }

        var search = $('imShareSearch');
        if (search) search.addEventListener('input', function () { renderGrid(search.value.trim()); });

        var send = $('imShareSendBtn');
        if (send) {
            send.addEventListener('click', function () {
                if (!selected) return;
                send.disabled = true;
                send.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 发送中…';
                setTimeout(function () {
                    if (window.FL_sendShareWorkMessage) window.FL_sendShareWorkMessage(selected);
                    closeOvl('imShareOverlay');
                    openOvl('imShareSuccessOvl');
                    send.disabled = false;
                    send.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 发送作品卡片';
                    reset();
                }, 700);
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            closeOvl('imShareOverlay');
            closeOvl('imShareSuccessOvl');
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
})();
