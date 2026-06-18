/**
 * 钱包页 · 按当前登录用户同步余额与连接信息
 */
(function (global) {
    function getUser() {
        return global.FansloopAuth && global.FansloopAuth.getUser ? global.FansloopAuth.getUser() : null;
    }

    function apply() {
        if (!global.FLUserAssets) return;
        var user = getUser();
        var w = global.FLUserAssets.getWalletSummary();
        var fmtUsd = global.FLUserAssets.formatUsd;
        var fmtUsdt = global.FLUserAssets.formatUsdt;

        var balV = document.querySelector('.bal-amt .v');
        if (balV) {
            var usd = w.walletUsd || 0;
            var whole = Math.floor(usd);
            var cents = Math.round((usd - whole) * 100);
            var centsStr = cents < 10 ? '0' + cents : '' + cents;
            balV.innerHTML = '<span class="currency">$</span>' + fmtUsd(whole).replace('.00', '') +
                '<span class="cents">.' + centsStr + '</span>';
        }

        var balSub = document.querySelector('.bal-amt .sub');
        if (balSub) {
            var deltaHtml = w.monthlyDelta > 0
                ? ' <span class="delta"><i class="fa-solid fa-arrow-up"></i>+$' + fmtUsd(w.monthlyDelta) + ' 本月</span>'
                : '';
            balSub.innerHTML = '≈ ' + fmtUsdt(w.usdtBalance) + ' USDT' + deltaHtml;
        }

        document.querySelectorAll('.quick-stats .qs-card').forEach(function (card, idx) {
            var vEl = card.querySelector('.v');
            if (!vEl) return;
            if (idx === 0) vEl.textContent = '$' + fmtUsd(w.monthlyRecharge);
            if (idx === 1) vEl.textContent = '$' + fmtUsd(w.monthlyWithdraw);
        });

        var addrName = document.querySelector('.addr-row .info .n');
        var addrLine = document.querySelector('.addr-row .info .a');
        if (user && addrName) {
            addrName.textContent = 'MetaMask · ' + (user.name || '用户');
        }
        if (user && addrLine && user.walletShort) {
            addrLine.textContent = user.walletShort;
        }

        var tokenUsdt = document.querySelector('.token-row .info .bal, .token-row .tk-bal');
        if (tokenUsdt) tokenUsdt.textContent = fmtUsdt(w.usdtBalance);

        var emptyHint = document.getElementById('walletEmptyHint');
        if (w.usdtBalance <= 0 && w.walletUsd <= 0) {
            if (!emptyHint && document.querySelector('.bal-card')) {
                emptyHint = document.createElement('p');
                emptyHint.id = 'walletEmptyHint';
                emptyHint.style.cssText = 'font-size:12px;color:var(--t-tertiary);margin-top:10px;line-height:1.5';
                emptyHint.innerHTML = '<i class="fa-solid fa-circle-info"></i> 新账户暂无余额，<a href="recharge.html" style="color:var(--brand-purple)">去充值</a> 后即可消费或提现。';
                var balAmt = document.querySelector('.bal-amt');
                if (balAmt) balAmt.appendChild(emptyHint);
            }
        } else if (emptyHint) {
            emptyHint.remove();
        }
    }

    global.FLWalletPageSync = { apply: apply };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply);
    } else {
        apply();
    }

    global.addEventListener('fansloop-auth-change', apply);
    global.addEventListener('fl-user-assets-change', apply);
})(typeof window !== 'undefined' ? window : this);
