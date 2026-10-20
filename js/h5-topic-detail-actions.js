/**
 * H5 话题详情 · 帖子行内互动（赞 / 评 / 藏 / 打赏·送礼）
 */
(function (global) {
    var SAMPLE_COMMENTS = [
        { user: 'Aria', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80', text: '机位分享太实用了！', time: '18 分钟前' },
        { user: 'Neo', av: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80', text: '已收藏 🙌', time: '32 分钟前' }
    ];

    function toast(msg) {
        if (global.DigitalH5Nav && typeof global.DigitalH5Nav.toast === 'function') {
            global.DigitalH5Nav.toast(msg);
        }
    }

    function creatorFromPost(article) {
        if (!article) return { name: '创作者', avatar: '' };
        var nm = article.querySelector('.head .nm');
        var av = article.querySelector('.head .av');
        var name = nm ? (nm.textContent || '').trim() : '创作者';
        var avatar = '';
        if (av && av.style && av.style.backgroundImage) {
            var m = av.style.backgroundImage.match(/url\(["']?([^"')]+)/);
            if (m && m[1]) avatar = m[1];
        }
        return { name: name, avatar: avatar };
    }

    function bindCommentSheet() {
        var overlay = document.getElementById('tdShareOverlay');
        var sheet = document.getElementById('tdCommentSheet');
        var list = document.getElementById('tdCommentList');
        var input = document.getElementById('tdCommentInput');
        var send = document.getElementById('tdCommentSend');
        var closeBtn = document.getElementById('tdCommentClose');
        if (!sheet || !list) return;

        function closeAll() {
            if (overlay) overlay.classList.remove('show');
            ['tdShareSheet', 'tdShareDmSheet', 'tdShareGroupSheet', 'tdCommentSheet', 'tdTipSheet'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.classList.remove('show');
            });
        }

        function renderList() {
            list.innerHTML = SAMPLE_COMMENTS.map(function (c) {
                return '<div class="cm-item"><img src="' + c.av + '" alt=""><div>' +
                    '<div class="nm">' + c.user + '</div>' +
                    '<div class="tx">' + c.text + '</div>' +
                    '<div class="tm">' + c.time + '</div></div></div>';
            }).join('');
        }

        function openSheet() {
            renderList();
            closeAll();
            if (overlay) overlay.classList.add('show');
            sheet.classList.add('show');
        }

        if (closeBtn) closeBtn.addEventListener('click', closeAll);
        if (send && input) {
            send.addEventListener('click', function () {
                var txt = (input.value || '').trim();
                if (!txt) return;
                SAMPLE_COMMENTS.unshift({ user: '我', av: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80', text: txt, time: '刚刚' });
                input.value = '';
                renderList();
                toast('评论已发送');
            });
        }

        global.FL_h5TopicOpenComment = openSheet;
    }

    function bindActions(tipApi) {
        var root = document.getElementById('tdTabPanels') || document.getElementById('h5TdTabPanels') || document;
        root.addEventListener('click', function (e) {
            if (e.target.closest('[data-h5-topic-share]')) return;
            var span = e.target.closest('.h5-td-actions-row span');
            if (!span) return;
            var icon = span.querySelector('i');
            if (!icon) return;
            e.preventDefault();
            e.stopPropagation();

            var article = span.closest('.h5-td-post');

            if (icon.classList.contains('fa-gift') || /打赏|送礼/.test(span.textContent || '')) {
                if (tipApi && typeof tipApi.open === 'function') {
                    var c = creatorFromPost(article);
                    tipApi.open({ name: c.name, avatar: c.avatar });
                } else {
                    toast('打赏功能暂不可用');
                }
                return;
            }

            if (icon.classList.contains('fa-heart')) {
                var liked = span.classList.toggle('liked');
                icon.className = liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                if (liked) icon.style.color = '#ff3b5c';
                else icon.style.color = '';
                toast(liked ? '点赞成功' : '已取消点赞');
                return;
            }

            if (icon.classList.contains('fa-comment')) {
                if (typeof global.FL_h5TopicOpenComment === 'function') {
                    global.FL_h5TopicOpenComment();
                }
                return;
            }

            if (icon.classList.contains('fa-bookmark')) {
                var saved = span.classList.toggle('saved');
                icon.className = saved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
                toast(saved ? '收藏成功' : '已取消收藏');
            }
        }, true);
    }

    function bind() {
        bindCommentSheet();
        var tipApi = null;
        if (global.H5TipSheet && typeof global.H5TipSheet.init === 'function') {
            tipApi = global.H5TipSheet.init({
                overlayId: 'tdShareOverlay',
                sheetId: 'tdTipSheet',
                nameId: 'tdTipTargetName',
                avId: 'tdTipTargetAv',
                balanceId: 'tdTipBalance',
                gridId: 'tdTipGrid',
                sendId: 'tdTipSendBtn'
            });
            if (tipApi && typeof tipApi.open === 'function') {
                var baseOpen = tipApi.open;
                tipApi.open = function (cfg) {
                    ['tdShareSheet', 'tdShareDmSheet', 'tdShareGroupSheet', 'tdCommentSheet'].forEach(function (id) {
                        var el = document.getElementById(id);
                        if (el) el.classList.remove('show');
                    });
                    baseOpen(cfg);
                };
            }
        }
        bindActions(tipApi);
        document.querySelectorAll('.h5-td-actions-row span').forEach(function (span) {
            if (!span.hasAttribute('data-h5-topic-share') && span.querySelector('i')) {
                span.setAttribute('role', 'button');
                span.setAttribute('tabindex', '0');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})(typeof window !== 'undefined' ? window : this);
