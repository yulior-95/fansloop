/**
 * 原型 · 多用户账号注册表（按邮箱区分，localStorage 持久化）
 */
(function (global) {
    var LS_REGISTRY = 'fl_user_registry_v1';
    var DEMO_USER_ID = 'demo_uid_882910';

    /* Identity model: account identity is separate from creator eligibility and
       subscription relationships. `role` remains as a compatibility alias for
       older prototype pages. */
    var IDENTITY = {
        ACCOUNT_TYPE_USER: 'user',
        ACCOUNT_TYPE_PLATFORM: 'platform',
        CREATOR_NONE: 'none',
        CREATOR_PENDING: 'pending',
        CREATOR_APPROVED: 'approved'
    };

    function isCreator(account) {
        return !!account && (account.creatorStatus === IDENTITY.CREATOR_APPROVED || account.role === 'Creator');
    }

    function normalizeIdentity(account) {
        if (!account) return account;
        if (!account.accountType) account.accountType = IDENTITY.ACCOUNT_TYPE_USER;
        if (!account.creatorStatus) {
            account.creatorStatus = account.role === 'Creator'
                ? IDENTITY.CREATOR_APPROVED
                : IDENTITY.CREATOR_NONE;
        }
        if (!account.subscriptionRelations) account.subscriptionRelations = [];
        return account;
    }

    function isSubscribedTo(account, creatorId) {
        normalizeIdentity(account);
        return account.subscriptionRelations.some(function (r) {
            return r.creatorId === creatorId && r.status === 'active';
        });
    }

    function setSubscription(account, creatorId, status, plan) {
        normalizeIdentity(account);
        var relation = account.subscriptionRelations.filter(function (r) { return r.creatorId === creatorId; })[0];
        if (!relation) {
            relation = { creatorId: creatorId, status: 'inactive', plan: plan || null };
            account.subscriptionRelations.push(relation);
        }
        relation.status = status === 'active' ? 'active' : 'inactive';
        if (plan != null) relation.plan = plan;
        return relation;
    }

    var AVATARS = [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200'
    ];

    var EMOJIS = ['🌙', '✨', '🎬', '📷', '🎵', '🚀', '🌸', '⚡', '🍜', '🎮'];

    var BIOS = [
        '刚加入 GOODFANS，正在探索创作者与粉丝的新连接方式。',
        '摄影 / 旅行爱好者 · 用镜头记录日常。',
        '独立音乐人 · 偶尔直播 · 欢迎点歌。',
        '游戏与电竞内容 · 周末固定开播。',
        '美食探店 · 城市漫步 · 分享生活小确幸。'
    ];

    function normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    function hashStr(str) {
        var h = 2166136261;
        for (var i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return (h >>> 0).toString(16);
    }

    function formatDisplayName(local, hash) {
        var base = local.replace(/[._+-]/g, ' ').replace(/\s+/g, ' ').trim();
        if (!base) base = 'LoopUser';
        base = base.charAt(0).toUpperCase() + base.slice(1);
        var emoji = EMOJIS[parseInt(hash.slice(0, 2), 16) % EMOJIS.length];
        return base + ' ' + emoji;
    }

    function walletShort(addr) {
        if (!addr) return '0x7A3F...3F2C';
        return addr.slice(0, 6) + '...' + addr.slice(-4);
    }

    /** 与运营后台用户列表一致的对客 UID（6 位数字） */
    function resolvePublicUid(account) {
        if (!account) return '';
        if (account.publicUid) return String(account.publicUid);
        var userId = String(account.userId || '');
        var tail = userId.match(/(\d{6})$/);
        if (tail) return tail[1];
        var hash = hashStr(account.email || userId);
        return String((parseInt(hash.slice(0, 8), 16) % 900000) + 100000);
    }

    function lunaSeed() {
        return {
            userId: DEMO_USER_ID,
            publicUid: '882910',
            email: 'luna@goodfans.io',
            name: 'Luna 🌙',
            avatar: AVATARS[0],
            role: 'Creator',
            accountType: IDENTITY.ACCOUNT_TYPE_USER,
            creatorStatus: IDENTITY.CREATOR_APPROVED,
            subscriptionRelations: [],
            bio: '📷 旅行 / 美食 / 慢生活 摄影师｜📍现居东京｜35mm 定焦执着患者｜合作请私信',
            walletAddress: '0x7A3F8b2C91e4F3a2C8d1E6b9F0a2D3F2C',
            joinedAt: '2024 年 3 月',
            location: '日本 · 东京',
            isNewUser: false,
            assets: null,
            pointsWallet: {
                available: 12580,
                frozen: 1400,
                frozenHint: '含 3 笔邀请奖励，6/8 起陆续解冻',
                todayEarned: 310,
                todayCap: 480
            },
            tierProfile: {
                userId: DEMO_USER_ID,
                registerDays: 18,
                newUserTierDaysAtRegister: 5,
                newUserTierMultiplierAtRegister: 1.08,
                consecutiveLoginDays: 6,
                consecutiveLoginBonusDaysUsed: 0,
                engagementActions: 2,
                engagementDistinctPosts: 1,
                engagementDistinctAuthors: 1,
                engagementSelfContentOnly: false,
                hasActivePaidSubscription: false,
                subscriptionPaidAmount: 0,
                subscriptionDays: 0
            }
        };
    }

    function readStore() {
        try {
            var raw = localStorage.getItem(LS_REGISTRY);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return { accounts: {}, byUserId: {} };
    }

    function writeStore(store) {
        try {
            localStorage.setItem(LS_REGISTRY, JSON.stringify(store));
        } catch (e) { /* ignore */ }
    }

    function saveAccount(account) {
        var store = readStore();
        var email = normalizeEmail(account.email);
        if (!account.publicUid) account.publicUid = resolvePublicUid(account);
        store.accounts[email] = account;
        store.byUserId[account.userId] = email;
        writeStore(store);
        return account;
    }

    function seedIfEmpty(store) {
        if (Object.keys(store.accounts).length) return store;
        var luna = lunaSeed();
        store.accounts[luna.email] = luna;
        store.byUserId[luna.userId] = luna.email;

        var maya = buildAccount('maya@example.com', { isNewUser: false, registerDays: 12 });
        maya.name = 'Maya ✨';
        maya.role = 'Fan';
        maya.accountType = IDENTITY.ACCOUNT_TYPE_USER;
        maya.creatorStatus = IDENTITY.CREATOR_NONE;
        maya.avatar = AVATARS[2];
        maya.pointsWallet = { available: 2460, frozen: 0, frozenHint: '', todayEarned: 80, todayCap: 480 };
        maya.isNewUser = false;
        store.accounts[maya.email] = maya;
        store.byUserId[maya.userId] = maya.email;

        var kira = buildAccount('kira@example.com', { isNewUser: false, registerDays: 45 });
        kira.name = 'Kira 🎬';
        kira.role = 'Creator';
        kira.accountType = IDENTITY.ACCOUNT_TYPE_USER;
        kira.creatorStatus = IDENTITY.CREATOR_APPROVED;
        kira.avatar = AVATARS[3];
        kira.bio = '独立导演 · Vlog / 幕后花絮 · 合作 DM';
        kira.pointsWallet = { available: 5820, frozen: 400, frozenHint: '1 笔邀请奖励冷静中', todayEarned: 150, todayCap: 480 };
        store.accounts[kira.email] = kira;
        store.byUserId[kira.userId] = kira.email;

        writeStore(store);
        return store;
    }

    function buildAccount(email, opts) {
        opts = opts || {};
        email = normalizeEmail(email);
        var hash = hashStr(email);
        var local = email.split('@')[0] || 'user';
        var isNew = !!opts.isNewUser;
        var registerDays = isNew ? 0 : (opts.registerDays != null ? opts.registerDays : 5 + (parseInt(hash.slice(2, 4), 16) % 20));
        var userId = email === 'luna@goodfans.io' ? DEMO_USER_ID : ('uid_' + hash.slice(0, 10));

        var available = isNew ? 0 : 800 + (parseInt(hash.slice(4, 6), 16) % 40) * 50;
        var frozen = isNew ? 200 : (parseInt(hash.slice(6, 8), 16) % 3) * 200;

        return {
            userId: userId,
            publicUid: resolvePublicUid({ userId: userId, email: email }),
            email: email,
            name: formatDisplayName(local, hash),
            avatar: AVATARS[parseInt(hash.slice(0, 2), 16) % AVATARS.length],
            role: isNew ? 'Fan' : (parseInt(hash.slice(1, 2), 16) % 3 === 0 ? 'Creator' : 'Fan'),
            accountType: IDENTITY.ACCOUNT_TYPE_USER,
            creatorStatus: isNew ? IDENTITY.CREATOR_NONE : (parseInt(hash.slice(1, 2), 16) % 3 === 0 ? IDENTITY.CREATOR_APPROVED : IDENTITY.CREATOR_NONE),
            subscriptionRelations: [],
            bio: isNew ? '欢迎来到 GOODFANS！完善资料后开始探索吧。' : BIOS[parseInt(hash.slice(2, 3), 16) % BIOS.length],
            walletAddress: '0x' + hash.slice(0, 4).toUpperCase() + hash.slice(4, 8) + 'a1b2c3d4e5f6789012345678' + hash.slice(8, 12),
            joinedAt: isNew ? '刚刚' : (2024 + (parseInt(hash.slice(3, 4), 16) % 2)) + ' 年 ' + ((parseInt(hash.slice(5, 6), 16) % 12) + 1) + ' 月',
            location: ['中国 · 上海', '中国 · 北京', '新加坡', '日本 · 东京', '美国 · 加州'][parseInt(hash.slice(7, 8), 16) % 5],
            isNewUser: isNew,
            assets: null,
            pointsWallet: {
                available: available,
                frozen: frozen,
                frozenHint: isNew ? '注册欢迎奖励 · 冷静期后可兑换' : (frozen > 0 ? '含邀请奖励，冷静期后可兑换' : ''),
                todayEarned: isNew ? 0 : parseInt(hash.slice(8, 10), 16) % 200,
                todayCap: 480
            },
            tierProfile: {
                userId: userId,
                registerDays: registerDays,
                newUserTierDaysAtRegister: 7,
                newUserTierMultiplierAtRegister: isNew ? 1.15 : 1.08,
                consecutiveLoginDays: isNew ? 1 : 2 + (parseInt(hash.slice(10, 12), 16) % 5),
                consecutiveLoginBonusDaysUsed: 0,
                engagementActions: isNew ? 0 : parseInt(hash.slice(12, 14), 16) % 4,
                engagementDistinctPosts: isNew ? 0 : parseInt(hash.slice(14, 16), 16) % 2,
                engagementDistinctAuthors: isNew ? 0 : 1,
                engagementSelfContentOnly: false,
                hasActivePaidSubscription: false,
                subscriptionPaidAmount: 0,
                subscriptionDays: 0
            }
        };
    }

    function getByEmail(email) {
        email = normalizeEmail(email);
        if (!email) return null;
        var store = seedIfEmpty(readStore());
        return normalizeIdentity(store.accounts[email] || null);
    }

    function getByUserId(userId) {
        if (!userId) return null;
        var store = seedIfEmpty(readStore());
        var email = store.byUserId[userId];
        return email ? normalizeIdentity(store.accounts[email]) : null;
    }

    function registerEmail(email, opts) {
        email = normalizeEmail(email);
        if (!email) return null;
        var existing = getByEmail(email);
        if (existing) return existing;
        var account = email === 'luna@goodfans.io' ? lunaSeed() : buildAccount(email, { isNewUser: true });
        if (opts && opts.name) account.name = opts.name;
        return saveAccount(account);
    }

    function loginEmail(email) {
        email = normalizeEmail(email);
        if (!email) return null;
        var account = getByEmail(email);
        if (!account) {
            account = buildAccount(email, { isNewUser: true });
            saveAccount(account);
        }
        return account;
    }

    function loginWallet(walletAddress, isRegister) {
        var addr = String(walletAddress || '0x7c5A8D93a1b2c3d4e5f6789012345678901234').toLowerCase();
        var email = 'wallet+' + addr + '@goodfans.io';
        if (isRegister) return registerEmail(email, {});
        return loginEmail(email);
    }

    function updateProfile(email, patch) {
        email = normalizeEmail(email);
        var account = getByEmail(email);
        if (!account) return null;
        Object.keys(patch || {}).forEach(function (k) {
            if (patch[k] != null) account[k] = patch[k];
        });
        if (account.isNewUser && patch.name) account.isNewUser = false;
        return saveAccount(account);
    }

    function updatePointsWallet(userId, patch) {
        var account = getByUserId(userId);
        if (!account) return null;
        account.pointsWallet = Object.assign({}, account.pointsWallet || {}, patch || {});
        return saveAccount(account);
    }

    function toSessionUser(account) {
        if (!account) return null;
        normalizeIdentity(account);
        return {
            userId: account.userId,
            publicUid: resolvePublicUid(account),
            email: account.email,
            name: account.name,
            avatar: account.avatar,
            role: account.role,
            accountType: account.accountType,
            creatorStatus: account.creatorStatus,
            subscriptionRelations: account.subscriptionRelations || [],
            bio: account.bio,
            walletAddress: account.walletAddress,
            walletShort: walletShort(account.walletAddress),
            joinedAt: account.joinedAt,
            location: account.location,
            isNewUser: !!account.isNewUser
        };
    }

    function ensureTierProfile(account) {
        if (!account || !global.FLPointsRewardService) return;
        var RS = global.FLPointsRewardService;
        if (!RS.getUserProfile || !RS.saveProfile) return;
        var cur = RS.getUserProfile(account.userId);
        if (!cur && account.tierProfile) {
            RS.saveProfile(JSON.parse(JSON.stringify(account.tierProfile)));
        }
    }

    function persistAccount(account) {
        return saveAccount(account);
    }

    global.FLUserRegistry = {
        DEMO_USER_ID: DEMO_USER_ID,
        normalizeEmail: normalizeEmail,
        getByEmail: getByEmail,
        getByUserId: getByUserId,
        registerEmail: registerEmail,
        loginEmail: loginEmail,
        loginWallet: loginWallet,
        updateProfile: updateProfile,
        updatePointsWallet: updatePointsWallet,
        persistAccount: persistAccount,
        toSessionUser: toSessionUser,
        resolvePublicUid: resolvePublicUid,
        ensureTierProfile: ensureTierProfile,
        walletShort: walletShort
    };

    global.FLIdentity = {
        values: IDENTITY,
        isCreator: isCreator,
        isPlatform: function (actor) {
            return !!actor && actor.accountType === IDENTITY.ACCOUNT_TYPE_PLATFORM;
        },
        normalize: normalizeIdentity,
        isSubscribedTo: isSubscribedTo,
        setSubscription: setSubscription,
        displayRole: function (actor) {
            if (global.FLIdentity.isPlatform(actor)) return '平台';
            return isCreator(actor) ? '创作者' : '用户';
        }
    };
})(typeof window !== 'undefined' ? window : this);
