/**
 * FansLoop Web 原型 · 登录会话（游客 / 已登录）
 */
(function (global) {
    var KEY = "fansloop_auth";

    var DEFAULT_USER = {
        name: "Luna 🌙",
        email: "luna@fansloop.io",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"
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

    global.FansloopAuth = {
        KEY: KEY,
        isLoggedIn: function () {
            return read().loggedIn;
        },
        getUser: function () {
            return read().user;
        },
        login: function (user) {
            write({
                loggedIn: true,
                user: Object.assign({}, DEFAULT_USER, user || {})
            });
        },
        logout: function () {
            localStorage.removeItem(KEY);
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
        /** 原型：进入设置区时默认视为已登录（便于演示） */
        ensureDemoLogin: function () {
            if (!global.FansloopAuth.isLoggedIn()) {
                global.FansloopAuth.login();
            }
        }
    };
})(typeof window !== "undefined" ? window : this);
