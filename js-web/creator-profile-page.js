/**
 * 创作者主页 · 私信入口 → messages.html 新建/打开会话
 */
(function () {
    function getCreatorName() {
        var h1 = document.querySelector('.cp-info-card .info h1');
        if (!h1) return 'Luna 🌙';
        var clone = h1.cloneNode(true);
        clone.querySelectorAll('.vfd, .pro').forEach(function (n) { n.remove(); });
        return (clone.textContent || 'Luna 🌙').trim();
    }

    function init() {
        var btn = document.getElementById('cpBtnDm');
        if (!btn) return;
        btn.addEventListener('click', function () {
            var name = getCreatorName();
            location.href = 'messages.html?peer=' + encodeURIComponent(name) + '&from=profile&tab=dm';
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
