/**
 * 提现邮件确认开关 · 按用户隔离
 */
(function (global) {
    var KEY = 'fl_withdraw_email_confirm_v1';

    function uid() {
        return global.FansloopAuth && global.FansloopAuth.getUserId
            ? global.FansloopAuth.getUserId()
            : 'guest';
    }

    function storageKey() {
        return KEY + '_' + uid();
    }

    global.FLWithdrawEmailConfirm = {
        isEnabled: function () {
            try {
                var raw = localStorage.getItem(storageKey());
                if (raw === null) return true;
                return raw === '1';
            } catch (e) {
                return true;
            }
        },
        setEnabled: function (on) {
            try {
                localStorage.setItem(storageKey(), on ? '1' : '0');
            } catch (e) { /* ignore */ }
            try {
                global.dispatchEvent(new CustomEvent('fl-withdraw-email-confirm-change'));
            } catch (e2) { /* ignore */ }
        }
    };
})(typeof window !== 'undefined' ? window : this);
