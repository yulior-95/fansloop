/**
 * 发现页 · 分类体系（后台三级类目配置的前台消费层 + 划分/推荐规则）
 *
 * 类目树来源：js-web/content-taxonomy-store.js（后台「平台内容类别管理」维护）
 * 发现页 Tab 只取一级类目；内容自身归类到三级叶子，按一级聚合筛选。
 */
(function (global) {
    var TX = global.FL_CONTENT_TAXONOMY;
    var HOT_ID = (TX && TX.HOT_ID) || 'hot';

    /** 发现页 Tab = 启用中的一级类目 */
    function getCategories() {
        if (!TX) return [];
        return TX.getLevel1().map(function (n, i) {
            return { id: n.id, slug: n.id, name: n.name, icon: n.icon, sort: i, enabled: true };
        });
    }

    function getCategoryById(id) {
        if (id === 'all') id = HOT_ID;
        return getCategories().filter(function (c) { return c.id === id; })[0] || null;
    }

    /** 话题 # → 三级叶子类目（后台可维护的映射表，不含热门频道的算法投放位） */
    var HASHTAG_MAP = {
        '富士山': 'photo-art', '旅行摄影': 'travel-log', '日出': 'photo-art',
        '京都': 'travel-log', '北海道': 'travel-log', 'Vlog': 'daily-share',
        '爵士夜': 'perform-music', 'Web3': 'growth-skill', '直播预告': 'live-real',
        '咖啡': 'food-share', '健身打卡': 'fitness-train', '穿搭': 'fashion-makeup',
        '读书清单': 'growth-skill', '游戏直播': 'perform-talent', '绘画过程': 'photo-art',
        '哄睡电台': 'asmr-relax', '私信问答': 'emo-communication', 'ASMR': 'asmr-sound',
        '情侣日常': 'couple-daily', '换装挑战': 'styling-creative'
    };

    var POSTS = [
        {
            id: 'p1', title: '京都樱花季隐秘机位 · 18 张原图', author: 'Lens 旅记', handle: '@lensjourney',
            creatorId: 'c_lens', av: 'photo-1438761681033-6461ffad8d80', cover: 'photo-1490806843957-31f4c9a91c65',
            categoryId: 'travel-log', primaryCategory: 'life', categories: ['life', 'visual'], hashtags: ['京都', '旅行摄影'],
            premium: true, payType: 'subscribe', subscribePrice: 28, paidPostCount: 18,
            summary: '清晨 6 点无人小路机位，附 18 张 RAW 与拍摄参数。订阅解锁完整图集与路线坐标。',
            likes: '2.4k', comments: 312, views: '18k', type: 'image'
        },
        {
            id: 'p2', title: '雨夜小提琴现场 · 1,284 观看', author: '夜雨听弦', handle: '@nightrain',
            av: 'photo-1500648767791-00dcc994a43e', cover: 'photo-1465847899084-d164df4dedc6',
            categoryId: 'live-real', primaryCategory: 'interact', categories: ['interact', 'fun'], hashtags: ['爵士夜'],
            live: true, hostSlug: 'yeyu', views: '1,284 直播观看', type: 'live'
        },
        {
            id: 'p3', title: '富士山五合目零下 4℃ 拍摄手记', author: '山野食光', handle: '@yamano',
            av: 'photo-1487412720507-e7ab37603c6f', cover: 'photo-1542642745-f03d8e3aa54c',
            categoryId: 'photo-art', primaryCategory: 'visual', categories: ['visual', 'life'], hashtags: ['富士山', '日出'],
            likes: '2.1k', comments: 342, views: '14k', type: 'image'
        },
        {
            id: 'p4', title: '从 0 到 1 学会写一首钢琴曲', author: '音乐工作室', handle: '@musiclab',
            av: 'photo-1502685104226-ee32379fefbe', cover: 'photo-1542435503-956c469947f6',
            categoryId: 'perform-music', primaryCategory: 'fun', categories: ['fun', 'knowledge'], hashtags: ['爵士夜'],
            likes: '1.2k', comments: 89, views: '8.2k', type: 'video', duration: '8 分钟', durationSec: 480,
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        },
        {
            id: 'p5', title: '咖啡店主的 30 天生活观察', author: '咖啡店主', handle: '@coffeetalk',
            creatorId: 'c_coffee', av: 'photo-1500648767791-00dcc994a43e', cover: 'photo-1493612276216-ee3925520721',
            categoryId: 'daily-share', primaryCategory: 'daily', categories: ['daily', 'life'], hashtags: ['咖啡', 'Vlog'],
            premium: true, payType: 'ppv', price: 5, paidPostCount: 9,
            summary: '30 天开店日记精选：客流、配方与情绪。付费解锁完整 12 分钟 Vlog 与幕后花絮。',
            likes: 968, comments: 124, views: '5.6k', type: 'image'
        },
        {
            id: 'p6', title: '环游 Vlog #023 · 北海道冬日', author: 'Lens 旅记', handle: '@lensjourney',
            av: 'photo-1438761681033-6461ffad8d80', cover: 'photo-1502602898657-3e91760cbb34',
            categoryId: 'travel-log', primaryCategory: 'life', categories: ['life', 'daily'], hashtags: ['北海道', 'Vlog'],
            featured: true, likes: '1.8k', comments: 240, duration: '12 分钟', durationSec: 720, type: 'video',
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
        },
        {
            id: 'p7', title: 'Web3 创作者经济 AMA 实录', author: '代码诗人', handle: '@codepoet',
            av: 'photo-1502685104226-ee32379fefbe', cover: 'photo-1542435503-956c469947f6',
            categoryId: 'growth-skill', primaryCategory: 'knowledge', categories: ['knowledge'], hashtags: ['Web3'],
            likes: 856, comments: 142, views: '6.1k', type: 'video', duration: '24 分钟', durationSec: 1440,
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
        },
        {
            id: 'p8', title: '夜间速写 · 城市霓虹人像', author: '夜间速写', handle: '@nightsketch',
            av: 'photo-1502685104226-ee32379fefbe', cover: 'photo-1522383225653-ed111181a951',
            categoryId: 'photo-portrait', primaryCategory: 'visual', categories: ['visual'], hashtags: ['绘画过程'],
            likes: 640, comments: 78, views: '4.2k', type: 'image'
        },
        {
            id: 'p9', title: 'APEX 排位夜 · 高光集锦', author: 'NovaPlay', handle: '@novaplay',
            av: 'photo-1535713875002-d1d0cf377fde', cover: 'photo-1511512578047-dfb367046420',
            categoryId: 'perform-talent', primaryCategory: 'fun', categories: ['fun'], hashtags: ['游戏直播'],
            likes: '3.2k', comments: 410, views: '22k', type: 'video', duration: '6 分钟', durationSec: 360,
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
        },
        {
            id: 'p10', title: '春季胶囊衣橱 · 7 套通勤穿搭', author: 'Luna Style', handle: '@lunastyle',
            av: 'photo-1494790108377-be9c29b29330', cover: 'photo-1483985988354-763728e1935b',
            categoryId: 'fashion-makeup', primaryCategory: 'life', categories: ['life', 'visual'], hashtags: ['穿搭'],
            likes: 720, comments: 96, views: '5.8k', type: 'image'
        },
        {
            id: 'p11', title: '晨间 HIIT · 20 分钟跟练', author: 'FitCoach', handle: '@fitc',
            av: 'photo-1500648767791-00dcc994a43e', cover: 'photo-1571019614242-c5c5dee9f50b',
            categoryId: 'fitness-train', primaryCategory: 'life', categories: ['life'], hashtags: ['健身打卡'],
            likes: 540, comments: 67, views: '3.9k', type: 'video', duration: '20 分钟', durationSec: 1200,
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
        },
        {
            id: 'p12', title: '四月书单 · 3 本改变创作习惯的书', author: '读书少女', handle: '@reader',
            av: 'photo-1438761681033-6461ffad8d80', cover: 'photo-1481627834876-b7833e8f5570',
            categoryId: 'growth-skill', primaryCategory: 'knowledge', categories: ['knowledge'], hashtags: ['读书清单'],
            likes: 430, comments: 52, views: '2.7k', type: 'image'
        },
        {
            id: 'p13', title: '凌晨一点的哄睡电台 · 第 42 期', author: '月光电台', handle: '@moonradio',
            av: 'photo-1500648767791-00dcc994a43e', cover: 'photo-1516280440614-37939bbacd81',
            categoryId: 'asmr-relax', primaryCategory: 'immersive', categories: ['immersive', 'emotion'], hashtags: ['哄睡电台'],
            likes: '1.1k', comments: 186, views: '9.4k', type: 'video', duration: '28 分钟', durationSec: 1680,
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
        },
        {
            id: 'p14', title: '订阅专属 · 本周私信问答合集', author: '夜雨听弦', handle: '@nightrain',
            creatorId: 'c_night', av: 'photo-1487412720507-e7ab37603c6f', cover: 'photo-1493612276216-ee3925520721',
            categoryId: 'emo-communication', primaryCategory: 'knowledge', categories: ['knowledge', 'emotion'], hashtags: ['私信问答'],
            premium: true, payType: 'subscribe', subscribePrice: 32, paidPostCount: 14,
            summary: '本周收到 240 条私信，挑了 18 个最想被回答的问题写成长文。订阅解锁全部回信。',
            likes: 812, comments: 231, views: '6.7k', type: 'image'
        },
        {
            id: 'p15', title: '耳语 ASMR · 雨夜书房的 20 分钟', author: '低语实验室', handle: '@whisperlab',
            av: 'photo-1494790108377-be9c29b29330', cover: 'photo-1481627834876-b7833e8f5570',
            categoryId: 'asmr-sound', primaryCategory: 'immersive', categories: ['immersive'], hashtags: ['ASMR'],
            likes: '2.6k', comments: 148, views: '15k', type: 'video', duration: '20 分钟', durationSec: 1200,
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
        },
        {
            id: 'p16', title: '同居第 100 天 · 我们的周末早晨', author: '阿泽与小鹿', handle: '@zeludeer',
            av: 'photo-1535713875002-d1d0cf377fde', cover: 'photo-1522383225653-ed111181a951',
            categoryId: 'couple-daily', primaryCategory: 'emotion', categories: ['emotion', 'daily'], hashtags: ['情侣日常'],
            likes: '1.9k', comments: 302, views: '11k', type: 'video', duration: '15 分钟', durationSec: 900,
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        },
        {
            id: 'p17', title: '#换装挑战 · 30 秒七套变装', author: 'Luna Style', handle: '@lunastyle',
            av: 'photo-1494790108377-be9c29b29330', cover: 'photo-1483985988354-763728e1935b',
            categoryId: 'styling-creative', primaryCategory: 'visual', categories: ['visual', 'interact'], hashtags: ['换装挑战', '穿搭'],
            likes: '4.1k', comments: 528, views: '31k', type: 'video', duration: '3 分钟', durationSec: 180,
            videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
        }
    ];

    function esc(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function rootOf(id) {
        if (!id) return null;
        return (TX && TX.rootIdOf(id)) || id;
    }

    function filterPosts(categoryId) {
        if (!categoryId || categoryId === 'all' || categoryId === HOT_ID) return POSTS.slice();
        return POSTS.filter(function (p) {
            if (rootOf(p.categoryId) === categoryId) return true;
            return p.primaryCategory === categoryId || (p.categories && p.categories.indexOf(categoryId) >= 0);
        });
    }

    /** 类目路径文案：视觉美学 / 摄影写真 / 风光旅拍 */
    function categoryPathLabel(id, sep) {
        return TX ? TX.getPathLabel(id, sep) : '';
    }

    function toResult(leafId, steps, method) {
        return {
            categoryId: leafId,
            primaryCategory: rootOf(leafId),
            pathLabel: categoryPathLabel(leafId),
            steps: steps,
            method: method
        };
    }

    function resolveContentCategory(input) {
        input = input || {};
        var steps = [];
        var picked = input.categoryId || input.leafCategoryId || input.primaryCategory || input.primary_category_id;
        if (picked && picked !== 'all' && picked !== HOT_ID) {
            steps.push({ step: 1, source: '创作者发布时选择的三级类目', result: picked, confidence: 1 });
            return toResult(picked, steps, 'user_selected');
        }
        var tags = input.hashtags || [];
        for (var i = 0; i < tags.length; i++) {
            var tag = String(tags[i]).replace(/^#\s*/, '').trim();
            if (HASHTAG_MAP[tag]) {
                steps.push({ step: 2, source: '话题 #' + tag + ' → 映射表', result: HASHTAG_MAP[tag], confidence: 0.92 });
                return toResult(HASHTAG_MAP[tag], steps, 'hashtag_map');
            }
        }
        if (input.creatorDefaultCategory) {
            steps.push({ step: 3, source: '创作者默认类目', result: input.creatorDefaultCategory, confidence: 0.65 });
            return toResult(input.creatorDefaultCategory, steps, 'creator_default');
        }
        steps.push({ step: 4, source: '待人工/模型补全', result: null, confidence: 0 });
        return toResult(null, steps, 'pending');
    }

    function suggestHashtags(categoryId) {
        var out = [];
        Object.keys(HASHTAG_MAP).forEach(function (tag) {
            var leaf = HASHTAG_MAP[tag];
            if (leaf === categoryId || rootOf(leaf) === categoryId) out.push(tag);
        });
        return out.slice(0, 6);
    }

    global.FL_DISCOVER_TAXONOMY = {
        get categories() { return getCategories(); },
        hashtagMap: HASHTAG_MAP,
        posts: POSTS,
        rules: {
            taxonomy: [
                '运营后台「平台内容类别管理」维护三级类目树（一级 / 二级 / 三级）',
                '用户端只展示一级类目：发现页 Tab、搜索筛选同源 GET /api/v1/categories/tree?level=1',
                '内容归类落在三级叶子（category_id），一级 id 冗余存 primary_category 供 Tab 聚合',
                '话题 # 通过 hashtag_map 映射到三级叶子，再回溯一级'
            ],
            classify: [
                '① 创作者发布时选择的三级类目 → category_id（最高优先级）',
                '② #话题 命中映射表 → 自动归到三级',
                '③ 创作者历史类目（弱关联，不强制）',
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
        categoryPathLabel: categoryPathLabel,
        rootOf: rootOf,
        filterPosts: filterPosts,
        resolveContentCategory: resolveContentCategory,
        suggestHashtags: suggestHashtags,
        esc: esc
    };
})(window);
