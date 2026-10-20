/**
 * WEB 设置 · 广告中心内嵌（仅切换 set-grid 右侧主栏，不离开当前设置页）
 */
(function (global) {
    var scriptsLoaded = false;
    var scriptsLoading = null;
    var openFlag = false;

    var STAGE_HTML =
        '<div id="adSettingsStage">' +
        '<section class="ad-set-view on" data-ad-view="center">' +
        '<div class="ad-web-grid"><div>' +
        '<div class="ad-hero" id="adQualBanner" hidden style="margin-bottom:12px;padding:14px;border-radius:12px;border:1px solid var(--border)"></div>' +
        '<div class="ad-hero">' +
        '<div class="row"><div class="metric"><div class="l">可用余额</div><div class="v" id="adBal">—</div></div><div class="metric"><div class="l">冻结</div><div class="v" id="adFrozen">—</div></div></div>' +
        '<div class="row" style="margin-top:12px"><div class="metric"><div class="l">投放中</div><div class="v" id="adActive">—</div></div><div class="metric"><div class="l">待审核</div><div class="v" id="adPending">—</div></div></div>' +
        '<p style="font-size:12px;color:var(--t-tertiary);margin:12px 0 0">曝光 <span id="adImp">—</span> · 点击 <span id="adClk">—</span> · 消耗 <span id="adSpend">—</span> USDT · 资质 <span id="adAdvStatus">—</span></p>' +
        '</div><div class="ad-set-actions"><button type="button" class="btn btn-primary" data-ad-go="create"><i class="fa-solid fa-plus"></i> 创建广告</button><button type="button" class="btn btn-secondary" data-ad-go="wallet"><i class="fa-solid fa-wallet"></i> 广告账户</button></div></div>' +
        '<div><div class="ad-filter"><button type="button" class="on" data-ad-filter="">全部</button><button type="button" data-ad-filter="pending_review">待审核</button><button type="button" data-ad-filter="active">投放中</button><button type="button" data-ad-filter="paused">已暂停</button><button type="button" data-ad-filter="rejected">审核拒绝</button></div><div id="adListMount"></div></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="create"><div class="set-card"><div class="body">' +
        '<div class="ad-wizard-steps" style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap"><span data-step="1" class="on">1 基础</span><span data-step="2">2 素材</span><span data-step="3">3 目标</span><span data-step="4">4 计划</span><span data-step="5">5 套餐</span><span data-step="6">6 支付</span><span data-step="7">7 提审</span></div>' +
        '<form id="adCreateForm">' +
        '<section class="ad-step-panel on" data-step="1"><div class="field" style="margin-bottom:12px"><label>广告名称</label><input class="ant-input" name="name" required style="width:100%"></div><div class="field" style="margin-bottom:12px"><label>类型</label><select class="ant-input" name="type" style="width:100%"><option>品牌曝光</option><option>直播引流</option></select></div><div class="field" style="margin-bottom:12px"><label>标题</label><input class="ant-input" name="title" style="width:100%"></div><div class="field" style="margin-bottom:12px"><label>文案</label><textarea class="ant-input" name="copy" rows="3" style="width:100%"></textarea></div><button type="button" class="btn btn-primary" data-next>下一步</button></section>' +
        '<section class="ad-step-panel" data-step="2"><p style="font-size:13px;color:var(--t-tertiary)">上传素材（原型使用默认图）</p><button type="button" data-prev>上一步</button> <button type="button" class="btn btn-primary" data-next>下一步</button></section>' +
        '<section class="ad-step-panel" data-step="3"><div class="field" style="margin-bottom:12px"><label>广告位</label><select name="slotCode" style="width:100%"><option value="feed_video">短视频信息流</option><option value="home_banner">首页 Banner</option></select></div><div class="field" style="margin-bottom:12px"><label>落地</label><select name="landingType" style="width:100%"><option value="live">直播间</option><option value="external">外链</option></select></div><div class="field" style="margin-bottom:12px"><label>链接</label><input name="landingUrl" style="width:100%"></div><button type="button" data-prev>上一步</button> <button type="button" class="btn btn-primary" data-next>下一步</button></section>' +
        '<section class="ad-step-panel" data-step="4"><div class="field" style="margin-bottom:12px"><label>开始</label><input type="datetime-local" name="startAt" style="width:100%"></div><div class="field" style="margin-bottom:12px"><label>结束</label><input type="datetime-local" name="endAt" style="width:100%"></div><div class="field" style="margin-bottom:12px"><label>地区</label><select name="region" style="width:100%"><option>全部</option></select></div><button type="button" data-prev>上一步</button> <button type="button" class="btn btn-primary" data-next>下一步</button></section>' +
        '<section class="ad-step-panel" data-step="5"><div class="field" style="margin-bottom:12px"><label>套餐</label><select name="packageId" style="width:100%"></select></div><p>应付：<strong id="adPackagePrice">—</strong></p><button type="button" data-prev>上一步</button> <button type="button" class="btn btn-primary" data-next>下一步</button></section>' +
        '<section class="ad-step-panel" data-step="6"><p style="font-size:13px">模拟支付（幂等演示）</p><button type="button" id="adPayFailDemo" class="btn btn-secondary">演示支付失败</button> <button type="button" data-prev>上一步</button> <button type="button" class="btn btn-primary" id="adMockPay">确认支付</button></section>' +
        '<section class="ad-step-panel" data-step="7"><button type="button" id="adSaveDraft" class="btn btn-secondary">存草稿</button> <button type="button" class="btn btn-primary" id="adSubmitReview">提交审核</button></section>' +
        '</form></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="detail"><div class="set-card"><div class="body"><div id="adDetailRoot"></div>' +
        '<div class="ad-set-actions"><button type="button" class="btn btn-secondary" id="adBtnStats">数据</button><button type="button" class="btn btn-secondary" id="adBtnPause">暂停</button><button type="button" class="btn btn-secondary" id="adBtnResume" hidden>恢复</button><button type="button" class="btn btn-primary" id="adBtnResubmit" hidden>修改重提</button><button type="button" class="btn btn-secondary" id="adBtnRefund" hidden>申请退款</button><button type="button" class="btn btn-secondary" id="adBtnRemove">下架</button></div></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="stats"><div class="set-card"><div class="body"><p id="adStatsNote" style="font-size:12px;color:var(--t-tertiary)"></p>' +
        '<div class="ad-web-grid" style="grid-template-columns:repeat(3,1fr)"><div class="metric"><div class="l">曝光</div><div class="v" id="stDImp">—</div></div><div class="metric"><div class="l">点击</div><div class="v" id="stDClk">—</div></div><div class="metric"><div class="l">CTR</div><div class="v" id="stDCtr">—</div></div><div class="metric"><div class="l">消耗</div><div class="v" id="stDSpend">—</div></div><div class="metric"><div class="l">转化</div><div class="v" id="stDConv">—</div></div></div></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="wallet"><div class="set-card"><div class="body">' +
        '<div class="ad-web-grid" style="grid-template-columns:repeat(2,1fr)"><div class="metric"><div class="l">可用</div><div class="v" id="wBal">—</div></div><div class="metric"><div class="l">冻结</div><div class="v" id="wFrozen">—</div></div><div class="metric"><div class="l">已消费</div><div class="v" id="wSpent">—</div></div><div class="metric"><div class="l">已退款</div><div class="v" id="wRefunded">—</div></div></div>' +
        '<button type="button" class="btn btn-primary" id="wRecharge" style="margin-top:12px">模拟充值 +500 USDT</button><div id="wFinList" style="margin-top:16px"></div></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="apply"><div class="set-card"><div class="body"><p style="font-size:13px;color:var(--t-tertiary);line-height:1.6">通过审核后可购买固定套餐并发布广告。</p>' +
        '<form id="adApplyForm"><div style="margin:12px 0"><label>主体名称</label><input name="companyName" required style="width:100%;margin-top:6px;padding:10px;border-radius:8px;border:1px solid var(--border)"></div><div style="margin:12px 0"><label>联系邮箱</label><input name="contact" type="email" required style="width:100%;margin-top:6px;padding:10px;border-radius:8px;border:1px solid var(--border)"></div><button type="submit" class="btn btn-primary">提交申请</button></form></div></div></section>' +
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
            st.textContent =
                '.page-settings .ad-hero{margin:0 0 16px}.page-settings .ad-filter{padding:0 0 12px}' +
                '.ad-web-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:20px}' +
                '@media(max-width:1000px){.ad-web-grid{grid-template-columns:1fr}}' +
                '.ad-set-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}';
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
        main.appendChild(adPanel);

        adPanel.querySelectorAll('[data-ad-go]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (global.FLAdUser) FLAdUser.adGo(btn.getAttribute('data-ad-go'));
            });
        });
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
