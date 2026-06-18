(function (global) {
    function qs(name) {
        try {
            return new URLSearchParams(location.search).get(name) || '';
        } catch (e) {
            return '';
        }
    }

    function suggestAmt() {
        var fromUrl = parseFloat(qs('need'));
        if (!isNaN(fromUrl) && fromUrl > 0) return Math.ceil(fromUrl);
        try {
            var s = parseFloat(localStorage.getItem('fl_recharge_suggest'));
            if (!isNaN(s) && s > 0) return Math.ceil(s);
        } catch (e) { /* ignore */ }
        return 100;
    }

    function toast(msg) {
        var t = document.getElementById('rechargeToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); }, 2600);
    }

    function init() {
        var bar = document.getElementById('rechargeDemoCredit');
        if (!bar) return;
        if (!global.FansloopAuth || !global.FansloopAuth.isLoggedIn || !global.FansloopAuth.isLoggedIn()) {
            bar.style.display = 'none';
            return;
        }
        var amt = suggestAmt();
        var input = document.getElementById('rechargeDemoAmt');
        if (input) input.value = String(amt);
        var btn = document.getElementById('btnRechargeDemoCredit');
        if (!btn) return;
        btn.addEventListener('click', function () {
            var n = parseFloat(input && input.value);
            if (isNaN(n) || n <= 0) {
                toast('请输入有效充值金额');
                return;
            }
            var w = global.LiveWalletStore;
            var assets = global.FLUserAssets;
            var bal;
            if (assets && assets.creditRecharge) {
                bal = assets.creditRecharge(n);
            } else if (w) {
                bal = w.add(n);
            } else {
                toast('钱包未就绪，请刷新后重试');
                return;
            }
            toast('模拟到账 +' + n.toFixed(2) + ' USDT，余额 ' + bal.toFixed(2) + ' USDT');
            try { localStorage.removeItem('fl_recharge_suggest'); } catch (e) { /* ignore */ }
            var ret = qs('return');
            if (ret) {
                setTimeout(function () {
                    window.location.href = decodeURIComponent(ret);
                }, 1200);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window);
