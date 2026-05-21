/**
 * 订阅创作者弹层 · 余额校验 / 充值引导 / 支付密码 / 扣款成功
 */
(function () {
    var PAY_PWD_DEMO = '123456';
    var pwdBuffer = '';
    var pendingRechargeAmt = 100;
    var state = { creator: '创作者', price: 16 };

    function toast(msg) {
        if (typeof window.toast === 'function') {
            window.toast(msg);
            return;
        }
        var host = document.getElementById('toastHostF');
        if (!host) return;
        var t = document.createElement('div');
        t.className = 'toast-f';
        t.textContent = msg;
        host.appendChild(t);
        setTimeout(function () { t.remove(); }, 2600);
    }

    function wallet() {
        return window.LiveWalletStore || null;
    }

    function getSelectedPrice() {
        var active = document.querySelector('.sub-plan.active');
        return parseFloat((active && active.getAttribute('data-price')) || state.price || 16);
    }

    function showSubStep(stepId) {
        ['subStep1', 'subStepRecharge', 'subStepPayPwd', 'subStep2'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.toggle('active', id === stepId);
        });
    }

    function refreshBalanceBar() {
        var w = wallet();
        var bar = document.getElementById('subBalanceBar');
        var val = document.getElementById('subBalanceVal');
        if (!w || !val) return;
        var bal = w.getBalance();
        val.textContent = w.format(bal) + ' USDT';
        if (bar) bar.classList.toggle('is-low', bal < getSelectedPrice());
    }

    function resetPwdInput() {
        pwdBuffer = '';
        renderPwdDots(false);
    }

    function renderPwdDots(isError) {
        var wrap = document.getElementById('subPwdDots');
        if (!wrap) return;
        var dots = wrap.querySelectorAll('.dot');
        dots.forEach(function (dot, i) {
            dot.classList.remove('filled', 'err');
            if (isError) dot.classList.add('err');
            else if (i < pwdBuffer.length) dot.classList.add('filled');
            dot.textContent = i < pwdBuffer.length ? '●' : '';
        });
    }

    function openSubscribeModal(btn) {
        var ovl = document.getElementById('ovlSubscribe');
        var subCreatorName = document.getElementById('subCreatorName');
        if (!ovl || !subCreatorName) return;

        state.creator = (btn && btn.getAttribute('data-creator')) || '创作者';
        state.price = parseFloat((btn && btn.getAttribute('data-plan')) || '16');
        subCreatorName.textContent = state.creator;
        document.querySelectorAll('.sub-plan').forEach(function (p) {
            p.classList.remove('active');
        });
        var match = document.querySelector('.sub-plan[data-price="' + state.price + '"]');
        if (match) match.classList.add('active');
        resetPwdInput();
        refreshBalanceBar();
        showSubStep('subStep1');
        ovl.classList.add('show');
    }

    function closeSubscribeModal() {
        var ovl = document.getElementById('ovlSubscribe');
        if (ovl) ovl.classList.remove('show');
        resetPwdInput();
        showSubStep('subStep1');
    }

    function openRechargeStep(price) {
        var w = wallet();
        var gap = price;
        if (w) {
            gap = Math.max(0, price - w.getBalance());
            var bal = w.getBalance();
            var balEl = document.getElementById('subRechargeBalNow');
            if (balEl) balEl.textContent = w.format(bal) + ' USDT';
        }
        var needEl = document.getElementById('subRechargeNeed');
        var dueEl = document.getElementById('subRechargePayDue');
        if (needEl) needEl.textContent = w ? w.format(gap) : String(price);
        if (dueEl) dueEl.textContent = w ? w.format(price) + ' USDT' : price + ' USDT';
        pendingRechargeAmt = gap <= 50 ? 50 : gap <= 100 ? 100 : 200;
        document.querySelectorAll('.sub-recharge-amt').forEach(function (b) {
            var amt = parseInt(b.getAttribute('data-amt'), 10);
            b.classList.toggle('active', amt === pendingRechargeAmt);
        });
        showSubStep('subStepRecharge');
    }

    function openPayPwdStep(price) {
        var w = wallet();
        var creatorEl = document.getElementById('subPayCreator');
        var amtEl = document.getElementById('subPayAmount');
        var afterEl = document.getElementById('subPayAfterBal');
        if (creatorEl) creatorEl.textContent = state.creator;
        if (amtEl) amtEl.textContent = (w ? w.format(price) : price) + ' USDT';
        if (afterEl && w) afterEl.textContent = w.format(w.getBalance() - price) + ' USDT';
        resetPwdInput();
        showSubStep('subStepPayPwd');
    }

    function onConfirmSubscribe() {
        var price = getSelectedPrice();
        state.price = price;
        var w = wallet();
        if (w && !w.canAfford(price)) {
            toast('余额不足，请先充值');
            openRechargeStep(price);
            return;
        }
        openPayPwdStep(price);
    }

    function onPwdDigit(d) {
        if (pwdBuffer.length >= 6) return;
        pwdBuffer += String(d);
        renderPwdDots(false);
        if (pwdBuffer.length === 6) {
            setTimeout(verifyPayPassword, 120);
        }
    }

    function verifyPayPassword() {
        if (pwdBuffer !== PAY_PWD_DEMO) {
            renderPwdDots(true);
            toast('支付密码错误，请重试');
            setTimeout(function () {
                resetPwdInput();
            }, 500);
            return;
        }
        var price = getSelectedPrice();
        var w = wallet();
        if (w && !w.deduct(price)) {
            toast('余额不足，请先充值');
            openRechargeStep(price);
            return;
        }
        refreshBalanceBar();
        var subResultText = document.getElementById('subResultText');
        if (subResultText) {
            subResultText.textContent = '你已成功订阅「' + state.creator + '」，扣款 ' + price + ' USDT。';
        }
        showSubStep('subStep2');
        toast('支付成功，订阅已生效');
    }

    function onRechargeConfirm() {
        var w = wallet();
        if (!w) {
            onConfirmSubscribe();
            return;
        }
        var newBal = w.add(pendingRechargeAmt);
        refreshBalanceBar();
        toast('充值成功 +' + pendingRechargeAmt + ' USDT，当前余额 ' + w.format(newBal) + ' USDT');
        var price = getSelectedPrice();
        if (w.canAfford(price)) {
            openPayPwdStep(price);
        } else {
            openRechargeStep(price);
        }
    }

    function bindSubscribeUI() {
        document.querySelectorAll('.sub-plan').forEach(function (plan) {
            plan.addEventListener('click', function () {
                document.querySelectorAll('.sub-plan').forEach(function (p) {
                    p.classList.remove('active');
                });
                plan.classList.add('active');
                refreshBalanceBar();
            });
        });

        var btnConfirm = document.getElementById('btnConfirmSubscribe');
        if (btnConfirm) btnConfirm.addEventListener('click', onConfirmSubscribe);

        var btnPwdBack = document.getElementById('btnSubPwdBack');
        if (btnPwdBack) {
            btnPwdBack.addEventListener('click', function () {
                resetPwdInput();
                showSubStep('subStep1');
            });
        }

        var pad = document.getElementById('subPwdPad');
        if (pad) {
            pad.addEventListener('click', function (e) {
                var digitBtn = e.target.closest('[data-digit]');
                if (digitBtn) {
                    onPwdDigit(digitBtn.getAttribute('data-digit'));
                    return;
                }
                var action = e.target.closest('[data-action]');
                if (!action) return;
                var act = action.getAttribute('data-action');
                if (act === 'clear') {
                    resetPwdInput();
                } else if (act === 'submit') {
                    if (pwdBuffer.length < 6) {
                        toast('请输入 6 位支付密码');
                        return;
                    }
                    verifyPayPassword();
                }
            });
        }

        document.querySelectorAll('.sub-recharge-amt').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.sub-recharge-amt').forEach(function (b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                pendingRechargeAmt = parseInt(btn.getAttribute('data-amt'), 10) || 100;
            });
        });

        var btnRechargeConfirm = document.getElementById('btnSubRechargeConfirm');
        if (btnRechargeConfirm) btnRechargeConfirm.addEventListener('click', onRechargeConfirm);

        var btnRechargeBack = document.getElementById('btnSubRechargeBack');
        if (btnRechargeBack) {
            btnRechargeBack.addEventListener('click', function () {
                showSubStep('subStep1');
            });
        }

        var btnGoRecharge = document.getElementById('btnSubGoRecharge');
        if (btnGoRecharge) {
            btnGoRecharge.addEventListener('click', function () {
                try {
                    localStorage.setItem('fl_home_toast', '充值完成后请返回首页继续订阅');
                } catch (e) {}
                window.location.href = 'recharge.html';
            });
        }

        var btnDone = document.getElementById('btnDoneSubscribe');
        if (btnDone) {
            btnDone.addEventListener('click', function () {
                closeSubscribeModal();
                toast('订阅已生效');
            });
        }

        var closeBtn = document.getElementById('closeSubscribe');
        if (closeBtn) closeBtn.addEventListener('click', closeSubscribeModal);

        var ovl = document.getElementById('ovlSubscribe');
        if (ovl) {
            ovl.addEventListener('click', function (e) {
                if (e.target === ovl) closeSubscribeModal();
            });
        }
    }

    window.FL_openSubscribeModal = openSubscribeModal;
    window.FL_closeSubscribeModal = closeSubscribeModal;

    if (!document.body.getAttribute('data-subscribe-delegate')) {
        document.body.setAttribute('data-subscribe-delegate', '1');
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('.btn-open-subscribe');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            openSubscribeModal(btn);
        });
    }

    bindSubscribeUI();
})();
