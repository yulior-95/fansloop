/**
 * 创作者主页 · 私信入口 → messages.html 新建/打开会话
 */
(function () {
    function getCreatorName() {
        var h1 = document.querySelector('.cp-info-card .info h1');
        if (!h1) return 'Luna 🌙';
        var clone = h1.cloneNode(true);
        clone.querySelectorAll('.cp-tags-row, .cp-av-badge').forEach(function (n) { n.remove(); });
        return (clone.textContent || 'Luna 🌙').trim();
    }

    function init() {
        var btnDm = document.getElementById('cpBtnDm');
        if (btnDm) {
            btnDm.addEventListener('click', function () {
                var name = getCreatorName();
                location.href = 'messages.html?peer=' + encodeURIComponent(name) + '&from=profile&tab=dm';
            });
        }

        var btnFollow = document.getElementById('cpBtnFollow');
        if (btnFollow) {
            btnFollow.addEventListener('click', function () {
                var followed = btnFollow.classList.toggle('is-followed');
                var icon = btnFollow.querySelector('i');
                var label = btnFollow.querySelector('span');
                if (icon) icon.className = followed ? 'fa-solid fa-bell' : 'fa-regular fa-bell';
                if (label) label.textContent = followed ? '已关注' : '关注';
            });
        }

        var btnTip = document.getElementById('cpBtnTip');
        if (btnTip && global.FL_buildGiftModalUrl) {
            var giftUrl = global.FL_buildGiftModalUrl({
                ctx: 'profile',
                creator: getCreatorName(),
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
                tags: '摄影师 · 旅行',
                lv: '7'
            });
            btnTip.setAttribute('data-gift-url', giftUrl);
            btnTip.addEventListener('click', function () {
                if (typeof global.FL_openGiftModal === 'function') {
                    global.FL_openGiftModal(btnTip);
                    return;
                }
                if (typeof global.FL_openInteractionModal === 'function') {
                    global.FL_openInteractionModal(giftUrl);
                    return;
                }
                global.location.href = giftUrl;
            });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})(typeof window !== 'undefined' ? window : this);
