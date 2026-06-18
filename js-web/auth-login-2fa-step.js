/**
 * 登录 · 风险场景二次验证（原型）
 * 仅在 URL ?risk=… 或用户主动开启「模拟风险登录」时介入，常规定义流不受影响。
 */
(function (global) {
    var RISK_KEY = 'fl_login_risk_sim';
    var TWO_FA_KEY = 'fl_security_2fa_v1';
    var DEMO_TOTP = '123456';

    var pending = null;

    var REASONS = {
        new: '检测到<strong style="color:#fff">新设备 / 新浏览器</strong>登录，请完成二次验证。',
        remote: '检测到<strong style="color:#fff">异地 / 异常 IP</strong>登录，请完成二次验证。',
        idle: '已超过 <strong style="color:#fff">30 天</strong>未在本设备登录，请完成二次验证。',
        pwd: '你最近<strong style="color:#fff">修改过登录密码</strong>，请完成二次验证后再进入。'
    };

    function $(id) {
        return document.getElementById(id);
    }

    function normalizeEmail(email) {
        return String(email || '').trim().toLowerCase();
    }

    function userIdForEmail(email) {
        if (global.FLUserRegistry && global.FLUserRegistry.getByEmail) {
            var acc = global.FLUserRegistry.getByEmail(email);
            if (acc && acc.userId) return acc.userId;
        }
        return null;
    }

    function load2faForUserId(userId) {
        if (!userId) return { totp: false, webauthn: false, webauthnDevice: '' };
        try {
            var raw = localStorage.getItem(TWO_FA_KEY + '_' + userId);
            if (raw) return Object.assign({ totp: false, webauthn: false, webauthnDevice: '' }, JSON.parse(raw));
        } catch (e) { /* ignore */ }
        return { totp: false, webauthn: false, webauthnDevice: '' };
    }

    function riskKindFromUrl() {
        try {
            var p = new URLSearchParams(location.search).get('risk');
            if (!p || p === '1' || p === 'true') return 'new';
            if (REASONS[p]) return p;
        } catch (e) { /* ignore */ }
        return null;
    }

    function isRiskSimEnabled() {
        if (riskKindFromUrl()) return true;
        try {
            return sessionStorage.getItem(RISK_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function enableRiskSim() {
        try {
            sessionStorage.setItem(RISK_KEY, '1');
        } catch (e) { /* ignore */ }
        syncRiskBanner();
    }

    function disableRiskSim() {
        try {
            sessionStorage.removeItem(RISK_KEY);
        } catch (e) { /* ignore */ }
        syncRiskBanner();
    }

    function syncRiskBanner() {
        var on = $('authRiskSimOn');
        var link = $('btnSimRiskLogin');
        if (!on) return;
        var enabled = isRiskSimEnabled();
        on.classList.toggle('show', enabled);
        if (link) {
            link.textContent = enabled ? '关闭风险模拟' : '模拟风险环境登录';
        }
    }

    function currentReasonText() {
        var kind = riskKindFromUrl();
        if (!kind) {
            try {
                kind = sessionStorage.getItem(RISK_KEY + '_kind') || 'new';
            } catch (e) {
                kind = 'new';
            }
        }
        return REASONS[kind] || REASONS.new;
    }

    function readTotpCode() {
        var inputs = document.querySelectorAll('#login2faCode .l2fa-digit');
        var code = '';
        inputs.forEach(function (inp) {
            code += (inp.value || '').trim();
        });
        return code;
    }

    function clearTotpInputs() {
        document.querySelectorAll('#login2faCode .l2fa-digit').forEach(function (inp) {
            inp.value = '';
            inp.classList.remove('filled');
        });
        var first = document.querySelector('#login2faCode .l2fa-digit');
        if (first) first.focus();
    }

    function showErr(msg) {
        var el = $('login2faErr');
        if (!el) return;
        el.classList.add('show');
        el.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i><div>' + msg + '</div>';
    }

    function hideErr() {
        var el = $('login2faErr');
        if (el) el.classList.remove('show');
    }

    function setTab(which) {
        var totpBtn = $('login2faTabTotp');
        var bioBtn = $('login2faTabBio');
        var totpPanel = $('login2faTotpPanel');
        var bioPanel = $('login2faBioPanel');
        var totpSubmit = $('btnLogin2faTotp');
        var isTotp = which === 'totp';
        if (totpBtn) totpBtn.classList.toggle('active', isTotp);
        if (bioBtn) bioBtn.classList.toggle('active', !isTotp);
        if (totpPanel) totpPanel.hidden = !isTotp;
        if (bioPanel) bioPanel.hidden = isTotp;
        if (totpSubmit) totpSubmit.hidden = !isTotp;
    }

    function bindCodeInputs() {
        var wrap = $('login2faCode');
        if (!wrap || wrap.getAttribute('data-bound') === '1') return;
        wrap.setAttribute('data-bound', '1');
        var inputs = wrap.querySelectorAll('.l2fa-digit');
        inputs.forEach(function (inp, idx) {
            inp.addEventListener('input', function () {
                inp.value = inp.value.replace(/\D/g, '').slice(-1);
                inp.classList.toggle('filled', !!inp.value);
                hideErr();
                if (inp.value && inputs[idx + 1]) inputs[idx + 1].focus();
            });
            inp.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace' && !inp.value && inputs[idx - 1]) {
                    inputs[idx - 1].focus();
                }
            });
            inp.addEventListener('paste', function (e) {
                e.preventDefault();
                var text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
                for (var i = 0; i < inputs.length; i++) {
                    inputs[i].value = text[i] || '';
                    inputs[i].classList.toggle('filled', !!inputs[i].value);
                }
                if (text.length >= 6 && inputs[5]) inputs[5].focus();
            });
        });
    }

    function closeOverlay() {
        var ovl = $('login2faOverlay');
        if (!ovl) return;
        ovl.classList.remove('show');
        ovl.setAttribute('aria-hidden', 'true');
        pending = null;
    }

    function finishPending() {
        if (!pending || typeof pending.next !== 'function') {
            closeOverlay();
            return;
        }
        var next = pending.next;
        pending = null;
        closeOverlay();
        next();
    }

    function openOverlay(opts) {
        opts = opts || {};
        pending = opts;
        var ovl = $('login2faOverlay');
        if (!ovl) {
            if (typeof opts.next === 'function') opts.next();
            return;
        }

        var email = normalizeEmail(opts.email);
        var userId = userIdForEmail(email);
        var twofa = load2faForUserId(userId);
        var totpOn = !!twofa.totp;
        var webOn = !!twofa.webauthn;

        var reasonEl = $('login2faReason');
        if (reasonEl) reasonEl.innerHTML = currentReasonText();

        var sub = $('login2faSub');
        if (sub) {
            sub.textContent = email
                ? ('账号 ' + email + ' · 常用设备免验证，当前为风险场景')
                : '常用设备免验证，当前为风险场景';
        }

        var tabs = $('login2faTabs');
        var bioTab = $('login2faTabBio');
        var totpHint = $('login2faTotpHint');
        var bioHint = $('login2faBioHint');
        var bioDevice = $('login2faBioDevice');

        if (bioTab) bioTab.hidden = !webOn;
        if (tabs) tabs.classList.toggle('is-single', !webOn);

        if (totpHint) {
            totpHint.innerHTML = totpOn
                ? '打开认证器 APP，输入 6 位动态码（原型演示可填 <strong style="color:#FBBF24">' + DEMO_TOTP + '</strong>）'
                : '账户安全中未开启认证器；原型演示可填 <strong style="color:#FBBF24">' + DEMO_TOTP + '</strong>';
        }
        if (bioHint) {
            bioHint.textContent = webOn
                ? '使用已注册的 ' + (twofa.webauthnDevice || '本机') + ' 完成快捷验证'
                : '请先在账户安全中注册生物识别';
        }
        if (bioDevice) bioDevice.textContent = twofa.webauthnDevice || '本机设备';

        setTab(webOn && !totpOn ? 'bio' : 'totp');
        clearTotpInputs();
        hideErr();
        bindCodeInputs();

        ovl.classList.add('show');
        ovl.setAttribute('aria-hidden', 'false');
        setTimeout(function () {
            var first = document.querySelector('#login2faCode .l2fa-digit');
            if (first && !document.getElementById('login2faTotpPanel').hidden) first.focus();
        }, 80);
    }

    function verifyTotp() {
        var code = readTotpCode();
        if (code.length !== 6) {
            showErr('请输入完整的 6 位动态码');
            return;
        }
        if (code !== DEMO_TOTP) {
            showErr('动态码不正确（原型演示请使用 ' + DEMO_TOTP + '）');
            return;
        }
        finishPending();
    }

    function verifyBio() {
        var btn = $('btnLogin2faBio');
        if (!btn) return;
        var email = pending && pending.email ? normalizeEmail(pending.email) : '';
        var twofa = load2faForUserId(userIdForEmail(email));
        if (!twofa.webauthn) {
            showErr('请先在「设置 → 账户安全」注册生物识别');
            setTab('totp');
            return;
        }
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 验证中…';
        setTimeout(function () {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-fingerprint"></i> 模拟 · 验证通过';
            finishPending();
        }, 900);
    }

    function maybeGate(opts) {
        if (!isRiskSimEnabled()) return false;
        openOverlay(opts);
        return true;
    }

    function bindUi() {
        syncRiskBanner();

        var riskBtn = $('btnSimRiskLogin');
        if (riskBtn) {
            riskBtn.addEventListener('click', function () {
                if (isRiskSimEnabled()) {
                    disableRiskSim();
                } else {
                    enableRiskSim();
                    var err = $('loginErr');
                    if (err) {
                        err.style.display = 'flex';
                        err.innerHTML = '<i class="fa-solid fa-circle-info" style="color:var(--warning-light)"></i><div>已开启风险模拟：下次登录成功后将要求二次验证（常用设备仍走原流程，需先点此处开启）</div>';
                    }
                }
            });
        }

        var cancelBtn = $('btnLogin2faCancel');
        if (cancelBtn) cancelBtn.addEventListener('click', closeOverlay);

        var totpBtn = $('btnLogin2faTotp');
        if (totpBtn) totpBtn.addEventListener('click', verifyTotp);

        var bioBtn = $('btnLogin2faBio');
        if (bioBtn) bioBtn.addEventListener('click', verifyBio);

        $('login2faTabTotp') && $('login2faTabTotp').addEventListener('click', function () { setTab('totp'); hideErr(); });
        $('login2faTabBio') && $('login2faTabBio').addEventListener('click', function () { setTab('bio'); hideErr(); });

        if (riskKindFromUrl()) {
            enableRiskSim();
            try {
                sessionStorage.setItem(RISK_KEY + '_kind', riskKindFromUrl());
            } catch (e) { /* ignore */ }
        }
    }

    global.FL_login2fa = {
        isRiskSimEnabled: isRiskSimEnabled,
        maybeGate: maybeGate,
        open: openOverlay,
        close: closeOverlay
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindUi);
    } else {
        bindUi();
    }
})(typeof window !== 'undefined' ? window : this);
