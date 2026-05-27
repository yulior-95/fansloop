/**
 * macOS 风格系统通知 · 右上角侧边滑入
 * API: FL_macNotify({ title, body, app, time, icon, iconUrl, thumb, href, duration, actions })
 */
(function (global) {
    if (global.FL_macNotify) return;

    var MAX_STACK = 4;
    var DEFAULT_DURATION = 5500;

    function getStack() {
        var el = document.getElementById('macNotifyStack');
        if (el) return el;
        el = document.createElement('div');
        el.id = 'macNotifyStack';
        el.className = 'mac-notify-stack';
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-relevant', 'additions');
        document.body.appendChild(el);
        return el;
    }

    function trimStack(stack) {
        var cards = stack.querySelectorAll('.mac-notify-card:not(.is-leaving)');
        while (cards.length > MAX_STACK) {
            dismiss(cards[cards.length - 1]);
            cards = stack.querySelectorAll('.mac-notify-card:not(.is-leaving)');
        }
    }

    function dismiss(card) {
        if (!card || card.classList.contains('is-leaving')) return;
        card.classList.remove('is-visible');
        card.classList.add('is-leaving');
        setTimeout(function () { card.remove(); }, 340);
    }

    function notify(opts) {
        opts = opts || {};
        var stack = getStack();
        trimStack(stack);

        var card = document.createElement('article');
        card.className = 'mac-notify-card';
        card.setAttribute('role', 'alert');

        var iconHtml = '';
        if (opts.iconUrl) {
            iconHtml = '<img src="' + opts.iconUrl + '" alt="">';
        } else {
            var ic = opts.icon || 'fa-bell';
            iconHtml = '<i class="fa-solid ' + ic + '"></i>';
        }

        var thumbHtml = opts.thumb
            ? '<div class="mac-notify-thumb" style="background-image:url(\'' + opts.thumb + '\')"></div>'
            : '';

        var actionsHtml = '';
        if (opts.actions && opts.actions.length) {
            actionsHtml = '<div class="mac-notify-actions">' + opts.actions.map(function (a) {
                var cls = a.primary ? ' primary' : '';
                return '<button type="button" data-mac-act="' + (a.id || '') + '" class="' + cls.trim() + '">' + (a.label || '操作') + '</button>';
            }).join('') + '</div>';
        }

        card.innerHTML =
            '<button type="button" class="mac-notify-close" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>' +
            '<div class="mac-notify-icon">' + iconHtml + '</div>' +
            '<div class="mac-notify-body">' +
            '<div class="mac-notify-head"><span class="mac-notify-app">' + (opts.app || 'FansLoop') + '</span>' +
            '<span class="mac-notify-time">' + (opts.time || '现在') + '</span></div>' +
            '<div class="mac-notify-title">' + (opts.title || '新通知') + '</div>' +
            '<div class="mac-notify-text">' + (opts.body || '') + '</div>' +
            actionsHtml +
            '</div>' +
            thumbHtml;

        var closeBtn = card.querySelector('.mac-notify-close');
        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            dismiss(card);
        });

        card.addEventListener('click', function (e) {
            if (e.target.closest('.mac-notify-close') || e.target.closest('.mac-notify-actions')) return;
            if (typeof opts.onClick === 'function') {
                opts.onClick(opts);
                return;
            }
            if (opts.href) location.href = opts.href;
        });

        card.querySelectorAll('.mac-notify-actions button').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var id = btn.getAttribute('data-mac-act');
                var action = (opts.actions || []).find(function (a) { return a.id === id; });
                if (action && typeof action.onClick === 'function') action.onClick(opts);
                else if (action && action.href) location.href = action.href;
                dismiss(card);
            });
        });

        stack.prepend(card);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { card.classList.add('is-visible'); });
        });

        var duration = opts.duration === 0 ? 0 : (opts.duration || DEFAULT_DURATION);
        if (duration > 0) {
            setTimeout(function () { dismiss(card); }, duration);
        }
        return card;
    }

    global.FL_macNotify = notify;
    global.FL_macNotifyDismissAll = function () {
        var stack = document.getElementById('macNotifyStack');
        if (!stack) return;
        stack.querySelectorAll('.mac-notify-card').forEach(dismiss);
    };

    /** 预置演示场景 */
    global.FL_macNotifyPresets = {
        tip: function () {
            return notify({
                title: 'BlockTrader 打赏了你',
                body: '+50 USDT · 「画面太美了，期待下一组！」',
                icon: 'fa-gift',
                thumb: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=200',
                href: 'notifications.html?tab=unread',
                actions: [
                    { id: 'thanks', label: '感谢', primary: true },
                    { id: 'open', label: '查看', href: 'notifications.html?tab=unread' }
                ]
            });
        },
        live: function () {
            return notify({
                title: 'NovaPlay 正在直播',
                body: 'Apex 周五开黑 · 准点上分到大师 · 2.4K 在线',
                icon: 'fa-tower-broadcast',
                thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200',
                href: 'live-detail.html',
                actions: [
                    { id: 'watch', label: '立即观看', primary: true, href: 'live-detail.html' }
                ]
            });
        },
        mention: function () {
            return notify({
                title: 'Echo 提到了你',
                body: '「强烈推荐去看 Luna 这组 ✨」',
                iconUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80',
                href: 'notifications.html?tab=unread'
            });
        },
        system: function () {
            return notify({
                title: '系统通知',
                body: '创作者增长计划已开启 · 完成目标可获流量加权',
                icon: 'fa-bullhorn',
                href: 'notifications.html?tab=unread'
            });
        },
        expiry: function () {
            return notify({
                title: '订阅即将到期',
                body: '「山野食光 · 月度会员」将在 24 小时后到期',
                icon: 'fa-hourglass-half',
                actions: [
                    { id: 'renew', label: '立即续费', primary: true, href: 'notifications.html?tab=unread' }
                ]
            });
        }
    };

    function runAutoDemo() {
        var mode = document.body.getAttribute('data-mac-notify-auto');
        if (!mode) return;
        var presets = global.FL_macNotifyPresets;
        var seq = mode === 'full'
            ? [presets.tip, presets.live, presets.mention, presets.system]
            : [presets.tip];
        seq.forEach(function (fn, i) {
            setTimeout(fn, 800 + i * 1400);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAutoDemo);
    } else {
        runAutoDemo();
    }
})(typeof window !== 'undefined' ? window : this);
