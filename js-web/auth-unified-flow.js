/**
 * 登录 / 注册一体化弹窗（modal-login-main.html）
 */
(function () {
    var tabWallet = document.getElementById('tabAuthWallet');
    var tabEmail = document.getElementById('tabAuthEmail');
    var panelWallet = document.getElementById('walletAuthWrap');
    var panelEmail = document.getElementById('emailAuthPanel');
    if (!tabWallet || !tabEmail || !panelWallet || !panelEmail) return;

    var btnModeLogin = document.getElementById('btnAuthModeLogin');
    var btnModeReg = document.getElementById('btnAuthModeRegister');
    var emailLoginPanel = document.getElementById('emailLoginPanel');
    var emailRegPanel = document.getElementById('emailRegisterPanel');
    var emailInviteCtrl = null;
    var walletInviteCtrl = null;
    var btnWalletLogin = document.getElementById('btnWalletModeLogin');
    var btnWalletReg = document.getElementById('btnWalletModeRegister');

    function setWalletMode(mode) {
        var isReg = mode === 'register';
        document.body.setAttribute('data-wallet-auth-mode', isReg ? 'register' : 'login');
        if (btnWalletLogin) btnWalletLogin.classList.toggle('on', !isReg);
        if (btnWalletReg) btnWalletReg.classList.toggle('on', isReg);
        var title = document.getElementById('walletSuccessTitle');
        var sub = document.getElementById('walletSuccessSub');
        var bindBtn = document.getElementById('btnWalletRegBind');
        if (title) title.textContent = isReg ? '钱包注册成功' : '登录成功';
        if (sub) sub.textContent = isReg ? '账号已创建 · 可完善资料或确认邀请关联' : '欢迎回来';
        if (bindBtn) {
            var hasInvite = false;
            try { hasInvite = !!sessionStorage.getItem('fl_pending_invite'); } catch (e) {}
            bindBtn.style.display = isReg && hasInvite ? '' : 'none';
        }
        try {
            var u = new URL(location.href);
            if (isReg) u.searchParams.set('mode', 'register');
            else u.searchParams.delete('mode');
            history.replaceState(null, '', u.pathname + u.search + (location.hash || ''));
        } catch (e) {}
    }

    function setAuthTab(which) {
        var isEmail = which === 'email';
        tabWallet.classList.toggle('active', !isEmail);
        tabEmail.classList.toggle('active', isEmail);
        document.body.setAttribute('data-auth-tab', isEmail ? 'email' : 'wallet');
        panelWallet.style.display = isEmail ? 'none' : '';
        panelEmail.style.display = isEmail ? '' : 'none';
        try {
            var u = new URL(location.href);
            if (isEmail) u.searchParams.set('tab', 'email');
            else u.searchParams.delete('tab');
            history.replaceState(null, '', u.pathname + u.search + (location.hash || ''));
        } catch (e) {}
    }

    function setEmailMode(mode) {
        var isReg = mode === 'register';
        btnModeLogin.classList.toggle('on', !isReg);
        btnModeReg.classList.toggle('on', isReg);
        emailLoginPanel.style.display = isReg ? 'none' : '';
        emailRegPanel.style.display = isReg ? '' : 'none';
        var regOnly = document.querySelectorAll('[data-auth-reg-only]');
        regOnly.forEach(function (el) {
            el.style.display = isReg ? '' : 'none';
        });
    }

    tabWallet.addEventListener('click', function () { setAuthTab('wallet'); });
    tabEmail.addEventListener('click', function () { setAuthTab('email'); });
    btnModeLogin.addEventListener('click', function () { setEmailMode('login'); });
    btnModeReg.addEventListener('click', function () { setEmailMode('register'); });
    if (btnWalletLogin) btnWalletLogin.addEventListener('click', function () { setWalletMode('login'); });
    if (btnWalletReg) btnWalletReg.addEventListener('click', function () { setWalletMode('register'); });

    if (window.FL_attachInviteField) {
        emailInviteCtrl = window.FL_attachInviteField({
            inputId: 'regInviteCode',
            validBoxId: 'regInviteValid',
            errBoxId: 'regInviteErr',
            hintId: 'regInviteHint',
            submitBtnId: 'btnEmailRegDone',
            onError: showRegErr
        });
        walletInviteCtrl = window.FL_attachInviteField({
            inputId: 'walletInviteCode',
            validBoxId: 'walletInviteValid',
            errBoxId: 'walletInviteErr',
            hintId: 'walletInviteHint',
            submitBtnId: null
        });
        window.FL_walletInviteCtrl = walletInviteCtrl;
        var wInp = document.getElementById('walletInviteCode');
        if (wInp) {
            wInp.addEventListener('input', function () {
                if (window.FL_syncWalletInviteSummary) window.FL_syncWalletInviteSummary();
            });
        }
    }

    function showRegErr(msg) {
        var err = document.getElementById('regErr');
        if (!err) return;
        err.style.display = 'flex';
        err.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i><div>' + msg + '</div>';
    }

    function hideRegErr() {
        var err = document.getElementById('regErr');
        if (err) err.style.display = 'none';
    }

    document.getElementById('btnEmailRegDone').addEventListener('click', function () {
        var otp = (document.getElementById('regOtp').value || '').trim();
        if (!otp || otp !== '123456') {
            showRegErr('请输入正确的验证码');
            return;
        }
        hideRegErr();
        if (emailInviteCtrl) {
            var r = emailInviteCtrl.beforeRegisterSubmit();
            if (!r.ok) {
                showRegErr(r.message);
                return;
            }
            if (r.redirect) {
                location.href = r.redirect;
                return;
            }
        }
        location.href = 'onboarding-profile-complete.html?source=email';
    });

    document.getElementById('btnEmailLogin').addEventListener('click', function () {
        var email = (document.getElementById('emailLoginInput').value || '').trim();
        if (!email) {
            showLoginHint('请输入邮箱');
            return;
        }
        if (email.indexOf('new-user') >= 0 || email === 'new-user@example.com') {
            document.getElementById('emailUnregOverlay').classList.add('show');
            return;
        }
        if (window.FansloopAuth) window.FansloopAuth.login();
        location.href = 'home.html';
    });

    document.getElementById('btnUnregToRegister').addEventListener('click', function () {
        document.getElementById('emailUnregOverlay').classList.remove('show');
        var em = document.getElementById('emailLoginInput').value;
        document.getElementById('regEmail').value = em;
        setEmailMode('register');
    });

    document.getElementById('btnUnregCancel').addEventListener('click', function () {
        document.getElementById('emailUnregOverlay').classList.remove('show');
    });

    function showLoginHint(msg) {
        var el = document.getElementById('loginErr');
        if (!el) return;
        el.style.display = 'flex';
        el.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i><div>' + msg + '</div>';
    }

    document.getElementById('btnWalletRegBind')?.addEventListener('click', function () {
        try {
            var inv = JSON.parse(sessionStorage.getItem('fl_pending_invite') || '{}');
            location.href = 'modal-invite-bind-confirm.html?code=' + encodeURIComponent(inv.code || '') + '&source=wallet';
        } catch (e) {
            location.href = 'modal-invite-bind-confirm.html?source=wallet';
        }
    });

    window.FL_syncWalletInviteSummary = function () {
        var inp = document.getElementById('walletInviteCode');
        var box = document.getElementById('walletInviteSignSummary');
        if (!inp || !box) return;
        var code = inp.value.trim();
        box.textContent = code ? ('已填写邀请码：' + code.toUpperCase()) : '未填写邀请码';
        box.style.color = code ? '#E9D5FF' : '';
    };

    var params = new URLSearchParams(location.search);
    var tab = params.get('tab');
    var mode = params.get('mode');
    var ref = params.get('ref');
    var isRegister = mode === 'register' || !!ref;

    if (tab === 'email') {
        setAuthTab('email');
        setEmailMode(isRegister ? 'register' : 'login');
    } else {
        setAuthTab(tab === 'wallet' ? 'wallet' : 'wallet');
        setWalletMode(isRegister ? 'register' : 'login');
    }
})();
