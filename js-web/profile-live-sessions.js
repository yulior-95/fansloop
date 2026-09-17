/**
 * 个人主页 · 直播 Tab：场次列表 · 查看直播数据（H5 / Web 共用）
 */
(function (global) {
    var modal;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function toast(msg) {
        var el = document.getElementById('pfToast');
        if (el) {
            el.textContent = msg;
            el.classList.add('show');
            setTimeout(function () { el.classList.remove('show'); }, 2400);
            return;
        }
        if (global.DigitalH5Nav && global.DigitalH5Nav.toast) global.DigitalH5Nav.toast(msg);
    }

    function ensureModal() {
        if (document.getElementById('modalLiveData')) {
            modal = document.getElementById('modalLiveData');
            return;
        }
        var wrap = document.createElement('div');
        wrap.innerHTML =
            '<div class="pf-modal" id="modalLiveData" aria-hidden="true" role="dialog">' +
            '<div class="ld-panel" role="document">' +
            '<div class="ld-head">' +
            '<h2><i class="fa-solid fa-chart-column"></i> 直播数据</h2>' +
            '<button type="button" class="ld-close" data-ld-close aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="ld-body">' +
            '<div class="ld-hero">' +
            '<div class="ld-cover" id="ldCover"></div>' +
            '<div><div id="ldTitle" style="font-size:15px;font-weight:800">—</div>' +
            '<div class="sub" id="ldSub">—</div></div></div>' +
            '<div class="ld-grid">' +
            '<div class="ld-stat"><div class="k">观看人次</div><div class="v" id="ldViews">—</div></div>' +
            '<div class="ld-stat"><div class="k">峰值在线</div><div class="v" id="ldPeak">—</div></div>' +
            '<div class="ld-stat"><div class="k">直播时长</div><div class="v" id="ldDuration">—</div></div>' +
            '<div class="ld-stat"><div class="k">礼物收入</div><div class="v" id="ldGifts">—</div></div>' +
            '<div class="ld-stat"><div class="k">新增粉丝</div><div class="v" id="ldFans">—</div></div>' +
            '<div class="ld-stat"><div class="k">弹幕条数</div><div class="v" id="ldDanmaku">—</div></div>' +
            '</div></div></div></div>';
        document.body.appendChild(wrap.firstChild);
        modal = document.getElementById('modalLiveData');
        modal.querySelector('[data-ld-close]').addEventListener('click', closeModal);
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });
    }

    function openModal(item) {
        ensureModal();
        var stats = {};
        try {
            var raw = item.getAttribute('data-live-stats') || '{}';
            stats = JSON.parse(decodeURIComponent(raw));
        } catch (e) { stats = {}; }

        var cover = document.getElementById('ldCover');
        var title = item.getAttribute('data-live-title') || '直播场次';
        var sub = item.getAttribute('data-live-sub') || '';
        if (cover) {
            cover.style.backgroundImage = "url('" + esc(item.getAttribute('data-live-cover') || '') + "')";
        }
        document.getElementById('ldTitle').textContent = title;
        document.getElementById('ldSub').textContent = sub;
        document.getElementById('ldViews').textContent = stats.views || '—';
        document.getElementById('ldPeak').textContent = stats.peak || '—';
        document.getElementById('ldDuration').textContent = stats.duration || '—';
        document.getElementById('ldGifts').textContent = stats.gifts || '—';
        document.getElementById('ldFans').textContent = stats.fans || '—';
        document.getElementById('ldDanmaku').textContent = stats.danmaku || '—';

        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }

    function liveListHtml() {
        var sessions = [
            {
                id: 'ls1',
                title: '东京夜景 · 街头 Live',
                sub: '2026-05-20 20:30 开播 · 已结束',
                cover: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=600',
                duration: '1:24:08',
                chip: '单场最高',
                stats: { views: '12.4k', peak: '3.2k', duration: '1:24:08', gifts: '820 USDT', fans: '+186', danmaku: '4.1k' }
            },
            {
                id: 'ls2',
                title: '富士山日出连麦场',
                sub: '2026-05-12 06:15 开播 · 已结束',
                cover: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600',
                duration: '58:20',
                chip: '',
                stats: { views: '8.6k', peak: '2.1k', duration: '58:20', gifts: '412 USDT', fans: '+92', danmaku: '2.8k' }
            },
            {
                id: 'ls3',
                title: '胶片人像棚拍试播',
                sub: '2026-04-28 19:00 开播 · 已结束',
                cover: 'https://images.pexels.com/photos/3379949/pexels-photo-3379949.jpeg?auto=compress&cs=tinysrgb&w=600',
                duration: '42:05',
                chip: '',
                stats: { views: '5.1k', peak: '980', duration: '42:05', gifts: '156 USDT', fans: '+44', danmaku: '1.2k' }
            }
        ];
        return sessions.map(function (s) {
            return (
                '<article class="pf-live-item" data-live-id="' + esc(s.id) + '" data-live-title="' + esc(s.title) + '" ' +
                'data-live-sub="' + esc(s.sub) + '" data-live-cover="' + esc(s.cover) + '" ' +
                'data-live-stats="' + encodeURIComponent(JSON.stringify(s.stats)) + '">' +
                '<div class="thumb" style="background-image:url(\'' + esc(s.cover) + '\')">' +
                '<span class="dur">' + esc(s.duration) + '</span></div>' +
                '<div class="body">' +
                '<h4 class="title">' + esc(s.title) + '</h4>' +
                '<div class="meta">' + esc(s.sub) + '</div>' +
                '<div class="chips">' +
                '<span class="chip accent"><i class="fa-solid fa-tower-broadcast"></i> 已结束</span>' +
                (s.chip ? '<span class="chip">' + esc(s.chip) + '</span>' : '') +
                '<span class="chip"><i class="fa-solid fa-eye"></i> ' + esc(s.stats.views) + '</span>' +
                '</div>' +
                '<button type="button" class="btn-live-data" data-act="live-data"><i class="fa-solid fa-chart-column"></i> 查看直播数据</button>' +
                '</div></article>'
            );
        }).join('');
    }

    function mountList(root) {
        if (!root || root.getAttribute('data-live-mounted') === '1') return;
        root.setAttribute('data-live-mounted', '1');
        root.innerHTML = liveListHtml() +
            '<p class="pf-live-foot">直播场次数据供创作者复盘；礼物与收入明细见「创作者收入」。</p>';
        root.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-act="live-data"]');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            var item = btn.closest('.pf-live-item');
            if (item) openModal(item);
        });
    }

    function init() {
        document.querySelectorAll('.pf-live-list').forEach(mountList);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.ProfileLiveSessions = { init: init, openModal: openModal };
})(typeof window !== 'undefined' ? window : this);
