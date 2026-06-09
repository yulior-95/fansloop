/**
 * 积分商城 · 交互逻辑（原型）
 * — 兑换确认、幸运转盘、权益/历史切换、钱包双池展示
 */
(function () {
    var WHEEL_COST = 500;
    var WHEEL_DAILY_CAP = 2500;
    var WHEEL_STORAGE_KEY = 'fl_wheel_daily_v1';

    var PRIZES = [
        { label: '0.5 USDT', weight: 8, color: '#7C3AED' },
        { label: '会员 3 天', weight: 12, color: '#DB2777' },
        { label: 'NFT 碎片', weight: 10, color: '#F59E0B' },
        { label: '谢谢参与', weight: 30, color: '#10B981' },
        { label: '1 USDT', weight: 5, color: '#3B82F6' },
        { label: '积分 +100', weight: 15, color: '#8B5CF6' },
        { label: '会员 7 天', weight: 8, color: '#EC4899' },
        { label: '谢谢参与', weight: 12, color: '#6366F1' }
    ];

    var tabs = document.querySelectorAll('#mallTabs button');
    var cards = document.querySelectorAll('#goodsGrid .goods-card');
    var overlay = document.getElementById('redeemOverlay');
    var redeemClose = document.getElementById('redeemClose');
    var redeemCancel = document.getElementById('redeemCancel');
    var redeemOk = document.getElementById('redeemOk');
    var redeemName = document.getElementById('redeemName');
    var redeemImg = document.getElementById('redeemImg');
    var redeemCost = document.getElementById('redeemCost');
    var redeemAfter = document.getElementById('redeemAfter');
    var toast = document.getElementById('globalToast');
    var toastMsg = document.getElementById('toastMsg');

    var wheelOverlay = document.getElementById('wheelOverlay');
    var wheelClose = document.getElementById('wheelClose');
    var wheelRotor = document.getElementById('wheelRotor');
    var wheelDisk = document.getElementById('wheelDisk');
    var btnSpin = document.getElementById('btnSpin');
    var wheelAvail = document.getElementById('wheelAvail');
    var wheelSpentToday = document.getElementById('wheelSpentToday');
    var wheelDailyCap = document.getElementById('wheelDailyCap');
    var wheelCostEl = document.getElementById('wheelCostDisplay');
    var wheelResult = document.getElementById('wheelResult');

    var btnHistoryToggle = document.getElementById('btnHistoryToggle');
    var historyOverlay = document.getElementById('historyOverlay');
    var historyClose = document.getElementById('historyClose');
    var historyTableBody = document.getElementById('historyTableBody');
    var historyEmpty = document.getElementById('historyEmpty');
    var histSearch = document.getElementById('histSearch');
    var histStatus = document.getElementById('histStatus');
    var histCategory = document.getElementById('histCategory');
    var histDateFrom = document.getElementById('histDateFrom');
    var histDateTo = document.getElementById('histDateTo');
    var histReset = document.getElementById('histReset');
    var histPrev = document.getElementById('histPrev');
    var histNext = document.getElementById('histNext');
    var histPageInfo = document.getElementById('histPageInfo');
    var histSumCount = document.getElementById('histSumCount');
    var histSumPoints = document.getElementById('histSumPoints');
    var histSumActive = document.getElementById('histSumActive');
    var histSumFiltered = document.getElementById('histSumFiltered');

    var HIST_PAGE_SIZE = 10;
    var histPage = 1;
    var histFiltered = [];

    var HISTORY_RECORDS = [
        { id: 'RD-20260502-8841', time: '2026-05-02 19:40', product: '每日上限提升卡（50→100）', cat: 'grow', catLabel: '加速成长', points: 2800, status: 'used', statusLabel: '已使用', note: '当日已生效' },
        { id: 'RD-20260501-7720', time: '2026-05-01 11:06', product: '积分加速卡 24h', cat: 'grow', catLabel: '加速成长', points: 1200, status: 'using', statusLabel: '使用中', note: '至 05-04 14:32' },
        { id: 'RD-20260428-6612', time: '2026-04-28 09:12', product: '空投抽奖券 ×1', cat: 'asset', catLabel: '资产专区', points: 800, status: 'drawn', statusLabel: '已开奖', note: '未中奖' },
        { id: 'RD-20260425-5590', time: '2026-04-25 22:01', product: '幸运转盘', cat: 'wheel', catLabel: '幸运转盘', points: 500, status: 'none', statusLabel: '谢谢参与', note: '—' },
        { id: 'RD-20260422-4488', time: '2026-04-22 16:33', product: '订阅 9 折券', cat: 'pay', catLabel: '付费权益', points: 2200, status: 'using', statusLabel: '使用中', note: '至 05-10 前使用' },
        { id: 'RD-20260420-3377', time: '2026-04-20 08:15', product: '付费内容试看券', cat: 'pay', catLabel: '付费权益', points: 1600, status: 'used', statusLabel: '已使用', note: '已解锁 1 篇' },
        { id: 'RD-20260418-2266', time: '2026-04-18 21:44', product: '会员身份 · 7 天', cat: 'vip', catLabel: '会员装扮', points: 5500, status: 'expired', statusLabel: '已过期', note: '04-25 到期' },
        { id: 'RD-20260415-1155', time: '2026-04-15 13:20', product: '打赏加成卡 · 24h', cat: 'pay', catLabel: '付费权益', points: 3500, status: 'used', statusLabel: '已使用', note: '已用于 1 笔打赏' },
        { id: 'RD-20260412-0044', time: '2026-04-12 10:05', product: '连续签到翻倍卡', cat: 'grow', catLabel: '加速成长', points: 450, status: 'used', statusLabel: '已使用', note: '签到 ×2 已触发' },
        { id: 'RD-20260408-9933', time: '2026-04-08 18:52', product: 'NFT 手续费折扣券', cat: 'asset', catLabel: '资产专区', points: 4400, status: 'expired', statusLabel: '已过期', note: '未在期限内 Mint' },
        { id: 'RD-20260405-8822', time: '2026-04-05 07:30', product: '幸运转盘', cat: 'wheel', catLabel: '幸运转盘', points: 500, status: 'none', statusLabel: '谢谢参与', note: '—' },
        { id: 'RD-20260402-7711', time: '2026-04-02 15:18', product: '评论高亮 · 7 日', cat: 'vip', catLabel: '会员装扮', points: 900, status: 'used', statusLabel: '已使用', note: '样式 A' },
        { id: 'RD-20260328-6600', time: '2026-03-28 20:41', product: '邀请加成卡 · 7 日', cat: 'grow', catLabel: '加速成长', points: 4200, status: 'expired', statusLabel: '已过期', note: '邀请返利 +10%' },
        { id: 'RD-20260325-5589', time: '2026-03-25 12:09', product: 'SFL 兑换资格', cat: 'asset', catLabel: '资产专区', points: 9900, status: 'using', statusLabel: '使用中', note: '抽签资格有效' },
        { id: 'RD-20260320-4478', time: '2026-03-20 09:55', product: '专属头像框 · 霓虹', cat: 'vip', catLabel: '会员装扮', points: 3100, status: 'used', statusLabel: '已使用', note: '装扮已佩戴' },
        { id: 'RD-20260315-3367', time: '2026-03-15 23:12', product: '幸运转盘', cat: 'wheel', catLabel: '幸运转盘', points: 500, status: 'drawn', statusLabel: '已开奖', note: '获得 NFT 碎片 ×1' },
        { id: 'RD-20260310-2256', time: '2026-03-10 14:28', product: '质押加成券 · 30 日', cat: 'asset', catLabel: '资产专区', points: 12000, status: 'expired', statusLabel: '已过期', note: '活动期已结束' },
        { id: 'RD-20260305-1145', time: '2026-03-05 11:00', product: '订阅 8 折券', cat: 'pay', catLabel: '付费权益', points: 6800, status: 'used', statusLabel: '已使用', note: '季度档已抵扣' }
    ];

    var STATUS_TAG = {
        using: 'tag-purple',
        used: 'tag-success',
        expired: 'tag',
        drawn: 'tag-info',
        none: ''
    };

    var balance = 12580;
    var pendingPoints = 0;
    var isSpinning = false;
    var currentRotation = 0;

    function fmt(n) {
        return Number(n).toLocaleString('zh-CN');
    }

    function applyWalletFromConfig(cfg) {
        if (!cfg || !cfg.pointsWallet) return;
        balance = cfg.pointsWallet.available || balance;
        var avail = cfg.pointsWallet.available || 0;
        var frozen = cfg.pointsWallet.frozen || 0;
        var days = cfg.coolingPeriodDays || 7;
        var main = document.getElementById('pmAvailVal');
        var dup = document.getElementById('pmAvailDup');
        var fr = document.getElementById('pmFrozenVal');
        var tipDays = document.getElementById('pmCoolingDaysTip');
        if (main) main.textContent = fmt(avail);
        if (dup) dup.textContent = fmt(avail);
        if (fr) fr.textContent = fmt(frozen);
        if (tipDays) tipDays.textContent = String(days);
        updateWheelBalance();
    }

    if (window.FLInviteReward) {
        window.FLInviteReward.fetchConfig().then(applyWalletFromConfig);
    }

    function filterTab(key) {
        cards.forEach(function (card) {
            var cats = (card.dataset.cats || '').split(',');
            card.classList.toggle('hidden', key !== 'hot' && !cats.includes(key));
        });
    }

    tabs.forEach(function (btn) {
        btn.addEventListener('click', function () {
            tabs.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            filterTab(btn.dataset.tab);
        });
    });

    function showToast(msg) {
        toastMsg.textContent = msg;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2600);
    }

    function openRedeem(title, points, imgUrl) {
        pendingPoints = points;
        redeemName.textContent = title;
        redeemImg.style.backgroundImage = 'url(\'' + imgUrl + '\')';
        redeemCost.textContent = fmt(points) + ' 积分';
        redeemAfter.textContent = fmt(balance - points);
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
    }

    function closeRedeem() {
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('.btn-redeem:not(:disabled)').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var title = btn.dataset.title;
            var points = parseInt(btn.dataset.points, 10);
            var img = btn.dataset.img || '';
            if (!title || !points) return;
            if (balance < points) {
                showToast('积分不足，去完成活跃任务或等待计时奖励吧');
                return;
            }
            openRedeem(title, points, img);
        });
    });

    if (redeemClose) redeemClose.addEventListener('click', closeRedeem);
    if (redeemCancel) redeemCancel.addEventListener('click', closeRedeem);
    if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) closeRedeem(); });

    if (redeemOk) {
        redeemOk.addEventListener('click', function () {
            balance -= pendingPoints;
            var av = document.getElementById('pmAvailVal');
            if (av) av.textContent = fmt(balance);
            var dup = document.getElementById('pmAvailDup');
            if (dup) dup.textContent = fmt(balance);
            closeRedeem();
            showToast('兑换成功 · 权益已下发（原型演示）');
            updateWheelBalance();
        });
    }

    /* —— 历史兑换 · 大尺寸弹窗 —— */
    function statusHtml(row) {
        if (row.status === 'none') {
            return '<span style="color:var(--t-tertiary)">' + row.statusLabel + '</span>';
        }
        var cls = STATUS_TAG[row.status] || 'tag';
        var extra = row.status === 'expired' ? ' style="font-size:10px;background:rgba(255,255,255,0.06);color:var(--t-tertiary)"' : ' style="font-size:10px"';
        return '<span class="tag ' + cls + '"' + extra + '>' + row.statusLabel + '</span>';
    }

    function filterHistoryRecords() {
        var q = (histSearch && histSearch.value || '').trim().toLowerCase();
        var st = histStatus ? histStatus.value : '';
        var cat = histCategory ? histCategory.value : '';
        var from = histDateFrom ? histDateFrom.value : '';
        var to = histDateTo ? histDateTo.value : '';

        return HISTORY_RECORDS.filter(function (row) {
            if (q && row.product.toLowerCase().indexOf(q) === -1 && row.id.toLowerCase().indexOf(q) === -1) return false;
            if (st && row.status !== st) return false;
            if (cat && row.cat !== cat) return false;
            var day = row.time.slice(0, 10);
            if (from && day < from) return false;
            if (to && day > to) return false;
            return true;
        });
    }

    function updateHistorySummary(all, filtered) {
        var totalPts = all.reduce(function (s, r) { return s + r.points; }, 0);
        var active = all.filter(function (r) { return r.status === 'using'; }).length;
        if (histSumCount) histSumCount.textContent = fmt(all.length);
        if (histSumPoints) histSumPoints.textContent = '−' + fmt(totalPts);
        if (histSumActive) histSumActive.textContent = fmt(active);
        if (histSumFiltered) histSumFiltered.textContent = fmt(filtered.length);
    }

    function renderHistoryTable() {
        histFiltered = filterHistoryRecords();
        updateHistorySummary(HISTORY_RECORDS, histFiltered);

        var totalPages = Math.max(1, Math.ceil(histFiltered.length / HIST_PAGE_SIZE));
        if (histPage > totalPages) histPage = totalPages;
        if (histPage < 1) histPage = 1;

        var start = (histPage - 1) * HIST_PAGE_SIZE;
        var pageRows = histFiltered.slice(start, start + HIST_PAGE_SIZE);

        if (historyTableBody) {
            historyTableBody.innerHTML = pageRows.map(function (row) {
                return '<tr>' +
                    '<td>' + row.time + '</td>' +
                    '<td class="mono">' + row.id + '</td>' +
                    '<td>' + row.product + '</td>' +
                    '<td>' + row.catLabel + '</td>' +
                    '<td class="pts">−' + fmt(row.points) + '</td>' +
                    '<td>' + statusHtml(row) + '</td>' +
                    '<td class="note">' + row.note + '</td>' +
                    '</tr>';
            }).join('');
        }

        if (historyEmpty) {
            historyEmpty.classList.toggle('is-hidden', pageRows.length > 0);
        }

        if (histPageInfo) {
            if (!histFiltered.length) {
                histPageInfo.textContent = '共 0 条记录';
            } else {
                histPageInfo.textContent = '第 ' + histPage + ' / ' + totalPages + ' 页 · 显示 ' +
                    (start + 1) + '–' + (start + pageRows.length) + ' 条，共 ' + histFiltered.length + ' 条';
            }
        }
        if (histPrev) histPrev.disabled = histPage <= 1;
        if (histNext) histNext.disabled = histPage >= totalPages;
    }

    function openHistoryModal() {
        if (!historyOverlay) return;
        histPage = 1;
        renderHistoryTable();
        historyOverlay.classList.add('show');
        historyOverlay.setAttribute('aria-hidden', 'false');
        if (btnHistoryToggle) {
            btnHistoryToggle.classList.add('is-active');
            btnHistoryToggle.setAttribute('aria-expanded', 'true');
        }
        if (histSearch) histSearch.focus();
    }

    function closeHistoryModal() {
        if (!historyOverlay) return;
        historyOverlay.classList.remove('show');
        historyOverlay.setAttribute('aria-hidden', 'true');
        if (btnHistoryToggle) {
            btnHistoryToggle.classList.remove('is-active');
            btnHistoryToggle.setAttribute('aria-expanded', 'false');
        }
    }

    if (btnHistoryToggle) btnHistoryToggle.addEventListener('click', openHistoryModal);
    if (historyClose) historyClose.addEventListener('click', closeHistoryModal);
    if (historyOverlay) {
        historyOverlay.addEventListener('click', function (e) {
            if (e.target === historyOverlay) closeHistoryModal();
        });
    }

    [histSearch, histStatus, histCategory, histDateFrom, histDateTo].forEach(function (el) {
        if (!el) return;
        el.addEventListener('input', function () { histPage = 1; renderHistoryTable(); });
        el.addEventListener('change', function () { histPage = 1; renderHistoryTable(); });
    });
    if (histReset) {
        histReset.addEventListener('click', function () {
            if (histSearch) histSearch.value = '';
            if (histStatus) histStatus.value = '';
            if (histCategory) histCategory.value = '';
            if (histDateFrom) histDateFrom.value = '';
            if (histDateTo) histDateTo.value = '';
            histPage = 1;
            renderHistoryTable();
        });
    }
    if (histPrev) {
        histPrev.addEventListener('click', function () {
            if (histPage > 1) { histPage -= 1; renderHistoryTable(); }
        });
    }
    if (histNext) {
        histNext.addEventListener('click', function () {
            var totalPages = Math.max(1, Math.ceil(histFiltered.length / HIST_PAGE_SIZE));
            if (histPage < totalPages) { histPage += 1; renderHistoryTable(); }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && historyOverlay && historyOverlay.classList.contains('show')) {
            closeHistoryModal();
        }
    });

    /* —— 权益说明区 · 单行 4 列，>4 横向滑动，滚轮映射 —— */
    var USAGE_COLS = 4;
    var usageSection = document.querySelector('.usage-section');
    var usageGrid = document.getElementById('usageGrid');
    var usageScrollWrap = document.getElementById('usageScrollWrap');
    var usageFadeL = document.getElementById('usageFadeL');
    var usageFadeR = document.getElementById('usageFadeR');

    function usageColsPerView() {
        if (!usageScrollWrap) return USAGE_COLS;
        var w = usageScrollWrap.clientWidth;
        if (w < 640) return 1;
        if (w < 900) return 2;
        if (w < 1100) return 3;
        return USAGE_COLS;
    }

    function usageColWidth() {
        if (!usageScrollWrap) return 240;
        var colsPerView = usageColsPerView();
        var gap = 12;
        return (usageScrollWrap.clientWidth - gap * (colsPerView - 1)) / colsPerView;
    }

    function applyUsageColWidth() {
        if (!usageGrid) return;
        usageGrid.style.setProperty('--usage-col-width', usageColWidth() + 'px');
    }

    function updateUsageFades() {
        if (!usageScrollWrap || !usageSection || !usageSection.classList.contains('is-scrollable')) {
            if (usageFadeL) usageFadeL.classList.remove('is-visible');
            if (usageFadeR) usageFadeR.classList.remove('is-visible');
            return;
        }
        var sl = usageScrollWrap.scrollLeft;
        var max = usageScrollWrap.scrollWidth - usageScrollWrap.clientWidth;
        if (usageFadeL) usageFadeL.classList.toggle('is-visible', sl > 4);
        if (usageFadeR) usageFadeR.classList.toggle('is-visible', sl < max - 4);
    }

    function initUsageGrid() {
        if (!usageGrid || !usageSection) return;
        var cards = usageGrid.querySelectorAll('.usage-card');
        var count = cards.length;
        var colsPerView = usageColsPerView();
        var scrollable = count > colsPerView;

        usageSection.classList.toggle('is-scrollable', scrollable);
        usageGrid.classList.toggle('usage-grid--scroll', scrollable);
        applyUsageColWidth();
        updateUsageFades();
    }

    if (usageScrollWrap) {
        usageScrollWrap.addEventListener('wheel', function (e) {
            if (!usageSection || !usageSection.classList.contains('is-scrollable')) return;
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            e.preventDefault();
            usageScrollWrap.scrollLeft += e.deltaY;
            updateUsageFades();
        }, { passive: false });

        usageScrollWrap.addEventListener('scroll', updateUsageFades, { passive: true });
    }
    window.addEventListener('resize', initUsageGrid);
    initUsageGrid();

    /* —— 幸运转盘 —— */
    function todayKey() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function readWheelDaily() {
        try {
            var raw = localStorage.getItem(WHEEL_STORAGE_KEY);
            if (!raw) return { date: todayKey(), spent: 0 };
            var data = JSON.parse(raw);
            if (data.date !== todayKey()) return { date: todayKey(), spent: 0 };
            return data;
        } catch (e) {
            return { date: todayKey(), spent: 0 };
        }
    }

    function writeWheelDaily(spent) {
        try {
            localStorage.setItem(WHEEL_STORAGE_KEY, JSON.stringify({ date: todayKey(), spent: spent }));
        } catch (e) { /* noop */ }
    }

    function getWheelSpentToday() {
        return readWheelDaily().spent;
    }

    function updateWheelBalance() {
        if (wheelAvail) wheelAvail.textContent = fmt(balance);
        var spent = getWheelSpentToday();
        if (wheelSpentToday) wheelSpentToday.textContent = fmt(spent);
        if (wheelDailyCap) wheelDailyCap.textContent = fmt(WHEEL_DAILY_CAP);
        document.querySelectorAll('.js-wheel-daily-cap').forEach(function (el) {
            el.textContent = fmt(WHEEL_DAILY_CAP);
        });
        if (wheelCostEl) wheelCostEl.textContent = fmt(WHEEL_COST);
        if (btnSpin) {
            var overQuota = spent + WHEEL_COST > WHEEL_DAILY_CAP;
            var noBalance = balance < WHEEL_COST;
            btnSpin.disabled = isSpinning || overQuota || noBalance;
        }
    }

    function buildWheel() {
        var container = document.getElementById('wheelLabels');
        if (!wheelDisk || !container) return;

        var seg = 360 / PRIZES.length;
        var stops = PRIZES.map(function (p, i) {
            return p.color + ' ' + (i * seg) + 'deg ' + ((i + 1) * seg) + 'deg';
        }).join(', ');
        wheelDisk.style.background = 'conic-gradient(from 0deg, ' + stops + ')';

        container.innerHTML = '';
        PRIZES.forEach(function (p, i) {
            var el = document.createElement('div');
            el.className = 'wheel-label';
            el.textContent = p.label;
            el.style.transform = 'rotate(' + (i * seg + seg / 2) + 'deg)';
            container.appendChild(el);
        });
    }

    function rotationForPrizeIndex(idx) {
        var seg = 360 / PRIZES.length;
        var centerAngle = idx * seg + seg / 2;
        return (360 - centerAngle) % 360;
    }

    function pickPrizeIndex() {
        var total = PRIZES.reduce(function (s, p) { return s + p.weight; }, 0);
        var r = Math.random() * total;
        var acc = 0;
        for (var i = 0; i < PRIZES.length; i++) {
            acc += PRIZES[i].weight;
            if (r <= acc) return i;
        }
        return PRIZES.length - 1;
    }

    function openWheel() {
        if (!wheelOverlay) return;
        wheelResult.classList.remove('show');
        wheelResult.textContent = '';
        updateWheelBalance();
        wheelOverlay.classList.add('show');
        wheelOverlay.setAttribute('aria-hidden', 'false');
    }

    function closeWheel() {
        if (!wheelOverlay || isSpinning) return;
        wheelOverlay.classList.remove('show');
        wheelOverlay.setAttribute('aria-hidden', 'true');
    }

    function spinWheel() {
        if (isSpinning) return;
        var spent = getWheelSpentToday();
        if (spent + WHEEL_COST > WHEEL_DAILY_CAP) {
            showToast('今日转盘积分额度已用完，明天再来吧');
            return;
        }
        if (balance < WHEEL_COST) {
            showToast('可用积分不足，无法参与转盘');
            return;
        }

        isSpinning = true;
        btnSpin.disabled = true;
        wheelResult.classList.remove('show');

        var idx = pickPrizeIndex();
        var seg = 360 / PRIZES.length;
        var targetMod = rotationForPrizeIndex(idx);
        var delta = (targetMod - (currentRotation % 360) + 360) % 360;
        var extra = (5 + Math.floor(Math.random() * 2)) * 360 + Math.floor(Math.random() * seg);
        currentRotation += extra + delta;
        if (wheelRotor) {
            wheelRotor.style.transform = 'rotate(' + currentRotation + 'deg)';
        }

        setTimeout(function () {
            balance -= WHEEL_COST;
            var newSpent = spent + WHEEL_COST;
            writeWheelDaily(newSpent);

            var av = document.getElementById('pmAvailVal');
            if (av) av.textContent = fmt(balance);
            var dup = document.getElementById('pmAvailDup');
            if (dup) dup.textContent = fmt(balance);

            var prize = PRIZES[idx];
            wheelResult.textContent = '恭喜获得：' + prize.label + '（已扣除 ' + fmt(WHEEL_COST) + ' 积分）';
            wheelResult.classList.add('show');

            isSpinning = false;
            updateWheelBalance();

            if (newSpent >= WHEEL_DAILY_CAP) {
                showToast('今日转盘积分额度已用完');
            }
        }, 4200);
    }

    var btnWheel = document.getElementById('btnWheel');
    if (btnWheel) btnWheel.addEventListener('click', openWheel);
    if (wheelClose) wheelClose.addEventListener('click', closeWheel);
    if (wheelOverlay) {
        wheelOverlay.addEventListener('click', function (e) {
            if (e.target === wheelOverlay && !isSpinning) closeWheel();
        });
    }
    if (btnSpin) btnSpin.addEventListener('click', spinWheel);

    buildWheel();
    updateWheelBalance();

    if (new URLSearchParams(location.search).get('wheel') === 'open') {
        setTimeout(openWheel, 400);
    }
    if (new URLSearchParams(location.search).get('history') === 'open') {
        setTimeout(openHistoryModal, 400);
    }
})();
