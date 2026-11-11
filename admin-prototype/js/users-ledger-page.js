/**
 * 账变记录页（含广告投放 / 退费等资金流水）
 */
(function () {
  var M = window.AdminModal;
  if (!M) return;

  var LEDGER_TYPES = [
    "链上充值",
    "链上提现",
    "积分人工充值",
    "积分人工扣除",
    "积分消耗",
    "积分获取",
    "充值手续费",
    "提现手续费",
    "广告账户充值",
    "广告投放冻结",
    "广告投放消耗",
    "广告退款",
    "广告解冻"
  ];

  var AD_TYPE_MAP = {
    recharge: { type: "广告账户充值", io: "收入" },
    freeze: { type: "广告投放冻结", io: "支出" },
    spend: { type: "广告投放消耗", io: "支出" },
    refund: { type: "广告退款", io: "收入" },
    unfreeze: { type: "广告解冻", io: "收入" },
    pay: { type: "广告投放冻结", io: "支出" },
    adjust: { type: "广告账户充值", io: "收入" }
  };

  var USDT_RATE = 7.24;

  var tbody = document.getElementById("ledgerTbody");
  var pagerMount = document.getElementById("ledgerPager");
  var filterType = document.getElementById("ledgerFilterType");
  var filterUid = document.getElementById("ledgerFilterUid");
  var filterDate = document.getElementById("ledgerFilterDate");
  var pager = null;

  var BASE_ROWS = [
    {
      type: "链上充值",
      uid: "882910",
      orderId: "CH772910",
      currency: "USDT",
      rate: 7.24,
      qty: 200.0,
      io: "收入",
      cny: 1448.0,
      frozenFee: 0,
      fee: 0,
      time: "2026-05-11 08:01:22",
      remark: "TRC20 链上到账"
    },
    {
      type: "积分消耗",
      uid: "882910",
      orderId: "RD88211",
      currency: "JF",
      rate: 0.01,
      qty: 500.0,
      io: "支出",
      cny: 5.0,
      frozenFee: 0,
      fee: 0,
      time: "2026-05-10 22:15:01",
      remark: "积分活动：创作者打赏消耗"
    },
    {
      type: "积分获取",
      uid: "102938",
      orderId: "PT55601",
      currency: "JF",
      rate: 0.01,
      qty: 1200.0,
      io: "收入",
      cny: 12.0,
      frozenFee: 0,
      fee: 0,
      time: "2026-05-09 14:30:00",
      remark: "积分活动：每日签到奖励"
    },
    {
      type: "积分人工充值",
      uid: "556677",
      orderId: "MA88102",
      currency: "JF",
      rate: 0.01,
      qty: 3000.0,
      io: "收入",
      cny: 30.0,
      frozenFee: 0,
      fee: 0,
      time: "2026-05-08 11:20:15",
      remark: "运营补偿发放"
    },
    {
      type: "积分人工扣除",
      uid: "556677",
      orderId: "MD88103",
      currency: "JF",
      rate: 0.01,
      qty: 800.0,
      io: "支出",
      cny: 8.0,
      frozenFee: 0,
      fee: 0,
      time: "2026-05-07 16:45:33",
      remark: "违规积分回收"
    },
    {
      type: "链上提现",
      uid: "771201",
      orderId: "WD99021",
      currency: "USDT",
      rate: 7.22,
      qty: 150.0,
      io: "支出",
      cny: 1083.0,
      frozenFee: 2.0,
      fee: 2.0,
      time: "2026-05-06 09:12:08",
      remark: "提现至 TRC20 地址"
    },
    {
      type: "提现手续费",
      uid: "771201",
      orderId: "WD99021",
      currency: "USDT",
      rate: 7.22,
      qty: 2.0,
      io: "支出",
      cny: 14.44,
      frozenFee: 2.0,
      fee: 2.0,
      time: "2026-05-06 09:12:08",
      remark: "关联提现单 WD99021"
    },
    {
      type: "充值手续费",
      uid: "339011",
      orderId: "CH339011",
      currency: "USDT",
      rate: 7.25,
      qty: 1.5,
      io: "支出",
      cny: 10.88,
      frozenFee: 0,
      fee: 1.5,
      time: "2026-05-05 18:00:00",
      remark: "链上充值通道费"
    },
    {
      type: "链上提现",
      uid: "339011",
      orderId: "WD339099",
      currency: "USDT",
      rate: 7.23,
      qty: 50.0,
      io: "支出",
      cny: 361.5,
      frozenFee: 2.0,
      fee: 0,
      time: "2026-05-04 10:22:44",
      remark: "提现失败退回，未产生手续费"
    }
  ];

  function esc(s) {
    return M.esc(s == null ? "" : String(s));
  }

  function fmtQty(n) {
    var v = Number(n);
    if (!isFinite(v)) return "—";
    return v.toFixed(2);
  }

  function fmtRate(n) {
    var v = Number(n);
    if (!isFinite(v)) return "—";
    return v.toFixed(4);
  }

  function fmtCny(n) {
    var v = Number(n);
    if (!isFinite(v)) return "—";
    return v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtFee(n) {
    var v = Number(n);
    if (!isFinite(v) || v === 0) return "—";
    return v.toFixed(2);
  }

  function fmtTime(iso) {
    if (!iso) return "—";
    return String(iso).slice(0, 19).replace("T", " ");
  }

  function typeTag(type) {
    var cls = "ant-tag";
    if (type.indexOf("广告") === 0) {
      if (type.indexOf("退款") >= 0 || type.indexOf("充值") >= 0 || type.indexOf("解冻") >= 0) cls += " ant-tag-green";
      else if (type.indexOf("冻结") >= 0) cls += " ant-tag-orange";
      else if (type.indexOf("消耗") >= 0) cls += " ant-tag-red";
      else cls += " ant-tag-purple";
    } else if (type.indexOf("充值") >= 0 && type.indexOf("手续费") < 0) cls += " ant-tag-green";
    else if (type.indexOf("提现") >= 0 && type.indexOf("手续费") < 0) cls += " ant-tag-orange";
    else if (type.indexOf("积分") >= 0) cls += " ant-tag-blue";
    else cls += " ant-tag-default";
    return '<span class="' + cls + '">' + esc(type) + "</span>";
  }

  function ioCell(io) {
    if (io === "收入") return '<span class="ledger-io-income">收入</span>';
    if (io === "支出") return '<span class="ledger-io-expense">支出</span>';
    return esc(io || "—");
  }

  function mapAdFinanceRow(f) {
    var meta = AD_TYPE_MAP[f.type] || { type: "广告账户充值", io: Number(f.amount) >= 0 ? "收入" : "支出" };
    var qty = Math.abs(Number(f.amount) || 0);
    var rate = USDT_RATE;
    return {
      type: meta.type,
      uid: String(f.uid || "").replace(/^U/, "") || f.uid,
      orderId: f.orderNo || f.id || "—",
      currency: "USDT",
      rate: rate,
      qty: qty,
      io: meta.io,
      cny: Math.round(qty * rate * 100) / 100,
      frozenFee: 0,
      fee: 0,
      time: fmtTime(f.at),
      remark: f.note || ("广告资金 · " + meta.type),
      source: "ad"
    };
  }

  function loadAdFinanceRows() {
    if (!window.FLAdStore || typeof FLAdStore.load !== "function") return [];
    try {
      var fin = (FLAdStore.load().finance || []).slice();
      return fin.map(mapAdFinanceRow);
    } catch (e) {
      return [];
    }
  }

  function allRows() {
    return BASE_ROWS.concat(loadAdFinanceRows()).sort(function (a, b) {
      return String(b.time).localeCompare(String(a.time));
    });
  }

  function getFiltered() {
    var type = filterType ? String(filterType.value || "").trim() : "";
    var uid = filterUid ? String(filterUid.value || "").trim() : "";
    var date = filterDate ? String(filterDate.value || "").trim() : "";
    return allRows().filter(function (r) {
      if (type && r.type !== type) return false;
      if (uid && String(r.uid).indexOf(uid) < 0) return false;
      if (date && String(r.time).indexOf(date) !== 0) return false;
      return true;
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
        '<tr><td colspan="13" style="text-align:center;padding:40px;color:rgba(0,0,0,.45)">暂无账变记录</td></tr>';
      return;
    }

    tbody.innerHTML = pageRows
      .map(function (r, i) {
        return (
          "<tr>" +
          '<td class="col-sticky-left">' +
          (startIdx + i + 1) +
          "</td>" +
          "<td>" +
          typeTag(r.type) +
          "</td>" +
          '<td><span class="js-uid-link" data-uid="' +
          esc(r.uid) +
          '">' +
          esc(r.uid) +
          "</span></td>" +
          '<td class="col-order"><code>' +
          esc(r.orderId) +
          "</code></td>" +
          "<td>" +
          esc(r.currency) +
          "</td>" +
          "<td>" +
          fmtRate(r.rate) +
          "</td>" +
          "<td>" +
          fmtQty(r.qty) +
          "</td>" +
          "<td>" +
          ioCell(r.io) +
          "</td>" +
          "<td>" +
          fmtCny(r.cny) +
          "</td>" +
          "<td>" +
          fmtFee(r.frozenFee) +
          "</td>" +
          "<td>" +
          fmtFee(r.fee) +
          "</td>" +
          "<td>" +
          esc(r.time) +
          "</td>" +
          '<td class="col-remark" title="' +
          esc(r.remark) +
          '">' +
          esc(r.remark || "—") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    if (window.AdminUidLink && typeof window.AdminUidLink.upgrade === "function") {
      window.AdminUidLink.upgrade(tbody.closest("table") || document);
    }
  }

  function fillTypeOptions() {
    if (!filterType) return;
    var cur = filterType.value || "";
    filterType.innerHTML =
      '<option value="">全部类型</option>' +
      LEDGER_TYPES.map(function (t) {
        return '<option value="' + esc(t) + '">' + esc(t) + "</option>";
      }).join("");
    filterType.value = cur;
  }

  function bindFilters() {
    var FT = window.AdminFilterToolbar;
    if (FT) {
      FT.onQuery("ledgerQ", function () {
        if (pager) pager.resetPage();
        renderTable();
      });
      FT.onReset("ledgerReset", function () {
        if (filterType) filterType.value = "";
        if (filterUid) filterUid.value = "";
        if (filterDate) filterDate.value = "";
        if (pager) pager.resetPage();
        renderTable();
      });
    } else {
      var q = document.getElementById("ledgerQ");
      var reset = document.getElementById("ledgerReset");
      if (q) q.onclick = function () {
        if (pager) pager.resetPage();
        renderTable();
      };
      if (reset) reset.onclick = function () {
        if (filterType) filterType.value = "";
        if (filterUid) filterUid.value = "";
        if (filterDate) filterDate.value = "";
        if (pager) pager.resetPage();
        renderTable();
      };
    }
    if (filterType) filterType.addEventListener("change", function () {
      if (pager) pager.setPage(1);
      renderTable();
    });
  }

  function bindExport() {
    var expBtn = document.getElementById("ledExp");
    if (!expBtn) return;
    expBtn.addEventListener("click", function () {
      if (!window.AdminExport) return;
      AdminExport.confirm({
        title: "导出账变记录",
        body: "<p style='margin:0'>支持按当前筛选条件异步导出 Excel，完成后在「导出任务列表」下载。含广告投放冻结 / 消耗 / 退款等类型。</p>",
        exportType: "账变记录",
        sourcePage: "users-ledger.html",
        getConditions: function () {
          return AdminExport.conditions([
            { label: "账变类型", value: (filterType && filterType.value) || "全部" },
            { label: "用户 UID", el: filterUid },
            { label: "日期", el: filterDate }
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

  fillTypeOptions();
  bindFilters();
  bindExport();
  renderTable();
})();
