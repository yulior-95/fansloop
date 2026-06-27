/**
 * 邀请数据 · 后台 Mock（全平台 + 单用户详情同源）
 * API: GET /api/v1/admin/invite-records
 *      GET /api/v1/admin/users/:uid/invite-summary
 */
(function (global) {
    var STATUS_LABELS = {
        ok: '已发放',
        pending: '待风控',
        rejected: '风控未通过',
        capped: '已达上限'
    };

    var PLATFORM_INVITES = [
        { id: 'inv_001', inviterUid: '882910', inviterNickname: '小岛日和', inviteCode: 'FL2025A', inviteeUid: 'u8821', inviteeNickname: 'Mika 胶片', registeredAt: '2026-06-04 09:12:18', reward: 200, status: 'ok' },
        { id: 'inv_002', inviterUid: '882910', inviterNickname: '小岛日和', inviteCode: 'FL2025A', inviteeUid: 'u7712', inviteeNickname: '阿Ken · 街拍', registeredAt: '2026-06-03 21:40:05', reward: 200, status: 'ok' },
        { id: 'inv_003', inviterUid: '882910', inviterNickname: '小岛日和', inviteCode: 'FL2025A', inviteeUid: 'u6603', inviteeNickname: 'Sora旅行记', registeredAt: '2026-06-02 14:08:44', reward: 200, status: 'ok' },
        { id: 'inv_004', inviterUid: '882910', inviterNickname: '小岛日和', inviteCode: 'FL2025A', inviteeUid: 'u5594', inviteeNickname: '夜猫子剪辑', registeredAt: '2026-06-01 11:22:33', reward: 0, status: 'pending' },
        { id: 'inv_005', inviterUid: '882910', inviterNickname: '小岛日和', inviteCode: 'FL2025A', inviteeUid: 'u4485', inviteeNickname: 'LoopKid', registeredAt: '2026-05-28 08:55:12', reward: 200, status: 'ok' },
        { id: 'inv_006', inviterUid: '882910', inviterNickname: '小岛日和', inviteCode: 'FL2025A', inviteeUid: 'u3312', inviteeNickname: '批量小号A', registeredAt: '2026-05-26 03:18:09', reward: 0, status: 'rejected', rejectReason: '同 IP 短时批量注册' },
        { id: 'inv_007', inviterUid: '661204', inviterNickname: '陈静', inviteCode: 'FL6612', inviteeUid: '102938', inviteeNickname: 'Alex Chen', registeredAt: '2026-03-18 22:41:03', reward: 200, status: 'ok' },
        { id: 'inv_008', inviterUid: '661204', inviterNickname: '陈静', inviteCode: 'FL6612', inviteeUid: '445201', inviteeNickname: '王磊', registeredAt: '2026-02-14 08:30:00', reward: 200, status: 'ok' },
        { id: 'inv_009', inviterUid: '339011', inviterNickname: '李明辉', inviteCode: 'SG2026', inviteeUid: '771002', inviteeNickname: '匿名用户', registeredAt: '2026-05-01 12:00:00', reward: 0, status: 'capped' },
        { id: 'inv_010', inviterUid: '556677', inviterNickname: '林小鹿', inviteCode: 'VIP88', inviteeUid: 'u9901', inviteeNickname: '新用户甲', registeredAt: '2026-06-20 10:15:00', reward: 200, status: 'ok' },
        { id: 'inv_011', inviterUid: '882910', inviterNickname: '小岛日和', inviteCode: 'FL2025A', inviteeUid: 'u2201', inviteeNickname: '胶片爱好者', registeredAt: '2026-06-20 08:02:11', reward: 200, status: 'ok' }
    ];

    var PLATFORM_REWARDS = [
        { id: 'rw_001', inviterUid: '882910', time: '2026-06-04 09:12', inviteeNickname: 'Mika 胶片', type: '注册奖励', points: 200, status: 'ok' },
        { id: 'rw_002', inviterUid: '882910', time: '2026-06-03 21:40', inviteeNickname: '阿Ken · 街拍', type: '注册奖励', points: 200, status: 'ok' },
        { id: 'rw_003', inviterUid: '882910', time: '2026-06-02 14:08', inviteeNickname: 'Sora旅行记', type: '注册奖励', points: 200, status: 'ok' },
        { id: 'rw_004', inviterUid: '882910', time: '2026-06-01 23:59', inviteeNickname: '—', type: '邀请奖励（日上限）', points: 0, status: 'capped' },
        { id: 'rw_005', inviterUid: '882910', time: '2026-05-28 08:55', inviteeNickname: 'LoopKid', type: '注册奖励', points: 200, status: 'ok' },
        { id: 'rw_006', inviterUid: '661204', time: '2026-03-18 22:41', inviteeNickname: 'Alex Chen', type: '注册奖励', points: 200, status: 'ok' },
        { id: 'rw_007', inviterUid: '661204', time: '2026-02-14 08:30', inviteeNickname: '王磊', type: '注册奖励', points: 200, status: 'ok' }
    ];

    function fmt(n) {
        return Number(n).toLocaleString('zh-CN');
    }

    function statusTag(status) {
        if (status === 'ok') return '<span class="ant-tag ant-tag-green">已发放</span>';
        if (status === 'pending') return '<span class="ant-tag ant-tag-blue">待风控</span>';
        if (status === 'rejected') return '<span class="ant-tag ant-tag-red">风控未通过</span>';
        if (status === 'capped') return '<span class="ant-tag ant-tag-orange">已达上限</span>';
        return '<span class="ant-tag">' + (STATUS_LABELS[status] || status) + '</span>';
    }

    function getPlatformStats() {
        var now = new Date('2026-06-20');
        var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        var todayStr = '2026-06-20';
        var todayCount = PLATFORM_INVITES.filter(function (r) {
            return r.registeredAt.indexOf(todayStr) === 0;
        }).length;
        var monthValid = PLATFORM_INVITES.filter(function (r) {
            var d = new Date(r.registeredAt.replace(' ', 'T'));
            return d >= monthStart && r.status === 'ok';
        }).length;
        var totalReward = PLATFORM_INVITES.reduce(function (s, r) {
            return s + (r.reward || 0);
        }, 0);
        var pending = PLATFORM_INVITES.filter(function (r) {
            return r.status === 'pending';
        }).length;
        return {
            todayInvites: todayCount,
            monthValid: monthValid,
            totalInvites: PLATFORM_INVITES.length,
            totalRewardPts: totalReward,
            pendingRisk: pending
        };
    }

    function filterRecords(opts) {
        opts = opts || {};
        var monthPrefix = opts.monthOnly ? '2026-06' : '';
        return PLATFORM_INVITES.filter(function (r) {
            if (opts.inviterUid && String(r.inviterUid).indexOf(opts.inviterUid) === -1) return false;
            if (opts.inviteeUid && String(r.inviteeUid).indexOf(opts.inviteeUid) === -1) return false;
            if (opts.status && r.status !== opts.status) return false;
            if (opts.monthOnly && (r.registeredAt.indexOf(monthPrefix) !== 0 || r.status !== 'ok')) return false;
            if (opts.keyword) {
                var q = opts.keyword.toLowerCase();
                var hay = (r.inviterNickname + r.inviteeNickname + r.inviteCode + r.inviterUid + r.inviteeUid).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }

    function getUserInviteData(uid) {
        var invitees = PLATFORM_INVITES.filter(function (r) {
            return r.inviterUid === uid;
        });
        var rewards = PLATFORM_REWARDS.filter(function (r) {
            return r.inviterUid === uid;
        });
        var monthValid = invitees.filter(function (r) {
            return r.registeredAt.indexOf('2026-06') === 0 && r.status === 'ok';
        }).length;
        var totalRewardPts = invitees.reduce(function (s, r) {
            return s + (r.reward || 0);
        }, 0);
        return {
            totalInvites: invitees.length,
            monthValid: monthValid,
            totalRewardPts: totalRewardPts,
            invitees: invitees,
            rewards: rewards
        };
    }

    function fetchPlatformRecords(opts) {
        return Promise.resolve(filterRecords(opts));
    }

    global.FLInviteDataStore = {
        STATUS_LABELS: STATUS_LABELS,
        PLATFORM_INVITES: PLATFORM_INVITES,
        getPlatformStats: getPlatformStats,
        filterRecords: filterRecords,
        getUserInviteData: getUserInviteData,
        fetchPlatformRecords: fetchPlatformRecords,
        fmt: fmt,
        statusTag: statusTag
    };
})(typeof window !== 'undefined' ? window : this);
