/**
 * 直播间 · 观众端跨国界无障碍（弹幕翻译 + 实时字幕）
 */
(function () {
    var S = window.FL_accessibilityStore;
    if (!S) return;

    var SUBTITLE = {
        main: '好的，我们下一局继续冲 A 点。',
        orig: 'Alright, next round we keep pushing A site.'
    };

    function $(id) { return document.getElementById(id); }

    function cfg() { return S.load(); }

    function toast(msg) {
        var el = $('ldToast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(el._gaTm);
        el._gaTm = setTimeout(function () { el.classList.remove('show'); }, 2400);
    }

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function applyChatTranslate() {
        var body = $('chatBody');
        if (!body) return;
        var c = cfg();
        var dual = c.displayMode !== 'translated-only';
        body.querySelectorAll('.chat-msg .text').forEach(function (textEl) {
            if (!textEl.dataset.gaOrig) textEl.dataset.gaOrig = textEl.innerHTML;
            var plain = textEl.textContent.trim();
            if (!c.liveTranslateChat) {
                textEl.innerHTML = textEl.dataset.gaOrig;
                return;
            }
            var tr = S.mockTranslate(plain, c.commLang, 'auto');
            if (tr.text === plain) {
                textEl.innerHTML = textEl.dataset.gaOrig;
                return;
            }
            var html = esc(tr.text) + ' <span class="ld-ga-tag">译</span>';
            if (dual) {
                html += '<span class="ld-ga-orig">' + esc(plain) + '</span>';
            }
            textEl.innerHTML = html;
        });
    }

    function applySubtitle() {
        var box = $('ldLiveSubtitle');
        if (!box) return;
        var c = cfg();
        if (!c.liveSubtitle) {
            box.hidden = true;
            return;
        }
        box.hidden = false;
        var tr = S.mockTranslate(SUBTITLE.orig, c.commLang, 'en');
        var main = $('ldSubMain');
        var orig = $('ldSubOrig');
        if (main) main.textContent = tr.text;
        if (orig) {
            orig.textContent = c.displayMode === 'dual' ? SUBTITLE.orig : '';
            orig.style.display = c.displayMode === 'dual' ? 'block' : 'none';
        }
    }

    function syncPanel() {
        var c = cfg();
        var chat = $('ldGaChatTranslate');
        var sub = $('ldGaLiveSubtitle');
        var sel = $('ldGaCommLang');
        if (chat) chat.checked = !!c.liveTranslateChat;
        if (sub) sub.checked = !!c.liveSubtitle;
        if (sel) sel.value = c.commLang;
        var btn = $('btnLdGaTranslate');
        if (btn) btn.classList.toggle('is-on', !!c.liveTranslateChat);
    }

    function bindPanel() {
        var sel = $('ldGaCommLang');
        if (sel && !sel.options.length) {
            sel.innerHTML = S.LANGS.map(function (L) {
                return '<option value="' + L.code + '">' + L.label + '</option>';
            }).join('');
        }
        $('ldGaChatTranslate')?.addEventListener('change', function () {
            S.save({ liveTranslateChat: this.checked });
            applyChatTranslate();
            syncPanel();
            toast(this.checked ? '已开启弹幕翻译' : '已关闭弹幕翻译');
        });
        $('ldGaLiveSubtitle')?.addEventListener('change', function () {
            S.save({ liveSubtitle: this.checked });
            applySubtitle();
            syncPanel();
            toast(this.checked ? '已开启实时字幕' : '已关闭实时字幕');
        });
        $('ldGaCommLang')?.addEventListener('change', function () {
            S.save({ commLang: this.value });
            applyChatTranslate();
            applySubtitle();
            toast('观看语言：' + S.langLabel(this.value));
        });
        $('btnLdGaTranslate')?.addEventListener('click', function (e) {
            e.stopPropagation();
            var c = cfg();
            S.save({ liveTranslateChat: !c.liveTranslateChat });
            applyChatTranslate();
            syncPanel();
        });
    }

    function init() {
        bindPanel();
        syncPanel();
        applyChatTranslate();
        applySubtitle();
        window.addEventListener('fl-accessibility-change', function () {
            syncPanel();
            applyChatTranslate();
            applySubtitle();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
