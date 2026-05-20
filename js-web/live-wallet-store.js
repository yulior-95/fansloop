/**
 * 直播页 · 钱包余额原型（localStorage）
 */
(function (global) {
    var KEY = "fansloop_wallet_usdt";
    var DEFAULT = 12;

    function read() {
        try {
            var v = parseFloat(localStorage.getItem(KEY));
            return isNaN(v) ? DEFAULT : v;
        } catch (e) {
            return DEFAULT;
        }
    }

    function write(n) {
        try {
            localStorage.setItem(KEY, String(Math.max(0, Math.round(n * 100) / 100)));
        } catch (e) {}
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
})(typeof window !== "undefined" ? window : this);
