/**

 * 积分分层 · 用户端只读 DOM 增强（不修改既有页面事件绑定）

 * 发奖结算由 FLPointsRewardService 在 claimTask 内完成，此处仅做展示增强。

 */

(function () {

    var T = window.FLPointsTier;

    var S = window.FLHomePoints;

    var RS = window.FLPointsRewardService;

    if (!T || !S) return;



    var TASK_ACTIVITY_MAP = {

        act_watch_30: 'earn_task',

        act_checkin: 'earn_checkin',

        act_invite_ref: 'earn_invite',

        act_first_sub: 'earn_subscription',

        act_timer: 'earn_task'

    };



    var tierState = null;

    var wrapped = false;



    function qs(sel, root) { return (root || document).querySelector(sel); }

    function qsa(sel, root) {

        return Array.prototype.slice.call((root || document).querySelectorAll(sel));

    }



    function getCatalogBase(taskId) {

        if (RS && RS.TASK_CATALOG && RS.TASK_CATALOG[taskId]) {

            return RS.TASK_CATALOG[taskId].baseReward;

        }

        return null;

    }



    function wrapClaimTask() {

        if (wrapped || !S.claimTask) return;

        var orig = S.claimTask.bind(S);

        S.claimTask = function (taskId) {

            return orig(taskId).then(function (res) {

                if (!res) return res;

                if (res.rejected) {

                    showRejectToast(res.toast || '领取失败');

                    return res;

                }

                if (res.tierDetail && res.tierDetail.effectiveMultiplier > 1) {

                    showClaimToast(res.tierDetail, res.task.name);

                }

                setTimeout(runAugment, 80);

                return res;

            });

        };

        wrapped = true;

    }



    function ensureClaimToastHost() {

        var el = qs('#ptClaimToast');

        if (el) return el;

        el = document.createElement('div');

        el.id = 'ptClaimToast';

        el.className = 'pt-claim-toast';

        el.setAttribute('role', 'status');

        document.body.appendChild(el);

        return el;

    }



    function showRejectToast(msg) {

        var host = ensureClaimToastHost();

        host.innerHTML = '<div class="pt-ct-title" style="color:#FCA5A5">' + msg + '</div>';

        host.classList.add('show');

        setTimeout(function () { host.classList.remove('show'); }, 2800);

    }



    function showClaimToast(detail, taskName) {

        var host = ensureClaimToastHost();

        var rows = detail.tierBreakdown.map(function (r) {

            return '<div class="pt-ct-row"><span>' + r.label + '</span><span>' + T.formatMultiplier(r.multiplier) + '</span></div>';

        }).join('');

        host.innerHTML =

            '<div class="pt-ct-title">+' + S.formatPoints(detail.finalPoints) + ' 积分（服务端结算）</div>' +

            '<div class="pt-ct-body">' + (taskName || '任务奖励') + '<br>' +

            '基础 ' + S.formatPoints(detail.basePoints) + ' · 加成 +' + S.formatPoints(detail.bonusPoints) +

            '（合计 ' + T.formatMultiplier(detail.effectiveMultiplier) + '）' +

            (detail.tierCapped ? ' · 分层已触顶' : '') +

            (detail.globalCapped ? ' · 全局已触顶' : '') +

            (detail.bonusCapped ? ' · 今日分层加成已达上限' : '') +

            (detail.dailyCapTrimmed ? ' · 已触达今日总上限' : '') + '</div>' + rows +

            (detail.externalMultiplier > 1 ? '<div class="pt-ct-body" style="margin-top:6px">含积分加速卡 ' + T.formatMultiplier(detail.externalMultiplier) + '</div>' : '');

        host.classList.add('show');

        setTimeout(function () { host.classList.remove('show'); }, 3200);

    }



    function previewDetail(baseReward, activityTypeId) {

        if (RS && RS.previewReward) {

            return RS.previewReward(baseReward, activityTypeId, { trackDailyBonus: false });

        }

        return T.calcReward(baseReward, null, null, { trackDailyBonus: false, activityTypeId: activityTypeId });

    }



    function augmentRewardEl(el, baseReward, activityTypeId) {

        if (!tierState || tierState.effectiveMultiplier <= 1) return;

        var detail = previewDetail(baseReward, activityTypeId);

        if (!detail || detail.finalPoints <= baseReward) return;

        el.classList.add('pt-has-tier');

        el.setAttribute('data-pt-base', String(baseReward));

        el.innerHTML =

            '<span class="pt-base">+' + baseReward + '</span>' +

            '<span class="pt-final">+' + detail.finalPoints + '</span>' +

            '<span class="pt-mul">' + T.formatMultiplier(detail.effectiveMultiplier) + '</span>';

    }



    function augmentTaskCards() {

        if (!tierState) return;

        qsa('.hp-task-card').forEach(function (card) {

            var reward = card.querySelector('.side .reward');

            if (!reward || reward.classList.contains('pt-has-tier')) return;

            var taskId = card.getAttribute('data-task-id') || '';

            var catalogBase = getCatalogBase(taskId);

            var base = catalogBase;

            if (base == null) {

                var txt = reward.textContent.replace(/\D/g, '');

                base = parseInt(txt, 10);

            }

            if (!base) return;

            var activityTypeId = TASK_ACTIVITY_MAP[taskId];

            augmentRewardEl(reward, base, activityTypeId);

            var desc = card.querySelector('.body .desc');

            if (desc && (!desc.nextElementSibling || !desc.nextElementSibling.classList.contains('pt-tier-hint'))) {

                var hint = document.createElement('span');

                hint.className = 'pt-tier-hint';

                hint.innerHTML = '预估加成 <strong>' + T.formatMultiplier(tierState.effectiveMultiplier) + '</strong> · ' +

                    tierState.matched.map(function (m) { return m.label; }).join(' / ') +

                    ' <span class="pt-tier-pill pt-tier-pill--muted">以领取结算为准</span>';

                desc.parentNode.insertBefore(hint, desc.nextSibling);

            }

        });

    }



    function augmentAsideRows() {

        qsa('.hp-task-row .pts').forEach(function (el) {

            if (el.classList.contains('pt-has-tier')) return;

            var base = parseInt(el.textContent.replace(/\D/g, ''), 10);

            if (!base) return;

            augmentRewardEl(el, base);

        });

    }



    function injectDrawerSummaryTier() {

        var targets = [

            qs('#hpDrawerSummaryCompact'),

            qs('.hp-drawer-summary')

        ].filter(Boolean);

        if (!tierState || tierState.effectiveMultiplier <= 1) return;

        targets.forEach(function (target) {

            if (qs('.pt-summary-tier', target)) return;

            var bar = document.createElement('div');

            bar.className = 'pt-summary-tier';

            bar.innerHTML =

                '<span><i class="fa-solid fa-bolt" style="color:#FBBF24;margin-right:6px"></i>' +

                '当前积分加成 <strong>' + T.formatMultiplier(tierState.effectiveMultiplier) + '</strong>' +

                (tierState.capped ? ' <span class="pt-tier-pill pt-tier-pill--muted">已封顶</span>' : '') +

                '</span>' +

                '<a href="points-tier-info.html">了解规则</a>';

            target.insertBefore(bar, target.firstChild);

        });

    }



    function injectTierLinkInDrawerFoot() {

        var foot = qs('.hp-drawer-foot');

        if (!foot || qs('.pt-tier-link-wrap', foot)) return;

        var wrap = document.createElement('div');

        wrap.className = 'pt-tier-link-wrap';

        wrap.innerHTML = '<a href="points-tier-info.html"><i class="fa-solid fa-circle-info"></i> 查看我的积分加成规则</a>';

        foot.insertBefore(wrap, foot.firstChild);

    }



    function injectProfileInlineTier() {

        var info = qs('.profile-points-inline .ppi-info');

        if (!info || qs('.pt-inline-tier', info) || !tierState || tierState.effectiveMultiplier <= 1) return;

        var pill = document.createElement('span');

        pill.className = 'pt-tier-pill pt-inline-tier';

        pill.innerHTML = '<i class="fa-solid fa-bolt"></i> ' + T.formatMultiplier(tierState.effectiveMultiplier);

        pill.title = '积分分层加成（服务端画像）';

        info.appendChild(pill);

    }



    function augmentLedgerDrawer() {

        qsa('#hpDrawerLedger .hp-ledger-row').forEach(function (row, idx) {

            if (row.querySelector('.pt-tier-sub')) return;

            var amt = row.querySelector('.amt.plus');

            if (!amt) return;

            S.fetchPointsData().then(function (data) {

                var earnRows = data.ledger.filter(function (r) { return r.type === 'earn' && r.points > 0; });

                var ledgerRow = earnRows[idx];

                if (!ledgerRow || !ledgerRow.tierMultiplier || ledgerRow.tierMultiplier <= 1) return;

                var sub = document.createElement('div');

                sub.className = 'pt-tier-sub';

                sub.style.cssText = 'font-size:10px;color:#FBBF24;text-align:right;margin-top:2px';

                sub.textContent = T.formatMultiplier(ledgerRow.tierMultiplier) + ' · 基础 ' + (ledgerRow.basePoints || '');

                amt.parentNode.appendChild(sub);

            });

        });

    }



    function runAugment() {

        T.fetchUserStatus().then(function (st) {

            tierState = st;

            augmentTaskCards();

            augmentAsideRows();

            injectDrawerSummaryTier();

            injectTierLinkInDrawerFoot();

            injectProfileInlineTier();

            augmentLedgerDrawer();

        });

    }



    function observeMutations() {

        ['#hpDrawerTasks', '#hpAsideMount', '#profilePointsInline', '#hpDrawerLedger'].forEach(function (sel) {

            var node = qs(sel);

            if (!node) return;

            new MutationObserver(function () {

                setTimeout(runAugment, 50);

            }).observe(node, { childList: true, subtree: true });

        });

    }



    function boot() {

        wrapClaimTask();

        setTimeout(runAugment, 120);

        setTimeout(runAugment, 600);

        observeMutations();

    }



    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', boot);

    } else {

        boot();

    }

})();


