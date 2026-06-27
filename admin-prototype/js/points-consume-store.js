/**
 * 积分消耗流水 · 后台 Mock（与活动 Store / C 端 ledger 口径对齐）
 * API: GET /api/v1/admin/points-consume-ledger
 *
 * 字段说明：
 *   activityCode  — 活动编码（activities-points-store.code）
 *   ruleName      — 消耗规则展示名（活动名称或业务动作名）
 *   consumeScene  — 消耗场景枚举（筛选 / 统计）
 *   refType       — 关联对象类型：mall_activity | post | wheel_session
 *   refId         — 关联对象 ID
 *   refName       — 关联对象可读名称
 *   balanceAvailable — 本笔扣减后的可用积分快照
 *   balanceTotal     — 本笔扣减后的总积分快照（可用 + 冷静中）
 */
(function (global) {
    var CONSUME_SCENES = {
        mall_redeem: { label: '商城兑换', hint: '积分商城兑换商品 / 券包' },
        lucky_wheel: { label: '幸运转盘', hint: '转盘每次抽奖扣积分' },
        unlock_ppv: { label: '解锁内容', hint: '积分直接解锁单篇付费帖' }
    };

    var REF_TYPE_LABELS = {
        mall_activity: '活动',
        post: '内容',
        wheel_session: '转盘场次'
    };

    var MOCK_LEDGER = [
        {
            id: 'csp_001',
            time: '2026-06-08 14:20:11',
            uid: '882910',
            activityCode: 'REDEEM_SUB_90',
            activityId: 'act_sub90',
            ruleName: '订阅 9 折券',
            points: -2200,
            consumeScene: 'mall_redeem',
            refType: 'mall_activity',
            refId: 'act_sub90',
            refName: '订阅 9 折券',
            orderId: 'RD88211',
            balanceAvailable: 12580,
            balanceTotal: 13980
        },
        {
            id: 'csp_002',
            time: '2026-06-05 16:30:42',
            uid: '882910',
            activityCode: 'LUCKY_WHEEL',
            activityId: 'act_wheel',
            ruleName: '幸运转盘',
            points: -500,
            consumeScene: 'lucky_wheel',
            refType: 'wheel_session',
            refId: 'spin_20260605_882910',
            refName: '幸运转盘 · 第 3 次',
            orderId: 'RD88102',
            balanceAvailable: 14780,
            balanceTotal: 16180
        },
        {
            id: 'csp_003',
            time: '2026-06-04 11:08:33',
            uid: '445201',
            activityCode: 'REDEEM_TRIAL',
            activityId: 'act_trial_coupon',
            ruleName: '付费内容试看券',
            points: -1600,
            consumeScene: 'mall_redeem',
            refType: 'mall_activity',
            refId: 'act_trial_coupon',
            refName: '付费内容试看券',
            orderId: 'RD88056',
            balanceAvailable: 1680,
            balanceTotal: 1880
        },
        {
            id: 'csp_004',
            time: '2026-05-09 19:02:18',
            uid: '445201',
            activityCode: null,
            activityId: null,
            ruleName: '积分解锁付费帖',
            points: -120,
            consumeScene: 'unlock_ppv',
            refType: 'post',
            refId: 'post_7712',
            refName: '海边日落 Vlog · 4K 直出',
            orderId: 'RD77890',
            balanceAvailable: 3280,
            balanceTotal: 3280
        },
        {
            id: 'csp_006',
            time: '2026-05-08 15:18:22',
            uid: '445201',
            activityCode: 'REDEEM_MEMBER_7D',
            activityId: 'act_member_7d',
            ruleName: '会员身份 · 7 天',
            points: -5500,
            consumeScene: 'mall_redeem',
            refType: 'mall_activity',
            refId: 'act_member_7d',
            refName: '会员身份 · 7 天',
            orderId: 'RD88102',
            balanceAvailable: 3400,
            balanceTotal: 3400
        },
        {
            id: 'csp_005',
            time: '2026-05-08 09:15:07',
            uid: '102938',
            activityCode: 'REDEEM_BOOST',
            activityId: 'act_boost_card',
            ruleName: '积分加速卡 · 24h',
            points: -1200,
            consumeScene: 'mall_redeem',
            refType: 'mall_activity',
            refId: 'act_boost_card',
            refName: '积分加速卡 · 24h',
            orderId: 'RD77801',
            balanceAvailable: 5600,
            balanceTotal: 6000
        }
    ];

    function getSceneRows() {
        return Object.keys(CONSUME_SCENES).map(function (key) {
            return Object.assign({ id: key }, CONSUME_SCENES[key]);
        });
    }

    function formatRef(row) {
        var typeLabel = REF_TYPE_LABELS[row.refType] || '对象';
        return typeLabel + ' ' + row.refId + ' · ' + row.refName;
    }

    function formatRuleSub(row) {
        if (row.activityCode) return row.activityCode;
        return '—';
    }

    function fetchLedger() {
        return Promise.resolve(JSON.parse(JSON.stringify(MOCK_LEDGER)));
    }

    global.FLPointsConsumeStore = {
        CONSUME_SCENES: CONSUME_SCENES,
        REF_TYPE_LABELS: REF_TYPE_LABELS,
        getSceneRows: getSceneRows,
        formatRef: formatRef,
        formatRuleSub: formatRuleSub,
        fetchLedger: fetchLedger
    };
})(typeof window !== 'undefined' ? window : this);
