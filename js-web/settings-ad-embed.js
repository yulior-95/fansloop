/**
 * WEB 设置 · 广告中心内嵌（仅切换 set-grid 右侧主栏，不离开当前设置页）
 */
(function (global) {
    var scriptsLoaded = false;
    var scriptsLoading = null;
    var openFlag = false;
    var AD_STAGE_REV = 5;

    function bindAdGoButtons(root) {
        (root || document).querySelectorAll('[data-ad-go]').forEach(function (btn) {
            if (btn.getAttribute('data-ad-go-bound') === '1') return;
            btn.setAttribute('data-ad-go-bound', '1');
            btn.addEventListener('click', function () {
                if (global.FLAdUser) FLAdUser.adGo(btn.getAttribute('data-ad-go'));
            });
        });
    }

    function ensureStageMarkup() {
        var adPanel = document.getElementById('settingsAdPanel');
        if (!adPanel) return;
        if (adPanel.getAttribute('data-stage-rev') === String(AD_STAGE_REV)) return;
        adPanel.innerHTML = STAGE_HTML;
        adPanel.setAttribute('data-stage-rev', String(AD_STAGE_REV));
        bindAdGoButtons(adPanel);
    }

    var STAGE_HTML =
        '<div id="adSettingsStage">' +
        '<section class="ad-set-view on" data-ad-view="center">' +
        '<div class="ad-center-wrap">' +
        '<div class="ad-center-head">' +
        '<div class="ad-center-role" id="adRoleStrip"></div>' +
        '<div class="ad-center-toolbar" id="adCenterToolbar">' +
        '<button type="button" class="btn btn-primary" id="adBtnCreate"><i class="fa-solid fa-plus"></i> 创建广告</button>' +
        '<button type="button" class="btn btn-secondary" id="adBtnWallet" data-ad-go="wallet"><i class="fa-solid fa-wallet"></i> 广告账户</button>' +
        '<button type="button" class="btn btn-secondary" id="adBtnApplyQual" data-ad-go="apply" hidden><i class="fa-solid fa-id-card"></i> 申请广告主</button>' +
        '</div></div>' +
        '<div class="ad-hero ad-qual-banner" id="adQualBanner" hidden></div>' +
        '<div class="ad-web-grid">' +
        '<div class="ad-card ad-center-panel ad-overview" id="adCenterOverview">' +
        '<div class="ad-overview-top"><h3 class="ad-overview-title">账户与投放</h3><button type="button" class="btn btn-ghost btn-sm ad-overview-link" data-ad-go="wallet">账户明细</button></div>' +
        '<div class="ad-overview-hero">' +
        '<div class="ad-overview-hero-label">可用余额</div>' +
        '<div class="ad-overview-hero-row"><span class="ad-overview-hero-value" id="adBal">—</span><span class="ad-overview-hero-unit">USDT</span></div>' +
        '<div class="ad-overview-hero-meta">冻结 <strong id="adFrozen">—</strong> USDT</div>' +
        '</div>' +
        '<div class="ad-overview-chips">' +
        '<div class="ad-overview-chip"><span class="chip-val" id="adActive">—</span><span class="chip-lbl">投放中</span></div>' +
        '<div class="ad-overview-chip"><span class="chip-val" id="adPending">—</span><span class="chip-lbl">待审核</span></div>' +
        '<div class="ad-overview-chip"><span class="chip-val" id="adPendingPay">—</span><span class="chip-lbl">待支付</span></div>' +
        '</div>' +
        '<div class="ad-overview-perf">' +
        '<div class="perf-col"><span class="perf-num" id="adImp">—</span><span class="perf-lbl">曝光</span></div>' +
        '<div class="perf-col"><span class="perf-num" id="adClk">—</span><span class="perf-lbl">点击</span></div>' +
        '<div class="perf-col"><span class="perf-num" id="adSpend">—</span><span class="perf-lbl">消耗 USDT</span></div>' +
        '</div></div>' +
        '<div class="ad-card ad-center-panel ad-center-panel--list">' +
        '<h3 class="ad-panel-title">我的广告</h3>' +
        '<div class="ad-filter"><button type="button" class="on" data-ad-filter="">全部</button><button type="button" data-ad-filter="unpaid">待支付</button><button type="button" data-ad-filter="pending_review">待审核</button><button type="button" data-ad-filter="active">投放中</button><button type="button" data-ad-filter="paused">已暂停</button><button type="button" data-ad-filter="rejected">审核拒绝</button></div>' +
        '<div id="adListMount"></div></div></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="create"><div class="set-card ad-set-card"><div class="ssh"><div class="ic-circle"><i class="fa-solid fa-bullhorn"></i></div><div><h3>创建广告</h3></div></div><div class="body">' +
        '<div class="ad-wizard-steps"><span data-step="1" class="on">1 基础</span><span data-step="2">2 素材</span><span data-step="3">3 目标</span><span data-step="4">4 计划</span><span data-step="5">5 套餐</span><span data-step="6">6 支付</span><span data-step="7">7 提审</span></div>' +
        '<form id="adCreateForm" class="ad-form">' +
        '<section class="ad-step-panel on" data-step="1">' +
        '<div class="ad-field"><label for="adFName">广告名称</label><input id="adFName" name="name" required placeholder="内部识别用"></div>' +
        '<div class="ad-field"><label for="adFType">类型</label><select id="adFType" name="type"><option>品牌曝光</option><option>直播引流</option></select></div>' +
        '<div class="ad-field"><label for="adFTitle">标题</label><input id="adFTitle" name="title" placeholder="对外展示标题"></div>' +
        '<div class="ad-field"><label for="adFCopy">文案</label><textarea id="adFCopy" name="copy" rows="3" placeholder="补充说明"></textarea></div>' +
        '<div class="ad-step-actions"><button type="button" class="btn btn-primary" data-next>下一步</button></div></section>' +
        '<section class="ad-step-panel" data-step="2"><p class="ad-muted">上传素材（原型使用默认图）</p><div class="ad-step-actions"><button type="button" class="btn btn-secondary" data-prev>上一步</button><button type="button" class="btn btn-primary" data-next>下一步</button></div></section>' +
        '<section class="ad-step-panel" data-step="3">' +
        '<div class="ad-field"><label for="adFSlot">广告位</label><select id="adFSlot" name="slotCode"><option value="feed_video">短视频信息流</option><option value="home_banner">首页 Banner</option></select></div>' +
        '<div class="ad-field"><label for="adFLanding">落地</label><select id="adFLanding" name="landingType"><option value="live">直播间</option><option value="external">外链</option></select></div>' +
        '<div class="ad-field"><label for="adFUrl">链接</label><input id="adFUrl" name="landingUrl" placeholder="https://"></div>' +
        '<div class="ad-step-actions"><button type="button" class="btn btn-secondary" data-prev>上一步</button><button type="button" class="btn btn-primary" data-next>下一步</button></div></section>' +
        '<section class="ad-step-panel" data-step="4">' +
        '<div class="ad-field"><label for="adFStart">开始</label><input id="adFStart" type="datetime-local" name="startAt"></div>' +
        '<div class="ad-field"><label for="adFEnd">结束</label><input id="adFEnd" type="datetime-local" name="endAt" readonly title="由套餐天数自动计算"></div>' +
        '<p class="ad-muted" id="adScheduleHint">在第 5 步选择套餐后，结束时间 = 开始 + 套餐天数</p>' +
        '<div class="ad-field"><label for="adFRegion">地区</label><select id="adFRegion" name="region"><option>全部</option></select></div>' +
        '<div class="ad-step-actions"><button type="button" class="btn btn-secondary" data-prev>上一步</button><button type="button" class="btn btn-primary" data-next>下一步</button></div></section>' +
        '<section class="ad-step-panel" data-step="5">' +
        '<div class="ad-field"><label for="adFPkg">套餐</label><select id="adFPkg" name="packageId"></select></div>' +
        '<p class="ad-muted">应付 <strong id="adPackagePrice">—</strong></p>' +
        '<div class="ad-step-actions"><button type="button" class="btn btn-secondary" data-prev>上一步</button><button type="button" class="btn btn-primary" data-next>下一步</button></div></section>' +
        '<section class="ad-step-panel" data-step="6"><p class="ad-muted">模拟支付（幂等演示）</p><div class="ad-step-actions"><button type="button" id="adPayFailDemo" class="btn btn-secondary">演示支付失败</button><button type="button" class="btn btn-secondary" data-prev>上一步</button><button type="button" class="btn btn-primary" id="adMockPay">确认支付</button></div></section>' +
        '<section class="ad-step-panel" data-step="7"><div class="ad-step-actions"><button type="button" id="adSaveDraft" class="btn btn-secondary">存草稿</button><button type="button" class="btn btn-primary" id="adSubmitReview">提交审核</button></div></section>' +
        '</form></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="detail"><div class="set-card ad-set-card"><div class="ssh"><div class="ic-circle"><i class="fa-solid fa-rectangle-ad"></i></div><div><h3>广告详情</h3></div></div><div class="body"><div id="adDetailRoot"></div>' +
        '<div class="ad-set-actions"><button type="button" class="btn btn-secondary" id="adBtnStats">数据</button><button type="button" class="btn btn-secondary" id="adBtnPause">暂停</button><button type="button" class="btn btn-secondary" id="adBtnResume" hidden>恢复</button><button type="button" class="btn btn-primary" id="adBtnResubmit" hidden>修改重提</button><button type="button" class="btn btn-secondary" id="adBtnRefund" hidden>申请退款</button><button type="button" class="btn btn-secondary" id="adBtnRemove">下架</button></div></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="stats"><div class="set-card ad-set-card"><div class="ssh"><div class="ic-circle"><i class="fa-solid fa-chart-line"></i></div><div><h3>投放数据</h3></div></div><div class="body"><p id="adStatsNote" class="ad-muted"></p>' +
        '<div class="ad-web-grid ad-web-grid--stats">' +
        '<div class="ad-stat"><span class="ad-stat-label">曝光</span><span class="ad-stat-value" id="stDImp">—</span></div>' +
        '<div class="ad-stat"><span class="ad-stat-label">点击</span><span class="ad-stat-value" id="stDClk">—</span></div>' +
        '<div class="ad-stat"><span class="ad-stat-label">CTR</span><span class="ad-stat-value" id="stDCtr">—</span></div>' +
        '<div class="ad-stat"><span class="ad-stat-label">消耗</span><span class="ad-stat-value" id="stDSpend">—</span></div>' +
        '<div class="ad-stat"><span class="ad-stat-label">转化</span><span class="ad-stat-value" id="stDConv">—</span></div>' +
        '</div></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="wallet"><div class="set-card ad-set-card"><div class="ssh"><div class="ic-circle"><i class="fa-solid fa-wallet"></i></div><div><h3>广告账户</h3></div></div><div class="body">' +
        '<div class="ad-web-grid ad-web-grid--wallet">' +
        '<div class="ad-stat"><span class="ad-stat-label">可用</span><span class="ad-stat-value" id="wBal">—</span></div>' +
        '<div class="ad-stat"><span class="ad-stat-label">冻结</span><span class="ad-stat-value" id="wFrozen">—</span></div>' +
        '<div class="ad-stat"><span class="ad-stat-label">已消费</span><span class="ad-stat-value" id="wSpent">—</span></div>' +
        '<div class="ad-stat"><span class="ad-stat-label">已退款</span><span class="ad-stat-value" id="wRefunded">—</span></div>' +
        '</div>' +
        '<div class="ad-form-actions"><button type="button" class="btn btn-primary" id="wRecharge">模拟充值 +500 USDT</button></div><div id="wFinList" style="margin-top:16px"></div></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="apply"><div class="set-card ad-set-card"><div class="ssh"><div class="ic-circle"><i class="fa-solid fa-id-card"></i></div><div><h3>申请广告主</h3></div></div><div class="body">' +
        '<form id="adApplyForm" class="ad-form">' +
        '<div class="ad-field"><label for="adApplyCompany">主体名称</label><input id="adApplyCompany" name="companyName" required placeholder="公司或品牌全称"></div>' +
        '<div class="ad-field"><label for="adApplyEmail">联系邮箱</label><input id="adApplyEmail" name="contact" type="email" required placeholder="name@company.com"></div>' +
        '<div class="ad-form-actions"><button type="submit" class="btn btn-primary">提交申请</button></div>' +
        '</form></div></div></section>' +
        '</div>';

    function scriptBase() {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            if (src.indexOf('settings-ad-embed') >= 0) {
                return src.replace(/\/js-web\/settings-ad-embed\.js.*$/, '/');
            }
        }
        return '../';
    }

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            if (document.querySelector('script[src="' + src + '"]')) {
                resolve();
                return;
            }
            var s = document.createElement('script');
            s.src = src;
            s.onload = function () { resolve(); };
            s.onerror = reject;
            document.body.appendChild(s);
        });
    }

    function ensureAssets() {
        if (!document.querySelector('link[href*="ad-system.css"]')) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = scriptBase() + 'css/ad-system.css';
            document.head.appendChild(link);
        }
        if (!document.getElementById('settings-ad-embed-styles')) {
            var st = document.createElement('style');
            st.id = 'settings-ad-embed-styles';
            st.textContent = '#settingsAdPanel{margin-bottom:8px}';
            document.head.appendChild(st);
        }
        if (!document.getElementById('adToast')) {
            var toast = document.createElement('div');
            toast.id = 'adToast';
            toast.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:8px 14px;border-radius:8px;opacity:0;transition:.2s;z-index:99';
            document.body.appendChild(toast);
            var ts = document.createElement('style');
            ts.textContent = '#adToast.show{opacity:1}';
            document.head.appendChild(ts);
        }
    }

    function ensureScripts() {
        if (scriptsLoaded) return Promise.resolve();
        if (scriptsLoading) return scriptsLoading;
        var base = scriptBase();
        scriptsLoading = loadScript(base + 'js/ad-system-store.js')
            .then(function () { return loadScript(base + 'js/ad-system-api.js'); })
            .then(function () { return loadScript(base + 'js/ad-system-user.js'); })
            .then(function () { return loadScript(base + 'js/ad-settings-shell.js'); })
            .then(function () {
                scriptsLoaded = true;
            });
        return scriptsLoading;
    }

    function getMainColumn() {
        var grid = document.querySelector('body.page-settings .set-grid');
        if (!grid) return null;
        var children = grid.children;
        for (var i = children.length - 1; i >= 0; i--) {
            if (!children[i].classList.contains('set-nav')) return children[i];
        }
        return null;
    }

    function preparePanels() {
        var main = getMainColumn();
        if (!main) return false;
        if (main.querySelector('#adSettingsStage') && !document.getElementById('settingsDefaultPanel')) {
            var existing = main.querySelector('#adSettingsStage');
            var wrap = document.createElement('div');
            wrap.id = 'settingsAdPanel';
            wrap.hidden = true;
            existing.parentNode.insertBefore(wrap, existing);
            wrap.appendChild(existing);
            return true;
        }
        if (document.getElementById('settingsDefaultPanel')) return true;

        var defaultPanel = document.createElement('div');
        defaultPanel.id = 'settingsDefaultPanel';
        while (main.firstChild) defaultPanel.appendChild(main.firstChild);
        main.appendChild(defaultPanel);

        var adPanel = document.createElement('div');
        adPanel.id = 'settingsAdPanel';
        adPanel.hidden = true;
        adPanel.innerHTML = STAGE_HTML;
        adPanel.setAttribute('data-stage-rev', String(AD_STAGE_REV));
        main.appendChild(adPanel);
        bindAdGoButtons(adPanel);
        return true;
    }

    function syncNavActive() {
        if (global.FL_applySettingsNavI18n) FL_applySettingsNavI18n();
    }

    function buildAdUrl(view, params) {
        params = params || {};
        var page = (location.pathname.split('/').pop() || 'settings.html').split('?')[0];
        var q = new URLSearchParams(location.search);
        q.set('panel', 'ad');
        if (view && view !== 'center') q.set('view', view);
        else q.delete('view');
        if (params.id) q.set('id', params.id);
        else q.delete('id');
        var s = q.toString();
        return page + (s ? '?' + s : '');
    }

    function open(view, params) {
        view = view || 'center';
        params = params || {};
        if (!document.body.classList.contains('page-settings')) {
            var sp = new URLSearchParams();
            sp.set('panel', 'ad');
            if (view !== 'center') sp.set('view', view);
            if (params.id) sp.set('id', params.id);
            location.href = 'settings.html?' + sp.toString();
            return Promise.resolve();
        }
        ensureAssets();
        if (!preparePanels()) return Promise.resolve();
        ensureStageMarkup();

        return ensureScripts().then(function () {
            document.getElementById('settingsDefaultPanel').hidden = true;
            document.getElementById('settingsAdPanel').hidden = false;
            document.body.setAttribute('data-settings-panel', 'ad');
            document.body.setAttribute('data-ad-shell', 'settings');
            openFlag = true;
            syncNavActive();
            if (global.FLAdSettings) {
                FLAdSettings.show(view, params);
            } else if (global.FLAdUser) {
                FLAdUser.bootView(view, params);
            }
            try {
                history.replaceState({ settingsAd: true, view: view, id: params.id || '' }, '', buildAdUrl(view, params));
            } catch (e) { /* file:// */ }
        });
    }

    function close() {
        if (!openFlag && !document.getElementById('settingsAdPanel')) return;
        var adPanel = document.getElementById('settingsAdPanel');
        var defaultPanel = document.getElementById('settingsDefaultPanel');
        if (adPanel) adPanel.hidden = true;
        if (defaultPanel) defaultPanel.hidden = false;
        document.body.removeAttribute('data-settings-panel');
        document.body.removeAttribute('data-ad-shell');
        openFlag = false;
        var page = (location.pathname.split('/').pop() || 'settings.html').split('?')[0];
        var q = new URLSearchParams(location.search);
        q.delete('panel');
        q.delete('view');
        q.delete('id');
        var s = q.toString();
        try {
            history.replaceState({}, '', page + (s ? '?' + s : ''));
        } catch (e) { /* file:// */ }
        syncNavActive();
    }

    function isOpen() {
        return openFlag || document.body.getAttribute('data-settings-panel') === 'ad';
    }

    function bootFromQuery() {
        if (!document.body.classList.contains('page-settings')) return;
        var sp = new URLSearchParams(location.search);
        if (sp.get('panel') !== 'ad') return;
        var view = sp.get('view') || 'center';
        var id = sp.get('id') || '';
        open(view, id ? { id: id } : {});
    }

    global.FLSettingsAdEmbed = {
        open: open,
        close: close,
        isOpen: isOpen,
        preparePanels: preparePanels
    };

    function bindAdNavItems() {
        document.querySelectorAll('.set-nav .nav-item[data-ad-nav="1"]').forEach(function (el) {
            if (el.getAttribute('data-ad-bound') === '1') return;
            el.setAttribute('data-ad-bound', '1');
            el.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                open('center', {});
            });
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open('center', {});
                }
            });
        });
    }

    document.addEventListener('settings-nav-mounted', bindAdNavItems);

    function init() {
        bindAdNavItems();
        bootFromQuery();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window);
