/**
 * H5 订阅创作者底部弹层（对齐首页信息流 / Web 订阅弹层步骤）
 */
(function (global) {
    var WALLET_KEY = 'gf_h5_wallet_usdt_v1';
    var SUB_KEY = 'gf_creator_sub_v1';

    var TIER_META = {
        monthly: {
            price: 29.9,
            title: '月度订阅 · 全部解锁',
            unit: 'USDT / 月',
            fiat: '≈ ¥218',
            note: '30 天无限观看 · 自动续费可随时取消',
            benefits: [
                '解锁全部 62 条月度专属内容',
                '创作者私信专属通道',
                '免广告 · 原画质观看',
                '订阅记录链上可查'
            ],
            cta: '使用 USDT 订阅',
            status: ''
        },
        quarterly: {
            price: 79.9,
            title: '季付升级 · 约省 11%',
            unit: 'USDT / 季',
            fiat: '折合约 26.6 U/月',
            note: '权益与月付相同 · 一次付 3 个月',
            benefits: [
                '含月付全部订阅专属权益',
                '一次付 3 个月，约省 11%',
                '订阅专属内容与直播回放',
                '适合稳定追更的粉丝'
            ],
            cta: '升级季付会员',
            status: '当前：月付会员'
        },
        annual: {
            price: 287,
            title: '年付挚友 · 约省 20%',
            unit: 'USDT / 年',
            fiat: '折合约 23.9 U/月',
            note: '长期支持创作者 · 最高档位权益',
            benefits: [
                '含月付 / 季付全部权益',
                '一次付 12 个月，约省 20%',
                '挚友徽章与优先回复',
                '含全部订阅专属权益'
            ],
            cta: '升级挚友年付',
            status: '当前：季付会员'
        },
        max: {
            price: 0,
            title: '挚友年付 · 已解锁最高档',
            unit: '',
            fiat: '',
            note: '你已享有全部订阅权益，感谢长期支持',
            benefits: [
                '全部订阅专属内容与回放',
                '挚友徽章与优先回复',
                '直播弹幕专属标识',
                '续费将在到期前提醒'
            ],
            cta: '已为最高档位',
            status: '当前：年付挚友'
        }
    };

    function priceToTier(price) {
        var p = Number(price) || 0;
        if (p >= 200) return 'annual';
        if (p >= 70) return 'quarterly';
        return 'monthly';
    }

    function normalizeSubEntry(entry) {
        if (!entry) return null;
        if (entry === true) return 'monthly';
        if (typeof entry === 'string') return entry;
        return entry.tier || 'monthly';
    }

    function getSubTier(slug) {
        if (!slug) return null;
        return normalizeSubEntry(readSubMap()[slug]);
    }

    function nextTier(tier) {
        if (!tier) return 'monthly';
        if (tier === 'monthly') return 'quarterly';
        if (tier === 'quarterly') return 'annual';
        return null;
    }

    function tierOffer(slug) {
        var cur = getSubTier(slug);
        var next = nextTier(cur);
        if (!cur) return { view: 'monthly', pay: 'monthly', meta: TIER_META.monthly };
        if (!next) return { view: 'max', pay: null, meta: TIER_META.max, current: cur };
        return { view: next, pay: next, meta: TIER_META[next], current: cur };
    }

    function toast(msg) {
        if (global.DigitalH5Nav && typeof global.DigitalH5Nav.toast === 'function') {
            global.DigitalH5Nav.toast(msg);
        }
    }

    function readSubMap() {
        try {
            var raw = localStorage.getItem(SUB_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function writeSubMap(map) {
        try {
            localStorage.setItem(SUB_KEY, JSON.stringify(map || {}));
        } catch (e) { /* ignore */ }
    }

    function isSubscribed(slug) {
        return !!getSubTier(slug);
    }

    function setSubscribed(slug, tierOrOn) {
        var map = readSubMap();
        if (tierOrOn === false || tierOrOn == null) {
            delete map[slug];
        } else if (tierOrOn === true) {
            map[slug] = { tier: 'monthly', at: Date.now() };
        } else {
            map[slug] = { tier: String(tierOrOn), at: Date.now() };
        }
        writeSubMap(map);
    }

    function getBalance() {
        try {
            var v = parseFloat(localStorage.getItem(WALLET_KEY));
            if (!isNaN(v)) return v;
        } catch (e) { /* ignore */ }
        return 100;
    }

    function setBalance(n) {
        try {
            localStorage.setItem(WALLET_KEY, String(Math.max(0, Number(n) || 0)));
        } catch (e) { /* ignore */ }
    }

    function init(opts) {
        opts = opts || {};
        var overlay = document.getElementById(opts.overlayId || 'cpShareOverlay');
        var sheet = document.getElementById(opts.sheetId || 'cpSubscribeSheet');
        if (!overlay || !sheet) return null;

        var subCreatorName = document.getElementById(opts.nameId || 'cpSubCreatorName');
        var subCreatorAv = document.getElementById(opts.avId || 'cpSubCreatorAv');
        var subBalanceVal = document.getElementById(opts.balanceId || 'cpSubBalanceVal');
        var subNeedVal = document.getElementById(opts.needId || 'cpSubNeedVal');
        var subPwdInput = document.getElementById(opts.pwdId || 'cpSubPwdInput');
        var subPromoInput = document.getElementById(opts.promoId || 'cpSubPromoInput');
        var stepPlan = opts.stepPlanId || 'cpSubStepPlan';
        var stepRecharge = opts.stepRechargeId || 'cpSubStepRecharge';
        var stepPwd = opts.stepPwdId || 'cpSubStepPwd';
        var stepDone = opts.stepDoneId || 'cpSubStepDone';

        var state = {
            slug: '',
            name: '',
            avatar: '',
            planPrice: 29.9,
            promo: ''
        };

        function switchStep(id) {
            sheet.querySelectorAll('.sub-step').forEach(function (el) {
                el.classList.toggle('active', el.id === id);
            });
        }

        function closeSheet() {
            overlay.classList.remove('show');
            sheet.classList.remove('show');
        }

        function closeOtherSheets() {
            ['cpShareSheet', 'cpShareDmSheet', 'cpShareGroupSheet', 'cpTipSheet'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.classList.remove('show');
            });
        }

        function refreshBalanceUi() {
            if (subBalanceVal) subBalanceVal.textContent = getBalance().toFixed(2) + ' USDT';
        }

        function syncPlanButtons(price) {
            sheet.querySelectorAll('.sub-plan-btn').forEach(function (btn) {
                var p = Number(btn.getAttribute('data-plan-price'));
                btn.classList.toggle('on', p === price);
            });
        }

        function open(config) {
            config = config || {};
            state.slug = config.slug || '';
            state.name = config.name || '创作者';
            state.avatar = config.avatar || '';
            state.planPrice = Number(config.defaultPlan) || 29.9;
            state.promo = '';
            if (subPromoInput) subPromoInput.value = '';
            if (subPwdInput) subPwdInput.value = '';

            if (subCreatorName) subCreatorName.textContent = state.name;
            if (subCreatorAv && state.avatar) subCreatorAv.src = state.avatar;
            refreshBalanceUi();
            syncPlanButtons(state.planPrice);
            switchStep(stepPlan);
            closeOtherSheets();
            overlay.classList.add('show');
            sheet.classList.add('show');
        }

        function finalPayAmount() {
            var pay = state.planPrice;
            if (state.promo) pay = Math.max(0, pay - 2);
            return pay;
        }

        function syncSubscribeCta(btn) {
            if (!btn) return;
            var slugKey = btn.getAttribute('data-creator-slug') || state.slug;
            if (!slugKey) return;
            var offer = tierOffer(slugKey);
            var canUpgrade = offer.pay != null;
            btn.disabled = !canUpgrade && !!getSubTier(slugKey);
            btn.classList.toggle('is-subscribed', !canUpgrade && !!getSubTier(slugKey));
            btn.classList.toggle('btn-primary', canUpgrade || !getSubTier(slugKey));
            btn.classList.toggle('btn-secondary', !canUpgrade && !!getSubTier(slugKey));
            if (btn.id === 'cpCtaSubscribe') {
                if (!getSubTier(slugKey)) {
                    btn.innerHTML = '<i class="fa-solid fa-crown"></i><span class="cp-cta-sub-label">订阅会员</span>';
                } else if (offer.pay === 'quarterly') {
                    btn.innerHTML = '<i class="fa-solid fa-bolt"></i><span class="cp-cta-sub-label">升级季付</span>';
                } else if (offer.pay === 'annual') {
                    btn.innerHTML = '<i class="fa-solid fa-gem"></i><span class="cp-cta-sub-label">升级年付</span>';
                } else {
                    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i><span class="cp-cta-sub-label">已订阅</span>';
                }
            }
        }

        sheet.querySelectorAll('.sub-plan-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                state.planPrice = Number(btn.getAttribute('data-plan-price')) || state.planPrice;
                syncPlanButtons(state.planPrice);
            });
        });

        var closeBtn = sheet.querySelector('[data-close-subscribe]');
        if (closeBtn) closeBtn.addEventListener('click', closeSheet);

        var promoBtn = document.getElementById(opts.promoApplyId || 'cpSubPromoApplyBtn');
        if (promoBtn) {
            promoBtn.addEventListener('click', function () {
                var v = (subPromoInput && subPromoInput.value || '').trim();
                if (!v) {
                    toast('请输入优惠码');
                    return;
                }
                state.promo = v.toUpperCase();
                toast('优惠码已应用');
            });
        }

        var confirmBtn = document.getElementById(opts.confirmId || 'cpSubConfirmBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function () {
                var pay = finalPayAmount();
                var bal = getBalance();
                if (bal < pay) {
                    if (subNeedVal) subNeedVal.textContent = (pay - bal).toFixed(2) + ' USDT';
                    switchStep(stepRecharge);
                    return;
                }
                switchStep(stepPwd);
            });
        }

        sheet.querySelectorAll('[data-recharge]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var add = Number(btn.getAttribute('data-recharge') || 0);
                setBalance(getBalance() + add);
                refreshBalanceUi();
                toast('已充值 ' + add + ' USDT');
            });
        });

        var rechargeBtn = document.getElementById(opts.rechargeId || 'cpSubRechargeBtn');
        if (rechargeBtn) {
            rechargeBtn.addEventListener('click', function () {
                switchStep(stepPwd);
            });
        }

        var payBtn = document.getElementById(opts.payId || 'cpSubPayBtn');
        if (payBtn) {
            payBtn.addEventListener('click', function () {
                var pwd = (subPwdInput && subPwdInput.value || '').trim();
                if (pwd !== '123456') {
                    toast('支付密码错误（演示：123456）');
                    return;
                }
                var pay = finalPayAmount();
                setBalance(Math.max(0, getBalance() - pay));
                refreshBalanceUi();
                if (state.slug) {
                    var paidTier = priceToTier(state.planPrice);
                    var cur = getSubTier(state.slug);
                    var rank = { monthly: 1, quarterly: 2, annual: 3 };
                    var next = (!cur || (rank[paidTier] || 0) >= (rank[cur] || 0)) ? paidTier : cur;
                    setSubscribed(state.slug, next);
                }
                switchStep(stepDone);
            });
        }

        var doneBtn = document.getElementById(opts.doneId || 'cpSubDoneBtn');
        if (doneBtn) {
            doneBtn.addEventListener('click', function () {
                closeSheet();
                toast('订阅成功，专属内容已解锁');
                if (typeof opts.onSubscribed === 'function') opts.onSubscribed(state);
                document.querySelectorAll('[data-creator-slug="' + state.slug + '"]').forEach(function (el) {
                    syncSubscribeCta(el);
                });
            });
        }

        overlay.addEventListener('click', function () {
            if (sheet.classList.contains('show')) closeSheet();
        });

        return {
            open: open,
            close: closeSheet,
            isSubscribed: isSubscribed,
            getSubTier: getSubTier,
            tierOffer: tierOffer,
            syncSubscribeCta: syncSubscribeCta
        };
    }

    global.H5SubscribeSheet = {
        init: init,
        isSubscribed: isSubscribed,
        getSubTier: getSubTier,
        tierOffer: tierOffer,
        nextTier: nextTier,
        TIER_META: TIER_META
    };
})(typeof window !== 'undefined' ? window : this);
