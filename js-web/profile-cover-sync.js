/**
 * 将封面同步到带 data-profile-cover 的元素
 */
(function (global) {
    function cssUrl(url) {
        return 'url("' + String(url).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")';
    }

    function paint(url) {
        if (!url) return;
        document.querySelectorAll('[data-profile-cover]').forEach(function (el) {
            if (el.tagName === 'IMG') {
                el.src = url;
            } else {
                el.style.backgroundImage = cssUrl(url);
            }
        });
    }

    function apply() {
        if (!global.FLProfileCoverStore) return;
        paint(global.FLProfileCoverStore.get());
    }

    global.FLProfileCoverSync = { apply: apply, paint: paint };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply);
    } else {
        apply();
    }

    global.addEventListener('fl-profile-cover-change', function (e) {
        var url = e.detail && e.detail.url;
        if (url) paint(url);
        else apply();
    });

    global.addEventListener('goodfans-auth-change', apply);
})(typeof window !== 'undefined' ? window : this);
