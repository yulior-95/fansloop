(function () {
  var active = document.body.getAttribute("data-admin-page") || "";

  var blocks = [
    {
      title: "总览",
      items: [
        { key: "dashboard", href: "dashboard.html", icon: "fa-chart-line", label: "首页仪表盘" }
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
        { key: "users-bank-cards", href: "users-bank-cards.html", icon: "fa-credit-card", label: "银行卡" },
        { key: "kyc-manage", href: "kyc-manage.html", icon: "fa-id-card", label: "KYC 管理" }
      ]
    },
    {
      title: "订单 / 活动 / 订阅",
      items: [
        { key: "orders-recharge", href: "orders-recharge.html", icon: "fa-arrow-down", label: "充值订单" },
        { key: "orders-withdraw", href: "orders-withdraw.html", icon: "fa-arrow-up", label: "提现订单" },
        { key: "activities-points-crud", href: "activities-points-crud.html", icon: "fa-table-list", label: "积分活动管理" },
        { key: "activities-points-edit", href: "activities-points-edit.html", icon: "fa-pen-to-square", label: "新建/编辑活动" },
        { key: "activities-points-types", href: "activities-points-types.html", icon: "fa-layer-group", label: "活动类型" },
        { key: "activities-points-tier", href: "activities-points-tier.html", icon: "fa-bolt", label: "积分分层配置" },
        { key: "activities-points-monitor", href: "activities-points-monitor.html", icon: "fa-chart-pie", label: "积分发放监控" },
        { key: "activities-points-reward", href: "activities-points-reward.html", icon: "fa-gift", label: "积分奖励流水" },
        { key: "activities-points-consume", href: "activities-points-consume.html", icon: "fa-fire", label: "积分消耗流水" },
        { key: "activities-config", href: "activities-config.html", icon: "fa-sliders", label: "活动配置（旧）" },
        { key: "activities-redeem", href: "activities-redeem.html", icon: "fa-arrow-right-arrow-left", label: "积分兑换" },
        { key: "subscriptions", href: "subscriptions.html", icon: "fa-bell", label: "订阅管理" }
      ]
    },
    {
      title: "风控 / 内容 / 配置",
      items: [
        { key: "risk-whitelist", href: "risk-whitelist.html", icon: "fa-shield-halved", label: "会员白名单" },
        { key: "risk-switches", href: "risk-switches.html", icon: "fa-toggle-on", label: "全局开关" },
        { key: "risk-limits", href: "risk-limits.html", icon: "fa-gauge-high", label: "限额风控" },
        { key: "risk-sensitive-words", href: "risk-sensitive-words.html", icon: "fa-comment-slash", label: "敏感词" },
        { key: "risk-captcha-records", href: "risk-captcha-records.html", icon: "fa-key", label: "验证码记录" },
        { key: "risk-abnormal-speech", href: "risk-abnormal-speech.html", icon: "fa-triangle-exclamation", label: "异常发言" },
        { key: "content-review", href: "content-review.html", icon: "fa-eye", label: "内容审核" },
        { key: "network-fees", href: "network-fees.html", icon: "fa-percent", label: "手续费" },
        { key: "system-announcements", href: "system-announcements.html", icon: "fa-bullhorn", label: "系统公告" },
        { key: "reports", href: "reports.html", icon: "fa-table", label: "报表统计" }
      ]
    }
  ];

  var root = document.getElementById("adminSider");
  if (!root) return;

  var html = [];
  html.push('<div class="admin-sider-logo">');
  html.push('<img src="https://images.unsplash.com/photo-1557683316-973673baf926?w=64&h=64&fit=crop" alt="">');
  html.push("<span>FansLoop 运营后台</span></div>");
  html.push('<nav class="admin-menu">');

  blocks.forEach(function (b) {
    html.push('<div class="admin-menu-group">' + b.title + "</div>");
    b.items.forEach(function (it) {
      var cls = it.key === active ? "active" : "";
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
})();
