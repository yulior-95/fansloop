/**
 * 个人主页 · 作品 Tab：已发布/下架隔离、置顶、下架、数据看板
 */
(function () {
    const pane = document.getElementById('pane-works');
    if (!pane) return;

    const MAX_PIN = 3;
    const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

    const gridPublished = document.getElementById('worksGridPublished');
    const gridUnlisted = document.getElementById('worksGridUnlisted');
    const emptyPublished = document.getElementById('worksEmptyPublished');
    const emptyUnlisted = document.getElementById('worksEmptyUnlisted');
    const subTabs = pane.querySelectorAll('.works-subtabs button');
    const cntPublished = document.getElementById('worksCntPublished');
    const cntUnlisted = document.getElementById('worksCntUnlisted');
    const modalTakedown = document.getElementById('modalWorkTakedown');
    const modalDelete = document.getElementById('modalWorkDelete');
    const modalAnalytics = document.getElementById('modalWorkAnalytics');
    const modalTitleEl = document.getElementById('modalWorkTakedownTitle');
    const modalDeleteTitleEl = document.getElementById('modalWorkDeleteTitle');
    const toast = document.getElementById('pfToast');

    let pendingCard = null;
    let pendingDeleteCard = null;
    let currentFilter = 'published';

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2400);
    }

    function hashId(id) {
        let h = 0;
        const s = String(id || 'w0');
        for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
        return h;
    }

    function formatNum(n) {
        if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'w';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(n);
    }

    function formatPublishedAt(iso) {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '—';
        const now = Date.now();
        const diff = now - d.getTime();
        if (diff < 0) return '刚刚';

        if (diff >= THREE_MONTHS_MS) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return y + '-' + m + '-' + day;
        }

        const sec = Math.floor(diff / 1000);
        const min = Math.floor(sec / 60);
        const hr = Math.floor(min / 60);
        const days = Math.floor(hr / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);

        if (sec < 60) return '刚刚';
        if (min < 60) return min + ' 分钟前';
        if (hr < 24) return hr + ' 小时前';
        if (days < 7) return days + ' 天前';
        if (weeks < 5) return weeks + ' 周前';
        if (months < 3) return months + ' 个月前';
        const y = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        return y + '-' + mo + '-' + da;
    }

    function formatExactDateTime(iso) {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '—';
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return y + '年' + m + '月' + day + '日 ' + hh + ':' + mm;
    }

    function getCoverUrl(card) {
        const thumb = card.querySelector('.work-thumb');
        if (!thumb) return '';
        const bg = thumb.style.backgroundImage || '';
        const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
        return m ? m[1] : '';
    }

    function getAnalytics(card) {
        const raw = card.getAttribute('data-analytics');
        if (raw) {
            try {
                return JSON.parse(raw);
            } catch (e) { /* fall through */ }
        }
        const h = hashId(card.getAttribute('data-work-id'));
        return {
            plays: 4200 + (h % 48000),
            likes: 380 + (h % 4200),
            comments: 40 + (h % 520),
            shares: 12 + (h % 280),
            danmaku: 8 + (h % 190),
            completion: Number((52 + (h % 420) / 10).toFixed(1)),
            fans: 120 + (h % 1800),
            churn: 5 + (h % 120),
            fanPlayPct: Number((48 + (h % 380) / 10).toFixed(1))
        };
    }

    function getDailyPeaks(workId) {
        const h = hashId(workId);
        const days = 14;
        const peaks = [];
        for (let i = 0; i < days; i++) {
            peaks.push(80 + ((h + i * 97) % 420));
        }
        return peaks;
    }

    function renderChart(svgEl, peaks) {
        if (!svgEl) return;
        const w = 560;
        const h = 140;
        const padL = 28;
        const padR = 8;
        const padT = 8;
        const padB = 22;
        const chartW = w - padL - padR;
        const chartH = h - padT - padB;
        const max = Math.max.apply(null, peaks);
        const barW = chartW / peaks.length - 4;
        let inner = '';
        for (let g = 0; g <= 3; g++) {
            const y = padT + (chartH * g) / 3;
            inner += '<line class="grid-line" x1="' + padL + '" y1="' + y + '" x2="' + (w - padR) + '" y2="' + y + '"/>';
        }
        peaks.forEach((val, i) => {
            const bh = max ? (val / max) * chartH : 0;
            const x = padL + i * (chartW / peaks.length) + 2;
            const y = padT + chartH - bh;
            inner += '<rect class="bar" x="' + x + '" y="' + y + '" width="' + barW + '" height="' + bh + '" rx="3"><title>' + val + ' 人</title></rect>';
        });
        const labels = ['', '', '', ''];
        peaks.forEach((_, i) => {
            if (i === 0 || i === 6 || i === 13) {
                const x = padL + i * (chartW / peaks.length) + barW / 2;
                const lbl = i === 0 ? '14天前' : i === 6 ? '7天前' : '今日';
                inner += '<text class="axis" x="' + x + '" y="' + (h - 4) + '" text-anchor="middle">' + lbl + '</text>';
            }
        });
        const defs = svgEl.querySelector('defs');
        svgEl.innerHTML = (defs ? defs.outerHTML : '') + inner;
        const peakEl = document.getElementById('waChartPeak');
        if (peakEl) peakEl.textContent = '峰值 ' + formatNum(max) + ' 人/日';
    }

    function openAnalytics(card) {
        if (!modalAnalytics || !card) return;
        const iso = card.getAttribute('data-published-at') || '';
        const title = card.querySelector('.work-title');
        const stats = getAnalytics(card);
        const cover = document.getElementById('waCover');
        const titleEl = document.getElementById('waTitle');
        const dtEl = document.getElementById('waPublishedAt');

        if (cover) cover.style.backgroundImage = "url('" + getCoverUrl(card) + "')";
        if (titleEl && title) titleEl.textContent = title.textContent.trim();
        if (dtEl) dtEl.textContent = formatExactDateTime(iso);

        document.getElementById('waPlays').textContent = formatNum(stats.plays);
        document.getElementById('waLikes').textContent = formatNum(stats.likes);
        document.getElementById('waComments').textContent = formatNum(stats.comments);
        document.getElementById('waShares').textContent = formatNum(stats.shares);
        document.getElementById('waDanmaku').textContent = formatNum(stats.danmaku);
        document.getElementById('waCompletion').textContent = String(stats.completion);
        document.getElementById('waFans').textContent = formatNum(stats.fans);
        document.getElementById('waChurn').textContent = formatNum(stats.churn);
        document.getElementById('waFanPlay').textContent = String(stats.fanPlayPct);

        renderChart(document.getElementById('waChartSvg'), getDailyPeaks(card.getAttribute('data-work-id')));

        modalAnalytics.classList.add('show');
        modalAnalytics.setAttribute('aria-hidden', 'false');
    }

    function closeAnalytics() {
        if (!modalAnalytics) return;
        modalAnalytics.classList.remove('show');
        modalAnalytics.setAttribute('aria-hidden', 'true');
    }

    function refreshTimeLabels() {
        pane.querySelectorAll('.work-time[data-published-at]').forEach(el => {
            el.textContent = formatPublishedAt(el.getAttribute('data-published-at'));
        });
    }

    function countCards(grid) {
        if (!grid) return 0;
        return grid.querySelectorAll('.work-card').length;
    }

    function updateCounts() {
        const pub = countCards(gridPublished);
        const unl = countCards(gridUnlisted);
        if (cntPublished) cntPublished.textContent = String(pub);
        if (cntUnlisted) cntUnlisted.textContent = String(unl);
        const worksTabCnt = document.querySelector('#profileTabs .tb[data-pane="works"] .cnt');
        if (worksTabCnt) worksTabCnt.textContent = String(pub);
        updateEmptyStates();
    }

    function updateEmptyStates() {
        const isUnlisted = currentFilter === 'unlisted';
        const pub = countCards(gridPublished);
        const unl = countCards(gridUnlisted);
        if (emptyPublished) {
            emptyPublished.classList.toggle('works-empty--hidden', isUnlisted || pub > 0);
        }
        if (emptyUnlisted) {
            emptyUnlisted.classList.toggle('works-empty--hidden', !isUnlisted || unl > 0);
        }
    }

    function pinnedCount() {
        if (!gridPublished) return 0;
        return gridPublished.querySelectorAll('.work-card.is-pinned').length;
    }

    function syncPinButton(card) {
        const btn = card.querySelector('[data-act="pin"]');
        if (!btn) return;
        const pinned = card.classList.contains('is-pinned');
        if (pinned) {
            btn.classList.add('is-pinned-active');
            btn.innerHTML = '<i class="fa-solid fa-thumbtack"></i> 取消置顶';
        } else {
            btn.classList.remove('is-pinned-active');
            btn.innerHTML = '<i class="fa-regular fa-thumbtack"></i> 置顶';
        }
    }

    function sortPinnedFirst() {
        if (!gridPublished) return;
        const cards = Array.from(gridPublished.querySelectorAll('.work-card'));
        cards.sort((a, b) => {
            const ap = a.classList.contains('is-pinned') ? 0 : 1;
            const bp = b.classList.contains('is-pinned') ? 0 : 1;
            if (ap !== bp) return ap - bp;
            const ta = new Date(a.getAttribute('data-published-at') || 0).getTime();
            const tb = new Date(b.getAttribute('data-published-at') || 0).getTime();
            return tb - ta;
        });
        cards.forEach(c => gridPublished.appendChild(c));
    }

    function togglePin(card) {
        const wasPinned = card.classList.contains('is-pinned');
        if (!wasPinned && pinnedCount() >= MAX_PIN) {
            showToast('最多置顶 ' + MAX_PIN + ' 个作品，请先取消其他置顶');
            return;
        }
        card.classList.toggle('is-pinned', !wasPinned);
        syncPinButton(card);
        sortPinnedFirst();
        showToast(wasPinned ? '已取消置顶' : '已在创作者首页置顶');
    }

    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }

    function ensureStatsButton(card) {
        const actions = card.querySelector('.work-actions');
        if (!actions || actions.querySelector('[data-act="stats"]')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'work-act accent';
        btn.setAttribute('data-act', 'stats');
        btn.innerHTML = '<i class="fa-solid fa-chart-line"></i> 数据看板';
        actions.insertBefore(btn, actions.firstChild);
    }

    function configureCardForUnlisted(card) {
        card.classList.remove('is-pinned');
        const pinBadge = card.querySelector('.work-pin-badge');
        if (pinBadge) pinBadge.remove();
        card.querySelector('[data-act="pin"]')?.remove();
        card.querySelector('[data-act="takedown"]')?.remove();

        const actions = card.querySelector('.work-actions');
        if (!actions) return;
        actions.classList.add('work-actions--unlisted');
        ensureStatsButton(card);
        if (!actions.querySelector('[data-act="delete"]')) {
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'work-act danger-solid';
            del.setAttribute('data-act', 'delete');
            del.innerHTML = '<i class="fa-regular fa-trash-can"></i> 删除';
            actions.appendChild(del);
        }
    }

    function moveToUnlisted(card) {
        if (!gridUnlisted || !card) return;
        configureCardForUnlisted(card);
        gridUnlisted.prepend(card);
        bindCard(card);
    }

    function confirmTakedown() {
        if (!pendingCard) return;
        const title = pendingCard.querySelector('.work-title');
        moveToUnlisted(pendingCard);
        closeModal(modalTakedown);
        pendingCard = null;
        updateCounts();
        showToast('下架成功' + (title ? '：「' + title.textContent.trim() + '」' : '') + ' · 已移至「下架」');
    }

    function confirmDelete() {
        if (!pendingDeleteCard) return;
        const title = pendingDeleteCard.querySelector('.work-title');
        pendingDeleteCard.remove();
        closeModal(modalDelete);
        pendingDeleteCard = null;
        updateCounts();
        showToast('已永久删除' + (title ? '：「' + title.textContent.trim() + '」' : ''));
    }

    function bindCard(card) {
        ensureStatsButton(card);
        card.querySelectorAll('.work-act').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        card.querySelectorAll('.work-act').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const act = btn.getAttribute('data-act');
                if (act === 'stats') openAnalytics(card);
                if (act === 'pin') togglePin(card);
                if (act === 'takedown') {
                    pendingCard = card;
                    const t = card.querySelector('.work-title');
                    if (modalTitleEl && t) modalTitleEl.textContent = t.textContent.trim();
                    openModal(modalTakedown);
                }
                if (act === 'delete') {
                    pendingDeleteCard = card;
                    const t = card.querySelector('.work-title');
                    if (modalDeleteTitleEl && t) modalDeleteTitleEl.textContent = t.textContent.trim();
                    openModal(modalDelete);
                }
            });
        });
        syncPinButton(card);
    }

    function setWorksFilter(filter) {
        currentFilter = filter;
        const isUnlisted = filter === 'unlisted';

        if (gridPublished) {
            gridPublished.classList.toggle('works-grid--hidden', isUnlisted);
        }
        if (gridUnlisted) {
            gridUnlisted.classList.toggle('works-grid--hidden', !isUnlisted);
        }

        subTabs.forEach(btn => {
            const active = btn.getAttribute('data-works-filter') === filter;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        updateEmptyStates();
    }

    subTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            setWorksFilter(btn.getAttribute('data-works-filter'));
        });
    });

    pane.querySelectorAll('#worksGridPublished .work-card, #worksGridUnlisted .work-card').forEach(bindCard);

    if (modalTakedown) {
        modalTakedown.querySelector('[data-md-cancel]')?.addEventListener('click', () => {
            pendingCard = null;
            closeModal(modalTakedown);
        });
        modalTakedown.querySelector('[data-md-confirm]')?.addEventListener('click', confirmTakedown);
        modalTakedown.addEventListener('click', e => {
            if (e.target === modalTakedown) {
                pendingCard = null;
                closeModal(modalTakedown);
            }
        });
    }

    if (modalDelete) {
        modalDelete.querySelector('[data-md-cancel]')?.addEventListener('click', () => {
            pendingDeleteCard = null;
            closeModal(modalDelete);
        });
        modalDelete.querySelector('[data-md-confirm]')?.addEventListener('click', confirmDelete);
        modalDelete.addEventListener('click', e => {
            if (e.target === modalDelete) {
                pendingDeleteCard = null;
                closeModal(modalDelete);
            }
        });
    }

    if (modalAnalytics) {
        modalAnalytics.querySelector('[data-wa-close]')?.addEventListener('click', closeAnalytics);
        modalAnalytics.addEventListener('click', e => {
            if (e.target === modalAnalytics) closeAnalytics();
        });
    }

    refreshTimeLabels();
    sortPinnedFirst();
    setWorksFilter('published');
    updateCounts();

    function buildSeedCard(s) {
        const art = document.createElement('article');
        art.className = 'work-card';
        art.setAttribute('data-work-id', s.id);
        art.setAttribute('data-published-at', s.at);
        art.innerHTML =
            '<div class="work-thumb" style="background-image:url(\'' + s.img + '\')">' +
            '<div class="thumb-meta"><span><i class="fa-solid fa-heart"></i> ' + s.likes + '</span>' +
            '<span><i class="fa-regular fa-comment"></i> ' + s.comments + '</span></div></div>' +
            '<div class="work-body"><h4 class="work-title">' + s.title + '</h4>' +
            '<time class="work-time" data-published-at="' + s.at + '">—</time></div>' +
            '<div class="work-actions work-actions--unlisted"></div>';
        configureCardForUnlisted(art);
        return art;
    }

    function seedUnlistedDemo() {
        if (!gridUnlisted || countCards(gridUnlisted) > 0) return;
        [
            {
                id: 'u1',
                at: '2025-09-10T10:00:00+09:00',
                title: '旧版 Vlog 片头（已下架）',
                img: 'https://images.pexels.com/photos/3379949/pexels-photo-3379949.jpeg?auto=compress&cs=tinysrgb&w=800',
                likes: '420',
                comments: '38'
            },
            {
                id: 'u2',
                at: '2025-07-22T18:00:00+09:00',
                title: '测试直播回放剪辑',
                img: 'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=800',
                likes: '1.2k',
                comments: '56'
            }
        ].forEach(s => {
            const art = buildSeedCard(s);
            gridUnlisted.appendChild(art);
            bindCard(art);
        });
        updateCounts();
        refreshTimeLabels();
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('works') === 'unlisted') {
        if (params.get('seed') === '1') seedUnlistedDemo();
        setWorksFilter('unlisted');
    }
    if (params.get('modal') === 'takedown') {
        const first = gridPublished?.querySelector('.work-card');
        if (first) {
            pendingCard = first;
            const t = first.querySelector('.work-title');
            if (modalTitleEl && t) modalTitleEl.textContent = t.textContent.trim();
            openModal(modalTakedown);
        }
    }
    if (params.get('modal') === 'analytics') {
        const card = gridPublished?.querySelector('.work-card') || gridUnlisted?.querySelector('.work-card');
        if (card) openAnalytics(card);
    }
    if (params.get('modal') === 'delete' && params.get('works') === 'unlisted') {
        seedUnlistedDemo();
        setWorksFilter('unlisted');
        const first = gridUnlisted?.querySelector('.work-card');
        if (first) {
            pendingDeleteCard = first;
            const t = first.querySelector('.work-title');
            if (modalDeleteTitleEl && t) modalDeleteTitleEl.textContent = t.textContent.trim();
            openModal(modalDelete);
        }
    }
})();
