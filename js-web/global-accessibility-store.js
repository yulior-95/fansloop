/**
 * 跨国界无障碍 · 演示配置与 Mock 翻译（独立模块，不修改现有页面逻辑）
 */
(function (global) {
    var KEY = 'fl_global_accessibility_v1';

    var LANGS = [
        { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'ja', label: '日本語', flag: '🇯🇵' },
        { code: 'ko', label: '한국어', flag: '🇰🇷' },
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
        { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
        { code: 'ru', label: 'Русский', flag: '🇷🇺' },
        { code: 'ar', label: 'العربية', flag: '🇸🇦' },
        { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'th', label: 'ไทย', flag: '🇹🇭' }
    ];

    var DEFAULTS = {
        commLang: 'zh-CN',
        liveTranslateChat: true,
        liveSubtitle: false,
        chatAutoBoth: true,
        chatPreviewSend: false,
        displayMode: 'dual',
        wifiOnly: false
    };

    var MOCK_TABLE = {
        '这把太稳了，三连胜！': { en: 'So stable — three wins in a row!', ja: '安定しすぎ、3連勝！', ko: '너무 안정적이야, 3연승!' },
        '主播大佬走 A，这个角度可以打到他！': { en: 'Boss, push A — you can hit him from this angle!', ja: 'A行け、この角度なら当たる！', ko: 'A로 가면 이 각도에서 맞출 수 있어!' },
        '声音感觉有点小，可以调一下吗？': { en: 'Audio feels a bit low — can you turn it up?', ja: '音が小さい気がする、上げられる？', ko: '소리가 작은 것 같아, 키워줄 수 있어?' },
        '收到，刚刚调高了一点，现在能听清吗？': { en: 'Got it — just bumped volume. Can you hear me now?', ja: '了解、少し上げた。聞こえる？', ko: '알겠어, 방금 올렸어. 들리니?' },
        'Hi! Love your Fuji shots — which lens did you use?': {
            'zh-CN': '嗨！很喜欢你的富士山照片——用的什么镜头？',
            ja: '富士の写真素敵！どのレンズ？',
            ko: '후지 사진 너무 좋아! 어떤 렌즈 썼어?'
        },
        'Thanks! Mostly 35mm f/1.4 on Sony A7R IV 📷': {
            'zh-CN': '谢谢～主要是 Sony A7R IV 配 35mm f/1.4 定焦 📷',
            ja: 'ありがとう！35mm f/1.4 + A7R IV がメイン📷',
            ko: '고마워! A7R IV + 35mm f/1.4가 메인📷'
        },
        'Next month I might run a photo workshop — want an invite?': {
            'zh-CN': '下个月可能有摄影工作坊，要邀请你吗？',
            ja: '来月ワークショップやるかも、招待する？',
            ko: '다음 달 워크숍 할 수도 있어, 초대할까?'
        },
        'Yes please! 🙌': { 'zh-CN': '好的请务必！🙌', ja: 'ぜひお願い！🙌', ko: '꼭 부탁해! 🙌' }
    };

    function load() {
        try {
            var raw = localStorage.getItem(KEY);
            if (!raw) return Object.assign({}, DEFAULTS);
            return Object.assign({}, DEFAULTS, JSON.parse(raw));
        } catch (e) {
            return Object.assign({}, DEFAULTS);
        }
    }

    function save(partial) {
        var next = Object.assign(load(), partial || {});
        try {
            localStorage.setItem(KEY, JSON.stringify(next));
        } catch (e) { /* ignore */ }
        try {
            global.dispatchEvent(new CustomEvent('fl-accessibility-change', { detail: next }));
        } catch (e2) { /* ignore */ }
        return next;
    }

    function langLabel(code) {
        var L = LANGS.filter(function (x) { return x.code === code; })[0];
        return L ? L.label : code;
    }

    function mockTranslate(text, targetLang, sourceLang) {
        if (!text) return { text: '', sourceLang: sourceLang || 'auto' };
        var row = MOCK_TABLE[text];
        if (row && row[targetLang]) {
            return { text: row[targetLang], sourceLang: sourceLang || 'auto', mocked: true };
        }
        if (targetLang === 'zh-CN' && /[\u3040-\u30ff]/.test(text)) {
            return { text: '（演示译文）' + text, sourceLang: 'ja', mocked: true };
        }
        if (targetLang === 'zh-CN' && /^[A-Za-z]/.test(text.trim())) {
            return { text: '（演示译文）' + text, sourceLang: 'en', mocked: true };
        }
        if (targetLang === 'en' && /[\u4e00-\u9fff]/.test(text)) {
            return { text: '(Demo) ' + text, sourceLang: 'zh-CN', mocked: true };
        }
        return { text: text, sourceLang: sourceLang || 'auto', mocked: false };
    }

    global.FL_accessibilityStore = {
        KEY: KEY,
        LANGS: LANGS,
        DEFAULTS: DEFAULTS,
        load: load,
        save: save,
        langLabel: langLabel,
        mockTranslate: mockTranslate
    };
})(window);
