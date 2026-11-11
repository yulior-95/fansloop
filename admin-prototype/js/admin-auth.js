/**
 * 运营后台 · 登录 / 会话 / 退出
 * 账号密码 + 谷歌验证码；会话存 localStorage fl_admin_session_v1
 */
(function (global) {
  var LS_SESSION = "fl_admin_session_v1";

  var ACCOUNT_ROLES = {
    wangyi: "ROLE_OPS",
    limin: "ROLE_RISK",
    chenchen: "ROLE_ROOT"
  };

  var AVATARS = {
    wangyi: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    limin: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    chenchen: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face"
  };

  function isLoginPage() {
    var page = document.body && document.body.getAttribute("data-admin-page");
    if (page === "login") return true;
    var path = (location.pathname || "").toLowerCase();
    return /login(\.html)?$/i.test(path) || /\/login\/?$/.test(path);
  }

  function getSession() {
    try {
      var raw = localStorage.getItem(LS_SESSION);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.account) return null;
      return s;
    } catch (e) {
      return null;
    }
  }

  function resolveAccountKey(input, members) {
    var key = String(input || "").trim();
    if (!key) return "";
    if (members[key]) return key;
    var lower = key.toLowerCase();
    var part = lower.indexOf("@") >= 0 ? lower.split("@")[0] : lower;
    var found = "";
    Object.keys(members).forEach(function (k) {
      if (found) return;
      var m = members[k];
      if (k.toLowerCase() === lower || k.toLowerCase() === part) found = k;
      else if (m && m.email && String(m.email).toLowerCase() === lower) found = k;
    });
    return found;
  }

  function login(account, password, totp) {
    var Auth = global.AdminGoogleAuth;
    if (!Auth) return { ok: false, msg: "系统未就绪，请刷新页面" };
    var members = Auth.loadMembers();
    var accountKey = resolveAccountKey(account, members);
    if (!accountKey) return { ok: false, msg: "账号或密码错误" };
    var member = members[accountKey];
    var pwd = (member && member.password) || Auth.DEFAULT_PASSWORD;
    if (String(password || "") !== pwd) return { ok: false, msg: "账号或密码错误" };
    var email = member.email || accountKey + "@goodfans.io";
    var v = Auth.verify(totp, email);
    if (!v || !v.ok) return { ok: false, msg: (v && v.msg) || "谷歌验证码错误" };

    var session = {
      account: accountKey,
      email: email,
      name: member.name || accountKey,
      loginAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(LS_SESSION, JSON.stringify(session));
    } catch (e) {
      return { ok: false, msg: "无法写入会话" };
    }

    if (global.FLAdminSession && typeof global.FLAdminSession.setRole === "function") {
      try {
        global.FLAdminSession.setRole(ACCOUNT_ROLES[accountKey] || "ROLE_OPS");
      } catch (e) { /* 角色表缺项时不阻断登录 */ }
    }
    return { ok: true, session: session };
  }

  function logout() {
    try {
      localStorage.removeItem(LS_SESSION);
    } catch (e) { /* ignore */ }
    location.href = "login.html";
  }

  function ensurePrototypeSession() {
    if (getSession()) return true;
    var fallback = {
      account: "chenchen",
      email: "chenchen@goodfans.io",
      name: "陈晨",
      loginAt: new Date().toISOString(),
      prototype: true
    };
    try {
      localStorage.setItem(LS_SESSION, JSON.stringify(fallback));
    } catch (e) {
      return false;
    }
    return true;
  }

  function requireAuth() {
    if (isLoginPage()) return true;
    if (!document.querySelector(".admin-app")) return true;
    if (getSession()) return true;
    if (ensurePrototypeSession()) return true;
    var redirect = location.pathname.split("/").pop() + location.search;
    location.href = "login.html?redirect=" + encodeURIComponent(redirect || "dashboard.html");
    return false;
  }

  function syncHeaderUser() {
    var session = getSession();
    if (!session) return;
    var userEl = document.querySelector(".admin-header-user");
    if (!userEl) return;
    var img = userEl.querySelector("img");
    var span = userEl.querySelector("span");
    if (img && AVATARS[session.account]) img.src = AVATARS[session.account];
    var roleLabel = global.FLAdminSession && global.FLAdminSession.roleLabel
      ? global.FLAdminSession.roleLabel()
      : "";
    var text = session.name || session.account;
    if (roleLabel) text += " · " + roleLabel;
    if (span) span.textContent = text;
  }

  function mountHeaderChrome() {
    if (isLoginPage() || !document.querySelector(".admin-app")) return;
    var right = document.querySelector(".admin-header-right");
    if (!right || right.dataset.adminAuthMounted) return;
    right.dataset.adminAuthMounted = "1";

    var userEl = right.querySelector(".admin-header-user");

    if (!right.querySelector("#adminBell") && !right.querySelector("#dashBell")) {
      var bell = document.createElement("button");
      bell.type = "button";
      bell.className = "ant-btn ant-btn-text ant-btn-sm admin-bell-btn";
      bell.id = "adminBell";
      bell.title = "系统通知";
      bell.setAttribute("aria-label", "系统通知");
      bell.innerHTML = '<i class="fa-regular fa-bell"></i><span class="admin-bell-badge" hidden>0</span>';
      right.insertBefore(bell, userEl || null);
    }

    if (!right.querySelector("#adminLogout")) {
      var logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.className = "ant-btn ant-btn-text ant-btn-sm";
      logoutBtn.id = "adminLogout";
      logoutBtn.title = "退出登录";
      logoutBtn.setAttribute("aria-label", "退出登录");
      logoutBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i>';
      logoutBtn.addEventListener("click", function () {
        if (global.AdminTodos && global.AdminTodos.closePanel) global.AdminTodos.closePanel();
        logout();
      });
      right.insertBefore(logoutBtn, userEl || null);
    }

    syncHeaderUser();
    if (global.AdminTodos && global.AdminTodos.boot) global.AdminTodos.boot();
  }

  function bindLoginForm() {
    if (!isLoginPage()) return;
    var form = document.getElementById("adminLoginForm");
    if (!form || form.dataset.bound) return;
    form.dataset.bound = "1";
    form.setAttribute("novalidate", "novalidate");
    var errEl = document.getElementById("adminLoginErr");
    var btn = document.getElementById("adminLoginSubmit");

    function showErr(msg) {
      if (errEl) {
        errEl.textContent = msg || "登录失败";
        errEl.classList.add("is-show");
        errEl.style.display = "block";
      }
    }

    function submitLogin(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      var account = document.getElementById("loginAccount");
      var password = document.getElementById("loginPassword");
      var totp = document.getElementById("loginTotp");
      var res;
      try {
        res = login(
          account ? account.value : "",
          password ? password.value : "",
          totp ? totp.value : ""
        );
      } catch (err) {
        showErr("登录脚本异常，请刷新后重试");
        return false;
      }
      if (!res || !res.ok) {
        showErr((res && res.msg) || "登录失败");
        if (totp) {
          totp.value = "";
          totp.focus();
        }
        return false;
      }
      if (errEl) {
        errEl.classList.remove("is-show");
        errEl.style.display = "none";
      }
      var params = new URLSearchParams(location.search);
      var to = params.get("redirect") || "dashboard.html";
      if (!/\.html$/i.test(to)) to = "dashboard.html";
      try {
        location.href = new URL(to, location.href).href;
      } catch (err2) {
        location.href = to;
      }
      return false;
    }

    form.addEventListener("submit", submitLogin);
    if (btn) {
      btn.addEventListener("click", submitLogin);
    }
  }

  global.AdminAuth = {
    LS_SESSION: LS_SESSION,
    getSession: getSession,
    login: login,
    logout: logout,
    requireAuth: requireAuth,
    syncHeaderUser: syncHeaderUser,
    mountHeaderChrome: mountHeaderChrome,
    isLoginPage: isLoginPage
  };

  if (typeof document !== "undefined") {
    if (!isLoginPage()) requireAuth();
    bindLoginForm();
    function onReady() {
      mountHeaderChrome();
      bindLoginForm();
      syncHeaderUser();
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onReady);
    } else {
      onReady();
    }
  }
})(typeof window !== "undefined" ? window : this);
