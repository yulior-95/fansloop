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
        if (document.body.getAttribute('data-ad-shell') === 'settings') {
            var q = params.id ? '?view=' + encodeURIComponent(view) + '&id=' + encodeURIComponent(params.id) : (view === 'center' ? '' : '?view=' + encodeURIComponent(view));
            location.href = 'settings-ad.html' + q;
            return;
        }
        var q = params.id ? '?id=' + encodeURIComponent(params.id) : '';
        if (view === 'center') location.href = 'ad-center.html';
        else location.href = 'ad-' + view + '.html' + q;
    }

    function toast(msg) {
        var el = document.getElementById('adToast');
        if (!el) { alert(msg); return; }
        el.textContent = msg;
        el.classList.add('show');
        setTimeout(function () { el.classList.remove('show'); }, 2600);
    }

    function qs(s, r) { return (r || document).querySelector(s); }

    function label(map, key) { return map[key] || key; }

    function centerGate() {
        var sum = FLAdStore.accountSummary(UID);
        var banner = qs('#adQualBanner');
        if (!banner) return;
        if (sum.advertiserStatus === 'none' || sum.advertiserStatus === 'rejected') {
            banner.hidden = false;
            banner.innerHTML = '<p>投放付费广告需先申请广告主资质。</p><button type="button" class="btn btn-primary" id="adGoApply">申请广告主</button>';
            qs('#adGoApply').onclick = function () { adGo('apply'); };
        } else if (sum.advertiserStatus === 'pending') {
            banner.hidden = false;
            banner.innerHTML = '<p>资质审核中，通过后可创建并购买套餐。</p>';
        } else banner.hidden = true;
    }

    function renderCenter() {
        centerGate();
        var sum = FLAdStore.accountSummary(UID);
        var map = {
            adBal: sum.balance,
            adFrozen: sum.frozen,
            adActive: sum.activeCount,
            adPending: sum.pendingAudit,
            adPendingPay: sum.pendingPay || 0,
            adImp: sum.impressions,
            adClk: sum.clicks,
            adSpend: sum.spent || sum.spend,
            adAdvStatus: label(FLAdStore.ADVERTISER_STATUS, sum.advertiserStatus)
        };
        Object.keys(map).forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.textContent = typeof map[id] === 'number' ? map[id].toLocaleString() : map[id];
        });
        renderList('adListMount', '');
    }

    function renderList(mountId, filter) {
        var mount = document.getElementById(mountId);
        if (!mount) return;
        var list = FLAdStore.getAds({ uid: UID });
        if (filter === 'pending_review') list = list.filter(function (a) { return a.auditStatus === 'pending_review'; });
        else if (filter === 'active') list = list.filter(function (a) { return a.deliveryStatus === 'delivering' || a.deliveryStatus === 'active'; });
        else if (filter === 'paused') list = list.filter(function (a) { return a.deliveryStatus === 'paused'; });
        else if (filter === 'ended') list = list.filter(function (a) { return a.deliveryStatus === 'ended'; });
        else if (filter === 'rejected') list = list.filter(function (a) { return a.auditStatus === 'rejected'; });
        else if (filter === 'unpaid') list = list.filter(function (a) { return a.payStatus === 'unpaid'; });
        mount.innerHTML = list.map(function (a) {
            var thumb = a.materialUrl ? "background-image:url('" + a.materialUrl + "')" : 'background:#222';
            return '<article class="ad-row" data-ad-id="' + a.id + '"><div class="thumb" style="' + thumb + '"></div><div class="meta"><div class="t">' + a.name + '</div><div class="s">' +
                label(FLAdStore.AUDIT_STATUS, a.auditStatus) + ' · ' + label(FLAdStore.PAY_STATUS, a.payStatus) + ' · ' + label(FLAdStore.DELIVERY_STATUS, a.deliveryStatus) +
                (a.packageName ? ' · ' + a.packageName : '') + '</div></div></article>';
        }).join('') || '<p style="padding:16px;color:var(--text-tertiary);font-size:13px">暂无广告</p>';
        mount.querySelectorAll('[data-ad-id]').forEach(function (row) {
            row.onclick = function () { adGo('detail', { id: row.getAttribute('data-ad-id') }); };
        });
    }

    function bindFilters() {
        if (document.body.getAttribute('data-ad-filters-bound') === '1') return;
        document.body.setAttribute('data-ad-filters-bound', '1');
        document.querySelectorAll('[data-ad-filter]').forEach(function (btn) {
            btn.onclick = function () {
                document.querySelectorAll('[data-ad-filter]').forEach(function (b) { b.classList.remove('on'); });
                btn.classList.add('on');
                renderList('adListMount', btn.getAttribute('data-ad-filter') || '');
            };
        });
    }

    function initApply() {
        var form = qs('#adApplyForm');
        if (!form) return;
        form.onsubmit = function (e) {
            e.preventDefault();
            var fd = new FormData(form);
            var r = FLAdService.applyAdvertiser(UID, { companyName: fd.get('companyName'), contact: fd.get('contact') });
            toast(r.ok ? '已提交，请等待审核（原型）' : r.message);
            if (r.ok) setTimeout(function () { adGo('center'); }, 800);
        };
    }

    function initWallet() {
        var acc = FLAdStore.load().account;
        ['wBal', 'wFrozen', 'wSpent', 'wRefunded'].forEach(function (id, i) {
            var el = qs('#' + id);
            if (!el) return;
            el.textContent = [acc.balance, acc.frozen, acc.spent, acc.refunded][i];
        });
        var list = qs('#wFinList');
        if (list) {
            list.innerHTML = FLAdStore.load().finance.slice(0, 20).map(function (f) {
                return '<div class="ad-row" style="cursor:default"><div class="meta"><div class="t">' + f.type + ' · ' + f.orderNo + '</div><div class="s">' + f.amount + ' · ' + f.status + ' · ' + f.at.slice(0, 16) + '</div></div></div>';
            }).join('');
        }
        qs('#wRecharge') && (qs('#wRecharge').onclick = function () {
            var r = FLAdService.mockRecharge(500);
            toast(r.ok ? '模拟充值 +500 USDT（原型）' : r.message);
            initWallet();
        });
    }

    function populatePackages(slotCode) {
        var sel = qs('[name="packageId"]');
        if (!sel) return;
        var pkgs = FLAdStore.getPackages().filter(function (p) { return p.enabled && (!slotCode || p.slotCode === slotCode); });
        sel.innerHTML = pkgs.map(function (p) {
            return '<option value="' + p.id + '">' + p.name + ' — ' + p.priceUsdt + ' USDT</option>';
        }).join('');
        var priceEl = qs('#adPackagePrice');
        if (priceEl && pkgs[0]) priceEl.textContent = pkgs[0].priceUsdt + ' USDT（价格快照）';
        sel.onchange = function () {
            var p = FLAdService.getPackage(sel.value);
            if (p && priceEl) priceEl.textContent = p.priceUsdt + ' USDT（价格快照）';
        };
    }

    function initWizard() {
        if (document.body.getAttribute('data-wizard-bound') === '1') return;
        document.body.setAttribute('data-wizard-bound', '1');
        var gate = FLAdService.canCreatePaidAd(UID);
        if (!gate.ok && !location.search.includes('demo=1')) {
            toast(gate.message);
        }
        var step = 1;
        var draft = {
            advertiserUid: UID, source: 'user', auditStatus: 'draft', deliveryStatus: 'pending_start',
            payStatus: 'unpaid', stats: { impressions: 0, clicks: 0, spend: 0, conversions: 0 }, auditLog: [], contentVersion: 1, versions: []
        };
        var payKey = 'pay-' + Date.now();
        function showStep(n) {
            step = n;
            document.querySelectorAll('.ad-step-panel').forEach(function (p) { p.classList.toggle('on', Number(p.getAttribute('data-step')) === n); });
            document.querySelectorAll('.ad-wizard-steps span').forEach(function (s) { s.classList.toggle('on', Number(s.getAttribute('data-step')) <= n); });
        }
        document.querySelectorAll('[data-next]').forEach(function (b) {
            b.onclick = function () {
                if (step === 3) {
                    var url = qs('[name="landingUrl"]').value;
                    var v = FLAdService.validateLink(url);
                    if (!v.ok) { toast(v.message); return; }
                }
                if (step < 7) showStep(step + 1);
            };
        });
        document.querySelectorAll('[data-prev]').forEach(function (b) { b.onclick = function () { if (step > 1) showStep(step - 1); }; });
        var slotSel = qs('[name="slotCode"]');
        if (slotSel) slotSel.onchange = function () { populatePackages(slotSel.value); };
        populatePackages(slotSel ? slotSel.value : 'feed_video');

        qs('#adSaveDraft') && (qs('#adSaveDraft').onclick = function () {
            collect(draft);
            draft.id = draft.id || FLAdStore.nextAdId();
            draft.auditStatus = 'draft';
            draft.createdAt = draft.createdAt || new Date().toISOString();
            FLAdStore.upsertAd(draft);
            toast('草稿已保存');
        });

        var paying = false;
        qs('#adMockPay') && (qs('#adMockPay').onclick = function () {
            if (paying) { toast('支付处理中，请勿重复点击（幂等演示）'); return; }
            collect(draft);
            draft.id = draft.id || FLAdStore.nextAdId();
            FLAdStore.upsertAd(draft);
            var pkgId = qs('[name="packageId"]').value;
            var ord = FLAdService.createOrder(draft.id, pkgId, UID);
            if (!ord.ok) { toast(ord.message); return; }
            paying = true;
            qs('#adMockPay').disabled = true;
            var pr = FLAdService.payOrder(ord.data.order.id, payKey);
            toast(pr.processing ? '支付处理中（模拟）…' : pr.message);
            setTimeout(function () {
                paying = false;
                qs('#adMockPay').disabled = false;
                var o = FLAdStore.getOrders(UID).filter(function (x) { return x.id === ord.data.order.id; })[0];
                if (o && o.payStatus === 'paid') { toast('支付成功（原型）'); showStep(7); }
                else if (o && o.payStatus === 'failed') toast('支付失败，可重试');
            }, 1200);
        });
        qs('#adPayFailDemo') && (qs('#adPayFailDemo').onclick = function () {
            var orders = FLAdStore.getOrders(UID);
            if (orders[0]) FLAdService.simulatePayFail(orders[0].id);
            toast('已模拟支付失败');
        });
        qs('#adSubmitReview') && (qs('#adSubmitReview').onclick = function () {
            collect(draft);
            var r = FLAdService.submitForReview(draft.id);
            toast(r.ok ? '已提交审核' : r.message);
            if (r.ok) setTimeout(function () { adGo('detail', { id: draft.id }); }, 600);
        });

        function collect(d) {
            var f = qs('#adCreateForm');
            if (!f) return;
            d.name = f.name.value;
            d.type = f.type.value;
            d.title = f.title.value;
            d.copy = f.copy.value;
            d.slotCode = f.slotCode.value;
            d.landingType = f.landingType.value;
            d.landingUrl = f.landingUrl.value;
            d.startAt = f.startAt.value;
            d.endAt = f.endAt.value;
            d.billing = 'fixed_package';
            d.audience = { regions: [f.region.value], langs: ['zh-CN'], minAge: 18 };
            if (!d.materialUrl) d.materialUrl = 'https://picsum.photos/seed/ad-new/720/1280';
        }
        showStep(1);
    }

    function initDetail(params) {
        params = params || {};
        var id = params.id || new URLSearchParams(location.search).get('id');
        var ad = id && FLAdStore.getAd(id);
        if (!ad) return;
        FLAdService.syncDeliveryFromTime(ad);
        FLAdStore.upsertAd(ad);
        var root = qs('#adDetailRoot');
        if (!root) return;
        root.innerHTML = '<h2 style="margin:0 0 8px">' + ad.name + '</h2><p style="font-size:12px;color:var(--text-tertiary)">' + ad.id + ' · v' + ad.contentVersion + '</p>' +
            '<div style="height:160px;border-radius:12px;background:url(' + ad.materialUrl + ') center/cover;margin:12px 0"></div>' +
            '<p><b>' + ad.title + '</b><br>' + ad.copy + '</p>' +
            '<p style="font-size:12px">审核：' + label(FLAdStore.AUDIT_STATUS, ad.auditStatus) + '<br>支付：' + label(FLAdStore.PAY_STATUS, ad.payStatus) +
            '<br>投放：' + label(FLAdStore.DELIVERY_STATUS, ad.deliveryStatus) + '</p>' +
            (ad.rejectReason ? '<p style="color:#f87171;font-size:12px">驳回：' + ad.rejectReason + '</p>' : '') +
            (ad.versions && ad.versions.length ? '<p style="font-size:11px;color:var(--text-tertiary)">内容变更后将重新审核（共 ' + ad.versions.length + ' 个历史版本）</p>' : '');

        qs('#adBtnStats') && (qs('#adBtnStats').onclick = function () { adGo('stats', { id: id }); });
        qs('#adBtnPause') && (qs('#adBtnPause').onclick = function () {
            if (!confirm('暂停后停止展示，不自动退款。确认？')) return;
            var r = FLAdService.pauseAd(id, '用户暂停');
            toast(r.ok ? '已暂停' : r.message);
            if (r.ok) initDetail({ id: id });
        });
        qs('#adBtnResume') && (qs('#adBtnResume').onclick = function () {
            var r = FLAdService.resumeAd(id);
            toast(r.ok ? '已恢复投放' : r.message);
            if (r.ok) initDetail({ id: id });
        });
        qs('#adBtnResubmit') && (qs('#adBtnResubmit').onclick = function () { adGo('create', { id: id }); });
        qs('#adBtnRefund') && (qs('#adBtnRefund').onclick = function () {
            var order = FLAdStore.getOrders(UID).filter(function (o) { return o.adId === id; })[0];
            if (!order) { toast('无关联订单'); return; }
            var amt = order.refundableAmount - order.refundedAmount;
            if (!confirm('申请退款 ' + amt.toFixed(2) + ' USDT？（规则：待业务确认）')) return;
            var r = FLAdService.refundOrder(order.id, amt, '未开始投放用户取消', 'rf-' + order.id);
            toast(r.ok ? '退款处理中（模拟）' : r.message);
            setTimeout(function () { initDetail({ id: id }); }, 900);
        });
        qs('#adBtnRemove') && (qs('#adBtnRemove').onclick = function () {
            if (!confirm('下架后不可直接恢复，确认？')) return;
            var r = FLAdService.removeAd(id, '用户主动下架');
            toast(r.ok ? '已下架' : r.message);
            if (r.ok) initDetail({ id: id });
        });
        if (qs('#adBtnPause')) qs('#adBtnPause').hidden = ad.deliveryStatus !== 'delivering' && ad.deliveryStatus !== 'active';
        if (qs('#adBtnResume')) qs('#adBtnResume').hidden = ad.deliveryStatus !== 'paused';
        if (qs('#adBtnResubmit')) qs('#adBtnResubmit').hidden = ad.auditStatus !== 'rejected';
        if (qs('#adBtnRefund')) qs('#adBtnRefund').hidden = ad.deliveryStatus !== 'pending_start' || ad.payStatus !== 'paid';
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
        if (view === 'center') { renderCenter(); bindFilters(); }
        else if (view === 'apply') initApply();
        else if (view === 'wallet') initWallet();
        else if (view === 'create') initWizard();
        else if (view === 'detail') initDetail(params);
        else if (view === 'stats') initStats(params);
    }

    function boot() {
        if (global.FLAdSettings && FLAdSettings.isSettingsAdPage()) return;
        var mode = document.body.getAttribute('data-ad-page');
        bootView(mode === 'center' ? 'center' : mode, {});
        if (mode === 'center') bindFilters();
    }

    global.FLAdUser = { toast: toast, renderCenter: renderCenter, bootView: bootView, adGo: adGo };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})(window);
