/**
 * 积分商城兑换券 · 用户券包 Mock（localStorage）
 * API: GET /api/v1/wallet/vouchers · POST /api/v1/subscriptions { voucherId }
 */
(function (global) {
    var LS_KEY = 'fl_mall_vouchers_v1';

    var REDEEM_CATALOG = {
        '订阅 9 折券': {
            type: 'sub_discount',
            discount: 0.9,
            planScope: 'all',
            validDays: 7,
            desc: '任意创作者月 / 季 / 年档位可用，单笔限 1 张'
        },
        '订阅 8 折券': {
            type: 'sub_discount',
            discount: 0.8,
            planScope: 'all',
            validDays: 2,
            desc: '高阶折扣，不可与其它满减叠加'
        },
        '付费内容试看券': {
            type: 'ppv_trial',
            discount: 0,
            validDays: 7,
            desc: '免费解锁 1 篇单篇付费内容，解锁后 24h 内可反复观看'
        },
        '单篇 5 折券': {
            type: 'ppv_discount',
            discount: 0.5,
            validDays: 14,
            desc: '单篇付费内容享 5 折，不可与试看券叠加'
        },
        '打赏加成卡 · 3 次': {
            type: 'tip_boost',
            uses: 3,
            validDays: 14,
            subsidyPercent: 10,
            maxSubsidyPerTip: 50,
            minTipAmount: 10,
            desc: '3 次打赏补贴机会 · 每次平台额外补贴 10%（上限 50 USDT）'
        },
        '每日上限提升卡': {
            type: 'daily_cap_boost',
            validDays: 1,
            capFrom: 50,
            capTo: 100,
            desc: '当日积分获取上限提升，次日 0 点恢复默认规则'
        },
        '连续签到翻倍卡': {
            type: 'checkin_double',
            validDays: 7,
            multiplier: 2,
            uses: 1,
            desc: '下一次签到奖励 ×2（含连续天数加成基准）'
        },
        '邀请加成卡 · 7 日': {
            type: 'invite_boost',
            validDays: 7,
            bonusPercent: 10,
            desc: '邀请好友完成的积分 / 现金返利 +10%'
        },
        '评论高亮 · 7 日': {
            type: 'comment_highlight',
            validDays: 7,
            styleId: 'purple',
            desc: '你的评论昵称与正文使用专属色值，在帖子评论区区分展示'
        },
        '专属头像框 · 霓虹': {
            type: 'avatar_frame',
            validDays: 30,
            frameId: 'neon',
            desc: '头像外围华丽霓虹外框，头像照片保持原样'
        },
        '会员身份 · 7 天': {
            type: 'membership_pass',
            membershipDays: 7,
            validDays: 30,
            desc: '体验会员权益包 · 兑换后须在规定期限内激活'
        },
        '会员身份 · 30 天': {
            type: 'membership_pass',
            membershipDays: 30,
            validDays: 45,
            desc: '完整月度会员权益 · 可叠加续期'
        }
    };

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function dateStr(d) {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function addDays(days) {
        var d = new Date();
        d.setDate(d.getDate() + days);
        return dateStr(d);
    }

    function defaultVouchers() {
        return [
            { id: 'v_sub90_a', name: '订阅 9 折券', type: 'sub_discount', discount: 0.9, status: 'active', planScope: 'all', expiresAt: addDays(45), redeemedAt: '2026-05-28', source: 'mall' },
            { id: 'v_sub90_b', name: '订阅 9 折券', type: 'sub_discount', discount: 0.9, status: 'active', planScope: 'all', expiresAt: addDays(12), redeemedAt: '2026-06-02', source: 'mall' },
            { id: 'v_sub90_c', name: '订阅 9 折券', type: 'sub_discount', discount: 0.9, status: 'active', planScope: ['monthly', 'quarterly'], expiresAt: addDays(30), redeemedAt: '2026-06-05', source: 'mall' },
            { id: 'v_sub80_a', name: '订阅 8 折券', type: 'sub_discount', discount: 0.8, status: 'active', planScope: 'all', expiresAt: addDays(5), redeemedAt: '2026-06-08', source: 'mall' },
            { id: 'v_sub80_b', name: '订阅 8 折券', type: 'sub_discount', discount: 0.8, status: 'active', planScope: 'all', expiresAt: addDays(18), redeemedAt: '2026-06-01', source: 'mall' },
            { id: 'v_sub90_annual', name: '订阅 9 折券', type: 'sub_discount', discount: 0.9, status: 'active', planScope: ['annual'], expiresAt: addDays(90), redeemedAt: '2026-04-20', source: 'mall', desc: '仅年度档位可用' },
            { id: 'v_sub90_used', name: '订阅 9 折券', type: 'sub_discount', discount: 0.9, status: 'used', planScope: 'all', expiresAt: addDays(20), redeemedAt: '2026-03-15', usedAt: '2026-04-22', source: 'mall' },
            { id: 'v_sub90_exp', name: '订阅 9 折券', type: 'sub_discount', discount: 0.9, status: 'active', planScope: 'all', expiresAt: '2026-01-01', redeemedAt: '2025-12-20', source: 'mall' },
            { id: 'v_ppv_trial_a', name: '付费内容试看券', type: 'ppv_trial', discount: 0, status: 'active', expiresAt: addDays(20), redeemedAt: '2026-06-01', source: 'mall', desc: '免费解锁 1 篇' },
            { id: 'v_ppv_trial_b', name: '付费内容试看券', type: 'ppv_trial', discount: 0, status: 'used', expiresAt: addDays(45), redeemedAt: '2026-05-15', usedAt: '2026-06-01', source: 'mall', desc: '免费解锁 1 篇' },
            { id: 'v_ppv_disc50_a', name: '单篇 5 折券', type: 'ppv_discount', discount: 0.5, status: 'active', expiresAt: addDays(30), redeemedAt: '2026-06-03', source: 'mall' },
            { id: 'v_ppv_disc50_b', name: '单篇 5 折券', type: 'ppv_discount', discount: 0.5, status: 'active', expiresAt: addDays(8), redeemedAt: '2026-06-07', source: 'mall' },
            { id: 'v_ppv_trial_used', name: '付费内容试看券', type: 'ppv_trial', discount: 0, status: 'used', expiresAt: addDays(10), redeemedAt: '2026-04-01', usedAt: '2026-04-18', source: 'mall' },
            { id: 'v_tip_boost_a', name: '打赏加成卡 · 3 次', type: 'tip_boost', status: 'active', usesRemaining: 2, usesTotal: 3, subsidyPercent: 10, maxSubsidyPerTip: 50, minTipAmount: 10, expiresAt: addDays(14), redeemedAt: '2026-06-02', source: 'mall', desc: '每次打赏消耗 1 次' },
            { id: 'v_demo_daily_cap', name: '每日上限提升卡', type: 'daily_cap_boost', status: 'active', capFrom: 50, capTo: 100, activeDate: dateStr(new Date()), expiresAt: dateStr(new Date()), redeemedAt: '2026-06-10', source: 'mall' },
            { id: 'v_demo_checkin_double', name: '连续签到翻倍卡', type: 'checkin_double', status: 'active', multiplier: 2, usesRemaining: 1, usesTotal: 1, expiresAt: addDays(7), redeemedAt: '2026-06-09', source: 'mall' },
            { id: 'v_demo_invite_boost', name: '邀请加成卡 · 7 日', type: 'invite_boost', status: 'active', bonusPercent: 10, expiresAt: addDays(7), redeemedAt: '2026-06-08', source: 'mall' },
            { id: 'v_demo_avatar_neon', name: '专属头像框 · 霓虹', type: 'avatar_frame', status: 'active', frameId: 'neon', equipped: true, expiresAt: addDays(30), redeemedAt: '2026-06-05', source: 'mall' },
            { id: 'v_demo_comment_hl', name: '评论高亮 · 7 日', type: 'comment_highlight', status: 'active', styleId: 'neon', expiresAt: addDays(7), redeemedAt: '2026-06-07', source: 'mall' },
            { id: 'v_demo_membership_30', name: '会员身份 · 30 天', type: 'membership_pass', status: 'active', membershipDays: 30, memberExpiresAt: addDays(32), activatedAt: '2026-05-15', expiresAt: addDays(32), redeemedAt: '2026-05-15', source: 'mall' }
        ];
    }

    function isPpvVoucher(v) {
        return v && (v.type === 'ppv_trial' || v.type === 'ppv_discount');
    }

    function readAll() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function writeAll(list) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(list));
        } catch (e) { /* noop */ }
    }

    function isTipBoost(v) {
        return v && v.type === 'tip_boost';
    }

    function isDailyCapBoost(v) { return v && v.type === 'daily_cap_boost'; }
    function isCheckinDouble(v) { return v && v.type === 'checkin_double'; }
    function isInviteBoost(v) { return v && v.type === 'invite_boost'; }
    function isAvatarFrame(v) { return v && v.type === 'avatar_frame'; }
    function isCommentHighlight(v) { return v && v.type === 'comment_highlight'; }
    function isMembershipPass(v) { return v && v.type === 'membership_pass'; }

    function isBenefitVoucher(v) {
        return isDailyCapBoost(v) || isCheckinDouble(v) || isInviteBoost(v) ||
            isAvatarFrame(v) || isCommentHighlight(v) || isMembershipPass(v) ||
            isPpvVoucher(v) || isTipBoost(v);
    }

    function isActiveToday(v) {
        if (!v) return false;
        var today = dateStr(new Date());
        if (v.activeDate) return v.activeDate === today;
        if (v.type === 'daily_cap_boost' && v.expiresAt === today) return true;
        return !isExpired(v);
    }

    function daysLeft(expiresAt) {
        if (!expiresAt) return null;
        var end = new Date(expiresAt + 'T23:59:59').getTime();
        return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
    }

    function ensurePpvSeed(data) {
        if (data.some(function (v) { return isPpvVoucher(v); })) return data;
        defaultVouchers().filter(isPpvVoucher).forEach(function (v) { data.unshift(v); });
        writeAll(data);
        return data;
    }

    function ensureTipBoostSeed(data) {
        if (data.some(function (v) { return isTipBoost(v); })) return data;
        defaultVouchers().filter(isTipBoost).forEach(function (v) { data.unshift(v); });
        writeAll(data);
        return data;
    }

    function ensureBenefitSeeds(data) {
        var seeds = defaultVouchers().filter(function (v) {
            return isDailyCapBoost(v) || isCheckinDouble(v) || isInviteBoost(v) ||
                isAvatarFrame(v) || isCommentHighlight(v) || isMembershipPass(v);
        });
        var changed = false;
        seeds.forEach(function (seed) {
            var hasActive = data.some(function (v) {
                return v.type === seed.type && v.status === 'active' && !isExpired(v);
            });
            if (!hasActive) {
                data.unshift(JSON.parse(JSON.stringify(seed)));
                changed = true;
            }
        });
        if (changed) writeAll(data);
        return data;
    }

    function list() {
        var data = readAll();
        if (!data) {
            data = defaultVouchers();
            writeAll(data);
            return data;
        }
        data = ensurePpvSeed(data);
        data = ensureTipBoostSeed(data);
        data = ensureBenefitSeeds(data);
        return data;
    }

    /** 当前可用于打赏的加成卡（未过期、有剩余次数） */
    function getActiveTipBoost() {
        return list().filter(function (v) {
            if (!isTipBoost(v)) return false;
            if (v.status !== 'active') return false;
            if (isExpired(v)) return false;
            var left = v.usesRemaining != null ? v.usesRemaining : 0;
            return left > 0;
        }).sort(function (a, b) {
            return new Date(a.expiresAt || 0) - new Date(b.expiresAt || 0);
        })[0] || null;
    }

    function voucherToTipCfg(v) {
        if (!v || !isTipBoost(v)) return null;
        var total = v.usesTotal != null ? v.usesTotal : (v.usesRemaining != null ? v.usesRemaining : 3);
        var left = v.usesRemaining != null ? v.usesRemaining : total;
        return {
            voucherId: v.id,
            subsidyPercent: v.subsidyPercent != null ? v.subsidyPercent : 10,
            maxSubsidyPerTip: v.maxSubsidyPerTip != null ? v.maxSubsidyPerTip : 50,
            minTipAmount: v.minTipAmount != null ? v.minTipAmount : 10,
            maxTipAmount: v.maxTipAmount != null ? v.maxTipAmount : 500,
            usesRemaining: left,
            usesTotal: total,
            expiresAt: v.expiresAt || ''
        };
    }

    /** 打赏成功后消耗 1 次；次数用尽则标记 used */
    function consumeTipBoostUse(id) {
        if (!id) return null;
        var all = list();
        var found = null;
        all.forEach(function (v) {
            if (v.id !== id || !isTipBoost(v)) return;
            var left = (v.usesRemaining != null ? v.usesRemaining : 0) - 1;
            v.usesRemaining = Math.max(0, left);
            if (v.usesRemaining <= 0) {
                v.status = 'used';
                v.usedAt = dateStr(new Date());
            }
            found = v;
        });
        if (found) {
            writeAll(all);
            dispatchBenefitsChanged();
        }
        return found;
    }

    function formatTipBoostBenefit(v) {
        if (!v) return '';
        var cfg = voucherToTipCfg(v);
        if (!cfg) return '';
        var pct = cfg.subsidyPercent;
        var exp = cfg.expiresAt ? ' · 须在 ' + cfg.expiresAt + ' 前用完' : '';
        return '打赏 100 USDT → 创作者实收 ' + (100 + pct) + '（平台补贴 ' + pct + '%）' + exp;
    }

    function getActivePpvTrialCount() {
        return list().filter(function (v) {
            return v.type === 'ppv_trial' && v.status === 'active' && !isExpired(v);
        }).length;
    }

    function getActiveDailyCapBoost() {
        return list().find(function (v) {
            return isDailyCapBoost(v) && v.status === 'active' && isActiveToday(v);
        }) || null;
    }

    function applyWalletDailyCap(wallet) {
        if (!wallet) return wallet;
        var boost = getActiveDailyCapBoost();
        if (!boost) return wallet;
        var from = boost.capFrom != null ? boost.capFrom : 50;
        var to = boost.capTo != null ? boost.capTo : 100;
        wallet.todayCapBase = wallet.todayCap;
        wallet.todayCap = to;
        wallet.dailyCapBoost = { from: from, to: to };
        return wallet;
    }

    function getActiveCheckinDouble() {
        return list().find(function (v) {
            if (!isCheckinDouble(v) || v.status !== 'active' || isExpired(v)) return false;
            var left = v.usesRemaining != null ? v.usesRemaining : 1;
            return left > 0;
        }) || null;
    }

    function consumeCheckinDouble(id) {
        if (!id) return null;
        var all = list();
        var found = null;
        all.forEach(function (v) {
            if (v.id !== id || !isCheckinDouble(v)) return;
            v.usesRemaining = 0;
            v.status = 'used';
            v.usedAt = dateStr(new Date());
            found = v;
        });
        if (found) {
            writeAll(all);
            dispatchBenefitsChanged();
        }
        return found;
    }

    function getActiveInviteBoost() {
        return list().filter(function (v) {
            return isInviteBoost(v) && v.status === 'active' && !isExpired(v);
        }).sort(function (a, b) {
            return new Date(a.expiresAt || 0) - new Date(b.expiresAt || 0);
        })[0] || null;
    }

    function getEquippedAvatarFrame() {
        return list().find(function (v) {
            if (!isAvatarFrame(v) || v.status !== 'active' || isExpired(v)) return false;
            return v.equipped !== false;
        }) || null;
    }

    function getActiveCommentHighlight() {
        return list().find(function (v) {
            return isCommentHighlight(v) && v.status === 'active' && !isExpired(v);
        }) || null;
    }

    function getActivePlatformMembership() {
        var best = null;
        list().forEach(function (v) {
            if (!isMembershipPass(v) || v.status !== 'active') return;
            var end = v.memberExpiresAt || v.expiresAt;
            if (!end || isExpired({ expiresAt: end })) return;
            if (!best || end > (best.memberExpiresAt || best.expiresAt)) best = v;
        });
        return best;
    }

    function membershipExpiresAt(m) {
        return m ? (m.memberExpiresAt || m.expiresAt) : null;
    }

    function dispatchBenefitsChanged() {
        try {
            document.dispatchEvent(new CustomEvent('fl-mall-benefits-changed'));
        } catch (e) { /* noop */ }
    }

    function getBenefitHeroRows() {
        var rows = [];
        var ppvCount = getActivePpvTrialCount();
        if (ppvCount > 0) {
            rows.push({
                dot: 'var(--brand-purple)',
                title: '付费内容试看券 · 剩余 ' + ppvCount + ' 次',
                exp: '解锁后 24h 内有效 · 适用于标注「支持试看券」的创作者'
            });
        }
        var dc = getActiveDailyCapBoost();
        if (dc) {
            var from = dc.capFrom != null ? dc.capFrom : 50;
            var to = dc.capTo != null ? dc.capTo : 100;
            rows.push({
                dot: '#93C5FD',
                title: '每日上限提升卡 · 生效中',
                exp: '当日积分获取上限 ' + from + ' → ' + to + ' · 次日 0 点恢复默认规则'
            });
        }
        var chk = getActiveCheckinDouble();
        if (chk) {
            rows.push({
                dot: '#10B981',
                title: '连续签到翻倍卡 · 待使用',
                exp: '下一次签到奖励 ×' + (chk.multiplier || 2) + ' · 须在 ' + (chk.expiresAt || '—') + ' 前使用'
            });
        }
        var inv = getActiveInviteBoost();
        if (inv) {
            var dl = daysLeft(inv.expiresAt);
            rows.push({
                dot: '#A855F7',
                title: '邀请加成卡 · ' + (dl != null ? dl + ' 日' : '7 日'),
                exp: '邀请返利 +' + (inv.bonusPercent || 10) + '% · 至 ' + (inv.expiresAt || '—') + ' 有效'
            });
        }
        var av = getEquippedAvatarFrame();
        if (av) {
            rows.push({
                dot: '#22D3EE',
                title: '专属头像框 · ' + (av.frameId === 'neon' ? '霓虹' : av.frameId),
                exp: '已佩戴 · 外圈霓虹边框 · 至 ' + (av.expiresAt || '—')
            });
        }
        var hl = getActiveCommentHighlight();
        if (hl) {
            var hdl = daysLeft(hl.expiresAt);
            rows.push({
                dot: '#F472B6',
                title: '评论高亮 · ' + (hdl != null ? hdl + ' 日' : '7 日'),
                exp: '昵称与正文专属色值 · 至 ' + (hl.expiresAt || '—') + ' 有效'
            });
        }
        var mem = getActivePlatformMembership();
        if (mem) {
            var mel = daysLeft(membershipExpiresAt(mem));
            rows.push({
                dot: '#FBBF24',
                title: '平台会员 · ' + (mem.membershipDays || 30) + ' 天档',
                exp: '会员权益生效中 · 至 ' + membershipExpiresAt(mem) + ' 到期' +
                    (mel != null ? '（剩余 ' + mel + ' 天）' : '')
            });
        }
        var tip = getActiveTipBoost();
        if (tip) {
            var cfg = voucherToTipCfg(tip);
            rows.push({
                dot: '#FBBF24',
                title: '打赏加成卡 · 剩余 ' + cfg.usesRemaining + '/' + cfg.usesTotal + ' 次',
                exp: formatTipBoostBenefit(tip),
                id: 'bpRowTipBoost'
            });
        }
        return rows;
    }

    function upsertDemoBenefit(voucher) {
        var all = list();
        var idx = all.findIndex(function (v) { return v.id === voucher.id; });
        if (idx >= 0) all[idx] = Object.assign({}, all[idx], voucher);
        else all.unshift(voucher);
        writeAll(all);
        dispatchBenefitsChanged();
        return voucher;
    }

    function ensureDemoScene(scene) {
        var today = dateStr(new Date());
        var map = {
            'ppv-trial': {
                id: 'v_demo_ppv_trial', name: '付费内容试看券', type: 'ppv_trial', discount: 0,
                status: 'active', expiresAt: addDays(14), redeemedAt: today, source: 'mall'
            },
            'daily-cap': {
                id: 'v_demo_daily_cap', name: '每日上限提升卡', type: 'daily_cap_boost',
                status: 'active', capFrom: 50, capTo: 100, activeDate: today, expiresAt: today,
                redeemedAt: today, source: 'mall'
            },
            'checkin-double': {
                id: 'v_demo_checkin_double', name: '连续签到翻倍卡', type: 'checkin_double',
                status: 'active', multiplier: 2, usesRemaining: 1, usesTotal: 1,
                expiresAt: addDays(7), redeemedAt: today, source: 'mall'
            },
            'invite-boost': {
                id: 'v_demo_invite_boost', name: '邀请加成卡 · 7 日', type: 'invite_boost',
                status: 'active', bonusPercent: 10, expiresAt: addDays(7), redeemedAt: today, source: 'mall'
            },
            'avatar-neon': {
                id: 'v_demo_avatar_neon', name: '专属头像框 · 霓虹', type: 'avatar_frame',
                status: 'active', frameId: 'neon', equipped: true,
                expiresAt: addDays(30), redeemedAt: today, source: 'mall'
            },
            'comment-highlight': {
                id: 'v_demo_comment_hl', name: '评论高亮 · 7 日', type: 'comment_highlight',
                status: 'active', styleId: 'neon', expiresAt: addDays(7), redeemedAt: today, source: 'mall'
            },
            'membership-30': {
                id: 'v_demo_membership_30', name: '会员身份 · 30 天', type: 'membership_pass',
                status: 'active', membershipDays: 30, memberExpiresAt: addDays(32),
                activatedAt: today, expiresAt: addDays(32), redeemedAt: today, source: 'mall'
            }
        };
        if (map[scene]) upsertDemoBenefit(map[scene]);
    }

    function getById(id) {
        return list().find(function (v) { return v.id === id; }) || null;
    }

    function isExpired(v) {
        if (!v || !v.expiresAt) return false;
        return new Date(v.expiresAt + 'T23:59:59').getTime() < Date.now();
    }

    function getPlanType(planEl) {
        if (!planEl) return 'monthly';
        var t = planEl.getAttribute('data-plan-type');
        if (t === 'monthly' || t === 'quarterly' || t === 'annual') return t;
        var label = planEl.querySelector('.p1');
        var text = label ? label.textContent : '';
        if (/年/.test(text)) return 'annual';
        if (/季/.test(text)) return 'quarterly';
        return 'monthly';
    }

    function planScopeLabel(scope) {
        if (!scope || scope === 'all') return '全档位';
        if (Array.isArray(scope)) {
            var map = { monthly: '月度', quarterly: '季度', annual: '年度' };
            return scope.map(function (s) { return map[s] || s; }).join(' / ');
        }
        return String(scope);
    }

    function isPlanInScope(planScope, planType) {
        if (!planScope || planScope === 'all') return true;
        if (Array.isArray(planScope)) return planScope.indexOf(planType) >= 0;
        return planScope === planType;
    }

    function getEligibleForSubscription(planType, basePrice) {
        return list().filter(function (v) {
            if (v.type !== 'sub_discount') return false;
            if (v.status !== 'active') return false;
            if (isExpired(v)) return false;
            if (!isPlanInScope(v.planScope, planType)) return false;
            if (v.minAmount && basePrice < v.minAmount) return false;
            return true;
        });
    }

    function calcDiscountedPrice(basePrice, voucher) {
        if (!voucher || voucher.type !== 'sub_discount') return basePrice;
        var rate = Number(voucher.discount) || 1;
        return Math.round(basePrice * rate * 100) / 100;
    }

    function getEligibleForPpv(basePrice) {
        return list().filter(function (v) {
            if (!isPpvVoucher(v)) return false;
            if (v.status !== 'active') return false;
            if (isExpired(v)) return false;
            if (v.minAmount && basePrice < v.minAmount) return false;
            return true;
        });
    }

    function calcPpvPrice(basePrice, voucher) {
        if (!voucher) return basePrice;
        if (voucher.type === 'ppv_trial') return 0;
        if (voucher.type === 'ppv_discount') {
            var rate = Number(voucher.discount) || 1;
            return Math.round(basePrice * rate * 100) / 100;
        }
        return basePrice;
    }

    function formatPpvVoucherTag(voucher) {
        if (!voucher) return '';
        if (voucher.type === 'ppv_trial') return '免费解锁';
        if (voucher.type === 'ppv_discount') return formatDiscountTag(voucher);
        return '';
    }

    function formatPpvExpiry(voucher) {
        if (!voucher || !voucher.expiresAt) return '长期有效';
        var extra = voucher.type === 'ppv_trial' ? ' · 限 1 篇' : ' · 单篇付费';
        return voucher.expiresAt + ' 前有效' + extra;
    }

    function formatDiscountTag(voucher) {
        if (!voucher || !voucher.discount) return '';
        var zhe = Math.round(voucher.discount * 100) / 10;
        return zhe + ' 折';
    }

    function formatExpiry(voucher) {
        if (!voucher || !voucher.expiresAt) return '长期有效';
        return voucher.expiresAt + ' 前有效 · ' + planScopeLabel(voucher.planScope);
    }

    function addFromRedeem(productName, meta) {
        meta = meta || {};
        var cat = REDEEM_CATALOG[productName];
        if (!cat) return null;
        var id = 'v_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        var voucher = {
            id: id,
            name: productName,
            type: cat.type,
            discount: cat.discount,
            status: 'active',
            expiresAt: addDays(cat.validDays || 7),
            redeemedAt: dateStr(new Date()),
            source: 'mall',
            desc: cat.desc
        };
        if (cat.planScope) voucher.planScope = cat.planScope;
        if (cat.type === 'tip_boost') {
            voucher.usesRemaining = cat.uses || 3;
            voucher.usesTotal = cat.uses || 3;
            voucher.subsidyPercent = cat.subsidyPercent || 10;
            voucher.maxSubsidyPerTip = cat.maxSubsidyPerTip || 50;
            voucher.minTipAmount = cat.minTipAmount || 10;
        }
        if (cat.type === 'daily_cap_boost') {
            voucher.capFrom = cat.capFrom || 50;
            voucher.capTo = cat.capTo || 100;
            voucher.activeDate = dateStr(new Date());
            voucher.expiresAt = dateStr(new Date());
        }
        if (cat.type === 'checkin_double') {
            voucher.multiplier = cat.multiplier || 2;
            voucher.usesRemaining = cat.uses || 1;
            voucher.usesTotal = cat.uses || 1;
        }
        if (cat.type === 'invite_boost') {
            voucher.bonusPercent = cat.bonusPercent || 10;
        }
        if (cat.type === 'avatar_frame') {
            voucher.frameId = cat.frameId || 'neon';
            voucher.equipped = true;
            list().forEach(function (v) {
                if (isAvatarFrame(v) && v.equipped) v.equipped = false;
            });
        }
        if (cat.type === 'comment_highlight') {
            voucher.styleId = cat.styleId || 'neon';
        }
        if (cat.type === 'membership_pass') {
            voucher.membershipDays = cat.membershipDays || 7;
            voucher.activatedAt = dateStr(new Date());
            voucher.memberExpiresAt = addDays(cat.membershipDays || 7);
            voucher.expiresAt = voucher.memberExpiresAt;
            voucher.status = 'active';
        }
        var all = list();
        all.unshift(voucher);
        writeAll(all);
        dispatchBenefitsChanged();
        return voucher;
    }

    function markUsed(id) {
        if (!id) return;
        var all = list();
        var found = false;
        all.forEach(function (v) {
            if (v.id === id) {
                v.status = 'used';
                v.usedAt = dateStr(new Date());
                found = true;
            }
        });
        if (found) {
            writeAll(all);
            dispatchBenefitsChanged();
        }
    }

    function resetDemo() {
        writeAll(defaultVouchers());
    }

    global.MallVouchersStore = {
        list: list,
        getById: getById,
        getPlanType: getPlanType,
        getEligibleForSubscription: getEligibleForSubscription,
        getEligibleForPpv: getEligibleForPpv,
        getActiveTipBoost: getActiveTipBoost,
        getActivePpvTrialCount: getActivePpvTrialCount,
        getActiveDailyCapBoost: getActiveDailyCapBoost,
        applyWalletDailyCap: applyWalletDailyCap,
        getActiveCheckinDouble: getActiveCheckinDouble,
        consumeCheckinDouble: consumeCheckinDouble,
        getActiveInviteBoost: getActiveInviteBoost,
        getEquippedAvatarFrame: getEquippedAvatarFrame,
        getActiveCommentHighlight: getActiveCommentHighlight,
        getActivePlatformMembership: getActivePlatformMembership,
        membershipExpiresAt: membershipExpiresAt,
        getBenefitHeroRows: getBenefitHeroRows,
        ensureDemoScene: ensureDemoScene,
        voucherToTipCfg: voucherToTipCfg,
        consumeTipBoostUse: consumeTipBoostUse,
        formatTipBoostBenefit: formatTipBoostBenefit,
        calcDiscountedPrice: calcDiscountedPrice,
        calcPpvPrice: calcPpvPrice,
        formatDiscountTag: formatDiscountTag,
        formatPpvVoucherTag: formatPpvVoucherTag,
        formatExpiry: formatExpiry,
        formatPpvExpiry: formatPpvExpiry,
        isPpvVoucher: isPpvVoucher,
        isTipBoost: isTipBoost,
        isDailyCapBoost: isDailyCapBoost,
        isCheckinDouble: isCheckinDouble,
        isInviteBoost: isInviteBoost,
        isAvatarFrame: isAvatarFrame,
        isCommentHighlight: isCommentHighlight,
        isMembershipPass: isMembershipPass,
        isExpired: isExpired,
        planScopeLabel: planScopeLabel,
        addFromRedeem: addFromRedeem,
        markUsed: markUsed,
        resetDemo: resetDemo,
        REDEEM_CATALOG: REDEEM_CATALOG
    };
})(typeof window !== 'undefined' ? window : this);
