/** Wallet page values come from the current account only. */
(function (global) {
    function getUser() {
        return global.GoodfansAuth && global.GoodfansAuth.getUser
            ? global.GoodfansAuth.getUser()
            : null;
    }

    function text(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function renderTokenRows(balance, fmtUsdt, fmtUsd) {
        var host = document.getElementById('walletTokenRows');
        var empty = document.getElementById('walletTokenEmpty');
        var count = document.getElementById('walletAssetCount');
        var section = document.getElementById('walletAssetsSection');
        if (section) {
            section.querySelectorAll('.token-row').forEach(function (row) { row.remove(); });
        }
        if (!host && section) {
            host = document.createElement('div');
            host.id = 'walletTokenRows';
            section.appendChild(host);
            empty = document.createElement('div');
            empty.id = 'walletTokenEmpty';
            empty.style.cssText = 'padding:24px 12px;text-align:center;color:var(--t-tertiary)';
            empty.textContent = '暂无资产数据';
            section.appendChild(empty);
        }
        if (!count && section) count = section.querySelector('.sh .cnt');
        if (!host) return;
        host.innerHTML = '';
        var hasBalance = balance > 0;
        if (empty) empty.style.display = hasBalance ? 'none' : '';
        if (count) count.textContent = hasBalance ? '1' : '0';
        if (!hasBalance) return;
        var row = document.createElement('div');
        row.className = 'token-row';
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.style.cursor = 'pointer';
        row.onclick = function () { location.href = 'recharge.html'; };
        row.innerHTML = '<div class="tk-ic usdt">₮</div>' +
            '<div class="info"><div class="n">USDT 账户 <span class="net-tag">多链</span></div>' +
            '<div class="price">可用余额 · 可充值/提现</div></div>' +
            '<div class="amt"><div class="v">' + fmtUsdt(balance) + ' <span style="color:var(--t-tertiary);font-weight:600">USDT</span></div>' +
            '<div class="vu">≈ $' + fmtUsd(balance) + '</div></div>';
        host.appendChild(row);
    }

    function clearRecentTransactions() {
        var body = document.querySelector('.section-card .table tbody');
        if (!body) return;
        body.hidden = false;
        var section = body.closest('.section-card');
        var count = section && section.querySelector('.sh .cnt');
        if (count) count.textContent = '0';
        body.innerHTML = '<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--t-tertiary)">暂无账变数据</td></tr>';
    }

    function apply() {
        if (!global.FLUserAssets) return;
        var user = getUser();
        var w = global.FLUserAssets.getWalletSummary();
        var fmtUsd = global.FLUserAssets.formatUsd;
        var fmtUsdt = global.FLUserAssets.formatUsdt;
        var hasBalance = w.walletUsd > 0 || w.usdtBalance > 0;

        text('walletTotalUsd', hasBalance ? '$' + fmtUsd(w.walletUsd) : '--');
        text('walletBalanceSub', hasBalance ? fmtUsdt(w.usdtBalance) + ' USDT' : '--');
        text('walletNetwork', user && user.walletNetwork ? user.walletNetwork : '--');
        text('walletNetworkDetail', user && user.walletNetwork ? user.walletNetwork : '--');
        text('walletAddressName', user && user.walletShort ? 'Wallet · ' + (user.name || 'User') : '--');
        text('walletAddressValue', user && user.walletShort ? user.walletShort : '--');
        text('walletSession', '--');
        text('walletSecurity', '--');
        text('walletMonthlyRecharge', w.monthlyRecharge > 0 ? '$' + fmtUsd(w.monthlyRecharge) : '--');
        text('walletMonthlyWithdraw', w.monthlyWithdraw > 0 ? '$' + fmtUsd(w.monthlyWithdraw) : '--');

        var income = global.FLCreatorIncomeStore && global.FLCreatorIncomeStore.getMonthlyUsdt
            ? global.FLCreatorIncomeStore.getMonthlyUsdt()
            : 0;
        text('walletCreatorIncome', income > 0 ? '$' + fmtUsd(income) : '--');
        text('walletMonthlyRechargeDelta', '--');
        text('walletMonthlyWithdrawDelta', '--');
        text('walletCreatorIncomeDelta', '--');

        renderTokenRows(w.usdtBalance, fmtUsdt, fmtUsd);
        clearRecentTransactions();
    }

    global.FLWalletPageSync = { apply: apply };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply);
    } else {
        apply();
    }

    global.addEventListener('goodfans-auth-change', apply);
    global.addEventListener('fl-user-assets-change', apply);
    global.addEventListener('fl-creator-income-change', apply);
})(typeof window !== 'undefined' ? window : this);
