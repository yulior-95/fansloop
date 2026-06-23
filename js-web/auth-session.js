/**
 * FansLoop Web 原型 · 登录会话（游客 / 已登录 · 按邮箱区分用户）
 */
(function (global) {
    var KEY = "fansloop_auth";
    var PENDING_EMAIL = "fl_pending_onboard_email";

    var FALLBACK_USER = {
        userId: "demo_uid_882910",
        publicUid: "882910",
        name: "Luna 🌙",
        email: "luna@fansloop.io",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        role: "Creator"
    };

    function read() {
        try {
            var raw = localStorage.getItem(KEY);
            if (!raw) return { loggedIn: false, user: null };
            var o = JSON.parse(raw);
            return {
                loggedIn: !!o.loggedIn,
                user: o.user || null
            };
        } catch (e) {
            return { loggedIn: false, user: null };
        }
    }

    function write(o) {
        localStorage.setItem(KEY, JSON.stringify(o));
        try {
            global.dispatchEvent(new CustomEvent("fansloop-auth-change", { detail: o }));
        } catch (e) {}
    }

    function sessionFromAccount(account) {
        if (!account) return null;
        if (global.FLUserRegistry && global.FLUserRegistry.toSessionUser) {
            return global.FLUserRegistry.toSessionUser(account);
        }
        return Object.assign({}, FALLBACK_USER, account);
    }

    function activateAccount(account) {
        var user = sessionFromAccount(account);
        if (global.FLUserRegistry && global.FLUserRegistry.ensureTierProfile) {
            global.FLUserRegistry.ensureTierProfile(account);
        }
        if (global.FLUserAssets && account) {
            global.FLUserAssets.ensureAssets(account);
        }
        try {
            localStorage.removeItem('fansloop_wallet_usdt');
        } catch (e) { /* ignore */ }
        write({ loggedIn: true, user: user });
        return user;
    }

    global.FansloopAuth = {
        KEY: KEY,
        PENDING_EMAIL: PENDING_EMAIL,
        isLoggedIn: function () {
            return read().loggedIn;
        },
        getUser: function () {
            return read().user;
        },
        getUserId: function () {
            var u = read().user;
            return u && u.userId ? u.userId : null;
        },
        getEmail: function () {
            var u = read().user;
            return u && u.email ? u.email : null;
        },
        register: function (opts) {
            opts = opts || {};
            var email = opts.email;
            if (!email || !global.FLUserRegistry) {
                return activateAccount(null);
            }
            var account = global.FLUserRegistry.registerEmail(email, { name: opts.name });
            try {
                sessionStorage.setItem(PENDING_EMAIL, email);
            } catch (e) {}
            return activateAccount(account);
        },
        login: function (opts) {
            opts = opts || {};
            if (opts.email && global.FLUserRegistry) {
                return activateAccount(global.FLUserRegistry.loginEmail(opts.email));
            }
            if (opts.walletAddress && global.FLUserRegistry) {
                return activateAccount(global.FLUserRegistry.loginWallet(opts.walletAddress, !!opts.isRegister));
            }
            if (global.FLUserRegistry) {
                return activateAccount(global.FLUserRegistry.getByEmail("luna@fansloop.io") || null);
            }
            write({
                loggedIn: true,
                user: Object.assign({}, FALLBACK_USER, opts || {})
            });
            return read().user;
        },
        updateProfile: function (patch) {
            var email = global.FansloopAuth.getEmail();
            if (!email || !global.FLUserRegistry) return null;
            var account = global.FLUserRegistry.updateProfile(email, patch);
            if (account) activateAccount(account);
            return account;
        },
        logout: function () {
            localStorage.removeItem(KEY);
            try {
                sessionStorage.removeItem(PENDING_EMAIL);
            } catch (e) {}
            try {
                global.dispatchEvent(new CustomEvent("fansloop-auth-change", { detail: { loggedIn: false } }));
            } catch (e) {}
        },
        logoutAndGoGuest: function () {
            global.FansloopAuth.logout();
            global.location.href = "guest-home.html?logged_out=1";
        },
        guardSettings: function () {
            if (!global.FansloopAuth.isLoggedIn()) {
                global.location.href = "guest-home.html";
                return false;
            }
            return true;
        },
        ensureDemoLogin: function () {
            if (!global.FansloopAuth.isLoggedIn()) {
                global.FansloopAuth.login();
            }
        }
    };
})(typeof window !== "undefined" ? window : this);
