/**
 * 运营后台 · 侧边栏菜单（配置 + 渲染）
 * 菜单结构变更请只改 AdminNavConfig；admin-hub 通过 flattenForHub() 同步。
 */
(function (global) {
  var GLOBAL_PARAM_PAGES = [
    {
      key: "risk-switches",
      href: "risk-switches.html",
      icon: "fa-toggle-on",
      label: "系统开关",
      desc: "功能模块总开关、维护模式等全站能力控制",
      api: "PUT /api/v1/admin/system-switches"
    },
    {
      key: "risk-usdt-limits",
      href: "risk-usdt-limits.html",
      icon: "fa-wallet",
      label: "充提限额",
      desc: "USDT 充值 / 提现单笔与单日累计上限",
      api: "PUT /api/v1/admin/asset-limits"
    },
    {
      key: "risk-limits",
      href: "risk-limits.html",
      icon: "fa-gauge-high",
      label: "积分风控",
      desc: "积分获取额度、积分冷静期（按活动类型）",
      api: "PUT /api/v1/admin/points-risk-config"
    },
    {
      key: "activities-points-tier",
      href: "activities-points-tier.html",
      icon: "fa-bolt",
      label: "积分分层",
      desc: "用户画像加成倍率与组合封顶",
      api: "PUT /api/v1/admin/points-tier-config"
    },
    {
      key: "network-fees",
      href: "network-fees.html",
      icon: "fa-percent",
      label: "手续费",
      desc: "充值 / 提现 / 链上 Gas 等费率",
      api: "PUT /api/v1/admin/fee-config"
    },
    {
      key: "risk-kyc-face",
      href: "risk-kyc-face.html",
      icon: "fa-id-card",
      label: "KYC 人脸匹配",
      desc: "身份证人脸匹配分值阈值：直接通过线 / 人工审核线",
      api: "PUT /api/v1/admin/kyc-face-match-config"
    },
    {
      key: "activities-points-types",
      href: "activities-points-types.html",
      icon: "fa-layer-group",
      label: "活动类型",
      desc: "积分活动类型 Schema 与扩展字段",
      api: "GET/PUT /api/v1/admin/points-activity-types"
    }
  ];

  var ORPHAN_PAGES = [
    { key: "activities-points-edit", parent: "activities-points-crud" },
    { key: "kyc-detail", parent: "kyc-manage" }
  ];

  var BLOCKS = [
    {
      title: "总览",
      items: [
        { key: "dashboard", href: "dashboard.html", icon: "fa-chart-line", label: "首页仪表盘" }
      ]
    },
    {
      title: "全局参数",
      items: [
        { key: "settings-global", href: "settings-global.html", icon: "fa-sliders", label: "参数总览" }
      ]
    },
    {
      title: "系统设置",
      items: [
        { key: "settings-roles", href: "settings-roles.html", icon: "fa-user-shield", label: "角色管理" },
        { key: "settings-members", href: "settings-members.html", icon: "fa-users-gear", label: "成员账号" },
        { key: "settings-operation-logs", href: "settings-operation-logs.html", icon: "fa-clipboard-list", label: "操作日志" }
      ]
    },
    {
      title: "用户与资产",
      items: [
        { key: "users-list", href: "users-list.html", icon: "fa-address-book", label: "用户列表" },
        { key: "users-assets", href: "users-assets.html", icon: "fa-coins", label: "用户资产" },
        { key: "users-ledger", href: "users-ledger.html", icon: "fa-receipt", label: "账变记录" },
        { key: "users-address-book", href: "users-address-book.html", icon: "fa-wallet", label: "地址簿" },
        { key: "kyc-manage", href: "kyc-manage.html", icon: "fa-id-card", label: "KYC 审核记录" }
      ]
    },
    {
      title: "订单",
      items: [
        { key: "orders-recharge", href: "orders-recharge.html", icon: "fa-arrow-down", label: "充值订单" },
        { key: "orders-withdraw", href: "orders-withdraw.html", icon: "fa-arrow-up", label: "提现订单" },
        { key: "export-tasks", href: "export-tasks.html", icon: "fa-list-check", label: "导出任务列表" }
      ]
    },
    {
      title: "积分运营",
      items: [
        { key: "activities-points-crud", href: "activities-points-crud.html", icon: "fa-table-list", label: "积分活动" },
        { key: "activities-points-monitor", href: "activities-points-monitor.html", icon: "fa-chart-pie", label: "发放监控" },
        { key: "activities-points-reward", href: "activities-points-reward.html", icon: "fa-gift", label: "奖励流水" },
        { key: "activities-points-consume", href: "activities-points-consume.html", icon: "fa-fire", label: "消耗流水" },
        { key: "activities-redeem", href: "activities-redeem.html", icon: "fa-arrow-right-arrow-left", label: "兑换记录" }
      ]
    },
    {
      title: "订阅",
      items: [
        { key: "subscriptions", href: "subscriptions.html", icon: "fa-bell", label: "订阅管理" }
      ]
    },
    {
      title: "风控安全",
      items: [
        { key: "risk-usdt-limits", href: "risk-usdt-limits.html", icon: "fa-wallet", label: "充提限额" },
        { key: "risk-limits", href: "risk-limits.html", icon: "fa-gauge-high", label: "积分风控" },
        { key: "risk-whitelist", href: "risk-whitelist.html", icon: "fa-shield-halved", label: "会员白名单" },
        { key: "risk-sensitive-words", href: "risk-sensitive-words.html", icon: "fa-comment-slash", label: "敏感词管理" },
        { key: "risk-sensitive-risk", href: "risk-sensitive-risk.html", icon: "fa-shield-virus", label: "敏感词风控管理" },
        { key: "risk-captcha-records", href: "risk-captcha-records.html", icon: "fa-key", label: "验证码记录" }
      ]
    },
    {
      title: "内容与运营",
      items: [
        { key: "content-review", href: "content-review.html", icon: "fa-eye", label: "内容审核" },
        { key: "system-announcements", href: "system-announcements.html", icon: "fa-bullhorn", label: "系统公告" },
        { key: "reports", href: "reports.html", icon: "fa-table", label: "报表统计" }
      ]
    }
  ];

  function isSidebarKey(key) {
    return BLOCKS.some(function (b) {
      return b.items.some(function (it) { return it.key === key; });
    });
  }

  function resolveActiveKey(pageKey) {
    if (!pageKey) return "";
    if (isSidebarKey(pageKey)) return pageKey;
    var orphan = ORPHAN_PAGES.filter(function (o) { return o.key === pageKey; })[0];
    if (orphan) return orphan.parent;
    if (GLOBAL_PARAM_PAGES.some(function (p) { return p.key === pageKey; })) {
      return "settings-global";
    }
    return pageKey;
  }

  function flattenForHub() {
    var out = [];
    BLOCKS.forEach(function (b) {
      b.items.forEach(function (it) {
        out.push({ group: b.title, title: it.label, file: it.href });
      });
    });
    GLOBAL_PARAM_PAGES.forEach(function (p) {
      if (isSidebarKey(p.key)) return;
      out.push({ group: "全局参数", title: p.label, file: p.href });
    });
    return out;
  }

  function isGlobalParamPage(key) {
    return key === "settings-global" || GLOBAL_PARAM_PAGES.some(function (p) { return p.key === key; });
  }

  global.AdminNavConfig = {
    blocks: BLOCKS,
    globalParamPages: GLOBAL_PARAM_PAGES,
    orphanPages: ORPHAN_PAGES,
    resolveActiveKey: resolveActiveKey,
    flattenForHub: flattenForHub,
    isGlobalParamPage: isGlobalParamPage,
    settingsGlobalHref: "settings-global.html"
  };
})(typeof window !== "undefined" ? window : this);

(function () {
  var CFG = window.AdminNavConfig;
  if (!CFG) return;

  var SCROLL_KEY = "fl_admin_sider_scroll_v1";
  var pageKey = document.body.getAttribute("data-admin-page") || "";
  var activeKey = CFG.resolveActiveKey(pageKey);
  var root = document.getElementById("adminSider");
  if (!root) return;

  function saveSiderScroll() {
    var menu = root.querySelector(".admin-menu");
    if (!menu) return;
    try {
      sessionStorage.setItem(SCROLL_KEY, String(menu.scrollTop));
    } catch (e) { /* ignore */ }
  }

  function restoreSiderScroll() {
    var menu = root.querySelector(".admin-menu");
    if (!menu) return;
    try {
      var raw = sessionStorage.getItem(SCROLL_KEY);
      if (raw != null) menu.scrollTop = parseInt(raw, 10) || 0;
    } catch (e) { /* ignore */ }
  }

  function bindSiderScroll(menu) {
    var ticking = false;
    menu.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          saveSiderScroll();
          ticking = false;
        });
      },
      { passive: true }
    );
    menu.querySelectorAll("a[href]").forEach(function (a) {
      a.addEventListener("click", saveSiderScroll);
    });
  }

  window.addEventListener("pagehide", saveSiderScroll);

  var html = [];
  html.push('<div class="admin-sider-logo">');
  html.push('<img src="https://images.unsplash.com/photo-1557683316-973673baf926?w=64&h=64&fit=crop" alt="">');
  html.push("<span>FansLoop 运营后台</span></div>");
  html.push('<nav class="admin-menu">');

  CFG.blocks.forEach(function (b) {
    html.push('<div class="admin-menu-group">' + b.title + "</div>");
    b.items.forEach(function (it) {
      var cls = it.key === activeKey ? "active" : "";
      html.push(
        '<a class="' +
          cls +
          '" href="' +
          it.href +
          '"><i class="fa-solid ' +
          it.icon +
          '"></i> ' +
          it.label +
          "</a>"
      );
    });
  });

  html.push("</nav>");
  root.innerHTML = html.join("");

  var menu = root.querySelector(".admin-menu");
  if (menu) {
    restoreSiderScroll();
    bindSiderScroll(menu);
  }
})();

(function () {
  var CFG = window.AdminNavConfig;
  if (!CFG || !CFG.isGlobalParamPage) return;

  var NAV_FROM_KEY = "fl_admin_nav_from_v1";
  var pageKey = document.body.getAttribute("data-admin-page") || "";
  if (pageKey === "settings-global" || !CFG.isGlobalParamPage(pageKey)) return;

  var headerLeft = document.querySelector(".admin-header-left");
  if (!headerLeft || headerLeft.querySelector(".admin-header-back")) return;

  function resolveBackHref() {
    try {
      if (sessionStorage.getItem(NAV_FROM_KEY) === "settings-global") {
        return CFG.settingsGlobalHref;
      }
    } catch (e) { /* ignore */ }
    if (document.referrer && document.referrer.indexOf("settings-global") >= 0) {
      return CFG.settingsGlobalHref;
    }
    return null;
  }

  var back = document.createElement("a");
  back.className = "admin-header-back";
  back.href = resolveBackHref() || CFG.settingsGlobalHref;
  back.setAttribute("aria-label", "返回参数总览");
  back.innerHTML = '<i class="fa-solid fa-arrow-left"></i><span>返回参数总览</span>';
  back.addEventListener("click", function (e) {
    var href = resolveBackHref();
    if (href) {
      e.preventDefault();
      location.href = href;
      return;
    }
    if (window.history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });
  headerLeft.insertBefore(back, headerLeft.firstChild);

  var sep = document.createElement("span");
  sep.className = "admin-header-crumb-sep";
  sep.textContent = "/";
  headerLeft.insertBefore(sep, back.nextSibling);

  document.querySelectorAll('.admin-header-right a[href="settings-global.html"]').forEach(function (el) {
    if (/参数总览/.test(el.textContent)) el.remove();
  });
})();

(function () {
  if (window.AdminPager) return;
  if (document.querySelector('script[src*="admin-pagination.js"]')) return;
  document.write('<script src="js/admin-pagination.js"><\/script>');
})();

(function () {
  if (window.AdminExport) return;
  if (document.querySelector('script[src*="admin-export-tasks.js"]')) return;
  document.write('<script src="js/admin-export-tasks.js"><\/script>');
})();
