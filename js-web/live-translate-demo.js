(function () {
    var S = window.FL_accessibilityStore;
    if (!S) return;

    var CHAT_SEED = [
        { user: 'Aria', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80', text: '这把太稳了，三连胜！', lang: 'zh-CN' },
        { user: 'Maya', av: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=80', text: '主播大佬走 A，这个角度可以打到他！', lang: 'zh-CN' },
        { user: 'Echo', av: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80', text: '声音感觉有点小，可以调一下吗？', lang: 'zh-CN' },
        { user: 'NovaPlay', av: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80', text: '收到，刚刚调高了一点，现在能听清吗？', lang: 'zh-CN', host: true },
        { user: 'Ken', av: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80', text: 'Nice clutch! That was insane 🔥', lang: 'en' }
    ];

    var SUBTITLE = {
        main: '好的，我们下一局继续冲 A 点。',
        orig: 'Alright, next round we keep pushing A site.',
        lang: 'en'
    };

    function $(id) { return document.getElementById(id); }

    function cfg() { return S.load(); }

    function toast(msg) {
        var t = $('ltToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(t._tm);
        t._tm = setTimeout(function () { t.classList.remove('show'); }, 2400);
    }

    function renderChat() {
        var body = $('ltChatBody');
        if (!body) return;
        var c = cfg();
        var target = c.commLang;
        var dual = c.displayMode !== 'translated-only';
        body.innerHTML = CHAT_SEED.map(function (m) {
            var tr = S.mockTranslate(m.text, target, m.lang);
            var showOrig = dual && tr.text !== m.text;
            return '<div class="lt-chat-msg" data-translated="' + (c.liveTranslateChat ? '1' : '0') + '">' +
                '<div class="av" style="background-image:url(\'' + m.av + '\')"></div>' +
                '<div class="body"><span class="nm">' + m.user + (m.host ? ' <span class="ga-badge">主播</span>' : '') + '</span>' +
                '<div class="tx-main">' + (c.liveTranslateChat ? esc(tr.text) : esc(m.text)) +
                (c.liveTranslateChat ? ' <span class="ga-badge"><i class="fa-solid fa-language"></i> 译</span>' : '') + '</div>' +
                (showOrig && c.liveTranslateChat ? '<div class="tx-orig">' + esc(m.text) + '</div>' : '') +
                '</div></div>';
        }).join('');
        body.scrollTop = body.scrollHeight;
    }

    function renderSubtitle() {
        var box = $('ltSubtitle');
        if (!box) return;
        var c = cfg();
        if (!c.liveSubtitle) {
            box.hidden = true;
            return;
        }
        box.hidden = false;
        var tr = S.mockTranslate(SUBTITLE.orig, c.commLang, 'en');
        $('ltSubMain').textContent = tr.text;
        $('ltSubOrig').textContent = c.displayMode === 'dual' ? SUBTITLE.orig : '';
        $('ltSubOrig').style.display = c.displayMode === 'dual' ? 'block' : 'none';
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function syncToolbar() {
        var c = cfg();
        $('btnLtTranslate')?.classList.toggle('on', c.liveTranslateChat);
        $('ltLangBadge').textContent = S.langLabel(c.commLang);
    }

    function openPanel() {
        $('ltPanel')?.classList.add('open');
        $('ltBackdrop')?.classList.add('show');
    }
    function closePanel() {
        $('ltPanel')?.classList.remove('open');
        $('ltBackdrop')?.classList.remove('show');
    }

    function bindPanelControls() {
        var c = cfg();
        var sel = $('pCommLang');
        if (sel && !sel.options.length) {
            sel.innerHTML = S.LANGS.map(function (L) {
                return '<option value="' + L.code + '">' + L.flag + ' ' + L.label + '</option>';
            }).join('');
        }
        if (sel) sel.value = c.commLang;
        $('pLiveChat')?.classList.toggle('on', c.liveTranslateChat);
        $('pLiveSub')?.classList.toggle('on', c.liveSubtitle);
        var pd = $('pDisplay');
        if (pd) pd.value = c.displayMode;
    }

    function init() {
        bindPanelControls();
        renderChat();
        renderSubtitle();
        syncToolbar();

        $('btnLtTranslate')?.addEventListener('click', function () {
            var c = cfg();
            S.save({ liveTranslateChat: !c.liveTranslateChat });
            renderChat();
            syncToolbar();
            bindPanelControls();
            toast(cfg().liveTranslateChat ? '已开启弹幕翻译' : '已关闭弹幕翻译');
        });
        $('btnLtAccess')?.addEventListener('click', openPanel);
        $('ltBackdrop')?.addEventListener('click', closePanel);
        $('btnLtPanelClose')?.addEventListener('click', closePanel);

        $('pCommLang')?.addEventListener('change', function () {
            S.save({ commLang: this.value });
            renderChat();
            renderSubtitle();
            syncToolbar();
            toast('观看语言：' + S.langLabel(this.value));
        });
        $('pLiveChat')?.addEventListener('click', function () {
            this.classList.toggle('on');
            S.save({ liveTranslateChat: this.classList.contains('on') });
            renderChat();
            syncToolbar();
        });
        $('pLiveSub')?.addEventListener('click', function () {
            this.classList.toggle('on');
            S.save({ liveSubtitle: this.classList.contains('on') });
            renderSubtitle();
            syncToolbar();
        });
        $('pDisplay')?.addEventListener('change', function () {
            S.save({ displayMode: this.value });
            renderChat();
            renderSubtitle();
        });

        window.addEventListener('fl-accessibility-change', function () {
            renderChat();
            renderSubtitle();
            syncToolbar();
            bindPanelControls();
        });

        if (/autoPanel=1/.test(location.search)) setTimeout(openPanel, 400);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
