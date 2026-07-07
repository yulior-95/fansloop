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

    var PRO_PLANS = {
        monthly: { usd: 19, days: 30, label: '月付' },
        yearly: { usd: 190, days: 365, label: '年付' }
    };

    var proFlow = { plan: 'monthly', pwdBuffer: '', step: 'plan' };
    var proOverlayBound = false;
    var proUpgradeDelegated = false;

    function formatUsdt(n) {
        n = Number(n) || 0;
        if (global.LiveWalletStore && global.LiveWalletStore.format) {
            return global.LiveWalletStore.format(n);
        }
        return (Math.round(n * 100) / 100).toFixed(2);
    }

    function getWalletBalance() {
        if (global.LiveWalletStore) return global.LiveWalletStore.getBalance();
        if (global.FLUserAssets && global.FLUserAssets.getLiveUsdt) {
            return global.FLUserAssets.getLiveUsdt();
        }
        return 0;
    }

    function deductWallet(price) {
        if (global.LiveWalletStore) return global.LiveWalletStore.deduct(price);
        if (global.FLUserAssets && global.FLUserAssets.getLiveUsdt && global.FLUserAssets.setLiveUsdt) {
            var bal = global.FLUserAssets.getLiveUsdt();
            if (bal < price) return false;
            global.FLUserAssets.setLiveUsdt(bal - price);
            return true;
        }
        return true;
    }

    function hasPayPassword() {
        return global.FLPayPasswordStore && global.FLPayPasswordStore.hasPassword();
    }

    function payPwdSettingsUrl() {
        var ret = location.pathname.split('/').pop() + location.search;
        if (global.FLPayPasswordStore && global.FLPayPasswordStore.getSettingsUrl) {
            return global.FLPayPasswordStore.getSettingsUrl(ret + (ret.indexOf('?') >= 0 ? '&' : '?') + 'fl_pro_upgrade=open');
        }
        return 'settings-pay-password.html?return=' + encodeURIComponent(ret) + '&fl_pro_upgrade=open';
    }

    function ensureLoggedInForPro() {
        if (global.FansloopAuth && global.FansloopAuth.isLoggedIn && global.FansloopAuth.isLoggedIn()) {
            return true;
        }
        if (global.FansloopAuth && global.FansloopAuth.login) {
            global.FansloopAuth.login({ email: 'luna@fansloop.io' });
            return true;
        }
        return false;
    }

    function getSelectedProPlan() {
        var el = document.getElementById('flProUpgradeOverlay');
        if (!el) return proFlow.plan;
        var selected = el.querySelector('[data-fl-pro-plan].selected');
        return selected ? selected.getAttribute('data-fl-pro-plan') : proFlow.plan;
    }

    function getSelectedProPrice() {
        var plan = getSelectedProPlan();
        return (PRO_PLANS[plan] || PRO_PLANS.monthly).usd;
    }

    function formatProExpiry(iso) {
        if (!iso) return '—';
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    function lockBodyScroll(lock) {
        document.body.style.overflow = lock ? 'hidden' : '';
    }

    function showProStep(step) {
        proFlow.step = step;
        var overlay = document.getElementById('flProUpgradeOverlay');
        if (!overlay) return;
        overlay.querySelectorAll('[data-fl-pro-step]').forEach(function (panel) {
            var on = panel.getAttribute('data-fl-pro-step') === step;
            panel.hidden = !on;
            panel.classList.toggle('is-active', on);
        });
        var title = overlay.querySelector('#flProUpgradeTitle');
        var subtitle = overlay.querySelector('#flProUpgradeSubtitle');
        if (title) {
            var titles = {
                plan: '升级 Creator Pro',
                checkout: '确认订单',
                recharge: '余额不足',
                'pwd-missing': '设置支付密码',
                processing: '正在支付',
                success: '开通成功'
            };
            title.innerHTML = '<i class="fa-solid fa-crown"></i> ' + (titles[step] || titles.plan);
        }
        if (subtitle) {
            var subs = {
                plan: '为创作者解锁数据分析、定时发布与直播推流优先级',
                checkout: '使用钱包 USDT 余额支付 · 支付后立即生效',
                recharge: '充值完成后可返回继续开通 Creator Pro',
                'pwd-missing': '为保障资金安全，开通前需先设置 6 位支付密码',
                processing: '链上结算确认中，请稍候…',
                success: 'Creator Pro 权益已下发至你的账号'
            };
            subtitle.textContent = subs[step] || subs.plan;
        }
        var closeBtn = overlay.querySelector('.hd .close');
        if (closeBtn) closeBtn.style.visibility = step === 'processing' ? 'hidden' : '';
    }

    function renderCheckoutStep() {
        var overlay = document.getElementById('flProUpgradeOverlay');
        if (!overlay) return;
        var plan = getSelectedProPlan();
        var meta = PRO_PLANS[plan] || PRO_PLANS.monthly;
        var price = meta.usd;
        var balance = getWalletBalance();
        proFlow.plan = plan;

        var planName = overlay.querySelector('[data-fl-pro-checkout-plan]');
        var planPrice = overlay.querySelector('[data-fl-pro-checkout-price]');
        var planDays = overlay.querySelector('[data-fl-pro-checkout-days]');
        var balEl = overlay.querySelector('[data-fl-pro-checkout-balance]');
        var dueEl = overlay.querySelector('[data-fl-pro-checkout-due]');
        var warn = overlay.querySelector('[data-fl-pro-checkout-warn]');

        if (planName) planName.textContent = 'Creator Pro · ' + meta.label;
        if (planPrice) planPrice.textContent = formatUsdt(price) + ' USDT';
        if (planDays) planDays.textContent = meta.days + ' 天';
        if (balEl) balEl.textContent = formatUsdt(balance) + ' USDT';
        if (dueEl) dueEl.textContent = formatUsdt(price) + ' USDT';
        if (warn) {
            var low = balance < price;
            warn.hidden = !low;
            warn.textContent = low
                ? '可用余额不足，还需充值 ' + formatUsdt(price - balance) + ' USDT'
                : '';
        }
        renderProPwdDots();
    }

    function renderProPwdDots() {
        var overlay = document.getElementById('flProUpgradeOverlay');
        if (!overlay) return;
        overlay.querySelectorAll('[data-fl-pro-pwd-dot]').forEach(function (dot, i) {
            dot.classList.toggle('filled', i < proFlow.pwdBuffer.length);
        });
    }

    function clearProPwdBuffer() {
        proFlow.pwdBuffer = '';
        renderProPwdDots();
    }

    function appendProPwdDigit(d) {
        if (proFlow.pwdBuffer.length >= 6) return;
        proFlow.pwdBuffer += d;
        renderProPwdDots();
        if (proFlow.pwdBuffer.length === 6) {
            setTimeout(submitProPayment, 120);
        }
    }

    function renderRechargeStep() {
        var overlay = document.getElementById('flProUpgradeOverlay');
        if (!overlay) return;
        var price = getSelectedProPrice();
        var balance = getWalletBalance();
        var need = Math.max(0, price - balance);
        var needEl = overlay.querySelector('[data-fl-pro-recharge-need]');
        var balEl = overlay.querySelector('[data-fl-pro-recharge-balance]');
        if (needEl) needEl.textContent = formatUsdt(need) + ' USDT';
        if (balEl) balEl.textContent = formatUsdt(balance) + ' USDT';
    }

    function renderSuccessStep(rec) {
        var overlay = document.getElementById('flProUpgradeOverlay');
        if (!overlay) return;
        var plan = (rec && rec.plan) || proFlow.plan;
        var meta = PRO_PLANS[plan] || PRO_PLANS.monthly;
        var exp = (rec && rec.expiresAt) || (global.FLCreatorPro && global.FLCreatorPro.getExpiresAt());
        var planEl = overlay.querySelector('[data-fl-pro-success-plan]');
        var expEl = overlay.querySelector('[data-fl-pro-success-exp]');
        if (planEl) planEl.textContent = 'Creator Pro · ' + meta.label;
        if (expEl) expEl.textContent = formatProExpiry(exp);
    }

    function goToCheckout() {
        ensureLoggedInForPro();
        proFlow.plan = getSelectedProPlan();
        var price = getSelectedProPrice();
        if (!hasPayPassword()) {
            showProStep('pwd-missing');
            return;
        }
        if (getWalletBalance() < price) {
            renderRechargeStep();
            showProStep('recharge');
            return;
        }
        clearProPwdBuffer();
        renderCheckoutStep();
        showProStep('checkout');
    }

    function submitProPayment() {
        if (proFlow.step !== 'checkout') return;
        var price = getSelectedProPrice();
        if (getWalletBalance() < price) {
            renderRechargeStep();
            showProStep('recharge');
            return;
        }
        if (!hasPayPassword()) {
            showProStep('pwd-missing');
            return;
        }
        if (proFlow.pwdBuffer.length < 6) {
            toastProto('请输入 6 位支付密码');
            return;
        }
        if (!global.FLPayPasswordStore || !global.FLPayPasswordStore.verify(proFlow.pwdBuffer)) {
            toastProto('支付密码错误，请重试');
            clearProPwdBuffer();
            return;
        }
        showProStep('processing');
        setTimeout(function () {
            var plan = getSelectedProPlan();
            var meta = PRO_PLANS[plan] || PRO_PLANS.monthly;
            if (!deductWallet(price)) {
                toastProto('扣款失败，余额不足');
                renderRechargeStep();
                showProStep('recharge');
                return;
            }
            var rec = null;
            if (global.FLCreatorPro && global.FLCreatorPro.setMembership) {
                rec = global.FLCreatorPro.setMembership(null, {
                    plan: plan,
                    days: meta.days
                });
            }
            renderSuccessStep(rec);
            showProStep('success');
            applyProCardVisibility();
            applySidebarUserDisplay();
            try {
                global.dispatchEvent(new CustomEvent('fl-creator-pro-purchased', {
                    detail: { plan: plan, record: rec }
                }));
            } catch (e) { /* ignore */ }
        }, 1100);
    }

    function resetProFlow() {
        proFlow.plan = 'monthly';
        proFlow.pwdBuffer = '';
        proFlow.step = 'plan';
        var overlay = document.getElementById('flProUpgradeOverlay');
        if (overlay) {
            overlay.querySelectorAll('[data-fl-pro-plan]').forEach(function (p) {
                p.classList.toggle('selected', p.getAttribute('data-fl-pro-plan') === 'monthly');
            });
        }
        showProStep('plan');
    }

    function ensureProUpgradeOverlay() {
        var el = document.getElementById('flProUpgradeOverlay');
        if (el) return el;
        el = document.createElement('div');
        el.id = 'flProUpgradeOverlay';
        el.className = 'fl-pro-upgrade-overlay';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML =
            '<div class="fl-pro-upgrade-panel" role="dialog" aria-modal="true" aria-labelledby="flProUpgradeTitle">' +
            '  <div class="hd">' +
            '    <div class="hd-text">' +
            '      <h3 id="flProUpgradeTitle"><i class="fa-solid fa-crown"></i> 升级 Creator Pro</h3>' +
            '      <p id="flProUpgradeSubtitle">为创作者解锁数据分析、定时发布与直播推流优先级</p>' +
            '    </div>' +
            '    <button type="button" class="close" data-fl-pro-close aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>' +
            '  </div>' +
            '  <div class="fl-pro-step is-active" data-fl-pro-step="plan">' +
            '    <div class="bd">' +
            '      <ul class="feat">' +
            '        <li><i class="fa-solid fa-chart-line"></i>高级数据分析 · 粉丝画像、内容转化与收益趋势</li>' +
            '        <li><i class="fa-solid fa-clock"></i>定时发布队列 · 多内容排期一键发布</li>' +
            '        <li><i class="fa-solid fa-signal"></i>直播蓝光推流优先级 · 高峰时段稳定码率</li>' +
            '        <li><i class="fa-solid fa-headset"></i>优先客服响应 · 创作者专属支持通道</li>' +
            '      </ul>' +
            '      <div class="plans">' +
            '        <div class="plan selected" data-fl-pro-plan="monthly">' +
            '          <div class="lbl">月付</div><div class="price">$19</div><div class="hint">按月自动续费</div>' +
            '        </div>' +
            '        <div class="plan" data-fl-pro-plan="yearly">' +
            '          <div class="lbl">年付</div><div class="price">$190</div><div class="hint">省 2 个月 · 推荐</div>' +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '    <div class="ft">' +
            '      <button type="button" class="btn btn-secondary" data-fl-pro-close>稍后再说</button>' +
            '      <button type="button" class="btn btn-primary" data-fl-pro-goto-checkout><i class="fa-solid fa-bolt"></i> 前往结算</button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="fl-pro-step" data-fl-pro-step="checkout" hidden>' +
            '    <div class="bd">' +
            '      <div class="fl-pro-order">' +
            '        <div class="fl-pro-order-hd"><i class="fa-solid fa-receipt"></i> 订单摘要</div>' +
            '        <div class="fl-pro-order-row"><span>商品</span><strong data-fl-pro-checkout-plan>—</strong></div>' +
            '        <div class="fl-pro-order-row"><span>有效期</span><strong data-fl-pro-checkout-days>—</strong></div>' +
            '        <div class="fl-pro-order-row is-total"><span>应付金额</span><strong class="amt" data-fl-pro-checkout-price>—</strong></div>' +
            '      </div>' +
            '      <div class="fl-pro-wallet">' +
            '        <div class="fl-pro-order-row"><span><i class="fa-solid fa-wallet"></i> 钱包可用</span><strong data-fl-pro-checkout-balance>—</strong></div>' +
            '        <div class="fl-pro-order-row is-due"><span>实付</span><strong class="amt" data-fl-pro-checkout-due>—</strong></div>' +
            '        <p class="fl-pro-warn" data-fl-pro-checkout-warn hidden></p>' +
            '      </div>' +
            '      <div class="fl-pro-pwd-block">' +
            '        <div class="fl-pro-pwd-label">输入支付密码</div>' +
            '        <div class="fl-pro-pwd-dots" aria-hidden="true">' +
            '          <span data-fl-pro-pwd-dot></span><span data-fl-pro-pwd-dot></span><span data-fl-pro-pwd-dot></span>' +
            '          <span data-fl-pro-pwd-dot></span><span data-fl-pro-pwd-dot></span><span data-fl-pro-pwd-dot></span>' +
            '        </div>' +
            '        <div class="fl-pro-pwd-pad">' +
            '          <button type="button" data-fl-pro-digit="1">1</button><button type="button" data-fl-pro-digit="2">2</button><button type="button" data-fl-pro-digit="3">3</button>' +
            '          <button type="button" data-fl-pro-digit="4">4</button><button type="button" data-fl-pro-digit="5">5</button><button type="button" data-fl-pro-digit="6">6</button>' +
            '          <button type="button" data-fl-pro-digit="7">7</button><button type="button" data-fl-pro-digit="8">8</button><button type="button" data-fl-pro-digit="9">9</button>' +
            '          <button type="button" class="ghost" data-fl-pro-pwd-clear>清除</button><button type="button" data-fl-pro-digit="0">0</button>' +
            '          <button type="button" class="ghost" data-fl-pro-pwd-back><i class="fa-solid fa-delete-left"></i></button>' +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '    <div class="ft">' +
            '      <button type="button" class="btn btn-secondary" data-fl-pro-back="plan"><i class="fa-solid fa-arrow-left"></i> 返回</button>' +
            '      <button type="button" class="btn btn-primary" data-fl-pro-pay-confirm><i class="fa-solid fa-lock"></i> 确认支付</button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="fl-pro-step" data-fl-pro-step="recharge" hidden>' +
            '    <div class="bd fl-pro-center-bd">' +
            '      <div class="fl-pro-icon-badge warn"><i class="fa-solid fa-wallet"></i></div>' +
            '      <p class="fl-pro-lead">钱包 USDT 余额不足，无法完成支付。</p>' +
            '      <div class="fl-pro-order compact">' +
            '        <div class="fl-pro-order-row"><span>当前余额</span><strong data-fl-pro-recharge-balance>—</strong></div>' +
            '        <div class="fl-pro-order-row is-total"><span>建议充值</span><strong class="amt" data-fl-pro-recharge-need>—</strong></div>' +
            '      </div>' +
            '      <p class="fl-pro-hint">充值到账后返回本页，侧栏「立即升级」可继续开通。</p>' +
            '    </div>' +
            '    <div class="ft">' +
            '      <button type="button" class="btn btn-secondary" data-fl-pro-back="checkout">返回</button>' +
            '      <button type="button" class="btn btn-primary" data-fl-pro-go-recharge><i class="fa-solid fa-bolt"></i> 去充值</button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="fl-pro-step" data-fl-pro-step="pwd-missing" hidden>' +
            '    <div class="bd fl-pro-center-bd">' +
            '      <div class="fl-pro-icon-badge"><i class="fa-solid fa-shield-halved"></i></div>' +
            '      <p class="fl-pro-lead">你尚未设置支付密码，无法使用钱包余额支付 Creator Pro。</p>' +
            '      <p class="fl-pro-hint">设置完成后将自动返回本页继续结算（原型默认密码 123456）。</p>' +
            '    </div>' +
            '    <div class="ft">' +
            '      <button type="button" class="btn btn-secondary" data-fl-pro-back="plan">稍后再说</button>' +
            '      <button type="button" class="btn btn-primary" data-fl-pro-go-pwd><i class="fa-solid fa-key"></i> 去设置密码</button>' +
            '    </div>' +
            '  </div>' +
            '  <div class="fl-pro-step" data-fl-pro-step="processing" hidden>' +
            '    <div class="bd fl-pro-center-bd">' +
            '      <div class="fl-pro-spinner" aria-hidden="true"></div>' +
            '      <p class="fl-pro-lead">正在验证支付密码并扣款…</p>' +
            '    </div>' +
            '  </div>' +
            '  <div class="fl-pro-step" data-fl-pro-step="success" hidden>' +
            '    <div class="bd fl-pro-center-bd">' +
            '      <div class="fl-pro-icon-badge ok"><i class="fa-solid fa-circle-check"></i></div>' +
            '      <p class="fl-pro-lead">Creator Pro 已开通</p>' +
            '      <div class="fl-pro-order compact">' +
            '        <div class="fl-pro-order-row"><span>当前方案</span><strong data-fl-pro-success-plan>—</strong></div>' +
            '        <div class="fl-pro-order-row"><span>到期时间</span><strong data-fl-pro-success-exp>—</strong></div>' +
            '      </div>' +
            '      <ul class="fl-pro-success-feats">' +
            '        <li><i class="fa-solid fa-check"></i>高级数据分析已解锁</li>' +
            '        <li><i class="fa-solid fa-check"></i>定时发布队列已解锁</li>' +
            '        <li><i class="fa-solid fa-check"></i>直播推流优先级已生效</li>' +
            '      </ul>' +
            '    </div>' +
            '    <div class="ft">' +
            '      <button type="button" class="btn btn-primary" data-fl-pro-done style="flex:1"><i class="fa-solid fa-sparkles"></i> 开始使用</button>' +
            '    </div>' +
            '  </div>' +
            '</div>';
        document.body.appendChild(el);
        bindProOverlayEvents(el);
        return el;
    }

    function bindProOverlayEvents(el) {
        if (!el || proOverlayBound) return;
        proOverlayBound = true;

        el.addEventListener('click', function (e) {
            if (e.target === el && proFlow.step !== 'processing') closeProUpgradeOverlay();
        });

        el.addEventListener('click', function (e) {
            if (e.target.closest('[data-fl-pro-close]') && proFlow.step !== 'processing') {
                closeProUpgradeOverlay();
                return;
            }
            if (e.target.closest('[data-fl-pro-plan]')) {
                var plan = e.target.closest('[data-fl-pro-plan]');
                el.querySelectorAll('[data-fl-pro-plan]').forEach(function (p) { p.classList.remove('selected'); });
                plan.classList.add('selected');
                proFlow.plan = plan.getAttribute('data-fl-pro-plan');
                return;
            }
            if (e.target.closest('[data-fl-pro-goto-checkout]')) {
                goToCheckout();
                return;
            }
            if (e.target.closest('[data-fl-pro-back]')) {
                var back = e.target.closest('[data-fl-pro-back]').getAttribute('data-fl-pro-back');
                if (back === 'checkout') {
                    clearProPwdBuffer();
                    renderCheckoutStep();
                }
                showProStep(back);
                return;
            }
            if (e.target.closest('[data-fl-pro-pay-confirm]')) {
                submitProPayment();
                return;
            }
            if (e.target.closest('[data-fl-pro-digit]')) {
                appendProPwdDigit(e.target.closest('[data-fl-pro-digit]').getAttribute('data-fl-pro-digit'));
                return;
            }
            if (e.target.closest('[data-fl-pro-pwd-clear]')) {
                clearProPwdBuffer();
                return;
            }
            if (e.target.closest('[data-fl-pro-pwd-back]')) {
                proFlow.pwdBuffer = proFlow.pwdBuffer.slice(0, -1);
                renderProPwdDots();
                return;
            }
            if (e.target.closest('[data-fl-pro-go-recharge]')) {
                var ret = location.pathname.split('/').pop() + (location.search || '');
                var sep = ret.indexOf('?') >= 0 ? '&' : '?';
                location.href = 'wallet.html?fl_pro_upgrade=open&return=' + encodeURIComponent(ret + sep + 'fl_pro_upgrade=open');
                return;
            }
            if (e.target.closest('[data-fl-pro-go-pwd]')) {
                location.href = payPwdSettingsUrl();
                return;
            }
            if (e.target.closest('[data-fl-pro-done]')) {
                closeProUpgradeOverlay();
                return;
            }
        });

        document.addEventListener('keydown', function (e) {
            if (!el.classList.contains('show') || proFlow.step === 'processing') return;
            if (e.key === 'Escape') closeProUpgradeOverlay();
        });
    }

    function openProUpgradeOverlay() {
        if (global.FLCreatorPro && global.FLCreatorPro.isActive && global.FLCreatorPro.isActive()) {
            toastProto('你已是 Creator Pro 会员');
            return;
        }
        var el = ensureProUpgradeOverlay();
        resetProFlow();
        el.classList.add('show');
        el.setAttribute('aria-hidden', 'false');
        lockBodyScroll(true);
    }

    function closeProUpgradeOverlay() {
        var el = document.getElementById('flProUpgradeOverlay');
        if (!el || proFlow.step === 'processing') return;
        el.classList.remove('show');
        el.setAttribute('aria-hidden', 'true');
        lockBodyScroll(false);
        clearProPwdBuffer();
    }

    function bindProUpgradeButtons() {
        if (proUpgradeDelegated) return;
        proUpgradeDelegated = true;
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-fl-pro-upgrade], .s-pro-card button');
            if (!btn || !btn.closest('.s-pro-card')) return;
            if (!btn.hasAttribute('data-fl-pro-upgrade')) {
                btn.setAttribute('data-fl-pro-upgrade', '1');
            }
            e.preventDefault();
            e.stopPropagation();
            openProUpgradeOverlay();
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
            setTimeout(function () {
                if (global.FLCreatorPro && global.FLCreatorPro.isActive && global.FLCreatorPro.isActive()) {
                    return;
                }
                openProUpgradeOverlay();
            }, 120);
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
    global.FL_closeProUpgradeOverlay = closeProUpgradeOverlay;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(typeof window !== 'undefined' ? window : this);
