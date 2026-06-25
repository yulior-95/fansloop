/**
 * 订阅创作者弹层 · 余额校验 / 充值引导 / 支付密码 / 扣款成功
 */
(function () {
    var global = typeof window !== 'undefined' ? window : this;
    var pwdBuffer = '';
    var pendingRechargeAmt = 100;
    var selectedVoucherId = null;
    var appliedPromo = null;
    var state = { creator: '创作者', creatorUserId: null, price: 16, mode: 'subscribe' };
    var UPGRADE_DEMO = {
        creatorUserId: '440012',
        creatorNames: ['Luna 🌙', '花漾Hana'],
        currentPlan: 'monthly',
        remainDays: 21,
        creditAmount: 19.6
    };
    var PLAN_RANK = { monthly: 1, quarterly: 2, annual: 3 };
    var SUB_STEPS = ['subStep1', 'subStepRecharge', 'subStepPayPwdMissing', 'subStepPayPwd', 'subStep2'];

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

    function promoStore() {
        return window.CreatorPromoCodesStore || null;
    }

    function getAppliedPromo() {
        return appliedPromo;
    }

    function clearAppliedPromo() {
        appliedPromo = null;
        renderPromoCodeSection();
        updatePriceSummary();
        refreshBalanceBar();
    }

    function getWalletBalance() {
        var w = wallet();
        if (w) return w.getBalance();
        if (global.FLUserAssets && global.FLUserAssets.getLiveUsdt) {
            return global.FLUserAssets.getLiveUsdt();
        }
        return 0;
    }

    function canAffordPrice(price) {
        price = Number(price) || 0;
        if (price <= 0) return true;
        return getWalletBalance() >= price;
    }

    function formatUsdt(n) {
        n = Number(n) || 0;
        var w = wallet();
        if (w && w.format) return w.format(n);
        if (global.FLUserAssets && global.FLUserAssets.formatUsdt) {
            return global.FLUserAssets.formatUsdt(n);
        }
        return (Math.round(n * 100) / 100).toFixed(2);
    }

    function formatBalance(n) {
        var w = wallet();
        return w ? w.format(n) : formatUsdt(n);
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
        var promo = getAppliedPromo();
        if (promo) return promo.finalPrice;
        var store = vouchers();
        var voucher = getSelectedVoucher();
        if (!store || !voucher) return base;
        return store.calcDiscountedPrice(base, voucher);
    }

    function isUpgradeCreator() {
        if (state.creatorUserId && state.creatorUserId === UPGRADE_DEMO.creatorUserId) return true;
        return UPGRADE_DEMO.creatorNames.indexOf(state.creator) >= 0;
    }

    function getUpgradeCredit() {
        if (state.mode === 'renew') return null;
        if (!isUpgradeCreator()) return null;
        var planType = getSelectedPlanType();
        var curRank = PLAN_RANK[UPGRADE_DEMO.currentPlan] || 0;
        var nextRank = PLAN_RANK[planType] || 0;
        if (nextRank <= curRank) return null;
        return {
            remainDays: UPGRADE_DEMO.remainDays,
            creditAmount: UPGRADE_DEMO.creditAmount,
            currentPlanLabel: UPGRADE_DEMO.currentPlan === 'monthly' ? '月付' : UPGRADE_DEMO.currentPlan
        };
    }

    function getSelectedPrice() {
        var due = getFinalPrice();
        var credit = getUpgradeCredit();
        if (!credit) return due;
        return Math.max(0, Math.round((due - credit.creditAmount) * 100) / 100);
    }

    function ensurePromoCodeUI() {
        var step1 = document.getElementById('subStep1');
        var planList = step1 && step1.querySelector('.sub-plan-list');
        if (!planList || document.getElementById('subPromoCodeSection')) return;

        var section = document.createElement('div');
        section.className = 'sub-promo-code-section';
        section.id = 'subPromoCodeSection';
        section.innerHTML =
            '<div class="sub-promo-head">' +
                '<span><i class="fa-solid fa-ticket" style="color:#C084FC"></i> 创作者优惠码</span>' +
                '<span class="sub-promo-scope">首月 · 月付可用</span>' +
            '</div>' +
            '<div class="sub-promo-input-row" id="subPromoInputRow">' +
                '<input type="text" id="subPromoCodeInput" placeholder="输入优惠码，如 LUNA20" autocomplete="off" maxlength="20">' +
                '<button type="button" class="btn btn-secondary btn-sm" id="btnApplySubPromo">应用</button>' +
            '</div>' +
            '<div class="sub-applied-promo" id="subAppliedPromo" hidden></div>' +
            '<p class="sub-promo-hint" id="subPromoHint">与积分商城兑换券不可叠加，优先使用优惠码</p>';

        planList.insertAdjacentElement('afterend', section);
    }

    function renderPromoCodeSection() {
        ensurePromoCodeUI();
        var inputRow = document.getElementById('subPromoInputRow');
        var appliedEl = document.getElementById('subAppliedPromo');
        var input = document.getElementById('subPromoCodeInput');
        if (!inputRow || !appliedEl) return;

        if (appliedPromo && appliedPromo.promo) {
            inputRow.hidden = true;
            appliedEl.hidden = false;
            appliedEl.innerHTML =
                '<span class="sub-promo-badge"><i class="fa-solid fa-circle-check"></i> ' +
                    appliedPromo.promo.code + ' · ' + appliedPromo.discountLabel +
                    ' · 券后 ' + formatUsdt(appliedPromo.finalPrice) + ' USDT</span>' +
                '<button type="button" class="btn btn-ghost btn-sm" id="btnClearSubPromo">移除</button>';
        } else {
            inputRow.hidden = false;
            appliedEl.hidden = true;
            appliedEl.innerHTML = '';
            if (input && !input.value && appliedPromo === null) input.value = '';
        }
    }

    function applySubPromoCode() {
        var store = promoStore();
        var input = document.getElementById('subPromoCodeInput');
        if (!store || !input) return;

        var result = store.validate(input.value, {
            creatorUserId: state.creatorUserId,
            planType: getSelectedPlanType(),
            mode: state.mode,
            basePrice: getBasePrice()
        });

        if (!result.ok) {
            toast(result.error || '优惠码无效');
            return;
        }

        appliedPromo = result;
        selectedVoucherId = null;
        renderPromoCodeSection();
        renderSubCoupons();
        updatePriceSummary();
        refreshBalanceBar();
        toast('已应用优惠码 ' + result.promo.code);
    }

    function revalidateAppliedPromo() {
        if (!appliedPromo || !appliedPromo.promo) return;
        var store = promoStore();
        if (!store) {
            clearAppliedPromo();
            return;
        }
        var result = store.validate(appliedPromo.promo.code, {
            creatorUserId: state.creatorUserId,
            planType: getSelectedPlanType(),
            mode: state.mode,
            basePrice: getBasePrice()
        });
        if (!result.ok) {
            toast(result.error || '当前计划无法使用该优惠码');
            clearAppliedPromo();
            return;
        }
        appliedPromo = result;
        renderPromoCodeSection();
        updatePriceSummary();
        refreshBalanceBar();
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
        var payable = getSelectedPrice();
        var promo = getAppliedPromo();
        var voucher = getSelectedVoucher();
        var credit = getUpgradeCredit();
        if (credit) {
            summary.hidden = false;
            summary.innerHTML =
                '套餐原价 ' + formatUsdt(final) + ' USDT，升购抵扣剩余 ' + credit.remainDays +
                ' 天（−' + formatUsdt(credit.creditAmount) + ' USDT），<b>应付 ' + formatUsdt(payable) + ' USDT</b>';
            return;
        }
        if (promo && final < base) {
            summary.hidden = false;
            summary.innerHTML = '应付 <b>' + formatUsdt(final) + ' USDT</b>（原价 ' + formatUsdt(base) +
                ' USDT，优惠码 ' + promo.promo.code + ' 省 ' + formatUsdt(base - final) + ' USDT）';
        } else if (selectedVoucherId && final < base && voucher) {
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

    function ensureRechargeUpgradeRows() {
        var summary = document.querySelector('#subStepRecharge .sub-pay-summary');
        if (!summary || document.getElementById('subRechargeCreditRow')) return;

        var listRow = document.createElement('div');
        listRow.className = 'row';
        listRow.id = 'subRechargeListRow';
        listRow.style.display = 'none';
        listRow.innerHTML = '<span>套餐原价</span><span class="v" id="subRechargeListPrice">—</span>';

        var creditRow = document.createElement('div');
        creditRow.className = 'row is-discount';
        creditRow.id = 'subRechargeCreditRow';
        creditRow.style.display = 'none';
        creditRow.innerHTML =
            '<span id="subRechargeCreditLabel">升购抵扣</span><span class="v" id="subRechargeCreditVal">—</span>';

        var rows = summary.querySelectorAll('.row');
        var dueRow = rows[rows.length - 1];
        if (dueRow) {
            summary.insertBefore(creditRow, dueRow);
            summary.insertBefore(listRow, creditRow);
        } else {
            summary.appendChild(listRow);
            summary.appendChild(creditRow);
        }
    }

    function renderRechargeUpgradeSummary(price) {
        ensureRechargeUpgradeRows();
        var credit = getUpgradeCredit();
        var listRow = document.getElementById('subRechargeListRow');
        var creditRow = document.getElementById('subRechargeCreditRow');
        var listEl = document.getElementById('subRechargeListPrice');
        var creditLabel = document.getElementById('subRechargeCreditLabel');
        var creditVal = document.getElementById('subRechargeCreditVal');
        var dueEl = document.getElementById('subRechargePayDue');
        var listPrice = getFinalPrice();
        var payable = price != null ? price : getSelectedPrice();

        if (!credit) {
            if (listRow) listRow.style.display = 'none';
            if (creditRow) creditRow.style.display = 'none';
            if (dueEl) dueEl.textContent = formatBalance(listPrice) + ' USDT';
            return;
        }
        if (listRow) listRow.style.display = '';
        if (creditRow) creditRow.style.display = '';
        if (listEl) listEl.textContent = formatBalance(listPrice) + ' USDT';
        if (creditLabel) {
            creditLabel.textContent = '升购抵扣（剩余 ' + credit.remainDays + ' 天折算）';
        }
        if (creditVal) creditVal.textContent = '−' + formatBalance(credit.creditAmount) + ' USDT';
        if (dueEl) dueEl.textContent = formatBalance(payable) + ' USDT';
    }

    function ensurePayUpgradeRows() {
        var summary = document.querySelector('#subStepPayPwd .sub-pay-summary');
        if (!summary || document.getElementById('subPayUpgradeRow')) return;

        var listRow = document.createElement('div');
        listRow.className = 'row';
        listRow.id = 'subPayListRow';
        listRow.style.display = 'none';
        listRow.innerHTML = '<span>套餐原价</span><span class="v" id="subPayListVal">—</span>';

        var upgradeRow = document.createElement('div');
        upgradeRow.className = 'row is-discount';
        upgradeRow.id = 'subPayUpgradeRow';
        upgradeRow.style.display = 'none';
        upgradeRow.innerHTML =
            '<span id="subPayUpgradeLabel">升购抵扣</span><span class="v" id="subPayUpgradeVal">—</span>';

        var amtRow = summary.querySelectorAll('.row')[1];
        if (amtRow) {
            summary.insertBefore(upgradeRow, amtRow);
            summary.insertBefore(listRow, upgradeRow);
        }
    }

    function renderPayUpgradeSummary(price) {
        ensurePayUpgradeRows();
        var credit = getUpgradeCredit();
        var listRow = document.getElementById('subPayListRow');
        var upgradeRow = document.getElementById('subPayUpgradeRow');
        var listVal = document.getElementById('subPayListVal');
        var upgradeLabel = document.getElementById('subPayUpgradeLabel');
        var upgradeVal = document.getElementById('subPayUpgradeVal');
        var listPrice = getFinalPrice();

        if (!credit) {
            if (listRow) listRow.style.display = 'none';
            if (upgradeRow) upgradeRow.style.display = 'none';
            return;
        }
        if (listRow) listRow.style.display = '';
        if (upgradeRow) upgradeRow.style.display = '';
        if (listVal) listVal.textContent = formatBalance(listPrice) + ' USDT';
        if (upgradeLabel) {
            upgradeLabel.textContent = '升购抵扣（剩余 ' + credit.remainDays + ' 天折算）';
        }
        if (upgradeVal) upgradeVal.textContent = '−' + formatBalance(credit.creditAmount) + ' USDT';
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
        couponRow.innerHTML = '<span>优惠抵扣</span><span class="v" id="subPayCouponVal">—</span>';

        var amtRow = summary.querySelectorAll('.row')[1];
        if (amtRow) {
            summary.insertBefore(couponRow, amtRow.nextSibling);
            summary.insertBefore(origRow, couponRow);
        } else {
            summary.appendChild(origRow);
            summary.appendChild(couponRow);
        }
    }

    function ensurePayPwdMissingStep() {
        var panel = document.querySelector('#ovlSubscribe .iol-panel');
        if (!panel || document.getElementById('subStepPayPwdMissing')) return;

        var step = document.createElement('div');
        step.className = 'sub-modal-step';
        step.id = 'subStepPayPwdMissing';
        step.innerHTML =
            '<div class="sub-pwd-missing">' +
                '<div class="ic-wrap"><i class="fa-solid fa-lock-open"></i></div>' +
                '<h4>尚未设置支付密码</h4>' +
                '<p>订阅、按篇购买等资金操作需先设置 6 位支付密码（与登录密码不同）。设置完成后请返回继续支付。</p>' +
            '</div>' +
            '<div class="sub-step-actions">' +
                '<button type="button" class="btn btn-secondary" id="btnSubPwdMissingBack">返回</button>' +
                '<button type="button" class="btn btn-primary" id="btnSubGoSetPayPwd"><i class="fa-solid fa-shield-halved"></i> 前往设置</button>' +
            '</div>';

        var pwdStep = document.getElementById('subStepPayPwd');
        if (pwdStep) panel.insertBefore(step, pwdStep);
        else panel.appendChild(step);
    }

    function openPayPwdMissingStep() {
        ensurePayPwdMissingStep();
        showSubStep('subStepPayPwdMissing');
    }

    function isPrototypeQuickRechargeAllowed() {
        return global.FLUserAssets && global.FLUserAssets.DEMO_UID &&
            global.FansloopAuth && global.FansloopAuth.getUserId() === global.FLUserAssets.DEMO_UID;
    }

    function goSubRechargePage() {
        var returnPath = (location.pathname.split('/').pop() || 'home.html') + location.search;
        try {
            localStorage.setItem('fl_subscribe_return', returnPath);
            localStorage.setItem('fl_home_toast', '充值完成后请返回继续订阅');
            var price = getSelectedPrice();
            if (price > 0) localStorage.setItem('fl_recharge_suggest', String(Math.ceil(price)));
        } catch (e) { /* ignore */ }
        var q = 'return=' + encodeURIComponent(returnPath);
        var need = getSelectedPrice();
        if (need > 0) q += '&need=' + encodeURIComponent(String(Math.ceil(need)));
        window.location.href = 'recharge.html?' + q;
    }

    function proceedToPayStep(price) {
        if (!canAffordPrice(price)) {
            toast('余额不足，请先充值');
            openRechargeStep(price);
            return;
        }
        if (!hasPayPassword()) {
            openPayPwdMissingStep();
            return;
        }
        openPayPwdStep(price);
    }

    function goSetPayPassword() {
        var returnPath = (location.pathname.split('/').pop() || 'home.html') + location.search;
        try {
            localStorage.setItem('fl_pay_pwd_return', returnPath);
        } catch (e) { /* ignore */ }
        var url = payPwdSettingsUrl(returnPath);
        window.location.href = url;
    }

    function showSubStep(stepId) {
        SUB_STEPS.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.classList.toggle('active', id === stepId);
        });
    }

    function refreshBalanceBar() {
        var bar = document.getElementById('subBalanceBar');
        var val = document.getElementById('subBalanceVal');
        if (!val) return;
        var bal = getWalletBalance();
        val.textContent = formatBalance(bal) + ' USDT';
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
        var promoCodes = promoStore();
        state.creatorUserId = promoCodes && promoCodes.resolveCreatorUserId
            ? promoCodes.resolveCreatorUserId(state.creator, btn)
            : null;
        if (btn && btn.getAttribute('data-creator-uid')) {
            state.creatorUserId = btn.getAttribute('data-creator-uid');
        }
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
        if (!isRenew && isUpgradeCreator()) {
            if (hintEl) {
                hintEl.textContent = '当前为月付生效中；升级季付/年付可抵扣剩余天数';
            }
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
        appliedPromo = null;
        resetPwdInput();
        ensurePromoCodeUI();
        ensureCouponUI();
        renderPromoCodeSection();
        renderSubCoupons();
        refreshBalanceBar();
        showSubStep('subStep1');
        ovl.classList.add('show');
    }

    function closeSubscribeModal() {
        var ovl = document.getElementById('ovlSubscribe');
        if (ovl) ovl.classList.remove('show');
        selectedVoucherId = null;
        appliedPromo = null;
        resetPwdInput();
        showSubStep('subStep1');
        try {
            global.dispatchEvent(new CustomEvent('fl-subscribe-closed'));
        } catch (e) { /* ignore */ }
    }

    function openRechargeStep(price) {
        var bal = getWalletBalance();
        var gap = Math.max(0, price - bal);
        var balEl = document.getElementById('subRechargeBalNow');
        if (balEl) balEl.textContent = formatBalance(bal) + ' USDT';
        var needEl = document.getElementById('subRechargeNeed');
        renderRechargeUpgradeSummary(price);
        if (needEl) needEl.textContent = formatBalance(gap);
        pendingRechargeAmt = gap <= 50 ? 50 : gap <= 100 ? 100 : 200;
        document.querySelectorAll('.sub-recharge-amt').forEach(function (b) {
            var amt = parseInt(b.getAttribute('data-amt'), 10);
            b.classList.toggle('active', amt === pendingRechargeAmt);
        });
        var quickAllowed = isPrototypeQuickRechargeAllowed();
        document.querySelectorAll('.sub-recharge-amt').forEach(function (b) {
            b.style.display = quickAllowed ? '' : 'none';
        });
        var btnConfirm = document.getElementById('btnSubRechargeConfirm');
        if (btnConfirm) {
            btnConfirm.innerHTML = quickAllowed
                ? '<i class="fa-solid fa-bolt"></i> 确认充值'
                : '<i class="fa-solid fa-arrow-up-right-from-square"></i> 前往充值页';
        }
        var demoNote = document.getElementById('subRechargeDemoNote');
        if (demoNote) {
            demoNote.innerHTML = quickAllowed
                ? '<i class="fa-solid fa-shield-halved"></i> 原型演示：确认充值即入账，无需真实链上支付。'
                : '<i class="fa-solid fa-shield-halved"></i> 请前往充值页完成入账，到账后返回继续订阅。';
        }
        var goRechargeBtn = document.getElementById('btnSubGoRecharge');
        if (goRechargeBtn) goRechargeBtn.style.display = quickAllowed ? '' : 'none';
        showSubStep('subStepRecharge');
    }

    function openPayPwdStep(price) {
        var w = wallet();
        var base = getBasePrice();
        var voucher = getSelectedVoucher();
        var promo = getAppliedPromo();
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
        renderPayUpgradeSummary(price);
        if ((promo || voucher) && price < base) {
            if (origRow) origRow.style.display = '';
            if (couponRow) couponRow.style.display = '';
            if (origVal) origVal.textContent = (w ? w.format(base) : formatUsdt(base)) + ' USDT';
            if (couponVal) {
                var discountText = '−' + (w ? w.format(base - price) : formatUsdt(base - price)) + ' USDT';
                if (promo) couponVal.textContent = discountText + '（' + promo.promo.code + ' · ' + promo.discountLabel + '）';
                else if (voucher) couponVal.textContent = discountText + '（' + voucher.name + '）';
            }
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
        if (!canAffordPrice(price)) {
            toast('余额不足，请先充值');
            openRechargeStep(price);
            return;
        }
        proceedToPayStep(price);
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
        if (!hasPayPassword()) {
            openPayPwdMissingStep();
            return;
        }
        var pwdStore = payPwdStore();
        if (!pwdStore || !pwdStore.verify(pwdBuffer)) {
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
        var promo = getAppliedPromo();
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
        if (promo && window.CreatorPromoCodesStore) {
            window.CreatorPromoCodesStore.incrementUsage(promo.promo.id);
            appliedPromo = null;
        }
        refreshBalanceBar();
        var subResultText = document.getElementById('subResultText');
        var payLine = formatUsdt(price) + ' USDT';
        if (promo && price < base) {
            payLine += '（已用优惠码 ' + promo.promo.code + '，省 ' + formatUsdt(base - price) + ' USDT）';
        } else if (voucher && price < base) {
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
        if (!isPrototypeQuickRechargeAllowed()) {
            goSubRechargePage();
            return;
        }
        var w = wallet();
        if (!w) {
            onConfirmSubscribe();
            return;
        }
        var newBal;
        if (global.FLUserAssets && global.FLUserAssets.creditRecharge) {
            newBal = global.FLUserAssets.creditRecharge(pendingRechargeAmt);
        } else {
            newBal = w.add(pendingRechargeAmt);
        }
        refreshBalanceBar();
        toast('充值成功 +' + pendingRechargeAmt + ' USDT，当前余额 ' + w.format(newBal) + ' USDT');
        var price = getSelectedPrice();
        if (w.canAfford(price)) {
            proceedToPayStep(price);
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
                revalidateAppliedPromo();
                renderSubCoupons();
                refreshBalanceBar();
                var rechargeStep = document.getElementById('subStepRecharge');
                if (rechargeStep && rechargeStep.classList.contains('active')) {
                    openRechargeStep(getSelectedPrice());
                }
            });
        });

        document.addEventListener('change', function (e) {
            if (!e.target || e.target.name !== 'subCouponPick') return;
            var ovl = document.getElementById('ovlSubscribe');
            if (!ovl || !ovl.classList.contains('show')) return;
            selectedVoucherId = e.target.value || null;
            if (selectedVoucherId) clearAppliedPromo();
            renderSubCoupons();
        });

        document.addEventListener('click', function (e) {
            var ovl = document.getElementById('ovlSubscribe');
            if (!ovl || !ovl.classList.contains('show')) return;
            if (e.target.closest('#btnApplySubPromo')) {
                e.preventDefault();
                applySubPromoCode();
            }
            if (e.target.closest('#btnClearSubPromo')) {
                e.preventDefault();
                clearAppliedPromo();
                toast('已移除优惠码');
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter') return;
            var input = document.getElementById('subPromoCodeInput');
            var ovl = document.getElementById('ovlSubscribe');
            if (!input || !ovl || !ovl.classList.contains('show')) return;
            if (document.activeElement !== input) return;
            e.preventDefault();
            applySubPromoCode();
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
            btnGoRecharge.addEventListener('click', goSubRechargePage);
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
                if (e.target.closest('#btnSubPwdMissingBack')) {
                    showSubStep('subStep1');
                }
                if (e.target.closest('#btnSubGoSetPayPwd')) {
                    goSetPayPassword();
                }
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
        ensurePromoCodeUI();
        ensureCouponUI();
        ensurePayPwdMissingStep();
        bindSubscribeUI();
    }
    window.FL_bindSubscribeUI = bindSubscribeUI;
})();
