(function () {
    var S = window.FL_accessibilityStore;
    if (!S) return;

    var PEER = { name: 'Lens 旅记', lang: 'en', av: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120' };
    var MY_LANG = function () { return S.load().commLang; };

    var messages = [
        { from: 'them', text: 'Hi! Love your Fuji shots — which lens did you use?', lang: 'en', time: '14:02' },
        { from: 'me', text: 'Thanks! Mostly 35mm f/1.4 on Sony A7R IV 📷', lang: 'en', time: '14:05' },
        { from: 'them', text: 'Next month I might run a photo workshop — want an invite?', lang: 'en', time: '14:08' }
    ];

    function $(id) { return document.getElementById(id); }

    function toast(msg) {
        var t = $('mtToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(t._tm);
        t._tm = setTimeout(function () { t.classList.remove('show'); }, 2400);
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function bubbleHtml(m) {
        var cfg = S.load();
        var myLang = MY_LANG();
        var viewerLang = myLang;
        var peerLang = PEER.lang;
        var displayText = m.text;
        var origText = '';
        var showTag = false;

        if (m.from === 'them' && cfg.chatAutoBoth) {
            var tr = S.mockTranslate(m.text, viewerLang, m.lang);
            displayText = tr.text;
            origText = m.text;
            showTag = tr.text !== m.text;
        }
        if (m.from === 'me' && cfg.chatAutoBoth) {
            var tr2 = S.mockTranslate(m.text, peerLang, m.lang);
            displayText = m.text;
            origText = tr2.text !== m.text ? tr2.text : '';
            showTag = !!origText;
        }

        var dual = cfg.displayMode !== 'translated-only';
        var inner = esc(displayText) + (showTag ? '<span class="tag-trans">译</span>' : '');
        if (dual && origText) inner += '<div class="tx-orig">' + esc(origText) + '</div>';
        return '<div class="mt-row ' + m.from + '"><div class="mt-bub">' + inner + '</div></div>';
    }

    function renderMsgs() {
        var box = $('mtMsgs');
        if (!box) return;
        box.innerHTML = messages.map(bubbleHtml).join('');
        box.scrollTop = box.scrollHeight;
    }

    function updateBanner() {
        var cfg = S.load();
        var b = $('mtBanner');
        if (!b) return;
        if (!cfg.chatAutoBoth) {
            b.innerHTML = '<span><i class="fa-solid fa-language"></i> 无障碍聊天已关闭</span>';
            return;
        }
        var peerLabel = S.langLabel(PEER.lang);
        b.innerHTML = '<span><i class="fa-solid fa-earth-americas"></i> 无障碍聊天已开启 · 对方将看到 <strong>' + peerLabel + '</strong></span>' +
            '<a href="settings-global-access.html" style="font-size:11px;color:#93C5FD">设置</a>';
    }

    function updatePreview() {
        var cfg = S.load();
        var ta = $('mtInput');
        var prev = $('mtPreview');
        if (!ta || !prev) return;
        if (!cfg.chatPreviewSend || !cfg.chatAutoBoth) {
            prev.classList.remove('show');
            return;
        }
        var raw = ta.value.trim();
        if (!raw) {
            prev.classList.remove('show');
            return;
        }
        var tr = S.mockTranslate(raw, PEER.lang, MY_LANG());
        prev.innerHTML = '对方将看到（' + S.langLabel(PEER.lang) + '）：<strong>' + esc(tr.text) + '</strong>';
        prev.classList.add('show');
    }

    function send() {
        var ta = $('mtInput');
        if (!ta || !ta.value.trim()) return;
        var text = ta.value.trim();
        messages.push({ from: 'me', text: text, lang: MY_LANG(), time: '刚刚' });
        ta.value = '';
        $('mtPreview')?.classList.remove('show');
        renderMsgs();
        toast('已发送（演示：对方收到 ' + S.langLabel(PEER.lang) + ' 译文）');
    }

    function init() {
        renderMsgs();
        updateBanner();

        $('mtInput')?.addEventListener('input', updatePreview);
        $('btnMtSend')?.addEventListener('click', send);
        $('mtInput')?.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        });

        window.addEventListener('fl-accessibility-change', function () {
            renderMsgs();
            updateBanner();
            updatePreview();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
