/**
 * H5 打赏礼物底部弹层（创作者主页 / 直播简化版）
 */
(function (global) {
    var WALLET_KEY = 'gf_h5_wallet_usdt_v1';

    var GIFTS = [
        { id: 'rose', emoji: '🌹', name: '玫瑰', price: 1 },
        { id: 'coffee', emoji: '☕', name: '咖啡', price: 3 },
        { id: 'star', emoji: '⭐', name: '小星星', price: 5 },
        { id: 'diamond', emoji: '💎', name: '钻石', price: 28 },
        { id: 'rocket', emoji: '🚀', name: '火箭', price: 66 },
        { id: 'crown', emoji: '👑', name: '皇冠', price: 128 }
    ];

    function toast(msg) {
        if (global.DigitalH5Nav && typeof global.DigitalH5Nav.toast === 'function') {
            global.DigitalH5Nav.toast(msg);
        }
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
        var sheet = document.getElementById(opts.sheetId || 'cpTipSheet');
        if (!overlay || !sheet) return null;

        var targetName = document.getElementById(opts.nameId || 'cpTipTargetName');
        var targetAv = document.getElementById(opts.avId || 'cpTipTargetAv');
        var balanceEl = document.getElementById(opts.balanceId || 'cpTipBalance');
        var grid = document.getElementById(opts.gridId || 'cpTipGrid');
        var sendBtn = document.getElementById(opts.sendId || 'cpTipSendBtn');
        var selected = GIFTS[2];
        var state = { name: '', avatar: '' };

        function closeOtherSheets() {
            ['cpShareSheet', 'cpShareDmSheet', 'cpShareGroupSheet', 'cpSubscribeSheet', 'cpTipSheet'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el && id !== 'cpTipSheet') el.classList.remove('show');
            });
        }

        function closeSheet() {
            overlay.classList.remove('show');
            sheet.classList.remove('show');
        }

        function renderGrid() {
            if (!grid) return;
            grid.innerHTML = GIFTS.map(function (g) {
                var on = selected && selected.id === g.id ? ' on' : '';
                return '<button type="button" class="cp-tip-gift' + on + '" data-gid="' + g.id + '">' +
                    '<span class="em">' + g.emoji + '</span>' +
                    '<span class="nm">' + g.name + '</span>' +
                    '<span class="pr">' + g.price + ' U</span></button>';
            }).join('');
            grid.querySelectorAll('.cp-tip-gift').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var id = btn.getAttribute('data-gid');
                    selected = GIFTS.filter(function (x) { return x.id === id; })[0] || selected;
                    renderGrid();
                    if (sendBtn && selected) {
                        sendBtn.innerHTML = '<i class="fa-solid fa-gift"></i> 送出 ' + selected.name + '（' + selected.price + ' USDT）';
                    }
                });
            });
        }

        function open(config) {
            config = config || {};
            state.name = config.name || '创作者';
            state.avatar = config.avatar || '';
            if (targetName) targetName.textContent = state.name;
            if (targetAv && state.avatar) targetAv.src = state.avatar;
            if (balanceEl) balanceEl.textContent = getBalance().toFixed(2) + ' USDT';
            selected = GIFTS[2];
            renderGrid();
            if (sendBtn && selected) {
                sendBtn.innerHTML = '<i class="fa-solid fa-gift"></i> 送出 ' + selected.name + '（' + selected.price + ' USDT）';
            }
            closeOtherSheets();
            overlay.classList.add('show');
            sheet.classList.add('show');
        }

        var closeBtn = sheet.querySelector('[data-close-tip]');
        if (closeBtn) closeBtn.addEventListener('click', closeSheet);

        if (sendBtn) {
            sendBtn.addEventListener('click', function () {
                if (!selected) return;
                var bal = getBalance();
                if (bal < selected.price) {
                    toast('余额不足，请先充值');
                    return;
                }
                setBalance(bal - selected.price);
                if (balanceEl) balanceEl.textContent = getBalance().toFixed(2) + ' USDT';
                toast('已向 ' + state.name + ' 送出 ' + selected.emoji + ' ' + selected.name);
                closeSheet();
                if (typeof opts.onSent === 'function') opts.onSent(selected, state);
            });
        }

        overlay.addEventListener('click', function () {
            if (sheet.classList.contains('show')) closeSheet();
        });

        return { open: open, close: closeSheet };
    }

    global.H5TipSheet = { init: init, GIFTS: GIFTS };
})(typeof window !== 'undefined' ? window : this);
