/**
 * 分享弹窗 · 父页内联注入后的初始化（关闭、海报预览、复制链接、分享到私信）
 */
(function (global) {
    var DM_FRIENDS = [
        { id: 'f1', name: 'Ken', handle: '@ken_film', av: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80' },
        { id: 'f2', name: 'Nova', handle: '@nova_room', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80' },
        { id: 'f3', name: 'Yuki', handle: '@yuki_shot', av: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80' },
        { id: 'f4', name: 'Mika', handle: '@mika_daily', av: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80' },
        { id: 'f5', name: 'River', handle: '@river_vlog', av: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80' },
        { id: 'f6', name: 'Sora', handle: '@sora_light', av: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80' }
    ];

    function dismissModal(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (typeof global.FL_closeStandaloneModal === 'function') {
            global.FL_closeStandaloneModal();
            return;
        }
        if (global.parent && global.parent !== global) {
            try {
                global.parent.postMessage({ type: 'goodfans-close-modal' }, '*');
                return;
            } catch (_) { /* noop */ }
        }
        if (global.history.length > 1) global.history.back();
    }

    function toast(msg) {
        if (typeof global.toast === 'function') {
            global.toast(msg);
            return;
        }
        var t = document.getElementById('flSidebarToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'flSidebarToast';
            t.style.cssText =
                'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:100070;' +
                'padding:10px 18px;border-radius:10px;background:rgba(16,18,30,0.96);' +
                'border:1px solid rgba(168,85,247,0.4);color:#fff;font-size:12px;font-weight:600;' +
                'box-shadow:0 12px 40px rgba(0,0,0,0.45);opacity:0;transition:opacity 0.2s;pointer-events:none;';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.opacity = '1';
        clearTimeout(t._hideTimer);
        t._hideTimer = setTimeout(function () { t.style.opacity = '0'; }, 2200);
    }

    function bindDismiss(host) {
        if (!host) return;
        host.querySelectorAll('.share-head .close, [data-fl-modal-dismiss]').forEach(function (el) {
            el.addEventListener('click', dismissModal);
        });
    }

    function bindPoster(host) {
        if (!host) return;
        var btn = host.querySelector('#btnPosterInline');
        var ovl = host.querySelector('#posterInlineOvl');
        var closeBtn = host.querySelector('#closePosterInline');
        if (!btn || !ovl) return;
        btn.addEventListener('click', function () {
            ovl.classList.add('show');
        });
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                ovl.classList.remove('show');
            });
        }
        ovl.addEventListener('click', function (e) {
            if (e.target === ovl) ovl.classList.remove('show');
        });
    }

    function bindCopy(host) {
        if (!host) return;
        var copyBtn = host.querySelector('.link-card .copy');
        var urlEl = host.querySelector('.link-card .url');
        if (!copyBtn || !urlEl) return;
        copyBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var text = (urlEl.textContent || '').trim();
            if (!text) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    toast('链接已复制');
                }).catch(function () {
                    toast('链接已复制（原型）');
                });
            } else {
                toast('链接已复制（原型）');
            }
        });
        host.querySelectorAll('.plat:not([data-share="dm"])').forEach(function (plat) {
            plat.addEventListener('click', function () {
                var name = (plat.querySelector('.nm') || {}).textContent || '平台';
                toast('已跳转 ' + name.trim() + '（原型）');
            });
        });
    }

    function bindShareDm(host) {
        if (!host || host._shareDmBound) return;
        var root = host.querySelector('.share-modal') ? host : document;
        var ovl = root.querySelector('#shareDmOvl') || document.getElementById('shareDmOvl');
        var listEl = root.querySelector('#shareDmList') || document.getElementById('shareDmList');
        var searchEl = root.querySelector('#shareDmSearch') || document.getElementById('shareDmSearch');
        var sendBtn = root.querySelector('#shareDmSendBtn') || document.getElementById('shareDmSendBtn');
        var selHint = root.querySelector('#shareDmSelHint') || document.getElementById('shareDmSelHint');
        var closeBtn = root.querySelector('#closeShareDm') || document.getElementById('closeShareDm');
        var openBtn = root.querySelector('#btnShareToDm') || root.querySelector('[data-share="dm"]');
        if (!ovl || !listEl || !openBtn) return;
        host._shareDmBound = true;

        var selected = {};

        function selectedNames() {
            return DM_FRIENDS.filter(function (f) { return selected[f.id]; }).map(function (f) { return f.name; });
        }

        function syncFoot() {
            var names = selectedNames();
            if (selHint) selHint.textContent = names.length ? ('已选 ' + names.length + ' 人：' + names.join('、')) : '未选择';
            if (sendBtn) sendBtn.disabled = names.length === 0;
        }

        function renderList(filter) {
            var q = (filter || '').toLowerCase().trim();
            listEl.innerHTML = DM_FRIENDS.filter(function (f) {
                return !q || f.name.toLowerCase().indexOf(q) >= 0 || f.handle.toLowerCase().indexOf(q) >= 0;
            }).map(function (f) {
                var on = selected[f.id] ? ' on' : '';
                return '<button type="button" class="share-dm-row' + on + '" data-id="' + f.id + '">' +
                    '<span class="av" style="background-image:url(\'' + f.av + '\')"></span>' +
                    '<span class="meta"><span class="nm">' + f.name + '</span><span class="sub">' + f.handle + ' · 互关</span></span>' +
                    '<span class="chk"><i class="fa-solid fa-check"></i></span>' +
                    '</button>';
            }).join('') || '<div style="padding:24px;text-align:center;color:var(--t-tertiary);font-size:12px">无匹配好友</div>';
        }

        function openDm() {
            selected = {};
            if (searchEl) searchEl.value = '';
            renderList('');
            syncFoot();
            ovl.classList.add('show');
            ovl.setAttribute('aria-hidden', 'false');
        }

        function closeDm() {
            ovl.classList.remove('show');
            ovl.setAttribute('aria-hidden', 'true');
        }

        openBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            openDm();
        });
        openBtn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDm();
            }
        });
        if (closeBtn) closeBtn.addEventListener('click', closeDm);
        ovl.addEventListener('click', function (e) {
            if (e.target === ovl) closeDm();
        });
        if (searchEl) {
            searchEl.addEventListener('input', function () {
                renderList(searchEl.value);
            });
        }
        listEl.addEventListener('click', function (e) {
            var row = e.target.closest('.share-dm-row');
            if (!row) return;
            var id = row.getAttribute('data-id');
            if (selected[id]) delete selected[id];
            else selected[id] = true;
            renderList(searchEl ? searchEl.value : '');
            syncFoot();
        });
        if (sendBtn) {
            sendBtn.addEventListener('click', function () {
                var names = selectedNames();
                if (!names.length) return;
                toast('已分享到私信：' + names.join('、'));
                closeDm();
                setTimeout(dismissModal, 280);
            });
        }
    }

    function init(host) {
        host = host || document.body;
        bindDismiss(host);
        bindPoster(host);
        bindCopy(host);
        bindShareDm(host);
    }

    global.FLShareModalInline = { init: init };

    function autoInitStandalone() {
        if (document.getElementById('flStandaloneModalRoot')) return;
        if (!document.querySelector('.share-modal')) return;
        init(document.body);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInitStandalone);
    } else {
        autoInitStandalone();
    }
})(typeof window !== 'undefined' ? window : this);
