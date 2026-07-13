/**
 * 发现页 · 类抖音分类体系（模拟后台配置 + 划分/推荐规则）
 */
(function (global) {
    var CATEGORIES = [
        { id: 'all', slug: 'all', name: '全部', icon: '🔥', sort: 0, enabled: true },
        { id: 'photo', slug: 'photo', name: '摄影', icon: '📷', sort: 1, enabled: true },
        { id: 'film', slug: 'film', name: '影视', icon: '🎬', sort: 2, enabled: true },
        { id: 'music', slug: 'music', name: '音乐', icon: '🎵', sort: 3, enabled: true },
        { id: 'game', slug: 'game', name: '游戏', icon: '🎮', sort: 4, enabled: true },
        { id: 'art', slug: 'art', name: '绘画', icon: '🎨', sort: 5, enabled: true },
        { id: 'travel', slug: 'travel', name: '旅行', icon: '✈️', sort: 6, enabled: true },
        { id: 'food', slug: 'food', name: '美食', icon: '🍽️', sort: 7, enabled: true },
        { id: 'fitness', slug: 'fitness', name: '健身', icon: '💪', sort: 8, enabled: true },
        { id: 'book', slug: 'book', name: '读书', icon: '📖', sort: 9, enabled: true },
        { id: 'tech', slug: 'tech', name: '科技', icon: '💻', sort: 10, enabled: true },
        { id: 'fashion', slug: 'fashion', name: '时尚', icon: '👗', sort: 11, enabled: true }
    ];

    var HASHTAG_MAP = {
        '富士山': 'photo', '旅行摄影': 'photo', '日出': 'photo',
        '京都': 'travel', '北海道': 'travel', 'Vlog': 'film',
        '爵士夜': 'music', 'Web3': 'tech', '直播预告': 'film',
        '咖啡': 'food', '健身打卡': 'fitness', '穿搭': 'fashion',
        '读书清单': 'book', '游戏直播': 'game', '绘画过程': 'art'
    };

    var POSTS = [
        {
            id: 'p1', title: '京都樱花季隐秘机位 · 18 张原图', author: 'Lens 旅记', handle: '@lensjourney',
            creatorId: 'c_lens', av: 'photo-1438761681033-6461ffad8d80', cover: 'photo-1490806843957-31f4c9a91c65',
            primaryCategory: 'photo', categories: ['photo', 'travel'], hashtags: ['京都', '旅行摄影'],
            premium: true, payType: 'subscribe', subscribePrice: 28, paidPostCount: 18,
            summary: '清晨 6 点无人小路机位，附 18 张 RAW 与拍摄参数。订阅解锁完整图集与路线坐标。',
            likes: '2.4k', comments: 312, views: '18k', type: 'image'
        },
        {
            id: 'p2', title: '雨夜小提琴现场 · 1,284 观看', author: '夜雨听弦', handle: '@nightrain',
            av: 'photo-1500648767791-00dcc994a43e', cover: 'photo-1465847899084-d164df4dedc6',
            primaryCategory: 'music', categories: ['music'], hashtags: ['爵士夜'],
            live: true, hostSlug: 'yeyu', views: '1,284 直播观看', type: 'live'
        },
        {
            id: 'p3', title: '富士山五合目零下 4℃ 拍摄手记', author: '山野食光', handle: '@yamano',
            av: 'photo-1487412720507-e7ab37603c6f', cover: 'photo-1542642745-f03d8e3aa54c',
            primaryCategory: 'photo', categories: ['photo', 'travel'], hashtags: ['富士山', '日出'],
            likes: '2.1k', comments: 342, views: '14k', type: 'image'
        },
        {
            id: 'p4', title: '从 0 到 1 学会写一首钢琴曲', author: '音乐工作室', handle: '@musiclab',
            av: 'photo-1502685104226-ee32379fefbe', cover: 'photo-1542435503-956c469947f6',
            primaryCategory: 'music', categories: ['music'], hashtags: ['爵士夜'],
            likes: '1.2k', comments: 89, views: '8.2k', type: 'video', duration: '8 分钟', durationSec: 480,
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        },
        {
            id: 'p5', title: '咖啡店主的 30 天生活观察', author: '咖啡店主', handle: '@coffeetalk',
            creatorId: 'c_coffee', av: 'photo-1500648767791-00dcc994a43e', cover: 'photo-1493612276216-ee3925520721',
            primaryCategory: 'food', categories: ['food', 'film'], hashtags: ['咖啡', 'Vlog'],
            premium: true, payType: 'ppv', price: 5, paidPostCount: 9,
            summary: '30 天开店日记精选：客流、配方与情绪。付费解锁完整 12 分钟 Vlog 与幕后花絮。',
            likes: 968, comments: 124, views: '5.6k', type: 'image'
        },
        {
            id: 'p6', title: '环游 Vlog #023 · 北海道冬日', author: 'Lens 旅记', handle: '@lensjourney',
            av: 'photo-1438761681033-6461ffad8d80', cover: 'photo-1502602898657-3e91760cbb34',
            primaryCategory: 'travel', categories: ['travel', 'film'], hashtags: ['北海道', 'Vlog'],
            featured: true, likes: '1.8k', comments: 240, duration: '12 分钟', durationSec: 720, type: 'video',
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        },
        {
            id: 'p7', title: 'Web3 创作者经济 AMA 实录', author: '代码诗人', handle: '@codepoet',
            av: 'photo-1502685104226-ee32379fefbe', cover: 'photo-1542435503-956c469947f6',
            primaryCategory: 'tech', categories: ['tech'], hashtags: ['Web3'],
            likes: 856, comments: 142, views: '6.1k', type: 'video', duration: '24 分钟', durationSec: 1440,
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
        },
        {
            id: 'p8', title: '夜间速写 · 城市霓虹人像', author: '夜间速写', handle: '@nightsketch',
            av: 'photo-1502685104226-ee32379fefbe', cover: 'photo-1522383225653-ed111181a951',
            primaryCategory: 'art', categories: ['art', 'photo'], hashtags: ['绘画过程'],
            likes: 640, comments: 78, views: '4.2k', type: 'image'
        },
        {
            id: 'p9', title: 'APEX 排位夜 · 高光集锦', author: 'NovaPlay', handle: '@novaplay',
            av: 'photo-1535713875002-d1d0cf377fde', cover: 'photo-1511512578047-dfb367046420',
            primaryCategory: 'game', categories: ['game'], hashtags: ['游戏直播'],
            likes: '3.2k', comments: 410, views: '22k', type: 'video', duration: '6 分钟', durationSec: 360,
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
        },
        {
            id: 'p10', title: '春季胶囊衣橱 · 7 套通勤穿搭', author: 'Luna Style', handle: '@lunastyle',
            av: 'photo-1494790108377-be9c29b29330', cover: 'photo-1483985988354-763728e1935b',
            primaryCategory: 'fashion', categories: ['fashion'], hashtags: ['穿搭'],
            likes: 720, comments: 96, views: '5.8k', type: 'image'
        },
        {
            id: 'p11', title: '晨间 HIIT · 20 分钟跟练', author: 'FitCoach', handle: '@fitc',
            av: 'photo-1500648767791-00dcc994a43e', cover: 'photo-1571019614242-c5c5dee9f50b',
            primaryCategory: 'fitness', categories: ['fitness'], hashtags: ['健身打卡'],
            likes: 540, comments: 67, views: '3.9k', type: 'video', duration: '20 分钟', durationSec: 1200,
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
        },
        {
            id: 'p12', title: '四月书单 · 3 本改变创作习惯的书', author: '读书少女', handle: '@reader',
            av: 'photo-1438761681033-6461ffad8d80', cover: 'photo-1481627834876-b7833e8f5570',
            primaryCategory: 'book', categories: ['book'], hashtags: ['读书清单'],
            likes: 430, comments: 52, views: '2.7k', type: 'image'
        }
    ];

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function getCategories() {
        return CATEGORIES.filter(function (c) { return c.enabled; }).sort(function (a, b) { return a.sort - b.sort; });
    }

    function getCategoryById(id) {
        return CATEGORIES.find(function (c) { return c.id === id; }) || null;
    }

    function filterPosts(categoryId) {
        if (!categoryId || categoryId === 'all') return POSTS.slice();
        return POSTS.filter(function (p) {
            return p.primaryCategory === categoryId || (p.categories && p.categories.indexOf(categoryId) >= 0);
        });
    }

    function resolveContentCategory(input) {
        input = input || {};
        var steps = [];
        var primary = input.primaryCategory || input.primary_category_id;
        if (primary && primary !== 'all') {
            steps.push({ step: 1, source: '用户发布时选择主垂类', result: primary, confidence: 1 });
            return { primaryCategory: primary, steps: steps, method: 'user_primary' };
        }
        var tags = input.hashtags || [];
        for (var i = 0; i < tags.length; i++) {
            var tag = String(tags[i]).replace(/^#\s*/, '').trim();
            if (HASHTAG_MAP[tag]) {
                steps.push({ step: 2, source: '话题 #' + tag + ' → 映射表', result: HASHTAG_MAP[tag], confidence: 0.92 });
                return { primaryCategory: HASHTAG_MAP[tag], steps: steps, method: 'hashtag_map' };
            }
        }
        if (input.creatorDefaultCategory) {
            steps.push({ step: 3, source: '创作者默认垂类', result: input.creatorDefaultCategory, confidence: 0.65 });
            return { primaryCategory: input.creatorDefaultCategory, steps: steps, method: 'creator_default' };
        }
        steps.push({ step: 4, source: '待人工/模型补全', result: null, confidence: 0 });
        return { primaryCategory: null, steps: steps, method: 'pending' };
    }

    function suggestHashtags(categoryId) {
        var out = [];
        Object.keys(HASHTAG_MAP).forEach(function (tag) {
            if (HASHTAG_MAP[tag] === categoryId) out.push(tag);
        });
        return out.slice(0, 6);
    }

    global.FL_DISCOVER_TAXONOMY = {
        categories: CATEGORIES,
        hashtagMap: HASHTAG_MAP,
        posts: POSTS,
        rules: {
            taxonomy: [
                '运营后台维护 categories 表（id / name / slug / icon / sort / enabled）',
                '发现页 cat-row 由 GET /api/categories 渲染',
                '内容支持多标签，频道筛选按 primary_category',
                '话题 # 通过 hashtag_map 映射到垂类'
            ],
            classify: [
                '① 发布主垂类 → primary_category（最高优先级）',
                '② #话题 命中映射表 → 自动归类',
                '③ 创作者历史垂类（弱关联，不强制）',
                '④ ML 多模态（confidence≥0.85 且不与用户选择冲突）'
            ],
            recommend: [
                '兴趣标签 × 内容标签 → 个性化',
                '频道 = primary 筛选 + 热度/新鲜度',
                '小流量池试推 → 完播/互动/负反馈',
                '首条 3×2 大卡为频道置顶视频'
            ],
            discoverDisplay: [
                '游客：仅展示 5 条免费内容',
                '登录：网格免费/付费同封面展示，付费仅角标；未订阅付费帖 consumability×0.55 降权',
                '详情：免费完整观看；付费进入后 Teaser（图文分屏模糊/视频 12 秒+订阅墙+摘要）',
                '完整付费消费 → 订阅页「付费独享」'
            ]
        },
        getCategories: getCategories,
        getCategoryById: getCategoryById,
        filterPosts: filterPosts,
        resolveContentCategory: resolveContentCategory,
        suggestHashtags: suggestHashtags,
        esc: esc
    };
})(window);
