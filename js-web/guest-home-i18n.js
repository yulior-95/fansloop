/** guest-home.html · data-i18n 文案（多语言：其余语种回落英文） */
(function () {
    var STORAGE = 'fansloop-ui-lang';

    var PACK = {
        'zh-CN': {
            guest_lb: '游客', login_cta: '登录 / 注册', veil_txt: '登录后可发布图文 / 视频 / 开播',
            go_login: '去登录', publish: '发布', lbl_img: '图片', lbl_vid: '视频', lbl_live: '开直播',
            quota: '今日免费观看直播剩余 2 / 5 次',
            follow: '关注', share: '分享', tip: '打赏', save: '收藏', danmu: '实时弹幕', gift: '送礼',
            unlock: '立即解锁 · $5.00', sub_month: '订阅 28 USDT/月', subscribed_demo: '订阅预览',
            live_desc: '雨夜小提琴现场 · 公开免费直播（配额内可观看）',
            follow_wall_title: '关注动态仅对登录用户开放',
            follow_wall_body: '登录后可同步「推荐 / 关注」双列 Feed，与 home.html 一致。',
            pending_title: '待审核内容', pending_veil_title: '创作者后台入口',
            pending_veil_body: '登录后可查看投稿审核 / 数据面板'
        },
        en: {
            guest_lb: 'Guest', login_cta: 'Sign in', veil_txt: 'Sign in to post, upload or go live',
            go_login: 'Sign in', publish: 'Publish', lbl_img: 'Photo', lbl_vid: 'Video', lbl_live: 'Live',
            quota: 'Free live views left today: 2 / 5',
            follow: 'Follow', share: 'Share', tip: 'Tip', save: 'Save', danmu: 'Live chat', gift: 'Gift',
            unlock: 'Unlock · $5.00', sub_month: 'Subscribe · 28 USDT/mo', subscribed_demo: 'Subscribe',
            live_desc: 'Violin live stream · free within quota',
            follow_wall_title: 'Following feed requires login',
            follow_wall_body: 'After login you get Rec/Following tabs like home.html.',
            pending_title: 'Pending review', pending_veil_title: 'Creator console',
            pending_veil_body: 'Sign in for drafts & analytics'
        }
    };

    function resolvePack() {
        var code = localStorage.getItem(STORAGE) || 'zh-CN';
        return PACK[code] || PACK.en;
    }

    function apply() {
        var d = resolvePack();
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var k = el.getAttribute('data-i18n');
            if (d[k]) el.textContent = d[k];
        });
        var ph = document.querySelector('[data-i18n-ph]');
        if (ph) {
            var lc = localStorage.getItem(STORAGE) || 'zh-CN';
            ph.placeholder = lc.startsWith('zh') ? '登录后可发布动态…' : 'Sign in to publish…';
        }
    }

    document.addEventListener('DOMContentLoaded', apply);
    document.addEventListener('fansloop-lang-change', apply);
})();
