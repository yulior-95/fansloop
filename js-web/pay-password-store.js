/**
 * 支付 / 提现密码 · 按用户隔离（存于 FLUserAssets）
 */
(function (global) {
    global.FLPayPasswordStore = {
        hasPassword: function () {
            return global.FLUserAssets ? global.FLUserAssets.hasPayPassword() : false;
        },
        verify: function (pwd) {
            if (!global.FLUserAssets || !global.FLUserAssets.hasPayPassword()) return false;
            return global.FLUserAssets.verifyPayPassword(pwd);
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
