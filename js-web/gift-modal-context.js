/**
 * 打赏弹窗 · 入口场景上下文（Feed / 直播 / 私信 / 主页）
 */
(function (global) {
    var CTX_META = {
        feed: { label: '内容打赏', icon: 'fa-file-lines' },
        live: { label: '直播打赏', icon: 'fa-tower-broadcast' },
        message: { label: '私信打赏', icon: 'fa-comment-dots' },
        profile: { label: '主页打赏', icon: 'fa-user' }
    };

    function esc(s) {
        return encodeURIComponent(s == null ? '' : String(s));
    }

    function buildGiftModalUrl(opts) {
        opts = opts || {};
        var p = new URLSearchParams();
        var ctx = opts.ctx && CTX_META[opts.ctx] ? opts.ctx : 'feed';
        p.set('ctx', ctx);
        if (opts.creator) p.set('creator', opts.creator);
        if (opts.avatar) p.set('avatar', opts.avatar);
        if (opts.sub) p.set('sub', opts.sub);
        if (opts.lv) p.set('lv', opts.lv);
        if (opts.tags) p.set('tags', opts.tags);
        if (opts.bonus) p.set('bonus', opts.bonus);
        return 'gift-modal.html?' + p.toString();
    }

    function buildSubLine(ctx, opts) {
        opts = opts || {};
        if (opts.sub) return opts.sub;
        var tags = opts.tags || '';
        var lv = opts.lv ? 'LV ' + opts.lv : '';
        if (ctx === 'live') {
            return [tags, '正在直播', lv].filter(Boolean).join(' · ');
        }
        if (ctx === 'message') {
            return '私信会话 · 礼物将展示在聊天记录中';
        }
        if (ctx === 'profile') {
            return [tags, lv].filter(Boolean).join(' · ') || '创作者主页';
        }
        return [tags, lv].filter(Boolean).join(' · ') || '来自内容动态';
    }

    function applyGiftContext(host, query) {
        host = host || document;
        var recipient = host.querySelector ? host.querySelector('.recipient') : null;
        if (!recipient) return;

        var p = new URLSearchParams((query || '').replace(/^\?/, ''));
        var ctx = p.get('ctx') || 'feed';
        if (!CTX_META[ctx]) ctx = 'feed';
        var meta = CTX_META[ctx];

        var creator = p.get('creator') || '创作者';
        var avatar = p.get('avatar') || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120';
        var sub = buildSubLine(ctx, {
            sub: p.get('sub'),
            tags: p.get('tags'),
            lv: p.get('lv')
        });

        var avEl = recipient.querySelector('.av');
        var nmEl = recipient.querySelector('.info .nm');
        var subEl = recipient.querySelector('.info .sub');
        var ctxEl = recipient.querySelector('.ctx');

        if (avEl) avEl.style.backgroundImage = "url('" + avatar.replace(/'/g, '%27') + "')";
        if (nmEl) {
            var verified = nmEl.querySelector('.vfd');
            nmEl.textContent = '';
            nmEl.appendChild(document.createTextNode(creator + ' '));
            if (verified) nmEl.appendChild(verified);
            else {
                var vfd = document.createElement('span');
                vfd.className = 'vfd';
                vfd.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
                nmEl.appendChild(vfd);
            }
        }
        if (subEl) subEl.textContent = sub;
        if (ctxEl) {
            ctxEl.innerHTML = '<i class="fa-solid ' + meta.icon + '"></i> ' + meta.label;
            ctxEl.setAttribute('data-gift-ctx', ctx);
        }
    }

    function openGiftModal(trigger) {
        var opts = { ctx: 'feed' };
        if (trigger && trigger.getAttribute && trigger.getAttribute('data-gift-url')) {
            var preset = trigger.getAttribute('data-gift-url');
            if (global.FL_openInteractionModal) {
                global.FL_openInteractionModal(preset);
            }
            return;
        }
        if (trigger && trigger.closest) {
            var card = trigger.closest('.post-card');
            if (card) {
                var type = card.getAttribute('data-post-type') || '';
                var liveSt = card.getAttribute('data-live-status') || '';
                opts.ctx = (type === 'live' && liveSt !== 'ended') ? 'live' : 'feed';
                opts.creator = card.getAttribute('data-creator') || '';
                opts.avatar = card.getAttribute('data-creator-av') || '';
                opts.lv = card.getAttribute('data-creator-lv') || '';
                opts.tags = card.getAttribute('data-creator-tags') || '';
            }
        }
        var url = buildGiftModalUrl(opts);
        if (global.FL_openInteractionModal) {
            global.FL_openInteractionModal(url);
        } else {
            global.location.href = url;
        }
    }

    global.FL_buildGiftModalUrl = buildGiftModalUrl;
    global.FL_applyGiftContext = applyGiftContext;
    global.FL_openGiftModal = openGiftModal;
})(typeof window !== 'undefined' ? window : this);
