/**
 * 登录用户 · 全站 UI 同步（头像 / 昵称 / 角色 / 主页资料）
 */
(function (global) {
    var DEMO_UID = 'demo_uid_882910';

    var LUNA_PROFILE_STATS = {
        works: '142',
        fans: '28.4k',
        following: '368',
        subscribers: '1,284',
        income: '$18,420',
        worksTab: '142',
        paidTab: '26',
        liveTab: '12'
    };

    function getUser() {
        return global.FansloopAuth && global.FansloopAuth.getUser ? global.FansloopAuth.getUser() : null;
    }

    function resolveUser() {
        var user = getUser();
        if (!user || !user.userId) return user;
        if (global.FLUserRegistry && global.FLUserRegistry.getByUserId) {
            var acc = global.FLUserRegistry.getByUserId(user.userId);
            if (acc && global.FLUserRegistry.toSessionUser) {
                return global.FLUserRegistry.toSessionUser(acc);
            }
        }
        return user;
    }

    function hashEmail(email) {
        var h = 0;
        var s = String(email || '');
        for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
        return Math.abs(h);
    }

    function profileStatsForUser(user) {
        if (!user) return null;
        if (user.userId === DEMO_UID) return LUNA_PROFILE_STATS;
        var h = hashEmail(user.email);
        if (user.role !== 'Creator') {
            return {
                works: '0', fans: '0', following: String(h % 12), subscribers: '0', income: '$0',
                worksTab: '0', paidTab: '0', liveTab: '0'
            };
        }
        return {
            works: String(3 + (h % 18)),
            fans: String(40 + (h % 420)),
            following: String(8 + (h % 80)),
            subscribers: String(h % 60),
            income: '$' + (120 + (h % 900)).toLocaleString('en-US'),
            worksTab: String(3 + (h % 18)),
            paidTab: String(h % 5),
            liveTab: String(h % 3)
        };
    }

    function setAvatarEl(el, url) {
        if (!el || !url) return;
        el.style.backgroundImage = "url('" + url.replace(/'/g, "\\'") + "')";
    }

    function applyAvatars(user) {
        document.querySelectorAll('.h-avatar').forEach(function (el) { setAvatarEl(el, user.avatar); });
        document.querySelectorAll('.s-user .av').forEach(function (el) { setAvatarEl(el, user.avatar); });
        var xl = document.querySelector('.profile-head .av-xl');
        if (xl) setAvatarEl(xl, user.avatar);
        var onboard = document.querySelector('.avatar-upload');
        if (onboard) setAvatarEl(onboard, user.avatar);
    }

    function applyNames(user) {
        if (global.FL_applySidebarUserDisplay) {
            global.FL_applySidebarUserDisplay(user);
        }
        var h1 = document.querySelector('.profile-head .info h1');
        if (h1) h1.textContent = user.name;
        document.querySelectorAll('.psp-name').forEach(function (el) {
            el.textContent = user.name;
        });
        var cdd = document.getElementById('cddAuthorName');
        if (cdd) cdd.textContent = user.name;
        var about = document.querySelector('#profileViewHome .profile-about h3, .profile-about h3');
        if (about && user.name) about.textContent = '关于 ' + user.name;
    }

    function applySettingsUid(user) {
        var uidEl = document.getElementById('settingsAccountUid') || document.querySelector('.acc-head .info .uid');
        if (!uidEl || !user) return;
        var publicUid = user.publicUid;
        if (!publicUid && global.FLUserRegistry && user.userId) {
            var acc = global.FLUserRegistry.getByUserId(user.userId);
            if (acc) publicUid = global.FLUserRegistry.resolvePublicUid(acc);
        }
        var joined = user.joinedAt ? ' · 加入于 ' + user.joinedAt : '';
        uidEl.textContent = 'UID: ' + (publicUid || '—') + joined;
    }

    function applyProfileStats(user) {
        var stats = profileStatsForUser(user);
        if (!stats) return;
        var psts = document.querySelectorAll('.profile-stats .pst');
        if (psts.length >= 5) {
            var vals = psts[0].querySelector('.v'); if (vals) vals.textContent = stats.works;
            vals = psts[1].querySelector('.v'); if (vals) vals.textContent = stats.fans;
            vals = psts[2].querySelector('.v'); if (vals) vals.textContent = stats.following;
            vals = psts[3].querySelector('.v'); if (vals) vals.textContent = stats.subscribers;
            vals = psts[4].querySelector('.v'); if (vals) vals.textContent = stats.income;
            var deltas = psts[1].querySelector('.delta');
            if (deltas && user.userId !== DEMO_UID) deltas.style.display = 'none';
            deltas = psts[3].querySelector('.delta');
            if (deltas && user.userId !== DEMO_UID) deltas.style.display = 'none';
        }
        document.querySelectorAll('#profileTabs .tb .cnt').forEach(function (cnt, i) {
            var keys = ['worksTab', 'paidTab', 'liveTab'];
            if (keys[i] && stats[keys[i]] != null) cnt.textContent = stats[keys[i]];
        });
    }

    function applyProfileMeta(user) {
        var roleLine = document.getElementById('profileRoleLine');
        if (roleLine) {
            roleLine.textContent = (user.role || 'Fan') + ' · ' + (user.walletShort || '0x----...----');
        }
        var bio = document.querySelector('.profile-head .bio');
        if (bio && user.bio) bio.textContent = user.bio;
        var meta = document.querySelector('.ph-meta');
        if (meta && user.location) {
            var loc = meta.querySelector('span');
            if (loc) loc.innerHTML = '<i class="fa-solid fa-location-dot"></i> ' + user.location;
        }
        var joined = meta && meta.querySelectorAll('span')[2];
        if (joined && user.joinedAt) {
            joined.innerHTML = '<i class="fa-regular fa-calendar"></i> 加入于 ' + user.joinedAt;
        }
        applySettingsUid(user);
        var nickInput = document.querySelector('#sheetEditProfile .field input[type="text"], .edit-profile-sheet input[type="text"], #onboardNickname');
        if (nickInput) {
            nickInput.value = user.name;
            nickInput.maxLength = global.FL_SIDEBAR_NAME_MAX || 20;
        }
    }

    function refreshPointsFromData(data) {
        if (!data || !global.FLHomePoints) return;
        var btn = document.getElementById('hPointsBtn');
        if (btn && global.FLHomePoints.formatPoints) {
            var w = data.wallet;
            btn.innerHTML =
                '<span class="ic"><i class="fa-solid fa-coins"></i></span>' +
                '<span class="val">' + global.FLHomePoints.formatPoints(w.available) + '</span>' +
                '<span class="sub">积分</span>';
            btn.title = '可用 ' + global.FLHomePoints.formatPoints(w.available) + ' · 冷静中 ' + global.FLHomePoints.formatPoints(w.frozen);
        }
    }

    function refreshPointsUi() {
        if (!global.FLHomePoints || !global.FLHomePoints.fetchPointsData) return;
        global.FLHomePoints.fetchPointsData().then(function (data) {
            refreshPointsFromData(data);
            try {
                global.dispatchEvent(new CustomEvent('fl-points-data-change', { detail: data }));
            } catch (e) { /* ignore */ }
        });
    }

    function applyKycTag() {
        if (!global.FLUserAssets) return;
        var tag = document.querySelector('#creatorTagsRow .tag-info, .tags-row .tag-info');
        if (!tag) return;
        var approved = global.FLUserAssets.isKycApproved();
        if (approved) {
            tag.className = 'tag tag-info';
            tag.innerHTML = '<i class="fa-solid fa-shield-halved"></i>身份认证';
        } else {
            tag.className = 'tag tag-muted';
            tag.innerHTML = '<i class="fa-solid fa-shield" aria-hidden="true"></i>未认证';
        }
    }

    function apply() {
        var user = resolveUser();
        if (!user || !user.email) return;
        if (document.body) {
            document.body.setAttribute('data-current-user-id', user.userId || '');
            document.body.setAttribute('data-current-user-email', user.email || '');
        }
        applyAvatars(user);
        applyNames(user);
        applyProfileMeta(user);
        applyProfileStats(user);
        applyKycTag();
        refreshPointsUi();
        if (global.FLWalletPageSync) global.FLWalletPageSync.apply();
        if (global.FL_applySidebarBottom) global.FL_applySidebarBottom();
        if (global.FL_applyCreatorIncomeForUser) global.FL_applyCreatorIncomeForUser(user);
    }

    global.FLAuthUiSync = { apply: apply, getUser: getUser, resolveUser: resolveUser };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply);
    } else {
        apply();
    }

    global.addEventListener('fansloop-auth-change', apply);
    global.addEventListener('fl-user-assets-change', apply);
    global.addEventListener('fl-points-data-change', function (e) {
        if (e.detail) refreshPointsFromData(e.detail);
    });
})(typeof window !== 'undefined' ? window : this);
