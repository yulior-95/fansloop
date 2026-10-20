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

    function toast(msg) {
        var el = document.getElementById('adToast');
        if (!el) { alert(msg); return; }
        el.textContent = msg;
        el.classList.add('show');
        setTimeout(function () { el.classList.remove('show'); }, 2600);
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

    function renderAdRowHtml(a) {
        FLAdStore.load();
        var thumb = a.materialUrl
            ? "background-image:url('" + esc(a.materialUrl) + "')"
            : 'background-color:var(--bg-inset,#1a1a24)';
        var line2 = esc(a.title || a.type || '');
        var badges =
            '<span class="ad-badge ' + badgeClass('audit', a.auditStatus) + '">' + esc(label(FLAdStore.AUDIT_STATUS, a.auditStatus)) + '</span>' +
            (a.payStatus && a.payStatus !== 'none' ? '<span class="ad-badge ' + badgeClass('pay', a.payStatus) + '">' + esc(label(FLAdStore.PAY_STATUS, a.payStatus)) + '</span>' : '') +
            '<span class="ad-badge ' + badgeClass('del', a.deliveryStatus) + '">' + esc(label(FLAdStore.DELIVERY_STATUS, a.deliveryStatus)) + '</span>';
        var subParts = [slotName(a.slotCode), fmtDateRange(a.startAt, a.endAt)];
        if (a.packageName) subParts.push(a.packageName);
        var imp = a.stats && a.stats.impressions ? a.stats.impressions : 0;
        if (imp > 0) subParts.push(imp.toLocaleString() + ' 曝光');
        var price = a.priceUsdt != null ? a.priceUsdt : (a.budgetTotal || '');
        var side =
            '<div class="ad-row-side">' +
            (price !== '' ? '<span class="ad-row-price">' + esc(String(price)) + ' USDT</span>' : '') +
            (a.stats && a.stats.spend ? '<span class="ad-row-stat">消耗 ' + esc(a.stats.spend.toLocaleString()) + '</span>' : '') +
            '</div>';
        return '<article class="ad-row" data-ad-id="' + esc(a.id) + '">' +
            '<div class="thumb" style="' + thumb + '"></div>' +
            '<div class="meta">' +
            '<div class="ad-row-head"><div class="t">' + esc(a.name) + '</div><span class="ad-row-id">' + esc(a.id) + '</span></div>' +
            (line2 ? '<div class="ad-row-line2">' + line2 + '</div>' : '') +
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
        var m = roleMeta(sum.advertiserStatus);
        strip.innerHTML = '<span class="pill ' + m.pill + '"><i class="fa-solid ' + m.icon + '"></i> ' + m.text + '</span>';
    }

    function syncCenterToolbar(sum) {
        var approved = sum.advertiserStatus === 'approved';
        var canApply = sum.advertiserStatus === 'none' || sum.advertiserStatus === 'rejected';
        var createBtn = qs('#adBtnCreate');
        var applyBtn = qs('#adBtnApplyQual');
        var walletBtn = qs('#adBtnWallet');
        if (createBtn) {
            createBtn.disabled = !approved;
            createBtn.title = approved ? '' : (FLAdService.canCreatePaidAd(UID).message || '');
        }
        if (applyBtn) {
            applyBtn.hidden = !canApply;
            applyBtn.style.display = canApply ? '' : 'none';
            applyBtn.setAttribute('aria-hidden', canApply ? 'false' : 'true');
        }
        if (walletBtn) walletBtn.disabled = sum.advertiserStatus === 'none';
        if (createBtn && !createBtn.getAttribute('data-create-bound')) {
            createBtn.setAttribute('data-create-bound', '1');
            createBtn.addEventListener('click', function (e) {
                e.preventDefault();
                tryCreate();
            });
        }
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
            } else if (sum.advertiserStatus === 'pending') {
                banner.hidden = false;
                banner.innerHTML = '<span class="ad-qual-reason">资质审核中</span>';
            } else if (sum.advertiserStatus === 'restricted' || sum.advertiserStatus === 'disabled') {
                banner.hidden = false;
                banner.innerHTML = '<span class="ad-qual-reason">账户' + esc(label(FLAdStore.ADVERTISER_STATUS, sum.advertiserStatus)) + '，请联系平台处理</span>';
            }
        }
        var overview = qs('#adCenterOverview');
        var grid = qs('.ad-center-wrap .ad-web-grid');
        var approved = isApprovedAdvertiser(sum.advertiserStatus);
        if (overview) overview.hidden = !approved;
        if (grid) grid.classList.toggle('ad-web-grid--solo', !approved);
    }

    function renderCenter() {
        var sum = FLAdStore.accountSummary(UID);
        centerGate();
        renderRoleStrip(sum);
        syncCenterToolbar(sum);
        if (isApprovedAdvertiser(sum.advertiserStatus)) {
            var map = {
                adBal: sum.balance,
                adFrozen: sum.frozen,
                adActive: sum.activeCount,
                adPending: sum.pendingAudit,
                adPendingPay: sum.pendingPay || 0,
                adImp: sum.impressions,
                adClk: sum.clicks,
                adSpend: sum.spent || sum.spend
            };
            Object.keys(map).forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.textContent = typeof map[id] === 'number' ? map[id].toLocaleString() : map[id];
            });
        }
        var legacyStatus = qs('#adAdvStatus');
        if (legacyStatus) legacyStatus.textContent = label(FLAdStore.ADVERTISER_STATUS, sum.advertiserStatus);
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
        if (!list.length) {
            mount.innerHTML = '<div class="ad-center-empty">暂无广告</div>';
            return;
        }
        mount.innerHTML = list.map(function (a) { return renderAdRowHtml(a); }).join('');
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
            var finLabel = { recharge: '充值', refund: '退款', freeze: '冻结', spend: '消耗', pay: '支付', ad_purchase: '购买套餐' };
            list.innerHTML = FLAdStore.load().finance.slice(0, 20).map(function (f) {
                var ti = finLabel[f.type] || f.type;
                return '<div class="ad-row" style="cursor:default"><div class="meta"><div class="t">' + ti + ' · ' + esc(f.orderNo) + '</div><div class="s">' +
                    (f.amount > 0 ? '+' : '') + f.amount + ' USDT · ' + f.status + ' · ' + f.at.slice(0, 16) + '</div></div></div>';
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
            syncScheduleEndFromPackage();
        };
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
        if (document.body.getAttribute('data-wizard-bound') === '1') return;
        document.body.setAttribute('data-wizard-bound', '1');
        var gate = FLAdService.canCreatePaidAd(UID);
        if (!gate.ok && !location.search.includes('demo=1')) {
            toast(gate.message);
            setTimeout(function () { adGo('center'); }, 600);
            return;
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
            if (n === 5) syncScheduleEndFromPackage();
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
        var startEl = qs('[name="startAt"]');
        if (startEl) startEl.addEventListener('change', syncScheduleEndFromPackage);

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
            var pkgId = qs('[name="packageId"]').value;
            var sch = FLAdService.applyPackageSchedule(draft, pkgId);
            if (!sch.ok) { toast(sch.message); return; }
            FLAdStore.upsertAd(draft);
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
        var order = FLAdStore.getOrders(UID).filter(function (o) { return o.adId === id; })[0];
        var refundLine = '';
        var refundQuote = null;
        if (order && (ad.payStatus === 'paid' || ad.payStatus === 'partial_refunded')) {
            refundQuote = FLAdService.syncOrderRefundable(order.id);
        }
        if (refundQuote && refundQuote.ok && refundQuote.maxRefundNow > 0) {
            refundLine = '<p class="ad-muted" style="margin-top:10px">可退约 <strong>' + refundQuote.maxRefundNow.toFixed(2) + '</strong> USDT · 已消耗 ' +
                refundQuote.consumedDays + '/' + refundQuote.durationDays + ' 天 · ' + refundQuote.formulaText + '</p>';
        }
        root.innerHTML = '<h2 style="margin:0 0 8px">' + esc(ad.name) + '</h2><p style="font-size:12px;color:var(--text-tertiary)">' + esc(ad.id) + ' · v' + ad.contentVersion +
            (ad.packageName ? ' · ' + esc(ad.packageName) : '') + '</p>' +
            '<div style="height:160px;border-radius:12px;background:url(' + esc(ad.materialUrl) + ') center/cover;margin:12px 0"></div>' +
            '<p><b>' + esc(ad.title) + '</b><br>' + esc(ad.copy) + '</p>' +
            '<p style="font-size:12px">审核：' + label(FLAdStore.AUDIT_STATUS, ad.auditStatus) + '<br>支付：' + label(FLAdStore.PAY_STATUS, ad.payStatus) +
            '<br>投放：' + label(FLAdStore.DELIVERY_STATUS, ad.deliveryStatus) + '<br>排期：' + esc(fmtDateRange(ad.startAt, ad.endAt)) + '</p>' +
            refundLine +
            (ad.rejectReason ? '<p style="color:#f87171;font-size:12px">驳回：' + esc(ad.rejectReason) + '</p>' : '') +
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
            var orderRow = FLAdStore.getOrders(UID).filter(function (o) { return o.adId === id; })[0];
            if (!orderRow) { toast('无关联订单'); return; }
            var q = FLAdService.syncOrderRefundable(orderRow.id);
            if (!q.ok) { toast(q.message); return; }
            var amt = q.maxRefundNow;
            if (amt <= 0) { toast('当前无可退金额'); return; }
            var msg = '按套餐剩余天数退款 ' + amt.toFixed(2) + ' USDT？\n' + q.formulaText +
                '\n（已消耗 ' + q.consumedDays + ' 天，剩余 ' + q.remainingDays + ' 天' +
                (q.feeRate ? '，含 ' + Math.round(q.feeRate * 100) + '% 手续费' : '') + '）';
            if (!confirm(msg)) return;
            var r = FLAdService.refundOrder(orderRow.id, amt, '用户申请退款', 'rf-' + orderRow.id + '-' + amt);
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
        if (qs('#adBtnRefund')) {
            var showRf = false;
            if (order && (ad.payStatus === 'paid' || ad.payStatus === 'partial_refunded')) {
                var rq = refundQuote || FLAdService.syncOrderRefundable(order.id);
                showRf = rq.ok && rq.maxRefundNow > 0 &&
                    (ad.deliveryStatus === 'pending_start' || ad.deliveryStatus === 'delivering' || ad.deliveryStatus === 'paused' || ad.deliveryStatus === 'active');
            }
            qs('#adBtnRefund').hidden = !showRf;
        }
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

    global.FLAdUser = { toast: toast, renderCenter: renderCenter, bootView: bootView, adGo: adGo, tryCreate: tryCreate };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})(window);
