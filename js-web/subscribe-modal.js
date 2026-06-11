/**
 * 订阅创作者弹层 · 余额校验 / 充值引导 / 支付密码 / 扣款成功
 */
(function () {
    var PAY_PWD_DEMO = '123456';
    var pwdBuffer = '';
    var pendingRechargeAmt = 100;
    var selectedVoucherId = null;
    var state = { creator: '创作者', price: 16, mode: 'subscribe' };

    function toast(msg) {
        if (typeof window.toast === 'function') {
            window.toast(msg);
            return;
        }
        var host = document.getElementById('toastHostF') || document.getElementById('subToastHost') || document.getElementById('pfToast');
        if (!host) return;
        var t = document.createElement('div');
        t.className = host.id === 'subToastHost' ? 'sub-toast' : host.id === 'pfToast' ? '' : 'toast-f';
        t.textContent = msg;
        host.appendChild(t);
        setTimeout(function () { t.remove(); }, 2600);
    }

    function wallet() {
        return window.LiveWalletStore || null;
    }

    function vouchers() {
        return window.MallVouchersStore || null;
    }

    function formatUsdt(n) {
        var num = Math.round(Number(n) * 100) / 100;
        return num % 1 === 0 ? String(num) : num.toFixed(2);
    }

    function getActivePlanEl() {
        return document.querySelector('.sub-plan.active');
    }

    function getBasePrice() {
        var active = getActivePlanEl();
        return parseFloat((active && active.getAttribute('data-price')) || state.price || 16);
    }

    function getSelectedPlanType() {
        var store = vouchers();
        return store ? store.getPlanType(getActivePlanEl()) : 'monthly';
    }

    function getSelectedVoucher() {
        if (!selectedVoucherId) return null;
        var store = vouchers();
        return store ? store.getById(selectedVoucherId) : null;
    }

    function getEligibleVouchers() {
        var store = vouchers();
        if (!store) return [];
        return store.getEligibleForSubscription(getSelectedPlanType(), getBasePrice());
    }

    function getFinalPrice() {
        var base = getBasePrice();
        var store = vouchers();
        var voucher = getSelectedVoucher();
        if (!store || !voucher) return base;
        return store.calcDiscountedPrice(base, voucher);
    }

    function getSelectedPrice() {
        return getFinalPrice();
    }

    function ensureCouponUI() {
        var step1 = document.getElementById('subStep1');
        var planList = step1 && step1.querySelector('.sub-plan-list');
        if (!planList || document.getElementById('subCouponSection')) return;

        var section = document.createElement('div');
        section.className = 'sub-coupon-section';
        section.id = 'subCouponSection';
        section.hidden = true;
        section.innerHTML =
            '<div class="sub-coupon-head">' +
                '<span><i class="fa-solid fa-ticket" style="color:#C084FC"></i> 可用兑换券</span>' +
                '<a href="points-mall.html">去商城兑换</a>' +
            '</div>' +
            '<div class="sub-coupon-list" id="subCouponList" role="radiogroup" aria-label="选择订阅兑换券"></div>';

        var summary = document.createElement('div');
        summary.className = 'sub-price-summary';
        summary.id = 'subPriceSummary';
        summary.hidden = true;

        var hint = planList.nextElementSibling;
        if (hint && hint.tagName === 'P') {
            planList.parentNode.insertBefore(section, hint);
            planList.parentNode.insertBefore(summary, hint);
        } else {
            planList.insertAdjacentElement('afterend', section);
            section.insertAdjacentElement('afterend', summary);
        }
    }

    function updatePriceSummary() {
        var summary = document.getElementById('subPriceSummary');
        if (!summary) return;
        var base = getBasePrice();
        var final = getFinalPrice();
        if (selectedVoucherId && final < base) {
            summary.hidden = false;
            summary.innerHTML = '应付 <b>' + formatUsdt(final) + ' USDT</b>（原价 ' + formatUsdt(base) +
                ' USDT，券抵扣 ' + formatUsdt(base - final) + ' USDT）';
        } else {
            summary.hidden = true;
            summary.innerHTML = '';
        }
    }

    function renderSubCoupons() {
        ensureCouponUI();
        var section = document.getElementById('subCouponSection');
        var list = document.getElementById('subCouponList');
        if (!section || !list) return;

        var store = vouchers();
        var eligible = getEligibleVouchers();

        if (!store || !eligible.length) {
            section.hidden = true;
            selectedVoucherId = null;
            updatePriceSummary();
            refreshBalanceBar();
            return;
        }

        if (selectedVoucherId && !eligible.some(function (v) { return v.id === selectedVoucherId; })) {
            selectedVoucherId = null;
        }

        section.hidden = false;
        var base = getBasePrice();
        var html = '';

        html += '<label class="sub-coupon-opt' + (!selectedVoucherId ? ' is-selected' : '') + '" data-voucher="">' +
            '<input type="radio" name="subCouponPick" value=""' + (!selectedVoucherId ? ' checked' : '') + '>' +
            '<span class="sub-coupon-body"><span class="n">不使用兑换券</span><span class="d">按原价 ' + formatUsdt(base) + ' USDT 支付</span></span>' +
            '</label>';

        eligible.forEach(function (v) {
            var sel = selectedVoucherId === v.id;
            var final = store.calcDiscountedPrice(base, v);
            var save = base - final;
            html += '<label class="sub-coupon-opt' + (sel ? ' is-selected' : '') + '" data-voucher="' + v.id + '">' +
                '<input type="radio" name="subCouponPick" value="' + v.id + '"' + (sel ? ' checked' : '') + '>' +
                '<span class="sub-coupon-body">' +
                    '<span class="n">' + v.name + '</span>' +
                    '<span class="d">券后 ' + formatUsdt(final) + ' USDT · 省 ' + formatUsdt(save) + ' · ' + store.formatExpiry(v) + '</span>' +
                '</span>' +
                '<span class="sub-coupon-tag">' + store.formatDiscountTag(v) + '</span>' +
                '</label>';
        });

        list.innerHTML = html;
        updatePriceSummary();
        refreshBalanceBar();
    }

    function ensurePayCouponRows() {
        var summary = document.querySelector('#subStepPayPwd .sub-pay-summary');
        if (!summary || document.getElementById('subPayOrigRow')) return;

        var origRow = document.createElement('div');
        origRow.className = 'row';
        origRow.id = 'subPayOrigRow';
        origRow.style.display = 'none';
        origRow.innerHTML = '<span>订阅原价</span><span class="v" id="subPayOrigVal">—</span>';

        var couponRow = document.createElement('div');
        couponRow.className = 'row is-discount';
        couponRow.id = 'subPayCouponRow';
        couponRow.style.display = 'none';
        couponRow.innerHTML = '<span>兑换券抵扣</span><span class="v" id="subPayCouponVal">—</span>';

        var amtRow = summary.querySelectorAll('.row')[1];
        if (amtRow) {
            summary.insertBefore(couponRow, amtRow.nextSibling);
            summary.insertBefore(origRow, couponRow);
        } else {
            summary.appendChild(origRow);
            summary.appendChild(couponRow);
        }
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

        var isRenew = btn && btn.getAttribute('data-sub-mode') === 'renew';
        state.mode = isRenew ? 'renew' : 'subscribe';
        state.creator = (btn && btn.getAttribute('data-creator')) || '创作者';
        state.price = parseFloat((btn && btn.getAttribute('data-plan')) || '16');
        subCreatorName.textContent = state.creator;
        var titleEl = document.getElementById('subModalTitle');
        var hintEl = document.getElementById('subCreatorHint');
        var confirmBtn = document.getElementById('btnConfirmSubscribe');
        if (titleEl) titleEl.textContent = isRenew ? '续费订阅' : '订阅创作者';
        if (hintEl) {
            hintEl.textContent = isRenew
                ? '选择月 / 季 / 年计划完成续费'
                : '订阅后可解锁专属内容与直播回放';
        }
        if (confirmBtn) {
            confirmBtn.innerHTML = isRenew
                ? '<i class="fa-solid fa-bolt"></i> 确认支付并续费'
                : '<i class="fa-solid fa-bolt"></i> 确认订阅并支付';
        }
        var avEl = document.getElementById('subCreatorAv');
        var avUrl = btn && btn.getAttribute('data-av');
        if (avEl && avUrl) avEl.style.backgroundImage = "url('" + avUrl + "')";
        document.querySelectorAll('.sub-plan').forEach(function (p) {
            p.classList.remove('active');
        });
        var match = document.querySelector('.sub-plan[data-price="' + state.price + '"]');
        if (match) {
            match.classList.add('active');
        } else {
            var first = document.querySelector('.sub-plan');
            if (first) {
                first.classList.add('active');
                first.setAttribute('data-price', String(state.price));
                var priceEl = first.querySelector('.price');
                if (priceEl) priceEl.textContent = state.price + ' USDT';
            }
        }
        selectedVoucherId = null;
        resetPwdInput();
        ensureCouponUI();
        renderSubCoupons();
        refreshBalanceBar();
        showSubStep('subStep1');
        ovl.classList.add('show');
    }

    function closeSubscribeModal() {
        var ovl = document.getElementById('ovlSubscribe');
        if (ovl) ovl.classList.remove('show');
        selectedVoucherId = null;
        resetPwdInput();
        showSubStep('subStep1');
        try {
            global.dispatchEvent(new CustomEvent('fl-subscribe-closed'));
        } catch (e) { /* ignore */ }
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
        var base = getBasePrice();
        var voucher = getSelectedVoucher();
        var creatorEl = document.getElementById('subPayCreator');
        var amtEl = document.getElementById('subPayAmount');
        var afterEl = document.getElementById('subPayAfterBal');
        ensurePayCouponRows();
        var origRow = document.getElementById('subPayOrigRow');
        var couponRow = document.getElementById('subPayCouponRow');
        var origVal = document.getElementById('subPayOrigVal');
        var couponVal = document.getElementById('subPayCouponVal');
        if (creatorEl) creatorEl.textContent = state.creator;
        if (amtEl) amtEl.textContent = (w ? w.format(price) : formatUsdt(price)) + ' USDT';
        if (afterEl && w) afterEl.textContent = w.format(w.getBalance() - price) + ' USDT';
        if (voucher && price < base) {
            if (origRow) origRow.style.display = '';
            if (couponRow) couponRow.style.display = '';
            if (origVal) origVal.textContent = (w ? w.format(base) : formatUsdt(base)) + ' USDT';
            if (couponVal) couponVal.textContent = '−' + (w ? w.format(base - price) : formatUsdt(base - price)) + ' USDT（' + voucher.name + '）';
        } else {
            if (origRow) origRow.style.display = 'none';
            if (couponRow) couponRow.style.display = 'none';
        }
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
        var price = getFinalPrice();
        var base = getBasePrice();
        var voucher = getSelectedVoucher();
        var w = wallet();
        if (w && !w.deduct(price)) {
            toast('余额不足，请先充值');
            openRechargeStep(price);
            return;
        }
        if (voucher && window.MallVouchersStore) {
            window.MallVouchersStore.markUsed(voucher.id);
            selectedVoucherId = null;
        }
        refreshBalanceBar();
        var subResultText = document.getElementById('subResultText');
        var payLine = formatUsdt(price) + ' USDT';
        if (voucher && price < base) {
            payLine += '（已用 ' + voucher.name + '，省 ' + formatUsdt(base - price) + ' USDT）';
        }
        if (subResultText) {
            subResultText.textContent = state.mode === 'renew'
                ? '你已成功为「' + state.creator + '」续费，扣款 ' + payLine + '，订阅已延长。'
                : '你已成功订阅「' + state.creator + '」，扣款 ' + payLine + '。';
        }
        showSubStep('subStep2');
        toast(state.mode === 'renew' ? '支付成功，续费已生效' : '支付成功，订阅已生效');
        try {
            global.dispatchEvent(new CustomEvent('fl-subscribe-paid', { detail: { creator: state.creator } }));
        } catch (e) { /* ignore */ }
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
        if (document.body.getAttribute('data-sub-ui-bound') === '1') return;
        if (!document.getElementById('ovlSubscribe')) return;
        document.body.setAttribute('data-sub-ui-bound', '1');

        document.querySelectorAll('.sub-plan').forEach(function (plan) {
            plan.addEventListener('click', function () {
                document.querySelectorAll('.sub-plan').forEach(function (p) {
                    p.classList.remove('active');
                });
                plan.classList.add('active');
                renderSubCoupons();
            });
        });

        document.addEventListener('change', function (e) {
            if (!e.target || e.target.name !== 'subCouponPick') return;
            var ovl = document.getElementById('ovlSubscribe');
            if (!ovl || !ovl.classList.contains('show')) return;
            selectedVoucherId = e.target.value || null;
            renderSubCoupons();
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
                    localStorage.setItem('fl_home_toast', '充值完成后请返回继续续费/订阅');
                } catch (e) {}
                window.location.href = 'recharge.html?return=' + encodeURIComponent('subscriptions.html');
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

    function openSubscribeForCreator(opts) {
        opts = opts || {};
        var btn = document.createElement('button');
        btn.setAttribute('data-creator', opts.creator || '创作者');
        btn.setAttribute('data-plan', String(opts.price != null ? opts.price : 28));
        if (opts.av) btn.setAttribute('data-av', opts.av);
        if (opts.mode) btn.setAttribute('data-sub-mode', opts.mode);
        openSubscribeModal(btn);
    }

    window.FL_openSubscribeModal = openSubscribeModal;
    window.FL_openSubscribeForCreator = openSubscribeForCreator;
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

    if (document.getElementById('ovlSubscribe')) {
        ensureCouponUI();
        bindSubscribeUI();
    }
    window.FL_bindSubscribeUI = bindSubscribeUI;
})();
