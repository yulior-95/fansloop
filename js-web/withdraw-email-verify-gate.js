/**
 * 提现前 · 主邮箱验证码校验（仅当设置开启「提现邮件确认」时由提现页调用）
 */
(function (global) {
    var DEMO_CODE = '123456';
    var pendingNext = null;
    var countdownTimer = null;
    var countdownLeft = 0;

    function $(id) {
        return document.getElementById(id);
    }

    function maskEmail(email) {
        if (!email || email.indexOf('@') < 0) return '你的主邮箱';
        var parts = email.split('@');
        var local = parts[0];
        var domain = parts[1];
        var head = local.length <= 2 ? local.charAt(0) : local.slice(0, 2);
        return head + '***@' + domain;
    }

    function userEmail() {
        if (global.GoodfansAuth && global.GoodfansAuth.getEmail) {
            return global.GoodfansAuth.getEmail() || '';
        }
        return '';
    }

    function openModal() {
        var modal = $('wdEmailVerifyModal');
        if (!modal) return;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        var modal = $('wdEmailVerifyModal');
        if (!modal) return;
        modal.classList.remove('open');
        var any = document.querySelector('#kycNeedModal.open, #kycWizardModal.open, #wdEmailVerifyModal.open');
        if (!any) document.body.style.overflow = '';
        pendingNext = null;
        var err = $('wdEmailVerifyErr');
        if (err) err.classList.remove('show');
        var inp = $('wdEmailVerifyCode');
        if (inp) inp.value = '';
    }

    function showErr(msg) {
        var el = $('wdEmailVerifyErr');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
    }

    function resetSendBtn() {
        var btn = $('btnWdEmailSendCode');
        if (!btn) return;
        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }
        countdownLeft = 0;
        btn.disabled = false;
        btn.textContent = '发送验证码';
    }

    function tickSendBtn() {
        var btn = $('btnWdEmailSendCode');
        if (!btn) return;
        countdownLeft -= 1;
        if (countdownLeft <= 0) {
            resetSendBtn();
            return;
        }
        btn.textContent = countdownLeft + 's 后重发';
    }

    function sendCode() {
        var btn = $('btnWdEmailSendCode');
        if (!btn || countdownLeft > 0) return;
        var email = userEmail();
        if (!email) {
            showErr('未获取到主邮箱，请先在账户安全中绑定');
            return;
        }
        var hint = $('wdEmailVerifyHint');
        if (hint) {
            hint.innerHTML = '验证码已发送至 <b style="color:#fff">' + maskEmail(email) + '</b>（原型演示码 <b style="color:#FBBF24">' + DEMO_CODE + '</b>）';
        }
        $('wdEmailVerifyErr') && $('wdEmailVerifyErr').classList.remove('show');
        countdownLeft = 60;
        btn.disabled = true;
        btn.textContent = countdownLeft + 's 后重发';
        countdownTimer = setInterval(tickSendBtn, 1000);
    }

    function verifyAndContinue() {
        var code = ($('wdEmailVerifyCode') || {}).value.trim();
        if (!code) {
            showErr('请输入邮箱验证码');
            return;
        }
        if (code !== DEMO_CODE) {
            showErr('验证码不正确（原型演示请使用 ' + DEMO_CODE + '）');
            return;
        }
        var next = pendingNext;
        closeModal();
        if (typeof next === 'function') next();
    }

    function open(opts) {
        opts = opts || {};
        pendingNext = opts.onVerified || null;
        var lead = $('wdEmailVerifyLead');
        if (lead) {
            lead.innerHTML = '你已在设置中开启「提现邮件确认」。继续提现前，请验证主邮箱 <b style="color:#fff">' + maskEmail(userEmail()) + '</b>。';
        }
        var hint = $('wdEmailVerifyHint');
        if (hint) hint.textContent = '点击「发送验证码」后查收邮件并填写 6 位验证码。';
        var inp = $('wdEmailVerifyCode');
        if (inp) inp.value = '';
        $('wdEmailVerifyErr') && $('wdEmailVerifyErr').classList.remove('show');
        resetSendBtn();
        openModal();
        setTimeout(function () {
            if (inp) inp.focus();
        }, 80);
    }

    function bind() {
        $('wdEmailVerifyDismiss') && $('wdEmailVerifyDismiss').addEventListener('click', closeModal);
        $('wdEmailVerifyClose') && $('wdEmailVerifyClose').addEventListener('click', closeModal);
        $('btnWdEmailSendCode') && $('btnWdEmailSendCode').addEventListener('click', sendCode);
        $('btnWdEmailVerifyOk') && $('btnWdEmailVerifyOk').addEventListener('click', verifyAndContinue);
        var modal = $('wdEmailVerifyModal');
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeModal();
            });
        }
        var inp = $('wdEmailVerifyCode');
        if (inp) {
            inp.addEventListener('input', function () {
                $('wdEmailVerifyErr') && $('wdEmailVerifyErr').classList.remove('show');
            });
        }
    }

    global.FLWithdrawEmailVerify = { open: open, close: closeModal };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})(typeof window !== 'undefined' ? window : this);
