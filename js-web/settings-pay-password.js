/**
 * 设置 · 支付密码（首次设置 / 修改）
 */
(function () {
    var mode = 'setup';
    var step = 'set';
    var buffers = { verify: '', set: '', confirm: '' };
    var firstPwd = '';

    function toast(msg) {
        var host = document.getElementById('payPwdToast');
        if (!host) return;
        host.textContent = msg;
        host.classList.add('show');
        setTimeout(function () { host.classList.remove('show'); }, 2600);
    }

    function store() {
        return window.FLPayPasswordStore || null;
    }

    function getReturnUrl() {
        var params = new URLSearchParams(location.search);
        var ret = params.get('return');
        if (ret && ret.indexOf('://') < 0 && !ret.startsWith('//')) {
            return ret.charAt(0) === '/' ? ret.slice(1) : ret;
        }
        try {
            ret = localStorage.getItem('fl_pay_pwd_return');
            if (ret && ret.indexOf('://') < 0) {
                return ret.charAt(0) === '/' ? ret.slice(1) : ret;
            }
        } catch (e) { /* ignore */ }
        return 'settings-security.html';
    }

    function clearReturnFlag() {
        try { localStorage.removeItem('fl_pay_pwd_return'); } catch (e) { /* ignore */ }
    }

    function activeBufferKey() {
        if (step === 'verify') return 'verify';
        if (step === 'set') return 'set';
        if (step === 'confirm') return 'confirm';
        return '';
    }

    function resetBuffers() {
        buffers = { verify: '', set: '', confirm: '' };
        firstPwd = '';
    }

    function renderDots() {
        var key = activeBufferKey();
        var len = key ? buffers[key].length : 0;
        var wrap = document.getElementById('payPwdDots');
        if (!wrap) return;
        wrap.querySelectorAll('.dot').forEach(function (dot, i) {
            dot.classList.remove('filled', 'err');
            if (i < len) dot.classList.add('filled');
            dot.textContent = i < len ? '●' : '';
        });
    }

    function shakeDots() {
        var wrap = document.getElementById('payPwdDots');
        if (!wrap) return;
        wrap.querySelectorAll('.dot').forEach(function (dot) { dot.classList.add('err'); });
        setTimeout(renderDots, 480);
    }

    function updateStepDots() {
        var order = mode === 'change' ? ['verify', 'set', 'confirm'] : ['set', 'confirm'];
        var idx = order.indexOf(step);
        document.querySelectorAll('.pay-pwd-step-dot').forEach(function (dot, i) {
            dot.classList.remove('active', 'done');
            if (step === 'done') dot.classList.add('done');
            else if (i < idx) dot.classList.add('done');
            else if (i === idx) dot.classList.add('active');
        });
    }

    function setPane(stepId) {
        step = stepId;
        document.querySelectorAll('.pay-pwd-pane').forEach(function (pane) {
            pane.classList.toggle('active', pane.getAttribute('data-step') === stepId);
        });
        var numpad = document.getElementById('payPwdPadWrap');
        if (numpad) numpad.hidden = stepId === 'done';
        updateStepDots();
        renderDots();
    }

    function renderMode() {
        var has = store() && store().hasPassword();
        mode = has ? 'change' : 'setup';
        var title = document.getElementById('payPwdPageTitle');
        var lead = document.getElementById('payPwdPageLead');
        var dotsWrap = document.querySelector('.pay-pwd-steps');
        if (title) title.textContent = has ? '修改支付密码' : '设置支付密码';
        if (lead) lead.textContent = has
            ? '支付密码用于订阅、单篇付费、打赏与提现等资金操作。'
            : '首次使用前须设置 6 位数字支付密码，与登录密码相互独立。';
        if (dotsWrap) {
            dotsWrap.innerHTML = mode === 'change'
                ? '<span class="pay-pwd-step-dot"></span><span class="pay-pwd-step-dot"></span><span class="pay-pwd-step-dot"></span>'
                : '<span class="pay-pwd-step-dot"></span><span class="pay-pwd-step-dot"></span>';
        }
        var banner = document.getElementById('payPwdReturnBanner');
        if (banner) {
            var ret = getReturnUrl();
            if (ret && ret !== 'settings-security.html') {
                banner.hidden = false;
                banner.querySelector('[data-return-label]').textContent = '设置完成后可返回「' + ret + '」继续支付。';
            } else {
                banner.hidden = true;
            }
        }
        setPane(has ? 'verify' : 'set');
    }

    function onDigit(d) {
        var key = activeBufferKey();
        if (!key || buffers[key].length >= 6) return;
        buffers[key] += String(d);
        renderDots();
        if (buffers[key].length === 6) {
            setTimeout(submitStep, 120);
        }
    }

    function submitStep() {
        var st = store();
        if (!st) {
            toast('请先登录后再设置支付密码');
            return;
        }
        if (step === 'verify') {
            if (!st.verify(buffers.verify)) {
                toast('当前支付密码错误');
                buffers.verify = '';
                shakeDots();
                return;
            }
            buffers.set = '';
            setPane('set');
            return;
        }
        if (step === 'set') {
            if (!/^\d{6}$/.test(buffers.set)) {
                toast('请输入 6 位数字');
                buffers.set = '';
                renderDots();
                return;
            }
            if (buffers.set === '123456') {
                toast('请勿使用过于简单的密码');
                buffers.set = '';
                shakeDots();
                return;
            }
            firstPwd = buffers.set;
            buffers.confirm = '';
            setPane('confirm');
            return;
        }
        if (step === 'confirm') {
            if (buffers.confirm !== firstPwd) {
                toast('两次输入不一致，请重新确认');
                buffers.confirm = '';
                shakeDots();
                return;
            }
            st.setPassword(firstPwd);
            clearReturnFlag();
            var doneText = document.getElementById('payPwdDoneText');
            if (doneText) {
                doneText.textContent = mode === 'change'
                    ? '支付密码已更新，下次资金操作将使用新密码。'
                    : '支付密码设置成功，现在可以完成订阅与付费解锁。';
            }
            setPane('done');
        }
    }

    function bindPad() {
        var pad = document.getElementById('payPwdPad');
        if (!pad) return;
        pad.addEventListener('click', function (e) {
            var digitBtn = e.target.closest('[data-digit]');
            if (digitBtn) {
                onDigit(digitBtn.getAttribute('data-digit'));
                return;
            }
            var action = e.target.closest('[data-action]');
            if (!action) return;
            var act = action.getAttribute('data-action');
            if (act === 'clear') {
                var key = activeBufferKey();
                if (key) buffers[key] = '';
                renderDots();
            } else if (act === 'submit') {
                var key2 = activeBufferKey();
                if (!key2 || buffers[key2].length < 6) {
                    toast('请输入 6 位支付密码');
                    return;
                }
                submitStep();
            }
        });
    }

    function bindActions() {
        document.getElementById('btnPayPwdBack')?.addEventListener('click', function () {
            if (step === 'confirm') {
                buffers.confirm = '';
                buffers.set = '';
                firstPwd = '';
                setPane('set');
                return;
            }
            if (step === 'set' && mode === 'change') {
                buffers.set = '';
                buffers.verify = '';
                setPane('verify');
                return;
            }
            history.length > 1 ? history.back() : (location.href = 'settings-security.html');
        });

        document.getElementById('btnPayPwdDone')?.addEventListener('click', function () {
            location.href = getReturnUrl();
        });

        document.getElementById('btnPayPwdLater')?.addEventListener('click', function () {
            location.href = 'settings-security.html';
        });
    }

    function syncPaneCopy() {
        var map = {
            verify: { title: '验证当前密码', sub: '请输入当前 6 位支付密码以继续' },
            set: { title: mode === 'change' ? '设置新密码' : '设置支付密码', sub: '请输入 6 位数字，勿与登录密码相同' },
            confirm: { title: '确认支付密码', sub: '请再次输入以确认' }
        };
        Object.keys(map).forEach(function (key) {
            var pane = document.querySelector('.pay-pwd-pane[data-step="' + key + '"]');
            if (!pane) return;
            var h = pane.querySelector('[data-pane-title]');
            var p = pane.querySelector('[data-pane-sub]');
            if (h) h.textContent = map[key].title;
            if (p) p.textContent = map[key].sub;
        });
    }

    function init() {
        resetBuffers();
        bindPad();
        bindActions();
        renderMode();
        syncPaneCopy();
        document.addEventListener('fansloop-auth-change', renderMode);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
