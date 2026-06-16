/**
 * 积分商城权益 · 各业务场景生效态（原型）
 */
(function (global) {
    if (global.__flMallBenefitsScenesInit) return;
    global.__flMallBenefitsScenesInit = true;

    var SELF_AVATAR_NEEDLE = 'photo-1494790108377-be9c29b29330';
    var AVATAR_SELECTOR = '.h-avatar, .av, .av-xs, .av-sm, .av-md, .av-lg, .av-xl, .av-mini';
    var avatarObserver = null;
    var avatarObserverTimer = null;

    function store() { return global.MallVouchersStore; }

    function hasSelfAvatarImage(el) {
        if (!el) return false;
        var inline = el.getAttribute('style') || '';
        if (inline.indexOf(SELF_AVATAR_NEEDLE) >= 0) return true;
        try {
            var bg = global.getComputedStyle(el).backgroundImage || '';
            return bg.indexOf(SELF_AVATAR_NEEDLE) >= 0;
        } catch (e) {
            return false;
        }
    }

    function isIconOnlyAvatar(el) {
        return !!el.querySelector(':scope > i.fa-users, :scope > i.fa-inbox, :scope > i.fa-user-group');
    }

    function isAlwaysSelfAvatar(el) {
        if (!el) return false;
        if (el.classList.contains('h-avatar')) return true;
        if (el.closest('.s-user') && el.classList.contains('av')) return true;
        if (el.closest('.ph-row') && el.classList.contains('av-xl')) return true;
        if (el.closest('.cm-input-bar') && el.classList.contains('av')) return true;
        if (el.hasAttribute('data-fl-self-avatar')) return true;
        return false;
    }

    function collectSelfAvatarEls() {
        var seen = new Set();
        var list = [];
        function add(el) {
            if (!el || seen.has(el)) return;
            seen.add(el);
            list.push(el);
        }
        document.querySelectorAll(AVATAR_SELECTOR).forEach(function (el) {
            if (el.classList.contains('grp')) return;
            if (isIconOnlyAvatar(el) && !hasSelfAvatarImage(el)) return;
            if (isAlwaysSelfAvatar(el) || hasSelfAvatarImage(el)) add(el);
        });
        return list;
    }

    function startAvatarFrameObserver() {
        if (avatarObserver || !document.body) return;
        avatarObserver = new MutationObserver(function () {
            clearTimeout(avatarObserverTimer);
            avatarObserverTimer = setTimeout(applyAvatarFrameScene, 100);
        });
        avatarObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }

    function qs(sel, root) { return (root || document).querySelector(sel); }

    function ensureBanner(host, id, className, html) {
        if (!host) return;
        var el = document.getElementById(id);
        if (!html) {
            if (el) el.remove();
            return;
        }
        if (!el) {
            el = document.createElement('div');
            el.id = id;
            host.insertBefore(el, host.firstChild);
        }
        el.className = 'mb-scene-banner ' + className;
        el.innerHTML = html;
    }

    function applyDailyCapScene() {
        var st = store();
        if (!st) return;
        var boost = st.getActiveDailyCapBoost();
        var strip = qs('#homePointsStrip .hp-progress');
        var drawerHead = qs('#hpDrawer .hp-drawer-head');
        var html = boost
            ? '<i class="fa-solid fa-arrow-trend-up"></i><div><strong>每日上限提升卡生效中</strong> · 今日获取上限 ' +
              boost.capFrom + ' → <strong>' + boost.capTo + '</strong> · 次日 0 点恢复</div>'
            : '';
        ensureBanner(strip, 'mbCapBannerStrip', 'mb-scene-banner--cap', html);
        ensureBanner(drawerHead, 'mbCapBannerDrawer', 'mb-scene-banner--cap', html);
    }

    function applyCheckinDoubleBadge() {
        var st = store();
        if (!st) return;
        var dbl = st.getActiveCheckinDouble();
        var badge = dbl
            ? '<span class="mb-task-badge"><i class="fa-solid fa-clone"></i>×' + (dbl.multiplier || 2) + '</span>'
            : '';
        document.querySelectorAll('.hp-task-card[data-id="act_checkin"] .title').forEach(function (title) {
            var old = title.querySelector('.mb-task-badge');
            if (old) old.remove();
            if (badge) title.insertAdjacentHTML('beforeend', badge);
        });
        var drawer = qs('#hpDrawer .hp-drawer-body');
        var tip = dbl
            ? '<i class="fa-solid fa-calendar-check"></i><div><strong>连续签到翻倍卡待使用</strong> · 下一次签到奖励 ×' +
              (dbl.multiplier || 2) + '</div>'
            : '';
        ensureBanner(drawer, 'mbCheckinBanner', 'mb-scene-banner--checkin', tip);
    }

    function applyInviteBoostScene() {
        var st = store();
        if (!st) return;
        var boost = st.getActiveInviteBoost();
        var tip = qs('#inviteRewardTipBanner');
        if (!tip) return;
        var old = tip.querySelector('.mb-invite-boost-line');
        if (old) old.remove();
        if (boost) {
            tip.insertAdjacentHTML('beforeend',
                '<span class="mb-invite-boost-line"><i class="fa-solid fa-bolt"></i> 邀请加成卡生效 · 返利 +' +
                (boost.bonusPercent || 10) + '% · 至 ' + boost.expiresAt + '</span>');
        }
        var head = qs('#profileViewInvite .profile-invite-head');
        var banner = boost
            ? '<i class="fa-solid fa-gift"></i><div><strong>邀请加成 +' + (boost.bonusPercent || 10) +
              '%</strong> · 有效邀请奖励按加成比例发放 · 至 ' + boost.expiresAt + '</div>'
            : '';
        ensureBanner(head, 'mbInviteBoostBanner', 'mb-scene-banner--invite', banner);
    }

    function applyAvatarFrameScene() {
        var st = store();
        if (!st) return;
        var frame = st.getEquippedAvatarFrame();
        var active = !!(frame && frame.frameId === 'neon');
        var targets = collectSelfAvatarEls();
        var targetSet = new Set(targets);

        document.querySelectorAll('.av-frame-neon').forEach(function (el) {
            if (!targetSet.has(el)) el.classList.remove('av-frame-neon');
        });
        targets.forEach(function (el) {
            el.classList.toggle('av-frame-neon', active);
        });

        var info = qs('.ph-row .info');
        if (info) {
            var row = qs('#mbAvatarEquippedRow', info);
            if (!frame) {
                if (row) row.remove();
                var orphan = qs('#mbAvatarEquippedTag', info);
                if (orphan) orphan.remove();
            } else {
                var legacyTag = qs('#mbAvatarEquippedTag', info);
                if (legacyTag && !legacyTag.closest('#mbAvatarEquippedRow')) legacyTag.remove();
                if (!row) {
                    row = document.createElement('div');
                    row.id = 'mbAvatarEquippedRow';
                    row.className = 'mb-avatar-equipped-row';
                    info.appendChild(row);
                }
                var tag = qs('#mbAvatarEquippedTag', row);
                if (!tag) {
                    tag = document.createElement('div');
                    tag.id = 'mbAvatarEquippedTag';
                    tag.className = 'mb-avatar-equipped-tag';
                    row.appendChild(tag);
                }
                var label = '专属头像框 · ' + (frame.frameId === 'neon' ? '霓虹' : frame.frameId) +
                    ' · 至 ' + frame.expiresAt;
                tag.innerHTML = '<i class="fa-solid fa-sparkles"></i> ' + label;
            }
        }

        if (active) startAvatarFrameObserver();
    }

    function updateUpgradeProBtn(mem, expiresAt) {
        var btn = document.getElementById('btnUpgradePro');
        if (!btn) return;
        if (!mem || !expiresAt) {
            btn.innerHTML = '<i class="fa-solid fa-bolt"></i>升级 Pro';
            btn.title = '';
            return;
        }
        btn.innerHTML = '<i class="fa-solid fa-crown"></i>会员至 ' + expiresAt;
        btn.title = '平台会员生效中，到期日 ' + expiresAt;
    }

    function applyMembershipScene() {
        var st = store();
        if (!st) return;
        var mem = st.getActivePlatformMembership();
        if (!mem) {
            var oldRow = document.getElementById('mbMemberEquippedRow');
            if (oldRow) oldRow.remove();
            updateUpgradeProBtn(null);
            return;
        }

        var expiresAt = st.membershipExpiresAt(mem);
        updateUpgradeProBtn(mem, expiresAt);
    }

    function applyCommentHighlightScene() {
        var st = store();
        if (!st) return;
        var hl = st.getActiveCommentHighlight();
        document.querySelectorAll('[data-mb-self-comment="1"]').forEach(function (node) {
            node.classList.toggle('mb-comment-highlight', !!hl);
        });
    }

    function openPpvDemo() {
        var btn = document.querySelector('.btn-open-ppv-unlock');
        if (btn && global.FL_openPpvUnlockModal) {
            global.FL_openPpvUnlockModal(btn);
        }
    }

    function applyAll() {
        applyDailyCapScene();
        applyCheckinDoubleBadge();
        applyInviteBoostScene();
        applyMembershipScene();
        applyAvatarFrameScene();
        applyCommentHighlightScene();
    }

    function whenStoreReady(fn) {
        if (store()) {
            fn();
            return;
        }
        var tries = 0;
        var timer = setInterval(function () {
            tries += 1;
            if (store()) {
                clearInterval(timer);
                fn();
            } else if (tries > 80) {
                clearInterval(timer);
            }
        }, 50);
    }

    function scheduleAvatarFrameRetries() {
        [0, 200, 600, 1200, 2500].forEach(function (ms) {
            setTimeout(applyAvatarFrameScene, ms);
        });
    }

    function bootFromUrl() {
        whenStoreReady(function () {
            var params = new URLSearchParams(location.search);
            var scene = params.get('benefitScene');
            if (scene && store()) store().ensureDemoScene(scene);
            applyAll();
            startAvatarFrameObserver();
            scheduleAvatarFrameRetries();
            if (params.get('ppvUnlock') === 'open') {
                setTimeout(openPpvDemo, 600);
            }
            if (params.get('pointsDrawer') === 'open' && scene === 'daily-cap') {
                setTimeout(function () {
                    var mask = qs('#hpDrawerMask');
                    if (mask && !mask.classList.contains('is-open')) {
                        var btn = qs('#hpOpenDrawerStrip') || qs('#hPointsBtn');
                        if (btn) btn.click();
                    }
                }, 400);
            }
        });
    }

    document.addEventListener('fl-mall-benefits-changed', applyAll);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootFromUrl);
    } else {
        bootFromUrl();
    }

    global.MallBenefitsScenes = {
        applyAll: applyAll,
        bootFromUrl: bootFromUrl,
        applyAvatarFrameScene: applyAvatarFrameScene,
        collectSelfAvatarEls: collectSelfAvatarEls
    };
})(typeof window !== 'undefined' ? window : this);
