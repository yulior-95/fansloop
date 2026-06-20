/**
 * 侧栏底部 · Creator Pro 卡片显隐 + 用户行展示 + 升级弹层
 */
(function (global) {
    /** 昵称最大长度（与注册/编辑资料 maxlength 对齐） */
    var SIDEBAR_NAME_MAX = 20;

    var PRO_CARD_HTML =
        '<div class="s-pro-card" data-fl-pro-card>' +
        '  <div class="crown"><i class="fa-solid fa-crown"></i></div>' +
        '  <h4>升级 Creator Pro</h4>' +
        '  <p>解锁高级数据 / 优先推流</p>' +
        '  <button type="button" data-fl-pro-upgrade>立即升级</button>' +
        '</div>';

    var USER_ROW_INNER =
        '<div class="av"></div>' +
        '<div class="info">' +
        '  <div class="name-row">' +
        '    <span class="n"></span>' +
        '    <span class="s-member-tag" data-fl-member-tag hidden><i class="fa-solid fa-crown"></i> 会员</span>' +
        '  </div>' +
        '</div>';

    function getUser() {
        return global.FLAuthUiSync && global.FLAuthUiSync.getUser
            ? global.FLAuthUiSync.getUser()
            : (global.FansloopAuth && global.FansloopAuth.getUser ? global.FansloopAuth.getUser() : null);
    }

    function shouldShowProCard() {
        if (global.FLCreatorPro && global.FLCreatorPro.shouldShowProCard) {
            return global.FLCreatorPro.shouldShowProCard();
        }
        return true;
    }

    function isProMember() {
        return global.FLCreatorPro && global.FLCreatorPro.isActive && global.FLCreatorPro.isActive();
    }

    function applyProCardVisibility() {
        var sidebar = document.querySelector('.app-sidebar');
        if (!sidebar) return;
        var bottom = sidebar.querySelector('.s-bottom');
        if (!bottom) return;

        var show = shouldShowProCard();
        var card = bottom.querySelector('[data-fl-pro-card], .s-pro-card');

        if (show && !card) {
            bottom.insertAdjacentHTML('afterbegin', PRO_CARD_HTML);
            card = bottom.querySelector('[data-fl-pro-card], .s-pro-card');
            bindProUpgradeButtons();
        }

        if (card) {
            if (show) {
                card.style.display = '';
                card.removeAttribute('data-fl-hidden');
                card.setAttribute('aria-hidden', 'false');
            } else {
                card.style.display = 'none';
                card.setAttribute('data-fl-hidden', '1');
                card.setAttribute('aria-hidden', 'true');
            }
        }
    }

    function normalizeSidebarUserRow() {
        var bottom = document.querySelector('.app-sidebar .s-bottom');
        if (!bottom) return;

        bottom.querySelectorAll('.s-pro-card button').forEach(function (btn) {
            if (!btn.hasAttribute('data-fl-pro-upgrade')) {
                btn.setAttribute('data-fl-pro-upgrade', '1');
            }
        });

        var userRow = bottom.querySelector('.s-user');
        if (!userRow) {
            bottom.insertAdjacentHTML('beforeend', '<div class="s-user">' + USER_ROW_INNER + '</div>');
            userRow = bottom.querySelector('.s-user');
        }

        userRow.querySelectorAll('.more, [data-fl-user-more]').forEach(function (el) { el.remove(); });
        userRow.querySelectorAll('.info .e').forEach(function (el) { el.remove(); });

        var info = userRow.querySelector('.info');
        if (!info) {
            userRow.insertAdjacentHTML('beforeend', '<div class="info">' +
                '<div class="name-row"><span class="n"></span>' +
                '<span class="s-member-tag" data-fl-member-tag hidden><i class="fa-solid fa-crown"></i> 会员</span></div></div>');
            info = userRow.querySelector('.info');
        }

        if (!info.querySelector('.name-row')) {
            var oldN = info.querySelector(':scope > .n');
            var nameText = oldN ? oldN.textContent : '';
            if (oldN) oldN.remove();
            var nameRow = document.createElement('div');
            nameRow.className = 'name-row';
            nameRow.innerHTML =
                '<span class="n"></span>' +
                '<span class="s-member-tag" data-fl-member-tag hidden><i class="fa-solid fa-crown"></i> 会员</span>';
            if (nameText) nameRow.querySelector('.n').textContent = nameText;
            info.querySelectorAll('.e').forEach(function (el) { el.remove(); });
            info.appendChild(nameRow);
        }

        if (!userRow.querySelector('.av')) {
            userRow.insertAdjacentHTML('afterbegin', '<div class="av"></div>');
        }

        if (userRow.getAttribute('data-fl-user-row-bound') !== '1') {
            userRow.setAttribute('data-fl-user-row-bound', '1');
            userRow.addEventListener('click', function () {
                location.href = 'profile.html';
            });
        }

        var staleMenu = document.getElementById('flSidebarUserMenu');
        if (staleMenu) staleMenu.remove();
    }

    function applySidebarUserDisplay(user) {
        user = user || getUser();
        normalizeSidebarUserRow();

        document.querySelectorAll('.app-sidebar .s-user').forEach(function (row) {
            row.querySelectorAll('.more, [data-fl-user-more], .info .e').forEach(function (el) { el.remove(); });

            var nameEl = row.querySelector('.info .name-row .n');
            var tagEl = row.querySelector('[data-fl-member-tag]');
            var avEl = row.querySelector('.av');

            var fullName = (user && user.name) ? user.name : (nameEl && nameEl.textContent) || '用户';
            if (nameEl) {
                nameEl.textContent = fullName;
                if (fullName.length > SIDEBAR_NAME_MAX) {
                    nameEl.setAttribute('title', fullName);
                } else {
                    nameEl.removeAttribute('title');
                }
            }

            if (tagEl) {
                var showTag = isProMember();
                tagEl.hidden = !showTag;
                tagEl.style.display = showTag ? 'inline-flex' : 'none';
            }

            if (avEl && user && user.avatar) {
                avEl.style.backgroundImage = "url('" + user.avatar.replace(/'/g, "\\'") + "')";
            }
        });
    }

    function ensureProUpgradeOverlay() {
        var el = document.getElementById('flProUpgradeOverlay');
        if (el) return el;
        el = document.createElement('div');
        el.id = 'flProUpgradeOverlay';
        el.className = 'fl-pro-upgrade-overlay';
        el.innerHTML =
            '<div class="fl-pro-upgrade-panel" role="dialog" aria-labelledby="flProUpgradeTitle">' +
            '  <div class="hd">' +
            '    <div>' +
            '      <h3 id="flProUpgradeTitle"><i class="fa-solid fa-crown"></i> 升级 Creator Pro</h3>' +
            '      <p>为创作者解锁数据分析、定时发布与直播推流优先级</p>' +
            '    </div>' +
            '    <button type="button" class="close" data-fl-pro-close aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>' +
            '  </div>' +
            '  <div class="bd">' +
            '    <ul class="feat">' +
            '      <li><i class="fa-solid fa-chart-line"></i>高级数据分析 · 粉丝画像、内容转化与收益趋势</li>' +
            '      <li><i class="fa-solid fa-clock"></i>定时发布队列 · 多内容排期一键发布</li>' +
            '      <li><i class="fa-solid fa-signal"></i>直播蓝光推流优先级 · 高峰时段稳定码率</li>' +
            '      <li><i class="fa-solid fa-headset"></i>优先客服响应 · 创作者专属支持通道</li>' +
            '    </ul>' +
            '    <div class="plans">' +
            '      <div class="plan selected" data-fl-pro-plan="monthly">' +
            '        <div class="lbl">月付</div><div class="price">$19</div><div class="hint">按月自动续费</div>' +
            '      </div>' +
            '      <div class="plan" data-fl-pro-plan="yearly">' +
            '        <div class="lbl">年付</div><div class="price">$190</div><div class="hint">省 2 个月 · 推荐</div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '  <div class="ft">' +
            '    <button type="button" class="btn btn-secondary" data-fl-pro-close>稍后再说</button>' +
            '    <button type="button" class="btn btn-primary" data-fl-pro-checkout><i class="fa-solid fa-bolt"></i> 前往结算</button>' +
            '  </div>' +
            '</div>';
        document.body.appendChild(el);

        el.addEventListener('click', function (e) {
            if (e.target === el || e.target.closest('[data-fl-pro-close]')) closeProUpgradeOverlay();
        });

        el.querySelectorAll('[data-fl-pro-plan]').forEach(function (plan) {
            plan.addEventListener('click', function () {
                el.querySelectorAll('[data-fl-pro-plan]').forEach(function (p) { p.classList.remove('selected'); });
                plan.classList.add('selected');
            });
        });

        var checkout = el.querySelector('[data-fl-pro-checkout]');
        if (checkout) {
            checkout.addEventListener('click', function () {
                var selected = el.querySelector('[data-fl-pro-plan].selected');
                var plan = selected ? selected.getAttribute('data-fl-pro-plan') : 'monthly';
                closeProUpgradeOverlay();
                if (global.FLCreatorPro && global.FLCreatorPro.setMembership) {
                    global.FLCreatorPro.setMembership(null, {
                        plan: plan,
                        days: plan === 'yearly' ? 365 : 30
                    });
                }
                toastProto('原型：已模拟开通 Creator Pro · ' + (plan === 'yearly' ? '年付' : '月付'));
                applyProCardVisibility();
                applySidebarUserDisplay();
            });
        }

        return el;
    }

    function openProUpgradeOverlay() {
        ensureProUpgradeOverlay().classList.add('show');
    }

    function closeProUpgradeOverlay() {
        var el = document.getElementById('flProUpgradeOverlay');
        if (el) el.classList.remove('show');
    }

    function bindProUpgradeButtons() {
        document.querySelectorAll('[data-fl-pro-upgrade]').forEach(function (btn) {
            if (btn.getAttribute('data-fl-pro-bound') === '1') return;
            btn.setAttribute('data-fl-pro-bound', '1');
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                openProUpgradeOverlay();
            });
        });
    }

    function toastProto(msg) {
        var t = document.getElementById('flSidebarToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'flSidebarToast';
            t.style.cssText =
                'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:10070;' +
                'padding:10px 18px;border-radius:10px;background:rgba(16,18,30,0.96);' +
                'border:1px solid rgba(168,85,247,0.4);color:#fff;font-size:12px;font-weight:600;' +
                'box-shadow:0 12px 40px rgba(0,0,0,0.45);opacity:0;transition:opacity 0.2s;pointer-events:none;';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.opacity = '1';
        clearTimeout(t._hideTimer);
        t._hideTimer = setTimeout(function () { t.style.opacity = '0'; }, 2400);
    }

    function maybeOpenFromUrl() {
        var p = new URLSearchParams(location.search);
        if (p.get('fl_pro_upgrade') === 'open') {
            setTimeout(openProUpgradeOverlay, 80);
        }
    }

    function init() {
        if (!document.querySelector('.app-shell')) return;
        applyProCardVisibility();
        bindProUpgradeButtons();
        applySidebarUserDisplay();
    }

    global.addEventListener('fansloop-auth-change', function () {
        applyProCardVisibility();
        applySidebarUserDisplay();
    });
    global.addEventListener('fl-creator-pro-change', function () {
        applyProCardVisibility();
        applySidebarUserDisplay();
    });

    global.FL_SIDEBAR_NAME_MAX = SIDEBAR_NAME_MAX;
    global.FL_applySidebarBottom = function () {
        applyProCardVisibility();
        bindProUpgradeButtons();
        applySidebarUserDisplay();
        maybeOpenFromUrl();
    };
    global.FL_applySidebarUserDisplay = applySidebarUserDisplay;
    global.FL_openProUpgradeOverlay = openProUpgradeOverlay;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(typeof window !== 'undefined' ? window : this);
