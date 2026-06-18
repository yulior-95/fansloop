/**
 * 直播页 · 钱包余额原型（按用户隔离，存于 FLUserAssets）
 */
(function (global) {
    var LEGACY_KEY = 'fansloop_wallet_usdt';

    function isLoggedIn() {
        return global.FansloopAuth && global.FansloopAuth.isLoggedIn && global.FansloopAuth.isLoggedIn();
    }

    function useAssets() {
        return isLoggedIn() && global.FLUserAssets && global.FansloopAuth.getUserId();
    }

    function read() {
        if (isLoggedIn()) {
            if (global.FLUserAssets) return global.FLUserAssets.getLiveUsdt();
            return 0;
        }
        try {
            var v = parseFloat(localStorage.getItem(LEGACY_KEY));
            return isNaN(v) ? 0 : v;
        } catch (e) {
            return 0;
        }
    }

    function write(n) {
        if (isLoggedIn()) {
            if (global.FLUserAssets) global.FLUserAssets.setLiveUsdt(n);
            return;
        }
        try {
            localStorage.setItem(LEGACY_KEY, String(Math.max(0, Math.round(n * 100) / 100)));
        } catch (e) { /* ignore */ }
    }

    global.LiveWalletStore = {
        SUB_PRICE: 28,
        getBalance: read,
        setBalance: write,
        add: function (amt) {
            write(read() + amt);
            return read();
        },
        deduct: function (amt) {
            var b = read();
            if (b < amt) return false;
            write(b - amt);
            return true;
        },
        canAfford: function (amt) {
            return read() >= amt;
        },
        format: function (n) {
            return (Math.round(n * 100) / 100).toFixed(2);
        }
    };
})(typeof window !== 'undefined' ? window : this);
