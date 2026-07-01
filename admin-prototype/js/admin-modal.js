/**
 * 后台成员 · 谷歌验证（TOTP）Mock
 * 创建成员时分配 googleAuthSecret；登录与敏感保存前校验验证码。
 * 生产：服务端用密钥验 TOTP；原型演示码 123456 始终通过。
 */
(function (global) {
  var LS_MEMBERS = "fl_admin_members_auth_v1";
  var LS_SESSION = "fl_admin_session_v1";
  var DEMO_CODE = "123456";

  var DEFAULT_MEMBERS = {
    wangyi: { name: "王一", email: "wangyi@fansloop.io", secret: "KRSXG5BAONSWGCTK", password: "123456a" },
    limin: { name: "李敏", email: "limin@fansloop.io", secret: "JBSWY3DPEHPK3PXP", password: "123456a" },
    chenchen: { name: "陈晨", email: "chenchen@fansloop.io", secret: "MFRGGZDFMZTWQ2LK", password: "123456a" }
  };

  function loadMembers() {
    var out = JSON.parse(JSON.stringify(DEFAULT_MEMBERS));
    try {
      var raw = localStorage.getItem(LS_MEMBERS);
      if (raw) {
        var patch = JSON.parse(raw);
        Object.keys(patch).forEach(function (k) {
          out[k] = Object.assign({}, out[k] || {}, patch[k]);
        });
      }
    } catch (e) { /* ignore */ }
    return out;
  }

  function saveMembersPatch(key, row) {
    var patch = {};
    try {
      patch = JSON.parse(localStorage.getItem(LS_MEMBERS) || "{}");
    } catch (e) { /* ignore */ }
    patch[key] = Object.assign({}, patch[key] || {}, row);
    try {
      localStorage.setItem(LS_MEMBERS, JSON.stringify(patch));
    } catch (e) { /* ignore */ }
  }

  function getMemberAuth(emailOrAccount) {
    if (!emailOrAccount) return null;
    var members = loadMembers();
    var key = String(emailOrAccount).trim();
    if (members[key] && members[key].secret) return members[key];
    var lower = key.toLowerCase();
    var accountPart = lower.indexOf("@") >= 0 ? lower.split("@")[0] : lower;
    var found = null;
    Object.keys(members).forEach(function (k) {
      var m = members[k];
      if (!m || !m.secret) return;
      if (k.toLowerCase() === lower || k.toLowerCase() === accountPart) {
        found = m;
        return;
      }
      if (m.email && String(m.email).toLowerCase() === lower) found = m;
    });
    return found;
  }

  function getCurrentAdminEmail() {
    try {
      var s = JSON.parse(localStorage.getItem(LS_SESSION) || "{}");
      if (s.email) return s.email;
      if (s.account) {
        var byAccount = getMemberAuth(s.account);
        if (byAccount && byAccount.email) return byAccount.email;
        return s.account.indexOf("@") >= 0 ? s.account : s.account + "@fansloop.io";
      }
    } catch (e) { /* ignore */ }
    return "wangyi@fansloop.io";
  }

  function generateSecret() {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    var s = "";
    for (var i = 0; i < 16; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  }

  function formatSecretBlocks(secret) {
    return String(secret || "")
      .replace(/[^A-Z2-7]/gi, "")
      .toUpperCase()
      .match(/.{1,4}/g)
      .join(" ");
  }

  function verify(code, email) {
    if (!/^\d{6}$/.test(String(code || "").trim())) {
      return { ok: false, msg: "请输入 6 位数字谷歌验证码" };
    }
    if (String(code).trim() === DEMO_CODE) {
      return { ok: true };
    }
    var auth = getMemberAuth(email || getCurrentAdminEmail());
    if (!auth || !auth.secret) {
      return { ok: false, msg: "验证码错误，请重试" };
    }
    return { ok: true, msg: "验证通过（原型：已绑定密钥即放行，生产需验 TOTP）" };
  }

  function assignMemberAuth(account, row) {
    saveMembersPatch(account, row || {});
  }

  function assignMemberSecret(email, secret, name) {
    assignMemberAuth(email, { secret: secret, name: name || email });
  }

  global.AdminGoogleAuth = {
    DEMO_CODE: DEMO_CODE,
    DEFAULT_PASSWORD: "123456a",
    loadMembers: loadMembers,
    getCurrentAdminEmail: getCurrentAdminEmail,
    generateSecret: generateSecret,
    formatSecretBlocks: formatSecretBlocks,
    verify: verify,
    assignMemberAuth: assignMemberAuth,
    assignMemberSecret: assignMemberSecret,
    getAuthForAccount: function (account) {
      return getMemberAuth(account);
    },
    getSecretForEmail: function (email) {
      var m = getMemberAuth(email);
      return m ? m.secret : null;
    },
    getMemberAuth: getMemberAuth
  };
})(typeof window !== "undefined" ? window : this);

/**
 * 全局弹窗（对齐 Ant Design Modal 交互：遮罩、Esc、右上角关闭）
 * 用法：AdminModal.open({ title, body, wide?, width?, footer?, onMount? })
 */
(function () {
  var root, titleEl, bodyEl, footEl, modalEl;

  function build() {
    root = document.getElementById("admin-fl-modal-root");
    if (root) return;
    root = document.createElement("div");
    root.id = "admin-fl-modal-root";
    root.className = "fl-modal-root";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<div class="fl-modal-mask"></div><div class="fl-modal-wrap"><div class="fl-modal" role="dialog" aria-modal="true">' +
      '<button type="button" class="fl-modal-close" aria-label="关闭">&times;</button>' +
      '<div class="fl-modal-header"></div><div class="fl-modal-body"></div><div class="fl-modal-footer"></div>' +
      "</div></div>";
    document.body.appendChild(root);
    modalEl = root.querySelector(".fl-modal");
    titleEl = root.querySelector(".fl-modal-header");
    bodyEl = root.querySelector(".fl-modal-body");
    footEl = root.querySelector(".fl-modal-footer");
    root.querySelector(".fl-modal-mask").addEventListener("click", close);
    root.querySelector(".fl-modal-close").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
  }

  function onKey(e) {
    if (e.key !== "Escape") return;
    if (root && root.classList.contains("is-open")) close();
  }

  function close() {
    if (!root) return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("fl-modal-open");
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function open(o) {
    build();
    o = o || {};
    titleEl.textContent = o.title || "提示";
    bodyEl.innerHTML = o.body != null ? o.body : "";
    modalEl.className = "fl-modal" + (o.wide ? " fl-modal-wide" : "");
    if (o.width) modalEl.style.maxWidth = o.width + "px";
    else modalEl.style.maxWidth = "";
    footEl.innerHTML = "";
    var buttons =
      o.footer && o.footer.length
        ? o.footer
        : [{ text: "关闭", primary: true, onClick: close }];
    buttons.forEach(function (f) {
      var b = document.createElement("button");
      b.type = "button";
      var cls = "ant-btn ant-btn-sm ";
      if (f.danger) cls += "ant-btn-danger";
      else if (f.primary) cls += "ant-btn-primary";
      else cls += "ant-btn";
      b.className = cls;
      b.textContent = f.text || "按钮";
      b.addEventListener("click", function (ev) {
        if (f.onClick) f.onClick(ev);
        else close();
      });
      footEl.appendChild(b);
    });
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("fl-modal-open");
    if (o.onMount)
      setTimeout(function () {
        o.onMount(bodyEl);
      }, 0);
  }

  var NOTIFY_TYPES = { success: 1, error: 1, warning: 1, info: 1 };

  function inferToastType(msg) {
    var s = String(msg || "");
    if (/失败|错误/.test(s)) return "error";
    if (/不存在|无效|须|必须|不能|请勿|^请/.test(s)) return "warning";
    if (/已|成功|通过|完成|保存|发布|删除|复制|启用|禁用|刷新|开始|应用|重置/.test(s)) {
      return "success";
    }
    return "info";
  }

  /** Ant Design Message 风格轻提示（非 Modal，不打断操作） */
  function notify(msg, type) {
    var el = document.getElementById("admin-global-notify");
    if (!el) {
      el = document.createElement("div");
      el.id = "admin-global-notify";
      el.className = "admin-global-notify";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    var cls = "admin-global-notify is-show";
    if (type === "error") cls += " is-error";
    else if (type === "success") cls += " is-success";
    else if (type === "warning") cls += " is-warning";
    else if (type === "info") cls += " is-info";
    el.className = cls;
    clearTimeout(el._notifyTimer);
    el._notifyTimer = setTimeout(function () {
      el.classList.remove("is-show");
    }, 2800);
  }

  function toast(msg, typeOrTitle) {
    var type = inferToastType(msg);
    if (typeOrTitle && NOTIFY_TYPES[typeOrTitle]) {
      type = typeOrTitle;
    } else if (typeOrTitle && typeOrTitle !== "提示") {
      type = "warning";
      msg = typeOrTitle + "：" + msg;
    }
    notify(msg, type);
  }

  function confirmGoogle(opts) {
    opts = opts || {};
    var inline = opts.inlineError !== false;
    open({
      title: opts.title || "谷歌验证",
      body:
        "<p style='margin:0 0 12px;color:rgba(0,0,0,.65)'>" +
        esc(opts.message || "敏感操作需输入谷歌验证器中的 6 位验证码以继续。") +
        "</p><label style='display:block;font-size:12px;color:rgba(0,0,0,.45);margin-bottom:6px'>谷歌验证码</label>" +
        "<input class='ant-input' id='fl-google-totp' maxlength='6' inputmode='numeric' autocomplete='one-time-code' placeholder='000000' style='max-width:220px'>" +
        (inline
          ? "<p id='fl-google-totp-err' style='margin:8px 0 0;font-size:12px;color:#ff4d4f;min-height:18px'></p>"
          : "") +
        "<p style='margin:8px 0 0;font-size:11px;color:rgba(0,0,0,.4)'>请打开 Google Authenticator 等应用查看；成员创建时已分配密钥。</p>",
      footer: [
        { text: "取消", onClick: close },
        {
          text: "确认",
          primary: true,
          onClick: function () {
            var v = document.getElementById("fl-google-totp");
            var val = v ? String(v.value).trim() : "";
            var Auth = window.AdminGoogleAuth;
            var res = Auth && Auth.verify ? Auth.verify(val) : null;
            if (!res || !res.ok) {
              var msg = (res && res.msg) || "请输入 6 位数字谷歌验证码";
              if (inline) {
                var errEl = document.getElementById("fl-google-totp-err");
                if (errEl) errEl.textContent = msg;
                if (v) {
                  v.value = "";
                  v.focus();
                  v.select();
                }
                return;
              }
              notify(msg, "warning");
              return;
            }
            close();
            if (opts.onVerified) opts.onVerified(val);
            else notify("验证通过", "success");
          }
        }
      ],
      onMount: function () {
        var i = document.getElementById("fl-google-totp");
        if (i) {
          i.focus();
          i.select();
        }
        if (opts.onMount) opts.onMount();
      }
    });
  }

  /** 绑定 .fl-modal-tabs 内 [data-fl-tab] 与 .fl-modal-tab-panel[data-fl-tab-panel] */
  function wireModalTabs(body) {
    if (!body) return;
    var bar = body.querySelector(".fl-modal-tabs");
    if (!bar) return;
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-fl-tab]");
      if (!btn) return;
      var id = btn.getAttribute("data-fl-tab");
      bar.querySelectorAll("button[data-fl-tab]").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      body.querySelectorAll(".fl-modal-tab-panel").forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-fl-tab-panel") === id);
      });
    });
  }

  window.AdminModal = {
    open: open,
    close: close,
    toast: toast,
    notify: notify,
    message: notify,
    confirmGoogle: confirmGoogle,
    wireModalTabs: wireModalTabs,
    esc: esc
  };
})();

(function () {
  if (document.querySelector('script[src*="admin-uid-link.js"]')) return;
  if (!document.querySelector('script[src*="users-list-page.js"]')) {
    document.write('<script src="js/users-list-page.js"><\/script>');
  }
  document.write('<script src="js/admin-uid-link.js"><\/script>');
})();
