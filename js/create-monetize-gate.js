/**
 * H5 创建页 · 订阅专属勾选门禁（依赖 creator-subscription-store.js）
 */
(function (global) {
    function hasSubPrice() {
        return !!(global.CreatorSubscriptionStore && CreatorSubscriptionStore.hasConfiguredPrice());
    }

    function promptSetSubPrice(toastFn) {
        var msg = '请先前往设置页面设置会员订阅价格';
        if (typeof toastFn === 'function') toastFn(msg);
        else if (global.DigitalH5Nav && typeof DigitalH5Nav.toast === 'function') DigitalH5Nav.toast(msg);
        else alert(msg);
        setTimeout(function () {
            if (global.confirm('尚未设置会员订阅价格，是否前往「会员订阅设置」？')) {
                location.href = 'settings-subscription.html';
            }
        }, 280);
    }

    function syncSubCell(moneyGrid) {
        if (!moneyGrid) return;
        var cell = moneyGrid.querySelector('[data-mode="sub"]');
        if (!cell) return;
        var ok = hasSubPrice();
        cell.classList.toggle('is-locked', !ok);
        var sub = cell.querySelector('.sub');
        if (sub) {
            sub.textContent = ok ? '仅订阅者 · 价格在会员设置' : '未设置会员价 · 请先到设置页配置';
        }
        if (!ok && cell.classList.contains('on')) {
            cell.classList.remove('on');
            var free = moneyGrid.querySelector('[data-mode="free"]');
            var ppv = moneyGrid.querySelector('[data-mode="ppv"]');
            if (free && !(ppv && ppv.classList.contains('on'))) free.classList.add('on');
        }
    }

    /** @returns {boolean} false = 拦截，不可勾选成功 */
    function guardEnableSub(cell, toastFn) {
        if (!cell) return true;
        var turningOn = !cell.classList.contains('on');
        if (turningOn && !hasSubPrice()) {
            promptSetSubPrice(toastFn);
            return false;
        }
        return true;
    }

    global.CreateMonetizeGate = {
        hasSubPrice: hasSubPrice,
        promptSetSubPrice: promptSetSubPrice,
        syncSubCell: syncSubCell,
        guardEnableSub: guardEnableSub
    };
})(typeof window !== 'undefined' ? window : this);
