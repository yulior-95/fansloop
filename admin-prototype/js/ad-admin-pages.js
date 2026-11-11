/**
 * 广告管理后台 · 各页渲染与交互（原型）
 */
(function () {
    if (!window.FLAdStore) return;
    var page = document.body.getAttribute('data-admin-page') || '';
    var pagers = {};

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }

    /** 上架/内容审核展示（与退款审核分离） */
    function contentAuditTag(ad) {
        var key = FLAdStore.contentAuditKey ? FLAdStore.contentAuditKey(ad) : (ad && ad.auditStatus);
        if (!key || key === 'none' || key === 'draft' || key === 'revoked') {
            return '<span class="ad-tag-audit mute">—</span>';
        }
        var map = { pending_review: 'warn', rejected: 'bad', approved: 'ok' };
        var cls = map[key] || 'mute';
        var label = (FLAdStore.AUDIT_STATUS && FLAdStore.AUDIT_STATUS[key]) || key;
        return '<span class="ad-tag-audit ' + cls + '">' + esc(label) + '</span>';
    }

    function latestRefundForAd(adId) {
        var list = (FLAdStore.getRefunds() || []).filter(function (r) { return r && r.adId === adId; });
        if (!list.length) return null;
        list.sort(function (a, b) {
            return String(b.createdAt || b.at || '').localeCompare(String(a.createdAt || a.at || ''));
        });
        return list[0];
    }

    /** 退款审核（独立于上架审核） */
    function refundAuditTag(ad) {
        var rf = latestRefundForAd(ad && ad.id);
        if (!rf) return '<span class="ad-tag-audit mute">—</span>';
        var map = FLAdStore.REFUND_AUDIT_STATUS || {};
        var label = map[rf.status] || REFUND_STATUS[rf.status] || rf.status || '—';
        var cls = rf.status === 'approved' || rf.status === 'done' ? 'ok'
            : rf.status === 'rejected' ? 'bad'
                : rf.status === 'pending' || rf.status === 'processing' ? 'warn' : 'mute';
        return '<span class="ad-tag-audit ' + cls + '" title="退款单 ' + esc(rf.id) + '">' + esc(label) + '</span>';
    }

    function auditTag(s) {
        /* 兼容旧调用：按裸状态码渲染上架审核 */
        return contentAuditTag({ auditStatus: s, deliveryStatus: 'pending_start' });
    }

    function delTag(s) {
        var label = FLAdStore.DELIVERY_STATUS[s] || s;
        var delivering = s === 'delivering' || s === 'active';
        var cls = delivering ? '' : s === 'paused' || s === 'removed' ? 'warn' : 'mute';
        return '<span class="ad-tag-del ' + cls + '">' + esc(label) + '</span>';
    }

    function payTag(s) {
        var label = FLAdStore.PAY_STATUS[s] || s || '—';
        var cls = s === 'paid' ? 'ok' : s === 'unpaid' ? 'warn' : 'mute';
        return '<span class="ad-tag-audit ' + (cls === 'ok' ? 'ok' : cls === 'warn' ? '' : 'mute') + '">' + esc(label) + '</span>';
    }

    var FINANCE_TYPE = {
        recharge: '充值',
        freeze: '冻结',
        unfreeze: '解冻',
        spend: '消耗',
        refund: '退款',
        pay: '支付',
        adjust: '调账'
    };
    var FINANCE_STATUS = {
        success: '成功',
        pending: '处理中',
        processing: '处理中',
        failed: '失败',
        cancelled: '已取消'
    };

    function financeTypeLabel(t) {
        return FINANCE_TYPE[t] || t || '—';
    }

    function financeStatusLabel(s) {
        return FINANCE_STATUS[s] || s || '—';
    }

    function financeStatusTag(s) {
        var cls = s === 'success' ? 'ant-tag-green' : (s === 'failed' ? 'ant-tag-red' : (s === 'pending' ? 'ant-tag-orange' : ''));
        return '<span class="ant-tag ' + cls + '">' + esc(financeStatusLabel(s)) + '</span>';
    }

    function fmtRange(startAt, endAt) {
        function f(iso) {
            if (!iso) return '—';
            return String(iso).slice(0, 16).replace('T', ' ');
        }
        if (!startAt && !endAt) return '—';
        return f(startAt) + ' ~ ' + f(endAt);
    }

    function resolveAdOrder(ad) {
        if (!ad) return null;
        var list = (FLAdStore.getOrders() || []).filter(function (o) { return o.adId === ad.id; });
        if (!list.length) return null;
        if (ad.orderId) {
            var byId = list.filter(function (o) { return o.id === ad.orderId; })[0];
            if (byId) return byId;
        }
        var paid = list.filter(function (o) {
            return o.payStatus === 'paid' || o.payStatus === 'partial_refunded';
        })[0];
        if (paid) return paid;
        var open = list.filter(function (o) {
            return o.payStatus === 'unpaid' || o.payStatus === 'failed' || o.payStatus === 'processing';
        })[0];
        return open || list[0];
    }

    function packageLabel(ad, order) {
        var name = (ad && ad.packageName) || (order && order.packageName) || '';
        var price = ad && ad.priceUsdt != null ? ad.priceUsdt
            : (order && order.priceSnapshot != null ? order.priceSnapshot : null);
        if (!name && price == null) return '—';
        if (name && price != null) return name + ' · ' + price + ' USDT';
        return name || (price + ' USDT');
    }

    function materialSrc(ad) {
        if (ad.materials && ad.materials[0] && ad.materials[0].url) return ad.materials[0].url;
        return ad.materialUrl || '';
    }

    function landingLabel(ad) {
        if (ad.landingType === 'creator' || ad.landingType === 'live') return '主播主页';
        if (ad.landingType === 'external') return '外部网页';
        return ad.landingType || '—';
    }

    var REFUND_STATUS = {
        pending: '待审核',
        approved: '已通过',
        rejected: '已驳回',
        processing: '退款处理中',
        done: '已退款'
    };

    function refundTag(s) {
        var label = REFUND_STATUS[s] || s || '—';
        var cls = s === 'approved' || s === 'done' ? 'ok' : s === 'rejected' ? 'bad' : s === 'pending' ? 'warn' : 'mute';
        return '<span class="ad-tag-audit ' + cls + '">' + esc(label) + '</span>';
    }

    function pagerMountId(tbodyId) {
        var map = {
            adTableBody: 'adTablePager',
            adReviewBody: 'adReviewPager',
            adSlotsBody: 'adSlotsPager',
            adPkgBody: 'adPkgPager',
            adAdvBody: 'adAdvPager',
            adFinBody: 'adFinPager',
            adOrdBody: 'adOrdPager',
            adRfBody: 'adRfPager',
            adRcBody: 'adRcPager',
            adStatsBody: 'adStatsPager',
            adRiskBody: 'adRiskPager'
        };
        return map[tbodyId] || tbodyId.replace('Body', 'Pager');
    }

    function getPager(tbodyId, refresh) {
        if (!window.AdminPager) return null;
        if (pagers[tbodyId]) return pagers[tbodyId];
        var mount = document.getElementById(pagerMountId(tbodyId));
        if (!mount) return null;
        pagers[tbodyId] = AdminPager.create({
            mount: mount,
            pageSize: 10,
            onChange: function () { refresh(); }
        });
        return pagers[tbodyId];
    }

    function emptyRow(cols, msg) {
        return '<tr><td colspan="' + cols + '" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">' + (msg || '暂无数据') + '</td></tr>';
    }

    function slotName(code) {
        var sl = FLAdStore.getSlots().filter(function (x) { return x.code === code; })[0];
        return sl ? sl.name : code;
    }

    function confirmDanger(msg, fn) {
        if (window.AdminModal && AdminModal.confirm) {
            AdminModal.confirm(msg, fn);
            return;
        }
        if (window.confirm(msg)) fn();
    }

    function toast(msg) {
        if (window.AdminModal && AdminModal.toast) AdminModal.toast(msg);
        else alert(msg);
    }

    function renderOverview() {
        var o = FLAdStore.adminOverview();
        ['statTotal', 'statPending', 'statActive', 'statImp', 'statClk', 'statSpend'].forEach(function (id, i) {
            var el = document.getElementById(id);
            if (!el) return;
            var vals = [o.total, o.pendingAudit, o.active, o.todayImpressions, o.todayClicks, o.todaySpend];
            el.textContent = typeof vals[i] === 'number' && i >= 3 ? vals[i].toLocaleString() : vals[i];
        });
        var labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        var bars = document.getElementById('adTrendBars');
        if (bars) {
            var h = [40, 55, 48, 72, 65, 80, 90];
            bars.innerHTML = h.map(function (v, i) {
                return '<div class="bar-col"><span class="bar" style="height:' + v + '%" title="曝光 ' + v + 'k"></span><em>' + labels[i] + '</em></div>';
            }).join('');
        }
        var pie = document.getElementById('adSourcePie');
        if (pie) {
            var total = o.userShare + o.platformShare || 1;
            var userPct = Math.round(o.userShare / total * 100);
            var donut = document.getElementById('adSourceDonut');
            if (donut) donut.style.setProperty('--user-pct', userPct + '%');
            var uEl = document.getElementById('adSourceUserCount');
            var pEl = document.getElementById('adSourcePlatformCount');
            if (uEl) uEl.textContent = o.userShare;
            if (pEl) pEl.textContent = o.platformShare;
        }
        var pendingEl = document.getElementById('statPendingLink');
        if (pendingEl) pendingEl.textContent = o.pendingAudit;
    }

    function readFilters() {
        return {
            q: (document.getElementById('adFilterQ') || {}).value || '',
            source: (document.getElementById('adFilterSource') || {}).value || '',
            auditStatus: (document.getElementById('adFilterAudit') || {}).value || '',
            deliveryStatus: (document.getElementById('adFilterDelivery') || {}).value || '',
            slotCode: (document.getElementById('adFilterSlot') || {}).value || ''
        };
    }

    function renderAdTable(tbodyId, opts) {
        opts = opts || {};
        var tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        if (window.FLAdService && FLAdService.expireStalePendingReviewAds) {
            FLAdService.expireStalePendingReviewAds();
        }
        var list = FLAdStore.getAds(readFilters());
        if (opts.pendingOnly) {
            list = list.filter(function (a) {
                return a.auditStatus === 'pending_review' &&
                    a.deliveryStatus !== 'removed' &&
                    a.deliveryStatus !== 'ended';
            });
        }
        var pager = getPager(tbodyId, function () { renderAdTable(tbodyId, opts); });
        if (pager) pager.setTotal(list.length);
        if (!list.length) {
            tbody.innerHTML = emptyRow(13, opts.pendingOnly ? '暂无待上架审核广告' : '暂无广告');
            return;
        }
        var pageList = pager ? pager.getSlice(list) : list;
        var start = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
        tbody.innerHTML = pageList.map(function (a, idx) {
            var src = FLAdStore.SOURCE[a.source] || a.source;
            var order = resolveAdOrder(a);
            var thumb = esc(materialSrc(a) || 'https://images.unsplash.com/photo-1611162617474-5b21e939e986?w=120&h=68&fit=crop');
            var titleLine = a.title ? '<div style="font-size:12px;color:rgba(0,0,0,.45);margin-top:2px">' + esc(a.title) + '</div>' : '';
            var canContentReview = a.auditStatus === 'pending_review' &&
                a.deliveryStatus !== 'removed' && a.deliveryStatus !== 'ended';
            return '<tr>' +
                '<td class="col-sticky-left-1">' + (start + idx + 1) + '</td>' +
                '<td class="col-sticky-left-2"><code>' + esc(a.id) + '</code></td>' +
                '<td><span class="ad-cell-name"><img class="ad-thumb-cell" src="' + thumb + '" alt=""><span>' + esc(a.name) +
                (a.userDeleted ? ' <span class="ant-tag" title="用户侧已删列表；后台留档">用户已删除</span>' : '') +
                titleLine +
                '</span></span></td>' +
                '<td>' + esc(a.advertiserUid) + '</td>' +
                '<td>' + esc(src) + '</td>' +
                '<td>' + esc(a.type || '—') + '</td>' +
                '<td>' + esc(slotName(a.slotCode)) + '</td>' +
                '<td style="font-size:12px;max-width:160px">' + esc(packageLabel(a, order)) + '</td>' +
                '<td>' + payTag(a.payStatus) + '</td>' +
                '<td>' + contentAuditTag(a) + '</td>' +
                '<td>' + delTag(a.deliveryStatus) + '</td>' +
                '<td style="font-size:12px;color:rgba(0,0,0,.45)">' + esc(String(a.createdAt || '').slice(0, 16).replace('T', ' ')) + '</td>' +
                '<td class="ad-cell-ops col-sticky-right"><button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-ad-detail="' + esc(a.id) + '">详情</button>' +
                (opts.showReview && canContentReview
                    ? ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-ad-review="' + esc(a.id) + '">上架审核</button>'
                    : '') +
                ((a.deliveryStatus === 'delivering' || a.deliveryStatus === 'active')
                    ? ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-ad-pause="' + esc(a.id) + '">暂停</button>'
                    : '') +
                (a.deliveryStatus === 'paused'
                    ? ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-ad-resume="' + esc(a.id) + '">恢复</button>'
                    : '') +
                /* 已下架 / 已结束不再展示下架；运营可对投放中/暂停/待开始强制下架 */
                (a.deliveryStatus !== 'removed' && a.deliveryStatus !== 'ended' &&
                    (a.deliveryStatus === 'delivering' || a.deliveryStatus === 'active' ||
                        a.deliveryStatus === 'paused' || a.deliveryStatus === 'pending_start')
                    ? ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm" style="color:#cf1322" data-ad-remove="' + esc(a.id) + '">下架</button>'
                    : '') +
                '</td></tr>';
        }).join('');
    }

    function showAdDetailModal(id) {
        var a = FLAdStore.getAd(id);
        if (!a || !window.AdminModal) return;
        var order = resolveAdOrder(a);
        var cover = materialSrc(a);
        var auditOpinion = '—';
        if (a.auditStatus === 'rejected' && a.rejectReason) auditOpinion = a.rejectReason;
        else if (a.auditLog && a.auditLog.length) {
            var last = a.auditLog[a.auditLog.length - 1];
            auditOpinion = (last.action || '') + (last.note ? ' · ' + last.note : '');
        }
        var matHtml = cover
            ? (a.materials && a.materials[0] && a.materials[0].kind === 'video'
                ? '<video class="ad-preview-img" src="' + esc(cover) + '" controls muted playsinline style="max-height:220px"></video>'
                : '<img class="ad-preview-img" src="' + esc(cover) + '" alt="">')
            : '<span style="color:rgba(0,0,0,.45)">暂无素材</span>';
        var html = '<dl class="ad-detail-grid">' +
            '<div><dt>广告编号</dt><dd>' + esc(a.id) + '</dd></div>' +
            '<div><dt>广告名称</dt><dd>' + esc(a.name) + '</dd></div>' +
            '<div><dt>广告主 UID</dt><dd>' + esc(a.advertiserUid) + '</dd></div>' +
            '<div><dt>来源</dt><dd>' + esc(FLAdStore.SOURCE[a.source] || a.source) + '</dd></div>' +
            '<div><dt>支付状态</dt><dd>' + esc(FLAdStore.PAY_STATUS[a.payStatus] || a.payStatus || '—') + '</dd></div>' +
            '<div><dt>上架审核</dt><dd>' + contentAuditTag(a) + '</dd></div>' +
            '<div><dt>投放状态</dt><dd>' + esc(FLAdStore.DELIVERY_STATUS[a.deliveryStatus] || a.deliveryStatus) + '</dd></div>' +
            (a.deliveryStatus === 'removed'
                ? '<div style="grid-column:1/-1"><dt>下架说明</dt><dd>' +
                    esc((a.removedBy === 'platform' ? '平台下架' : '用户下架') +
                        (a.removedReason ? ' · ' + a.removedReason : '') +
                        (a.removedFeeAction === 'refund_remaining' ? ' · 已发起剩余天数退款单' :
                            a.removedFeeAction === 'forfeit' ? ' · 费用不退' : '')) +
                    '</dd></div>'
                : '') +
            '<div><dt>退款</dt><dd>请到「<a href="ads-refunds.html">退款管理</a>」查看</dd></div>' +
            '<div><dt>用户删除</dt><dd>' + (a.userDeleted ? ('是 · 软删留档' + (a.userDeletedAt ? ' · ' + esc(String(a.userDeletedAt).slice(0, 16).replace('T', ' ')) : '')) : '否') + '</dd></div>' +
            '<div><dt>广告位</dt><dd>' + esc(slotName(a.slotCode)) + '</dd></div>' +
            '<div><dt>套餐</dt><dd>' + esc(packageLabel(a, order)) + '</dd></div>' +
            '<div><dt>排期</dt><dd>' + esc(fmtRange(a.startAt, a.endAt)) + '</dd></div>' +
            '<div><dt>订单号</dt><dd>' + esc((order && order.id) || a.orderId || '—') + '</dd></div>' +
            '<div><dt>落地类型</dt><dd>' + esc(landingLabel(a)) + '</dd></div>' +
            '<div><dt>落地地址</dt><dd style="word-break:break-all">' + esc(a.landingUrl || a.landingCreatorId || '—') + '</dd></div>' +
            (a.auditStatus === 'rejected'
                ? '<div style="grid-column:1/-1"><dt>驳回原因</dt><dd>' + esc(a.rejectReason || '—') + '</dd></div>'
                : '<div style="grid-column:1/-1"><dt>审核记录</dt><dd>' + esc(auditOpinion) + '</dd></div>') +
            '<div style="grid-column:1/-1"><dt>素材</dt><dd>' + matHtml + '</dd></div>' +
            '<div style="grid-column:1/-1"><dt>对外标题</dt><dd>' + esc(a.title || '—') + '</dd></div>' +
            '<div style="grid-column:1/-1"><dt>文案</dt><dd>' + esc(a.copy || '—') + '</dd></div>' +
            '</dl>';
        AdminModal.open({ title: '广告详情 · ' + a.name, body: html, width: 640 });
    }

    function showReviewModal(id) {
        var a = FLAdStore.getAd(id);
        if (!a || !window.AdminModal) return;
        var order = resolveAdOrder(a);
        var cover = materialSrc(a) || 'https://picsum.photos/seed/ad-review/800/450';
        var html = '<p style="font-size:13px;color:rgba(0,0,0,.65)">广告主 UID：<b>' + esc(a.advertiserUid) + '</b> · 来源：' + esc(FLAdStore.SOURCE[a.source] || a.source) +
            ' · 支付：' + esc(FLAdStore.PAY_STATUS[a.payStatus] || a.payStatus || '—') + '</p>' +
            '<p style="font-size:12px;color:rgba(0,0,0,.55);margin:0 0 8px">套餐：' + esc(packageLabel(a, order)) +
            '<br>排期：' + esc(fmtRange(a.startAt, a.endAt)) +
            '<br>广告位：' + esc(slotName(a.slotCode)) + '</p>' +
            (a.materials && a.materials[0] && a.materials[0].kind === 'video'
                ? '<video class="ad-preview-img" style="width:100%;height:auto;max-height:200px" src="' + esc(cover) + '" controls muted playsinline></video>'
                : '<img class="ad-preview-img" style="width:100%;height:auto;max-height:200px" src="' + esc(cover) + '" alt="">') +
            '<p style="margin:12px 0 0"><b>' + esc(a.title || a.name) + '</b><br>' + esc(a.copy || '') + '</p>' +
            '<p style="font-size:12px;color:rgba(0,0,0,.45)">落地：' + esc(landingLabel(a)) + ' · ' + esc(a.landingUrl || a.landingCreatorId || '—') + '</p>' +
            '<textarea id="adRejectReason" class="ant-input" rows="3" placeholder="拒绝原因（拒绝时必填）" style="width:100%;margin-top:12px"></textarea>';
        AdminModal.open({
            title: '广告审核 · ' + a.name,
            body: html,
            width: 560,
            footer: '<button type="button" class="ant-btn" data-modal-close>取消</button>' +
                '<button type="button" class="ant-btn ant-btn-danger" id="adBtnReject">拒绝</button>' +
                '<button type="button" class="ant-btn ant-btn-primary" id="adBtnApprove">通过</button>'
        });
        setTimeout(function () {
            var approve = document.getElementById('adBtnApprove');
            var reject = document.getElementById('adBtnReject');
            if (approve) approve.onclick = function () {
                var r = window.FLAdService ? FLAdService.adminReviewAd(id, true, '', '审核员') : { ok: !!FLAdAdmin.approve(id, '审核员') };
                if (!r.ok) { toast(r.message || '无权限'); return; }
                toast('已通过');
                AdminModal.close();
                renderAdTable('adTableBody', { showReview: page === 'ads-review' });
                renderAdTable('adReviewBody', { showReview: true });
            };
            if (reject) reject.onclick = function () {
                var reason = (document.getElementById('adRejectReason') || {}).value || '';
                if (!reason.trim()) { toast('请填写拒绝原因'); return; }
                var r = window.FLAdService ? FLAdService.adminReviewAd(id, false, reason.trim(), '审核员') : { ok: !!FLAdAdmin.reject(id, reason.trim(), '审核员') };
                if (!r.ok) { toast(r.message || '无权限'); return; }
                toast('已驳回');
                AdminModal.close();
                renderAdTable('adTableBody', { showReview: page === 'ads-review' });
                renderAdTable('adReviewBody', { showReview: true });
            };
        }, 0);
    }

    function bindTableActions(tbodyId, opts) {
        var root = document.getElementById(tbodyId);
        if (!root) return;
        var table = root.closest('table') || root;
        table.addEventListener('click', function (e) {
            var t = e.target.closest('[data-ad-detail],[data-ad-review],[data-ad-pause],[data-ad-resume],[data-ad-remove]');
            if (!t) return;
            var id = t.getAttribute('data-ad-detail') || t.getAttribute('data-ad-review') || t.getAttribute('data-ad-pause') || t.getAttribute('data-ad-resume') || t.getAttribute('data-ad-remove');
            if (t.hasAttribute('data-ad-detail')) showAdDetailModal(id);
            else if (t.hasAttribute('data-ad-review')) showReviewModal(id);
            else if (t.hasAttribute('data-ad-pause')) confirmDanger('确认暂停该广告？', function () {
                var r = window.FLAdService && FLAdService.adminPauseAd ? FLAdService.adminPauseAd(id, '运营暂停') : { ok: !!FLAdAdmin.pause(id) };
                toast(r.ok ? '已暂停' : r.message);
                renderAdTable(tbodyId, opts);
            });
            else if (t.hasAttribute('data-ad-resume')) {
                var rr = window.FLAdService && FLAdService.adminResumeAd ? FLAdService.adminResumeAd(id) : { ok: !!FLAdAdmin.resume(id) };
                toast(rr.ok ? '已恢复' : rr.message);
                renderAdTable(tbodyId, opts);
            }
            else if (t.hasAttribute('data-ad-remove')) openAdminRemoveModal(id, function () {
                renderAdTable(tbodyId, opts);
            });
        });
    }

    function openAdminRemoveModal(adId, onDone) {
        if (!window.AdminModal) {
            confirmDanger('确认下架？', function () {
                var rm = window.FLAdService && FLAdService.adminRemoveAd
                    ? FLAdService.adminRemoveAd(adId, '运营下架', 'forfeit')
                    : { ok: !!FLAdAdmin.remove(adId, '运营下架') };
                toast(rm.ok ? '已下架' : (rm.message || '失败'));
                if (onDone) onDone();
            });
            return;
        }
        var ad = FLAdStore.getAd(adId);
        AdminModal.open({
            title: '平台下架 · ' + ((ad && ad.name) || adId),
            width: 520,
            body:
                '<div class="ad-remove-form">' +
                '<p class="ad-ops-hint" style="margin:0 0 12px">下架后<strong>立即停投且不可恢复</strong>；用户端不能重新上架，只能新建广告。</p>' +
                '<div class="ant-form-item" style="margin-bottom:12px">' +
                '<label class="ad-ops-label" for="adminRemoveReason">下架原因 <span style="color:#ff4d4f">*</span></label>' +
                '<textarea class="ant-input" id="adminRemoveReason" rows="3" maxlength="200" placeholder="例如：素材违规 / 落地页风险 / 投诉成立（至少 4 个字）" style="width:100%;resize:vertical"></textarea>' +
                '</div>' +
                '<div class="ant-form-item" style="margin-bottom:0">' +
                '<label class="ad-ops-label" for="adminRemoveFee">费用处理</label>' +
                '<select class="ant-input" id="adminRemoveFee" style="width:100%">' +
                '<option value="forfeit">不退款（默认）· 剩余冻结结转为已消费</option>' +
                '<option value="refund_remaining">退剩余天数 · 生成退款单，待财务审核</option>' +
                '</select>' +
                '<div class="ad-ops-hint" style="margin-top:6px">违规下架一般选「不退款」；非用户过错（如广告位下线）可选「退剩余天数」。</div>' +
                '</div></div>',
            footer:
                '<button type="button" class="ant-btn" data-modal-close>取消</button>' +
                '<button type="button" class="ant-btn ant-btn-danger" id="adminRemoveConfirm">确认下架</button>',
            onMount: function () {
                var btn = document.getElementById('adminRemoveConfirm');
                if (!btn) return;
                btn.onclick = function () {
                    var reason = ((document.getElementById('adminRemoveReason') || {}).value || '').trim();
                    var fee = ((document.getElementById('adminRemoveFee') || {}).value || 'forfeit');
                    if (!reason || reason.length < 4) {
                        toast('请填写下架原因（至少 4 个字）');
                        return;
                    }
                    var rm = window.FLAdService && FLAdService.adminRemoveAd
                        ? FLAdService.adminRemoveAd(adId, reason, fee)
                        : { ok: !!FLAdAdmin.remove(adId, reason) };
                    if (!rm || !rm.ok) {
                        toast((rm && rm.message) || '下架失败');
                        return;
                    }
                    AdminModal.close();
                    var msg = '已下架';
                    if (fee === 'refund_remaining' && rm.refundTicket) {
                        msg += ' · 退款单 ' + rm.refundTicket.id;
                    } else if (fee === 'forfeit') {
                        msg += ' · 费用不退';
                    }
                    toast(msg);
                    if (onDone) onDone();
                };
            }
        });
    }

    var SLOT_UX = {
        feed_video: {
            place: '首页 / 订阅内容流中间',
            placeHint: '用户刷内容时按间隔插入广告，形态像普通内容卡片；按兴趣匹配与公平曝光排序。',
            h5Title: 'H5 · 竖屏信息流',
            webTitle: 'WEB · 竖滑信息流'
        },
        home_banner: {
            place: '首页最上方横幅（WEB / H5）',
            placeHint: '打开首页第一眼就能看到；多人投放时按匹配分与公平曝光排序后轮播。',
            h5Title: 'H5 · 首页顶栏下方',
            webTitle: 'WEB · 推荐区上方 Banner'
        },
        live_room: {
            place: '直播间内推广位',
            placeHint: '观看直播时出现在画面旁或底部，以小卡 / 横条形式推广；仅平台运营可投放。',
            h5Title: 'H5 · 直播间浮层',
            webTitle: 'WEB · 直播间侧栏 / 底条'
        }
    };

    var SLOT_RULE_DEFAULTS = {
        feed_video: { insertEvery: 5, maxPerSession: 3, dailyCap: 3, fallbackMode: 'skip' },
        home_banner: { rotateSec: 5, maxPerSession: 5, dailyCap: 8, fallbackMode: 'hide', closable: true },
        live_room: { intervalMin: 15, maxPerSession: 4, dailyCap: 4, fallbackMode: 'none' }
    };

    var SLOT_FALLBACK_OPTS = [
        { value: 'skip', label: '跳过，不留空位' },
        { value: 'hide', label: '隐藏广告位区域' },
        { value: 'none', label: '不展示推广' }
    ];

    function slotUx(code) {
        return SLOT_UX[code] || {
            place: '页面内广告位',
            placeHint: '按产品配置出现在对应页面。',
            h5Title: 'H5 预览',
            webTitle: 'WEB 预览'
        };
    }

    function numOr(v, fallback) {
        var n = Number(v);
        return isFinite(n) && n >= 0 ? n : fallback;
    }

    function resolveSlotRules(slot) {
        var code = slot && slot.code;
        var d = SLOT_RULE_DEFAULTS[code] || SLOT_RULE_DEFAULTS.feed_video;
        var caps = (window.FLAdStore && FLAdStore.getFreqCaps && FLAdStore.getFreqCaps()) || {};
        return {
            insertEvery: numOr(slot.insertEvery, d.insertEvery != null ? d.insertEvery : 5),
            maxPerSession: numOr(slot.maxPerSession, d.maxPerSession != null ? d.maxPerSession : 3),
            rotateSec: numOr(slot.rotateSec, d.rotateSec != null ? d.rotateSec : 5),
            intervalMin: numOr(slot.intervalMin, d.intervalMin != null ? d.intervalMin : 15),
            dailyCap: numOr(slot.dailyCap != null ? slot.dailyCap : caps[code], d.dailyCap != null ? d.dailyCap : 3),
            fallbackMode: slot.fallbackMode || d.fallbackMode || 'skip',
            closable: slot.closable != null ? !!slot.closable : (d.closable !== false)
        };
    }

    function fallbackLabel(mode) {
        for (var i = 0; i < SLOT_FALLBACK_OPTS.length; i++) {
            if (SLOT_FALLBACK_OPTS[i].value === mode) return SLOT_FALLBACK_OPTS[i].label;
        }
        return '跳过，不留空位';
    }

    function formatSlotRulesSummary(slot) {
        var r = resolveSlotRules(slot);
        if (slot.code === 'home_banner') {
            return '轮播 ' + r.rotateSec + ' 秒 · 同屏最多 ' + r.maxPerSession + ' 条' +
                (r.closable ? ' · 可关闭' : '') +
                ' · 每日 ' + r.dailyCap + ' 次 · ' + fallbackLabel(r.fallbackMode);
        }
        if (slot.code === 'live_room') {
            return '每 ' + r.intervalMin + ' 分钟可展 1 次 · 单场最多 ' + r.maxPerSession +
                ' 次 · 每日 ' + r.dailyCap + ' 次 · ' + fallbackLabel(r.fallbackMode);
        }
        return '至少隔 ' + r.insertEvery + ' 条 · 单次最多 ' + r.maxPerSession +
            ' 条 · 每日 ' + r.dailyCap + ' 次 · ' + fallbackLabel(r.fallbackMode);
    }

    function applySlotRulesRuntime(code, rules) {
        if (window.FLAdService && FLAdService.DELIVERY_RULES && FLAdService.DELIVERY_RULES[code]) {
            var dr = FLAdService.DELIVERY_RULES[code];
            if (code === 'feed_video') {
                dr.minContentBetween = rules.insertEvery;
                dr.maxPerSession = rules.maxPerSession;
            } else if (code === 'home_banner') {
                dr.maxPerSession = rules.maxPerSession;
                dr.rotateMs = Math.max(1, rules.rotateSec) * 1000;
            } else if (code === 'live_room') {
                dr.maxPerSession = 1;
            }
        }
        if (window.FLAdService && FLAdService.saveFreqCaps) {
            var caps = FLAdStore.getFreqCaps();
            caps[code] = rules.dailyCap;
            FLAdService.saveFreqCaps(caps);
        } else if (window.FLAdStore) {
            var data = FLAdStore.load();
            data.freqCaps = data.freqCaps || {};
            data.freqCaps[code] = rules.dailyCap;
            FLAdStore.save(data);
        }
    }

    function slotRulesFormHtml(slot) {
        var r = resolveSlotRules(slot);
        var code = slot.code;
        var fallbackOpts = SLOT_FALLBACK_OPTS.map(function (o) {
            return '<option value="' + o.value + '"' + (o.value === r.fallbackMode ? ' selected' : '') + '>' +
                esc(o.label) + '</option>';
        }).join('');
        var rows = '';
        if (code === 'feed_video') {
            rows +=
                '<div class="ad-slot-rule-item">' +
                '<label for="slotRuleInsertEvery">插入间隔</label>' +
                '<div class="ad-slot-rule-ctrl"><input class="ant-input" type="number" id="slotRuleInsertEvery" min="1" max="50" step="1" value="' + r.insertEvery + '"><span class="ad-slot-rule-unit">条内容插 1 条广告</span></div>' +
                '<div class="ad-slot-rule-help">数值越大，广告越稀疏</div></div>' +
                '<div class="ad-slot-rule-item">' +
                '<label for="slotRuleMaxSession">单次浏览上限</label>' +
                '<div class="ad-slot-rule-ctrl"><input class="ant-input" type="number" id="slotRuleMaxSession" min="1" max="20" step="1" value="' + r.maxPerSession + '"><span class="ad-slot-rule-unit">条 / 次浏览</span></div></div>';
        } else if (code === 'home_banner') {
            rows +=
                '<div class="ad-slot-rule-item">' +
                '<label for="slotRuleRotateSec">轮播间隔</label>' +
                '<div class="ad-slot-rule-ctrl"><input class="ant-input" type="number" id="slotRuleRotateSec" min="1" max="60" step="1" value="' + r.rotateSec + '"><span class="ad-slot-rule-unit">秒</span></div></div>' +
                '<div class="ad-slot-rule-item">' +
                '<label for="slotRuleMaxSession">同屏最多</label>' +
                '<div class="ad-slot-rule-ctrl"><input class="ant-input" type="number" id="slotRuleMaxSession" min="1" max="10" step="1" value="' + r.maxPerSession + '"><span class="ad-slot-rule-unit">条</span></div></div>' +
                '<div class="ad-slot-rule-item">' +
                '<label for="slotRuleClosable">允许关闭</label>' +
                '<div class="ad-slot-rule-ctrl"><select class="ant-input" id="slotRuleClosable">' +
                '<option value="1"' + (r.closable ? ' selected' : '') + '>是</option>' +
                '<option value="0"' + (!r.closable ? ' selected' : '') + '>否</option>' +
                '</select></div></div>';
        } else {
            rows +=
                '<div class="ad-slot-rule-item">' +
                '<label for="slotRuleIntervalMin">展示间隔</label>' +
                '<div class="ad-slot-rule-ctrl"><input class="ant-input" type="number" id="slotRuleIntervalMin" min="1" max="120" step="1" value="' + r.intervalMin + '"><span class="ad-slot-rule-unit">分钟可展示 1 次</span></div></div>' +
                '<div class="ad-slot-rule-item">' +
                '<label for="slotRuleMaxSession">单场次上限</label>' +
                '<div class="ad-slot-rule-ctrl"><input class="ant-input" type="number" id="slotRuleMaxSession" min="1" max="20" step="1" value="' + r.maxPerSession + '"><span class="ad-slot-rule-unit">次 / 场</span></div></div>';
        }
        rows +=
            '<div class="ad-slot-rule-item">' +
            '<label for="slotRuleDailyCap">每日频次上限</label>' +
            '<div class="ad-slot-rule-ctrl"><input class="ant-input" type="number" id="slotRuleDailyCap" min="1" max="50" step="1" value="' + r.dailyCap + '"><span class="ad-slot-rule-unit">次 / 用户 / 广告</span></div>' +
            '<div class="ad-slot-rule-help">同一用户对同一广告一天内最多曝光次数</div></div>' +
            '<div class="ad-slot-rule-item">' +
            '<label for="slotRuleFallback">没有广告时</label>' +
            '<div class="ad-slot-rule-ctrl"><select class="ant-input" id="slotRuleFallback">' + fallbackOpts + '</select></div></div>';
        return '<div class="ad-slot-rules-form">' +
            '<p class="ad-slot-rules-hint">' + esc(slotUx(code).placeHint) + '</p>' +
            '<div class="ad-slot-rules-grid">' + rows + '</div></div>';
    }

    function readSlotRulesForm(code) {
        var d = SLOT_RULE_DEFAULTS[code] || SLOT_RULE_DEFAULTS.feed_video;
        var maxEl = document.getElementById('slotRuleMaxSession');
        var dailyEl = document.getElementById('slotRuleDailyCap');
        var fbEl = document.getElementById('slotRuleFallback');
        var rules = {
            insertEvery: d.insertEvery,
            maxPerSession: numOr(maxEl && maxEl.value, d.maxPerSession),
            rotateSec: d.rotateSec,
            intervalMin: d.intervalMin,
            dailyCap: numOr(dailyEl && dailyEl.value, d.dailyCap),
            fallbackMode: (fbEl && fbEl.value) || d.fallbackMode,
            closable: d.closable !== false
        };
        if (code === 'feed_video') {
            var ins = document.getElementById('slotRuleInsertEvery');
            rules.insertEvery = numOr(ins && ins.value, d.insertEvery);
        } else if (code === 'home_banner') {
            var rot = document.getElementById('slotRuleRotateSec');
            var clo = document.getElementById('slotRuleClosable');
            rules.rotateSec = numOr(rot && rot.value, d.rotateSec);
            rules.closable = !(clo && clo.value === '0');
        } else if (code === 'live_room') {
            var im = document.getElementById('slotRuleIntervalMin');
            rules.intervalMin = numOr(im && im.value, d.intervalMin);
        }
        return rules;
    }

    function persistSlotRules(code, rules) {
        var data = FLAdStore.load();
        data.slots.forEach(function (s) {
            if (s.code !== code) return;
            s.insertEvery = rules.insertEvery;
            s.maxPerSession = rules.maxPerSession;
            s.rotateSec = rules.rotateSec;
            s.intervalMin = rules.intervalMin;
            s.dailyCap = rules.dailyCap;
            s.fallbackMode = rules.fallbackMode;
            s.closable = rules.closable;
            if (code === 'feed_video') {
                s.interval = '至少隔 ' + rules.insertEvery + ' 条内容插 1 条；单次浏览最多 ' + rules.maxPerSession + ' 条';
                s.cap = '同用户同广告每日最多 ' + rules.dailyCap + ' 次';
            } else if (code === 'home_banner') {
                s.interval = '多条轮播 ' + rules.rotateSec + 's；同屏最多 ' + rules.maxPerSession + ' 条' + (rules.closable ? '；可关闭' : '');
                s.cap = '同用户同广告每日最多 ' + rules.dailyCap + ' 次';
            } else {
                s.interval = '每 ' + rules.intervalMin + ' 分钟可展示 1 次';
                s.cap = '单场次最多 ' + rules.maxPerSession + ' 次 · 每日最多 ' + rules.dailyCap + ' 次';
            }
            s.fallback = fallbackLabel(rules.fallbackMode);
        });
        FLAdStore.save(data);
        applySlotRulesRuntime(code, rules);
        FLAdStore.pushOpLog({ action: '更新广告位展示规则', target: code });
    }

    function slotPreviewMock(code) {
        var ux = slotUx(code);
        var h5Inner = '';
        var webInner = '';
        if (code === 'home_banner') {
            h5Inner =
                '<div class="ad-slot-mock-phone-bar"></div>' +
                '<div class="ad-slot-mock-ad ad-slot-mock-ad--banner">广告 · Banner</div>' +
                '<div class="ad-slot-mock-block"></div><div class="ad-slot-mock-block short"></div>';
            webInner =
                '<div class="ad-slot-mock-web-side"></div>' +
                '<div class="ad-slot-mock-web-main">' +
                '<div class="ad-slot-mock-ad ad-slot-mock-ad--banner">广告 · 首页 Banner</div>' +
                '<div class="ad-slot-mock-block"></div><div class="ad-slot-mock-block"></div>' +
                '</div>';
        } else if (code === 'live_room') {
            h5Inner =
                '<div class="ad-slot-mock-live">' +
                '<div class="ad-slot-mock-live-stage">直播画面</div>' +
                '<div class="ad-slot-mock-ad ad-slot-mock-ad--chip">广告小卡</div>' +
                '</div>';
            webInner =
                '<div class="ad-slot-mock-web-live">' +
                '<div class="ad-slot-mock-live-stage">直播画面</div>' +
                '<div class="ad-slot-mock-web-live-side">' +
                '<div class="ad-slot-mock-block short"></div>' +
                '<div class="ad-slot-mock-ad ad-slot-mock-ad--chip">推广小卡</div>' +
                '<div class="ad-slot-mock-ad ad-slot-mock-ad--bar">底栏推广</div>' +
                '</div></div>';
        } else {
            h5Inner =
                '<div class="ad-slot-mock-phone-bar"></div>' +
                '<div class="ad-slot-mock-block"></div>' +
                '<div class="ad-slot-mock-ad ad-slot-mock-ad--feed">广告 · 信息流</div>' +
                '<div class="ad-slot-mock-block"></div><div class="ad-slot-mock-block short"></div>';
            webInner =
                '<div class="ad-slot-mock-web-side"></div>' +
                '<div class="ad-slot-mock-web-main">' +
                '<div class="ad-slot-mock-block"></div>' +
                '<div class="ad-slot-mock-ad ad-slot-mock-ad--feed">广告 · 信息流卡片</div>' +
                '<div class="ad-slot-mock-block"></div>' +
                '</div>';
        }
        return '<div class="ad-slot-preview-modal">' +
            '<p class="ad-slot-preview-lead">' + esc(ux.placeHint) + '</p>' +
            '<div class="ad-slot-preview-grid">' +
            '<div class="ad-slot-preview-pane">' +
            '<div class="ad-slot-preview-pane-title"><i class="fa-solid fa-mobile-screen"></i> ' + esc(ux.h5Title) + '</div>' +
            '<div class="ad-slot-mock ad-slot-mock--h5">' + h5Inner + '</div></div>' +
            '<div class="ad-slot-preview-pane">' +
            '<div class="ad-slot-preview-pane-title"><i class="fa-solid fa-display"></i> ' + esc(ux.webTitle) + '</div>' +
            '<div class="ad-slot-mock ad-slot-mock--web">' + webInner + '</div></div>' +
            '</div></div>';
    }

    function openSlotPreview(code) {
        var slot = FLAdStore.getSlots().filter(function (x) { return x.code === code; })[0];
        if (!slot || !window.AdminModal) return;
        AdminModal.open({
            title: '效果预览 · ' + slot.name,
            body: slotPreviewMock(code),
            width: 860,
            footer: '<button type="button" class="ant-btn ant-btn-primary" data-modal-close>关闭</button>'
        });
    }

    function renderSlots() {
        var tbody = document.getElementById('adSlotsBody');
        if (!tbody) return;
        var list = FLAdStore.getSlots();
        var pager = getPager('adSlotsBody', renderSlots);
        if (pager) pager.setTotal(list.length);
        var pageList = pager ? pager.getSlice(list) : list;
        var start = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
        tbody.innerHTML = pageList.map(function (s, i) {
            var ux = slotUx(s.code);
            var rules = esc(formatSlotRulesSummary(s));
            var placeCell =
                '<div class="ad-slot-place">' +
                '<div class="ad-slot-place-title">' + esc(ux.place) + '</div>' +
                '<button type="button" class="ant-btn ant-btn-link ant-btn-sm ad-slot-preview-btn" data-slot-preview="' + esc(s.code) + '"><i class="fa-regular fa-eye"></i> 效果预览</button>' +
                '</div>';
            return '<tr>' +
                '<td>' + (start + i + 1) + '</td>' +
                '<td><span class="ad-slot-name">' + esc(s.name) + '</span></td>' +
                '<td><code>' + esc(s.code) + '</code></td>' +
                '<td>' + placeCell + '</td>' +
                '<td>' + esc(s.types.join('、')) + '</td>' +
                '<td>' + esc(s.spec) + '</td>' +
                '<td>' + rules + '</td>' +
                '<td>' + (s.enabled ? '<span class="ant-tag ant-tag-green">启用</span>' : '<span class="ant-tag">停用</span>') + '</td>' +
                '<td class="ad-cell-ops">' +
                '<button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-slot-rules="' + esc(s.code) + '">展示规则</button> ' +
                '<button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-slot-toggle="' + esc(s.code) + '">' + (s.enabled ? '停用' : '启用') + '</button>' +
                '</td></tr>';
        }).join('');
        var table = tbody.closest('table');
        if (table && !table.dataset.slotBound) {
            table.dataset.slotBound = '1';
            table.addEventListener('click', function (e) {
                var previewBtn = e.target.closest('[data-slot-preview]');
                if (previewBtn) {
                    openSlotPreview(previewBtn.getAttribute('data-slot-preview'));
                    return;
                }
                var rulesBtn = e.target.closest('[data-slot-rules]');
                if (rulesBtn) {
                    var codeR = rulesBtn.getAttribute('data-slot-rules');
                    var slot = FLAdStore.getSlots().filter(function (x) { return x.code === codeR; })[0];
                    if (!slot || !window.AdminModal) return;
                    AdminModal.open({
                        title: '展示规则 · ' + slot.name,
                        body: slotRulesFormHtml(slot),
                        width: 520,
                        footer: '<button type="button" class="ant-btn" data-modal-close>取消</button>' +
                            '<button type="button" class="ant-btn ant-btn-primary" id="slotRulesSave">保存</button>',
                        onMount: function () {
                            document.getElementById('slotRulesSave').onclick = function () {
                                var rules = readSlotRulesForm(codeR);
                                if (rules.insertEvery < 1 || rules.maxPerSession < 1 || rules.dailyCap < 1) {
                                    toast('请填写有效的正整数参数');
                                    return;
                                }
                                persistSlotRules(codeR, rules);
                                AdminModal.close();
                                renderSlots();
                                toast('展示规则已保存');
                            };
                        }
                    });
                    return;
                }
                var btn = e.target.closest('[data-slot-toggle]');
                if (!btn) return;
                var code = btn.getAttribute('data-slot-toggle');
                var data = FLAdStore.load();
                data.slots.forEach(function (s) { if (s.code === code) s.enabled = !s.enabled; });
                FLAdStore.save(data);
                renderSlots();
                toast('广告位状态已更新（原型）');
            });
        }
    }

    function advStatusTag(st) {
        var map = { approved: 'green', pending: 'orange', rejected: 'red', restricted: 'gold', disabled: 'default' };
        var tag = map[st] || 'default';
        return '<span class="ant-tag ant-tag-' + tag + '">' + esc(FLAdStore.ADVERTISER_STATUS[st] || st) + '</span>';
    }

    function renderAdvertisers() {
        var tbody = document.getElementById('adAdvBody');
        if (!tbody) return;
        var list = FLAdStore.getAdvertisers();
        var qEl = document.getElementById('advFilterQ');
        var stEl = document.getElementById('advFilterStatus');
        var q = qEl && qEl.value ? qEl.value.trim().toLowerCase() : '';
        var st = stEl && stEl.value ? stEl.value : '';
        if (q) {
            list = list.filter(function (a) {
                return (a.uid && a.uid.toLowerCase().indexOf(q) >= 0) ||
                    (a.companyName && a.companyName.toLowerCase().indexOf(q) >= 0);
            });
        }
        if (st) list = list.filter(function (a) { return a.accountStatus === st; });
        if (!list.length) list = [{ uid: FLAdStore.DEMO_UID, accountStatus: 'approved', companyName: '演示主体', totalRecharge: 5000, totalSpend: 3399.5, violations: 0 }];
        var pager = getPager('adAdvBody', renderAdvertisers);
        if (pager) pager.setTotal(list.length);
        var pageList = pager ? pager.getSlice(list) : list;
        var start = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
        tbody.innerHTML = pageList.map(function (a, i) {
            var ads = FLAdStore.getAds({ uid: a.uid });
            var st = a.accountStatus || '';
            var ops = '<button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-adv-detail="' + esc(a.uid) + '">详情</button>';
            /* 待审在本页直接通过/驳回；限制发布仅对已通过；已限制可解除 */
            if (st === 'approved') {
                ops += ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-adv-restrict="' + esc(a.uid) + '">限制发布</button>';
            } else if (st === 'restricted') {
                ops += ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-adv-unrestrict="' + esc(a.uid) + '">解除限制</button>';
            } else if (st === 'pending') {
                ops += ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-adv-qual-ok="' + esc(a.uid) + '">通过</button>' +
                    ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm" style="color:#cf1322" data-adv-qual-no="' + esc(a.uid) + '">驳回</button>';
            } else if (st === 'rejected') {
                ops += ' <span style="color:rgba(0,0,0,.35);font-size:12px">已驳回</span>';
            } else if (st === 'disabled') {
                ops += ' <span style="color:rgba(0,0,0,.35);font-size:12px">已禁用</span>';
            }
            return '<tr><td>' + (start + i + 1) + '</td><td><code>' + esc(a.uid) + '</code></td><td>' + esc(a.companyName || '—') + '</td><td>' + advStatusTag(a.accountStatus) + '</td><td>' + ads.length + '</td><td>' + (a.totalRecharge != null ? a.totalRecharge : '5,000') + ' USDT</td><td>' + (a.totalSpend != null ? a.totalSpend : '—') + ' USDT</td><td>' + (a.violationCount || a.violations || 0) + '</td><td class="ad-cell-ops">' + ops + '</td></tr>';
        }).join('');
        if (tbody && !tbody.dataset.advBound) {
            tbody.dataset.advBound = '1';
            tbody.addEventListener('click', function (e) {
                var det = e.target.closest('[data-adv-detail]');
                var rst = e.target.closest('[data-adv-restrict]');
                var unrst = e.target.closest('[data-adv-unrestrict]');
                var qualOk = e.target.closest('[data-adv-qual-ok]');
                var qualNo = e.target.closest('[data-adv-qual-no]');
                if (qualOk) {
                    var okUid = qualOk.getAttribute('data-adv-qual-ok');
                    if (!window.FLAdService) return;
                    var okRes = FLAdService.adminReviewAdvertiser(okUid, true);
                    if (!okRes || !okRes.ok) {
                        toast((okRes && okRes.message) || '操作失败');
                        return;
                    }
                    toast('资质已通过');
                    renderAdvertisers();
                    return;
                }
                if (qualNo) {
                    var rejectUid = qualNo.getAttribute('data-adv-qual-no');
                    if (!window.FLAdService || !window.AdminModal) return;
                    AdminModal.open({
                        title: '驳回资质申请',
                        body: '<textarea id="qualRejectReason" class="ant-input" rows="3" placeholder="驳回原因（必填）" style="width:100%"></textarea>',
                        footer: '<button type="button" class="ant-btn" data-modal-close>取消</button><button type="button" class="ant-btn ant-btn-danger" id="qualRejectBtn">确认驳回</button>',
                        width: 440
                    });
                    setTimeout(function () {
                        var btn = document.getElementById('qualRejectBtn');
                        if (btn) btn.onclick = function () {
                            var r = (document.getElementById('qualRejectReason') || {}).value || '';
                            if (!r.trim()) { toast('请填写驳回原因'); return; }
                            var noRes = FLAdService.adminReviewAdvertiser(rejectUid, false, r.trim());
                            if (!noRes || !noRes.ok) {
                                toast((noRes && noRes.message) || '操作失败');
                                return;
                            }
                            AdminModal.close();
                            toast('已驳回');
                            renderAdvertisers();
                        };
                    }, 0);
                    return;
                }
                if (det) {
                    var uid = det.getAttribute('data-adv-detail');
                    var a = FLAdStore.getAdvertisers().filter(function (x) { return x.uid === uid; })[0];
                    if (!a || !window.AdminModal) return;
                    var extra = '';
                    if (a.accountStatus === 'rejected' && a.rejectReason) {
                        extra = '<br>驳回原因：' + esc(a.rejectReason);
                    }
                    if (a.accountStatus === 'restricted' && a.restrictReason) {
                        extra = '<br>限制原因：' + esc(a.restrictReason);
                    }
                    AdminModal.open({
                        title: '广告主 · ' + uid,
                        body: '<p style="font-size:13px;line-height:1.7">主体：<b>' + esc(a.companyName || '—') + '</b><br>联系：' + esc(a.contact || '—') +
                            '<br>状态：' + advStatusTag(a.accountStatus) + '<br>申请时间：' + esc((a.applyAt || '').slice(0, 19).replace('T', ' ')) + extra + '</p>'
                    });
                }
                if (rst) {
                    var uid2 = rst.getAttribute('data-adv-restrict');
                    confirmDanger('限制该 UID 发布广告？用户将无法创建付费广告。', function () {
                        if (window.FLAdService) FLAdService.adminSetAdvertiserStatus(uid2, 'restricted', '运营限制发布');
                        else {
                            var data = FLAdStore.load();
                            data.advertisers.forEach(function (x) { if (x.uid === uid2) x.accountStatus = 'restricted'; });
                            FLAdStore.save(data);
                        }
                        toast('已限制发布');
                        renderAdvertisers();
                    });
                }
                if (unrst) {
                    var uid3 = unrst.getAttribute('data-adv-unrestrict');
                    confirmDanger('解除限制并恢复为「已通过」？', function () {
                        if (window.FLAdService) FLAdService.adminSetAdvertiserStatus(uid3, 'approved', '运营解除限制');
                        else {
                            var data2 = FLAdStore.load();
                            data2.advertisers.forEach(function (x) {
                                if (x.uid === uid3) {
                                    x.accountStatus = 'approved';
                                    x.restrictReason = '';
                                }
                            });
                            FLAdStore.save(data2);
                        }
                        toast('已解除限制');
                        renderAdvertisers();
                    });
                }
            });
        }
    }

    function renderPackages() {
        var tbody = document.getElementById('adPkgBody');
        if (!tbody) return;
        var list = FLAdStore.getPackages();
        var pager = getPager('adPkgBody', renderPackages);
        if (pager) pager.setTotal(list.length);
        var pageList = pager ? pager.getSlice(list) : list;
        tbody.innerHTML = pageList.map(function (p) {
            var slot = slotName(p.slotCode);
            return '<tr><td><code>' + esc(p.id) + '</code></td><td>' + esc(slot) + '</td><td><input class="ant-input" style="min-width:120px" data-pkg-name="' + esc(p.id) + '" value="' + esc(p.name) + '"></td><td><input class="ant-input" style="width:72px" data-pkg-days="' + esc(p.id) + '" value="' + p.durationDays + '"> 天</td><td><input class="ant-input" style="width:96px" data-price="' + esc(p.id) + '" value="' + p.priceUsdt + '"></td><td><span class="ad-switch ' + (p.enabled ? 'on' : '') + '" data-switch data-pkg="' + esc(p.id) + '" aria-checked="' + (p.enabled ? 'true' : 'false') + '" role="switch"></span></td><td class="ad-cell-ops"><button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-save="' + esc(p.id) + '">保存</button></td></tr>';
        }).join('');
        if (window.AdAdminLayout) AdAdminLayout.bindSwitch(tbody.closest('.ant-card') || document);
        tbody.onclick = function (e) {
            var sw = e.target.closest('[data-switch][data-pkg]');
            if (sw) {
                var id = sw.getAttribute('data-pkg');
                var data = FLAdStore.load();
                data.packages.forEach(function (p) { if (p.id === id) p.enabled = sw.classList.contains('on'); });
                FLAdStore.save(data);
                toast('套餐可售状态已更新（原型）');
                return;
            }
            var b = e.target.closest('[data-save]');
            if (!b) return;
            if (window.FLAdService) {
                var perm = FLAdService.requireAdminPerm('package');
                if (!perm.ok) { toast(perm.message); return; }
            }
            confirmDanger('确认保存套餐名称、周期与价格？已购订单保留 priceSnapshot 不受影响。', function () {
                var id = b.getAttribute('data-save');
                var inp = document.querySelector('[data-price="' + id + '"]');
                var nameInp = document.querySelector('[data-pkg-name="' + id + '"]');
                var daysInp = document.querySelector('[data-pkg-days="' + id + '"]');
                var data = FLAdStore.load();
                data.packages.forEach(function (p) {
                    if (p.id === id) {
                        p.priceUsdt = Number(inp.value);
                        if (nameInp) p.name = nameInp.value.trim() || p.name;
                        if (daysInp) p.durationDays = Math.max(1, Number(daysInp.value) || p.durationDays);
                        p.version = (p.version || 1) + 1;
                    }
                });
                FLAdStore.save(data);
                FLAdStore.pushOpLog({ action: '修改套餐', target: id });
                toast('已保存（原型）');
            });
        };
    }

    function bindPackageAdd() {
        var btn = document.getElementById('adPkgAddBtn');
        if (!btn || btn.dataset.bound) return;
        btn.dataset.bound = '1';
        btn.onclick = function () {
            if (!window.AdminModal) return;
            var slots = FLAdStore.getSlots();
            var opts = slots.map(function (s) {
                return '<option value="' + esc(s.code) + '">' + esc(s.name) + '</option>';
            }).join('');
            AdminModal.open({
                title: '新增套餐',
                body: '<div style="font-size:13px">' +
                    '<p><label>名称</label><input class="ant-input" id="pkgNewName" style="width:100%" placeholder="如 信息流 7 天"></p>' +
                    '<p><label>广告位</label><select class="ant-input" id="pkgNewSlot" style="width:100%">' + opts + '</select></p>' +
                    '<p><label>投放天数</label><input class="ant-input" id="pkgNewDays" type="number" min="1" value="7" style="width:100%"></p>' +
                    '<p><label>价格 USDT</label><input class="ant-input" id="pkgNewPrice" type="number" min="1" value="99" style="width:100%"></p>' +
                    '</div>',
                footer: '<button type="button" class="ant-btn ant-btn-primary" id="pkgNewSave">上架</button>',
                onMount: function () {
                    document.getElementById('pkgNewSave').onclick = function () {
                        var data = FLAdStore.load();
                        data.packages = data.packages || [];
                        var id = 'PKG-' + Date.now();
                        data.packages.push({
                            id: id,
                            slotCode: document.getElementById('pkgNewSlot').value,
                            name: document.getElementById('pkgNewName').value.trim() || '新套餐',
                            durationDays: Number(document.getElementById('pkgNewDays').value) || 7,
                            priceUsdt: Number(document.getElementById('pkgNewPrice').value) || 99,
                            enabled: true,
                            version: 1
                        });
                        FLAdStore.save(data);
                        FLAdStore.pushOpLog({ action: '新增套餐', target: id });
                        AdminModal.close();
                        renderPackages();
                        toast('套餐已新增（默认可售）');
                    };
                }
            });
        };
    }

    function renderFinance() {
        var tbody = document.getElementById('adFinBody');
        if (!tbody) return;
        var acc = FLAdStore.load().account;
        var frozen = acc.frozen || 0;
        var avail = acc.balance || 0;
        var bal = document.getElementById('adFinBalance');
        if (bal) bal.textContent = (avail + frozen) + ' USDT';
        var fr = document.getElementById('adFinFrozen');
        if (fr) fr.textContent = frozen + ' USDT';
        var av = document.getElementById('adFinAvail');
        if (av) av.textContent = avail + ' USDT';
        var fin = FLAdStore.load().finance || [];
        var pager = getPager('adFinBody', renderFinance);
        if (pager) pager.setTotal(fin.length);
        if (!fin.length) {
            tbody.innerHTML = emptyRow(7, '暂无流水');
            return;
        }
        var pageList = pager ? pager.getSlice(fin) : fin;
        var start = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
        tbody.innerHTML = pageList.map(function (f, i) {
            return '<tr><td>' + (start + i + 1) + '</td><td><code>' + esc(f.orderNo || f.id) + '</code></td><td>' + esc(f.uid) + '</td><td>' + esc(financeTypeLabel(f.type)) + '</td><td><b>' + f.amount + '</b> USDT</td><td>' + financeStatusTag(f.status) + '</td><td>' + esc(f.at.slice(0, 16).replace('T', ' ')) + '</td></tr>';
        }).join('');
    }

    function renderStats() {
        var ads = FLAdStore.getAds();
        var imp = 0; var clk = 0; var spend = 0; var conv = 0;
        ads.forEach(function (a) {
            var st = a.stats || {};
            imp += Number(st.impressions) || 0;
            clk += Number(st.clicks) || 0;
            spend += Number(st.spend) || 0;
            conv += Number(st.conversions) || 0;
        });
        ['stImp', 'stClk', 'stCtr', 'stSpend', 'stConv'].forEach(function (id, i) {
            var el = document.getElementById(id);
            if (!el) return;
            var vals = [
                imp.toLocaleString(),
                clk.toLocaleString(),
                (imp ? (clk / imp * 100).toFixed(2) + '%' : '0%'),
                Number(spend).toLocaleString(undefined, { maximumFractionDigits: 2 }),
                conv.toLocaleString()
            ];
            el.textContent = vals[i];
        });
        var tbody = document.getElementById('adStatsBody');
        if (tbody) {
            var pager = getPager('adStatsBody', renderStats);
            if (pager) pager.setTotal(ads.length);
            if (!ads.length) {
                tbody.innerHTML = emptyRow(10, '暂无统计数据');
            } else {
                var pageList = pager ? pager.getSlice(ads) : ads;
                var start = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
                tbody.innerHTML = pageList.map(function (a, i) {
                    var st = a.stats || {};
                    var aImp = Number(st.impressions) || 0;
                    var aClk = Number(st.clicks) || 0;
                    var ctr = aImp ? (aClk / aImp * 100).toFixed(2) + '%' : '—';
                    return '<tr>' +
                        '<td>' + (start + i + 1) + '</td>' +
                        '<td><code>' + esc(a.id) + '</code></td>' +
                        '<td>' + esc(a.name) + '</td>' +
                        '<td>' + esc(FLAdStore.SOURCE[a.source] || a.source) + '</td>' +
                        '<td>' + aImp.toLocaleString() + '</td>' +
                        '<td>' + aClk.toLocaleString() + '</td>' +
                        '<td>' + ctr + '</td>' +
                        '<td>' + (Number(st.spend) || 0) + '</td>' +
                        '<td>' + (Number(st.conversions) || 0) + '</td>' +
                        '<td class="ad-cell-ops"><button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-ad-detail="' + esc(a.id) + '">详情</button></td>' +
                        '</tr>';
                }).join('');
            }
            if (!tbody.dataset.statsBound) {
                tbody.dataset.statsBound = '1';
                tbody.addEventListener('click', function (e) {
                    var btn = e.target.closest('[data-ad-detail]');
                    if (!btn) return;
                    showAdDetailModal(btn.getAttribute('data-ad-detail'));
                });
            }
        }
        var exp = document.getElementById('adStatsExport');
        if (exp) exp.onclick = function () { toast('已生成导出任务 AD-EXPORT-DEMO（原型）'); };
    }

    var RISK_TYPE_LABEL = {
        report: '用户举报',
        abnormal_click: '异常点击',
        abnormal_traffic: '异常流量',
        domain_block: '域名拦截',
        freq_cap: '频次超限',
        material: '素材风险',
        manual: '人工标记'
    };
    var RISK_STATUS_LABEL = {
        open: '待处理',
        reviewed: '已处理',
        closed: '已关闭',
        ignored: '已忽略'
    };

    function riskTypeLabel(t) { return RISK_TYPE_LABEL[t] || t || '—'; }
    function riskStatusLabel(s) { return RISK_STATUS_LABEL[s] || s || '—'; }

    function splitRiskReason(r) {
        var full = String(r.reason || '').trim();
        var detail = String(r.detail || '').trim();
        var label = String(r.reasonLabel || '').trim();
        if (r.type === 'report') {
            if (!label) {
                if (detail && full.indexOf('；' + detail) >= 0) {
                    label = full.replace('；' + detail, '').trim();
                } else if (detail && full.indexOf(';' + detail) >= 0) {
                    label = full.replace(';' + detail, '').trim();
                } else if (detail && full === detail) {
                    label = '';
                } else {
                    label = full;
                }
            }
            if (!label && full && !detail) label = full;
            return { label: label || '—', detail: detail || '—' };
        }
        return { label: full || detail || '—', detail: '—' };
    }

    function riskAdCell(r) {
        var id = r.adId || '—';
        var name = r.adName ? ('<div style="font-size:12px;color:rgba(0,0,0,.45);margin-top:2px">' + esc(r.adName) + '</div>') : '';
        return '<code>' + esc(id) + '</code>' + name;
    }

    function renderRisk() {
        var tbody = document.getElementById('adRiskBody');
        if (!tbody) return;
        var risks = FLAdStore.load().risk || [];
        var pager = getPager('adRiskBody', renderRisk);
        if (pager) pager.setTotal(risks.length);
        if (!risks.length) {
            tbody.innerHTML = emptyRow(9, '暂无风控事件');
        } else {
            var pageList = pager ? pager.getSlice(risks) : risks;
            var start = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
            tbody.innerHTML = pageList.map(function (r, i) {
                var parts = splitRiskReason(r);
                var reporter = r.type === 'report' ? (r.uid || '—') : '—';
                return '<tr>' +
                    '<td>' + (start + i + 1) + '</td>' +
                    '<td><span class="ant-tag ant-tag-red">' + esc(riskTypeLabel(r.type)) + '</span></td>' +
                    '<td>' + riskAdCell(r) + '</td>' +
                    '<td>' + esc(parts.label) + '</td>' +
                    '<td style="max-width:240px;white-space:normal;word-break:break-word">' + esc(parts.detail) + '</td>' +
                    '<td>' + esc(reporter) + '</td>' +
                    '<td>' + esc(riskStatusLabel(r.status)) + '</td>' +
                    '<td>' + esc(String(r.at || '').slice(0, 16).replace('T', ' ')) + '</td>' +
                    '<td class="ad-cell-ops"><button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-risk-pause="' + esc(r.adId) + '">暂停广告</button></td>' +
                    '</tr>';
            }).join('');
        }
        var table = tbody.closest('table');
        if (table && !table.dataset.riskBound) {
            table.dataset.riskBound = '1';
            table.addEventListener('click', function (e) {
                var b = e.target.closest('[data-risk-pause]');
                if (!b) return;
                var id = b.getAttribute('data-risk-pause');
                if (id) {
                    var r = window.FLAdService && FLAdService.adminPauseAd ? FLAdService.adminPauseAd(id, '风控') : { ok: !!FLAdAdmin.pause(id, '风控') };
                    toast(r.ok ? '已暂停' : r.message);
                    renderRisk();
                }
            });
        }
    }

    /** 订单列表：支付结果文案（不含投放） */
    function orderPayLabel(o) {
        var s = o && o.payStatus;
        if (s === 'paid' || s === 'partial_refunded' || s === 'refunded' || s === 'refund_processing') {
            return { text: '支付成功', cls: 'ok' };
        }
        if (s === 'unpaid') return { text: '待支付', cls: 'warn' };
        if (s === 'processing') return { text: '支付处理中', cls: 'warn' };
        if (s === 'failed') return { text: '支付失败', cls: 'bad' };
        if (s === 'none') return { text: '无需支付', cls: 'mute' };
        return { text: FLAdStore.PAY_STATUS[s] || s || '—', cls: 'mute' };
    }

    /** 订单列表：退款结果文案 */
    function orderRefundLabel(o) {
        var s = o && o.payStatus;
        var amt = Number(o && o.refundedAmount) || 0;
        if (s === 'refunded' || (s === 'partial_refunded' && amt > 0)) {
            return { text: s === 'partial_refunded' ? ('退款成功 · ' + amt) : '退款成功', cls: 'ok' };
        }
        if (s === 'refund_processing') return { text: '退款处理中', cls: 'warn' };
        if (s === 'refund_failed') return { text: '退款失败', cls: 'bad' };
        if (amt > 0) return { text: '已退 ' + amt, cls: 'ok' };
        return { text: '—', cls: 'mute' };
    }

    function orderStatusTag(info) {
        return '<span class="ad-tag-audit ' + (info.cls || 'mute') + '">' + esc(info.text) + '</span>';
    }

    function renderOrders() {
        var tbody = document.getElementById('adOrdBody');
        if (!tbody) return;
        var q = ((document.getElementById('ordFilterQ') || {}).value || '').toLowerCase();
        var pay = (document.getElementById('ordFilterPay') || {}).value || '';
        var list = FLAdStore.getOrders();
        if (q) list = list.filter(function (o) {
            return (o.id + o.adId + (o.uid || '')).toLowerCase().indexOf(q) >= 0;
        });
        if (pay === 'paid') {
            list = list.filter(function (o) {
                return o.payStatus === 'paid' || o.payStatus === 'partial_refunded' ||
                    o.payStatus === 'refunded' || o.payStatus === 'refund_processing';
            });
        } else if (pay === 'refunded') {
            list = list.filter(function (o) {
                return o.payStatus === 'refunded' || o.payStatus === 'partial_refunded' ||
                    (Number(o.refundedAmount) || 0) > 0;
            });
        } else if (pay) {
            list = list.filter(function (o) { return o.payStatus === pay; });
        }
        var pager = getPager('adOrdBody', renderOrders);
        if (pager) pager.setTotal(list.length);
        if (!list.length) { tbody.innerHTML = emptyRow(8, '暂无订单'); return; }
        var pageList = pager ? pager.getSlice(list) : list;
        tbody.innerHTML = pageList.map(function (o) {
            return '<tr><td><code>' + esc(o.id) + '</code></td><td><code>' + esc(o.adId) + '</code></td><td>' + esc(o.uid) + '</td><td>' + esc(o.packageName || '') + '</td><td>' + (o.priceSnapshot != null ? o.priceSnapshot : '—') + '</td><td>' + orderStatusTag(orderPayLabel(o)) + '</td><td>' + orderStatusTag(orderRefundLabel(o)) + '</td><td class="ad-cell-ops"><button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-ord-detail="' + esc(o.id) + '">详情</button></td></tr>';
        }).join('');
        if (!tbody.dataset.bound) {
            tbody.dataset.bound = '1';
            tbody.addEventListener('click', function (e) {
                var b = e.target.closest('[data-ord-detail]');
                if (!b) return;
                var o = FLAdStore.getOrders().filter(function (x) { return x.id === b.getAttribute('data-ord-detail'); })[0];
                if (!o || !AdminModal) return;
                var payInfo = orderPayLabel(o);
                var rfInfo = orderRefundLabel(o);
                AdminModal.open({
                    title: '订单 ' + o.id,
                    body: '<p style="font-size:13px;line-height:1.7">广告：' + esc(o.adId) + '<br>UID：' + esc(o.uid) +
                        '<br>套餐：' + esc(o.packageName) + ' · ' + o.priceSnapshot + ' USDT' +
                        '<br>支付：' + esc(payInfo.text) +
                        '<br>退款：' + esc(rfInfo.text) +
                        '<br>实付 / 已退：' + (o.paidAmount || 0) + ' / ' + (o.refundedAmount || 0) +
                        '<br>支付时间：' + esc((o.paidAt || '—').slice(0, 19).replace('T', ' ')) + '</p>'
                });
            });
        }
    }

    function renderRefunds() {
        var tbody = document.getElementById('adRfBody');
        if (!tbody) return;
        var list = FLAdStore.getRefunds();
        var pager = getPager('adRfBody', renderRefunds);
        if (pager) pager.setTotal(list.length);
        if (!list.length) { tbody.innerHTML = emptyRow(8, '暂无退款申请'); return; }
        var pageList = pager ? pager.getSlice(list) : list;
        tbody.innerHTML = pageList.map(function (t) {
            var ops = t.status === 'pending'
                ? '<button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-rf-ok="' + esc(t.id) + '">通过</button> <button type="button" class="ant-btn ant-btn-link ant-btn-sm" style="color:#cf1322" data-rf-no="' + esc(t.id) + '">驳回</button>'
                : '<span style="color:rgba(0,0,0,.25)">—</span>';
            var reasonCell = '<div style="max-width:220px;white-space:normal;line-height:1.4" title="' + esc(t.reason || '') + '">' +
                esc(t.reason || '—') +
                (t.formulaText ? '<div style="margin-top:4px;font-size:12px;color:rgba(0,0,0,.45)">' + esc(t.formulaText) + '</div>' : '') +
                '</div>';
            return '<tr>' +
                '<td><code>' + esc(t.id) + '</code><div><button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-rf-detail="' + esc(t.id) + '">详情</button></div></td>' +
                '<td>' + esc(t.orderId) + '</td><td>' + esc(t.uid) + '</td><td>' + t.amount + '</td><td>' + refundTag(t.status) + '</td>' +
                '<td>' + reasonCell + '</td>' +
                '<td>' + esc((t.createdAt || '').slice(0, 16).replace('T', ' ')) + '</td>' +
                '<td class="ad-cell-ops">' + ops + '</td></tr>';
        }).join('');
        if (!tbody.dataset.bound) {
            tbody.dataset.bound = '1';
            tbody.addEventListener('click', function (e) {
                var detail = e.target.closest('[data-rf-detail]');
                var okb = e.target.closest('[data-rf-ok]');
                var nob = e.target.closest('[data-rf-no]');
                if (detail && window.AdminModal) {
                    var tid = detail.getAttribute('data-rf-detail');
                    var row = (FLAdStore.getRefunds() || []).filter(function (x) { return x.id === tid; })[0];
                    if (!row) return;
                    var stMap = { pending: '待审核', approved: '已通过', rejected: '已驳回', processing: '退款处理中', done: '已退款' };
                    AdminModal.open({
                        title: '退款申请详情',
                        width: 560,
                        body: '<dl class="ad-detail-grid">' +
                            '<div><dt>退款单</dt><dd>' + esc(row.id) + '</dd></div>' +
                            '<div><dt>订单</dt><dd>' + esc(row.orderId) + '</dd></div>' +
                            '<div><dt>UID</dt><dd>' + esc(row.uid) + '</dd></div>' +
                            '<div><dt>金额</dt><dd>' + row.amount + ' USDT</dd></div>' +
                            '<div><dt>状态</dt><dd>' + esc(stMap[row.status] || row.status) + '</dd></div>' +
                            '<div style="grid-column:1/-1"><dt>申请理由</dt><dd style="white-space:pre-wrap">' + esc(row.reason || '—') + '</dd></div>' +
                            '<div style="grid-column:1/-1"><dt>退款公式</dt><dd>' + esc(row.formulaText || '—') + '</dd></div>' +
                            (row.reviewNote ? '<div style="grid-column:1/-1"><dt>财务意见</dt><dd>' + esc(row.reviewNote) + '</dd></div>' : '') +
                            '<div><dt>申请时间</dt><dd>' + esc((row.createdAt || '').slice(0, 19).replace('T', ' ')) + '</dd></div>' +
                            '</dl>'
                    });
                    return;
                }
                if (okb) {
                    var r = FLAdService.adminDecideRefund(okb.getAttribute('data-rf-ok'), true, '');
                    toast(r.ok ? '已通过，退款处理中' : r.message);
                    setTimeout(renderRefunds, 800);
                }
                if (nob) {
                    var reason = window.prompt('驳回原因', '不符合退款规则') || '';
                    if (!String(reason).trim()) { toast('请填写驳回原因'); return; }
                    var r2 = FLAdService.adminDecideRefund(nob.getAttribute('data-rf-no'), false, reason);
                    toast(r2.ok ? '已驳回' : r2.message);
                    renderRefunds();
                }
            });
        }
    }

    function renderRbac() {
        var box = document.getElementById('adRbacBody');
        if (!box) return;
        var rbac = FLAdStore.getRbac();
        var roles = Object.keys(rbac);
        box.innerHTML = roles.map(function (role) {
            var row = rbac[role];
            var menus = row.menus === '*' ? '*' : (row.menus || []).join(',');
            var ops = (row.ops || []).join(',');
            return '<tr><td><code>' + esc(role) + '</code></td><td><input class="ant-input" data-rbac-menus="' + esc(role) + '" value="' + esc(menus) + '"></td><td><input class="ant-input" data-rbac-ops="' + esc(role) + '" value="' + esc(ops) + '"></td></tr>';
        }).join('');
        var save = document.getElementById('rbacSave');
        if (save && !save.dataset.bound) {
            save.dataset.bound = '1';
            save.onclick = function () {
                var next = JSON.parse(JSON.stringify(FLAdStore.getRbac()));
                Object.keys(next).forEach(function (role) {
                    var m = document.querySelector('[data-rbac-menus="' + role + '"]');
                    var o = document.querySelector('[data-rbac-ops="' + role + '"]');
                    if (m) next[role].menus = m.value.trim() === '*' ? '*' : m.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                    if (o) next[role].ops = o.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                });
                var r = FLAdService.saveRbac(next);
                toast(r.ok ? '权限已保存，刷新后菜单生效' : r.message);
            };
        }
    }

    function bindRiskFreq() {
        var caps = FLAdStore.getFreqCaps();
        var live = document.getElementById('riskLiveCap');
        var feed = document.getElementById('riskFeedCap');
        var banner = document.getElementById('riskBannerCap');
        if (live) live.value = caps.live_room || 4;
        if (feed) feed.value = caps.feed_video || 3;
        if (banner) banner.value = caps.home_banner || 8;
        var save = document.getElementById('riskFreqSave');
        if (save && !save.dataset.bound) {
            save.dataset.bound = '1';
            save.onclick = function () {
                FLAdService.saveFreqCaps({
                    feed_video: Number(feed && feed.value) || 3,
                    home_banner: Number(banner && banner.value) || 8,
                    live_room: Number(live && live.value) || 4
                });
                toast('频次策略已保存');
            };
        }
    }

    function bindOpsCreate() {
        var form = document.getElementById('adOpsForm');
        if (!form) return;

        var roleSel = document.getElementById('adAdminRole');
        if (roleSel) {
            roleSel.value = localStorage.getItem('fl_ad_admin_role') || 'operator';
            roleSel.onchange = function () {
                localStorage.setItem('fl_ad_admin_role', roleSel.value);
            };
        }

        var materials = [];
        var slotEl = document.getElementById('opsSlot');
        var copyField = document.getElementById('opsCopyField');
        var landingTypeEl = document.getElementById('opsLandingType');
        var creatorField = document.getElementById('opsLandingCreatorField');
        var urlField = document.getElementById('opsLandingUrlField');
        var pkgEl = document.getElementById('opsPackage');
        var startEl = document.getElementById('opsStart');
        var endEl = document.getElementById('opsEnd');
        var pkgMeta = document.getElementById('opsPackageMeta');
        var logoUrlEl = document.getElementById('opsBrandLogoUrl');
        var logoPreview = document.getElementById('opsLogoPreview');
        var logoClear = document.getElementById('opsLogoClear');
        var matPreview = document.getElementById('opsMaterialPreview');
        var matPlaceholder = document.getElementById('opsMaterialPlaceholder');
        var matAdd = document.getElementById('opsMaterialAdd');
        var matInput = document.getElementById('opsMaterialInput');
        var matHelp = document.getElementById('opsMaterialHelp');
        var matFormats = document.getElementById('opsMaterialFormats');

        function materialMax() {
            var slot = (slotEl && slotEl.value) || 'home_banner';
            if (window.FLAdService && FLAdService.MATERIAL_RULES && FLAdService.MATERIAL_RULES[slot]) {
                return FLAdService.MATERIAL_RULES[slot].maxImages || (slot === 'home_banner' ? 5 : 3);
            }
            return slot === 'home_banner' ? 5 : 3;
        }

        function syncSlotUi() {
            var slot = (slotEl && slotEl.value) || 'home_banner';
            if (copyField) copyField.hidden = slot !== 'feed_video';
            if (matHelp) {
                if (slot === 'home_banner') {
                    matHelp.textContent = '首页 Banner 仅图片，建议横图；可多张轮播，单张 ≤500KB。';
                } else if (slot === 'live_room') {
                    matHelp.textContent = '直播间推广素材；图片可多选，视频仅 1 个且不可与图片混用。';
                } else {
                    matHelp.textContent = '观众实际看到的画面。图片可一次选多张；视频只能上传 1 个，且不可与图片混用。';
                }
            }
            if (matFormats) {
                matFormats.textContent = slot === 'home_banner'
                    ? ('图片可多选（最多 ' + materialMax() + ' 张）· 不支持视频')
                    : ('图片可多选（最多 ' + materialMax() + ' 张）· 视频仅 1 个');
            }
            if (matInput) {
                matInput.accept = slot === 'home_banner'
                    ? 'image/jpeg,image/png,image/webp'
                    : 'image/jpeg,image/png,image/webp,video/mp4,video/webm';
            }
            populatePackages();
        }

        function syncLandingUi() {
            var t = (landingTypeEl && landingTypeEl.value) || 'creator';
            if (creatorField) creatorField.hidden = t !== 'creator';
            if (urlField) urlField.hidden = t !== 'external';
        }

        function populatePackages() {
            if (!pkgEl || !window.FLAdStore) return;
            var slot = (slotEl && slotEl.value) || '';
            var pkgs = FLAdStore.getPackages().filter(function (p) {
                return p.enabled && (!slot || p.slotCode === slot);
            });
            pkgEl.innerHTML = pkgs.map(function (p) {
                return '<option value="' + esc(p.id) + '">' + esc(p.name) + ' · ' + p.priceUsdt + ' USDT</option>';
            }).join('') || '<option value="">暂无可用套餐</option>';
            syncSchedule();
        }

        function selectedPkg() {
            if (!pkgEl || !window.FLAdStore) return null;
            var id = pkgEl.value;
            var list = FLAdStore.getPackages();
            for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
            return null;
        }

        function toLocalInput(d) {
            var pad = function (n) { return n < 10 ? '0' + n : String(n); };
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
                'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        }

        function syncSchedule() {
            var p = selectedPkg();
            if (pkgMeta) {
                pkgMeta.textContent = p
                    ? ('固定套餐 · 投放 ' + p.durationDays + ' 天 · 平台自营不扣费，仍按套餐天数控制周期')
                    : '平台自营不扣费，仍按套餐天数控制投放周期。';
            }
            if (!startEl || !endEl || !p) return;
            if (!startEl.value) {
                var now = new Date();
                now.setMinutes(now.getMinutes() - (now.getMinutes() % 5), 0, 0);
                startEl.value = toLocalInput(now);
            }
            var start = new Date(startEl.value);
            if (isNaN(start.getTime())) return;
            var end = new Date(start.getTime() + p.durationDays * 24 * 60 * 60 * 1000);
            endEl.value = toLocalInput(end);
        }

        function renderLogo() {
            var url = logoUrlEl && logoUrlEl.value;
            if (!logoPreview) return;
            if (url) {
                logoPreview.innerHTML = '<img src="' + esc(url) + '" alt="LOGO">';
                if (logoClear) logoClear.hidden = false;
            } else {
                logoPreview.innerHTML = '<i class="fa-regular fa-image"></i>';
                if (logoClear) logoClear.hidden = true;
            }
        }

        function renderMaterials() {
            if (!matPreview || !matPlaceholder) return;
            if (!materials.length) {
                matPreview.hidden = true;
                matPlaceholder.hidden = false;
                if (matAdd) matAdd.hidden = true;
                return;
            }
            matPlaceholder.hidden = true;
            matPreview.hidden = false;
            matPreview.innerHTML = materials.map(function (m, idx) {
                var media = m.kind === 'video'
                    ? '<video src="' + esc(m.url) + '" muted></video>'
                    : '<img src="' + esc(m.url) + '" alt="">';
                return '<div class="thumb" data-idx="' + idx + '">' + media +
                    '<button type="button" data-rm="' + idx + '" aria-label="移除">×</button></div>';
            }).join('');
            if (matAdd) {
                var hasVideo = materials.some(function (m) { return m.kind === 'video'; });
                matAdd.hidden = hasVideo || materials.length >= materialMax();
            }
        }

        function readFile(file) {
            return new Promise(function (resolve, reject) {
                var reader = new FileReader();
                reader.onload = function () {
                    resolve({
                        url: String(reader.result || ''),
                        kind: file.type.indexOf('video/') === 0 ? 'video' : 'image',
                        mimeType: file.type,
                        sizeBytes: file.size,
                        name: file.name
                    });
                };
                reader.onerror = function () { reject(new Error('读取失败')); };
                reader.readAsDataURL(file);
            });
        }

        var logoPick = document.getElementById('opsLogoPick');
        var logoInput = document.getElementById('opsLogoInput');
        if (logoPick && logoInput) {
            logoPick.onclick = function () { logoInput.click(); };
            logoInput.onchange = function () {
                var file = logoInput.files && logoInput.files[0];
                if (!file) return;
                readFile(file).then(function (item) {
                    if (logoUrlEl) logoUrlEl.value = item.url;
                    renderLogo();
                }).catch(function (err) { toast((err && err.message) || 'LOGO 上传失败'); });
                logoInput.value = '';
            };
        }
        if (logoClear) {
            logoClear.onclick = function () {
                if (logoUrlEl) logoUrlEl.value = '';
                renderLogo();
            };
        }

        function openMaterialPicker() {
            if (matInput) matInput.click();
        }
        var zone = document.getElementById('opsMaterialZone');
        if (zone) {
            zone.onclick = function (e) {
                if (e.target && e.target.getAttribute && e.target.getAttribute('data-rm') != null) return;
                openMaterialPicker();
            };
        }
        if (matAdd) matAdd.onclick = function (e) { e.stopPropagation(); openMaterialPicker(); };
        if (matPreview) {
            matPreview.onclick = function (e) {
                var btn = e.target.closest('[data-rm]');
                if (!btn) return;
                e.stopPropagation();
                materials.splice(Number(btn.getAttribute('data-rm')), 1);
                renderMaterials();
            };
        }
        if (matInput) {
            matInput.onchange = function () {
                var files = Array.prototype.slice.call(matInput.files || []);
                matInput.value = '';
                if (!files.length) return;
                var slot = (slotEl && slotEl.value) || 'home_banner';
                Promise.all(files.map(function (f) {
                    if (window.FLAdService && FLAdService.validateMaterial) {
                        var pre = FLAdService.validateMaterial(slot, { mimeType: f.type, sizeBytes: f.size });
                        if (pre && pre.ok === false) return Promise.reject(new Error(pre.message || '素材不符合规范'));
                    }
                    return readFile(f);
                })).then(function (items) {
                    var hasVideoNew = items.some(function (m) { return m.kind === 'video'; });
                    var hasVideoOld = materials.some(function (m) { return m.kind === 'video'; });
                    var hasImgOld = materials.some(function (m) { return m.kind === 'image'; });
                    if (hasVideoOld && !hasVideoNew) throw new Error('已有视频素材，请先移除后再添加图片');
                    if (hasImgOld && hasVideoNew) {
                        toast('已有图片素材，上传视频将替换全部图片');
                        materials = [];
                    }
                    if (hasVideoNew) {
                        materials = items.slice(0, 1);
                    } else {
                        materials = materials.concat(items).slice(0, materialMax());
                    }
                    renderMaterials();
                }).catch(function (err) {
                    toast((err && err.message) || '素材上传失败');
                });
            };
        }

        if (slotEl) slotEl.onchange = syncSlotUi;
        if (landingTypeEl) landingTypeEl.onchange = syncLandingUi;
        if (pkgEl) pkgEl.onchange = syncSchedule;
        if (startEl) startEl.onchange = syncSchedule;

        syncSlotUi();
        syncLandingUi();
        renderLogo();
        renderMaterials();

        function submitOps(mode) {
            if (mode === 'publish' && window.FLAdService) {
                var perm = FLAdService.requireAdminPerm('publish_skip_audit');
                if (!perm.ok) { toast(perm.message); return; }
            }
            var fd = new FormData(form);
            if (!fd.get('name')) { toast('请填写广告名称'); return; }
            if (!fd.get('title')) { toast('请填写对外标题'); return; }
            var brandLogoUrl = (logoUrlEl && logoUrlEl.value) || '';
            if (!brandLogoUrl && mode !== 'draft') { toast('请上传品牌头像 / LOGO'); return; }
            if (!materials.length && mode !== 'draft') { toast('请上传广告展示内容'); return; }

            var landingType = fd.get('landingType') || 'creator';
            var landingUrl = '';
            var creator = '';
            if (landingType === 'creator') {
                creator = String(fd.get('creator') || '').trim();
                if (!creator && mode !== 'draft') { toast('请选择主播'); return; }
                landingUrl = 'creator-profile.html';
            } else {
                landingUrl = String(fd.get('landingUrl') || '').trim();
                if (window.FLAdService && landingUrl) {
                    var v = FLAdService.validateLink(landingUrl);
                    if (!v.ok) { toast(v.message); return; }
                }
                if (!landingUrl && mode !== 'draft') { toast('请填写网页地址'); return; }
            }
            if (!fd.get('packageId') && mode !== 'draft') { toast('请选择套餐'); return; }
            if (!fd.get('startAt') && mode !== 'draft') { toast('请选择投放开始时间'); return; }

            syncSchedule();
            var auditStatus = mode === 'draft' ? 'none' : mode === 'publish' ? 'approved' : 'pending_review';
            var deliveryStatus = mode === 'publish' ? 'delivering' : 'pending_start';
            var firstMat = materials[0];
            var ad = FLAdAdmin.savePlatformAd({
                name: fd.get('name'),
                type: fd.get('type'),
                slotCode: fd.get('slotCode'),
                title: fd.get('title'),
                copy: fd.get('slotCode') === 'feed_video' ? fd.get('copy') : '',
                brandLogoUrl: brandLogoUrl,
                materials: materials.slice(),
                materialUrl: firstMat ? firstMat.url : '',
                materialMeta: firstMat ? { validated: true, kind: firstMat.kind, count: materials.length } : { validated: false },
                landingType: landingType,
                landingUrl: landingUrl,
                creator: creator,
                packageId: fd.get('packageId') || '',
                startAt: fd.get('startAt'),
                endAt: fd.get('endAt'),
                priority: 99,
                budgetTotal: 0,
                payStatus: 'none',
                source: 'platform',
                auditStatus: auditStatus,
                deliveryStatus: deliveryStatus
            });
            var msg = mode === 'draft' ? '草稿已保存' : mode === 'publish' ? '已授权发布（原型）' : '已提交审核';
            toast(msg + ' · ' + ad.id);
            if (mode !== 'draft' && AdminModal && AdminModal.confirm) {
                AdminModal.confirm('是否前往广告列表查看？', function () { location.href = 'ads-list.html'; });
            }
        }

        form.addEventListener('submit', function (e) { e.preventDefault(); });
        var map = { opsBtnDraft: 'draft', opsBtnSubmit: 'submit', opsBtnPublish: 'publish' };
        Object.keys(map).forEach(function (id) {
            var btn = document.getElementById(id);
            if (btn) btn.onclick = function () { submitOps(map[id]); };
        });
    }

    function init() {
        if (page === 'ads-overview') renderOverview();
        if (page === 'ads-list') {
            renderAdTable('adTableBody', { showReview: false });
            bindTableActions('adTableBody', { showReview: false });
        }
        if (page === 'ads-review') {
            renderAdTable('adReviewBody', { showReview: true });
            bindTableActions('adReviewBody', { showReview: true });
        }
        if (page === 'ads-slots') renderSlots();
        if (page === 'ads-advertisers') {
            renderAdvertisers();
            var advSearch = document.getElementById('advBtnSearch');
            if (advSearch && !advSearch.dataset.bound) {
                advSearch.dataset.bound = '1';
                advSearch.onclick = function () {
                    if (pagers.adAdvBody) pagers.adAdvBody.resetPage();
                    renderAdvertisers();
                };
            }
        }
        if (page === 'ads-packages') { renderPackages(); bindPackageAdd(); }
        if (page === 'ads-orders') {
            renderOrders();
            var of = document.getElementById('ordBtnFilter');
            if (of && !of.dataset.bound) { of.dataset.bound = '1'; of.onclick = renderOrders; }
        }
        if (page === 'ads-refunds') renderRefunds();
        if (page === 'ads-stats') renderStats();
        if (page === 'ads-risk') {
            renderRisk();
            bindRiskFreq();
            if (window.AdAdminLayout) AdAdminLayout.bindSwitch(document, '.ad-switch[data-switch]');
        }
        if (page === 'ads-ops-create') bindOpsCreate();

        if (window.AdAdminLayout) AdAdminLayout.bindRoleSelect('adAdminRole');

        var btnFilter = document.getElementById('adBtnFilter');
        var btnReset = document.getElementById('adBtnReset');
        function refreshAdListTable() {
            var tbodyId = page === 'ads-review' ? 'adReviewBody' : 'adTableBody';
            if (pagers[tbodyId]) pagers[tbodyId].resetPage();
            renderAdTable(tbodyId, { showReview: page === 'ads-review' });
        }
        if (btnFilter) btnFilter.onclick = refreshAdListTable;
        if (btnReset) btnReset.onclick = function () {
            ['adFilterQ', 'adFilterSource', 'adFilterAudit', 'adFilterDelivery', 'adFilterSlot'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.value = '';
            });
            refreshAdListTable();
        };
    }

    function boot() {
        if (!window.AdminPager && document.querySelector('[data-admin-page^="ads-"] [id$="Pager"]')) {
            setTimeout(boot, 16);
            return;
        }
        init();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
