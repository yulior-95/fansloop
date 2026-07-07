/**
 * 全局系统开关
 */
(function () {
  var M = window.AdminModal;
  if (!M) return;

  var tbody = document.getElementById("rswTbody");
  var filterName = document.getElementById("rswFilterName");
  var filterKey = document.getElementById("rswFilterKey");
  var pagerMount = document.getElementById("rswPager");
  var pager = null;

  var rows = [
    {
      key: "system.maintenance",
      name: "全站维护模式",
      desc: "关闭后全站只读：禁止充提/发布/支付等写操作，顶部展示维护公告",
      enabled: false
    },
    {
      key: "feature.asset.recharge",
      name: "链上充值",
      desc: "关闭后禁止新建 USDT 等链上充值订单；充值入口置灰",
      enabled: true
    },
    {
      key: "feature.asset.recharge.fiat",
      name: "法币充值",
      desc: "关闭后禁止 MoonPay 等法币通道下单；链上充值不受影响",
      enabled: true
    },
    {
      key: "feature.asset.withdraw",
      name: "USDT 提现",
      desc: "关闭后禁止新建提现单；进行中的订单按冷静期策略处理",
      enabled: true
    },
    {
      key: "feature.auth.registration",
      name: "新用户注册",
      desc: "关闭后禁止邮箱/钱包新注册；已有用户可正常登录",
      enabled: true
    },
    {
      key: "feature.kyc.submission",
      name: "KYC 新提交",
      desc: "关闭后暂停新实名认证提交；已认证用户不受影响",
      enabled: true
    },
    {
      key: "feature.subscription.purchase",
      name: "付费订阅",
      desc: "关闭后禁止新订阅/升级/自动续订扣款",
      enabled: true
    },
    {
      key: "feature.tip.gift",
      name: "打赏送礼",
      desc: "关闭后禁止 Feed/直播/私信送礼与打赏确认",
      enabled: true
    },
    {
      key: "feature.invite.referral",
      name: "邀请拉新",
      desc: "关闭后禁止新邀请码绑定与奖励入账；已有关联只读",
      enabled: true
    },
    {
      key: "feature.content.ppv",
      name: "付费内容解锁",
      desc: "关闭后禁止按篇购买付费帖/视频；订阅内容不受影响",
      enabled: true
    },
    {
      key: "feature.live.paid",
      name: "付费直播",
      desc: "关闭后禁止付费直播购票与观看门禁",
      enabled: true
    },
    {
      key: "feature.content.publish",
      name: "内容发布",
      desc: "关闭后禁止新发布/编辑提交；草稿与已发布内容可读",
      enabled: true
    },
    {
      key: "feature.live.broadcast",
      name: "直播开播",
      desc: "关闭后禁止新建直播/预告/OBS 推流；观看侧可单独保留",
      enabled: true
    },
    {
      key: "feature.im.messaging",
      name: "即时通讯",
      desc: "关闭后禁止发消息/建群/群发；历史消息可读",
      enabled: true
    },
    {
      key: "feature.points.earn",
      name: "积分获取",
      desc: "关闭后停止任务/签到/互动等积分发放；商城兑换由积分商城开关控制",
      enabled: true
    },
    {
      key: "feature.points.mall",
      name: "积分商城",
      desc: "关闭后隐藏商城入口并禁止积分兑换",
      enabled: true
    }
  ];

  var filters = { name: "", key: "" };

  function esc(s) {
    return M.esc(s == null ? "" : String(s));
  }

  function switchHtml(key, enabled) {
    var on = !!enabled;
    return (
      '<button type="button" role="switch" class="ant-switch ant-switch-small rsw-switch' +
      (on ? " ant-switch-checked" : "") +
      '" data-key="' + esc(key) + '" aria-checked="' + (on ? "true" : "false") + '">' +
      '<div class="ant-switch-handle"></div>' +
      '<span class="ant-switch-inner">' +
      '<span class="ant-switch-inner-checked">开启</span>' +
      '<span class="ant-switch-inner-unchecked">关闭</span>' +
      "</span></button>"
    );
  }

  function filteredRows() {
    var nameQ = filters.name.toLowerCase();
    var keyQ = filters.key.toLowerCase();
    return rows.filter(function (row) {
      if (nameQ && String(row.name || "").toLowerCase().indexOf(nameQ) < 0) return false;
      if (keyQ && String(row.key || "").toLowerCase().indexOf(keyQ) < 0) return false;
      return true;
    });
  }

  function renderTable() {
    if (!tbody) return;
    var list = filteredRows();
    if (pager) pager.setTotal(list.length);
    var pageList = pager ? pager.getSlice(list) : list;
    var offset = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
    if (!pageList.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无匹配数据</td></tr>';
      return;
    }
    tbody.innerHTML = pageList
      .map(function (row, i) {
        return (
          '<tr data-key="' + esc(row.key) + '">' +
          "<td>" + (offset + i + 1) + "</td>" +
          "<td>" + esc(row.name) + "</td>" +
          "<td><code>" + esc(row.key) + "</code></td>" +
          "<td>" + esc(row.desc) + "</td>" +
          "<td>" + switchHtml(row.key, row.enabled) + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function applyFilters() {
    filters.name = ((filterName && filterName.value) || "").trim();
    filters.key = ((filterKey && filterKey.value) || "").trim();
    if (pager) pager.resetPage();
    renderTable();
  }

  function resetFilters() {
    filters = { name: "", key: "" };
    if (pager) pager.resetPage();
    renderTable();
  }

  if (tbody) {
    tbody.addEventListener("click", function (e) {
      var sw = e.target.closest(".rsw-switch");
      if (!sw) return;
      e.preventDefault();
      var key = sw.getAttribute("data-key");
      var row = rows.find(function (r) {
        return r.key === key;
      });
      if (!row) return;
      var nextOn = !row.enabled;
      M.confirmGoogle({
        title: nextOn ? "开启系统开关" : "关闭系统开关",
        message:
          (nextOn ? "即将开启「" : "即将关闭「") +
          row.name +
          "」（" +
          row.key +
          "），变更将即时影响线上能力。请输入当前登录账号的谷歌验证码确认。",
        onVerified: function () {
          row.enabled = nextOn;
          M.toast((nextOn ? "已开启：" : "已关闭：") + row.name);
          renderTable();
        }
      });
    });
  }

  var FT = window.AdminFilterToolbar;
  if (FT) {
    FT.onQuery("rswSearch", applyFilters);
    FT.onReset("rswReset", resetFilters);
  }

  if (pagerMount && window.AdminPager) {
    pager = window.AdminPager.create({
      mount: pagerMount,
      pageSize: 10,
      onChange: function () {
        renderTable();
      }
    });
  }

  renderTable();
})();
