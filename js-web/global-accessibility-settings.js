(function () {
    var S = window.FL_accessibilityStore;
    if (!S) return;

    function $(id) { return document.getElementById(id); }

    function bindSwitch(id, key) {
        var el = $(id);
        if (!el) return;
        el.addEventListener('click', function () {
            el.classList.toggle('on');
            var patch = {};
            patch[key] = el.classList.contains('on');
            S.save(patch);
            toast('已保存');
        });
    }

    function toast(msg) {
        var t = $('gaToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(t._tm);
        t._tm = setTimeout(function () { t.classList.remove('show'); }, 2200);
    }

    function render() {
        var cfg = S.load();
        var sel = $('gaCommLang');
        if (sel) {
            sel.innerHTML = S.LANGS.map(function (L) {
                return '<option value="' + L.code + '"' + (L.code === cfg.commLang ? ' selected' : '') + '>' +
                    L.flag + ' ' + L.label + '</option>';
            }).join('');
        }
        var map = {
            swLiveChat: cfg.liveTranslateChat,
            swChatBoth: cfg.chatAutoBoth,
            swChatPreview: cfg.chatPreviewSend,
            swWifi: cfg.wifiOnly
        };
        Object.keys(map).forEach(function (id) {
            var el = $(id);
            if (el) el.classList.toggle('on', !!map[id]);
        });
        var dm = $('gaDisplayMode');
        if (dm) dm.value = cfg.displayMode || 'dual';
    }

    function init() {
        render();
        bindSwitch('swLiveChat', 'liveTranslateChat');
        bindSwitch('swChatBoth', 'chatAutoBoth');
        bindSwitch('swChatPreview', 'chatPreviewSend');
        bindSwitch('swWifi', 'wifiOnly');

        $('gaCommLang')?.addEventListener('change', function () {
            S.save({ commLang: this.value });
            toast('沟通语言已设为 ' + S.langLabel(this.value));
        });
        $('gaDisplayMode')?.addEventListener('change', function () {
            S.save({ displayMode: this.value });
            toast('显示偏好已更新');
        });
        $('btnGaReset')?.addEventListener('click', function () {
            if (!window.confirm('恢复默认无障碍设置？')) return;
            localStorage.removeItem(S.KEY);
            render();
            toast('已恢复默认');
        });
    }

    function openDemo(url) {
        if (!url) return;
        try {
            if (window.top && window.top !== window) window.top.open(url, '_blank', 'noopener');
            else window.open(url, '_blank', 'noopener');
        } catch (e) {
            window.location.href = url;
        }
    }

    function setGaNavActive(onGa) {
        var navLang = document.getElementById('navDisplayLang');
        var navGa = document.getElementById('navGaGlobal');
        if (!navLang || !navGa) return;
        navLang.classList.toggle('active', !onGa);
        navGa.classList.toggle('active', !!onGa);
    }

    function scrollToGa() {
        var el = document.getElementById('ga-global-access');
        var grid = document.querySelector('.set-grid');
        if (grid && el) {
            var top = el.offsetTop - 12;
            grid.scrollTo({ top: top, behavior: 'smooth' });
        } else if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (location.hash !== '#ga-global-access') {
            try { history.replaceState(null, '', '#ga-global-access'); } catch (e) { location.hash = 'ga-global-access'; }
        }
        setGaNavActive(true);
    }

    function bindSettingsDisplayNav() {
        var navGa = document.getElementById('navGaGlobal');
        if (!navGa) return;

        function goGa(e) {
            if (e) e.preventDefault();
            scrollToGa();
        }
        navGa.addEventListener('click', goGa);
        navGa.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goGa(); }
        });

        var anchor = document.getElementById('ga-global-access');
        var grid = document.querySelector('.set-grid');
        if (anchor && grid && 'IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (en.target.id !== 'ga-global-access') return;
                    if (en.isIntersecting && en.intersectionRatio > 0.15) setGaNavActive(true);
                    else if (grid.scrollTop < 80) setGaNavActive(false);
                });
            }, { root: grid, threshold: [0, 0.15, 0.4] });
            io.observe(anchor);
            grid.addEventListener('scroll', function () {
                if (grid.scrollTop < 40 && location.hash !== '#ga-global-access') setGaNavActive(false);
            });
        }

        document.querySelectorAll('[data-ga-demo-open]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openDemo(btn.getAttribute('data-ga-demo-open'));
            });
        });
    }

    function scrollToHash() {
        if (location.hash === '#ga-global-access') {
            setTimeout(scrollToGa, 150);
        } else {
            setGaNavActive(false);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            init();
            bindSettingsDisplayNav();
            scrollToHash();
        });
    } else {
        init();
        bindSettingsDisplayNav();
        scrollToHash();
    }
    window.addEventListener('hashchange', scrollToHash);
})();
