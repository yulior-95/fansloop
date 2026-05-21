/**
 * Feed 筛选侧栏 · 首页 / 游客首页
 */
(function () {
    var fd = document.getElementById('filterDrawer');
    var fm = document.getElementById('filterMask');
    var btn = document.getElementById('btnFeedFilter');
    if (!fd || !fm || !btn) return;

    function openFilter() {
        fd.classList.add('show');
        fm.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    function closeFilter() {
        fd.classList.remove('show');
        fm.classList.remove('show');
        document.body.style.overflow = '';
    }

    btn.addEventListener('click', openFilter);
    document.getElementById('filterClose')?.addEventListener('click', closeFilter);
    fm.addEventListener('click', closeFilter);
    document.getElementById('filterApply')?.addEventListener('click', function () {
        if (typeof window.toast === 'function') {
            window.toast('筛选条件已应用');
        }
        closeFilter();
    });
})();
