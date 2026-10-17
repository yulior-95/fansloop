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

    function auditTag(s) {
        var map = { draft: 'mute', pending_review: 'warn', rejected: 'bad', approved: 'ok' };
        var cls = map[s] || 'mute';
        return '<span class="ad-tag-audit ' + (cls === 'ok' || cls === 'bad' ? cls : '') + '">' + esc(FLAdStore.AUDIT_STATUS[s] || s) + '</span>';
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

    function pagerMountId(tbodyId) {
        var map = {
            adTableBody: 'adTablePager',
            adReviewBody: 'adReviewPager',
            adSlotsBody: 'adSlotsPager',
            adPkgBody: 'adPkgPager',
            adAdvBody: 'adAdvPager',
            advQualBody: 'advQualPager',
            adFinBody: 'adFinPager',
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
        var list = FLAdStore.getAds(readFilters());
        if (opts.pendingOnly) list = list.filter(function (a) { return a.auditStatus === 'pending_review'; });
        var pager = getPager(tbodyId, function () { renderAdTable(tbodyId, opts); });
        if (pager) pager.setTotal(list.length);
        if (!list.length) {
            tbody.innerHTML = emptyRow(13, opts.pendingOnly ? '暂无待审核广告' : '暂无广告');
            return;
        }
        var pageList = pager ? pager.getSlice(list) : list;
        var start = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
        tbody.innerHTML = pageList.map(function (a, idx) {
            var src = FLAdStore.SOURCE[a.source] || a.source;
            var thumb = esc(a.materialUrl || 'https://images.unsplash.com/photo-1611162617474-5b21e939e986?w=120&h=68&fit=crop');
            return '<tr>' +
                '<td>' + (start + idx + 1) + '</td>' +
                '<td><code>' + esc(a.id) + '</code></td>' +
                '<td><span class="ad-cell-name"><img class="ad-thumb-cell" src="' + thumb + '" alt=""><span>' + esc(a.name) + '</span></span></td>' +
                '<td>' + esc(a.advertiserUid) + '</td>' +
                '<td>' + esc(src) + '</td>' +
                '<td>' + esc(a.type) + '</td>' +
                '<td>' + esc(slotName(a.slotCode)) + '</td>' +
                '<td>' + (a.budgetTotal != null ? a.budgetTotal : '—') + '</td>' +
                '<td>' + payTag(a.payStatus) + '</td>' +
                '<td>' + auditTag(a.auditStatus) + '</td>' +
                '<td>' + delTag(a.deliveryStatus) + '</td>' +
                '<td style="font-size:12px;color:rgba(0,0,0,.45)">' + esc(a.createdAt.slice(0, 16).replace('T', ' ')) + '</td>' +
                '<td class="ad-cell-ops"><button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-ad-detail="' + esc(a.id) + '">详情</button>' +
                (opts.showReview ? ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-ad-review="' + esc(a.id) + '">审核</button>' : '') +
                ((a.deliveryStatus === 'delivering' || a.deliveryStatus === 'active') ? ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-ad-pause="' + esc(a.id) + '">暂停</button>' : '') +
                (a.deliveryStatus === 'paused' ? ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-ad-resume="' + esc(a.id) + '">恢复</button>' : '') +
                ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm" style="color:#cf1322" data-ad-remove="' + esc(a.id) + '">下架</button></td>' +
                '</tr>';
        }).join('');
    }

    function showAdDetailModal(id) {
        var a = FLAdStore.getAd(id);
        if (!a || !window.AdminModal) return;
        var html = '<dl class="ad-detail-grid">' +
            '<div><dt>广告编号</dt><dd>' + esc(a.id) + '</dd></div>' +
            '<div><dt>来源</dt><dd>' + esc(FLAdStore.SOURCE[a.source]) + '</dd></div>' +
            '<div><dt>审核状态</dt><dd>' + esc(FLAdStore.AUDIT_STATUS[a.auditStatus]) + '</dd></div>' +
            '<div><dt>投放状态</dt><dd>' + esc(FLAdStore.DELIVERY_STATUS[a.deliveryStatus]) + '</dd></div>' +
            '<div><dt>广告位</dt><dd>' + esc(slotName(a.slotCode)) + '</dd></div>' +
            '<div><dt>预算</dt><dd>总 ' + esc(a.budgetTotal) + ' / 日 ' + esc(a.budgetDaily) + ' · ' + esc(a.billing) + '</dd></div>' +
            '<div style="grid-column:1/-1"><dt>素材</dt><dd><img class="ad-preview-img" src="' + esc(a.materialUrl || 'https://picsum.photos/seed/ad-placeholder/400/225') + '" alt=""></dd></div>' +
            '<div style="grid-column:1/-1"><dt>标题 / 文案</dt><dd>' + esc(a.title) + ' — ' + esc(a.copy) + '</dd></div>' +
            '</dl>';
        AdminModal.open({ title: '广告详情 · ' + a.name, body: html, width: 640 });
    }

    function showReviewModal(id) {
        var a = FLAdStore.getAd(id);
        if (!a || !window.AdminModal) return;
        var html = '<p style="font-size:13px;color:rgba(0,0,0,.65)">广告主 UID：<b>' + esc(a.advertiserUid) + '</b> · 来源：' + esc(FLAdStore.SOURCE[a.source]) + '</p>' +
            '<img class="ad-preview-img" style="width:100%;height:auto;max-height:200px" src="' + esc(a.materialUrl || 'https://picsum.photos/seed/ad-review/800/450') + '" alt="">' +
            '<p style="margin:12px 0 0"><b>' + esc(a.title) + '</b><br>' + esc(a.copy) + '</p>' +
            '<p style="font-size:12px;color:rgba(0,0,0,.45)">落地：' + esc(a.landingType) + ' · ' + esc(a.landingUrl) + '</p>' +
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
                FLAdAdmin.approve(id, '审核员');
                FLAdStore.pushOpLog({ action: '审核通过', target: id });
                toast('已通过（原型）');
                AdminModal.close();
                renderAdTable('adTableBody', { showReview: page === 'ads-review' });
                renderAdTable('adReviewBody', { pendingOnly: true, showReview: true });
            };
            if (reject) reject.onclick = function () {
                var reason = (document.getElementById('adRejectReason') || {}).value || '';
                if (!reason.trim()) { toast('请填写拒绝原因'); return; }
                FLAdAdmin.reject(id, reason.trim(), '审核员');
                toast('已拒绝（原型）');
                AdminModal.close();
                renderAdTable('adTableBody', { showReview: page === 'ads-review' });
                renderAdTable('adReviewBody', { pendingOnly: true, showReview: true });
            };
        }, 0);
    }

    function bindTableActions(tbodyId, opts) {
        var root = document.getElementById(tbodyId);
        if (!root) return;
        root.closest('table').addEventListener('click', function (e) {
            var t = e.target.closest('[data-ad-detail],[data-ad-review],[data-ad-pause],[data-ad-resume],[data-ad-remove]');
            if (!t) return;
            var id = t.getAttribute('data-ad-detail') || t.getAttribute('data-ad-review') || t.getAttribute('data-ad-pause') || t.getAttribute('data-ad-resume') || t.getAttribute('data-ad-remove');
            if (t.hasAttribute('data-ad-detail')) showAdDetailModal(id);
            else if (t.hasAttribute('data-ad-review')) showReviewModal(id);
            else if (t.hasAttribute('data-ad-pause')) confirmDanger('确认暂停该广告？', function () { FLAdAdmin.pause(id); toast('已暂停'); renderAdTable(tbodyId, opts); });
            else if (t.hasAttribute('data-ad-resume')) { FLAdAdmin.resume(id); toast('已恢复'); renderAdTable(tbodyId, opts); }
            else if (t.hasAttribute('data-ad-remove')) confirmDanger('确认下架？', function () { FLAdAdmin.remove(id, '运营下架'); toast('已下架'); renderAdTable(tbodyId, opts); });
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
            return '<tr><td>' + (start + i + 1) + '</td><td>' + esc(s.name) + '</td><td><code>' + esc(s.code) + '</code></td><td>' + esc(s.page) + '</td><td>' + esc(s.types.join('、')) + '</td><td>' + esc(s.spec) + '</td><td>' + esc(s.interval) + '</td><td>' + (s.enabled ? '<span class="ant-tag ant-tag-green">启用</span>' : '<span class="ant-tag">停用</span>') + '</td><td class="ad-cell-ops"><button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-slot-toggle="' + esc(s.code) + '">' + (s.enabled ? '停用' : '启用') + '</button></td></tr>';
        }).join('');
        var table = tbody.closest('table');
        if (table && !table.dataset.slotBound) {
            table.dataset.slotBound = '1';
            table.addEventListener('click', function (e) {
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
        if (!list.length) list = [{ uid: FLAdStore.DEMO_UID, accountStatus: 'approved', companyName: '演示主体', totalRecharge: 5000, totalSpend: 3399.5, violations: 0 }];
        var pager = getPager('adAdvBody', renderAdvertisers);
        if (pager) pager.setTotal(list.length);
        var pageList = pager ? pager.getSlice(list) : list;
        var start = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
        tbody.innerHTML = pageList.map(function (a, i) {
            var ads = FLAdStore.getAds({ uid: a.uid });
            return '<tr><td>' + (start + i + 1) + '</td><td><code>' + esc(a.uid) + '</code></td><td>' + esc(a.companyName || '—') + '</td><td>' + advStatusTag(a.accountStatus) + '</td><td>' + ads.length + '</td><td>' + (a.totalRecharge != null ? a.totalRecharge : '5,000') + ' USDT</td><td>' + (a.totalSpend != null ? a.totalSpend : '—') + ' USDT</td><td>' + (a.violationCount || a.violations || 0) + '</td><td class="ad-cell-ops"><button type="button" class="ant-btn ant-btn-link ant-btn-sm">详情</button> <button type="button" class="ant-btn ant-btn-link ant-btn-sm">限制创建</button></td></tr>';
        }).join('');
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
            return '<tr><td><code>' + esc(p.id) + '</code></td><td>' + esc(slot) + '</td><td>' + esc(p.name) + '</td><td>' + p.durationDays + ' 天</td><td><input class="ant-input" style="width:96px" data-price="' + esc(p.id) + '" value="' + p.priceUsdt + '"></td><td><span class="ad-switch ' + (p.enabled ? 'on' : '') + '" data-switch data-pkg="' + esc(p.id) + '" aria-checked="' + (p.enabled ? 'true' : 'false') + '" role="switch"></span></td><td class="ad-cell-ops"><button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-save="' + esc(p.id) + '">保存价格</button></td></tr>';
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
            confirmDanger('确认修改套餐价格？已购订单保留 priceSnapshot 不受影响。', function () {
                var id = b.getAttribute('data-save');
                var inp = document.querySelector('[data-price="' + id + '"]');
                var data = FLAdStore.load();
                data.packages.forEach(function (p) { if (p.id === id) { p.priceUsdt = Number(inp.value); p.version = (p.version || 1) + 1; } });
                FLAdStore.save(data);
                FLAdStore.pushOpLog({ action: '修改套餐价格', target: id });
                toast('已保存（原型）');
            });
        };
    }

    function renderAdvertiserQual() {
        var tbody = document.getElementById('advQualBody');
        if (!tbody) return;
        var list = FLAdStore.getAdvertisers();
        var pager = getPager('advQualBody', renderAdvertiserQual);
        if (pager) pager.setTotal(list.length);
        if (!list.length) {
            tbody.innerHTML = emptyRow(6, '暂无资质申请');
            return;
        }
        var pageList = pager ? pager.getSlice(list) : list;
        tbody.innerHTML = pageList.map(function (a) {
            var actions = a.accountStatus === 'pending'
                ? '<button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-qual-ok="' + esc(a.uid) + '">通过</button> <button type="button" class="ant-btn ant-btn-link ant-btn-sm" style="color:#cf1322" data-qual-no="' + esc(a.uid) + '">驳回</button>'
                : '<span style="color:rgba(0,0,0,.25)">—</span>';
            return '<tr><td><code>' + esc(a.uid) + '</code></td><td>' + esc(a.companyName || '—') + '</td><td>' + esc(a.contact || '—') + '</td><td>' + advStatusTag(a.accountStatus) + '</td><td>' + esc((a.applyAt || '').slice(0, 16).replace('T', ' ')) + '</td><td class="ad-cell-ops">' + actions + '</td></tr>';
        }).join('');
        tbody.onclick = function (e) {
            var ok = e.target.closest('[data-qual-ok]');
            var no = e.target.closest('[data-qual-no]');
            if (ok && window.FLAdService) {
                FLAdService.adminReviewAdvertiser(ok.getAttribute('data-qual-ok'), true);
                toast('资质已通过');
                renderAdvertiserQual();
            }
            if (no && window.FLAdService) {
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
                        FLAdService.adminReviewAdvertiser(no.getAttribute('data-qual-no'), false, r.trim());
                        AdminModal.close();
                        toast('已驳回');
                        renderAdvertiserQual();
                    };
                }, 0);
            }
        };
    }

    function renderFinance() {
        var tbody = document.getElementById('adFinBody');
        if (!tbody) return;
        var acc = FLAdStore.load().account;
        var bal = document.getElementById('adFinBalance');
        if (bal) bal.textContent = acc.balance + ' USDT';
        var fr = document.getElementById('adFinFrozen');
        if (fr) fr.textContent = acc.frozen + ' USDT';
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
            return '<tr><td>' + (start + i + 1) + '</td><td><code>' + esc(f.orderNo || f.id) + '</code></td><td>' + esc(f.uid) + '</td><td>' + esc(f.type) + '</td><td><b>' + f.amount + '</b> USDT</td><td><span class="ant-tag">' + esc(f.status) + '</span></td><td>' + esc(f.at.slice(0, 16).replace('T', ' ')) + '</td></tr>';
        }).join('');
    }

    function renderStats() {
        var ads = FLAdStore.getAds();
        var imp = 0; var clk = 0; var spend = 0; var conv = 0;
        ads.forEach(function (a) {
            imp += a.stats.impressions; clk += a.stats.clicks; spend += a.stats.spend; conv += a.stats.conversions;
        });
        ['stImp', 'stClk', 'stCtr', 'stSpend', 'stConv'].forEach(function (id, i) {
            var el = document.getElementById(id);
            if (!el) return;
            var vals = [imp, clk, (imp ? (clk / imp * 100).toFixed(2) + '%' : '0%'), spend, conv];
            el.textContent = vals[i];
        });
        var tbody = document.getElementById('adStatsBody');
        if (tbody) {
            var pager = getPager('adStatsBody', renderStats);
            if (pager) pager.setTotal(ads.length);
            if (!ads.length) {
                tbody.innerHTML = emptyRow(9, '暂无统计数据');
            } else {
                var pageList = pager ? pager.getSlice(ads) : ads;
                var start = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
                tbody.innerHTML = pageList.map(function (a, i) {
                    var ctr = a.stats.impressions ? (a.stats.clicks / a.stats.impressions * 100).toFixed(2) + '%' : '—';
                    return '<tr><td>' + (start + i + 1) + '</td><td>' + esc(a.id) + '</td><td>' + esc(a.name) + '</td><td>' + esc(FLAdStore.SOURCE[a.source]) + '</td><td>' + a.stats.impressions + '</td><td>' + a.stats.clicks + '</td><td>' + ctr + '</td><td>' + a.stats.spend + '</td><td>' + a.stats.conversions + '</td></tr>';
                }).join('');
            }
        }
        var exp = document.getElementById('adStatsExport');
        if (exp) exp.onclick = function () { toast('已生成导出任务 AD-EXPORT-DEMO（原型）'); };
    }

    function renderRisk() {
        var tbody = document.getElementById('adRiskBody');
        if (!tbody) return;
        var risks = FLAdStore.load().risk || [];
        var pager = getPager('adRiskBody', renderRisk);
        if (pager) pager.setTotal(risks.length);
        if (!risks.length) {
            tbody.innerHTML = emptyRow(7, '暂无风控事件');
        } else {
            var pageList = pager ? pager.getSlice(risks) : risks;
            var start = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
            tbody.innerHTML = pageList.map(function (r, i) {
                return '<tr><td>' + (start + i + 1) + '</td><td><span class="ant-tag ant-tag-red">' + esc(r.type) + '</span></td><td><code>' + esc(r.adId || '—') + '</code></td><td>' + esc(r.reason || r.detail || '') + '</td><td>' + esc(r.status) + '</td><td>' + esc(r.at.slice(0, 16).replace('T', ' ')) + '</td><td class="ad-cell-ops"><button type="button" class="ant-btn ant-btn-link ant-btn-sm" data-risk-pause="' + esc(r.adId) + '">暂停广告</button></td></tr>';
            }).join('');
        }
        var table = tbody.closest('table');
        if (table && !table.dataset.riskBound) {
            table.dataset.riskBound = '1';
            table.addEventListener('click', function (e) {
                var b = e.target.closest('[data-risk-pause]');
                if (!b) return;
                var id = b.getAttribute('data-risk-pause');
                if (id) { FLAdAdmin.pause(id, '风控'); toast('已暂停'); renderRisk(); }
            });
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

        var mat = document.getElementById('opsMaterial');
        var prev = document.getElementById('opsPreviewImg');
        function syncPreview() {
            if (!prev) return;
            var url = (mat && mat.value) ? mat.value.trim() : '';
            prev.src = url || 'https://picsum.photos/seed/ops-ad-preview/480/270';
            prev.onerror = function () { prev.src = 'https://picsum.photos/seed/ops-ad-fallback/480/270'; };
        }
        if (mat) {
            mat.addEventListener('change', syncPreview);
            mat.addEventListener('blur', syncPreview);
        }

        function submitOps(mode) {
            if (mode === 'publish' && window.FLAdService) {
                var perm = FLAdService.requireAdminPerm('publish_skip_audit');
                if (!perm.ok) { toast(perm.message); return; }
            }
            var landingEl = form.querySelector('[name="landingUrl"]');
            if (window.FLAdService && landingEl && String(landingEl.value || '').trim()) {
                var v = FLAdService.validateLink(landingEl.value);
                if (!v.ok) { toast(v.message); return; }
            }
            var fd = new FormData(form);
            if (!fd.get('name')) { toast('请填写广告名称'); return; }
            var auditStatus = mode === 'draft' ? 'draft' : mode === 'publish' ? 'approved' : 'pending_review';
            var deliveryStatus = mode === 'publish' ? 'delivering' : 'pending_start';
            var ad = FLAdAdmin.savePlatformAd({
                name: fd.get('name'),
                type: fd.get('type'),
                slotCode: fd.get('slotCode'),
                title: fd.get('title'),
                copy: fd.get('copy'),
                materialUrl: fd.get('materialUrl') || 'https://picsum.photos/seed/ops-ad/1200/675',
                landingType: fd.get('landingType'),
                landingUrl: fd.get('landingUrl'),
                startAt: fd.get('startAt'),
                endAt: fd.get('endAt'),
                priority: Number(fd.get('priority') || 5),
                budgetTotal: Number(fd.get('budgetTotal') || 0),
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
            renderAdTable('adReviewBody', { pendingOnly: true, showReview: true });
            bindTableActions('adReviewBody', { pendingOnly: true, showReview: true });
        }
        if (page === 'ads-slots') renderSlots();
        if (page === 'ads-advertisers') renderAdvertisers();
        if (page === 'ads-packages') renderPackages();
        if (page === 'ads-advertiser-qual') renderAdvertiserQual();
        if (page === 'ads-finance') renderFinance();
        if (page === 'ads-stats') renderStats();
        if (page === 'ads-risk') {
            renderRisk();
            if (window.AdAdminLayout) AdAdminLayout.bindSwitch(document, '.ad-switch[data-switch]');
        }
        if (page === 'ads-ops-create') bindOpsCreate();

        if (window.AdAdminLayout) AdAdminLayout.bindRoleSelect('adAdminRole');

        var btnFilter = document.getElementById('adBtnFilter');
        var btnReset = document.getElementById('adBtnReset');
        if (btnFilter) btnFilter.onclick = function () {
            if (pagers.adTableBody) pagers.adTableBody.resetPage();
            renderAdTable('adTableBody', { showReview: page === 'ads-review' });
        };
        if (btnReset) btnReset.onclick = function () {
            ['adFilterQ', 'adFilterSource', 'adFilterAudit', 'adFilterDelivery', 'adFilterSlot'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.value = '';
            });
            if (pagers.adTableBody) pagers.adTableBody.resetPage();
            renderAdTable('adTableBody', { showReview: page === 'ads-review' });
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
