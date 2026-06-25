/**
 * 订阅管理 · 每条列表记录为一次订阅订单（首订/续约各一条）
 */
(function () {
  var M = window.AdminModal;
  if (!M) return;

  var tbody = document.getElementById("subTbody");
  var pagerMount = document.getElementById("subPager");
  var filterUserUid = document.getElementById("subFilterUserUid");
  var filterCreatorUid = document.getElementById("subFilterCreatorUid");
  var filterStatus = document.getElementById("subFilterStatus");
  var filterRemainMin = document.getElementById("subFilterRemainMin");
  var filterRemainMax = document.getElementById("subFilterRemainMax");
  var pager = null;

  var ROWS = [
    {
      id: "sub_001",
      orderNo: "SUB20260501001",
      orderType: "续约",
      userUid: "882910",
      userNickname: "小岛日和",
      creatorUid: "440012",
      creatorNickname: "花漾Hana",
      plan: "月度",
      subscribeTime: "2026-05-01 10:30:15",
      endTime: "2026-06-05 11:20:00",
      remainDays: 0,
      remainDaysAtCancel: 21,
      autoRenew: false,
      status: "已取消",
      replacedByOrderNo: "SUB20260605002",
      cancelReason: "升购年度套餐，本订单提前终止",
      upgradeDeductAmount: 19.6,
      upgradeDeductCurrency: "USDT"
    },
    {
      id: "sub_006",
      orderNo: "SUB20260605002",
      orderType: "升购",
      userUid: "882910",
      userNickname: "小岛日和",
      creatorUid: "440012",
      creatorNickname: "花漾Hana",
      plan: "年度",
      subscribeTime: "2026-06-05 11:20:00",
      endTime: "2027-06-05 11:20:00",
      remainDays: 346,
      autoRenew: true,
      status: "生效中",
      relatedOrderNo: "SUB20260501001",
      upgradeCreditDays: 21,
      upgradeCreditAmount: 19.6,
      upgradeCreditCurrency: "USDT"
    },
    {
      id: "sub_002",
      orderNo: "SUB20260315003",
      orderType: "首订",
      userUid: "661204",
      userNickname: "陈静",
      creatorUid: "440012",
      creatorNickname: "花漾Hana",
      plan: "年度",
      subscribeTime: "2026-03-15 09:00:00",
      endTime: "2027-03-15 09:00:00",
      remainDays: 264,
      autoRenew: true,
      status: "生效中"
    },
    {
      id: "sub_003",
      orderNo: "SUB20260210002",
      orderType: "续约",
      userUid: "102938",
      userNickname: "Alex Chen",
      creatorUid: "330801",
      creatorNickname: "Alex Studio",
      plan: "季度",
      subscribeTime: "2026-02-10 14:18:42",
      endTime: "2026-05-10 14:18:42",
      remainDays: 0,
      autoRenew: false,
      status: "已过期"
    },
    {
      id: "sub_004",
      orderNo: "SUB20260401001",
      orderType: "首订",
      userUid: "882910",
      userNickname: "小岛日和",
      creatorUid: "440012",
      creatorNickname: "花漾Hana",
      plan: "月度",
      subscribeTime: "2026-04-01 10:30:15",
      endTime: "2026-05-01 10:30:15",
      remainDays: 0,
      autoRenew: true,
      status: "已过期"
    },
    {
      id: "sub_005",
      orderNo: "SUB20251110001",
      orderType: "首订",
      userUid: "102938",
      userNickname: "Alex Chen",
      creatorUid: "330801",
      creatorNickname: "Alex Studio",
      plan: "季度",
      subscribeTime: "2025-11-10 14:18:42",
      endTime: "2026-02-10 14:18:42",
      remainDays: 0,
      autoRenew: true,
      status: "已过期"
    }
  ];

  function esc(s) {
    return M.esc(s == null ? "" : String(s));
  }

  function uidCell(uid) {
    return (
      '<span class="js-uid-link" data-uid="' + esc(uid) + '">' + esc(uid) + "</span>"
    );
  }

  function fmtMoney(n) {
    if (n == null || !isFinite(Number(n))) return "—";
    return Number(n).toFixed(2);
  }

  function isUpgradeCancelled(row) {
    return row.status === "已取消" && (row.replacedByOrderNo || row.upgradeDeductAmount != null);
  }

  function remainTag(row) {
    if (isUpgradeCancelled(row)) {
      return '<span class="ant-tag">已取消</span>';
    }
    if (row.status === "已取消") {
      return '<span class="ant-tag">已取消</span>';
    }
    if (row.status === "已过期" || row.remainDays <= 0) {
      return '<span class="ant-tag ant-tag-red">已到期</span>';
    }
    return (
      '<span class="ant-tag ant-tag-green">' + esc(String(row.remainDays)) + " 天</span>"
    );
  }

  function remarkText(row) {
    if (isUpgradeCancelled(row)) {
      var days = row.remainDaysAtCancel != null ? row.remainDaysAtCancel : row.remainDays;
      var amt = fmtMoney(row.upgradeDeductAmount);
      var cur = row.upgradeDeductCurrency || "USDT";
      var rep = row.replacedByOrderNo ? "，抵扣计入 " + row.replacedByOrderNo : "";
      return "升购系统自动取消；剩余 " + days + " 天，折算抵扣 " + amt + " " + cur + rep;
    }
    if (row.orderType === "升购" && row.upgradeCreditAmount != null) {
      return (
        "含原订单剩余 " +
        row.upgradeCreditDays +
        " 天折算抵扣 " +
        fmtMoney(row.upgradeCreditAmount) +
        " " +
        (row.upgradeCreditCurrency || "USDT")
      );
    }
    return "—";
  }

  function remarkCell(row) {
    var text = remarkText(row);
    if (text === "—") return "—";
    return '<span class="sub-remark-cell" title="' + esc(text) + '">' + text + "</span>";
  }

  function statusTag(st) {
    if (st === "生效中") return '<span class="ant-tag ant-tag-green">生效中</span>';
    if (st === "已过期") return '<span class="ant-tag ant-tag-red">已过期</span>';
    if (st === "已取消") return '<span class="ant-tag">已取消</span>';
    return '<span class="ant-tag">' + esc(st) + "</span>";
  }

  function autoRenewText(on) {
    return on ? "是" : "否";
  }

  function autoRenewTag(on) {
    if (on) return '<span class="ant-tag ant-tag-blue">是</span>';
    return '<span class="ant-tag">否</span>';
  }

  function sortBySubscribeDesc(list) {
    return list.slice().sort(function (a, b) {
      return String(b.subscribeTime).localeCompare(String(a.subscribeTime));
    });
  }

  function getEffectiveRemainDays(row) {
    if (isUpgradeCancelled(row) && row.remainDaysAtCancel != null) {
      return Number(row.remainDaysAtCancel) || 0;
    }
    return Number(row.remainDays) || 0;
  }

  function parseRemainFilter(val) {
    var s = String(val == null ? "" : val).trim();
    if (!s) return null;
    var n = parseInt(s, 10);
    return isNaN(n) ? null : Math.max(0, n);
  }

  function remainDaysFilterLabel() {
    var min = filterRemainMin ? parseRemainFilter(filterRemainMin.value) : null;
    var max = filterRemainMax ? parseRemainFilter(filterRemainMax.value) : null;
    if (min == null && max == null) return "";
    if (min != null && max != null) return min + " — " + max + " 天";
    if (min != null) return "≥ " + min + " 天";
    return "≤ " + max + " 天";
  }

  function resetFilters() {
    if (filterUserUid) filterUserUid.value = "";
    if (filterCreatorUid) filterCreatorUid.value = "";
    if (filterStatus) filterStatus.value = "";
    if (filterRemainMin) filterRemainMin.value = "";
    if (filterRemainMax) filterRemainMax.value = "";
  }

  function getFiltered() {
    var userUid = filterUserUid ? String(filterUserUid.value || "").trim() : "";
    var creatorUid = filterCreatorUid ? String(filterCreatorUid.value || "").trim() : "";
    var st = filterStatus ? String(filterStatus.value || "").trim() : "";
    var minDays = filterRemainMin ? parseRemainFilter(filterRemainMin.value) : null;
    var maxDays = filterRemainMax ? parseRemainFilter(filterRemainMax.value) : null;

    return sortBySubscribeDesc(
      ROWS.filter(function (r) {
        if (userUid && String(r.userUid).indexOf(userUid) < 0) return false;
        if (creatorUid && String(r.creatorUid).indexOf(creatorUid) < 0) return false;
        if (st && r.status !== st) return false;
        var days = getEffectiveRemainDays(r);
        if (minDays != null && days < minDays) return false;
        if (maxDays != null && days > maxDays) return false;
        return true;
      })
    );
  }

  function findRow(id) {
    return ROWS.filter(function (r) {
      return r.id === id;
    })[0];
  }

  function getRelationOrders(row) {
    return sortBySubscribeDesc(
      ROWS.filter(function (r) {
        return r.userUid === row.userUid && r.creatorUid === row.creatorUid;
      })
    );
  }

  function kvTable(r, fields) {
    var rows = fields.map(function (f) {
      return (
        "<tr><th>" +
        esc(f.label) +
        "</th><td>" +
        f.value +
        "</td></tr>"
      );
    });
    return (
      '<table class="sub-detail-kv"><tbody>' + rows.join("") + "</tbody></table>"
    );
  }

  function currentOrderBlock(r) {
    var fields = [
      { label: "订单号", value: "<code>" + esc(r.orderNo) + "</code>" },
      { label: "订阅类型", value: esc(r.orderType) },
      { label: "用户 UID", value: uidCell(r.userUid) },
      { label: "用户昵称", value: esc(r.userNickname) },
      { label: "创作者 UID", value: uidCell(r.creatorUid) },
      { label: "创作者昵称", value: esc(r.creatorNickname) },
      { label: "套餐", value: esc(r.plan) },
      { label: "订阅时间", value: esc(r.subscribeTime) },
      { label: "结束时间", value: esc(r.endTime) },
      {
        label: "剩余天数",
        value:
          isUpgradeCancelled(r)
            ? "已取消（终止时剩余 " + esc(String(r.remainDaysAtCancel != null ? r.remainDaysAtCancel : r.remainDays)) + " 天）"
            : r.status === "已取消"
              ? "已取消"
              : r.remainDays > 0 && r.status === "生效中"
                ? esc(r.remainDays) + " 天"
                : "已到期"
      },
      { label: "是否开启自动续约", value: esc(autoRenewText(r.autoRenew)) },
      { label: "订阅状态", value: statusTag(r.status) }
    ];
    if (r.relatedOrderNo) {
      fields.push({
        label: "关联原订单",
        value: "<code>" + esc(r.relatedOrderNo) + "</code>"
      });
    }
    if (r.replacedByOrderNo) {
      fields.push({
        label: "被新订单替换",
        value: "<code>" + esc(r.replacedByOrderNo) + "</code>"
      });
    }
    if (r.cancelReason) {
      fields.push({ label: "终止说明", value: esc(r.cancelReason) });
    }
    var rm = remarkText(r);
    if (rm !== "—") {
      fields.push({ label: "备注", value: esc(rm) });
    }
    return (
      '<div class="sub-detail-block">' +
      '<h4 class="sub-detail-heading">本次订单</h4>' +
      kvTable(r, fields) +
      "</div>"
    );
  }

  function historyBlock(current, history) {
    var body = history
      .map(function (h) {
        var isCurrent = h.id === current.id;
        return (
          "<tr" +
          (isCurrent ? ' class="sub-history-current"' : "") +
          ">" +
          "<td><code>" +
          esc(h.orderNo) +
          "</code></td>" +
          "<td>" +
          esc(h.orderType) +
          "</td>" +
          "<td>" +
          esc(h.plan) +
          "</td>" +
          "<td>" +
          esc(h.subscribeTime) +
          "</td>" +
          "<td>" +
          esc(h.endTime) +
          "</td>" +
          "<td>" +
          statusTag(h.status) +
          "</td>" +
          "<td>" +
          autoRenewTag(h.autoRenew) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    return (
      '<div class="sub-detail-block">' +
      '<h4 class="sub-detail-heading">该用户订阅「' +
      esc(current.creatorNickname) +
      "」的全部记录 <span class=\"sub-detail-sub\">（用户 UID " +
      esc(current.userUid) +
      "）</span></h4>" +
      '<div class="sub-detail-history-scroll">' +
      '<table class="sub-detail-history">' +
      "<thead><tr>" +
      "<th>订单号</th><th>订阅类型</th><th>套餐</th><th>订阅时间</th><th>结束时间</th><th>状态</th><th>自动续约</th>" +
      "</tr></thead><tbody>" +
      body +
      "</tbody></table></div></div>"
    );
  }

  function detailBody(r) {
    var history = getRelationOrders(r);
    return (
      '<div class="sub-detail-wrap">' +
      currentOrderBlock(r) +
      historyBlock(r, history) +
      "</div>"
    );
  }

  function openDetail(r) {
    M.open({
      title: "订阅订单详情 · " + r.orderNo,
      wide: true,
      body: detailBody(r),
      footer: [{ text: "关闭", primary: true, onClick: M.close }],
      onMount: function () {
        if (window.AdminUidLink && typeof window.AdminUidLink.upgrade === "function") {
          var body = document.querySelector(".fl-modal-body");
          if (body) window.AdminUidLink.upgrade(body);
        }
      }
    });
  }

  function renderTable() {
    if (!tbody) return;
    var list = getFiltered();
    if (pager) pager.setTotal(list.length);
    var pageRows = pager ? pager.getSlice(list) : list;
    var startIdx = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;

    if (!pageRows.length) {
      tbody.innerHTML =
        '<tr><td colspan="13" style="text-align:center;padding:40px;color:rgba(0,0,0,.45)">暂无订阅订单</td></tr>';
      return;
    }

    tbody.innerHTML = pageRows
      .map(function (r, i) {
        return (
          '<tr data-id="' +
          esc(r.id) +
          '">' +
          '<td class="col-sticky-left">' +
          (startIdx + i + 1) +
          "</td>" +
          "<td>" +
          uidCell(r.userUid) +
          "</td>" +
          "<td>" +
          esc(r.userNickname) +
          "</td>" +
          "<td>" +
          uidCell(r.creatorUid) +
          "</td>" +
          "<td>" +
          esc(r.creatorNickname) +
          "</td>" +
          "<td>" +
          esc(r.plan) +
          "</td>" +
          "<td>" +
          esc(r.subscribeTime) +
          "</td>" +
          "<td>" +
          esc(r.endTime) +
          "</td>" +
          "<td>" +
          remainTag(r) +
          "</td>" +
          "<td>" +
          autoRenewTag(r.autoRenew) +
          "</td>" +
          "<td>" +
          esc(r.orderNo) +
          "</td>" +
          '<td class="col-remark">' +
          remarkCell(r) +
          "</td>" +
          '<td class="col-actions"><button type="button" class="ant-btn ant-btn-link ant-btn-sm js-sub-detail">详情</button></td>' +
          "</tr>"
        );
      })
      .join("");

    if (window.AdminUidLink && typeof window.AdminUidLink.upgrade === "function") {
      window.AdminUidLink.upgrade(tbody.closest("table") || document);
    }
  }

  if (tbody) {
    tbody.addEventListener("click", function (e) {
      if (e.target.closest(".js-uid-link")) return;
      var btn = e.target.closest(".js-sub-detail");
      if (!btn) return;
      var tr = btn.closest("tr[data-id]");
      if (!tr) return;
      var r = findRow(tr.getAttribute("data-id"));
      if (r) openDetail(r);
    });
  }

  var qBtn = document.getElementById("subQ");
  if (qBtn) {
    qBtn.addEventListener("click", function () {
      if (pager) pager.setPage(1);
      renderTable();
    });
  }

  var resetBtn = document.getElementById("subReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      resetFilters();
      if (pager) pager.setPage(1);
      renderTable();
    });
  }

  var expBtn = document.getElementById("subExp");
  if (expBtn) {
    expBtn.addEventListener("click", function () {
      if (!window.AdminExport) return;
      AdminExport.confirm({
        title: "导出订阅记录",
        body: "<p style='margin:0'>每条订阅订单（含首订与续约）导出 Excel。</p>",
        exportType: "订阅管理",
        sourcePage: "subscriptions.html",
        getConditions: function () {
          return AdminExport.conditions([
            { label: "用户 UID", el: filterUserUid },
            { label: "创作者 UID", el: filterCreatorUid },
            { label: "状态", value: (filterStatus && filterStatus.value) || "全部" },
            { label: "剩余天数", value: remainDaysFilterLabel() }
          ]);
        }
      });
    });
  }

  if (window.AdminPager && pagerMount) {
    pager = window.AdminPager.create({
      mount: pagerMount,
      pageSize: 10,
      onChange: renderTable
    });
  }

  renderTable();
})();
