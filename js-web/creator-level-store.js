/**
 * 创作者等级 & 周榜 · 主页 / 收益页 / Feed 共享 Mock
 *
 * 【创作者等级 LV】与以下概念区分：
 * - 粉丝订阅周期（月付/季付/年付）：粉丝付费方式，不是 LV
 * - 评论/直播中的粉丝 LV：粉丝活跃等级，独立体系
 *
 * 升级依据（累计/当前快照，取满足条件的最高档）：
 * - 活跃订阅者数、本月创作者收入（USDT）、作品总数、是否身份认证
 *
 * 【创作者周榜】自然周（周一至周日）综合热度分排名，每周一 0:00 UTC 重置。
 */
(function (global) {
    var DEMO_UID = 'demo_uid_882910';
    var LS_KEY = 'fl_creator_level_v1';

    /** 等级档位：creatorSplit = 创作者实得比例（%） */
    var LEVEL_TIERS = [
        { level: 1, label: '新晋创作者', minSubs: 0, minMonthlyUsdt: 0, minWorks: 0, requireVerified: false, creatorSplit: 70 },
        { level: 2, label: '入门创作者', minSubs: 20, minMonthlyUsdt: 30, minWorks: 10, requireVerified: false, creatorSplit: 75 },
        { level: 3, label: '活跃创作者', minSubs: 80, minMonthlyUsdt: 80, minWorks: 30, requireVerified: false, creatorSplit: 78 },
        { level: 4, label: '优质创作者', minSubs: 200, minMonthlyUsdt: 150, minWorks: 60, requireVerified: false, creatorSplit: 80 },
        { level: 5, label: '人气创作者', minSubs: 400, minMonthlyUsdt: 300, minWorks: 100, requireVerified: false, creatorSplit: 82 },
        { level: 6, label: '资深创作者', minSubs: 700, minMonthlyUsdt: 600, minWorks: 140, requireVerified: false, creatorSplit: 83 },
        { level: 7, label: '认证创作者', minSubs: 1000, minMonthlyUsdt: 200, minWorks: 150, requireVerified: true, creatorSplit: 85 },
        { level: 8, label: '旗舰创作者', minSubs: 2000, minMonthlyUsdt: 800, minWorks: 250, requireVerified: true, creatorSplit: 87 },
        { level: 9, label: '殿堂创作者', minSubs: 5000, minMonthlyUsdt: 2000, minWorks: 400, requireVerified: true, creatorSplit: 88 },
        { level: 10, label: '传奇创作者', minSubs: 10000, minMonthlyUsdt: 5000, minWorks: 600, requireVerified: true, creatorSplit: 90 }
    ];

    /** 周榜计分权重（近 7 日） */
    var WEEKLY_SCORE_WEIGHTS = {
        newSubs: 15,
        tipsUsdt: 1,
        engagement: 0.05,
        liveMinutes: 0.8,
        posts: 20
    };

    /** 榜单候选池（含 Luna 演示数据） */
    var RANK_POOL = [
        { id: 'c_code', name: '代码诗人', weekly: { newSubs: 88, tipsUsdt: 4200, engagement: 28000, liveMinutes: 420, posts: 8 } },
        { id: 'c_lens', name: 'Lens 旅记', weekly: { newSubs: 72, tipsUsdt: 3100, engagement: 22000, liveMinutes: 360, posts: 6 } },
        { id: 'c_night', name: '夜雨听弦', weekly: { newSubs: 65, tipsUsdt: 2800, engagement: 19000, liveMinutes: 520, posts: 5 } },
        { id: 'c_food', name: '山野食光', weekly: { newSubs: 58, tipsUsdt: 2400, engagement: 16500, liveMinutes: 300, posts: 7 } },
        { id: 'c_game', name: 'NovaFan', weekly: { newSubs: 54, tipsUsdt: 3900, engagement: 35000, liveMinutes: 680, posts: 4 } },
        { id: 'c_sketch', name: '夜间速写', weekly: { newSubs: 48, tipsUsdt: 1900, engagement: 14000, liveMinutes: 240, posts: 9 } },
        { id: 'c_yeyu', name: '夜雨听弦·小号', weekly: { newSubs: 45, tipsUsdt: 1750, engagement: 12000, liveMinutes: 200, posts: 5 } },
        { id: 'c_silver', name: '银盐时代', weekly: { newSubs: 40, tipsUsdt: 1600, engagement: 11000, liveMinutes: 180, posts: 6 } },
        { id: 'c_sound', name: '声音之外', weekly: { newSubs: 38, tipsUsdt: 1500, engagement: 9800, liveMinutes: 160, posts: 4 } },
        { id: 'c_min', name: '极简料理', weekly: { newSubs: 36, tipsUsdt: 1400, engagement: 9200, liveMinutes: 150, posts: 5 } },
        { id: 'c_mio', name: 'Mio_摄影', weekly: { newSubs: 44, tipsUsdt: 2100, engagement: 13200, liveMinutes: 200, posts: 4 } },
        { id: 'c_jazz', name: '爵士夜场', weekly: { newSubs: 43, tipsUsdt: 2050, engagement: 13000, liveMinutes: 190, posts: 5 } },
        { id: 'c_street', name: '街拍研究所', weekly: { newSubs: 41, tipsUsdt: 1980, engagement: 12600, liveMinutes: 170, posts: 4 } },
        { id: 'c_cloud', name: 'CloudNine', weekly: { newSubs: 40, tipsUsdt: 1920, engagement: 12400, liveMinutes: 165, posts: 3 } },
        { id: 'c_urban', name: '城市漫游', weekly: { newSubs: 39, tipsUsdt: 1880, engagement: 12100, liveMinutes: 160, posts: 4 } },
        { id: 'c_dawn', name: '晨光胶片', weekly: { newSubs: 41, tipsUsdt: 1860, engagement: 12700, liveMinutes: 175, posts: 3 } },
        { id: DEMO_UID, name: 'Luna 🌙', weekly: { newSubs: 42, tipsUsdt: 1840, engagement: 12890, liveMinutes: 180, posts: 3 } },
        { id: 'c_coffee', name: '咖啡店主', weekly: { newSubs: 28, tipsUsdt: 980, engagement: 7600, liveMinutes: 120, posts: 4 } },
        { id: 'c_travel', name: '阿Ken旅行', weekly: { newSubs: 24, tipsUsdt: 860, engagement: 6800, liveMinutes: 90, posts: 3 } },
        { id: 'c_film', name: '胶片少女', weekly: { newSubs: 20, tipsUsdt: 720, engagement: 5900, liveMinutes: 60, posts: 2 } },
        { id: 'c_vlog', name: '东京夜跑团', weekly: { newSubs: 18, tipsUsdt: 650, engagement: 5200, liveMinutes: 140, posts: 2 } }
    ];

    var CREATOR_METRICS = {
        'Luna 🌙': {
            userId: DEMO_UID,
            activeSubscribers: 1287,
            totalWorks: 186,
            verified: true
        }
    };

    function weekKey() {
        var d = new Date();
        var day = d.getUTCDay() || 7;
        var monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 1));
        return monday.toISOString().slice(0, 10);
    }

    function resolveCreatorKey(nameOrId) {
        if (!nameOrId) return DEMO_UID;
        if (CREATOR_METRICS[nameOrId]) return CREATOR_METRICS[nameOrId].userId || nameOrId;
        if (/Luna/i.test(String(nameOrId))) return DEMO_UID;
        return nameOrId;
    }

    function getMonthlyIncomeUsdt(userId) {
        if (global.CreatorIncomeStore && global.CreatorIncomeStore.getMonthlyUsdt) {
            return global.CreatorIncomeStore.getMonthlyUsdt();
        }
        if (userId === DEMO_UID) return 298.4;
        return 0;
    }

    function getMetricsForCreator(nameOrId) {
        var key = resolveCreatorKey(nameOrId);
        var byName = CREATOR_METRICS['Luna 🌙'];
        if (key === DEMO_UID && byName) {
            return {
                userId: DEMO_UID,
                activeSubscribers: byName.activeSubscribers,
                totalWorks: byName.totalWorks,
                monthlyIncomeUsdt: getMonthlyIncomeUsdt(DEMO_UID),
                verified: byName.verified
            };
        }
        return {
            userId: key,
            activeSubscribers: 0,
            totalWorks: 0,
            monthlyIncomeUsdt: 0,
            verified: false
        };
    }

    function meetsTier(metrics, tier) {
        if (metrics.activeSubscribers < tier.minSubs) return false;
        if (metrics.monthlyIncomeUsdt < tier.minMonthlyUsdt) return false;
        if (metrics.totalWorks < tier.minWorks) return false;
        if (tier.requireVerified && !metrics.verified) return false;
        return true;
    }

    function computeLevel(metrics) {
        var level = 1;
        LEVEL_TIERS.forEach(function (tier) {
            if (meetsTier(metrics, tier)) level = tier.level;
        });
        return level;
    }

    function getTier(level) {
        return LEVEL_TIERS.find(function (t) { return t.level === level; }) || LEVEL_TIERS[0];
    }

    function getNextTier(level) {
        return LEVEL_TIERS.find(function (t) { return t.level === level + 1; }) || null;
    }

    function getLevelProgress(metrics) {
        var level = computeLevel(metrics);
        var current = getTier(level);
        var next = getNextTier(level);
        if (!next) {
            return { level: level, current: current, next: null, progressPct: 100, missing: [] };
        }
        var missing = [];
        if (metrics.activeSubscribers < next.minSubs) {
            missing.push('活跃订阅者还需 ' + (next.minSubs - metrics.activeSubscribers) + ' 人（当前 ' + metrics.activeSubscribers + '）');
        }
        if (metrics.monthlyIncomeUsdt < next.minMonthlyUsdt) {
            missing.push('本月收入还需 ' + (next.minMonthlyUsdt - metrics.monthlyIncomeUsdt).toFixed(1) + ' USDT');
        }
        if (metrics.totalWorks < next.minWorks) {
            missing.push('作品数还需 ' + (next.minWorks - metrics.totalWorks) + ' 篇');
        }
        if (next.requireVerified && !metrics.verified) {
            missing.push('需完成身份认证');
        }
        var parts = [
            metrics.activeSubscribers / next.minSubs,
            metrics.monthlyIncomeUsdt / next.minMonthlyUsdt,
            metrics.totalWorks / next.minWorks
        ];
        var progressPct = Math.min(100, Math.round(Math.min.apply(null, parts) * 100));
        return { level: level, current: current, next: next, progressPct: progressPct, missing: missing };
    }

    function calcWeeklyScore(weekly) {
        weekly = weekly || {};
        var w = WEEKLY_SCORE_WEIGHTS;
        return (
            (weekly.newSubs || 0) * w.newSubs +
            (weekly.tipsUsdt || 0) * w.tipsUsdt +
            (weekly.engagement || 0) * w.engagement +
            (weekly.liveMinutes || 0) * w.liveMinutes +
            (weekly.posts || 0) * w.posts
        );
    }

    function buildWeeklyLeaderboard() {
        return RANK_POOL.map(function (c) {
            return {
                id: c.id,
                name: c.name,
                score: Math.round(calcWeeklyScore(c.weekly) * 10) / 10,
                weekly: c.weekly
            };
        }).sort(function (a, b) { return b.score - a.score; });
    }

    function getWeeklyRank(nameOrId) {
        var key = resolveCreatorKey(nameOrId);
        var board = buildWeeklyLeaderboard();
        var idx = board.findIndex(function (row) { return row.id === key; });
        if (idx < 0) {
            return { rank: null, total: board.length, score: 0, board: board, weekKey: weekKey() };
        }
        return {
            rank: idx + 1,
            total: board.length,
            score: board[idx].score,
            board: board,
            weekKey: weekKey()
        };
    }

    function formatBadgeText(level, rank) {
        var rankPart = rank && rank.rank ? '周榜 TOP ' + rank.rank : '周榜未上榜';
        return 'LV ' + level + ' · ' + rankPart;
    }

    function getCreatorBadge(nameOrId) {
        var metrics = getMetricsForCreator(nameOrId);
        var progress = getLevelProgress(metrics);
        var rank = getWeeklyRank(nameOrId);
        return {
            level: progress.level,
            levelLabel: progress.current.label,
            creatorSplit: progress.current.creatorSplit,
            badgeText: formatBadgeText(progress.level, rank),
            rank: rank.rank,
            rankScore: rank.score,
            rankTotal: rank.total,
            weekKey: rank.weekKey,
            metrics: metrics,
            progress: progress,
            rankBoard: rank.board
        };
    }

    function getLevelRulesSummary() {
        return {
            levelDimensions: ['活跃订阅者数', '本月创作者收入（USDT）', '作品总数', '身份认证（LV7 起）'],
            weeklyFormula: '近 7 日：新订阅×15 + 打赏 USDT×1 + 互动(赞+评)×0.05 + 直播分钟×0.8 + 发帖×20',
            reset: '每周一 0:00（UTC）重新计榜',
            tiers: LEVEL_TIERS.slice()
        };
    }

    global.CreatorLevelStore = {
        DEMO_UID: DEMO_UID,
        LEVEL_TIERS: LEVEL_TIERS,
        WEEKLY_SCORE_WEIGHTS: WEEKLY_SCORE_WEIGHTS,
        computeLevel: computeLevel,
        getTier: getTier,
        getLevelProgress: getLevelProgress,
        calcWeeklyScore: calcWeeklyScore,
        buildWeeklyLeaderboard: buildWeeklyLeaderboard,
        getWeeklyRank: getWeeklyRank,
        getCreatorBadge: getCreatorBadge,
        getMetricsForCreator: getMetricsForCreator,
        getLevelRulesSummary: getLevelRulesSummary,
        resolveCreatorKey: resolveCreatorKey
    };
})(typeof window !== 'undefined' ? window : this);
