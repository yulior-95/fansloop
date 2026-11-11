/**
 * WEB 设置 · 广告中心内嵌（仅切换 set-grid 右侧主栏，不离开当前设置页）
 */
(function (global) {
    var scriptsLoaded = false;
    var scriptsLoading = null;
    var openFlag = false;
    var AD_STAGE_REV = 50;

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
        document.body.removeAttribute('data-wizard-bound');
        document.body.removeAttribute('data-ad-filters-bound');
        document.body.removeAttribute('data-ad-apply-bound');
    }

    var STAGE_HTML =
        '<div id="adSettingsStage">' +
        '<section class="ad-set-view on" data-ad-view="center">' +
        '<div class="ad-center-wrap">' +
        '<div class="ad-center-head">' +
        '<div class="ad-center-role" id="adRoleStrip"></div>' +
        '<div class="ad-center-toolbar" id="adCenterToolbar">' +
        '<button type="button" class="btn btn-primary" id="adBtnCreate" data-ad-create="1"><i class="fa-solid fa-plus"></i> 创建广告</button>' +
        '<button type="button" class="btn btn-secondary btn-icon ad-toolbar-notice" id="adBtnNotices" data-ad-go="notices" title="广告通知" aria-label="广告通知"><i class="fa-regular fa-bell"></i><span class="ad-nav-notice-dot" id="adNoticeDot" hidden></span></button>' +
        '<button type="button" class="btn btn-secondary" id="adBtnApplyQual" data-ad-go="apply" hidden><i class="fa-solid fa-id-card"></i> 申请广告主</button>' +
        '</div></div>' +
        '<div class="ad-hero ad-qual-banner" id="adQualBanner" hidden></div>' +
        '<div class="ad-web-grid">' +
        '<div class="ad-card ad-center-panel ad-overview" id="adCenterOverview">' +
        '<div class="ad-overview-top"><h3 class="ad-overview-title">账户与投放</h3><button type="button" class="btn btn-ghost btn-sm ad-overview-link" data-ad-go="wallet">账户明细</button></div>' +
        '<div class="ad-overview-hero">' +
        '<div class="ad-overview-bal">' +
        '<div class="ad-overview-hero-label">可用余额</div>' +
        '<div class="ad-overview-hero-row"><span class="ad-overview-hero-value" id="adBal">—</span><span class="ad-overview-hero-unit">USDT</span></div>' +
        '</div>' +
        '<div class="ad-overview-frozen">' +
        '<div class="ad-overview-hero-label">冻结</div>' +
        '<div class="ad-overview-hero-meta"><strong id="adFrozen">—</strong> <span class="ad-overview-hero-unit">USDT</span></div>' +
        '</div></div>' +
        '<div class="ad-overview-metrics">' +
        '<div class="ad-overview-chips">' +
        '<div class="ad-overview-chip"><span class="chip-val" id="adActive">—</span><span class="chip-lbl">投放中</span></div>' +
        '<div class="ad-overview-chip"><span class="chip-val" id="adPending">—</span><span class="chip-lbl">待审核</span></div>' +
        '</div>' +
        '<div class="ad-overview-perf">' +
        '<div class="perf-col"><span class="perf-num" id="adImp">—</span><span class="perf-lbl">曝光</span></div>' +
        '<div class="perf-col"><span class="perf-num" id="adClk">—</span><span class="perf-lbl">点击</span></div>' +
        '<div class="perf-col"><span class="perf-num" id="adSpend">—</span><span class="perf-lbl">消耗</span></div>' +
        '</div></div></div>' +
        '<div class="ad-card ad-center-panel ad-center-panel--list" id="adCenterListPanel">' +
        '<h3 class="ad-panel-title">我的广告</h3>' +
        '<div class="ad-filter"><button type="button" class="on" data-ad-filter="">全部</button><button type="button" data-ad-filter="pending_review">审核中</button><button type="button" data-ad-filter="pending_start">待开始</button><button type="button" data-ad-filter="active">投放中</button><button type="button" data-ad-filter="paused">已暂停</button><button type="button" data-ad-filter="ended">已结束</button><button type="button" data-ad-filter="rejected">已驳回</button></div>' +
        '<div id="adListMount"></div></div></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="create"><div class="set-card ad-set-card"><div class="ssh"><div class="ic-circle"><i class="fa-solid fa-bullhorn"></i></div><div><h3>创建广告</h3></div></div><div class="body">' +
        '<div class="ad-wizard-steps"><span data-step="1" class="on">1 基础</span><span data-step="2">2 目标</span><span data-step="3">3 素材</span><span data-step="4">4 套餐</span><span data-step="5">5 支付</span></div>' +
        '<form id="adCreateForm" class="ad-form">' +
        '<section class="ad-step-panel on" data-step="1">' +
        '<div class="ad-field"><label for="adFName">广告名称</label><input id="adFName" name="name" required placeholder="例如：春季品牌推广" autocomplete="off"></div>' +
        '<div class="ad-field"><label for="adFType">类型</label><select id="adFType" name="type" class="ad-select-native"><option value="品牌曝光">品牌曝光</option><option value="直播引流">直播引流</option></select></div>' +
        '<div class="ad-field"><label for="adFTitle">标题</label><input id="adFTitle" name="title" placeholder="例如：升级 Creator Pro" autocomplete="off"></div>' +
        '<div class="ad-step-actions"><button type="button" class="btn btn-primary" data-next>下一步</button></div></section>' +
        '<section class="ad-step-panel" data-step="2">' +
        '<div class="ad-field"><label for="adFSlot">投放位置</label><select id="adFSlot" name="slotCode" class="ad-select-native"></select></div>' +
        '<div class="ad-field ad-slot-style-preview" id="adSlotStylePreview">' +
        '<label>展示样式预览</label>' +
        '<p class="ad-muted ad-field-help">该广告位在 WEB / H5 首页的大致形态（示意，非实时素材）。</p>' +
        '<div class="ad-slot-style-grid">' +
        '<div class="ad-slot-style-card"><div class="ad-slot-style-title">H5 · 手机首页</div><div class="ad-slot-style-frame ad-slot-style-frame--h5" id="adSlotPreviewH5"></div></div>' +
        '<div class="ad-slot-style-card"><div class="ad-slot-style-title">WEB · 桌面首页</div><div class="ad-slot-style-frame ad-slot-style-frame--web" id="adSlotPreviewWeb"></div></div>' +
        '</div></div>' +
        '<div class="ad-field"><label for="adFLanding">用户点广告后去哪</label>' +
        '<select id="adFLanding" name="landingType" class="ad-select-native">' +
        '<option value="creator">进入主播主页</option>' +
        '<option value="external">打开外部网页</option>' +
        '</select>' +
        '<p class="ad-muted ad-field-help">决定观众点击广告后跳到哪里。去主页后，观众可自行进入该主播的直播间。</p></div>' +
        '<div class="ad-field" id="adLandingCreatorField">' +
        '<label for="adCreatorQuery">搜索并选择主播</label>' +
        '<div class="ad-creator-search" id="adCreatorSearch">' +
        '<div class="ad-creator-picked" id="adCreatorPicked" hidden></div>' +
        '<div class="ad-creator-input-wrap">' +
        '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
        '<input type="search" id="adCreatorQuery" placeholder="输入主播昵称搜索…" autocomplete="off" enterkeyhint="search">' +
        '</div>' +
        '<input type="hidden" id="adFCreator" name="creator" value="">' +
        '<div class="ad-creator-drop" id="adCreatorDrop" hidden role="listbox"></div>' +
        '</div>' +
        '<p class="ad-muted ad-field-help">搜索自己或旗下艺人后点选。广告只绑定主播主页，不指定具体直播场次。</p></div>' +
        '<div class="ad-field" id="adLandingUrlField" hidden>' +
        '<label for="adFUrl">网页地址</label>' +
        '<input id="adFUrl" name="landingUrl" placeholder="https://example.com" autocomplete="off">' +
        '<p class="ad-muted ad-field-help">请填写以 https:// 开头的完整网址。</p></div>' +
        '<div class="ad-step-actions"><button type="button" class="btn btn-secondary" data-prev>上一步</button><button type="button" class="btn btn-primary" data-next>下一步</button></div></section>' +
        '<section class="ad-step-panel" data-step="3">' +
        '<div class="ad-field" id="adCopyField" hidden>' +
        '<label for="adFCopy">信息流文案</label>' +
        '<textarea id="adFCopy" name="copy" rows="3" placeholder="会展示在信息流图文 / 视频贴的文案位置"></textarea>' +
        '<p class="ad-muted ad-field-help">仅短视频信息流需要；首页 Banner 不展示这段文案。</p></div>' +
        '<div class="ad-field"><label>品牌头像 / LOGO</label>' +
        '<p class="ad-muted ad-field-help" style="margin:0 0 8px">展示在信息流广告顶栏，建议正方形 JPG / PNG / WebP，边长 ≥ 200px。</p>' +
        '<div class="ad-brand-logo-row" id="adBrandLogoRow">' +
        '<div class="ad-brand-logo-preview" id="adBrandLogoPreview" aria-hidden="true"><i class="fa-regular fa-image"></i></div>' +
        '<div class="ad-brand-logo-actions">' +
        '<input type="file" id="adBrandLogoInput" accept="image/jpeg,image/png,image/webp" hidden>' +
        '<button type="button" class="btn btn-secondary btn-sm" id="adBrandLogoPick"><i class="fa-solid fa-upload"></i> 上传 LOGO</button>' +
        '<button type="button" class="btn btn-secondary btn-sm" id="adBrandLogoClear" hidden>移除</button>' +
        '<p class="ad-muted" id="adBrandLogoHint" style="font-size:12px;margin:8px 0 0">未上传时不可进入下一步</p>' +
        '</div></div></div>' +
        '<div class="ad-field"><label>广告展示内容</label>' +
        '<p class="ad-muted ad-field-help" id="adMaterialFieldHelp" style="margin:0 0 8px">观众实际看到的画面。图片可一次选多张；视频只能上传 1 个，且不可与图片混用。</p>' +
        '<div class="ad-upload-zone" id="adMaterialZone" role="button" tabindex="0" aria-label="上传广告展示内容">' +
        '<input type="file" id="adMaterialInput" class="ad-upload-input" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple hidden>' +
        '<div class="ad-upload-placeholder" id="adMaterialPlaceholder">' +
        '<span class="ad-upload-ic"><i class="fa-solid fa-cloud-arrow-up"></i></span>' +
        '<h4>点击上传展示内容</h4>' +
        '<p id="adMaterialHint">先选投放位置后，这里会显示对应格式要求</p>' +
        '<span class="ad-upload-formats" id="adMaterialFormats">图片可多选 · 视频仅 1 个</span>' +
        '</div>' +
        '<div class="ad-upload-preview" id="adMaterialPreview" hidden></div>' +
        '<button type="button" class="btn btn-secondary btn-sm ad-upload-change" id="adMaterialChange" hidden><i class="fa-solid fa-plus"></i> 继续添加图片</button>' +
        '</div></div>' +
        '<div class="ad-step-actions"><button type="button" class="btn btn-secondary" data-prev>上一步</button><button type="button" class="btn btn-primary" data-next>下一步</button></div></section>' +
        '<section class="ad-step-panel" data-step="4">' +
        '<div class="ad-field"><label for="adFPkg">套餐</label><select id="adFPkg" name="packageId" class="ad-select-native"></select></div>' +
        '<p class="ad-muted" id="adPackageMeta"></p>' +
        '<div class="ad-field"><label for="adFStart">投放开始时间</label><input id="adFStart" type="datetime-local" name="startAt"></div>' +
        '<div class="ad-field"><label for="adFEnd">投放结束时间</label><input id="adFEnd" type="datetime-local" name="endAt" readonly title="由套餐天数自动计算"></div>' +
        '<p class="ad-muted" id="adScheduleHint">选择套餐后，结束时间 = 开始时间 + 套餐天数</p>' +
        '<div class="ad-step-actions"><button type="button" class="btn btn-secondary" data-prev>上一步</button><button type="button" class="btn btn-primary" data-next>下一步</button></div></section>' +
        '<section class="ad-step-panel" data-step="5"><div id="adPayConfirmBox"></div><p class="ad-muted" id="adPayResultLine"></p><div class="ad-step-actions"><button type="button" class="btn btn-secondary" data-ad-go="wallet">去充值</button><button type="button" class="btn btn-secondary" data-prev>上一步</button><button type="button" class="btn btn-primary" id="adMockPay">确认支付</button></div></section>' +
        '</form></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="detail"><div class="set-card ad-set-card"><div class="ssh"><button type="button" class="ad-ssh-back" data-ad-go="center" aria-label="返回" title="返回"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i></button><div><h3>广告详情</h3></div></div><div class="body"><div id="adDetailRoot"></div>' +
        '<div class="ad-set-actions"><button type="button" class="btn btn-secondary" id="adBtnStats" hidden>数据</button><button type="button" class="btn btn-secondary" id="adBtnPause" hidden>暂停</button><button type="button" class="btn btn-secondary" id="adBtnResume" hidden>恢复</button><button type="button" class="btn btn-secondary" id="adBtnEdit" hidden>修改</button><button type="button" class="btn btn-primary" id="adBtnPay" hidden>去支付</button><button type="button" class="btn btn-primary" id="adBtnResubmit" hidden>重新提交审核</button><button type="button" class="btn btn-secondary" id="adBtnRefund" hidden>申请退款</button><button type="button" class="btn btn-secondary" id="adBtnRemove" hidden>下架</button><button type="button" class="btn btn-secondary" id="adBtnDelete" hidden title="仅从列表移除；后台留档">删除</button></div></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="notices"><div class="set-card ad-set-card"><div class="ssh"><div class="ic-circle"><i class="fa-solid fa-bell"></i></div><div><h3>广告通知</h3></div></div><div class="body" id="adNoticeList"></div></div></section>' +
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
        '<div class="ad-stat"><span class="ad-stat-label">账户余额</span><span class="ad-stat-value" id="wTotal">—</span></div>' +
        '<div class="ad-stat"><span class="ad-stat-label">可用余额</span><span class="ad-stat-value" id="wBal">—</span></div>' +
        '<div class="ad-stat"><span class="ad-stat-label">冻结金额</span><span class="ad-stat-value" id="wFrozen">—</span></div>' +
        '<div class="ad-stat"><span class="ad-stat-label">已消费</span><span class="ad-stat-value" id="wSpent">—</span></div>' +
        '<div class="ad-stat"><span class="ad-stat-label">已退款</span><span class="ad-stat-value" id="wRefunded">—</span></div>' +
        '</div>' +
        '<div class="ad-form-actions"><button type="button" class="btn btn-primary" id="wRecharge">模拟充值 +500 USDT</button></div><div id="wFinList" style="margin-top:16px"></div></div></div></section>' +
        '<section class="ad-set-view" data-ad-view="apply"><div class="set-card ad-set-card ad-apply-card">' +
        '<div class="ssh ad-apply-ssh"><div class="ic-circle"><i class="fa-solid fa-id-card"></i></div>' +
        '<div class="ad-apply-ssh-main"><h3>申请广告主</h3>' +
        '<span id="adApplyGlassMount"></span></div></div>' +
        '<div class="body" id="adApplyBody"></div></div></section>' +
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
            link.href = scriptBase() + 'css/ad-system.css?v=20261111preview';
            document.head.appendChild(link);
        }
        if (!document.querySelector('link[href*="dev-glass-note"]')) {
            var gl = document.createElement('link');
            gl.rel = 'stylesheet';
            gl.href = scriptBase() + 'css-web/dev-glass-note.css';
            document.head.appendChild(gl);
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
        scriptsLoading = loadScript(base + 'js/ad-system-store.js?v=20261111paycreate')
            .then(function () { return loadScript(base + 'js/ad-system-api.js?v=20261111expire'); })
            .then(function () { return loadScript(base + 'js/ad-center-promo-markup.js'); })
            .then(function () { return loadScript(base + 'js/ad-advertiser-terms.js'); })
            .then(function () { return loadScript(base + 'js/ad-advertiser-apply-markup.js'); })
            .then(function () { return loadScript(base + 'js/ad-advertiser-apply-glass.js'); })
            .then(function () { return loadScript(base + 'js-web/kyc-store.js'); })
            .then(function () {
                if (!document.querySelector('script[src*="dev-glass-viewport"]')) {
                    return loadScript(base + 'js-web/dev-glass-viewport.js');
                }
            })
            .then(function () { return loadScript(base + 'js/ad-system-user.js?v=20261111opsflow'); })
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
        if (global.FL_applySettingsNavI18n) FL_applySettingsNavI18n({ activeOnly: true });
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
