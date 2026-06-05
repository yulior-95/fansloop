/**
 * 拉新邀请奖励 · 后台配置（原型 mock）
 * 对接：GET /api/v1/invite/reward-config
 */
(function (global) {
    var DEFAULT = {
        inviterPoints: 200,
        inviteePoints: 200,
        caps: {
            dailyPointsCap: 1000,
            dailyPointsEarned: 640,
            inviteRewardDailyCap: 2000,
            inviteRewardDailyEarned: 1200,
            inviteRewardTotalCap: 50000,
            inviteRewardTotalEarned: 18400
        },
        invitesUnlimited: true,
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
            return '新用户注册填码 · 双方各得 ' + formatPoints(inv) + ' 积分';
        }
        return '新用户注册填码 · 你得 ' + formatPoints(inv) + ' / 好友得 ' + formatPoints(neu) + ' 积分';
    }

    function fetchConfig() {
        return Promise.resolve(Object.assign({}, DEFAULT));
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
        fetchConfig: fetchConfig,
        resolveInviteCode: resolveInviteCode
    };
})(typeof window !== 'undefined' ? window : this);
