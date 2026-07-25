/**
 * 平台内容类别 · 三级类目共享数据源
 *
 * 唯一事实来源：运营后台「内容与运营 / 平台内容类别管理」（content-categories.html）
 * 前台（发现页 Tab、创作页类别抽屉、搜索）全部从这里读取，不再各自硬编码。
 *
 * 展示约定：
 * - 用户端（发现页 Tab / 搜索筛选）只展示一级类目，避免类目过多造成选择负担
 * - 创作者发布内容时必须选择到三级叶子类目，用于归类、推荐与审核
 * - hot（热门）为系统频道：其二三级（今日热门 / 爆款视频 / 新创作者…）是推荐算法的投放位，
 *   由算法按热度与新鲜度填充，创作者发布时不可选择，频道本身也不可删除或停用
 *
 * 生产对应：GET /api/v1/categories/tree · PUT /api/v1/admin/categories/tree
 */
(function (global) {
    var STORAGE_KEY = 'fl_content_taxonomy_v1';
    var HOT_ID = 'hot';

    function leaf(id, name) { return { id: id, name: name }; }

    var DEFAULT_TREE = [
        {
            id: HOT_ID, name: '热门', icon: '🔥', system: true, enabled: true, children: [
                {
                    id: 'hot-rec', name: '热门推荐', enabled: true, children: [
                        leaf('hot-today', '今日热门'),
                        leaf('hot-viral', '爆款视频'),
                        leaf('hot-engaged', '高互动内容')
                    ]
                },
                {
                    id: 'hot-fresh', name: '新鲜发现', enabled: true, children: [
                        leaf('fresh-creator', '新创作者'),
                        leaf('fresh-latest', '最新发布')
                    ]
                }
            ]
        },
        {
            id: 'daily', name: '创作者日常', icon: '☕', enabled: true, children: [
                {
                    id: 'daily-life', name: '创作者生活', enabled: true, children: [
                        leaf('daily-share', '日常分享'),
                        leaf('daily-behind', '幕后花絮'),
                        leaf('daily-story', '个人故事')
                    ]
                },
                {
                    id: 'daily-fans', name: '粉丝互动', enabled: true, children: [
                        leaf('fans-qa', '问答互动'),
                        leaf('fans-welfare', '粉丝福利'),
                        leaf('fans-member', '会员内容')
                    ]
                }
            ]
        },
        {
            id: 'visual', name: '视觉美学', icon: '🎨', enabled: true, children: [
                {
                    id: 'visual-photo', name: '写真摄影', enabled: true, children: [
                        leaf('photo-art', '艺术写真'),
                        leaf('photo-portrait', '人像摄影'),
                        leaf('photo-fashion', '时尚展示')
                    ]
                },
                {
                    id: 'visual-styling', name: '造型主题', enabled: true, children: [
                        leaf('styling-cosplay', 'Cosplay'),
                        leaf('styling-character', '角色装扮'),
                        leaf('styling-creative', '创意造型')
                    ]
                }
            ]
        },
        {
            id: 'fun', name: '娱乐精选', icon: '🎬', enabled: true, children: [
                {
                    id: 'fun-drama', name: '剧情内容', enabled: true, children: [
                        leaf('drama-sitcom', '情景短剧'),
                        leaf('drama-role', '角色剧情'),
                        leaf('drama-story', '故事演绎')
                    ]
                },
                {
                    id: 'fun-perform', name: '表演内容', enabled: true, children: [
                        leaf('perform-dance', '舞蹈'),
                        leaf('perform-talent', '才艺'),
                        leaf('perform-music', '音乐')
                    ]
                }
            ]
        },
        {
            id: 'interact', name: '互动时刻', icon: '💬', enabled: true, children: [
                {
                    id: 'interact-live', name: '直播内容', enabled: true, children: [
                        leaf('live-real', '真人直播'),
                        leaf('live-chat', '聊天互动'),
                        leaf('live-cohost', '连麦互动')
                    ]
                },
                {
                    id: 'interact-private', name: '私密互动', enabled: true, children: [
                        leaf('private-custom', '定制内容'),
                        leaf('private-1v1', '一对一互动')
                    ]
                }
            ]
        },
        {
            id: 'emotion', name: '情感关系', icon: '💞', enabled: true, children: [
                {
                    id: 'emotion-couple', name: '情侣内容', enabled: true, children: [
                        leaf('couple-daily', '情侣日常'),
                        leaf('couple-duo', '双人互动'),
                        leaf('couple-story', '情感故事')
                    ]
                }
            ]
        },
        {
            id: 'immersive', name: '沉浸体验', icon: '🌌', enabled: true, children: [
                {
                    id: 'immersive-asmr', name: 'ASMR', enabled: true, children: [
                        leaf('asmr-sound', '声音体验'),
                        leaf('asmr-relax', '放松陪伴')
                    ]
                },
                {
                    id: 'immersive-pov', name: '第一视角', enabled: true, children: [
                        leaf('pov-experience', 'POV 体验'),
                        leaf('pov-drama', '沉浸剧情')
                    ]
                }
            ]
        },
        {
            id: 'life', name: '生活方式', icon: '🌿', enabled: true, children: [
                {
                    id: 'life-travel', name: '旅行生活', enabled: true, children: [
                        leaf('travel-log', '旅行记录')
                    ]
                },
                {
                    id: 'life-food', name: '美食生活', enabled: true, children: [
                        leaf('food-share', '美食分享')
                    ]
                },
                {
                    id: 'life-fitness', name: '健身生活', enabled: true, children: [
                        leaf('fitness-train', '健身训练')
                    ]
                },
                {
                    id: 'life-fashion', name: '时尚生活', enabled: true, children: [
                        leaf('fashion-makeup', '穿搭美妆')
                    ]
                }
            ]
        },
        {
            id: 'knowledge', name: '知识分享', icon: '💡', enabled: true, children: [
                {
                    id: 'knowledge-emotion', name: '情感知识', enabled: true, children: [
                        leaf('emo-relationship', '两性关系'),
                        leaf('emo-communication', '情感交流')
                    ]
                },
                {
                    id: 'knowledge-growth', name: '个人成长', enabled: true, children: [
                        leaf('growth-skill', '技能分享')
                    ]
                }
            ]
        }
    ];

    var listeners = [];
    var cache = null;

    function clone(v) {
        return JSON.parse(JSON.stringify(v));
    }

    function normalizeNode(node, level) {
        var out = {
            id: String(node.id),
            name: String(node.name || ''),
            enabled: node.enabled !== false,
            level: level
        };
        if (level === 1) {
            out.icon = node.icon || '📁';
            if (node.system) out.system = true;
        }
        if (level < 3) {
            out.children = (node.children || []).map(function (c) {
                return normalizeNode(c, level + 1);
            });
        }
        return out;
    }

    function normalizeTree(tree) {
        if (!Array.isArray(tree) || !tree.length) return null;
        return tree.map(function (n) { return normalizeNode(n, 1); });
    }

    function readStorage() {
        try {
            var raw = global.localStorage && localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return normalizeTree(JSON.parse(raw));
        } catch (e) {
            return null;
        }
    }

    function getTree() {
        if (!cache) cache = readStorage() || normalizeTree(clone(DEFAULT_TREE));
        return cache;
    }

    function emit() {
        listeners.forEach(function (fn) {
            try { fn(getTree()); } catch (e) { /* ignore */ }
        });
    }

    function save(tree) {
        cache = normalizeTree(tree) || normalizeTree(clone(DEFAULT_TREE));
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
        } catch (e) { /* ignore */ }
        emit();
        return cache;
    }

    function reset() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
        cache = normalizeTree(clone(DEFAULT_TREE));
        emit();
        return cache;
    }

    /** 一级类目 —— 用户端唯一展示层级 */
    function getLevel1(opts) {
        opts = opts || {};
        return getTree().filter(function (n) {
            return opts.includeDisabled ? true : n.enabled;
        });
    }

    function walk(fn) {
        getTree().forEach(function (l1) {
            if (fn(l1, [l1]) === false) return;
            (l1.children || []).forEach(function (l2) {
                if (fn(l2, [l1, l2]) === false) return;
                (l2.children || []).forEach(function (l3) {
                    fn(l3, [l1, l2, l3]);
                });
            });
        });
    }

    function getPath(id) {
        var hit = null;
        walk(function (node, path) {
            if (!hit && node.id === id) hit = path.slice();
        });
        return hit;
    }

    function getNode(id) {
        var path = getPath(id);
        return path ? path[path.length - 1] : null;
    }

    function getChildren(id) {
        var node = getNode(id);
        return (node && node.children) || [];
    }

    /** 归类落点：内容必须挂在三级叶子上 */
    function getLeaves(opts) {
        opts = opts || {};
        var out = [];
        walk(function (node, path) {
            if (path.length !== 3) return;
            if (!opts.includeDisabled && path.some(function (n) { return !n.enabled; })) return;
            out.push({ node: node, path: path });
        });
        return out;
    }

    function isLeaf(id) {
        var path = getPath(id);
        return !!path && path.length === 3;
    }

    /** 任意层级 id → 所属一级类目 id（发现页 Tab 归属） */
    function rootIdOf(id) {
        var path = getPath(id);
        return path ? path[0].id : null;
    }

    function getPathLabel(id, sep) {
        var path = getPath(id);
        if (!path) return '';
        return path.map(function (n) { return n.name; }).join(sep || ' / ');
    }

    function searchLeaves(keyword) {
        var kw = String(keyword || '').trim().toLowerCase();
        if (!kw) return [];
        return getLeaves().filter(function (item) {
            return item.path.some(function (n) {
                return n.name.toLowerCase().indexOf(kw) >= 0 || n.id.indexOf(kw) >= 0;
            });
        });
    }

    function onChange(fn) {
        if (typeof fn === 'function') listeners.push(fn);
    }

    if (global.addEventListener) {
        global.addEventListener('storage', function (e) {
            if (e && e.key === STORAGE_KEY) {
                cache = readStorage();
                emit();
            }
        });
    }

    global.FL_CONTENT_TAXONOMY = {
        STORAGE_KEY: STORAGE_KEY,
        HOT_ID: HOT_ID,
        defaultTree: DEFAULT_TREE,
        getTree: getTree,
        getLevel1: getLevel1,
        getChildren: getChildren,
        getNode: getNode,
        getPath: getPath,
        getPathLabel: getPathLabel,
        getLeaves: getLeaves,
        isLeaf: isLeaf,
        rootIdOf: rootIdOf,
        searchLeaves: searchLeaves,
        save: save,
        reset: reset,
        onChange: onChange
    };
})(typeof window !== 'undefined' ? window : this);
