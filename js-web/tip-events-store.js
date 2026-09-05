/**
 * 打赏事件共享存储（原型层）
 *
 * 真实环境由 POST /api/v1/tips 返回事件；原型页面之间用 localStorage
 * 保持一次送礼在通知、收益和创作者主页可见。
 */
(function (global) {
    if (global.FLTipEvents) return;

    var LS_KEY = 'fl_tip_events_v1';
    var MAX_EVENTS = 100;

    function read() {
        try {
            var value = JSON.parse(global.localStorage.getItem(LS_KEY) || '[]');
            return Array.isArray(value) ? value : [];
        } catch (e) {
            return [];
        }
    }

    function write(events) {
        try {
            global.localStorage.setItem(LS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
        } catch (e) { /* storage is optional in the prototype */ }
    }

    function cleanName(value, fallback) {
        var text = String(value || '').replace(/\s+/g, ' ').trim();
        return text || fallback;
    }

    function parseAmount(value) {
        var match = String(value || '').replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
        return match ? Number(match[1]) : 0;
    }

    function formatAmount(value) {
        return Number(value || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function getLatest(limit) {
        return read().slice().reverse().slice(0, Number(limit) || 20);
    }

    function getForCreator(creator) {
        var name = cleanName(creator, '');
        return read().filter(function (event) {
            return !name || event.creator === name;
        });
    }

    function add(input) {
        input = input || {};
        var amount = Math.max(0, Number(input.amount) || 0);
        if (!amount) return null;

        var event = {
            id: 'tip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            creator: cleanName(input.creator, '创作者'),
            sender: cleanName(input.sender, '匿名用户'),
            gift: cleanName(input.gift, '心意'),
            amount: Math.round(amount * 100) / 100,
            context: cleanName(input.context, 'feed'),
            message: cleanName(input.message, ''),
            createdAt: new Date().toISOString()
        };
        var events = read();
        events.push(event);
        write(events);
        try {
            global.dispatchEvent(new CustomEvent('fl-tip-sent', { detail: event }));
        } catch (e) { /* noop */ }
        return event;
    }

    function captureGiftModal(root) {
        root = root || document;
        var recipient = root.querySelector('.recipient');
        var selected = root.querySelector('.gift-item.selected');
        var total = root.querySelector('.total-pill b');
        if (!recipient || !selected || !total) return null;

        var name = recipient.querySelector('.info .nm');
        var badge = name && name.querySelector('.fl-badge');
        if (badge) badge.remove();
        var currentUser = global.GoodfansAuth && global.GoodfansAuth.getUser
            ? global.GoodfansAuth.getUser()
            : null;
        var event = add({
            creator: name ? name.textContent : '',
            sender: currentUser && (currentUser.nickname || currentUser.nickName || currentUser.name),
            gift: selected.querySelector('.nm') ? selected.querySelector('.nm').textContent : '',
            amount: parseAmount(total.textContent),
            context: recipient.querySelector('.ctx')?.getAttribute('data-gift-ctx'),
            message: root.querySelector('.gift-msg-input input')?.value
        });
        if (badge && name) name.appendChild(badge);
        return event;
    }

    global.FLTipEvents = {
        add: add,
        captureGiftModal: captureGiftModal,
        getAll: read,
        getLatest: getLatest,
        getForCreator: getForCreator,
        formatAmount: formatAmount
    };

    function bindSendButton() {
        if (document.documentElement.getAttribute('data-fl-tip-events-bound') === '1') return;
        document.documentElement.setAttribute('data-fl-tip-events-bound', '1');
        document.addEventListener('click', function (event) {
            var button = event.target.closest && event.target.closest('.send-btn');
            if (!button || button.getAttribute('data-tip-sent') === '1') return;
            var tip = captureGiftModal(button.closest('.gift-modal') || document);
            if (!tip) return;
            button.setAttribute('data-tip-sent', '1');
            button.classList.add('is-sent');
            button.innerHTML = '<i class="fa-solid fa-check"></i> 已送出';
            try {
                if (global.FL_nfToast) global.FL_nfToast('已送出 ' + formatAmount(tip.amount) + ' USDT 给 ' + tip.creator, 'ok');
            } catch (e) { /* noop */ }
            setTimeout(function () {
                if (global.FL_closeStandaloneModal) global.FL_closeStandaloneModal();
            }, 550);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindSendButton);
    else bindSendButton();
})(typeof window !== 'undefined' ? window : this);
