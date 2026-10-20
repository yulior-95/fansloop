/**
 * 话题详情 · 分享 + 帖子互动（与首页 Feed / gift-modal / comment-modal 一致）
 */
(function (global) {
    var TOPIC_DEFAULT = {
        title: '# 富士山日出 · 热门话题',
        by: 'GOODFANS · 18.6K 帖 · +186%',
        thumb: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600',
        url: 'https://goodfans.io/t/mt-fuji-sunrise?ref=0x7Bf2c3D9'
    };

    function toast(msg) {
        if (typeof global.toast === 'function') {
            global.toast(msg);
            return;
        }
        var host = document.getElementById('toastHostF');
        if (!host) {
            host = document.createElement('div');
            host.className = 'toast-host-f';
            host.id = 'toastHostF';
            host.setAttribute('aria-live', 'polite');
            document.body.appendChild(host);
        }
        var t = document.createElement('div');
        t.className = 'toast-f';
        t.textContent = msg;
        host.appendChild(t);
        setTimeout(function () { t.remove(); }, 2400);
    }

    function openShare(ctx) {
        global.FL_pendingShareContext = ctx || TOPIC_DEFAULT;
        if (typeof global.FL_openInteractionModal === 'function') {
            global.FL_openInteractionModal('share-modal.html');
            return;
        }
        global.location.href = 'share-modal.html';
    }

    function metaFromPostCard(card) {
        if (!card) return null;
        var textEl = card.querySelector('.post-text');
        var nm = card.querySelector('.post-head .nm');
        var snippet = textEl ? (textEl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48) : '';
        return {
            title: snippet || TOPIC_DEFAULT.title,
            by: (nm && nm.textContent ? nm.textContent.split(/\s+/)[0] : '创作者') + ' · 富士山日出',
            thumb: TOPIC_DEFAULT.thumb,
            url: TOPIC_DEFAULT.url + '&post=demo'
        };
    }

    function creatorNameFromNm(nmEl) {
        if (!nmEl) return '创作者';
        var clone = nmEl.cloneNode(true);
        clone.querySelectorAll('.fl-badge').forEach(function (b) { b.remove(); });
        return (clone.textContent || '').replace(/\s+/g, ' ').trim() || '创作者';
    }

    function ensurePostCardGiftMeta(card) {
        if (!card) return;
        if (card.querySelector('.post-media--live')) {
            card.setAttribute('data-post-type', 'live');
            card.setAttribute('data-live-status', 'live');
        }
        if (card.getAttribute('data-creator')) return;
        var head = card.querySelector('.post-head');
        if (!head) return;
        var nm = head.querySelector('.nm');
        card.setAttribute('data-creator', creatorNameFromNm(nm));
        var av = head.querySelector('.av');
        if (av && av.style && av.style.backgroundImage) {
            var m = av.style.backgroundImage.match(/url\(["']?([^"')]+)/);
            if (m && m[1]) card.setAttribute('data-creator-av', m[1]);
        }
    }

    function actFromSpan(span) {
        if (!span) return '';
        if (span.classList.contains('tip-cta')) return 'tip';
        if (span.classList.contains('like-act')) return 'like';
        if (span.classList.contains('comment-act')) return 'comment';
        if (span.classList.contains('bookmark-act')) return 'bookmark';
        if (span.classList.contains('share-act')) return 'share';
        var icon = span.querySelector('i');
        if (!icon) return /分享/.test(span.textContent || '') ? 'share' : '';
        if (icon.classList.contains('fa-gift')) return 'tip';
        if (icon.classList.contains('fa-heart')) return 'like';
        if (icon.classList.contains('fa-comment')) return 'comment';
        if (icon.classList.contains('fa-bookmark')) return 'bookmark';
        if (icon.classList.contains('fa-arrow-up-right-from-square')) return 'share';
        return '';
    }

    function runPostAction(act, span) {
        var card = span.closest('.post-card');
        switch (act) {
            case 'share':
                openShare(metaFromPostCard(card));
                return;
            case 'tip':
                ensurePostCardGiftMeta(card);
                if (typeof global.FL_openGiftModal === 'function') {
                    global.FL_openGiftModal(span);
                } else {
                    toast('打赏功能暂不可用');
                }
                return;
            case 'like': {
                var liked = span.classList.toggle('liked');
                var lic = span.querySelector('i');
                if (lic) lic.className = liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                toast(liked ? '点赞成功' : '已取消点赞');
                return;
            }
            case 'comment':
                if (typeof global.FL_openInteractionModal === 'function') {
                    global.FL_openInteractionModal('comment-modal.html');
                } else {
                    toast('评论功能暂不可用');
                }
                return;
            case 'bookmark': {
                var saved = span.classList.toggle('saved');
                var bic = span.querySelector('i');
                if (bic) bic.className = saved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
                toast(saved ? '收藏成功' : '已取消收藏');
            }
        }
    }

    function decorateActionSpans(root) {
        (root || document).querySelectorAll('#tdTabPanels .post-actions span').forEach(function (span) {
            var icon = span.querySelector('i');
            if (!icon) return;
            span.setAttribute('role', 'button');
            span.setAttribute('tabindex', '0');
            if (icon.classList.contains('fa-heart')) span.classList.add('like-act');
            if (icon.classList.contains('fa-comment')) span.classList.add('comment-act');
            if (icon.classList.contains('fa-bookmark')) span.classList.add('bookmark-act');
            if (icon.classList.contains('fa-arrow-up-right-from-square')) span.classList.add('share-act');
            if (span.classList.contains('tip-cta') || icon.classList.contains('fa-gift')) span.classList.add('tip-act');
        });
    }

    function bindPostActions(root) {
        var panels = (root || document).querySelector('#tdTabPanels');
        if (!panels) return;

        function onActionClick(e) {
            var span = e.target.closest('.post-actions span');
            if (!span || !panels.contains(span)) return;
            var act = actFromSpan(span);
            if (!act) return;
            e.preventDefault();
            e.stopPropagation();
            runPostAction(act, span);
        }

        panels.addEventListener('click', onActionClick, true);
        panels.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var span = e.target.closest('.post-actions span[tabindex="0"]');
            if (!span || !panels.contains(span)) return;
            e.preventDefault();
            runPostAction(actFromSpan(span), span);
        });
    }

    global.FL_tdPostAction = function (span) {
        runPostAction(actFromSpan(span), span);
    };

    function bind() {
        if (typeof global.FL_bindTopicDetailTabs === 'function') {
            global.FL_bindTopicDetailTabs(document);
        }
        decorateActionSpans(document);
        bindPostActions(document);
        var heroShare = document.querySelector('.td-hero .btn-share');
        if (heroShare) {
            heroShare.type = 'button';
            heroShare.addEventListener('click', function () {
                openShare(TOPIC_DEFAULT);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})(typeof window !== 'undefined' ? window : this);
