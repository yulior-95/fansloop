/**
 * Feed 帖子正文 · 超长折叠 + 更多 / 收起
 */
(function (global) {
    var CLAMP_LINES = 3;

    function measurePostText(box) {
        var inner = box.querySelector('.post-text-inner');
        var btn = box.querySelector('.post-text-toggle');
        if (!inner || !btn) return;

        if (box.classList.contains('is-expanded')) {
            box.classList.add('is-clampable');
            btn.hidden = false;
            btn.setAttribute('aria-expanded', 'true');
            return;
        }

        box.classList.remove('is-clampable');
        btn.hidden = true;
        btn.setAttribute('aria-expanded', 'false');

        var clampedH = inner.getBoundingClientRect().height;
        inner.classList.add('post-text-inner--full');
        var fullH = inner.scrollHeight;
        inner.classList.remove('post-text-inner--full');

        if (fullH > clampedH + 2) {
            box.classList.add('is-clampable');
            btn.hidden = false;
        }
    }

    function applyPostTextClamp(root) {
        root = root || document;
        root.querySelectorAll('.post-text--clampable').forEach(measurePostText);
    }

    function bindPostTextToggle() {
        if (global.__flPostTextToggleBound) return;
        global.__flPostTextToggleBound = true;

        document.addEventListener('click', function (e) {
            var btn = e.target.closest('.post-text-toggle');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            var box = btn.closest('.post-text--clampable');
            if (!box) return;
            var expanded = !box.classList.contains('is-expanded');
            box.classList.toggle('is-expanded', expanded);
            btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            if (!expanded) measurePostText(box);
        });
    }

    var resizeTimer;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            applyPostTextClamp();
        }, 120);
    }

    bindPostTextToggle();
    global.addEventListener('resize', onResize);
    global.FL_applyPostTextClamp = applyPostTextClamp;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            applyPostTextClamp();
        });
    } else {
        applyPostTextClamp();
    }
})(typeof window !== 'undefined' ? window : this);
