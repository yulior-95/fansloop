/**
 * 内容详情右侧抽屉 · 作品/动态预览（抖音式布局）
 */
(function (global) {
    function initDrawer() {
    var root = document.getElementById('contentDetailDrawer');
    if (!root) return false;

    var SAMPLE_COMMENTS = [
        { user: 'Aria', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80', text: '这个角度太绝了！能出一期后期教程吗？', time: '18 分钟前' },
        { user: 'Neo', av: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80', text: '已收藏，期待下一组 🙌', time: '32 分钟前' },
        { user: 'BlockTrader', av: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80', text: '画面太美了，打赏支持！', time: '1 小时前' }
    ];
    var currentPayload = null;

    function toast(msg) {
        var el = root.querySelector('.cdd-toast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        setTimeout(function () { el.classList.remove('show'); }, 2200);
    }

    function parseCount(raw) {
        if (typeof raw === 'number' && isFinite(raw)) return Math.max(0, Math.floor(raw));
        var txt = String(raw == null ? '' : raw).trim().toLowerCase();
        if (!txt) return 0;
        var k = txt.match(/^(\d+(?:\.\d+)?)\s*k$/i);
        if (k) return Math.round(Number(k[1]) * 1000);
        var w = txt.match(/^(\d+(?:\.\d+)?)\s*w$/i);
        if (w) return Math.round(Number(w[1]) * 10000);
        var n = Number(txt.replace(/[^\d.]/g, ''));
        return isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }

    function setCommentTotal(total) {
        var n = Math.max(0, Number(total) || 0);
        root.setAttribute('data-comment-total', String(n));
        var totalEl = root.querySelector('#cddCommentsTotal');
        if (totalEl) totalEl.textContent = n + ' 条评论';
    }

    function open(payload) {
        payload = payload || {};
        currentPayload = payload;
        var title = payload.title || '作品详情';
        var image = payload.image || 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=1200';
        var author = payload.author || 'Luna 🌙';
        var authorAv = payload.authorAv || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80';
        var likes = payload.likes || '1.5k';
        var comments = payload.comments || 0;
        var desc = payload.desc || '创作者发布的图文动态，支持点赞、评论、转发与收藏。';
        var commentsData = Array.isArray(payload.commentItems) && payload.commentItems.length
            ? payload.commentItems
            : SAMPLE_COMMENTS.slice();

        root.querySelector('#cddTitle').textContent = title;
        root.querySelector('#cddDesc').textContent = desc;
        root.querySelector('#cddMediaImg').src = image;
        root.querySelector('#cddAuthorName').textContent = author;
        root.querySelector('#cddAuthorAv').style.backgroundImage = "url('" + authorAv + "')";
        root.querySelector('#cddLikeCount').textContent = likes;

        var list = root.querySelector('#cddCommentList');
        list.innerHTML = commentsData.map(function (c) {
            return '<div class="cdd-comment">' +
                '<div class="av" style="background-image:url(\'' + c.av + '\')"></div>' +
                '<div class="txt"><span class="n">' + c.user + '</span><span class="c">' + c.text + '</span>' +
                '<div class="t">' + c.time + '</div></div></div>';
        }).join('');
        setCommentTotal(Math.max(commentsData.length, parseCount(comments)));

        root.querySelectorAll('.cdd-actions button[data-cdd-act]').forEach(function (b) {
            b.classList.remove('liked', 'saved');
        });

        root.classList.add('show');
        root.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        root.classList.remove('show');
        root.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    root.querySelector('.cdd-backdrop')?.addEventListener('click', close);
    root.querySelector('.cdd-close')?.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && root.classList.contains('show')) close();
    });

    root.querySelector('.cdd-actions')?.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-cdd-act]');
        if (!btn) return;
        var act = btn.getAttribute('data-cdd-act');
        if (act === 'like') {
            btn.classList.toggle('liked');
            var n = root.querySelector('#cddLikeCount');
            toast(btn.classList.contains('liked') ? '已点赞' : '已取消点赞');
        }
        if (act === 'save') {
            btn.classList.toggle('saved');
            toast(btn.classList.contains('saved') ? '已收藏' : '已取消收藏');
        }
        if (act === 'share') toast('链接已复制，可分享给好友');
        if (act === 'forward') toast('已打开转发面板（原型）');
        if (act === 'report') {
            var R = global.FL_ContentReport;
            if (!R) {
                toast('举报功能暂不可用');
                return;
            }
            var cid = (currentPayload && (currentPayload.id || currentPayload.contentId)) ||
                ('cdd-' + (currentPayload && currentPayload.title ? currentPayload.title : Date.now()));
            R.open({
                type: (currentPayload && currentPayload.kind === 'video') ? 'video' : 'image',
                contentId: String(cid),
                toast: toast,
                onDone: function () {
                    close();
                    var card = document.querySelector('[data-content-id="' + cid + '"], [data-post-id="' + cid + '"]');
                    if (card) card.remove();
                }
            });
        }
    });

    root.querySelector('#cddSendComment')?.addEventListener('click', function () {
        var inp = root.querySelector('#cddCommentInput');
        var val = (inp?.value || '').trim();
        if (!val) {
            toast('请输入评论内容');
            return;
        }
        var list = root.querySelector('#cddCommentList');
        var node = document.createElement('div');
        node.className = 'cdd-comment';
        node.innerHTML =
            '<div class="av" style="background-image:url(\'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80\')"></div>' +
            '<div class="txt"><span class="n">Luna 🌙</span><span class="c">' + val + '</span>' +
            '<div class="t">刚刚</div></div>';
        list.prepend(node);
        setCommentTotal(Number(root.getAttribute('data-comment-total') || 0) + 1);
        inp.value = '';
        toast('评论已发布');
    });

    global.FL_openContentDetail = open;
    global.FL_closeContentDetail = close;

    global.FL_openContentDetailFromCard = function (card) {
        if (!card) return;
        var titleEl = card.querySelector('.work-title');
        var thumb = card.querySelector('.work-thumb');
        var meta = card.querySelector('.thumb-meta');
        var likes = '1.2k';
        var comments = '128';
        if (meta) {
            var spans = meta.querySelectorAll('span');
            if (spans[0]) likes = spans[0].textContent.replace(/[^\d.kw]/gi, '').trim() || likes;
            if (spans[1]) comments = spans[1].textContent.replace(/[^\d.kw]/gi, '').trim() || comments;
        }
        var img = '';
        if (thumb) {
            var m = (thumb.style.backgroundImage || '').match(/url\(["']?([^"')]+)["']?\)/);
            if (m) img = m[1];
        }
        open({
            title: titleEl ? titleEl.textContent.trim() : '作品',
            image: img,
            desc: '来自个人主页作品列表 · 支持互动与评论。',
            likes: likes,
            comments: comments
        });
    };
    return true;
    }

    if (!initDrawer()) {
        document.addEventListener('DOMContentLoaded', initDrawer, { once: true });
    }
})(window);
