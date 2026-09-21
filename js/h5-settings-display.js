/**
 * H5 外观与语言 · 分段 Tab、字体档位、语言/时区 Sheet
 */
(function () {
    var FONT_LABELS = window.FLDisplayPrefs ? window.FLDisplayPrefs.FONT_LABELS : ['80%', '90%', '100%', '106%', '112%'];

    function $(id) { return document.getElementById(id); }

    function setTab(name) {
        document.querySelectorAll('[data-disp-tab]').forEach(function (btn) {
            var on = btn.getAttribute('data-disp-tab') === name;
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        document.querySelectorAll('[data-disp-panel]').forEach(function (panel) {
            var on = panel.getAttribute('data-disp-panel') === name;
            panel.classList.toggle('active', on);
            panel.hidden = !on;
        });
    }

    function syncFontSeg() {
        var slider = $('dispFontSlider');
        if (!slider) return;
        var idx = Number(slider.value);
        document.querySelectorAll('.disp-font-seg [data-font-idx]').forEach(function (btn) {
            btn.classList.toggle('on', Number(btn.getAttribute('data-font-idx')) === idx);
        });
    }

    function bindFontSeg() {
        document.querySelectorAll('.disp-font-seg [data-font-idx]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var slider = $('dispFontSlider');
                if (!slider) return;
                slider.value = btn.getAttribute('data-font-idx');
                slider.dispatchEvent(new Event('input', { bubbles: true }));
                slider.dispatchEvent(new Event('change', { bubbles: true }));
                syncFontSeg();
            });
        });
        var slider = $('dispFontSlider');
        if (slider) {
            slider.addEventListener('input', syncFontSeg);
            syncFontSeg();
        }
    }

    function openSheet(id) {
        var o = $(id);
        if (o) o.classList.add('open');
    }
    function closeSheet(id) {
        var o = $(id);
        if (o) o.classList.remove('open');
    }

    function bindSheets() {
        var langRow = $('dispLangRow');
        if (langRow) {
            langRow.addEventListener('click', function () { openSheet('dispLangSheet'); });
        }
        $('dispLangSheetClose')?.addEventListener('click', function () { closeSheet('dispLangSheet'); });
        $('dispLangSheet')?.addEventListener('click', function (e) {
            if (e.target.id === 'dispLangSheet') closeSheet('dispLangSheet');
        });

        var tzRow = $('dispTzRow');
        if (tzRow) {
            tzRow.addEventListener('click', function () { openSheet('dispTzSheet'); });
        }
        $('dispTzSheetClose')?.addEventListener('click', function () { closeSheet('dispTzSheet'); });
        $('dispTzSheet')?.addEventListener('click', function (e) {
            if (e.target.id === 'dispTzSheet') closeSheet('dispTzSheet');
        });
    }

    function syncLangSummary() {
        var el = $('dispLangSummary');
        if (!el) return;
        var on = document.querySelector('.lang-item.on .nm');
        el.textContent = on ? on.textContent : '简体中文';
    }

    function updateHeroTheme() {
        var p = window.FLDisplayPrefs ? window.FLDisplayPrefs.load() : { theme: 'dark' };
        var hero = $('dispHeroBg');
        if (!hero) return;
        var map = {
            dark: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80',
            light: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
            auto: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80'
        };
        var themeKey = p.theme || 'dark';
        if (themeKey !== 'dark' && themeKey !== 'light' && themeKey !== 'auto') {
            themeKey = 'dark';
        }
        hero.dataset.heroTheme = themeKey;
        hero.style.backgroundImage = "url('" + (map[themeKey] || map.dark) + "')";
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-disp-tab]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setTab(btn.getAttribute('data-disp-tab'));
            });
        });
        bindFontSeg();
        bindSheets();
        syncLangSummary();
        updateHeroTheme();

        document.addEventListener('goodfans-display-change', updateHeroTheme);
        document.addEventListener('goodfans-lang-change', syncLangSummary);
        document.querySelectorAll('.lang-item[data-lang]').forEach(function (item) {
            item.addEventListener('click', function () {
                setTimeout(syncLangSummary, 0);
            });
        });

        var hash = (location.hash || '').replace('#', '');
        if (hash === 'ga-global-access' || hash === 'access') setTab('access');
        else if (hash === 'lang') setTab('lang');
    });

    window.H5SettingsDisplay = {
        syncLangSummary: syncLangSummary,
        fontLabels: FONT_LABELS
    };
})();
