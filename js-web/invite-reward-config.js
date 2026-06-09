/**

 * 拉新邀请奖励 · 后台配置（原型 mock）

 * 对接：GET /api/v1/invite/reward-config

 *

 * 额度参考市面防薅策略：单笔 200 · 日邀请≤3 笔 · 日总获取收紧 · 终身邀请封顶 · 7 天冷静期

 */

(function (global) {

    var DEFAULT = {

        inviterPoints: 200,

        inviteePoints: 200,

        caps: {

            /** 今日全渠道积分获取上限（任务+邀请+签到等合计） */

            dailyPointsCap: 480,

            dailyPointsEarned: 310,

            /** 今日邀请奖励上限（200×3，抑制批量拉新套利） */

            inviteRewardDailyCap: 600,

            inviteRewardDailyEarned: 400,

            /** 累计邀请奖励积分上限（约 60 名有效邀请） */

            inviteRewardTotalCap: 12000,

            inviteRewardTotalEarned: 4800

        },

        /** 发放后冷静期（天），期满才进入可用积分池 */

        coolingPeriodDays: 7,

        pointsWallet: {

            available: 12580,

            frozen: 1400,

            frozenHint: '含 3 笔邀请奖励，6/8 起陆续解冻'

        },

        invitesUnlimited: true,

        tierMultipliers: {

            registerDaysLte: { days: 7, multiplier: 1.0 },

            consecutiveLoginGte: { days: 3, multiplier: 1.2 },

            hasEngagement: { multiplier: 1.15 },

            hasSubscription: { multiplier: 1.5 }

        },

        validInviteCodes: {

            'LUNA-8K3F': {

                inviterUid: 'luna',

                inviterName: 'Luna 🌙',

                inviterAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80'

            }

        }

    };



    function formatPoints(n) {

        return Number(n).toLocaleString('zh-CN');

    }



    function formatInviteRewardTip(cfg) {

        var inv = cfg.inviterPoints;

        var neu = cfg.inviteePoints;

        if (inv === neu) {

            return '新用户注册填码 · 双方各得 ' + formatPoints(inv) + ' 积分（7 天冷静期后可用）';

        }

        return '新用户注册填码 · 你得 ' + formatPoints(inv) + ' / 好友得 ' + formatPoints(neu) + ' 积分';

    }



    function formatCoolingTip(cfg) {

        var d = cfg.coolingPeriodDays || 7;

        return '邀请等奖励积分需冷静 ' + d + ' 天后方可用于商城兑换';

    }



    function fetchConfig() {

        return Promise.resolve(JSON.parse(JSON.stringify(DEFAULT)));

    }



    function resolveInviteCode(code) {

        var key = (code || '').trim().toUpperCase();

        if (!key) return Promise.resolve(null);

        return fetchConfig().then(function (cfg) {

            var row = cfg.validInviteCodes[key];

            if (!row) return null;

            return Object.assign({ code: key }, row);

        });

    }



    global.FLInviteReward = {

        DEFAULT: DEFAULT,

        formatPoints: formatPoints,

        formatInviteRewardTip: formatInviteRewardTip,

        formatCoolingTip: formatCoolingTip,

        fetchConfig: fetchConfig,

        resolveInviteCode: resolveInviteCode

    };

})(typeof window !== 'undefined' ? window : this);

