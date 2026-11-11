/**
 * 用户端 · 广告中心 / 创编 / 详情（H5 & WEB 共用）
 */
(function (global) {
    if (!global.FLAdStore || !global.FLAdService) return;
    var UID = FLAdStore.DEMO_UID;

    function adGo(view, params) {
        params = params || {};
        if (global.FLAdSettings && FLAdSettings.isSettingsAdPage()) {
            FLAdSettings.go(view, params);
            return;
        }
        if (document.body.getAttribute('data-ad-shell') === 'settings' || (document.body.classList.contains('page-settings') && document.querySelector('.set-grid'))) {
            if (global.FLSettingsAdEmbed && FLSettingsAdEmbed.open) {
                FLSettingsAdEmbed.open(view, params);
                return;
            }
            var sp = new URLSearchParams();
            sp.set('panel', 'ad');
            if (view !== 'center') sp.set('view', view);
            if (params.id) sp.set('id', params.id);
            location.href = 'settings.html?' + sp.toString();
            return;
        }
        var q = params.id ? '?id=' + encodeURIComponent(params.id) : '';
        if (view === 'center') location.href = 'ad-center.html';
        else location.href = 'ad-' + view + '.html' + q;
    }

    function ensureAdToast() {
        var el = document.getElementById('adToast');
        if (el) return el;
        el = document.createElement('div');
        el.id = 'adToast';
        el.setAttribute('role', 'status');
        document.body.appendChild(el);
        if (!document.getElementById('adToastStyle')) {
            var ts = document.createElement('style');
            ts.id = 'adToastStyle';
            ts.textContent = '#adToast{position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:10050;max-width:min(92vw,420px);padding:10px 16px;border-radius:10px;background:rgba(17,17,17,.94);color:#fff;font-size:13.5px;line-height:1.4;box-shadow:0 10px 28px rgba(0,0,0,.35);opacity:0;pointer-events:none;transition:opacity .18s}#adToast.show{opacity:1}';
            document.head.appendChild(ts);
        }
        return el;
    }

    function toast(msg) {
        var el = ensureAdToast();
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(el._adToastTimer);
        el._adToastTimer = setTimeout(function () { el.classList.remove('show'); }, 2800);
    }

    function markFieldInvalid(el) {
        if (!el) return;
        var field = el.closest ? el.closest('.ad-field, .field') : null;
        document.querySelectorAll('.ad-field.is-invalid, .field.is-invalid').forEach(function (n) {
            n.classList.remove('is-invalid');
        });
        if (field) field.classList.add('is-invalid');
        try {
            if (el.focus) el.focus({ preventScroll: false });
        } catch (err) {
            try { el.focus(); } catch (e2) { /* ignore */ }
        }
        try {
            if (el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } catch (err2) { /* ignore */ }
    }

    function requireField(selector, message) {
        var el = qs(selector);
        var val = el ? String(el.value || '').trim() : '';
        if (!val) {
            markFieldInvalid(el || qs(selector.replace('[name=', '#').replace(']', '')) || null);
            toast(message);
            return false;
        }
        return true;
    }

    function qs(s, r) { return (r || document).querySelector(s); }

    function label(map, key) { return map[key] || key; }

    function esc(s) {
        if (s == null) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }

    function slotName(code) {
        var slots = FLAdStore.getSlots();
        for (var i = 0; i < slots.length; i++) {
            if (slots[i].code === code) return slots[i].name;
        }
        return code || '—';
    }

    function fmtDateRange(start, end) {
        function d(iso) {
            if (!iso) return '—';
            return iso.slice(0, 10).replace(/-/g, '/');
        }
        if (!start && !end) return '排期未定';
        return d(start) + ' – ' + d(end);
    }

    function isApprovedAdvertiser(status) {
        return status === 'approved';
    }

    function badgeClass(kind, key) {
        if (kind === 'audit') {
            if (key === 'rejected') return 'audit-reject';
            if (key === 'pending_review') return 'audit-pending';
            if (key === 'approved') return 'audit-ok';
            if (key === 'draft') return 'audit-draft';
        }
        if (kind === 'pay') {
            if (key === 'unpaid') return 'pay-unpaid';
        }
        if (kind === 'del') {
            if (key === 'delivering' || key === 'active') return 'del-live';
            if (key === 'paused') return 'del-pause';
            if (key === 'ended' || key === 'removed') return 'del-end';
        }
        return '';
    }

    /** 用户可见的单一主状态（避免审核/支付/投放三枚角标叠在一起看不懂） */
    function resolvePrimaryStatus(ad) {
        if (ad.payStatus === 'unpaid' || ad.payStatus === 'failed') {
            var sch = FLAdService.assertSchedulePayable ? FLAdService.assertSchedulePayable(ad) : { ok: true };
            if (!sch.ok) {
                return { key: 'unpaid_expired', label: '待支付', hint: '排期已过期，请先修改后再支付', cls: 'pay-unpaid' };
            }
            return { key: 'unpaid', label: '待支付', hint: '请先完成套餐支付', cls: 'pay-unpaid' };
        }
        var ticket = (FLAdStore.getRefunds ? FLAdStore.getRefunds() : []).filter(function (t) {
            return t.adId === ad.id && t.status === 'pending';
        })[0];
        if (ticket) {
            return { key: 'refund_pending', label: '退款审核中', hint: '处理完成前不可修改 / 恢复', cls: 'audit-pending' };
        }
        if (ad.auditStatus === 'rejected') {
            return { key: 'rejected', label: '审核失败', hint: '请修改后重新提交上架审核', cls: 'audit-reject' };
        }
        if (!ad.auditStatus || ad.auditStatus === 'draft' || ad.auditStatus === 'none' || ad.auditStatus === 'revoked') {
            return { key: 'none', label: '未提交', hint: '完善信息后支付并提交上架审核', cls: 'audit-draft' };
        }
        if (ad.auditStatus === 'pending_review') {
            return { key: 'pending_review', label: '待审核', hint: '等待平台上架审核', cls: 'audit-pending' };
        }
        if (ad.deliveryStatus === 'removed') {
            return { key: 'removed', label: '已下架', hint: '进入详情可删除', cls: 'del-end' };
        }
        if (ad.deliveryStatus === 'ended') {
            return { key: 'ended', label: '已结束', hint: '进入详情可删除', cls: 'del-end' };
        }
        if (ad.deliveryStatus === 'paused') {
            return { key: 'paused', label: '已暂停', hint: '可恢复投放，或修改 / 申请退款', cls: 'del-pause' };
        }
        if (ad.deliveryStatus === 'delivering' || ad.deliveryStatus === 'active') {
            return { key: 'delivering', label: '投放中', hint: '临时停投请先暂停', cls: 'del-live' };
        }
        if (ad.auditStatus === 'approved') {
            return { key: 'pending_start', label: '待开始', hint: '到达开始时间后自动投放', cls: 'audit-ok' };
        }
        return { key: 'other', label: '处理中', hint: '', cls: '' };
    }

    function pickAdOrder(adId, ad) {
        var list = FLAdStore.getOrders(UID).filter(function (o) { return o.adId === adId; });
        if (!list.length) return null;
        var open = list.filter(function (o) {
            return o.payStatus === 'unpaid' || o.payStatus === 'failed' || o.payStatus === 'processing';
        })[0];
        if (ad && (ad.payStatus === 'unpaid' || ad.payStatus === 'failed')) {
            if (open) return open;
        }
        var active = list.filter(function (o) {
            return o.payStatus === 'paid' || o.payStatus === 'partial_refunded' || o.payStatus === 'refund_processing';
        })[0];
        if (active) return active;
        if (open) return open;
        if (ad && ad.orderId) {
            var byId = list.filter(function (o) { return o.id === ad.orderId; })[0];
            if (byId && byId.payStatus !== 'refunded') return byId;
        }
        return open || active || null;
    }

    function renderAdRowHtml(a) {
        FLAdStore.load();
        var isH5 = document.body.classList.contains('page-settings-h5');
        var thumb = a.materialUrl
            ? "background-image:url('" + esc(a.materialUrl) + "')"
            : 'background-color:var(--bg-inset,#1a1a24)';
        var line2 = esc(a.title || a.type || '');
        var st = resolvePrimaryStatus(a);
        var showHint = !!(st.hint && (st.key === 'unpaid' || st.key === 'unpaid_expired' || st.key === 'rejected' || st.key === 'refund_pending'));
        var badges =
            '<span class="ad-badge ' + esc(st.cls) + '">' + esc(st.label) + '</span>' +
            (showHint ? '<span class="ad-row-next">' + esc(st.hint) + '</span>' : '');
        var subParts = isH5
            ? [slotName(a.slotCode), fmtDateRange(a.startAt, a.endAt)]
            : [slotName(a.slotCode), fmtDateRange(a.startAt, a.endAt)];
        if (!isH5 && a.packageName) subParts.push(a.packageName);
        var imp = a.stats && a.stats.impressions ? a.stats.impressions : 0;
        if (!isH5 && imp > 0) subParts.push(imp.toLocaleString() + ' 曝光');
        var price = a.priceUsdt != null ? a.priceUsdt : (a.budgetTotal || '');
        var side =
            '<div class="ad-row-side">' +
            (price !== '' ? '<span class="ad-row-price">' + esc(String(price)) + ' USDT</span>' : '') +
            (!isH5 && a.stats && a.stats.spend ? '<span class="ad-row-stat">消耗 ' + esc(a.stats.spend.toLocaleString()) + '</span>' : '') +
            '</div>';
        return '<article class="ad-row" data-ad-id="' + esc(a.id) + '">' +
            '<div class="thumb" style="' + thumb + '"></div>' +
            '<div class="meta">' +
            '<div class="ad-row-head"><div class="t">' + esc(a.name) + '</div>' +
            (isH5 ? '' : '<span class="ad-row-id">' + esc(a.id) + '</span>') +
            '</div>' +
            (!isH5 && line2 ? '<div class="ad-row-line2">' + line2 + '</div>' : '') +
            '<div class="ad-row-badges">' + badges + '</div>' +
            '<div class="ad-row-sub">' + esc(subParts.join(' · ')) + '</div>' +
            '</div>' + side + '</article>';
    }

    function roleMeta(status) {
        var st = status || 'none';
        if (st === 'approved') {
            return { pill: 'is-ok', icon: 'fa-circle-check', text: '广告主 · 已通过' };
        }
        if (st === 'pending') {
            return { pill: 'is-warn', icon: 'fa-hourglass-half', text: '广告主 · 审核中' };
        }
        if (st === 'rejected') {
            return { pill: 'is-warn', icon: 'fa-circle-xmark', text: '广告主 · 已驳回' };
        }
        if (st === 'restricted' || st === 'disabled') {
            return { pill: 'is-warn', icon: 'fa-ban', text: '广告主 · ' + label(FLAdStore.ADVERTISER_STATUS, st) };
        }
        return { pill: 'is-muted', icon: 'fa-user', text: '普通用户' };
    }

    function renderRoleStrip(sum) {
        var strip = qs('#adRoleStrip');
        if (!strip) return;
        var st = sum.advertiserStatus || 'none';
        /* 未申请前不展示「普通用户」身份条，引导只走下方权益卡 */
        if (st === 'none') {
            strip.innerHTML = '';
            strip.hidden = true;
            return;
        }
        strip.hidden = false;
        var m = roleMeta(st);
        strip.innerHTML = '<span class="pill ' + m.pill + '"><i class="fa-solid ' + m.icon + '"></i> ' + m.text + '</span>';
    }

    function syncNoticeNav(sum) {
        var noticesBtn = qs('#adBtnNotices');
        var dot = qs('#adNoticeDot');
        var approved = isApprovedAdvertiser(sum.advertiserStatus);
        if (noticesBtn) {
            noticesBtn.hidden = !approved;
            noticesBtn.style.display = approved ? '' : 'none';
            noticesBtn.setAttribute('aria-hidden', approved ? 'false' : 'true');
        }
        if (dot) {
            var unread = 0;
            if (approved && FLAdStore.getNotices) {
                unread = (FLAdStore.getNotices(UID) || []).filter(function (n) { return !n.read; }).length;
            }
            dot.hidden = unread < 1;
        }
    }

    function syncCenterToolbar(sum) {
        var st = sum.advertiserStatus || 'none';
        var approved = st === 'approved';
        var isNone = st === 'none';
        var canApply = st === 'rejected';
        var head = qs('.ad-center-head');
        var createBtn = qs('#adBtnCreate');
        var applyBtn = qs('#adBtnApplyQual');

        /* 未成为广告主前：顶栏创建/申请均不提供（申请入口在权益卡；通知在导航右侧） */
        if (head) {
            head.hidden = isNone;
            if (isNone) head.setAttribute('aria-hidden', 'true');
            else head.removeAttribute('aria-hidden');
        }

        function setOpsVisible(el, on) {
            if (!el) return;
            el.hidden = !on;
            el.style.display = on ? '' : 'none';
            el.setAttribute('aria-hidden', on ? 'false' : 'true');
        }

        setOpsVisible(createBtn, approved);
        syncNoticeNav(sum);
        if (createBtn) {
            createBtn.disabled = !approved;
            createBtn.title = approved ? '' : (FLAdService.canCreatePaidAd(UID).message || '请先开通广告主');
        }
        setOpsVisible(applyBtn, canApply);
    }

    function tryCreate() {
        var gate = FLAdService.canCreatePaidAd(UID);
        if (!gate.ok) {
            toast(gate.message);
            if (sumNeedsApply()) adGo('apply');
            return;
        }
        adGo('create');
    }

    function sumNeedsApply() {
        var sum = FLAdStore.accountSummary(UID);
        return sum.advertiserStatus === 'none' || sum.advertiserStatus === 'rejected';
    }

    function centerGate() {
        var sum = FLAdStore.accountSummary(UID);
        var banner = qs('#adQualBanner');
        if (banner) {
            banner.hidden = true;
            banner.innerHTML = '';
            if (sum.advertiserStatus === 'rejected') {
                var adv = FLAdService.advertiser(UID);
                if (adv && adv.rejectReason) {
                    banner.hidden = false;
                    banner.innerHTML = '<span class="ad-qual-reason">' + esc(adv.rejectReason) + '</span>';
                }
            } else if (sum.advertiserStatus === 'none') {
                banner.hidden = true;
            } else if (sum.advertiserStatus === 'pending') {
                banner.hidden = false;
                banner.innerHTML = '<span class="ad-qual-reason">资质审核中，通过后可创建广告</span>';
            } else if (sum.advertiserStatus === 'restricted' || sum.advertiserStatus === 'disabled') {
                banner.hidden = false;
                banner.innerHTML = '<span class="ad-qual-reason">账户' + esc(label(FLAdStore.ADVERTISER_STATUS, sum.advertiserStatus)) + '，请联系平台处理</span>';
            }
        }
        ensureAdCenterPromo();
        var overview = qs('#adCenterOverview');
        var listPanel = qs('#adCenterListPanel');
        var promo = qs('#adCenterPromo');
        var grid = qs('.ad-center-wrap .ad-web-grid');
        var approved = isApprovedAdvertiser(sum.advertiserStatus);
        var isNone = sum.advertiserStatus === 'none';
        var isPending = sum.advertiserStatus === 'pending';
        if (overview) overview.hidden = !approved;
        /* 仅已通过广告主展示「我的广告」；审核中/未申请/驳回等不展示投放列表假数据 */
        if (listPanel) listPanel.hidden = !approved;
        if (promo) promo.hidden = !isNone;
        if (grid) {
            grid.classList.toggle('ad-web-grid--solo', !approved);
            grid.classList.toggle('ad-web-grid--promo-only', isNone);
            grid.classList.toggle('ad-web-grid--pending', isPending);
        }
        bindPromoApplyBtn();
    }

    function ensureAdCenterPromo() {
        var grid = qs('.ad-center-wrap .ad-web-grid');
        if (!grid || qs('#adCenterPromo') || !global.AD_CENTER_PROMO_HTML) return;
        grid.insertAdjacentHTML('afterbegin', global.AD_CENTER_PROMO_HTML);
    }

    function bindPromoApplyBtn() {
        var btn = qs('#adPromoApplyBtn');
        if (!btn || btn.getAttribute('data-bound') === '1') return;
        btn.setAttribute('data-bound', '1');
        btn.addEventListener('click', function () { adGo('apply'); });
    }

    function renderCenter() {
        if (FLAdService.purgeUnpaidUserAds) FLAdService.purgeUnpaidUserAds(UID);
        if (FLAdService.expireStalePendingReviewAds) FLAdService.expireStalePendingReviewAds();
        var sum = FLAdStore.accountSummary(UID);
        centerGate();
        renderRoleStrip(sum);
        syncCenterToolbar(sum);
        if (isApprovedAdvertiser(sum.advertiserStatus)) {
            var map = {
                adBal: sum.available != null ? sum.available : sum.balance,
                adFrozen: sum.frozen,
                adActive: sum.activeCount,
                adPending: sum.pendingAudit,
                adImp: sum.impressions,
                adClk: sum.clicks,
                adSpend: sum.spent || sum.spend
            };
            Object.keys(map).forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.textContent = typeof map[id] === 'number' ? map[id].toLocaleString() : map[id];
            });
            var payChip = document.getElementById('adPendingPay');
            if (payChip) {
                var chip = payChip.closest('.ad-overview-chip');
                if (chip) chip.hidden = true;
            }
        }
        var legacyStatus = qs('#adAdvStatus');
        if (legacyStatus) legacyStatus.textContent = label(FLAdStore.ADVERTISER_STATUS, sum.advertiserStatus);
        if (isApprovedAdvertiser(sum.advertiserStatus)) renderList('adListMount', '');
        else {
            var mount = document.getElementById('adListMount');
            if (mount) mount.innerHTML = '';
        }
    }

    function renderList(mountId, filter) {
        var mount = document.getElementById(mountId);
        if (!mount) return;
        var list = FLAdStore.getAds({ uid: UID, excludeUserDeleted: true }).map(function (a) {
            return (FLAdService.healAdPayOrderConsistency && FLAdService.healAdPayOrderConsistency(a.id)) || a;
        }).filter(Boolean).filter(function (a) {
            return a.payStatus !== 'unpaid' && a.payStatus !== 'failed' && a.payStatus !== 'processing';
        });
        if (filter === 'pending_review') list = list.filter(function (a) { return a.auditStatus === 'pending_review'; });
        else if (filter === 'pending_start') {
            /* 已通过且尚未开投（与主状态「待开始」一致；不含仍在审核中的） */
            list = list.filter(function (a) {
                return a.auditStatus === 'approved' &&
                    (a.deliveryStatus === 'pending_start' || a.deliveryStatus === 'pending');
            });
        }
        else if (filter === 'active') list = list.filter(function (a) { return a.deliveryStatus === 'delivering' || a.deliveryStatus === 'active'; });
        else if (filter === 'paused') list = list.filter(function (a) { return a.deliveryStatus === 'paused'; });
        else if (filter === 'ended' || filter === 'removed') {
            /* 「已结束」筛选项合并自然结束与主动下架 */
            list = list.filter(function (a) {
                return a.deliveryStatus === 'ended' || a.deliveryStatus === 'removed';
            });
        }
        else if (filter === 'rejected') list = list.filter(function (a) { return a.auditStatus === 'rejected'; });
        else if (filter === 'unpaid') list = [];
        if (!list.length) {
            var sum = FLAdStore.accountSummary(UID);
            var hint = sum.advertiserStatus === 'none'
                ? '成为广告主并通过审核后，可在此管理您的广告'
                : (sum.advertiserStatus === 'pending' ? '资质审核中，暂无可投放广告' : '暂无广告');
            mount.innerHTML = '<div class="ad-center-empty">' + hint + '</div>';
            return;
        }
        mount.innerHTML = list.map(function (a) { return renderAdRowHtml(a); }).join('');
        mount.querySelectorAll('[data-ad-id]').forEach(function (row) {
            row.onclick = function () { adGo('detail', { id: row.getAttribute('data-ad-id') }); };
        });
    }

    function bindFilters() { /* 筛选由 document 委托处理 */ }

    function isH5SettingsAd() {
        return document.body.classList.contains('page-settings-h5');
    }

    function qualNavigate(action) {
        if (action === 'kyc') {
            location.href = isH5SettingsAd() ? 'kyc.html' : 'kyc-intro.html';
            return;
        }
        if (action === 'login') {
            location.href = isH5SettingsAd() ? 'login.html' : 'modal-login-main.html';
        }
    }

    function ensureApplyMarkup() {
        var glassMount = qs('#adApplyGlassMount');
        if (glassMount && global.AD_APPLY_GLASS_HTML && !glassMount.querySelector('.dev-glass-wrap')) {
            glassMount.innerHTML = global.AD_APPLY_GLASS_HTML;
        }
        var tip = qs('#adApplyPrereqTip');
        if (tip && global.AD_APPLY_PREREQ_TIP) tip.innerHTML = global.AD_APPLY_PREREQ_TIP;
        var mount = qs('#adApplyBody');
        if (mount && !mount.querySelector('#adApplyForm') && global.AD_APPLY_FORM_INNER) {
            mount.innerHTML = global.AD_APPLY_FORM_INNER;
        }
        if (global.FL_devGlassViewportRefresh) global.FL_devGlassViewportRefresh();
    }

    function fillTermsSheet() {
        var body = qs('#adTermsSheetBody');
        var terms = global.AD_ADVERTISER_TERMS;
        if (!body || !terms) return;
        body.innerHTML = '<p class="ad-muted" style="margin:0 0 12px">更新日期：' + esc(terms.updated) + '</p>' +
            terms.sections.map(function (s) {
                return '<h5 class="ad-terms-h">' + esc(s.h) + '</h5><p class="ad-terms-p">' + esc(s.p) + '</p>';
            }).join('');
    }

    function openTermsSheet() {
        fillTermsSheet();
        var sheet = qs('#adTermsSheet');
        if (sheet) sheet.hidden = false;
    }

    function closeTermsSheet() {
        var sheet = qs('#adTermsSheet');
        if (sheet) sheet.hidden = true;
    }

    var applyBlockAction = null;

    function openApplyBlockSheet(blockers) {
        blockers = blockers || [];
        var body = qs('#adApplyBlockBody');
        if (!body) return;
        body.innerHTML = '<p class="ad-muted">请先完成以下事项：</p><ul class="ad-block-list">' +
            blockers.map(function (b) { return '<li>' + esc(b.message) + '</li>'; }).join('') + '</ul>';
        applyBlockAction = blockers[0] && blockers[0].action ? blockers[0].action : null;
        var goBtn = qs('#adApplyBlockGo');
        if (goBtn) {
            goBtn.hidden = !applyBlockAction;
            goBtn.textContent = applyBlockAction === 'kyc' ? '去验证' : (applyBlockAction === 'login' ? '去登录' : '去完成');
        }
        var sheet = qs('#adApplyBlockSheet');
        if (sheet) sheet.hidden = false;
    }

    function closeApplyBlockSheet() {
        var sheet = qs('#adApplyBlockSheet');
        if (sheet) sheet.hidden = true;
        applyBlockAction = null;
    }

    function bindApplyUiOnce() {
        if (document.body.getAttribute('data-ad-apply-bound') === '1') return;
        document.body.setAttribute('data-ad-apply-bound', '1');
        qs('#adTermsOpen') && (qs('#adTermsOpen').onclick = function (e) { e.preventDefault(); openTermsSheet(); });
        ['adTermsSheetClose', 'adTermsSheetX', 'adTermsSheetOk'].forEach(function (id) {
            var el = qs('#' + id);
            if (el) el.onclick = closeTermsSheet;
        });
        qs('#adApplyBlockClose') && (qs('#adApplyBlockClose').onclick = closeApplyBlockSheet);
        qs('#adApplyBlockLater') && (qs('#adApplyBlockLater').onclick = closeApplyBlockSheet);
        qs('#adApplyBlockGo') && (qs('#adApplyBlockGo').onclick = function () {
            var act = applyBlockAction;
            closeApplyBlockSheet();
            if (act) qualNavigate(act);
        });
    }

    function initApply() {
        ensureApplyMarkup();
        bindApplyUiOnce();
        var form = qs('#adApplyForm');
        if (!form) return;
        if (form.getAttribute('data-submit-bound') === '1') return;
        form.setAttribute('data-submit-bound', '1');
        form.onsubmit = function (e) {
            e.preventDefault();
            var pre = FLAdService.checkAdvertiserApplyPrerequisites(UID);
            if (!pre.ok) {
                openApplyBlockSheet(pre.blockers);
                toast(pre.message || '暂不满足申请条件');
                return;
            }
            var fd = new FormData(form);
            var r = FLAdService.applyAdvertiser(UID, {
                companyName: fd.get('companyName'),
                contact: fd.get('contact'),
                agreedToTerms: !!fd.get('agreeTerms')
            });
            if (!r.ok) {
                pre = FLAdService.checkAdvertiserApplyPrerequisites(UID);
                if (!pre.ok) openApplyBlockSheet(pre.blockers);
            }
            toast(r.ok ? '已提交，请等待审核（原型）' : r.message);
            if (r.ok) setTimeout(function () { adGo('center'); }, 800);
        };
    }

    function initWallet() {
        var acc = FLAdStore.load().account;
        var available = acc.balance || 0;
        var frozen = acc.frozen || 0;
        ['wTotal', 'wBal', 'wFrozen', 'wSpent', 'wRefunded'].forEach(function (id, i) {
            var el = qs('#' + id);
            if (!el) return;
            el.textContent = [available + frozen, available, frozen, acc.spent, acc.refunded][i];
        });
        var list = qs('#wFinList');
        if (list) {
            var finLabel = { recharge: '充值', refund: '退款', freeze: '冻结', spend: '消耗', pay: '支付', ad_purchase: '购买套餐', unfreeze: '解冻', adjust: '调账' };
            var finStatus = { success: '成功', pending: '处理中', processing: '处理中', failed: '失败', cancelled: '已取消' };
            list.innerHTML = FLAdStore.load().finance.slice(0, 20).map(function (f) {
                var ti = finLabel[f.type] || f.type;
                var st = finStatus[f.status] || f.status || '';
                return '<div class="ad-row" style="cursor:default"><div class="meta"><div class="t">' + ti + ' · ' + esc(f.orderNo) + '</div><div class="s">' +
                    (f.amount > 0 ? '+' : '') + f.amount + ' USDT · ' + st + ' · ' + f.at.slice(0, 16) + '</div></div></div>';
            }).join('');
        }
        qs('#wRecharge') && (qs('#wRecharge').onclick = function () {
            var r = FLAdService.mockRecharge(500);
            toast(r.ok ? '模拟充值 +500 USDT（原型）' : r.message);
            initWallet();
        });
    }

    var openAdSelect = null;

    function closeAdSelect() {
        if (!openAdSelect) return;
        openAdSelect.wrap.classList.remove('is-open');
        if (openAdSelect.panel && openAdSelect.panel.parentNode) openAdSelect.panel.parentNode.removeChild(openAdSelect.panel);
        openAdSelect = null;
    }

    function syncAdSelectLabel(wrap, native) {
        if (!wrap || !native) return;
        var lbl = wrap.querySelector('.ad-select-label');
        if (!lbl) return;
        var opt = native.options[native.selectedIndex];
        lbl.textContent = opt ? opt.textContent : '请选择';
        wrap.classList.toggle('is-empty', !opt || !native.value);
    }

    function openAdSelectPanel(wrap, native) {
        closeAdSelect();
        var panel = document.createElement('div');
        panel.className = 'ad-select-panel';
        panel.setAttribute('role', 'listbox');
        Array.prototype.forEach.call(native.options, function (opt) {
            if (opt.disabled && opt.value === '') return;
            var row = document.createElement('button');
            row.type = 'button';
            row.className = 'ad-select-option' + (opt.value === native.value ? ' is-on' : '') + (opt.disabled ? ' is-disabled' : '');
            row.setAttribute('role', 'option');
            row.textContent = opt.textContent;
            if (opt.disabled) {
                row.disabled = true;
            } else {
                row.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    native.value = opt.value;
                    try {
                        native.dispatchEvent(new Event('change', { bubbles: true }));
                    } catch (err) {
                        var ev = document.createEvent('HTMLEvents');
                        ev.initEvent('change', true, false);
                        native.dispatchEvent(ev);
                    }
                    syncAdSelectLabel(wrap, native);
                    closeAdSelect();
                });
            }
            panel.appendChild(row);
        });
        wrap.appendChild(panel);
        wrap.classList.add('is-open');
        openAdSelect = { wrap: wrap, panel: panel, native: native };
    }

    function enhanceAdSelect(native) {
        if (!native || native.tagName !== 'SELECT') return;
        if (native.getAttribute('data-ad-select') === '1') {
            syncAdSelectLabel(native._adSelectWrap, native);
            return;
        }
        native.setAttribute('data-ad-select', '1');
        native.classList.add('ad-select-native-hidden');
        var wrap = document.createElement('div');
        wrap.className = 'ad-select';
        wrap.innerHTML =
            '<button type="button" class="ad-select-trigger" aria-haspopup="listbox">' +
            '<span class="ad-select-label"></span><i class="fa-solid fa-chevron-down ad-select-chevron" aria-hidden="true"></i>' +
            '</button>';
        native.parentNode.insertBefore(wrap, native);
        wrap.appendChild(native);
        native._adSelectWrap = wrap;
        syncAdSelectLabel(wrap, native);
        wrap.querySelector('.ad-select-trigger').addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (wrap.classList.contains('is-open')) closeAdSelect();
            else openAdSelectPanel(wrap, native);
        });
        native.addEventListener('change', function () {
            syncAdSelectLabel(wrap, native);
        });
    }

    function enhanceAdFormSelects(root) {
        var scope = root || document;
        scope.querySelectorAll('#adCreateForm select, .ad-form select').forEach(enhanceAdSelect);
    }

    if (!document.documentElement.getAttribute('data-ad-select-doc')) {
        document.documentElement.setAttribute('data-ad-select-doc', '1');
        document.addEventListener('click', function () { closeAdSelect(); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeAdSelect();
        });
    }

    function populatePackages(slotCode) {
        var sel = qs('[name="packageId"]');
        if (!sel) return;
        var pkgs = FLAdStore.getPackages().filter(function (p) { return p.enabled && (!slotCode || p.slotCode === slotCode); });
        sel.innerHTML = pkgs.map(function (p) {
            return '<option value="' + p.id + '">' + p.name + ' — ' + p.priceUsdt + ' USDT</option>';
        }).join('');
        updatePackageMeta();
        sel.onchange = function () {
            updatePackageMeta();
            syncScheduleEndFromPackage();
        };
        enhanceAdSelect(sel);
    }

    function slotLabel(code) {
        var sl = FLAdStore.getSlots().filter(function (x) { return x.code === code; })[0];
        return sl ? sl.name : code;
    }

    function updatePackageMeta() {
        var sel = qs('[name="packageId"]');
        var el = qs('#adPackageMeta');
        if (!sel || !el) return;
        var p = FLAdService.getPackage(sel.value);
        if (!p) { el.textContent = ''; return; }
        el.textContent = '固定套餐 · 投放 ' + p.durationDays + ' 天 · ' + slotLabel(p.slotCode) + ' · 一次支付 ' + p.priceUsdt + ' USDT';
    }

    function renderPayConfirm(draft) {
        var box = qs('#adPayConfirmBox');
        if (!box) return;
        var pkgSel = qs('[name="packageId"]');
        var pkg = pkgSel && FLAdService.getPackage(pkgSel.value);
        var acc = FLAdStore.load().account;
        var name = draft.name || (qs('[name="name"]') || {}).value || '—';
        var price = pkg ? pkg.priceUsdt : '—';
        var enough = pkg && Number(acc.balance) >= Number(pkg.priceUsdt);
        box.innerHTML =
            '<div class="ad-pay-card">' +
            '<div class="ad-pay-card-hd"><i class="fa-solid fa-receipt" aria-hidden="true"></i><div><h4>确认支付</h4><p>支付成功后才会创建广告并提交审核</p></div></div>' +
            '<div class="ad-pay-rows">' +
            '<div class="ad-pay-row"><span>广告名称</span><strong>' + esc(name) + '</strong></div>' +
            '<div class="ad-pay-row"><span>套餐</span><strong>' + esc(pkg ? pkg.name : '—') + '</strong></div>' +
            '<div class="ad-pay-row"><span>投放天数</span><strong>' + esc(pkg ? (pkg.durationDays + ' 天') : '—') + '</strong></div>' +
            '<div class="ad-pay-row ad-pay-row--price"><span>应付金额</span><strong>' + esc(String(price)) + ' <small>USDT</small></strong></div>' +
            '</div>' +
            '<div class="ad-pay-balance">' +
            '<div><span>可用余额</span><b>' + esc(String(acc.balance)) + ' USDT</b></div>' +
            '<div><span>已冻结</span><b>' + esc(String(acc.frozen || 0)) + ' USDT</b></div>' +
            '<div class="' + (enough ? 'is-ok' : 'is-warn') + '"><span>支付后可用</span><b>' +
            (pkg ? esc(String(Math.round((Number(acc.balance) - Number(pkg.priceUsdt)) * 100) / 100)) : '—') +
            ' USDT</b></div>' +
            '</div>' +
            '</div>';
    }

    function demoCreators() {
        var list = [];
        var hosts = (global.FLLiveViewHost && FLLiveViewHost.HOSTS) || null;
        if (hosts) {
            Object.keys(hosts).forEach(function (slug) {
                var h = hosts[slug];
                list.push({
                    value: 'creator-profile.html?user=' + encodeURIComponent(h.name || slug) + '&host=' + encodeURIComponent(slug),
                    label: h.name || slug,
                    sub: h.roleLabel || h.category || '创作者',
                    keywords: [h.name, h.slug, h.shortTitle, h.tag, h.category, h.roleLabel].filter(Boolean).join(' ').toLowerCase()
                });
            });
        }
        [
            { name: 'Luna', slug: 'luna', sub: '账号本人 · 创作者', keywords: 'luna 本人 自己' },
            { name: '夜雨听弦', slug: 'yeyu', sub: '音乐主播', keywords: '夜雨听弦 yeyu 爵士' },
            { name: 'NovaPlay', slug: 'novaplay', sub: '游戏主播', keywords: 'novaplay nova apex 游戏' },
            { name: 'Lens 旅记', slug: 'lens', sub: '摄影创作者', keywords: 'lens 旅记 京都 摄影' },
            { name: '山野食光', slug: 'shanye', sub: '美食创作者', keywords: '山野食光 shanye 露营 美食' },
            { name: 'EchoDJ', slug: 'echodj', sub: '旗下艺人 · 音乐', keywords: 'echodj echo dj 旗下' },
            { name: 'Mira 织梦', slug: 'mira', sub: '旗下艺人 · 生活', keywords: 'mira 织梦 旗下' },
            { name: 'Kaito 海斗', slug: 'kaito', sub: '旗下艺人 · 游戏', keywords: 'kaito 海斗 旗下' }
        ].forEach(function (x) {
            if (list.some(function (c) { return c.label === x.name || (c.value && c.value.indexOf('host=' + x.slug) >= 0); })) return;
            list.push({
                value: 'creator-profile.html?user=' + encodeURIComponent(x.name) + '&host=' + encodeURIComponent(x.slug),
                label: x.name,
                sub: x.sub,
                keywords: (x.name + ' ' + x.slug + ' ' + x.keywords).toLowerCase()
            });
        });
        return list;
    }

    function bindCreatorSearch() {
        var root = qs('#adCreatorSearch');
        var query = qs('#adCreatorQuery');
        var hidden = qs('#adFCreator') || qs('[name="creator"]');
        var picked = qs('#adCreatorPicked');
        var drop = qs('#adCreatorDrop');
        if (!root || !query || !hidden || !picked || !drop) return;
        if (root.getAttribute('data-bound') === '1') return;
        root.setAttribute('data-bound', '1');

        var catalog = demoCreators();

        function setPicked(item) {
            if (!item) {
                hidden.value = '';
                picked.hidden = true;
                picked.innerHTML = '';
                query.value = '';
                return;
            }
            hidden.value = item.value;
            picked.hidden = false;
            picked.innerHTML =
                '<div class="ad-creator-picked-main"><strong>' + esc(item.label) + '</strong><span>' + esc(item.sub || '') + '</span></div>' +
                '<button type="button" class="ad-creator-clear" id="adCreatorClear" aria-label="清除已选主播"><i class="fa-solid fa-xmark"></i></button>';
            query.value = '';
            drop.hidden = true;
            drop.innerHTML = '';
        }

        function renderDrop(q) {
            var key = String(q || '').trim().toLowerCase();
            if (!key) {
                drop.hidden = true;
                drop.innerHTML = '';
                return;
            }
            var hits = catalog.filter(function (c) {
                return (c.keywords || '').indexOf(key) >= 0 || (c.label || '').toLowerCase().indexOf(key) >= 0;
            }).slice(0, 8);
            if (!hits.length) {
                drop.hidden = false;
                drop.innerHTML = '<div class="ad-creator-empty">未找到「' + esc(q) + '」，换个昵称试试</div>';
                return;
            }
            drop.hidden = false;
            drop.innerHTML = hits.map(function (c) {
                return '<button type="button" class="ad-creator-option" data-value="' + esc(c.value) + '">' +
                    '<strong>' + esc(c.label) + '</strong><span>' + esc(c.sub || '') + '</span></button>';
            }).join('');
        }

        query.addEventListener('input', function () {
            renderDrop(query.value);
        });
        query.addEventListener('focus', function () {
            if (query.value.trim()) renderDrop(query.value);
        });
        drop.addEventListener('click', function (e) {
            var btn = e.target.closest('.ad-creator-option');
            if (!btn) return;
            e.preventDefault();
            var val = btn.getAttribute('data-value');
            var item = catalog.filter(function (c) { return c.value === val; })[0];
            if (item) setPicked(item);
        });
        picked.addEventListener('click', function (e) {
            if (!e.target.closest('#adCreatorClear')) return;
            e.preventDefault();
            setPicked(null);
            query.focus();
        });
        document.addEventListener('click', function (e) {
            if (!root.contains(e.target)) {
                drop.hidden = true;
            }
        });

        if (hidden.value) {
            var existing = catalog.filter(function (c) { return c.value === hidden.value; })[0];
            if (existing) setPicked(existing);
        }
    }

    function populateCreatorSelect() {
        bindCreatorSearch();
    }

    function syncLandingFields() {
        var typeEl = qs('[name="landingType"]');
        var creatorField = qs('#adLandingCreatorField') || qs('#adLandingLiveField');
        var urlField = qs('#adLandingUrlField');
        var isCreator = !typeEl || typeEl.value === 'creator' || typeEl.value === 'live';
        if (creatorField) creatorField.hidden = !isCreator;
        if (urlField) urlField.hidden = isCreator;
    }

    function syncCopyField() {
        var field = qs('#adCopyField');
        var copyEl = qs('#adFCopy') || qs('[name="copy"]');
        var isFeed = currentSlotCode() === 'feed_video';
        if (field) field.hidden = !isFeed;
        if (!isFeed && copyEl) copyEl.value = '';
    }

    /** 创编步骤 2：按广告位切换 WEB / H5 展示样式示意 */
    function syncSlotStylePreview() {
        var root = qs('#adSlotStylePreview');
        var h5 = qs('#adSlotPreviewH5');
        var web = qs('#adSlotPreviewWeb');
        if (!root || !h5 || !web) return;
        var slot = currentSlotCode();
        root.hidden = false;
        root.setAttribute('data-slot', slot);
        if (slot === 'home_banner') {
            h5.innerHTML =
                '<div class="ad-style-mock-phone">' +
                '<div class="ad-style-mock-statusbar"></div>' +
                '<div class="ad-style-mock-banner"><strong>广告 · 首页 Banner</strong><span>H5 通栏约 750×200 · 可关闭</span></div>' +
                '<div class="ad-style-mock-line"></div><div class="ad-style-mock-line short"></div>' +
                '</div>';
            web.innerHTML =
                '<div class="ad-style-mock-web">' +
                '<div class="ad-style-mock-web-side"></div>' +
                '<div class="ad-style-mock-web-main">' +
                '<div class="ad-style-mock-banner"><strong>广告 · 首页 Banner</strong><span>WEB 通栏约 1920×240 · 可关闭</span></div>' +
                '<div class="ad-style-mock-line"></div><div class="ad-style-mock-line"></div>' +
                '</div></div>';
            return;
        }
        /* 默认 / 信息流 */
        h5.innerHTML =
            '<div class="ad-style-mock-phone">' +
            '<div class="ad-style-mock-statusbar"></div>' +
            '<div class="ad-style-mock-line"></div>' +
            '<div class="ad-style-mock-feed"><strong>广告 · 信息流原生帖</strong><span>隔 ≥5 条内容插入</span></div>' +
            '<div class="ad-style-mock-line short"></div>' +
            '</div>';
        web.innerHTML =
            '<div class="ad-style-mock-web">' +
            '<div class="ad-style-mock-web-side"></div>' +
            '<div class="ad-style-mock-web-main">' +
            '<div class="ad-style-mock-line"></div>' +
            '<div class="ad-style-mock-feed"><strong>广告 · 竖滑原生帖</strong><span>与普通帖同构 · 单次最多 3 条</span></div>' +
            '<div class="ad-style-mock-line short"></div>' +
            '</div></div>';
    }

    function populateSlotSelect() {
        var sel = qs('[name="slotCode"]');
        if (!sel) return;
        /* 用户端只展示可自助投放的广告位，不露出「仅平台运营」项 */
        var slots = FLAdStore.getSlots().filter(function (s) {
            return s.userAllowed && s.enabled;
        });
        sel.innerHTML = slots.map(function (s) {
            return '<option value="' + esc(s.code) + '">' + esc(s.name) + '</option>';
        }).join('');
        if (slots[0]) sel.value = slots[0].code;
        enhanceAdSelect(sel);
    }

    function currentSlotCode() {
        var slot = qs('[name="slotCode"]');
        return slot && slot.value ? slot.value : 'feed_video';
    }

    function materialMaxImages(slotCode) {
        var rule = FLAdService.MATERIAL_RULES && FLAdService.MATERIAL_RULES[slotCode];
        return (rule && rule.maxImages) || 6;
    }

    function syncDraftMaterials(draft) {
        var list = Array.isArray(draft.materials) ? draft.materials : [];
        draft.materials = list;
        if (!list.length) {
            draft.materialUrl = '';
            draft.materialMeta = { validated: false, kind: '', count: 0 };
            return;
        }
        draft.materialUrl = list[0].url;
        draft.materialMeta = {
            mimeType: list[0].mimeType,
            sizeBytes: list[0].sizeBytes,
            width: list[0].width,
            height: list[0].height,
            kind: list[0].kind,
            count: list.length,
            validated: list.every(function (m) { return m.validated; })
        };
    }

    function updateMaterialHint() {
        var hint = qs('#adMaterialHint');
        var formats = qs('#adMaterialFormats') || qs('.ad-upload-formats');
        var help = qs('#adMaterialFieldHelp');
        var input = qs('#adMaterialInput');
        var slotCode = currentSlotCode();
        var rule = FLAdService.MATERIAL_RULES && FLAdService.MATERIAL_RULES[slotCode];
        if (hint) hint.textContent = rule ? rule.hint : '请上传广告展示内容';
        if (help) {
            if (slotCode === 'home_banner' && rule) {
                help.innerHTML =
                    '首页 Banner <strong>仅图片</strong>，不可上传视频。<br>' +
                    '格式：' + esc(rule.formatsLabel || 'JPG / PNG / WebP') +
                    ' · 每张 ≤500KB · 最多 ' + materialMaxImages(slotCode) + ' 张（轮播）<br>' +
                    '分辨率：WEB ' + esc(rule.webSize || '1920×240') +
                    ' · H5 ' + esc(rule.h5Size || '750×200') +
                    '（按两端首页通栏位展示，过长图会裁切居中）';
            } else {
                help.textContent = '观众实际看到的画面。图片可一次选多张；视频只能上传 1 个，且不可与图片混用。';
            }
        }
        if (formats) {
            if (slotCode === 'home_banner') {
                formats.textContent = '仅图片 · JPG/PNG/WebP · ≤500KB · WEB 1920×240 / H5 750×200';
            } else if (rule && rule.allowVideo) {
                formats.textContent = '图片可多选（最多 ' + materialMaxImages(slotCode) + ' 张）· 视频仅 1 个';
            } else {
                formats.textContent = '图片可多选（最多 ' + materialMaxImages(slotCode) + ' 张）';
            }
        }
        if (input && FLAdService.materialAccept) {
            input.accept = FLAdService.materialAccept(slotCode);
            input.multiple = true;
        }
    }

    function renderMaterialGallery(draft) {
        var zone = qs('#adMaterialZone');
        var preview = qs('#adMaterialPreview');
        var placeholder = qs('#adMaterialPlaceholder');
        var changeBtn = qs('#adMaterialChange');
        var list = Array.isArray(draft.materials) ? draft.materials : [];
        var has = list.length > 0;
        var kind = has ? list[0].kind : '';
        if (preview) {
            preview.innerHTML = '';
            preview.style.backgroundImage = '';
            preview.classList.toggle('is-video', kind === 'video');
            preview.classList.toggle('is-gallery', kind === 'image' && list.length > 0);
            if (!has) {
                preview.hidden = true;
            } else if (kind === 'video') {
                preview.hidden = false;
                preview.innerHTML = '<video src="' + String(list[0].url).replace(/"/g, '&quot;') + '" muted playsinline controls></video>' +
                    '<button type="button" class="ad-mat-remove" data-mat-remove="0" aria-label="移除视频"><i class="fa-solid fa-xmark"></i></button>';
            } else {
                preview.hidden = false;
                preview.innerHTML = '<div class="ad-mat-thumbs">' + list.map(function (m, i) {
                    return '<div class="ad-mat-thumb" data-i="' + i + '">' +
                        '<span class="ad-mat-thumb-bg" style="background-image:url(\'' + String(m.url).replace(/'/g, '%27') + '\')"></span>' +
                        '<button type="button" class="ad-mat-remove" data-mat-remove="' + i + '" aria-label="移除图片"><i class="fa-solid fa-xmark"></i></button>' +
                        '</div>';
                }).join('') + '</div>';
            }
        }
        if (placeholder) placeholder.hidden = has;
        if (changeBtn) {
            var max = materialMaxImages(currentSlotCode());
            if (!has) {
                changeBtn.hidden = true;
            } else if (kind === 'video') {
                changeBtn.hidden = false;
                changeBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> 更换视频';
            } else if (list.length >= max) {
                changeBtn.hidden = false;
                changeBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> 已满 ' + max + ' 张，点此重选';
            } else {
                changeBtn.hidden = false;
                changeBtn.innerHTML = '<i class="fa-solid fa-plus"></i> 继续添加图片（' + list.length + '/' + max + '）';
            }
        }
        if (zone) zone.classList.toggle('has-file', has);
    }

    function readFileAsMaterial(file, slotCode) {
        return new Promise(function (resolve, reject) {
            var pre = FLAdService.validateMaterial(slotCode, { mimeType: file.type, sizeBytes: file.size });
            if (!pre.ok) {
                reject(new Error(pre.message));
                return;
            }
            var kind = pre.data && pre.data.kind === 'video' ? 'video' : 'image';
            var reader = new FileReader();
            reader.onerror = function () { reject(new Error(kind === 'video' ? '无法读取视频' : '无法读取图片')); };
            reader.onload = function () {
                var dataUrl = reader.result;
                if (kind === 'video') {
                    var video = document.createElement('video');
                    video.preload = 'metadata';
                    video.onloadedmetadata = function () {
                        URL.revokeObjectURL(video.src);
                        var v = FLAdService.validateMaterial(slotCode, {
                            mimeType: file.type, sizeBytes: file.size,
                            width: video.videoWidth, height: video.videoHeight
                        });
                        if (!v.ok) { reject(new Error(v.message)); return; }
                        resolve({
                            url: dataUrl, mimeType: file.type, sizeBytes: file.size,
                            width: video.videoWidth, height: video.videoHeight,
                            kind: 'video', validated: true
                        });
                    };
                    video.onerror = function () { reject(new Error('无法读取视频')); };
                    video.src = URL.createObjectURL(file);
                    return;
                }
                var img = new Image();
                img.onload = function () {
                    var v = FLAdService.validateMaterial(slotCode, {
                        mimeType: file.type, sizeBytes: file.size,
                        width: img.width, height: img.height
                    });
                    if (!v.ok) { reject(new Error(v.message)); return; }
                    resolve({
                        url: dataUrl, mimeType: file.type, sizeBytes: file.size,
                        width: img.width, height: img.height,
                        kind: 'image', validated: true
                    });
                };
                img.onerror = function () { reject(new Error('无法读取图片')); };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
        });
    }

    function renderBrandLogoPreview(draft) {
        var preview = qs('#adBrandLogoPreview');
        var clearBtn = qs('#adBrandLogoClear');
        var hint = qs('#adBrandLogoHint');
        var url = draft && draft.brandLogoUrl ? String(draft.brandLogoUrl) : '';
        if (preview) {
            if (url) {
                preview.style.backgroundImage = "url('" + url.replace(/'/g, '%27') + "')";
                preview.classList.add('has-logo');
                preview.innerHTML = '';
            } else {
                preview.style.backgroundImage = '';
                preview.classList.remove('has-logo');
                preview.innerHTML = '<i class="fa-regular fa-image"></i>';
            }
        }
        if (clearBtn) clearBtn.hidden = !url;
        if (hint) hint.textContent = url ? '将显示在信息流广告顶栏' : '未上传时不可进入下一步';
    }

    function readBrandLogoFile(file) {
        return new Promise(function (resolve, reject) {
            if (!file || !/^image\/(jpeg|png|webp)$/i.test(file.type)) {
                reject(new Error('请上传 JPG / PNG / WebP 图片'));
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                reject(new Error('LOGO 需小于 2MB'));
                return;
            }
            var reader = new FileReader();
            reader.onerror = function () { reject(new Error('无法读取图片')); };
            reader.onload = function () {
                var dataUrl = reader.result;
                var img = new Image();
                img.onload = function () {
                    if (img.width < 200 || img.height < 200) {
                        reject(new Error('LOGO 边长需 ≥ 200px'));
                        return;
                    }
                    resolve({
                        url: dataUrl,
                        mimeType: file.type,
                        sizeBytes: file.size,
                        width: img.width,
                        height: img.height
                    });
                };
                img.onerror = function () { reject(new Error('无法读取图片')); };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
        });
    }

    function bindBrandLogoUpload(draft) {
        var input = qs('#adBrandLogoInput');
        var pick = qs('#adBrandLogoPick');
        var clearBtn = qs('#adBrandLogoClear');
        if (!input || input.getAttribute('data-bound') === '1') {
            renderBrandLogoPreview(draft);
            return;
        }
        input.setAttribute('data-bound', '1');
        if (pick) {
            pick.addEventListener('click', function (e) {
                e.preventDefault();
                input.click();
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', function (e) {
                e.preventDefault();
                draft.brandLogoUrl = '';
                draft.brandLogoMeta = null;
                renderBrandLogoPreview(draft);
            });
        }
        input.addEventListener('change', function () {
            var file = input.files && input.files[0];
            input.value = '';
            if (!file) return;
            readBrandLogoFile(file).then(function (item) {
                draft.brandLogoUrl = item.url;
                draft.brandLogoMeta = {
                    mimeType: item.mimeType,
                    sizeBytes: item.sizeBytes,
                    width: item.width,
                    height: item.height,
                    validated: true
                };
                renderBrandLogoPreview(draft);
                toast('品牌 LOGO 已上传');
            }).catch(function (err) {
                toast((err && err.message) || 'LOGO 上传失败');
            });
        });
        renderBrandLogoPreview(draft);
    }

    function bindMaterialUpload(draft) {
        var input = qs('#adMaterialInput');
        var zone = qs('#adMaterialZone');
        if (!input || input.getAttribute('data-bound') === '1') return;
        input.setAttribute('data-bound', '1');
        if (!Array.isArray(draft.materials)) draft.materials = [];

        function openPicker(replaceAll) {
            input.setAttribute('data-replace-all', replaceAll ? '1' : '0');
            input.click();
        }

        if (zone) {
            zone.addEventListener('click', function (e) {
                var removeBtn = e.target.closest('[data-mat-remove]');
                if (removeBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    var idx = Number(removeBtn.getAttribute('data-mat-remove'));
                    if (!isNaN(idx)) {
                        draft.materials.splice(idx, 1);
                        syncDraftMaterials(draft);
                        renderMaterialGallery(draft);
                    }
                    return;
                }
                if (e.target.closest('#adMaterialChange')) {
                    e.preventDefault();
                    var list = draft.materials || [];
                    var max = materialMaxImages(currentSlotCode());
                    var replace = !list.length || list[0].kind === 'video' || list.length >= max;
                    openPicker(replace);
                    return;
                }
                if (e.target.closest('video') || e.target.closest('.ad-mat-thumb') || e.target.closest('.ad-upload-preview')) return;
                if (e.target === input) return;
                openPicker(!(draft.materials && draft.materials.length));
            });
            zone.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openPicker(!(draft.materials && draft.materials.length));
                }
            });
            ;['dragenter', 'dragover'].forEach(function (ev) {
                zone.addEventListener(ev, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    zone.classList.add('is-drag');
                });
            });
            ;['dragleave', 'drop'].forEach(function (ev) {
                zone.addEventListener(ev, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    zone.classList.remove('is-drag');
                });
            });
            zone.addEventListener('drop', function (e) {
                var files = e.dataTransfer && e.dataTransfer.files;
                if (!files || !files.length) return;
                try {
                    var dt = new DataTransfer();
                    Array.prototype.forEach.call(files, function (f) { dt.items.add(f); });
                    input.files = dt.files;
                } catch (err) { /* ignore */ }
                input.setAttribute('data-replace-all', draft.materials && draft.materials.length ? '0' : '1');
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
        }

        input.onchange = function () {
            var files = input.files ? Array.prototype.slice.call(input.files) : [];
            if (!files.length) return;
            var slotCode = currentSlotCode();
            var replaceAll = input.getAttribute('data-replace-all') === '1';
            var hasVideo = files.some(function (f) { return /^video\//.test(f.type); });
            var hasImage = files.some(function (f) { return /^image\//.test(f.type); });
            if (hasVideo && hasImage) {
                toast('图片与视频不能混传，请分开选择');
                input.value = '';
                return;
            }
            if (hasVideo) {
                files = files.slice(0, 1);
                replaceAll = true;
            }
            var existing = Array.isArray(draft.materials) ? draft.materials.slice() : [];
            if (!replaceAll && existing.length && existing[0].kind === 'video') {
                toast('已有视频素材，请先移除后再添加图片');
                input.value = '';
                return;
            }
            if (!replaceAll && existing.length && hasVideo) {
                toast('已有图片素材，上传视频将替换全部图片');
                replaceAll = true;
            }
            var base = replaceAll ? [] : existing.filter(function (m) { return m.kind === 'image'; });
            var max = materialMaxImages(slotCode);
            if (!hasVideo && base.length >= max) {
                toast('最多上传 ' + max + ' 张图片');
                input.value = '';
                return;
            }
            if (!hasVideo) files = files.slice(0, Math.max(0, max - base.length));
            if (!files.length) {
                toast('最多上传 ' + max + ' 张图片');
                input.value = '';
                return;
            }
            Promise.all(files.map(function (f) { return readFileAsMaterial(f, slotCode); }))
                .then(function (items) {
                    draft.materials = hasVideo ? items : base.concat(items);
                    syncDraftMaterials(draft);
                    renderMaterialGallery(draft);
                    toast(hasVideo ? '视频校验通过' : ('已添加 ' + items.length + ' 张图片（共 ' + draft.materials.length + ' 张）'));
                    input.value = '';
                })
                .catch(function (err) {
                    toast((err && err.message) || '素材校验失败');
                    input.value = '';
                });
        };
        renderMaterialGallery(draft);
    }

    function toDatetimeLocalValue(d) {
        var pad = function (n) { return String(n).padStart(2, '0'); };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function syncScheduleEndFromPackage() {
        var startEl = qs('[name="startAt"]');
        var endEl = qs('[name="endAt"]');
        var pkgSel = qs('[name="packageId"]');
        if (!startEl || !endEl || !pkgSel || !pkgSel.value || !startEl.value) return;
        var pkg = FLAdService.getPackage(pkgSel.value);
        if (!pkg) return;
        var start = new Date(startEl.value);
        if (isNaN(start.getTime())) return;
        endEl.value = toDatetimeLocalValue(new Date(start.getTime() + pkg.durationDays * 86400000));
        endEl.readOnly = true;
        var hint = qs('#adScheduleHint');
        if (hint) hint.textContent = '结束时间 = 开始 + ' + pkg.durationDays + ' 天（套餐「' + pkg.name + '」）';
    }

    function initWizard() {
        var form = qs('#adCreateForm');
        if (!form) return;
        var gate = FLAdService.canCreatePaidAd(UID);
        if (!gate.ok && !location.search.includes('demo=1')) {
            toast(gate.message);
            setTimeout(function () { adGo('center'); }, 600);
            return;
        }
        if (form.getAttribute('data-wizard-bound') === '1') {
            populateSlotSelect();
            populateCreatorSelect();
            syncLandingFields();
            syncCopyField();
            enhanceAdFormSelects(form);
            if (form._adWizard && form._adWizard.reset) form._adWizard.reset();
            return;
        }
        form.setAttribute('data-wizard-bound', '1');
        var step = 1;
        var draft = {
            advertiserUid: UID, source: 'user', auditStatus: 'none', deliveryStatus: 'pending_start',
            payStatus: 'none', stats: { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
            auditLog: [], contentVersion: 1, versions: [], materials: [], materialUrl: '', materialMeta: { validated: false },
            brandLogoUrl: '', brandLogoMeta: null,
            createdAt: new Date().toISOString()
        };
        var payKey = 'pay-' + Date.now();
        function clearFieldErrors() {
            form.querySelectorAll('.ad-field.is-invalid, .field.is-invalid').forEach(function (n) {
                n.classList.remove('is-invalid');
            });
        }
        function showStep(n) {
            step = n;
            clearFieldErrors();
            form.querySelectorAll('.ad-step-panel').forEach(function (p) { p.classList.toggle('on', Number(p.getAttribute('data-step')) === n); });
            document.querySelectorAll('.ad-wizard-steps span').forEach(function (s) { s.classList.toggle('on', Number(s.getAttribute('data-step')) <= n); });
            if (n === 3) syncCopyField();
            if (n === 4) syncScheduleEndFromPackage();
            if (n === 5) renderPayConfirm(draft);
        }
        function currentStep() {
            var on = form.querySelector('.ad-step-panel.on');
            var n = on ? Number(on.getAttribute('data-step')) : step;
            return n || step;
        }
        function validateStep(n) {
            clearFieldErrors();
            if (n === 1) {
                if (!requireField('[name="name"]', '请填写广告名称')) return false;
                if (!requireField('[name="type"]', '请选择广告类型')) return false;
                if (!requireField('[name="title"]', '请填写对外标题')) return false;
                return true;
            }
            if (n === 2) {
                if (!requireField('[name="slotCode"]', '请选择投放位置')) return false;
                if (!requireField('[name="landingType"]', '请选择用户点广告后去哪')) return false;
                var landingType = (qs('[name="landingType"]') || {}).value || 'creator';
                if (landingType === 'creator' || landingType === 'live') {
                    var creatorSel = qs('#adFCreator') || qs('[name="creator"]');
                    if (!creatorSel || !String(creatorSel.value || '').trim()) {
                        markFieldInvalid(qs('#adCreatorQuery') || qs('#adLandingCreatorField'));
                        toast('请搜索并选择要引流的主播');
                        return false;
                    }
                } else {
                    var urlEl = qs('[name="landingUrl"]');
                    var url = urlEl ? String(urlEl.value || '').trim() : '';
                    if (!url) {
                        markFieldInvalid(urlEl);
                        toast('请填写网页地址');
                        return false;
                    }
                    var v = FLAdService.validateLink(url);
                    if (!v.ok) {
                        markFieldInvalid(urlEl);
                        toast(v.message);
                        return false;
                    }
                    if (!/^https?:\/\//i.test(url)) {
                        markFieldInvalid(urlEl);
                        toast('请填写以 https:// 开头的网页地址');
                        return false;
                    }
                }
                return true;
            }
            if (n === 3) {
                syncCopyField();
                if (currentSlotCode() === 'feed_video') {
                    if (!requireField('[name="copy"]', '请填写信息流文案')) return false;
                }
                if (!draft.brandLogoUrl) {
                    markFieldInvalid(qs('#adBrandLogoRow'));
                    toast('请上传品牌头像 / LOGO');
                    return false;
                }
                syncDraftMaterials(draft);
                if (!(draft.materials && draft.materials.length && draft.materialMeta && draft.materialMeta.validated)) {
                    markFieldInvalid(qs('#adMaterialZone'));
                    toast('请上传广告展示内容（可多张图片，或 1 个视频）');
                    return false;
                }
                return true;
            }
            if (n === 4) {
                if (!requireField('[name="packageId"]', '请选择套餐')) return false;
                if (!requireField('[name="startAt"]', '请选择投放开始时间')) return false;
                syncScheduleEndFromPackage();
                if (!requireField('[name="endAt"]', '结束时间未能根据套餐计算，请重选套餐')) return false;
                return true;
            }
            return true;
        }
        form._adWizard = {
            showStep: showStep,
            reset: function () {
                draft.materials = [];
                draft.materialUrl = '';
                draft.materialMeta = { validated: false };
                draft.id = '';
                payKey = 'pay-' + Date.now();
                renderMaterialGallery(draft);
                showStep(1);
            }
        };
        form.querySelectorAll('[data-next]').forEach(function (b) {
            b.onclick = function () {
                step = currentStep();
                if (!validateStep(step)) return;
                if (step < 5) showStep(step + 1);
            };
        });
        form.querySelectorAll('[data-prev]').forEach(function (b) {
            b.onclick = function () {
                step = currentStep();
                if (step > 1) showStep(step - 1);
            };
        });
        form.addEventListener('input', function (e) {
            var field = e.target && e.target.closest ? e.target.closest('.ad-field.is-invalid, .field.is-invalid') : null;
            if (field) field.classList.remove('is-invalid');
        });
        form.addEventListener('change', function (e) {
            var field = e.target && e.target.closest ? e.target.closest('.ad-field.is-invalid, .field.is-invalid') : null;
            if (field) field.classList.remove('is-invalid');
        });
        populateSlotSelect();
        populateCreatorSelect();
        syncLandingFields();
        syncCopyField();
        syncSlotStylePreview();
        var landingSel = qs('[name="landingType"]');
        if (landingSel) {
            landingSel.addEventListener('change', syncLandingFields);
        }
        var slotSel = qs('[name="slotCode"]');
        if (slotSel) slotSel.onchange = function () {
            populatePackages(slotSel.value);
            updateMaterialHint();
            syncCopyField();
            syncSlotStylePreview();
            syncScheduleEndFromPackage();
            if (draft.materials && draft.materials.length) {
                var bad = draft.materials.some(function (m) {
                    return !FLAdService.validateMaterial(slotSel.value, m).ok;
                });
                if (bad) {
                    draft.materials = [];
                    syncDraftMaterials(draft);
                    renderMaterialGallery(draft);
                    toast('已切换广告位，请按新规范重新上传素材');
                } else {
                    syncDraftMaterials(draft);
                    renderMaterialGallery(draft);
                }
            }
        };
        populatePackages(slotSel ? slotSel.value : 'feed_video');
        updateMaterialHint();
        bindBrandLogoUpload(draft);
        bindMaterialUpload(draft);
        var startEl = qs('[name="startAt"]');
        if (startEl) {
            if (!startEl.value) startEl.value = toDatetimeLocalValue(new Date());
            startEl.addEventListener('change', syncScheduleEndFromPackage);
            syncScheduleEndFromPackage();
        }

        var paying = false;
        qs('#adMockPay') && (qs('#adMockPay').onclick = function () {
            if (paying) { toast('支付处理中，请勿重复点击（幂等演示）'); return; }
            collect(draft);
            draft.id = '';
            var pkgId = qs('[name="packageId"]').value;
            paying = true;
            qs('#adMockPay').disabled = true;
            var line = qs('#adPayResultLine');
            if (line) line.textContent = '支付处理中，正在创建广告…';
            var created = FLAdService.createAndPayAd(draft, pkgId, UID, payKey);
            if (!created.ok) {
                paying = false;
                qs('#adMockPay').disabled = false;
                if (line) line.textContent = created.message || '创建失败';
                toast(created.message || '创建失败');
                return;
            }
            draft.id = created.data.adId;
            toast(created.data.processing ? '支付处理中…' : (created.message || '处理中'));
            var orderId = created.data.orderId;
            var tries = 0;
            function poll() {
                tries++;
                var paidAd = FLAdStore.getAd(draft.id);
                if (paidAd && paidAd.payStatus === 'paid') {
                    paying = false;
                    qs('#adMockPay').disabled = false;
                    draft.payStatus = paidAd.payStatus;
                    draft.auditStatus = paidAd.auditStatus;
                    if (draft.auditStatus !== 'pending_review') {
                        var sub = FLAdService.submitForReview(draft.id);
                        if (!sub.ok) {
                            if (line) line.textContent = '支付成功，但提审失败：' + (sub.message || '请稍后在详情重试');
                            toast(sub.message || '提审失败');
                            return;
                        }
                        draft.auditStatus = 'pending_review';
                    }
                    if (line) line.textContent = '支付成功，广告已创建并提交审核。';
                    toast('支付成功，已提交审核');
                    setTimeout(function () { adGo('detail', { id: draft.id }); }, 700);
                    return;
                }
                var st = orderId ? FLAdService.queryPayStatus(orderId) : { ok: false };
                var o = st.ok ? st.data.order : null;
                if (!paidAd || (o && o.payStatus === 'failed') || (st.ok === false && tries > 2 && !paidAd)) {
                    paying = false;
                    qs('#adMockPay').disabled = false;
                    if (FLAdService.discardUnpaidAd && draft.id) FLAdService.discardUnpaidAd(draft.id);
                    draft.id = '';
                    payKey = 'pay-' + Date.now();
                    if (line) line.textContent = '支付未成功，广告未创建。可调整后重试。';
                    toast('支付未成功，广告未创建');
                    return;
                }
                if (tries < 10) setTimeout(poll, 400);
                else {
                    paying = false;
                    qs('#adMockPay').disabled = false;
                    if (paidAd && paidAd.payStatus !== 'paid' && FLAdService.discardUnpaidAd) {
                        FLAdService.discardUnpaidAd(draft.id);
                        draft.id = '';
                        payKey = 'pay-' + Date.now();
                    }
                    if (line) line.textContent = '结果查询超时；若未扣款请重试，已扣款请在列表核对。';
                }
            }
            setTimeout(poll, 500);
        });
        function collect(d) {
            var f = qs('#adCreateForm');
            if (!f) return;
            d.name = f.name.value;
            d.type = f.type.value;
            d.title = f.title.value;
            d.copy = (f.slotCode && f.slotCode.value === 'feed_video' && f.copy) ? f.copy.value : '';
            d.slotCode = f.slotCode.value;
            d.landingType = f.landingType.value === 'live' ? 'creator' : f.landingType.value;
            if (d.landingType === 'creator') {
                var creatorSel = qs('#adFCreator') || qs('[name="creator"]') || qs('#adFLiveRoom') || qs('[name="liveRoom"]');
                d.landingUrl = creatorSel ? creatorSel.value : '';
            } else {
                d.landingUrl = f.landingUrl.value;
            }
            syncDraftMaterials(d);
            d.startAt = f.startAt.value;
            d.endAt = f.endAt.value;
            d.billing = 'fixed_package';
            d.audience = { mode: 'all' };
        }
        enhanceAdFormSelects(form);
        showStep(1);
    }

    function initDetail(params) {
        params = params || {};
        var id = params.id || new URLSearchParams(location.search).get('id');
        var ad = id && FLAdStore.getAd(id);
        if (!ad || ad.userDeleted) {
            toast(ad && ad.userDeleted ? '该广告已从列表删除' : '广告不存在');
            adGo('center');
            return;
        }
        if (FLAdService.expireStalePendingReviewAds) FLAdService.expireStalePendingReviewAds();
        ad = FLAdStore.getAd(id) || ad;
        if (!ad || ad.userDeleted) {
            toast(ad && ad.userDeleted ? '该广告已从列表删除' : '广告不存在');
            adGo('center');
            return;
        }
        FLAdService.syncDeliveryFromTime(ad);
        FLAdStore.upsertAd(ad);
        if (FLAdService.healAdPayOrderConsistency) {
            ad = FLAdService.healAdPayOrderConsistency(id) || ad;
        }
        if (!ad) {
            toast('广告不存在');
            adGo('center');
            return;
        }
        var root = qs('#adDetailRoot');
        if (!root) return;
        var order = pickAdOrder(id, ad);
        var refundQuote = null;
        if (order && (ad.payStatus === 'paid' || ad.payStatus === 'partial_refunded')) {
            refundQuote = FLAdService.syncOrderRefundable(order.id);
        }
        if (order && !ad.packageName && order.packageName) {
            ad.packageName = order.packageName;
            FLAdStore.upsertAd(ad);
        }
        /* 待支付/支付失败：用户尚未完成付款（或排期过期需改后再付），不展示退款申请进度 */
        var ticket = null;
        if (ad.payStatus !== 'unpaid' && ad.payStatus !== 'failed') {
            var refunds = FLAdStore.getRefunds ? FLAdStore.getRefunds() : [];
            ticket = refunds.filter(function (t) {
                return t.adId === id && t.status === 'pending';
            })[0];
            if (!ticket && order) {
                ticket = refunds.filter(function (t) {
                    return t.orderId === order.id &&
                        (t.status === 'pending' || t.status === 'processing' || t.status === 'approved');
                })[0];
            }
            if (!ticket && order && (order.payStatus === 'paid' || order.payStatus === 'partial_refunded')) {
                ticket = refunds.filter(function (t) {
                    return t.orderId === order.id;
                })[0];
            }
        }
        var cover = (ad.materials && ad.materials[0] && ad.materials[0].url) || ad.materialUrl || '';
        var isVideo = ad.materials && ad.materials[0] && ad.materials[0].kind === 'video';
        var coverHtml = cover
            ? (isVideo
                ? '<video class="ad-detail-cover-media" src="' + esc(cover) + '" muted playsinline controls></video>'
                : '<div class="ad-detail-cover-media" style="background-image:url(\'' + esc(cover).replace(/'/g, '%27') + '\')"></div>')
            : '<div class="ad-detail-cover-empty"><i class="fa-regular fa-image"></i><span>暂无素材</span></div>';
        var primary = resolvePrimaryStatus(ad);
        var statusHtml =
            '<span class="ad-badge ' + esc(primary.cls) + '">' + esc(primary.label) + '</span>' +
            (primary.hint ? '<span class="ad-detail-next">' + esc(primary.hint) + '</span>' : '');
        var schedulePayCheck = (ad.payStatus === 'unpaid' || ad.payStatus === 'failed')
            ? FLAdService.assertSchedulePayable(ad)
            : { ok: true };
        var payStatusLabel = (ad.payStatus === 'unpaid' || ad.payStatus === 'failed')
            ? '待支付'
            : (order && order.payStatus === 'refunded' && ad.payStatus !== 'refunded'
                ? '待支付'
                : (order ? label(FLAdStore.PAY_STATUS, order.payStatus) : label(FLAdStore.PAY_STATUS, ad.payStatus)));
        /* 与 WEB 共用：按下架/投放态互斥展示提示，避免运营下架误走用户退款文案 */
        function healRemovedMeta(a) {
            if (!a || a.deliveryStatus !== 'removed') return a;
            var fee = a.removedFeeAction;
            var by = a.removedBy;
            var reason = String(a.removedReason || '');
            if (!by) {
                if (fee === 'forfeit' || fee === 'refund_remaining' || /运营|平台|违规/.test(reason)) {
                    by = 'platform';
                    if (!fee || fee === 'user') fee = 'forfeit';
                } else {
                    by = reason.indexOf('用户') >= 0 ? 'user' : (reason ? 'platform' : 'user');
                    if (by === 'platform' && (!fee || fee === 'user')) fee = 'forfeit';
                }
                a.removedBy = by;
                a.removedFeeAction = fee || (by === 'platform' ? 'forfeit' : 'user');
                try { FLAdStore.upsertAd(a); } catch (eHeal) { /* ignore */ }
            }
            return a;
        }
        healRemovedMeta(ad);

        var alertHtml = '';
        if (ad.deliveryStatus === 'removed') {
            var byPlatform = ad.removedBy === 'platform';
            var bySystem = ad.removedBy === 'system';
            var feeAct = ad.removedFeeAction;
            var feeLine = '';
            if (bySystem) {
                feeLine = '费用已按未开投规则自动退回，请关注到账通知。';
            } else if (byPlatform && feeAct === 'refund_remaining') {
                feeLine = ticket && (ticket.status === 'pending' || ticket.status === 'processing')
                    ? '平台已按剩余天数生成退款单，请关注退款进度。'
                    : '平台下架时选择了退剩余天数；可退进度见下方「订单与资金」或通知。';
            } else if (byPlatform) {
                feeLine = '平台下架不退剩余费用，冻结已结转为消耗。';
            } else {
                feeLine = '如需退款请按剩余天数规则申请（已无可退则无法退款）。';
            }
            var canSoftDelete = ad.deliveryStatus === 'removed' || ad.deliveryStatus === 'ended';
            alertHtml += '<div class="ad-detail-alert is-danger"><i class="fa-solid fa-' +
                (bySystem ? 'clock' : 'box-archive') + '"></i><div><strong>' +
                (bySystem ? '系统已自动取消' : (byPlatform ? '已被平台下架' : '已下架')) +
                '</strong><p>广告已停止对外展示，<strong>不可重新上架</strong>，如需继续投放请新建广告。' +
                (ad.removedReason ? '原因：' + esc(ad.removedReason) + '。' : '') +
                feeLine +
                (canSoftDelete ? '可点下方「删除」从你的列表移除（后台仍留档）。' : '') +
                '</p></div></div>';
        } else {
            if (!schedulePayCheck.ok) {
                alertHtml += '<div class="ad-detail-alert is-danger"><i class="fa-solid fa-clock"></i><div><strong>排期不可支付</strong><p>' +
                    esc(schedulePayCheck.message) + '。请点「修改」更新投放开始时间后再支付。</p></div></div>';
            }
            if (ad.deliveryStatus === 'delivering' || ad.deliveryStatus === 'active') {
                alertHtml += '<div class="ad-detail-alert"><i class="fa-solid fa-circle-info"></i><div><strong>投放中</strong><p>如需修改内容或申请退款，请先「暂停」。</p></div></div>';
            }
            if (ad.deliveryStatus === 'paused') {
                alertHtml += '<div class="ad-detail-alert"><i class="fa-solid fa-pause"></i><div><strong>已暂停</strong><p>已停止对外展示；剩余天数已冻结，恢复后结束时间顺延。暂停不会自动退款，可退金额见下方「订单与资金」；需要退款请点「申请退款」。</p></div></div>';
            }
            if (ad.auditStatus === 'pending_review' && (ad.payStatus === 'paid' || ad.payStatus === 'partial_refunded')) {
                alertHtml += '<div class="ad-detail-alert"><i class="fa-solid fa-circle-info"></i><div><strong>待审核</strong><p>已支付、尚未开投。可点下方「申请退款」按未开投规则全额退回（须财务审核）；也可继续等待平台审核。<br>若超过投放开始时间仍未审核，系统将自动取消并全额退款。</p></div></div>';
            }
            if (ad.auditStatus === 'rejected' && ad.rejectReason) {
                alertHtml += '<div class="ad-detail-alert is-danger"><i class="fa-solid fa-circle-exclamation"></i><div><strong>驳回原因</strong><p>' + esc(ad.rejectReason) + '</p></div></div>';
            }
        }
        if (ticket && ad.deliveryStatus !== 'removed') {
            var rfMap = { pending: '待财务审核', approved: '已通过', rejected: '已驳回', processing: '退款处理中', done: '已退款' };
            alertHtml += '<div class="ad-detail-alert"><i class="fa-solid fa-rotate-left"></i><div><strong>退款申请进度</strong><p>' +
                esc(rfMap[ticket.status] || ticket.status) + ' · ' + ticket.amount + ' USDT' +
                (ticket.reviewNote ? '<br>财务意见：' + esc(ticket.reviewNote) : '') +
                (ticket.reason ? '<br>申请理由：' + esc(ticket.reason) : '') +
                '</p></div></div>';
        } else if (ticket && ad.deliveryStatus === 'removed' && ad.removedBy === 'platform' && ad.removedFeeAction === 'refund_remaining') {
            var rfMap2 = { pending: '待财务审核', approved: '已通过', rejected: '已驳回', processing: '退款处理中', done: '已退款' };
            alertHtml += '<div class="ad-detail-alert"><i class="fa-solid fa-rotate-left"></i><div><strong>平台退款进度</strong><p>' +
                esc(rfMap2[ticket.status] || ticket.status) + ' · ' + ticket.amount + ' USDT' +
                (ticket.reviewNote ? '<br>财务意见：' + esc(ticket.reviewNote) : '') +
                '</p></div></div>';
        }
        var refundMetric = (refundQuote && refundQuote.ok) ? refundQuote.maxRefundNow.toFixed(2) : '—';
        var formulaBlock = '';
        if (refundQuote && refundQuote.ok) {
            formulaBlock =
                '<div class="ad-detail-formula">' +
                '<strong>可退说明</strong>' +
                '已消耗 <b>' + refundQuote.consumedDays + '</b> / ' + refundQuote.durationDays + ' 天，剩余 <b>' + refundQuote.remainingDays + '</b> 天。' +
                (ad.deliveryStatus === 'paused' ? '（暂停期间消耗进度冻结）' : '') +
                '<br>公式：' + esc(refundQuote.formulaText) +
                '<br>本次最多可申请 <b>' + refundQuote.maxRefundNow.toFixed(2) + ' USDT</b>' +
                (ticket && ticket.status === 'pending' ? ' · 已有一笔待审申请 ' + ticket.amount + ' USDT' : '') +
                '</div>';
        }
        var orderHtml = order
            ? '<div class="ad-detail-section">' +
                '<div class="ad-detail-section-hd">订单与资金</div>' +
                '<div class="ad-detail-metrics">' +
                '<div><span>实付</span><b>' + (order.paidAmount || 0) + ' <small>USDT</small></b></div>' +
                '<div><span>冻结</span><b>' + (order.frozen || 0) + ' <small>USDT</small></b></div>' +
                '<div><span>已退</span><b>' + (order.refundedAmount || 0) + ' <small>USDT</small></b></div>' +
                '<div><span>当前可退</span><b>' + refundMetric + (refundMetric !== '—' ? ' <small>USDT</small>' : '') + '</b></div>' +
                '</div>' +
                formulaBlock +
                '<div class="ad-detail-kv">' +
                '<div><span>订单号</span><strong>' + esc(order.id) + '</strong></div>' +
                '<div><span>支付状态</span><strong>' + esc(payStatusLabel) + '</strong></div>' +
                ((ad.payStatus === 'unpaid' || ad.payStatus === 'failed') &&
                    FLAdStore.getOrders(UID).some(function (o) { return o.adId === id && o.payStatus === 'refunded'; })
                    ? '<div><span>说明</span><strong>原订单已退回余额，请按新套餐重新支付</strong></div>'
                    : '') +
                (refundQuote && refundQuote.ok
                    ? '<div><span>消耗进度</span><strong>' + refundQuote.consumedDays + ' / ' + refundQuote.durationDays + ' 天</strong></div>' +
                      '<div><span>剩余天数</span><strong>' + refundQuote.remainingDays + ' 天</strong></div>'
                    : '') +
                '</div></div>'
            : '<div class="ad-detail-section"><div class="ad-detail-section-hd">订单与资金</div><p class="ad-muted" style="margin:0">暂无订单</p></div>';

        root.innerHTML =
            '<div class="ad-detail">' +
            '<div class="ad-detail-top">' +
            '<div class="ad-detail-cover">' + coverHtml + '</div>' +
            '<div class="ad-detail-main">' +
            '<div class="ad-detail-badges">' + statusHtml + '</div>' +
            '<h2 class="ad-detail-name">' + esc(ad.name) + '</h2>' +
            '<p class="ad-detail-meta">' + esc(ad.id) + ' · v' + esc(String(ad.contentVersion || 1)) + ' · ' + esc(slotName(ad.slotCode)) + '</p>' +
            '</div></div>' +
            alertHtml +
            '<div class="ad-detail-section">' +
            '<div class="ad-detail-section-hd">投放信息</div>' +
            '<div class="ad-detail-kv">' +
            '<div><span>套餐</span><strong>' + esc(ad.packageName || (order && order.packageName) || '—') + '</strong></div>' +
            '<div><span>排期</span><strong>' + esc(fmtDateRange(ad.startAt, ad.endAt)) + '</strong></div>' +
            '<div><span>广告位</span><strong>' + esc(slotName(ad.slotCode)) + '</strong></div>' +
            '<div><span>落地</span><strong>' + esc(ad.landingType === 'creator' || ad.landingType === 'live' ? '主播主页' : (ad.landingType === 'external' ? '外部网页' : (ad.landingType || '—'))) + '</strong></div>' +
            '<div><span>对外标题</span><strong>' + esc(ad.title || '—') + '</strong></div>' +
            (ad.slotCode === 'home_banner'
                ? (ad.copy
                    ? '<div><span>信息流文案</span><strong>' + esc(ad.copy) + '</strong></div>'
                    : '<div><span>信息流文案</span><strong class="ad-muted">Banner 位不展示文案</strong></div>')
                : '<div><span>信息流文案</span><strong>' + esc(ad.copy || '—') + '</strong></div>') +
            '</div></div>' +
            orderHtml +
            '<div class="ad-detail-section ad-edit-panel" id="adEditPanel" hidden>' +
            '<div class="ad-detail-section-hd">修改广告内容</div>' +
            '<p class="ad-muted" style="margin:0 0 12px">' +
            (ad.auditStatus === 'rejected'
                ? '驳回后可改素材文案；若要换套餐，原订单（未开投）将退回余额并当场扣新套餐款，成功后可再提审。'
                : '已通过的广告须先暂停再改；修改标题/文案后需重新审核。') +
            '</p>' +
            '<div class="ad-field"><label>品牌头像 / LOGO</label>' +
            '<p class="ad-muted ad-field-help">信息流顶栏展示；正方形 JPG / PNG / WebP，边长 ≥ 200px</p>' +
            '<div class="ad-brand-logo-row" id="adEditBrandLogoRow">' +
            '<div class="ad-brand-logo-preview' + (ad.brandLogoUrl ? ' has-logo' : '') + '" id="adEditBrandLogoPreview"' +
            (ad.brandLogoUrl ? ' style="background-image:url(\'' + esc(ad.brandLogoUrl).replace(/'/g, '%27') + '\')"' : '') + '>' +
            (ad.brandLogoUrl ? '' : '<i class="fa-regular fa-image"></i>') + '</div>' +
            '<div class="ad-brand-logo-actions">' +
            '<input type="file" id="adEditBrandLogoInput" accept="image/jpeg,image/png,image/webp" hidden>' +
            '<button type="button" class="btn btn-secondary btn-sm" id="adEditBrandLogoPick"><i class="fa-solid fa-upload"></i> 更换 LOGO</button>' +
            '</div></div></div>' +
            '<div class="ad-field"><label for="adEditTitle">对外标题</label>' +
            '<input id="adEditTitle" type="text" maxlength="80" value="' + esc(ad.title || '') + '" autocomplete="off"></div>' +
            '<div class="ad-field"><label for="adEditCopy">文案</label>' +
            '<textarea id="adEditCopy" rows="3" maxlength="500" placeholder="信息流文案；Banner 可留空">' + esc(ad.copy || '') + '</textarea></div>' +
            (ad.landingType === 'external'
                ? '<div class="ad-field"><label for="adEditUrl">落地页链接</label>' +
                  '<input id="adEditUrl" type="url" value="' + esc(ad.landingUrl || '') + '" placeholder="https://" autocomplete="off"></div>'
                : '') +
            (ad.auditStatus === 'rejected' || ad.auditStatus === 'draft' || ad.auditStatus === 'none'
                ? '<div class="ad-field"><label for="adEditPkg">套餐</label><select id="adEditPkg" class="ad-select-native"></select>' +
                  '<p class="ad-muted ad-field-help">更换套餐会同步广告位与排期，并当场完成新套餐支付</p></div>' +
                  '<div class="ad-field"><label for="adEditStart">投放开始时间</label>' +
                  '<input id="adEditStart" type="datetime-local"></div>'
                : '') +
            '<div class="ad-step-actions" style="margin-top:8px">' +
            '<button type="button" class="btn btn-secondary" id="adEditCancel">取消</button>' +
            '<button type="button" class="btn btn-primary" id="adEditSave">保存</button>' +
            '</div></div>' +
            '<div class="ad-detail-section ad-refund-panel" id="adRefundPanel" hidden>' +
            '<div class="ad-detail-section-hd">申请退款</div>' +
            '<p class="ad-muted ad-refund-hint" id="adRefundHint">请填写申请理由，提交后由财务审核；暂停不会自动退款。</p>' +
            '<div class="ad-field"><label for="adRefundReason">申请理由 <span style="color:#f87171">*</span></label>' +
            '<textarea id="adRefundReason" rows="3" maxlength="200" placeholder="例如：活动取消、素材需更换、暂时不投放…"></textarea></div>' +
            '<div class="ad-step-actions">' +
            '<button type="button" class="btn btn-secondary" id="adRefundCancel">取消</button>' +
            '<button type="button" class="btn btn-primary" id="adRefundSubmit">提交申请</button>' +
            '</div></div>' +
            (ad.versions && ad.versions.length
                ? '<p class="ad-detail-foot">内容变更将重新审核 · 已有 ' + ad.versions.length + ' 个历史版本</p>'
                : '') +
            '</div>';

        qs('#adBtnStats') && (qs('#adBtnStats').onclick = function () { adGo('stats', { id: id }); });
        qs('#adBtnPause') && (qs('#adBtnPause').onclick = function () {
            if (!confirm('暂停后停止展示；剩余投放天数冻结，恢复时结束时间顺延。暂停不自动退款。确认？')) return;
            var r = FLAdService.pauseAd(id, '用户暂停');
            toast(r.ok ? '已暂停，剩余天数已冻结' : r.message);
            if (r.ok) initDetail({ id: id });
        });
        qs('#adBtnResume') && (qs('#adBtnResume').onclick = function () {
            var r = FLAdService.resumeAd(id);
            if (r.ok) {
                var tip = '已恢复投放';
                if (r.data && r.data.endAt) tip += '，结束时间已顺延至 ' + String(r.data.endAt).slice(0, 16).replace('T', ' ');
                toast(tip);
                initDetail({ id: id });
            } else toast(r.message);
        });
        var editBrandLogoUrl = ad.brandLogoUrl || '';
        function syncEditBrandLogoPreview() {
            var preview = qs('#adEditBrandLogoPreview');
            if (!preview) return;
            if (editBrandLogoUrl) {
                preview.style.backgroundImage = "url('" + String(editBrandLogoUrl).replace(/'/g, '%27') + "')";
                preview.classList.add('has-logo');
                preview.innerHTML = '';
            } else {
                preview.style.backgroundImage = '';
                preview.classList.remove('has-logo');
                preview.innerHTML = '<i class="fa-regular fa-image"></i>';
            }
        }
        qs('#adEditBrandLogoPick') && (qs('#adEditBrandLogoPick').onclick = function () {
            var input = qs('#adEditBrandLogoInput');
            if (input) input.click();
        });
        qs('#adEditBrandLogoInput') && (qs('#adEditBrandLogoInput').onchange = function () {
            var input = qs('#adEditBrandLogoInput');
            var file = input && input.files && input.files[0];
            if (input) input.value = '';
            if (!file) return;
            readBrandLogoFile(file).then(function (item) {
                editBrandLogoUrl = item.url;
                syncEditBrandLogoPreview();
                toast('品牌 LOGO 已更新，保存后生效');
            }).catch(function (err) {
                toast((err && err.message) || 'LOGO 上传失败');
            });
        });
        qs('#adBtnEdit') && (qs('#adBtnEdit').onclick = function () {
            var panel = qs('#adEditPanel');
            if (!panel) return;
            panel.hidden = false;
            editBrandLogoUrl = (FLAdStore.getAd(id) || ad).brandLogoUrl || editBrandLogoUrl;
            syncEditBrandLogoPreview();
            var pkgSel = qs('#adEditPkg');
            if (pkgSel) {
                var pkgs = (FLAdStore.getPackages ? FLAdStore.getPackages() : []).filter(function (p) {
                    return p.enabled !== false;
                });
                var userSlots = {};
                (FLAdStore.getSlots ? FLAdStore.getSlots() : []).forEach(function (s) {
                    if (s.userAllowed !== false) userSlots[s.code] = 1;
                });
                pkgs = pkgs.filter(function (p) { return userSlots[p.slotCode]; });
                var curPkg = ad.packageId || '';
                pkgSel.innerHTML = pkgs.map(function (p) {
                    return '<option value="' + esc(p.id) + '"' + (p.id === curPkg ? ' selected' : '') + '>' +
                        esc(p.name) + ' · ' + p.priceUsdt + ' USDT · ' + p.durationDays + ' 天</option>';
                }).join('');
                enhanceAdSelect(pkgSel);
            }
            var startEl = qs('#adEditStart');
            if (startEl && ad.startAt) {
                try {
                    var d = new Date(ad.startAt);
                    if (!isNaN(d.getTime())) startEl.value = toDatetimeLocalValue(d);
                } catch (e2) { /* ignore */ }
            }
            try { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { /* ignore */ }
            var titleInput = qs('#adEditTitle');
            if (titleInput) titleInput.focus();
        });
        qs('#adEditCancel') && (qs('#adEditCancel').onclick = function () {
            var panel = qs('#adEditPanel');
            if (panel) panel.hidden = true;
        });
        qs('#adEditSave') && (qs('#adEditSave').onclick = function () {
            var live = FLAdStore.getAd(id) || ad;
            if (FLAdService.healAdPayOrderConsistency) {
                live = FLAdService.healAdPayOrderConsistency(id) || live;
            }
            var titleEl = qs('#adEditTitle');
            var copyEl = qs('#adEditCopy');
            var urlEl = qs('#adEditUrl');
            var pkgEl = qs('#adEditPkg');
            var startEl = qs('#adEditStart');
            var title = titleEl ? String(titleEl.value || '').trim() : '';
            var copy = copyEl ? String(copyEl.value || '').trim() : '';
            if (!title) { toast('请填写对外标题'); return; }
            var packageSwapped = false;
            var canChangePkg = live.auditStatus === 'rejected' || live.auditStatus === 'draft' || live.auditStatus === 'none';
            if (pkgEl && canChangePkg) {
                var pkgId = pkgEl.value;
                var startVal = live.startAt;
                var startChanged = false;
                if (startEl && startEl.value) {
                    var nextStartMs = new Date(startEl.value).getTime();
                    if (isNaN(nextStartMs)) {
                        toast('投放开始时间格式无效');
                        return;
                    }
                    var prevStartMs = live.startAt ? new Date(live.startAt).getTime() : NaN;
                    startChanged = isNaN(prevStartMs) || Math.abs(nextStartMs - prevStartMs) > 60000;
                    startVal = new Date(startEl.value).toISOString();
                }
                if (startChanged && new Date(startEl.value).getTime() <= Date.now()) {
                    toast('投放开始时间须晚于当前时间');
                    return;
                }
                if (pkgId !== live.packageId || startChanged) {
                    var pr = FLAdService.changePackageOnRejected(id, pkgId, startVal);
                    if (!pr.ok) { toast(pr.message || '保存失败'); return; }
                    packageSwapped = !!(pr.data && pr.data.paid);
                    live = FLAdStore.getAd(id) || live;
                }
            }
            if (!editBrandLogoUrl) { toast('请上传品牌头像 / LOGO'); return; }
            var patch = { title: title, copy: copy, brandLogoUrl: editBrandLogoUrl };
            if (urlEl) patch.landingUrl = String(urlEl.value || '').trim();
            var r = FLAdService.updateAdContent(id, patch);
            if (!r.ok) { toast(r.message || '保存失败'); return; }
            if (packageSwapped) {
                toast('套餐已更换并完成支付，请点击「重新提交审核」');
            } else if (live.auditStatus === 'rejected') {
                toast('已保存，请点击「重新提交审核」');
            } else if (r.data && r.data.reReview && live.payStatus === 'paid') {
                var sr = FLAdService.submitForReview(id);
                toast(sr.ok ? '已保存并重新提交审核' : ('已保存，但提交审核失败：' + sr.message));
            } else {
                toast('已保存');
            }
            initDetail({ id: id });
        });
        qs('#adBtnPay') && (qs('#adBtnPay').onclick = function () {
            toast('创建广告须在支付成功后生成，详情页不再支持补支付');
        });
        qs('#adBtnResubmit') && (qs('#adBtnResubmit').onclick = function () {
            var r = FLAdService.submitForReview(id);
            toast(r.ok ? '已重新提交审核' : r.message);
            if (r.ok) initDetail({ id: id });
        });
        qs('#adBtnRefund') && (qs('#adBtnRefund').onclick = function () {
            var orderRow = FLAdStore.getOrders(UID).filter(function (o) { return o.adId === id; })[0];
            if (!orderRow) { toast('无关联订单'); return; }
            var q = FLAdService.syncOrderRefundable(orderRow.id);
            if (!q.ok) { toast(q.message); return; }
            if (q.maxRefundNow <= 0) { toast('当前无可退金额'); return; }
            var panel = qs('#adRefundPanel');
            var hint = qs('#adRefundHint');
            if (hint) {
                hint.innerHTML = '本次最多可退 <b>' + q.maxRefundNow.toFixed(2) + ' USDT</b>。' +
                    esc(q.formulaText) + '。请填写申请理由后提交，财务审核通过后到账。';
            }
            if (panel) {
                panel.hidden = false;
                try { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { /* ignore */ }
            }
            var reasonEl = qs('#adRefundReason');
            if (reasonEl) { reasonEl.value = ''; reasonEl.focus(); }
            panel && (panel._refundOrderId = orderRow.id);
        });
        qs('#adRefundCancel') && (qs('#adRefundCancel').onclick = function () {
            var panel = qs('#adRefundPanel');
            if (panel) panel.hidden = true;
        });
        qs('#adRefundSubmit') && (qs('#adRefundSubmit').onclick = function () {
            var panel = qs('#adRefundPanel');
            var orderId = panel && panel._refundOrderId;
            if (!orderId) {
                var ord = FLAdStore.getOrders(UID).filter(function (o) { return o.adId === id; })[0];
                orderId = ord && ord.id;
            }
            if (!orderId) { toast('无关联订单'); return; }
            var reasonEl = qs('#adRefundReason');
            var reason = reasonEl ? String(reasonEl.value || '').trim() : '';
            if (!reason || reason.length < 4) { toast('请填写退款申请理由（至少 4 个字）'); return; }
            var r = FLAdService.requestRefund(orderId, reason);
            toast(r.ok ? '退款申请已提交，等待财务审核' : r.message);
            if (r.ok) initDetail({ id: id });
        });
        qs('#adBtnRemove') && (qs('#adBtnRemove').onclick = function () {
            if (!confirm('下架后广告立即停止展示，且不可恢复（暂停可恢复，下架需新建）。确认下架？')) return;
            var r = FLAdService.removeAd(id, '用户主动下架');
            toast(r.ok ? '已下架，投放状态已更新' : r.message);
            if (r.ok) initDetail({ id: id });
        });
        qs('#adBtnDelete') && (qs('#adBtnDelete').onclick = function () {
            if (!confirm('删除后将从你的广告列表移除。订单、投放与审核记录由平台后台留档，不会物理删除。确认删除？')) return;
            var r = FLAdService.deleteAdForUser(id);
            toast(r.ok ? '已从列表删除' : r.message);
            if (r.ok) adGo('center');
        });
        var refundLocked = !!(FLAdService.findRefundInFlight && FLAdService.findRefundInFlight(id)) ||
            !!(ticket && (ticket.status === 'pending' || ticket.status === 'processing'));

        /*
         * 详情底栏按钮矩阵（以 WEB 为准，H5 共用同一套显隐）
         * 待审核(paid)           → 申请退款
         * 待开始(approved+paid)  → 数据、申请退款
         * 投放中                 → 数据、暂停
         * 已暂停                 → 数据、恢复、修改、申请退款
         * 退款审核中             → 仅「数据」
         * 审核失败(paid)         → 修改、重新提交审核、申请退款
         * 已结束 / 已下架        → 数据、删除
         * 用户侧不下架；投放中须先暂停再退款
         */
        var detailView = document.querySelector('.ad-set-view[data-ad-view="detail"]');
        var opsBar = (detailView && (detailView.querySelector('.ad-detail-ops') || detailView.querySelector('.ad-set-actions'))) ||
            qs('.ad-detail-ops') || qs('.ad-set-actions');
        function detailBtn(id) {
            return (opsBar && opsBar.querySelector('#' + id)) || document.getElementById(id);
        }
        function setDetailBtn(el, on, title) {
            if (!el) return;
            el.hidden = !on;
            if (on) {
                el.style.removeProperty('display');
            } else {
                el.style.display = 'none';
            }
            el.setAttribute('aria-hidden', on ? 'false' : 'true');
            if (title !== undefined) el.title = title || '';
        }

        var isDelivering = ad.deliveryStatus === 'delivering' || ad.deliveryStatus === 'active';
        var isPaused = ad.deliveryStatus === 'paused';
        var isClosed = ad.deliveryStatus === 'ended' || ad.deliveryStatus === 'removed';
        var isApproved = ad.auditStatus === 'approved';
        var isRejected = ad.auditStatus === 'rejected';
        var isPendingReview = ad.auditStatus === 'pending_review';

        setDetailBtn(detailBtn('adBtnStats'), isApproved);
        setDetailBtn(
            detailBtn('adBtnPause'),
            !refundLocked && isDelivering,
            refundLocked ? '退款审核中不可暂停' : ''
        );
        setDetailBtn(
            detailBtn('adBtnResume'),
            !refundLocked && isPaused,
            refundLocked ? '退款审核中不可恢复' : ''
        );
        var canEdit = !refundLocked && (
            ad.auditStatus === 'draft' || ad.auditStatus === 'none' || isRejected ||
            (isApproved && isPaused)
        );
        setDetailBtn(
            detailBtn('adBtnEdit'),
            canEdit,
            refundLocked
                ? '退款审核中不可修改'
                : (isDelivering ? '投放中不可修改，请先暂停' : '')
        );
        setDetailBtn(detailBtn('adBtnPay'), false);
        setDetailBtn(
            detailBtn('adBtnResubmit'),
            isRejected && ad.payStatus === 'paid'
        );
        /* 用户侧不下架：下架仅运营后台 */
        setDetailBtn(detailBtn('adBtnRemove'), false);
        setDetailBtn(
            detailBtn('adBtnDelete'),
            isClosed,
            '仅从你的列表移除；后台订单与投放记录留档'
        );
        var showRf = false;
        var hasPendingRf = ticket && ticket.status === 'pending';
        if (!hasPendingRf && !isClosed && !isDelivering && order && (ad.payStatus === 'paid' || ad.payStatus === 'partial_refunded')) {
            var rq = refundQuote;
            if (!rq || typeof rq.ok === 'undefined') {
                rq = FLAdService.syncOrderRefundable(order.id);
            }
            /* 待审核/待开始/已暂停/审核失败(pending_start)：有可退才显示；投放中不显示 */
            var delOk = ad.deliveryStatus === 'pending_start' || isPaused;
            showRf = !!(rq && rq.ok && rq.maxRefundNow > 0 && delOk);
        }
        var refundBtn = detailBtn('adBtnRefund');
        setDetailBtn(refundBtn, showRf);
        if (refundBtn && showRf) {
            refundBtn.textContent = '申请退款';
            var rfPrimary = isPendingReview || isRejected;
            refundBtn.classList.toggle('btn-primary', rfPrimary);
            refundBtn.classList.toggle('btn-secondary', !rfPrimary);
        }

        if (opsBar) {
            var anyVisible = Array.prototype.some.call(opsBar.querySelectorAll('.btn'), function (b) {
                return !b.hidden;
            });
            opsBar.hidden = !anyVisible;
            if (anyVisible) opsBar.style.removeProperty('display');
            else opsBar.style.display = 'none';
        }
    }

    function resolveNoticeAdId(n) {
        if (!n) return '';
        if (n.adId) return n.adId;
        if (n.orderId && FLAdStore.getOrders) {
            var ord = FLAdStore.getOrders(UID).filter(function (o) { return o.id === n.orderId; })[0];
            if (ord && ord.adId) return ord.adId;
        }
        return '';
    }

    function noticeTargetAd(n) {
        var adId = resolveNoticeAdId(n);
        if (!adId) return { adId: '', ad: null, state: 'none' };
        var ad = FLAdStore.getAd(adId);
        if (!ad) return { adId: adId, ad: null, state: 'missing' };
        if (ad.userDeleted) return { adId: adId, ad: ad, state: 'deleted' };
        return { adId: adId, ad: ad, state: 'ok' };
    }

    function initNotices() {
        var mount = qs('#adNoticeList');
        if (!mount) return;
        var list = FLAdStore.getNotices ? FLAdStore.getNotices(UID) : [];
        try { syncNoticeNav(FLAdStore.accountSummary(UID)); } catch (e) { /* ignore */ }
        if (!list.length) {
            mount.innerHTML = '<div class="ad-center-empty">暂无通知</div>';
            return;
        }
        mount.innerHTML = list.map(function (n) {
            var target = noticeTargetAd(n);
            var dead = target.state === 'missing' || target.state === 'deleted';
            var sub = esc(n.body) + ' · ' + esc((n.at || '').slice(0, 16).replace('T', ' '));
            if (dead) sub += target.state === 'deleted' ? ' · 广告已从列表删除' : ' · 关联广告不可用';
            return '<div class="ad-row' + (dead ? ' is-muted' : '') + '" data-nt="' + esc(n.id) + '" data-ad-target="' + esc(target.adId) + '" data-ad-state="' + esc(target.state) + '" style="cursor:pointer">' +
                '<div class="meta"><div class="t">' + esc(n.title) + (n.read ? '' : ' · 未读') + '</div>' +
                '<div class="s">' + sub + '</div></div></div>';
        }).join('');
        mount.querySelectorAll('[data-nt]').forEach(function (row) {
            row.onclick = function () {
                var ntId = row.getAttribute('data-nt');
                FLAdService.markNoticeRead(ntId);
                try { syncNoticeNav(FLAdStore.accountSummary(UID)); } catch (e2) { /* ignore */ }
                var n = list.filter(function (x) { return x.id === ntId; })[0];
                var target = noticeTargetAd(n);
                /* 有关联广告 → 进广告详情（非订单详情）；订单仅作兜底解析 adId */
                if (target.state === 'ok') {
                    adGo('detail', { id: target.adId });
                    return;
                }
                if (target.state === 'deleted') {
                    toast('该广告已从你的列表删除，后台订单与记录仍留档');
                } else if (target.state === 'missing') {
                    toast('关联广告不存在或已不可用');
                } else {
                    toast('该通知无可跳转的广告详情');
                }
                initNotices();
            };
        });
    }

    function initStats(params) {
        params = params || {};
        var id = params.id || new URLSearchParams(location.search).get('id');
        var ad = id && FLAdStore.getAd(id);
        if (!ad) return;
        var note = qs('#adStatsNote');
        if (note) note.textContent = '转化数据为原型模拟；异常点击已在后台标记，不计入有效 CTR（演示）。';
        ['stDImp', 'stDClk', 'stDCtr', 'stDSpend', 'stDConv'].forEach(function (elId, i) {
            var el = qs('#' + elId);
            if (!el) return;
            var s = ad.stats;
            var ctr = s.impressions ? (s.clicks / s.impressions * 100).toFixed(2) + '%' : '0%';
            el.textContent = [s.impressions, s.clicks, ctr, ad.priceUsdt || s.spend, s.conversions][i];
        });
    }

    function bootView(view, params) {
        params = params || {};
        try { syncNoticeNav(FLAdStore.accountSummary(UID)); } catch (e) { /* ignore */ }
        if (view === 'center') { renderCenter(); bindFilters(); }
        else if (view === 'apply') initApply();
        else if (view === 'wallet') initWallet();
        else if (view === 'create') initWizard();
        else if (view === 'detail') initDetail(params);
        else if (view === 'stats') initStats(params);
        else if (view === 'notices') initNotices();
    }

    function boot() {
        if (global.FLAdSettings && FLAdSettings.isSettingsAdPage()) return;
        var mode = document.body.getAttribute('data-ad-page');
        bootView(mode === 'center' ? 'center' : mode, {});
        if (mode === 'center') bindFilters();
    }

    function bindGlobalClicks() {
        if (document.documentElement.getAttribute('data-fl-ad-clicks') === '1') return;
        document.documentElement.setAttribute('data-fl-ad-clicks', '1');
        document.addEventListener('click', function (e) {
            var t = e.target && e.target.closest ? e.target.closest('#adBtnCreate, [data-ad-go], [data-ad-filter], #adPromoApplyBtn') : null;
            if (!t) return;
            if (t.id === 'adBtnCreate') {
                e.preventDefault();
                tryCreate();
                return;
            }
            if (t.id === 'adPromoApplyBtn' || t.getAttribute('data-ad-go')) {
                e.preventDefault();
                adGo(t.getAttribute('data-ad-go') || 'apply');
                return;
            }
            if (t.hasAttribute('data-ad-filter')) {
                document.querySelectorAll('[data-ad-filter]').forEach(function (b) { b.classList.remove('on'); });
                t.classList.add('on');
                renderList('adListMount', t.getAttribute('data-ad-filter') || '');
            }
        });
    }

    if (!document.documentElement.getAttribute('data-fl-ad-store-listen')) {
        document.documentElement.setAttribute('data-fl-ad-store-listen', '1');
        window.addEventListener('fl-ad-store-changed', function () {
            var centerView = document.querySelector('.ad-set-view[data-ad-view="center"].on');
            var listPanel = document.getElementById('adCenterListPanel');
            var listMount = document.getElementById('adListMount');
            /* 仅广告中心可见时刷新列表，避免创编支付中途被 heal/purge 清掉 */
            if (!centerView || !listMount || !listPanel || listPanel.hidden) return;
            var onFilter = document.querySelector('[data-ad-filter].on');
            try {
                renderList('adListMount', onFilter ? (onFilter.getAttribute('data-ad-filter') || '') : '');
                var sum = FLAdStore.accountSummary(UID);
                if (isApprovedAdvertiser(sum.advertiserStatus)) {
                    var pendingEl = document.getElementById('adPending');
                    if (pendingEl) pendingEl.textContent = String(sum.pendingAudit || 0);
                }
            } catch (e) { /* ignore */ }
        });
    }

    global.FLAdUser = { toast: toast, renderCenter: renderCenter, bootView: bootView, adGo: adGo, tryCreate: tryCreate };
    bindGlobalClicks();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})(window);
