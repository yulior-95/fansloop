/**
 * 打赏加成卡 · 送礼弹窗结算逻辑（原型）
 * 数据来源：MallVouchersStore.getActiveTipBoost()（与积分商城券包同源）
 */
(function (global) {
    var DEMO_CFG = {
        subsidyPercent: 10,
        maxSubsidyPerTip: 50,
        minTipAmount: 10,
        maxTipAmount: 500,
        usesRemaining: 2,
        usesTotal: 3,
        voucherId: ''
    };

    function getScopeRoot() {
        var host = document.querySelector('.fl-modal-inline-host');
        return host || document;
    }

    function q(id) {
        var root = getScopeRoot();
        if (root.querySelector) {
            var el = root.querySelector('#' + id);
            if (el) return el;
        }
        return document.getElementById(id);
    }

    function qa(sel) {
        var root = getScopeRoot();
        if (root.querySelector) {
            var el = root.querySelector(sel);
            if (el) return el;
        }
        return document.querySelector(sel);
    }

    function resolveTipBoostState(query) {
        var qs = typeof query === 'string' ? query : (location.search || '');
        var p = new URLSearchParams(qs.replace(/^\?/, ''));
        var store = global.MallVouchersStore;

        if (p.get('bonus') === 'none' || p.get('bonus') === '0') {
            return { hasBonus: false, cfg: null, demo: false };
        }

        var voucher = store && typeof store.getActiveTipBoost === 'function'
            ? store.getActiveTipBoost()
            : null;

        if (voucher && store.voucherToTipCfg) {
            return { hasBonus: true, cfg: store.voucherToTipCfg(voucher), demo: false };
        }

        if (p.get('bonus') === 'active' || p.get('bonus') === '1') {
            return { hasBonus: true, cfg: Object.assign({}, DEMO_CFG), demo: true };
        }

        return { hasBonus: false, cfg: null, demo: false };
    }

    function calcSubsidy(amount, cfg) {
        cfg = cfg || DEMO_CFG;
        if (amount < cfg.minTipAmount) return 0;
        var eligible = Math.min(amount, cfg.maxTipAmount || amount);
        var raw = eligible * ((cfg.subsidyPercent || 0) / 100);
        return Math.round(Math.min(raw, cfg.maxSubsidyPerTip || raw) * 100) / 100;
    }

    function formatUsdt(n) {
        return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    function initGiftModal(opts) {
        opts = opts || {};
        var state = resolveTipBoostState(opts.query);
        var panel = q('tipBonusPanel');
        var empty = q('tipBonusEmpty');

        if (!panel && !empty) return;

        if (!state.hasBonus) {
            if (panel) panel.style.display = 'none';
            if (empty) empty.style.display = '';
            return;
        }

        if (empty) empty.style.display = 'none';
        if (panel) {
            panel.style.display = '';
            if (state.cfg && state.cfg.voucherId) {
                panel.setAttribute('data-voucher-id', state.cfg.voucherId);
            } else {
                panel.removeAttribute('data-voucher-id');
            }
        }

        var cfg = state.cfg || DEMO_CFG;
        var toggle = q('tipBonusToggle');
        var usesEl = q('tipBonusUses');
        var payEl = q('tipPayAmount');
        var subsidyEl = q('tipSubsidyAmount');
        var creatorEl = q('tipCreatorAmount');
        var totalPill = qa('.total-pill b');
        var qtyInput = qa('.qty-stepper input');
        var subsidyLabel = qa('.tip-bonus-breakdown .row.subsidy .lbl');
        var capHint = qa('.tip-bonus-breakdown .cap-hint');
        var selectedPrice = 200;

        if (subsidyLabel) {
            subsidyLabel.innerHTML = '<i class="fa-solid fa-hand-holding-dollar"></i> 平台补贴（' + cfg.subsidyPercent + '%）';
        }
        if (capHint) {
            capHint.innerHTML = '<i class="fa-solid fa-circle-info"></i> 单笔补贴上限 ' + cfg.maxSubsidyPerTip + ' USDT · 打赏 ≥' + cfg.minTipAmount + ' USDT 生效 · 每次消耗 1 次加成次数';
        }

        function getGiftPrice() {
            var sel = qa('.gift-item.selected .pr');
            if (sel) {
                var m = sel.textContent.match(/([\d.]+)/);
                if (m) selectedPrice = parseFloat(m[1]);
            }
            var qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
            return selectedPrice * qty;
        }

        function refresh() {
            var amount = getGiftPrice();
            if (totalPill) totalPill.textContent = formatUsdt(amount);
            if (usesEl) usesEl.textContent = '剩余 ' + cfg.usesRemaining + '/' + cfg.usesTotal + ' 次';

            var on = toggle ? toggle.checked : true;
            if (panel) panel.classList.toggle('is-off', !on);

            var subsidy = on ? calcSubsidy(amount, cfg) : 0;
            if (payEl) payEl.textContent = formatUsdt(amount) + ' USDT';
            if (subsidyEl) subsidyEl.textContent = subsidy > 0 ? '+' + formatUsdt(subsidy) + ' USDT' : '—';
            if (creatorEl) creatorEl.textContent = formatUsdt(amount + subsidy) + ' USDT';
        }

        if (toggle) toggle.addEventListener('change', refresh);
        if (qtyInput) qtyInput.addEventListener('input', refresh);
        var grid = qa('.gift-grid');
        if (grid) {
            grid.querySelectorAll('.gift-item').forEach(function (item) {
                item.addEventListener('click', function () {
                    grid.querySelectorAll('.gift-item').forEach(function (x) { x.classList.remove('selected'); });
                    item.classList.add('selected');
                    refresh();
                });
            });
        }

        var sendBtn = qa('.send-btn');
        if (sendBtn && !sendBtn.dataset.tipBonusBound) {
            sendBtn.dataset.tipBonusBound = '1';
            sendBtn.addEventListener('click', function () {
                var vid = panel && panel.getAttribute('data-voucher-id');
                var bonusOn = toggle ? toggle.checked : true;
                if (!vid || !bonusOn || !global.MallVouchersStore) return;
                var used = global.MallVouchersStore.consumeTipBoostUse(vid);
                if (used && typeof global.dispatchEvent === 'function') {
                    try {
                        global.dispatchEvent(new CustomEvent('fl-tip-boost-consumed', { detail: { voucher: used } }));
                    } catch (e) { /* noop */ }
                }
            });
        }

        refresh();
    }

    global.FLTipBonus = {
        calcSubsidy: calcSubsidy,
        resolveTipBoostState: resolveTipBoostState,
        formatUsdt: formatUsdt,
        initGiftModal: initGiftModal
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { initGiftModal(); });
    } else if (document.querySelector('.gift-modal')) {
        initGiftModal();
    }
})(typeof window !== 'undefined' ? window : this);
