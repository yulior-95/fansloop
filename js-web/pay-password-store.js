/**
 * 支付 / 提现密码 · 按用户隔离（存于 FLUserAssets）
 */
(function (global) {
    /** Web 原型演示 · 与 H5 / 弹窗文案一致 */
    var DEMO_PAY_PASSWORD = '123456';

    global.FLPayPasswordStore = {
        hasPassword: function () {
            if (global.FLUserAssets && global.FLUserAssets.hasPayPassword()) return true;
            return true;
        },
        verify: function (pwd) {
            var p = String(pwd == null ? '' : pwd);
            if (p === DEMO_PAY_PASSWORD) return true;
            if (!global.FLUserAssets || !global.FLUserAssets.hasPayPassword()) return false;
            return global.FLUserAssets.verifyPayPassword(p);
        },
        setPassword: function (pwd) {
            if (global.FLUserAssets) global.FLUserAssets.setPayPassword(pwd);
        },
        clearPassword: function () {
            if (global.FLUserAssets) global.FLUserAssets.clearPayPassword();
        },
        getSettingsUrl: function (returnPath) {
            var url = 'settings-pay-password.html';
            if (returnPath) {
                url += '?return=' + encodeURIComponent(returnPath);
            }
            return url;
        }
    };
})(typeof window !== 'undefined' ? window : this);
