(function () {

    var S = window.FL_accessibilityStore;

    if (!S) return;



    var DISPLAY_MODES = [

        { id: 'dual', label: '译文 + 原文对照', desc: '对照阅读，适合学习外语', icon: 'fa-solid fa-columns' },

        { id: 'translated-only', label: '仅显示译文', desc: '界面更简洁', icon: 'fa-solid fa-language' },

        { id: 'tap-original', label: '默认译文，点击看原文', desc: '节省空间，按需展开', icon: 'fa-solid fa-hand-pointer' }

    ];



    var DEMO_TITLES = {

        'live-translate-demo.html': '直播翻译演示',

        'messages-translate-demo.html': '私信翻译演示',

        'live-detail.html': '正式直播页'

    };



    function $(id) { return document.getElementById(id); }



    function closeAllGaDd(except) {

        document.querySelectorAll('.ga-dd.open').forEach(function (el) {

            if (el !== except) {

                el.classList.remove('open');

                var t = el.querySelector('.ga-dd-trigger');

                if (t) t.setAttribute('aria-expanded', 'false');

            }

        });

    }



    function renderTrigger(trigger, opt, type) {

        if (!trigger || !opt) return;

        if (type === 'lang') {

            trigger.innerHTML =

                '<span class="flag">' + opt.flag + '</span>' +

                '<span class="mid"><span class="n">' + opt.label + '</span><span class="d">' + opt.code + '</span></span>' +

                '<i class="fa-solid fa-chevron-down chev" aria-hidden="true"></i>';

        } else {

            trigger.innerHTML =

                '<span class="flag icon"><i class="' + opt.icon + '"></i></span>' +

                '<span class="mid"><span class="n">' + opt.label + '</span><span class="d">' + opt.desc + '</span></span>' +

                '<i class="fa-solid fa-chevron-down chev" aria-hidden="true"></i>';

        }

    }



    function renderLangDd(wrap, value) {

        if (!wrap) return;

        var trigger = wrap.querySelector('.ga-dd-trigger');

        var list = wrap.querySelector('.ga-dd-list') || (function () {

            var panel = wrap.querySelector('.ga-dd-panel');

            var ul = document.createElement('div');

            ul.className = 'ga-dd-list';

            panel.appendChild(ul);

            return ul;

        })();



        var current = S.LANGS.filter(function (L) { return L.code === value; })[0] || S.LANGS[0];

        renderTrigger(trigger, { flag: current.flag, label: current.label, code: current.code }, 'lang');



        list.innerHTML = S.LANGS.map(function (L) {

            var sel = L.code === value ? ' selected' : '';

            return '<button type="button" class="ga-dd-item' + sel + '" data-value="' + L.code + '" role="option" aria-selected="' + (sel ? 'true' : 'false') + '">' +

                '<span class="flag">' + L.flag + '</span>' +

                '<span class="mid"><span class="n">' + L.label + '</span><span class="d">' + L.code + '</span></span>' +

                '<i class="fa-solid fa-check tick" aria-hidden="true"></i>' +

                '</button>';

        }).join('');

    }



    function renderDisplayModeDd(wrap, value) {

        if (!wrap) return;

        var trigger = wrap.querySelector('.ga-dd-trigger');

        var list = wrap.querySelector('.ga-dd-list') || (function () {

            var panel = wrap.querySelector('.ga-dd-panel');

            var ul = document.createElement('div');

            ul.className = 'ga-dd-list';

            panel.appendChild(ul);

            return ul;

        })();



        var current = DISPLAY_MODES.filter(function (m) { return m.id === value; })[0] || DISPLAY_MODES[0];

        renderTrigger(trigger, current, 'mode');



        list.innerHTML = DISPLAY_MODES.map(function (m) {

            var sel = m.id === value ? ' selected' : '';

            return '<button type="button" class="ga-dd-item' + sel + '" data-value="' + m.id + '" role="option" aria-selected="' + (sel ? 'true' : 'false') + '">' +

                '<span class="flag icon"><i class="' + m.icon + '"></i></span>' +

                '<span class="mid"><span class="n">' + m.label + '</span><span class="d">' + m.desc + '</span></span>' +

                '<i class="fa-solid fa-check tick" aria-hidden="true"></i>' +

                '</button>';

        }).join('');

    }



    function bindGaDd(wrap, onPick) {

        if (!wrap || wrap.getAttribute('data-ga-dd-bound')) return;

        wrap.setAttribute('data-ga-dd-bound', '1');

        var trigger = wrap.querySelector('.ga-dd-trigger');



        trigger.addEventListener('click', function (e) {

            e.stopPropagation();

            var open = wrap.classList.contains('open');

            closeAllGaDd(open ? null : wrap);

            wrap.classList.toggle('open', !open);

            trigger.setAttribute('aria-expanded', !open ? 'true' : 'false');

        });



        wrap.addEventListener('click', function (e) {

            var item = e.target.closest('.ga-dd-item');

            if (!item) return;

            e.stopPropagation();

            var val = item.getAttribute('data-value');

            wrap.classList.remove('open');

            trigger.setAttribute('aria-expanded', 'false');

            onPick(val, wrap);

        });

        var panel = wrap.querySelector('.ga-dd-panel');

        if (panel) panel.addEventListener('click', function (e) { e.stopPropagation(); });

    }



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

        renderLangDd($('gaCommLangDd'), cfg.commLang);

        renderDisplayModeDd($('gaDisplayModeDd'), cfg.displayMode || 'dual');



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

    }



    function closeDemoModal() {

        var overlay = $('gaDemoOverlay');

        var frame = $('gaDemoFrame');

        if (!overlay) return;

        overlay.classList.remove('show');

        overlay.setAttribute('aria-hidden', 'true');

        document.body.style.overflow = '';

        if (frame) {

            setTimeout(function () { frame.src = 'about:blank'; }, 280);

        }

    }



    function openDemoModal(url, title) {

        var overlay = $('gaDemoOverlay');

        var frame = $('gaDemoFrame');

        var titleEl = $('gaDemoTitle');

        if (!overlay || !frame) {

            window.open(url, '_blank', 'noopener');

            return;

        }

        if (titleEl) titleEl.textContent = title || DEMO_TITLES[url] || '演示';

        frame.src = url;

        overlay.classList.add('show');

        overlay.setAttribute('aria-hidden', 'false');

        document.body.style.overflow = 'hidden';

    }



    function init() {

        render();



        bindGaDd($('gaCommLangDd'), function (code) {

            S.save({ commLang: code });

            renderLangDd($('gaCommLangDd'), code);

            toast('沟通语言已设为 ' + S.langLabel(code));

        });



        bindGaDd($('gaDisplayModeDd'), function (mode) {

            S.save({ displayMode: mode });

            renderDisplayModeDd($('gaDisplayModeDd'), mode);

            toast('显示偏好已更新');

        });



        document.addEventListener('click', function () { closeAllGaDd(); });



        bindSwitch('swLiveChat', 'liveTranslateChat');

        bindSwitch('swChatBoth', 'chatAutoBoth');

        bindSwitch('swChatPreview', 'chatPreviewSend');

        bindSwitch('swWifi', 'wifiOnly');



        $('btnGaReset')?.addEventListener('click', function () {

            if (!window.confirm('恢复默认无障碍设置？')) return;

            localStorage.removeItem(S.KEY);

            render();

            toast('已恢复默认');

        });



        document.querySelectorAll('[data-ga-demo-open]').forEach(function (btn) {

            btn.addEventListener('click', function () {

                var url = btn.getAttribute('data-ga-demo-open');

                var title = btn.getAttribute('data-ga-demo-title') || DEMO_TITLES[url] || '演示';

                openDemoModal(url, title);

            });

        });



        $('gaDemoClose')?.addEventListener('click', closeDemoModal);

        $('gaDemoOverlay')?.addEventListener('click', function (e) {

            if (e.target === $('gaDemoOverlay')) closeDemoModal();

        });

        document.addEventListener('keydown', function (e) {

            if (e.key === 'Escape') closeDemoModal();

        });

    }



    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', init);

    } else {

        init();

    }

})();


