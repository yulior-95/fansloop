/**
 * 积分 · Mock 数据层（首页 / 个人主页共用）
 * API: GET /api/v1/wallet/points · GET /api/v1/points/tasks
 */
(function (global) {
    var LS_TASKS_BASE = 'fl_points_tasks_state_v1';

    function getCurrentUserId() {
        if (global.GoodfansAuth && global.GoodfansAuth.getUserId) {
            var id = global.GoodfansAuth.getUserId();
            if (id) return id;
        }
        return 'default';
    }

    function getTasksStorageKey() {
        return LS_TASKS_BASE + '_' + getCurrentUserId();
    }

    var LUNA_USER_ID = 'demo_uid_882910';

    function getCurrentAccount() {
        var uid = getCurrentUserId();
        if (!uid || uid === 'default' || !global.FLUserRegistry) return null;
        return global.FLUserRegistry.getByUserId(uid);
    }

    function isLunaDemoAccount(account) {
        return account && account.userId === LUNA_USER_ID;
    }

    function freshTasksForNewUser() {
        return DEFAULT_TASKS.map(function (t) {
            var row = Object.assign({}, t);
            if (t.id === 'act_checkin') {
                row.status = 'claimable';
            } else if (t.id === 'act_first_sub') {
                row.status = 'locked';
            } else {
                row.status = 'in_progress';
                if (row.progressType === 'daily_claim') row.dailyClaimed = 0;
                if (row.progressType === 'timer') row.timerCurrent = 0;
            }
            return row;
        });
    }

    function freshLedgerForNewUser() {
        var now = new Date();
        var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
        var ts = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
            ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
        return [{
            id: 'lg_welcome',
            time: ts,
            task: '注册欢迎奖励',
            type: 'earn',
            points: 200,
            status: 'frozen',
            unfreezeAt: '冷静期后可用'
        }];
    }

    function applyAccountScopedContent(merged, account) {
        if (!account || isLunaDemoAccount(account)) return merged;
        if (account.isNewUser || (account.pointsWallet && account.pointsWallet.available === 0 && account.pointsWallet.todayEarned === 0)) {
            merged.tasks = freshTasksForNewUser();
            merged.ledger = freshLedgerForNewUser();
            merged.wallet.frozenHint = account.pointsWallet.frozenHint || merged.wallet.frozenHint;
        }
        return merged;
    }

    var DEFAULT_TASKS = [
        {
            id: 'act_watch_30',
            name: '观看直播满 30 分钟',
            icon: 'fa-tower-broadcast',
            iconColor: '#EF4444',
            reward: 50,
            rewardDesc: '+50 积分 / 次 · 每日最多 3 次',
            progressType: 'daily_claim',
            dailyClaimed: 1,
            dailyClaimMax: 3,
            claimUnit: '次',
            status: 'in_progress',
            image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=120&q=80',
            actionHref: 'home.html?feed=live',
            actionType: 'navigate'
        },
        {
            id: 'act_checkin',
            name: '每日签到',
            icon: 'fa-calendar-check',
            iconColor: '#10B981',
            reward: 20,
            rewardDesc: '每日签到领取 +20 积分',
            progressType: 'none',
            status: 'claimable',
            image: 'https://cdn.pixabay.com/photo/2016/11/29/09/16/architecture-1868667_640.jpg',
            actionType: 'claim',
            claimToast: '签到成功'
        },
        {
            id: 'act_invite_ref',
            name: '邀请好友注册',
            icon: 'fa-user-group',
            iconColor: '#A855F7',
            reward: 200,
            rewardDesc: '双方各 +200 · 每日邀请奖励上限 3 人',
            progressType: 'daily_claim',
            dailyClaimed: 2,
            dailyClaimMax: 3,
            claimUnit: '人',
            status: 'in_progress',
            image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=120&q=80',
            actionHref: 'profile.html?view=invite',
            actionType: 'navigate',
            navigateToast: '前往邀请数据页分享邀请码'
        },
        {
            id: 'act_first_sub',
            name: '首次订阅创作者',
            icon: 'fa-crown',
            iconColor: '#FBBF24',
            reward: 200,
            rewardDesc: '终身 1 次 · 订阅任意创作者后解锁',
            progressType: 'none',
            status: 'locked',
            image: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=120',
            actionHref: 'discover.html',
            actionType: 'navigate',
            navigateToast: '去发现页订阅任意创作者，完成后可领取'
        },
        {
            id: 'act_timer',
            name: '浏览赚积分（计时）',
            icon: 'fa-hourglass-half',
            iconColor: '#3B82F6',
            reward: 128,
            rewardDesc: '浏览首页倒计时结束自动发放',
            progressType: 'timer',
            timerCurrent: 42,
            timerTotal: 60,
            status: 'in_progress',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&q=80',
            actionHref: 'home.html',
            actionType: 'navigate',
            navigateToast: '返回首页继续浏览，倒计时结束后发放积分'
        }
    ];

    var DEFAULT = {
        wallet: {
            available: 12580,
            frozen: 1400,
            frozenHint: '含 3 笔邀请奖励，6/8 起陆续解冻',
            todayEarned: 310,
            todayCap: 480
        },
        coolingPeriodDays: 7,
        tasks: DEFAULT_TASKS,
        ledger: [
            { id: 'lg_001', time: '2026-06-10 09:42', task: '每日签到', type: 'earn', points: 20, status: 'available' },
            { id: 'lg_002', time: '2026-06-10 08:15', task: '观看直播满 30 分钟', type: 'earn', points: 50, status: 'available' },
            { id: 'lg_003', time: '2026-06-09 22:30', task: '浏览赚积分', type: 'earn', points: 128, status: 'available' },
            { id: 'lg_004', time: '2026-06-09 18:05', task: '邀请好友 · 胶片爱好者', type: 'earn', points: 200, status: 'frozen', unfreezeAt: '2026-06-16' },
            { id: 'lg_005', time: '2026-06-08 14:20', task: '兑换 · 订阅 9 折券', type: 'spend', points: -800, status: 'spent' },
            { id: 'lg_006', time: '2026-06-07 11:00', task: '邀请好友 · 夜雨听弦', type: 'earn', points: 200, status: 'frozen', unfreezeAt: '2026-06-14' },
            { id: 'lg_007', time: '2026-06-06 20:45', task: '观看直播满 30 分钟', type: 'earn', points: 50, status: 'available' },
            { id: 'lg_008', time: '2026-06-05 16:30', task: '幸运转盘', type: 'spend', points: -500, status: 'spent' }
        ],
        mallHot: [
            {
                name: '付费内容试看券',
                cost: 1600,
                image: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=200'
            },
            {
                name: '积分加速卡 · 24h',
                cost: 1200,
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&q=80'
            }
        ]
    };

    function formatPoints(n) {
        return Number(n).toLocaleString('zh-CN');
    }

    function getTotalPoints(wallet) {
        return (wallet.available || 0) + (wallet.frozen || 0);
    }

    function loadTaskState() {
        try {
            return JSON.parse(localStorage.getItem(getTasksStorageKey()) || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveTaskState(patch) {
        var cur = loadTaskState();
        Object.keys(patch).forEach(function (k) {
            cur[k] = Object.assign({}, cur[k] || {}, patch[k]);
        });
        try {
            localStorage.setItem(getTasksStorageKey(), JSON.stringify(cur));
        } catch (e) { /* ignore */ }
    }

    function applyAccountWallet(wallet) {
        var account = getCurrentAccount();
        if (!account || !account.pointsWallet) return wallet;
        wallet.available = account.pointsWallet.available;
        wallet.frozen = account.pointsWallet.frozen;
        if (account.pointsWallet.frozenHint != null) wallet.frozenHint = account.pointsWallet.frozenHint;
        if (account.pointsWallet.todayEarned != null) wallet.todayEarned = account.pointsWallet.todayEarned;
        if (account.pointsWallet.todayCap != null) wallet.todayCap = account.pointsWallet.todayCap;
        wallet.total = getTotalPoints(wallet);
        return wallet;
    }

    function mergeInviteConfig(merged) {
        if (!global.FLInviteReward || !global.FLInviteReward.DEFAULT) return;
        var cfg = global.FLInviteReward.DEFAULT;
        var account = getCurrentAccount();
        try {
            var raw = localStorage.getItem('fl_points_risk_config_v1');
            if (raw) {
                var risk = JSON.parse(raw);
                if (risk.coolingEnabled === false) merged.coolingPeriodDays = 0;
                else if (risk.coolingPeriodDays != null) merged.coolingPeriodDays = risk.coolingPeriodDays;
                if (risk.caps && risk.caps.dailyPointsCap != null) {
                    merged.wallet.todayCap = risk.caps.dailyPointsCap;
                }
            }
        } catch (e) { /* ignore */ }
        if (cfg.caps && cfg.caps.dailyPointsCap != null && merged.wallet.todayCap == null) {
            merged.wallet.todayCap = cfg.caps.dailyPointsCap;
        }
        if (merged.coolingPeriodDays == null) {
            merged.coolingPeriodDays = cfg.coolingPeriodDays || 7;
        }
        if (!account && cfg.pointsWallet) {
            merged.wallet.available = cfg.pointsWallet.available;
            merged.wallet.frozen = cfg.pointsWallet.frozen;
            merged.wallet.frozenHint = cfg.pointsWallet.frozenHint;
            if (cfg.caps) merged.wallet.todayEarned = cfg.caps.dailyPointsEarned;
        }
    }

    function applyTaskPersistence(tasks) {
        var saved = loadTaskState();
        return tasks.map(function (t) {
            var row = Object.assign({}, t);
            var s = saved[t.id];
            if (s) {
                if (s.status) row.status = s.status;
                if (typeof s.dailyClaimed === 'number') row.dailyClaimed = s.dailyClaimed;
                if (typeof s.timerCurrent === 'number') row.timerCurrent = s.timerCurrent;
            }
            return row;
        });
    }

    function applyWalletPersistence(wallet) {
        if (getCurrentAccount()) return wallet;
        var saved = loadTaskState()._wallet;
        if (saved) {
            if (typeof saved.available === 'number') wallet.available = saved.available;
            if (typeof saved.todayEarned === 'number' && !global.FLPointsRewardService) {
                wallet.todayEarned = saved.todayEarned;
            }
        }
        wallet.total = getTotalPoints(wallet);
        return wallet;
    }

    function enrichLedgerWithTier(ledger) {
        if (!global.FLPointsTier) return ledger;
        var RS = global.FLPointsRewardService;
        var cfg = RS && RS.loadPublishedConfig ? RS.loadPublishedConfig() : global.FLPointsTier.loadConfig();
        var userId = getCurrentUserId();
        var user = RS && RS.getUserProfile ? RS.getUserProfile(userId !== 'default' ? userId : undefined) : global.FLPointsTier.DEFAULT_USER;
        return ledger.map(function (row) {
            return global.FLPointsTier.enrichLedgerRow(row, cfg, user);
        });
    }

    function emitPointsChange(data) {
        try {
            global.dispatchEvent(new CustomEvent('fl-points-data-change', { detail: data }));
        } catch (e) { /* ignore */ }
    }

    function finalizeClaimResult(data, task, payload) {
        data.wallet.total = getTotalPoints(data.wallet);
        emitPointsChange(data);
        return payload;
    }

    function fetchPointsData() {
        var account = getCurrentAccount();
        var merged = JSON.parse(JSON.stringify(DEFAULT));
        mergeInviteConfig(merged);
        applyAccountScopedContent(merged, account);
        applyWalletPersistence(merged.wallet);
        if (global.FLPointsRewardService && global.FLPointsRewardService.syncWalletFromServer) {
            global.FLPointsRewardService.syncWalletFromServer(merged.wallet);
        }
        if (global.MallVouchersStore && global.MallVouchersStore.applyWalletDailyCap) {
            global.MallVouchersStore.applyWalletDailyCap(merged.wallet);
        }
        applyAccountWallet(merged.wallet);
        merged.tasks = applyTaskPersistence(merged.tasks);
        if (global.FLCheckin && global.FLCheckin.syncTasks) {
            merged.tasks = global.FLCheckin.syncTasks(merged.tasks);
        }
        merged.ledger = enrichLedgerWithTier(merged.ledger);
        merged.wallet.total = getTotalPoints(merged.wallet);
        return Promise.resolve(merged);
    }

    function claimTask(taskId) {
        return fetchPointsData().then(function (data) {
            var task = data.tasks.find(function (t) { return t.id === taskId; });
            if (!task || task.status !== 'claimable') return null;

            var RS = global.FLPointsRewardService;
            if (RS && RS.settleTaskClaim) {
                return RS.settleTaskClaim({ taskId: taskId }).then(function (result) {
                    if (result.rejected) {
                        return {
                            data: data,
                            task: task,
                            rejected: true,
                            toast: result.reason || '领取失败'
                        };
                    }
                    task.status = 'claimed';
                    task.reward = result.finalPoints;
                    data.wallet.available += result.finalPoints;
                    data.wallet.todayEarned = result.dailyEarned;
                    data.wallet.todayCap = result.dailyCap;
                    var patch = {};
                    patch[taskId] = { status: 'claimed' };
                    patch._wallet = {
                        available: data.wallet.available,
                        todayEarned: data.wallet.todayEarned
                    };
                    if (global.FLUserRegistry && global.GoodfansAuth) {
                        var uid = global.GoodfansAuth.getUserId();
                        if (uid) {
                            global.FLUserRegistry.updatePointsWallet(uid, {
                                available: data.wallet.available,
                                todayEarned: data.wallet.todayEarned
                            });
                        }
                    }
                    if (taskId === 'act_checkin' && global.FLCheckin && global.FLCheckin.recordClaim) {
                        global.FLCheckin.recordClaim(global.FLCheckin.getStatus().nextStreakDay);
                    }
                    saveTaskState(patch);
                    return finalizeClaimResult(data, task, {
                        data: data,
                        task: task,
                        tierDetail: result.tierDetail,
                        toast: (task.claimToast || '领取成功') + (result.voucherNote || '')
                    });
                });
            }

            var bonusMsg = '';
            if (taskId === 'act_checkin' && global.MallVouchersStore) {
                var dbl = global.MallVouchersStore.getActiveCheckinDouble();
                if (dbl) {
                    var mult = dbl.multiplier || 2;
                    task.reward = task.reward * mult;
                    global.MallVouchersStore.consumeCheckinDouble(dbl.id);
                    bonusMsg = ' · 翻倍卡生效';
                }
            }
            task.status = 'claimed';
            data.wallet.available += task.reward;
            data.wallet.todayEarned += task.reward;
            data.wallet.total = getTotalPoints(data.wallet);
            var patch = {};
            patch[taskId] = { status: 'claimed' };
            patch._wallet = {
                available: data.wallet.available,
                todayEarned: data.wallet.todayEarned
            };
            if (global.FLUserRegistry && global.GoodfansAuth) {
                var uid2 = global.GoodfansAuth.getUserId();
                if (uid2) {
                    global.FLUserRegistry.updatePointsWallet(uid2, {
                        available: data.wallet.available,
                        todayEarned: data.wallet.todayEarned
                    });
                }
            }
            if (taskId === 'act_checkin' && global.FLCheckin && global.FLCheckin.recordClaim) {
                global.FLCheckin.recordClaim(global.FLCheckin.getStatus().nextStreakDay);
            }
            saveTaskState(patch);
            return finalizeClaimResult(data, task, {
                data: data,
                task: task,
                toast: (task.claimToast || '领取成功') + bonusMsg
            });
        });
    }

    function resetTaskState() {
        try { localStorage.removeItem(getTasksStorageKey()); } catch (e) { /* ignore */ }
    }

    global.FLHomePoints = {
        DEFAULT: DEFAULT,
        formatPoints: formatPoints,
        getTotalPoints: getTotalPoints,
        fetchPointsData: fetchPointsData,
        claimTask: claimTask,
        resetTaskState: resetTaskState,
        saveTaskState: saveTaskState,
        loadTaskState: loadTaskState
    };
})(typeof window !== 'undefined' ? window : this);
