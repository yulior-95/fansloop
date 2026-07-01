/**
 * FansLoop · 全局语言切换（挂载到 .app-header 或悬浮）
 * 字典：仅翻译常见界面词；各页可用 data-i18n-global="key" 扩展。
 */
(function (global) {
    var STORAGE = 'fansloop-ui-lang';

    var LANGS = [
        { code: 'zh-CN', label: '简体中文', native: '中文' },
        { code: 'zh-TW', label: '繁體中文', native: '繁' },
        { code: 'en', label: 'English', native: 'English' },
        { code: 'ja', label: '日本語', native: 'JA' },
        { code: 'ko', label: '한국어', native: 'KO' },
        { code: 'es', label: 'Español', native: 'ES' },
        { code: 'fr', label: 'Français', native: 'FR' },
        { code: 'de', label: 'Deutsch', native: 'DE' },
        { code: 'pt-BR', label: 'Português (BR)', native: 'PT' },
        { code: 'ru', label: 'Русский', native: 'RU' },
        { code: 'ar', label: 'العربية', native: 'AR' },
        { code: 'hi', label: 'हिन्दी', native: 'HI' },
        { code: 'id', label: 'Bahasa Indonesia', native: 'ID' },
        { code: 'vi', label: 'Tiếng Việt', native: 'VI' },
        { code: 'th', label: 'ไทย', native: 'TH' },
        { code: 'tr', label: 'Türkçe', native: 'TR' },
        { code: 'it', label: 'Italiano', native: 'IT' }
    ];

    var DICT = {
        'zh-CN': {
            search: '搜索', login: '登录', signup: '注册', home: '首页', settings: '设置',
            lang_title: '界面语言', recharge: '充值',
            nav_section_main: '主导航', nav_section_interact: '互动', nav_section_assets: '资产', nav_section_personal: '个人',
            nav_home: '首页', nav_subscriptions: '订阅', nav_discover: '发现', nav_create: '创建内容',
            nav_messages: '消息', nav_notifications: '通知', nav_wallet: '钱包', nav_creator_income: '创作者收入',
            nav_points_mall: '积分商城', nav_transactions: '账变记录', nav_profile: '我的主页', nav_settings: '设置'
        },
        'zh-TW': {
            search: '搜尋', login: '登入', signup: '註冊', home: '首頁', settings: '設定',
            lang_title: '介面語言', recharge: '充值',
            nav_section_main: '主導航', nav_section_interact: '互動', nav_section_assets: '資產', nav_section_personal: '個人',
            nav_home: '首頁', nav_subscriptions: '訂閱', nav_discover: '發現', nav_create: '創建內容',
            nav_messages: '訊息', nav_notifications: '通知', nav_wallet: '錢包', nav_creator_income: '創作者收入',
            nav_points_mall: '積分商城', nav_transactions: '帳變記錄', nav_profile: '我的主頁', nav_settings: '設定'
        },
        en: {
            search: 'Search', login: 'Sign in', signup: 'Sign up', home: 'Home', settings: 'Settings',
            lang_title: 'Language', recharge: 'Top up',
            nav_section_main: 'Main', nav_section_interact: 'Social', nav_section_assets: 'Assets', nav_section_personal: 'Account',
            nav_home: 'Home', nav_subscriptions: 'Subscriptions', nav_discover: 'Discover', nav_create: 'Create',
            nav_messages: 'Messages', nav_notifications: 'Notifications', nav_wallet: 'Wallet', nav_creator_income: 'Creator income',
            nav_points_mall: 'Points mall', nav_transactions: 'Transactions', nav_profile: 'My profile', nav_settings: 'Settings'
        },
        ja: {
            search: '検索', login: 'ログイン', signup: '登録', home: 'ホーム', settings: '設定',
            lang_title: '表示言語'
        },
        ko: {
            search: '검색', login: '로그인', signup: '가입', home: '홈', settings: '설정',
            lang_title: '언어'
        },
        es: {
            search: 'Buscar', login: 'Entrar', signup: 'Registro', home: 'Inicio', settings: 'Ajustes',
            lang_title: 'Idioma'
        },
        fr: {
            search: 'Rechercher', login: 'Connexion', signup: 'Inscription', home: 'Accueil', settings: 'Réglages',
            lang_title: 'Langue'
        },
        de: {
            search: 'Suchen', login: 'Anmelden', signup: 'Registrieren', home: 'Start', settings: 'Einstellungen',
            lang_title: 'Sprache'
        },
        'pt-BR': {
            search: 'Buscar', login: 'Entrar', signup: 'Cadastro', home: 'Início', settings: 'Configurações',
            lang_title: 'Idioma'
        },
        ru: {
            search: 'Поиск', login: 'Войти', signup: 'Регистрация', home: 'Главная', settings: 'Настройки',
            lang_title: 'Язык'
        },
        ar: {
            search: 'بحث', login: 'دخول', signup: 'تسجيل', home: 'الرئيسية', settings: 'الإعدادات',
            lang_title: 'اللغة'
        },
        hi: {
            search: 'खोज', login: 'लॉग इन', signup: 'साइन अप', home: 'होम', settings: 'सेटिंग्स',
            lang_title: 'भाषा'
        },
        id: {
            search: 'Cari', login: 'Masuk', signup: 'Daftar', home: 'Beranda', settings: 'Pengaturan',
            lang_title: 'Bahasa'
        },
        vi: {
            search: 'Tìm', login: 'Đăng nhập', signup: 'Đăng ký', home: 'Trang chủ', settings: 'Cài đặt',
            lang_title: 'Ngôn ngữ'
        },
        th: {
            search: 'ค้นหา', login: 'เข้าสู่ระบบ', signup: 'สมัคร', home: 'หน้าแรก', settings: 'ตั้งค่า',
            lang_title: 'ภาษา'
        },
        tr: {
            search: 'Ara', login: 'Giriş', signup: 'Kayıt', home: 'Ana sayfa', settings: 'Ayarlar',
            lang_title: 'Dil'
        },
        it: {
            search: 'Cerca', login: 'Accedi', signup: 'Registrati', home: 'Home', settings: 'Impostazioni',
            lang_title: 'Lingua'
        }
    };

    function getLang() {
        var stored = localStorage.getItem(STORAGE);
        if (stored) {
            var exact = LANGS.find(function (l) { return l.code === stored; });
            if (exact) return exact.code;
        }
        var nav = navigator.language || 'zh-CN';
        var hit = LANGS.find(function (l) {
            return l.code === nav || l.code.toLowerCase() === nav.toLowerCase();
        });
        if (!hit) {
            var base = nav.split('-')[0].toLowerCase();
            if (base === 'zh') return nav.toLowerCase().indexOf('tw') >= 0 || nav.toLowerCase().indexOf('hk') >= 0 ? 'zh-TW' : 'zh-CN';
            hit = LANGS.find(function (l) { return l.code.split('-')[0].toLowerCase() === base; });
        }
        return hit ? hit.code : 'zh-CN';
    }

    function applyDict(code) {
        if (global.FLI18n && global.FLI18n.applyAll) {
            global.FLI18n.applyAll(code);
        } else {
            var d = DICT[code] || DICT.en || DICT['zh-CN'];
            document.querySelectorAll('[data-i18n-global]').forEach(function (el) {
                var k = el.getAttribute('data-i18n-global');
                if (d[k]) el.textContent = d[k];
            });
            document.querySelectorAll('input[type="search"][data-i18n-ph-global]').forEach(function (inp) {
                var k = inp.getAttribute('data-i18n-ph-global');
                if (d[k]) inp.placeholder = d[k];
            });
        }
        if (global.FL_applySidebarI18n) global.FL_applySidebarI18n(code);
        if (global.FL_applySettingsNavI18n) global.FL_applySettingsNavI18n(code);
        if (global.FL_applySettingsAppHeader) global.FL_applySettingsAppHeader(code);
    }

    function setLang(code) {
        localStorage.setItem(STORAGE, code);
        document.documentElement.lang = code;
        document.documentElement.dir = (code === 'ar') ? 'rtl' : 'ltr';
        applyDict(code);
        document.dispatchEvent(new CustomEvent('fansloop-lang-change', { detail: { code: code } }));
    }

    function buildMount() {
        if (document.getElementById('fansloop-lang-root')) return;

        var code = getLang();
        document.documentElement.lang = code;
        document.documentElement.dir = (code === 'ar') ? 'rtl' : 'ltr';

        var wrap = document.createElement('div');
        wrap.id = 'fansloop-lang-root';
        wrap.className = 'fansloop-lang-mount';
        wrap.innerHTML =
            '<button type="button" class="lang-trigger" id="fansloopLangBtn" aria-expanded="false" title="">' +
            '<i class="fa-solid fa-language"></i><span class="lbl"></span><i class="fa-solid fa-chevron-down chev"></i></button>' +
            '<div class="fansloop-lang-dd" id="fansloopLangDd" role="listbox"></div>';

        var header = document.querySelector('.app-header');
        if (header) {
            var ha = header.querySelector('.h-actions');
            if (ha) ha.insertBefore(wrap, ha.firstChild);
            else header.appendChild(wrap);
        } else {
            wrap.classList.add('is-floating');
            document.body.appendChild(wrap);
        }

        var btn = document.getElementById('fansloopLangBtn');
        var dd = document.getElementById('fansloopLangDd');
        var lbl = wrap.querySelector('.lbl');

        function syncLbl() {
            var L = LANGS.find(function (x) { return x.code === getLang(); }) || LANGS[0];
            lbl.textContent = L.label;
            btn.title = (DICT[getLang()] || DICT['zh-CN']).lang_title;
        }

        LANGS.forEach(function (L) {
            var b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('role', 'option');
            b.innerHTML = '<span>' + L.label + '</span><span class="native">' + L.native + '</span>';
            b.onclick = function (e) {
                e.stopPropagation();
                setLang(L.code);
                dd.classList.remove('show');
                btn.setAttribute('aria-expanded', 'false');
                syncLbl();
                dd.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
                b.classList.add('on');
            };
            if (L.code === code) b.classList.add('on');
            dd.appendChild(b);
        });

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            dd.classList.toggle('show');
            btn.setAttribute('aria-expanded', dd.classList.contains('show'));
        });
        document.addEventListener('click', function () {
            dd.classList.remove('show');
            btn.setAttribute('aria-expanded', 'false');
        });
        dd.addEventListener('click', function (e) { e.stopPropagation(); });

        syncLbl();
        applyDict(code);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildMount);
    else buildMount();

    global.FansLoopLang = {
        LANGS: LANGS,
        DICT: DICT,
        getLang: getLang,
        setLang: setLang,
        applyDict: applyDict
    };
})(window);
