/**
 * 单篇付费（PPV）解锁弹层 · 余额 / 兑换券单选 / 支付密码
 */
(function () {
    var pwdBuffer = '';
    var selectedVoucherId = null;
    var state = { creator: '创作者', title: '付费内容', price: 5, postId: '' };
    var PPV_STEPS = ['ppvStep1', 'ppvStepPayPwdMissing', 'ppvStepPayPwd', 'ppvStep2'];

    function payPwdStore() {
        return window.FLPayPasswordStore || null;
    }

    function hasPayPassword() {
        var store = payPwdStore();
        return store ? store.hasPassword() : false;
    }

    function payPwdSettingsUrl(returnPath) {
        var store = payPwdStore();
        if (store && store.getSettingsUrl) {
            return store.getSettingsUrl(returnPath || '');
        }
        var url = 'settings-pay-password.html';
        if (returnPath) url += '?return=' + encodeURIComponent(returnPath);
        return url;
    }

    function goSetPayPassword() {
        var returnPath = (location.pathname.split('/').pop() || 'home.html') + location.search;
        try {
            localStorage.setItem('fl_pay_pwd_return', returnPath);
        } catch (e) { /* ignore */ }
        window.location.href = payPwdSettingsUrl(returnPath);
    }

    function toast(msg) {
        if (typeof window.toast === 'function') {
            window.toast(msg);
            return;
        }
        var host = document.getElementById('toastHostF') || document.getElementById('ppvToastHost');
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

    function vouchers() {
        return window.MallVouchersStore || null;
    }

    function formatUsdt(n) {
        var num = Math.round(Number(n) * 100) / 100;
        return num % 1 === 0 ? String(num) : num.toFixed(2);
    }

    function getSelectedVoucher() {
        if (!selectedVoucherId) return null;
        var store = vouchers();
        return store ? store.getById(selectedVoucherId) : null;
    }

    function getFinalPrice() {
        var store = vouchers();
        var voucher = getSelectedVoucher();
        if (!store) return state.price;
        return store.calcPpvPrice(state.price, voucher);
    }

    function getEligibleVouchers() {
        var store = vouchers();
        return store ? store.getEligibleForPpv(state.price) : [];
    }

    function showPpvStep(stepId) {
        PPV_STEPS.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.toggle('active', id === stepId);
        });
    }

    function proceedToPayStep(price) {
        var w = wallet();
        if (w && !w.canAfford(price)) {
            toast('余额不足，请先充值');
            goRechargePage(price);
            return;
        }
        if (!hasPayPassword()) {
            showPpvStep('ppvStepPayPwdMissing');
            return;
        }
        openPayPwdStep(price);
    }

    function goRechargePage(needAmt) {
        var returnPath = (location.pathname.split('/').pop() || 'home.html') + location.search;
        try {
            localStorage.setItem('fl_recharge_return', returnPath);
            if (needAmt > 0) localStorage.setItem('fl_recharge_suggest', String(Math.ceil(needAmt)));
        } catch (e) { /* ignore */ }
        var q = 'return=' + encodeURIComponent(returnPath);
        if (needAmt > 0) q += '&need=' + encodeURIComponent(String(Math.ceil(needAmt)));
        window.location.href = 'recharge.html?' + q;
    }

    function ensurePpvOverlay() {
        if (document.getElementById('ovlPpvUnlock')) return;
        var wrap = document.createElement('div');
        wrap.innerHTML =
            '<div class="inline-overlay" id="ovlPpvUnlock" aria-hidden="true">' +
            '<div class="iol-panel">' +
            '<div class="iol-head">' +
            '<h3><i class="fa-solid fa-tag" style="color:#FBBF24"></i> <span id="ppvModalTitle">购买本篇内容</span></h3>' +
            '<button type="button" class="iol-close" id="closePpvUnlock" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="sub-modal-step active" id="ppvStep1">' +
            '<div class="sub-creator">' +
            '<div class="av av-sm" id="ppvCreatorAv"></div>' +
            '<div><div style="font-size:13px;font-weight:700" id="ppvCreatorName">—</div>' +
            '<div style="font-size:11px;color:var(--t-tertiary)" id="ppvPostTitle">—</div></div></div>' +
            '<div class="sub-balance-bar" id="ppvBalanceBar"><span><i class="fa-solid fa-wallet"></i> 钱包可用余额</span><b id="ppvBalanceVal">— USDT</b></div>' +
            '<div class="ppv-price-card" id="ppvPriceCard"><span class="ppv-price-label">本篇价格</span><span class="ppv-price-amt" id="ppvBasePrice">— USDT</span></div>' +
            '<div class="sub-coupon-section" id="ppvCouponSection" hidden>' +
            '<div class="sub-coupon-head"><span><i class="fa-solid fa-ticket" style="color:#FBBF24"></i> 可用兑换券</span>' +
            '<a href="points-mall.html">去商城兑换</a></div>' +
            '<div class="sub-coupon-list" id="ppvCouponList" role="radiogroup" aria-label="选择兑换券"></div></div>' +
            '<div class="sub-price-summary" id="ppvPriceSummary" hidden></div>' +
            '<p style="font-size:11px;color:var(--t-tertiary);margin:0 0 12px;line-height:1.45">购买后可反复观看本篇；订阅创作者可查看全部会员内容。</p>' +
            '<button type="button" class="btn btn-primary btn-block" id="btnConfirmPpvUnlock"><i class="fa-solid fa-bolt"></i> 确认购买</button>' +
            '<button type="button" class="btn btn-secondary btn-block btn-sm mt-8 btn-open-subscribe" id="ppvOrSubscribe" style="margin-top:8px"><i class="fa-solid fa-crown"></i> 或订阅查看全部</button>' +
            '</div>' +
            '<div class="sub-modal-step" id="ppvStepPayPwdMissing">' +
            '<div class="sub-pwd-missing">' +
            '<div class="ic-wrap"><i class="fa-solid fa-lock-open"></i></div>' +
            '<h4>尚未设置支付密码</h4>' +
            '<p>按篇购买需先设置 6 位支付密码（与登录密码不同）。设置完成后请返回继续支付。</p>' +
            '</div>' +
            '<div class="sub-step-actions">' +
            '<button type="button" class="btn btn-secondary" id="btnPpvPwdMissingBack">返回</button>' +
            '<button type="button" class="btn btn-primary" id="btnPpvGoSetPayPwd"><i class="fa-solid fa-shield-halved"></i> 前往设置</button>' +
            '</div></div>' +
            '<div class="sub-modal-step" id="ppvStepPayPwd">' +
            '<div class="sub-pay-summary">' +
            '<div class="row"><span>购买内容</span><span class="v" id="ppvPayTitle">—</span></div>' +
            '<div class="row" id="ppvPayOrigRow" style="display:none"><span>本篇原价</span><span class="v" id="ppvPayOrigVal">—</span></div>' +
            '<div class="row"><span>支付金额</span><span class="v" id="ppvPayAmount">— USDT</span></div>' +
            '<div class="row is-discount" id="ppvPayCouponRow" style="display:none"><span>兑换券抵扣</span><span class="v" id="ppvPayCouponVal">—</span></div>' +
            '<div class="row"><span>扣款后余额</span><span class="v" id="ppvPayAfterBal">— USDT</span></div></div>' +
            '<div class="sub-pwd-stage"><div class="ic-wrap"><i class="fa-solid fa-lock"></i></div>' +
            '<h4 style="font-size:15px;font-weight:800;margin-bottom:4px">请输入支付密码</h4>' +
            '<p style="font-size:11px;color:var(--t-tertiary)">6 位资金密码 · 与登录密码不同</p></div>' +
            '<div class="sub-pwd-input" id="ppvPwdDots"><span class="dot"></span><span class="dot"></span><span class="dot"></span>' +
            '<span class="dot"></span><span class="dot"></span><span class="dot"></span></div>' +
            '<div class="sub-pwd-pad" id="ppvPwdPad">' +
            '<button type="button" data-digit="1">1</button><button type="button" data-digit="2">2</button><button type="button" data-digit="3">3</button>' +
            '<button type="button" data-digit="4">4</button><button type="button" data-digit="5">5</button><button type="button" data-digit="6">6</button>' +
            '<button type="button" data-digit="7">7</button><button type="button" data-digit="8">8</button><button type="button" data-digit="9">9</button>' +
            '<button type="button" data-action="clear"><i class="fa-solid fa-delete-left"></i></button>' +
            '<button type="button" data-digit="0">0</button>' +
            '<button type="button" data-action="submit"><i class="fa-solid fa-check"></i></button></div>' +
            '<div class="sub-step-actions"><button type="button" class="btn btn-secondary" id="btnPpvPwdBack">上一步</button></div></div>' +
            '<div class="sub-modal-step" id="ppvStep2">' +
            '<div class="sub-result"><i class="fa-solid fa-circle-check"></i><h4>购买成功</h4><p id="ppvResultText">本篇内容已购买，可以观看了。</p></div>' +
            '<button type="button" class="btn btn-primary btn-block mt-16" id="btnDonePpvUnlock">完成</button></div>' +
            '</div></div>';
        while (wrap.firstChild) {
            document.body.appendChild(wrap.firstChild);
        }
    }

    function refreshBalanceBar() {
        var w = wallet();
        var val = document.getElementById('ppvBalanceVal');
        var bar = document.getElementById('ppvBalanceBar');
        if (!w || !val) return;
        var bal = w.getBalance();
        val.textContent = w.format(bal) + ' USDT';
        if (bar) bar.classList.toggle('is-low', bal < getFinalPrice());
    }

    function updatePriceSummary() {
        var summary = document.getElementById('ppvPriceSummary');
        if (!summary) return;
        var base = state.price;
        var final = getFinalPrice();
        var voucher = getSelectedVoucher();
        if (voucher && final < base) {
            summary.hidden = false;
            if (final === 0) {
                summary.innerHTML = '使用 <b>' + voucher.name + '</b> · 本次 <b>免费领取</b>（原价 ' + formatUsdt(base) + ' USDT）';
            } else {
                summary.innerHTML = '应付 <b>' + formatUsdt(final) + ' USDT</b>（原价 ' + formatUsdt(base) +
                    ' USDT，' + voucher.name + ' 抵扣 ' + formatUsdt(base - final) + ' USDT）';
            }
        } else {
            summary.hidden = true;
            summary.innerHTML = '';
        }
    }

    function renderPpvCoupons() {
        var section = document.getElementById('ppvCouponSection');
        var list = document.getElementById('ppvCouponList');
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
        var base = state.price;
        var html = '';
        html += '<label class="sub-coupon-opt' + (!selectedVoucherId ? ' is-selected' : '') + '" data-voucher="">' +
            '<input type="radio" name="ppvCouponPick" value=""' + (!selectedVoucherId ? ' checked' : '') + '>' +
            '<span class="sub-coupon-body"><span class="n">不使用兑换券</span><span class="d">按本篇价格 ' + formatUsdt(base) + ' USDT 支付</span></span></label>';
        eligible.forEach(function (v) {
            var sel = selectedVoucherId === v.id;
            var final = store.calcPpvPrice(base, v);
            html += '<label class="sub-coupon-opt' + (sel ? ' is-selected' : '') + '" data-voucher="' + v.id + '">' +
                '<input type="radio" name="ppvCouponPick" value="' + v.id + '"' + (sel ? ' checked' : '') + '>' +
                '<span class="sub-coupon-body"><span class="n">' + v.name + '</span><span class="d">' +
                (final === 0 ? '本次免费领取' : '券后 ' + formatUsdt(final) + ' USDT') +
                ' · ' + store.formatPpvExpiry(v) + '</span></span>' +
                '<span class="sub-coupon-tag ppv-tag">' + store.formatPpvVoucherTag(v) + '</span></label>';
        });
        list.innerHTML = html;
        updatePriceSummary();
        refreshBalanceBar();
    }

    function resetPwdInput() {
        pwdBuffer = '';
        renderPwdDots(false);
    }

    function renderPwdDots(isError) {
        var wrap = document.getElementById('ppvPwdDots');
        if (!wrap) return;
        wrap.querySelectorAll('.dot').forEach(function (dot, i) {
            dot.classList.remove('filled', 'err');
            if (isError) dot.classList.add('err');
            else if (i < pwdBuffer.length) dot.classList.add('filled');
            dot.textContent = i < pwdBuffer.length ? '●' : '';
        });
    }

    function openPpvUnlockModal(btn) {
        ensurePpvOverlay();
        var ovl = document.getElementById('ovlPpvUnlock');
        if (!ovl) return;
        state.creator = (btn && btn.getAttribute('data-creator')) || '创作者';
        state.title = (btn && btn.getAttribute('data-title')) || '付费内容';
        state.price = parseFloat((btn && btn.getAttribute('data-ppv-price')) || '5');
        state.postId = (btn && btn.getAttribute('data-post-id')) || '';
        selectedVoucherId = null;

        var nameEl = document.getElementById('ppvCreatorName');
        var titleEl = document.getElementById('ppvPostTitle');
        var avEl = document.getElementById('ppvCreatorAv');
        var baseEl = document.getElementById('ppvBasePrice');
        var orSub = document.getElementById('ppvOrSubscribe');
        if (nameEl) nameEl.textContent = state.creator;
        if (titleEl) titleEl.textContent = state.title;
        if (baseEl) baseEl.textContent = formatUsdt(state.price) + ' USDT';
        var avUrl = btn && btn.getAttribute('data-av');
        if (avEl && avUrl) avEl.style.backgroundImage = "url('" + avUrl + "')";
        if (orSub) {
            orSub.setAttribute('data-creator', state.creator);
            orSub.setAttribute('data-plan', '16');
            if (avUrl) orSub.setAttribute('data-av', avUrl);
        }

        resetPwdInput();
        renderPpvCoupons();
        refreshBalanceBar();
        showPpvStep('ppvStep1');
        ovl.classList.add('show');
        ovl.setAttribute('aria-hidden', 'false');
    }

    function closePpvUnlockModal() {
        var ovl = document.getElementById('ovlPpvUnlock');
        if (ovl) {
            ovl.classList.remove('show');
            ovl.setAttribute('aria-hidden', 'true');
        }
        selectedVoucherId = null;
        resetPwdInput();
        showPpvStep('ppvStep1');
    }

    function openPayPwdStep(price) {
        var w = wallet();
        var voucher = getSelectedVoucher();
        var base = state.price;
        var titlePay = document.getElementById('ppvPayTitle');
        var amtEl = document.getElementById('ppvPayAmount');
        var afterEl = document.getElementById('ppvPayAfterBal');
        var origRow = document.getElementById('ppvPayOrigRow');
        var couponRow = document.getElementById('ppvPayCouponRow');
        var origVal = document.getElementById('ppvPayOrigVal');
        var couponVal = document.getElementById('ppvPayCouponVal');
        if (titlePay) titlePay.textContent = state.title;
        if (amtEl) amtEl.textContent = (w ? w.format(price) : formatUsdt(price)) + ' USDT';
        if (afterEl && w) afterEl.textContent = w.format(w.getBalance() - price) + ' USDT';
        if (voucher && price < base) {
            if (origRow) origRow.style.display = '';
            if (couponRow) couponRow.style.display = '';
            if (origVal) origVal.textContent = (w ? w.format(base) : formatUsdt(base)) + ' USDT';
            if (couponVal) {
                couponVal.textContent = price === 0
                    ? '全额抵扣（' + voucher.name + '）'
                    : '−' + (w ? w.format(base - price) : formatUsdt(base - price)) + ' USDT（' + voucher.name + '）';
            }
        } else {
            if (origRow) origRow.style.display = 'none';
            if (couponRow) couponRow.style.display = 'none';
        }
        resetPwdInput();
        showPpvStep('ppvStepPayPwd');
    }

    function completeUnlock(price) {
        var voucher = getSelectedVoucher();
        var w = wallet();
        if (price > 0 && w && !w.deduct(price)) {
            toast('余额不足，请先充值');
            return;
        }
        if (voucher && window.MallVouchersStore) {
            window.MallVouchersStore.markUsed(voucher.id);
            selectedVoucherId = null;
        }
        refreshBalanceBar();
        var result = document.getElementById('ppvResultText');
        var payLine = price === 0
            ? '已使用兑换券免费领取'
            : '扣款 ' + formatUsdt(price) + ' USDT';
        if (voucher && price < state.price) {
            payLine += '（' + voucher.name + '）';
        }
        if (result) {
            result.textContent = '「' + state.title + '」已购买，' + payLine + '，可反复观看本篇内容。';
        }
        showPpvStep('ppvStep2');
        toast('购买成功');
        try {
            global.dispatchEvent(new CustomEvent('fl-ppv-unlocked', { detail: { postId: state.postId, creator: state.creator } }));
        } catch (e) { /* ignore */ }
    }

    function onConfirmUnlock() {
        var price = getFinalPrice();
        if (price === 0) {
            completeUnlock(0);
            return;
        }
        var w = wallet();
        if (w && !w.canAfford(price)) {
            toast('余额不足，请先充值');
            var gap = Math.max(0, price - w.getBalance());
            goRechargePage(gap > 0 ? gap : price);
            return;
        }
        proceedToPayStep(price);
    }

    function verifyPayPassword() {
        if (!hasPayPassword()) {
            showPpvStep('ppvStepPayPwdMissing');
            return;
        }
        var pwdStore = payPwdStore();
        if (!pwdStore || !pwdStore.verify(pwdBuffer)) {
            renderPwdDots(true);
            toast('支付密码错误，请重试');
            setTimeout(resetPwdInput, 500);
            return;
        }
        completeUnlock(getFinalPrice());
    }

    function bindPpvUI() {
        if (document.body.getAttribute('data-ppv-ui-bound') === '1') return;
        ensurePpvOverlay();
        if (!document.getElementById('ovlPpvUnlock')) return;
        document.body.setAttribute('data-ppv-ui-bound', '1');

        document.getElementById('btnConfirmPpvUnlock')?.addEventListener('click', onConfirmUnlock);
        document.getElementById('closePpvUnlock')?.addEventListener('click', closePpvUnlockModal);
        document.getElementById('btnDonePpvUnlock')?.addEventListener('click', closePpvUnlockModal);
        document.getElementById('btnPpvPwdBack')?.addEventListener('click', function () {
            resetPwdInput();
            showPpvStep('ppvStep1');
        });

        document.getElementById('ovlPpvUnlock')?.addEventListener('click', function (e) {
            if (e.target.id === 'ovlPpvUnlock') closePpvUnlockModal();
            if (e.target.closest('#ppvOrSubscribe')) closePpvUnlockModal();
            if (e.target.closest('#btnPpvPwdMissingBack')) showPpvStep('ppvStep1');
            if (e.target.closest('#btnPpvGoSetPayPwd')) goSetPayPassword();
        });

        document.getElementById('ppvPwdPad')?.addEventListener('click', function (e) {
            var digitBtn = e.target.closest('[data-digit]');
            if (digitBtn) {
                if (pwdBuffer.length >= 6) return;
                pwdBuffer += String(digitBtn.getAttribute('data-digit'));
                renderPwdDots(false);
                if (pwdBuffer.length === 6) setTimeout(verifyPayPassword, 120);
                return;
            }
            var action = e.target.closest('[data-action]');
            if (!action) return;
            if (action.getAttribute('data-action') === 'clear') resetPwdInput();
            else if (action.getAttribute('data-action') === 'submit') {
                if (pwdBuffer.length < 6) toast('请输入 6 位支付密码');
                else verifyPayPassword();
            }
        });

        document.addEventListener('change', function (e) {
            if (!e.target || e.target.name !== 'ppvCouponPick') return;
            var ovl = document.getElementById('ovlPpvUnlock');
            if (!ovl || !ovl.classList.contains('show')) return;
            selectedVoucherId = e.target.value || null;
            renderPpvCoupons();
        });
    }

    if (!document.body.getAttribute('data-ppv-delegate')) {
        document.body.setAttribute('data-ppv-delegate', '1');
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('.btn-open-ppv-unlock');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            openPpvUnlockModal(btn);
        });
    }

    bindPpvUI();
    window.FL_openPpvUnlockModal = openPpvUnlockModal;
    window.FL_closePpvUnlockModal = closePpvUnlockModal;
    window.FL_bindPpvUI = bindPpvUI;
})();
