/**
 * 创作者主页 · Tab 内容 / 打赏榜 / 私信 / 关注 / 打赏
 */
(function (global) {
    function creatorDisplayName() {
        var h1 = document.querySelector('.cp-info-card h1');
        return (h1 && h1.textContent.trim()) || 'Luna 🌙';
    }
    function showcaseUrl(extra) {
        var q = new URLSearchParams(extra || {});
        q.set('name', creatorDisplayName());
        q.set('from', 'profile');
        return 'creator-showcase.html?' + q.toString();
    }
    function goShowcase(extra) {
        location.href = showcaseUrl(extra);
    }
    var TAB_CONTENT = {
        works: [
            { cover: 'photo-1490806843957-31f4c9a91c65', top: '<i class="fa-solid fa-image"></i> 9 张', title: '富士山五合目 · 零下 4℃ 的清晨', meta: '<span><i class="fa-regular fa-heart"></i> 2.4K</span><span><i class="fa-regular fa-comment"></i> 186</span>' },
            { cover: 'photo-1497636577773-f1231844b336', top: '<i class="fa-solid fa-image"></i> 12 张', title: '京都祇园 · 樱花季的清晨长卷', meta: '<span><i class="fa-regular fa-heart"></i> 1.8K</span>' },
            { cover: 'photo-1514933651103-005eec06c04b', top: '<i class="fa-solid fa-image"></i> 6 张', title: '东京地铁里的色彩与故事', meta: '<span><i class="fa-regular fa-heart"></i> 1.2K</span>' },
            { cover: 'photo-1493612276216-ee3925520721', top: '<i class="fa-solid fa-image"></i> 4 张', title: '五合目咖啡馆地图与心情', meta: '<span><i class="fa-regular fa-eye"></i> 860</span>' },
            { cover: 'photo-1506905925346-21bda4d32df4', top: '<i class="fa-solid fa-image"></i> 8 张', title: '河口湖晨雾与胶片质感', meta: '<span><i class="fa-regular fa-heart"></i> 940</span>' },
            { cover: 'photo-1469474968028-56623f02e42e', top: '<i class="fa-solid fa-image"></i> 11 张', title: '箱根温泉街 · 雨夜霓虹', meta: '<span><i class="fa-regular fa-heart"></i> 1.1K</span>' }
        ],
        videos: [
            { cover: 'photo-1542642745-f03d8e3aa54c', top: '<i class="fa-solid fa-video"></i> 4:32', title: '凌晨登顶富士山 vlog 全记录', meta: '<span><i class="fa-regular fa-eye"></i> 18.2K</span>' },
            { cover: 'photo-1492684223066-81342ee5ff30', top: '<i class="fa-solid fa-video"></i> 8:15', title: '京都和服街拍 · 幕后调色流程', meta: '<span><i class="fa-regular fa-eye"></i> 9.6K</span>' },
            { cover: 'photo-1516035069371-29a1b244cc32', top: '<i class="fa-solid fa-video"></i> 12:04', title: '暗房冲洗实录 · 银盐显影', meta: '<span><i class="fa-regular fa-eye"></i> 6.3K</span>' },
            { cover: 'photo-1527482790814-241124f1c40f', top: '<i class="fa-solid fa-video"></i> 6:48', title: '旅行背包里有什么 · 器材分享', meta: '<span><i class="fa-regular fa-eye"></i> 4.8K</span>' }
        ],
        exclusive: [
            { cover: 'photo-1542435503-956c469947f6', title: '银盐时代 · 暗房工作流详解', meta: '<span><i class="fa-solid fa-image"></i> 24 张</span>', locked: true },
            { cover: 'photo-1551763150-a3b62f3c4b50', title: '月度合辑 · 4 月精选 24 张', meta: '<span><i class="fa-solid fa-image"></i> 24 张</span>', locked: true },
            { cover: 'photo-1493976040374-85c8e12f0c0e', title: '订阅者专属 · RAW 原片包', meta: '<span><i class="fa-solid fa-file-zipper"></i> 1.2 GB</span>', locked: true },
            { cover: 'photo-1500648767791-00dcc994a43e', title: '幕后花絮 · 富士山露营 48h', meta: '<span><i class="fa-solid fa-video"></i> 22:10</span>', locked: true },
            { cover: 'photo-1438761681033-6461ffad8d80', title: '会员问答整理 · 四月刊', meta: '<span><i class="fa-solid fa-file-lines"></i> 18 页</span>', locked: true },
            { cover: 'photo-1534528741775-53994a69daeb', title: '限定壁纸 · 樱花季 4K', meta: '<span><i class="fa-solid fa-image"></i> 6 张</span>', locked: true }
        ]
    };

    var TIP_RANK_FULL = [
        { rank: 1, name: 'WhaleX', av: 'photo-1500648767791-00dcc994a43e', amount: 1200, sub: '本月 12 次打赏' },
        { rank: 2, name: 'BlockTrader', av: 'photo-1535713875002-d1d0cf377fde', amount: 412, sub: '直播礼物为主' },
        { rank: 3, name: 'Aria', av: 'photo-1438761681033-6461ffad8d80', amount: 188, sub: '动态打赏' },
        { rank: 4, name: 'NeoMaster', av: 'photo-1599566150163-29194dcaad36', amount: 156, sub: '新订阅者' },
        { rank: 5, name: 'Maya', av: 'photo-1502685104226-ee32379fefbe', amount: 98, sub: '直播弹幕礼物' },
        { rank: 6, name: 'Echo', av: 'photo-1517841905240-472988babdf9', amount: 72, sub: '年付会员' },
        { rank: 7, name: 'LensFan', av: 'photo-1527980965255-d3b416303d12', amount: 55, sub: '作品打赏' },
        { rank: 8, name: 'CloudNine', av: 'photo-1544005313-94ddf0286df2', amount: 40, sub: '动态打赏' },
        { rank: 9, name: 'StreetCat', av: 'photo-1507003211169-0a1dd7228f2d', amount: 28, sub: '直播礼物' },
        { rank: 10, name: 'NightOwl', av: 'photo-1494790108377-be9c29b29330', amount: 18, sub: '首次打赏' }
    ];

    function getCreatorName() {
        var h1 = document.querySelector('.cp-info-card .info h1');
        if (!h1) return 'Luna 🌙';
        var clone = h1.cloneNode(true);
        clone.querySelectorAll('.cp-tags-row, .cp-av-badge').forEach(function (n) { n.remove(); });
        return (clone.textContent || 'Luna 🌙').trim();
    }

    function toast(msg) {
        if (typeof global.toast === 'function') {
            global.toast(msg);
            return;
        }
        if (typeof global.alert === 'function') global.alert(msg);
    }

    function esc(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }

    function renderWorkGrid(items, opts) {
        opts = opts || {};
        if (!items.length) {
            return '<div class="cp-tab-empty"><i class="fa-regular fa-folder-open" style="font-size:28px;display:block;margin-bottom:10px;opacity:0.5"></i>暂无内容</div>';
        }
        var html = '<div class="work-grid">';
        items.forEach(function (item) {
            var top = item.top || (item.locked ? '<i class="fa-solid fa-lock"></i> 会员' : '<i class="fa-solid fa-image"></i>');
            var topCls = item.locked ? ' paid' : '';
            var mask = item.locked
                ? '<div class="paid-mask"><div class="lk"><i class="fa-solid fa-crown"></i></div><div class="tx">订阅可见</div></div>'
                : '';
            html += '<div class="work" role="button" tabindex="0" data-work-title="' + esc(item.title) + '">' +
                '<div class="cv" style="background-image:url(\'https://images.unsplash.com/' + item.cover + '?w=600\')">' +
                mask +
                '<div class="top' + topCls + '">' + top + '</div>' +
                '<div class="bot"><div class="ti">' + esc(item.title) + '</div>' +
                (item.meta ? '<div class="met">' + item.meta + '</div>' : '') +
                '</div></div></div>';
        });
        html += '</div>';
        return html;
    }

    function openWorkDetail(tabId, item) {
        var from = 'creator-profile.html';
        var url;
        if (item && item.locked) {
            url = 'proto-discover-detail-paid-teaser.html';
        } else if (tabId === 'videos') {
            url = 'proto-discover-detail-video.html';
        } else {
            url = 'proto-discover-detail-image.html';
        }
        url += '?from=' + encodeURIComponent(from);
        if (item && item.title) url += '&title=' + encodeURIComponent(item.title);
        location.href = url;
    }

    function renderStoreTab(panel) {
        /* legacy no-op: store merged into showcase */
        renderShowcaseTab(panel);
    }

    function renderShowcaseTab(panel) {
        var Dig = global.DigitalAssetsStore;
        var Aff = global.AffiliateShowcaseStore;
        var Pages = global.DigitalAssetPages;
        if (!Dig || !Aff) {
            panel.innerHTML = '<div class="cp-tab-empty">橱窗模块未加载</div>';
            return;
        }
        var digList = Dig.list({ creatorId: Dig.DEMO_CREATOR, listedOnly: true });
        var affList = Aff.listShowcase(Aff.DEMO_CREATOR);
        var cnt = document.getElementById('cpShowcaseCnt');
        if (cnt) cnt.textContent = String(digList.length + affList.length);

        var html = '<div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
            '<span style="font-size:12px;color:var(--t-tertiary)">数字资产 ' + digList.length + ' · 实体推广 ' + affList.length + '</span>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<a class="btn btn-primary btn-sm" href="' + showcaseUrl() + '">进入完整橱窗</a>' +
            '</div></div>';

        if (digList.length) {
            html += '<div style="font-size:12px;font-weight:700;color:var(--t-secondary);margin:8px 0">数字资产</div>';
            html += '<div class="da-grid" id="cpShowcaseDaGrid">' + digList.slice(0, 4).map(function (p) {
                return Pages && Pages.cardHtml ? Pages.cardHtml(p) : '';
            }).join('') + '</div>';
        }
        if (affList.length && global.AffiliateCommercePages) {
            html += '<div style="font-size:12px;font-weight:700;color:var(--t-secondary);margin:16px 0 8px">实体推广</div>';
            html += global.AffiliateCommercePages.renderShowcaseList(affList.slice(0, 3), { compact: true });
        }
        if (!digList.length && !affList.length) {
            html += '<div class="cp-tab-empty">橱窗暂无商品</div>';
        }
        panel.innerHTML = html;
        var daGrid = panel.querySelector('#cpShowcaseDaGrid');
        if (daGrid && Pages && Pages.bindCards) Pages.bindCards(daGrid);
        else if (daGrid && Pages) {
            /* bindCards may be private — open via card click fallback */
            Array.prototype.forEach.call(daGrid.querySelectorAll('.da-card'), function (card) {
                card.addEventListener('click', function () {
                    var id = card.getAttribute('data-id');
                    if (global.DigitalAssetCommerceModal) {
                        global.DigitalAssetCommerceModal.openDetail(id);
                    } else {
                        location.href = showcaseUrl() + '&open=' + encodeURIComponent(id);
                    }
                });
            });
        }
        panel.querySelectorAll('.da-card').forEach(function (card) {
            card.addEventListener('click', function () {
                location.href = 'digital-asset-detail.html?id=' + encodeURIComponent(card.getAttribute('data-id'));
            });
        });
        if (global.AffiliateCommercePages && global.AffiliateCommercePages.bindShowcaseActions) {
            global.AffiliateCommercePages.bindShowcaseActions(panel);
        }
    }

    function renderTabPanel(tabId) {
        var panel = document.querySelector('[data-cp-panel="' + tabId + '"]');
        if (!panel) return;
        if (tabId === 'store' || tabId === 'showcase') {
            renderShowcaseTab(panel);
            return;
        }
        var items = TAB_CONTENT[tabId] || [];
        panel.innerHTML = renderWorkGrid(items);
        panel.querySelectorAll('.work').forEach(function (el, idx) {
            el.addEventListener('click', function () {
                openWorkDetail(tabId, items[idx]);
            });
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    el.click();
                }
            });
        });
    }

    function switchTab(tabId) {
        document.querySelectorAll('#cpTabs .tt').forEach(function (tt) {
            var active = tt.getAttribute('data-cp-tab') === tabId;
            tt.classList.toggle('active', active);
            tt.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        document.querySelectorAll('.cp-tab-panel').forEach(function (p) {
            p.classList.toggle('active', p.getAttribute('data-cp-panel') === tabId);
        });
        renderTabPanel(tabId);
    }

    function rankClass(rank) {
        if (rank === 1) return 'gold';
        if (rank === 2) return 'silver';
        if (rank === 3) return 'bronze';
        return '';
    }

    function renderTipRankList() {
        var list = document.getElementById('cpTipRankList');
        if (!list) return;
        list.innerHTML = TIP_RANK_FULL.map(function (row) {
            return '<div class="cp-tip-rank-row">' +
                '<span class="rk ' + rankClass(row.rank) + '">' + String(row.rank).padStart(2, '0') + '</span>' +
                '<div class="av" style="background-image:url(\'https://images.unsplash.com/' + row.av + '?w=80\')"></div>' +
                '<div class="meta"><div class="nm">' + esc(row.name) + '</div><div class="sub">' + esc(row.sub) + '</div></div>' +
                '<div class="am">' + row.amount + ' USDT</div>' +
                '</div>';
        }).join('');
    }

    function openTipRankOverlay() {
        var ovl = document.getElementById('ovlCpTipRank');
        if (!ovl) return;
        renderTipRankList();
        ovl.classList.add('show');
        ovl.setAttribute('aria-hidden', 'false');
    }

    function closeTipRankOverlay() {
        var ovl = document.getElementById('ovlCpTipRank');
        if (!ovl) return;
        ovl.classList.remove('show');
        ovl.setAttribute('aria-hidden', 'true');
    }

    function refreshCommerceCounts() {
        var Store = global.DigitalAssetsStore;
        var Aff = global.AffiliateShowcaseStore;
        var cntA = document.getElementById('cpShowcaseCnt');
        if (!cntA) return;
        var dig = Store ? Store.list({ creatorId: Store.DEMO_CREATOR, listedOnly: true }).length : 0;
        var aff = Aff ? Aff.listShowcase(Aff.DEMO_CREATOR).length : 0;
        cntA.textContent = String(dig + aff);
    }

    function initTabs() {
        if (!document.getElementById('cpTabs')) return;
        refreshCommerceCounts();
        renderTabPanel('works');
        document.querySelectorAll('#cpTabs .tt').forEach(function (tt) {
            tt.addEventListener('click', function () {
                switchTab(tt.getAttribute('data-cp-tab'));
            });
            tt.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    switchTab(tt.getAttribute('data-cp-tab'));
                }
            });
        });
        var entry = document.getElementById('cpShowcaseEntry');
        if (entry) {
            entry.addEventListener('click', function () { goShowcase(); });
            entry.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goShowcase();
                }
            });
        }
        var btnShowcase = document.getElementById('cpBtnShowcase');
        if (btnShowcase) btnShowcase.addEventListener('click', function () { goShowcase(); });
        var asideBtn = document.getElementById('cpAsideShowcaseBtn');
        if (asideBtn) asideBtn.addEventListener('click', function () { goShowcase(); });
        try {
            var tab = new URLSearchParams(location.search).get('tab');
            if (tab === 'store' || tab === 'showcase') switchTab('showcase');
        } catch (e) { /* ignore */ }
    }

    function initTipRank() {
        var btn = document.getElementById('btnCpTipRankFull');
        if (btn) btn.addEventListener('click', openTipRankOverlay);
        var closeBtn = document.getElementById('closeCpTipRank');
        var okBtn = document.getElementById('btnCpTipRankClose');
        if (closeBtn) closeBtn.addEventListener('click', closeTipRankOverlay);
        if (okBtn) okBtn.addEventListener('click', closeTipRankOverlay);
        var ovl = document.getElementById('ovlCpTipRank');
        if (ovl) {
            ovl.addEventListener('click', function (e) {
                if (e.target === ovl) closeTipRankOverlay();
            });
        }
    }

    function initCreatorLevel() {
        var store = global.CreatorLevelStore;
        var badge = document.getElementById('cpCreatorLevelBadge');
        var textEl = document.getElementById('cpCreatorLevelText');
        if (!store || !badge || !textEl) return;

        var name = getCreatorName();
        var badgeData = store.getCreatorBadge(name);
        textEl.textContent = badgeData.badgeText;

        function renderLevelModal() {
            var body = document.getElementById('cpCreatorLevelBody');
            if (!body) return;
            var b = store.getCreatorBadge(name);
            var p = b.progress;
            var w = store.WEEKLY_SCORE_WEIGHTS;
            var weekly = b.rankBoard.find(function (row) { return row.id === store.resolveCreatorKey(name); });
            var wk = weekly ? weekly.weekly : null;

            var tierRows = store.LEVEL_TIERS.map(function (t) {
                var cls = t.level === b.level ? ' class="is-current"' : '';
                return '<tr' + cls + '><td>LV ' + t.level + '</td><td>' + t.label + '</td><td>' + t.minSubs + '+</td><td>' + t.minMonthlyUsdt + '+</td><td>' + t.minWorks + '+</td><td>' + t.creatorSplit + '%</td></tr>';
            }).join('');

            var missingHtml = p.next && p.missing.length
                ? '<ul>' + p.missing.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ul>'
                : '<p style="color:var(--success-light)">已达当前最高可升档位（原型演示最高 LV ' + b.level + '）</p>';

            body.innerHTML =
                '<p style="margin:0 0 10px;color:var(--t-tertiary);font-size:11.5px">与粉丝订阅周期（月/季/年付）、评论区粉丝 LV 无关 · 影响平台分成比例</p>' +
                '<div class="cp-level-stat-grid">' +
                    '<div class="cp-level-stat"><div class="k">当前等级</div><div class="v">LV ' + b.level + ' · ' + b.levelLabel + '</div></div>' +
                    '<div class="cp-level-stat"><div class="k">创作者实得</div><div class="v">' + b.creatorSplit + '%</div></div>' +
                    '<div class="cp-level-stat"><div class="k">周榜排名</div><div class="v">TOP ' + b.rank + ' / ' + b.rankTotal + '</div></div>' +
                    '<div class="cp-level-stat"><div class="k">本周热度分</div><div class="v">' + b.rankScore + '</div></div>' +
                '</div>' +
                '<h4>升级进度' + (p.next ? ' → LV ' + p.next.level + ' ' + p.next.label : '') + '</h4>' +
                (p.next ? '<div class="cp-level-progress"><span style="width:' + p.progressPct + '%"></span></div><p style="font-size:11px;color:var(--t-tertiary)">综合完成度 ' + p.progressPct + '%</p>' + missingHtml : missingHtml) +
                '<h4>等级规则（满足全部条件方可升档）</h4>' +
                '<ul>' +
                    '<li>活跃订阅者数、本月创作者收入（USDT）、作品总数</li>' +
                    '<li>LV7 起需完成身份认证</li>' +
                    '<li>等级越高，平台抽成越低（实得比例越高）</li>' +
                '</ul>' +
                '<table class="cp-level-tier-table"><thead><tr><th>LV</th><th>称号</th><th>订阅</th><th>月收入</th><th>作品</th><th>实得</th></tr></thead><tbody>' + tierRows + '</tbody></table>' +
                '<h4>周榜计分（近 7 日 · 每周一 UTC 0:00 重置）</h4>' +
                '<p>热度分 = 新订阅×' + w.newSubs + ' + 打赏 USDT×' + w.tipsUsdt + ' + 互动(赞+评)×' + w.engagement + ' + 直播分钟×' + w.liveMinutes + ' + 发帖×' + w.posts + '</p>' +
                (wk ? '<p style="font-size:11px;color:var(--t-tertiary)">Luna 本周：新订阅 ' + wk.newSubs + ' · 打赏 ' + wk.tipsUsdt + ' USDT · 互动 ' + wk.engagement + ' · 直播 ' + wk.liveMinutes + ' 分钟 · 发帖 ' + wk.posts + '</p>' : '');
        }

        function openLevelModal() {
            renderLevelModal();
            var ovl = document.getElementById('ovlCpCreatorLevel');
            if (ovl) {
                ovl.classList.add('show');
                ovl.setAttribute('aria-hidden', 'false');
            }
        }

        function closeLevelModal() {
            var ovl = document.getElementById('ovlCpCreatorLevel');
            if (ovl) {
                ovl.classList.remove('show');
                ovl.setAttribute('aria-hidden', 'true');
            }
        }

        badge.addEventListener('click', openLevelModal);
        badge.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLevelModal();
            }
        });
        var closeBtn = document.getElementById('closeCpCreatorLevel');
        var okBtn = document.getElementById('btnCpCreatorLevelClose');
        if (closeBtn) closeBtn.addEventListener('click', closeLevelModal);
        if (okBtn) okBtn.addEventListener('click', closeLevelModal);
        var ovl = document.getElementById('ovlCpCreatorLevel');
        if (ovl) {
            ovl.addEventListener('click', function (e) {
                if (e.target === ovl) closeLevelModal();
            });
        }

        return badgeData;
    }

    function init() {
        var levelData = initCreatorLevel();
        initTabs();
        initTipRank();

        var btnDm = document.getElementById('cpBtnDm');
        if (btnDm) {
            btnDm.addEventListener('click', function () {
                var name = getCreatorName();
                location.href = 'messages.html?peer=' + encodeURIComponent(name) + '&from=profile&tab=dm';
            });
        }

        var btnFollow = document.getElementById('cpBtnFollow');
        if (btnFollow) {
            btnFollow.addEventListener('click', function () {
                var followed = btnFollow.classList.toggle('is-followed');
                var icon = btnFollow.querySelector('i');
                var label = btnFollow.querySelector('span');
                if (icon) icon.className = followed ? 'fa-solid fa-bell' : 'fa-regular fa-bell';
                if (label) label.textContent = followed ? '已关注' : '关注';
            });
        }

        var btnTip = document.getElementById('cpBtnTip');
        if (btnTip && global.FL_buildGiftModalUrl) {
            var lv = levelData && levelData.level ? String(levelData.level) : '7';
            var giftUrl = global.FL_buildGiftModalUrl({
                ctx: 'profile',
                creator: getCreatorName(),
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
                tags: '摄影师 · 旅行',
                lv: lv
            });
            btnTip.setAttribute('data-gift-url', giftUrl);
            btnTip.addEventListener('click', function () {
                if (typeof global.FL_openGiftModal === 'function') {
                    global.FL_openGiftModal(btnTip);
                    return;
                }
                if (typeof global.FL_openInteractionModal === 'function') {
                    global.FL_openInteractionModal(giftUrl);
                    return;
                }
                global.location.href = giftUrl;
            });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})(typeof window !== 'undefined' ? window : this);
