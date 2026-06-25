/**
 * 充值订单页 · 仅 USDT 链上
 */
(function () {
  var M = window.AdminModal;
  if (!M) return;

  var tbody = document.getElementById("ordRchTbody");
  var tfoot = document.getElementById("ordRchTfoot");
  var pagerMount = document.getElementById("ordRchPager");
  var filterUid = document.getElementById("ordRchFilterUid");
  var filterOrderNo = document.getElementById("ordRchFilterOrderNo");
  var filterStatus = document.getElementById("ordRchFilterStatus");
  var filterOrderStart = document.getElementById("ordRchFilterOrderStart");
  var filterOrderEnd = document.getElementById("ordRchFilterOrderEnd");
  var filterFinishStart = document.getElementById("ordRchFilterFinishStart");
  var filterFinishEnd = document.getElementById("ordRchFilterFinishEnd");
  var pager = null;

  var ROWS = [
    {
      id: "RCH20260511001",
      uid: "882910",
      rate: 7.24,
      orderQty: 200.0,
      orderCny: 1448.0,
      fee: 0.6,
      dealQty: 200.0,
      actualQty: 199.4,
      actualCny: 1443.66,
      txHash: "0x8a7f29e3c1b2045d6e7890ab12cd34ef567890ab12cd34ef567890ab12cd34ef",
      device: "iPhone 15 Pro",
      ip: "103.42.18.91",
      region: "中国 · 上海",
      orderTime: "2026-06-22 08:00:00",
      finishTime: "2026-06-22 08:00:22",
      status: "成功",
      error: ""
    },
    {
      id: "RCH20260510221",
      uid: "445201",
      rate: 7.23,
      orderQty: 500.0,
      orderCny: 3615.0,
      fee: 3.0,
      dealQty: null,
      actualQty: null,
      actualCny: null,
      txHash: "",
      device: "Chrome · Windows",
      ip: "58.220.14.6",
      region: "中国 · 南京",
      orderTime: "2026-06-21 21:12:08",
      finishTime: "",
      status: "处理中",
      error: ""
    },
    {
      id: "RCH20260509188",
      uid: "771002",
      rate: 7.25,
      orderQty: 1000.0,
      orderCny: 7250.0,
      fee: 0,
      dealQty: 0,
      actualQty: 0,
      actualCny: 0,
      txHash: "",
      device: "Safari · macOS",
      ip: "47.88.102.33",
      region: "新加坡",
      orderTime: "2026-06-19 14:20:00",
      finishTime: "2026-06-19 14:21:06",
      status: "失败",
      error: "链上转账网络不匹配（非 TRC20）"
    },
    {
      id: "RCH20260508055",
      uid: "339011",
      rate: 7.22,
      orderQty: 50.0,
      orderCny: 361.0,
      fee: 0.15,
      dealQty: 50.0,
      actualQty: 49.85,
      actualCny: 359.92,
      txHash: "a3f8c2e91d7045b6e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
      device: "FansLoop App · Android",
      ip: "198.51.100.44",
      region: "美国 · 加州",
      orderTime: "2026-06-18 19:02:11",
      finishTime: "2026-06-18 19:04:42",
      status: "成功",
      error: ""
    },
    {
      id: "RCH20260512080",
      uid: "661204",
      rate: 7.26,
      orderQty: 108.42,
      orderCny: 787.13,
      fee: 0.35,
      dealQty: 108.42,
      actualQty: 108.07,
      actualCny: 784.59,
      txHash: "c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4",
      device: "MetaMask · Extension",
      ip: "172.16.8.22",
      region: "中国 · 深圳",
      orderTime: "2026-06-23 10:05:00",
      finishTime: "2026-06-23 10:05:45",
      status: "成功",
      error: ""
    }
  ];

  function esc(s) {
    return M.esc(s == null ? "" : String(s));
  }

  function fmtNum(n, digits) {
    if (n == null || n === "" || !isFinite(Number(n))) return "—";
    return Number(n).toFixed(digits == null ? 2 : digits);
  }

  function fmtSum(n) {
    if (!isFinite(Number(n))) return "0.00";
    return Number(n).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtRate(n) {
    if (n == null || !isFinite(Number(n))) return "—";
    return Number(n).toFixed(4);
  }

  function dash(v) {
    return v ? esc(v) : "—";
  }

  function shortHash(h) {
    if (!h) return "—";
    if (h.length <= 16) return esc(h);
    return esc(h.slice(0, 8) + "…" + h.slice(-8));
  }

  function hashCell(txHash) {
    if (!txHash) return "—";
    return (
      '<span class="ord-hash-cell">' +
      '<code title="' +
      esc(txHash) +
      '">' +
      shortHash(txHash) +
      "</code>" +
      '<button type="button" class="ord-hash-copy js-ord-hash-copy" data-hash="' +
      esc(txHash) +
      '" title="复制交易哈希" aria-label="复制交易哈希">' +
      '<i class="fa-regular fa-copy"></i>' +
      "</button></span>"
    );
  }

  function copyText(text) {
    if (!text) return;
    function done(ok) {
      if (ok && M.notify) M.notify("已复制交易哈希", "success");
      else if (ok) M.toast("已复制交易哈希");
      else if (M.notify) M.notify("复制失败，请手动复制", "error");
      else M.toast("复制失败");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }).catch(function () {
        fallback();
      });
      return;
    }
    fallback();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(ta);
      ta.select();
      try {
        done(document.execCommand("copy"));
      } catch (err) {
        done(false);
      }
      document.body.removeChild(ta);
    }
  }

  function statusTag(st) {
    if (st === "成功") return '<span class="ant-tag ant-tag-green">成功</span>';
    if (st === "失败") return '<span class="ant-tag ant-tag-red">失败</span>';
    if (st === "处理中") return '<span class="ant-tag ant-tag-blue">处理中</span>';
    return '<span class="ant-tag">' + esc(st) + "</span>";
  }

  function toDatetimeLocalValue(d) {
    var pad = function (n) {
      return n < 10 ? "0" + n : String(n);
    };
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  function defaultOrderTimeRange() {
    var end = new Date();
    var start = new Date();
    start.setDate(start.getDate() - 7);
    return { start: toDatetimeLocalValue(start), end: toDatetimeLocalValue(end) };
  }

  function applyDefaultFilters() {
    var range = defaultOrderTimeRange();
    if (filterUid) filterUid.value = "";
    if (filterOrderNo) filterOrderNo.value = "";
    if (filterStatus) filterStatus.value = "";
    if (filterOrderStart) filterOrderStart.value = range.start;
    if (filterOrderEnd) filterOrderEnd.value = range.end;
    if (filterFinishStart) filterFinishStart.value = "";
    if (filterFinishEnd) filterFinishEnd.value = "";
  }

  function parseFilterTime(val) {
    if (!val) return null;
    var dt = new Date(val);
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  function recordTimeMs(str) {
    if (!str || str === "—") return null;
    var dt = new Date(String(str).replace(/-/g, "/"));
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  function inTimeRange(recordVal, startVal, endVal) {
    if (!startVal && !endVal) return true;
    var ms = recordTimeMs(recordVal);
    if (ms == null) return false;
    var start = parseFilterTime(startVal);
    var end = parseFilterTime(endVal);
    if (start != null && ms < start) return false;
    if (end != null && ms > end) return false;
    return true;
  }

  function numVal(n) {
    var v = Number(n);
    return isFinite(v) ? v : 0;
  }

  function sumRows(rows) {
    var orderQty = 0;
    var actualQty = 0;
    var actualCny = 0;
    rows.forEach(function (r) {
      orderQty += numVal(r.orderQty);
      actualQty += numVal(r.actualQty);
      actualCny += numVal(r.actualCny);
    });
    return { orderQty: orderQty, actualQty: actualQty, actualCny: actualCny };
  }

  function renderSummaryRow(label, sums) {
    return (
      "<tr>" +
      '<td colspan="2" class="col-sticky-left ord-summary-label">' +
      esc(label) +
      "</td>" +
      "<td></td>" +
      '<td class="col-sum">' +
      fmtSum(sums.orderQty) +
      "</td>" +
      "<td></td>" +
      "<td></td>" +
      '<td class="col-sum">' +
      fmtSum(sums.actualQty) +
      "</td>" +
      '<td class="col-sum">' +
      fmtSum(sums.actualCny) +
      "</td>" +
      '<td colspan="9"></td>' +
      "</tr>"
    );
  }

  function getFiltered() {
    var uid = filterUid ? String(filterUid.value || "").trim() : "";
    var orderNo = filterOrderNo ? String(filterOrderNo.value || "").trim().toLowerCase() : "";
    var st = filterStatus ? String(filterStatus.value || "").trim() : "";
    var orderStart = filterOrderStart ? filterOrderStart.value : "";
    var orderEnd = filterOrderEnd ? filterOrderEnd.value : "";
    var finishStart = filterFinishStart ? filterFinishStart.value : "";
    var finishEnd = filterFinishEnd ? filterFinishEnd.value : "";

    return ROWS.filter(function (r) {
      if (uid && String(r.uid).indexOf(uid) < 0) return false;
      if (orderNo && String(r.id).toLowerCase().indexOf(orderNo) < 0) return false;
      if (st && r.status !== st) return false;
      if (!inTimeRange(r.orderTime, orderStart, orderEnd)) return false;
      if (!inTimeRange(r.finishTime, finishStart, finishEnd)) return false;
      return true;
    });
  }

  function openDetail(r) {
    var rows = [];
    function push(th, td) {
      rows.push(
        "<tr><th style='padding:8px 10px;background:#fafafa;width:30%;vertical-align:top'>" +
          esc(th) +
          "</th><td style='padding:8px 10px;vertical-align:top'>" +
          td +
          "</td></tr>"
      );
    }
    push("订单号", "<code>" + esc(r.id) + "</code>");
    push("用户 UID", esc(r.uid));
    push("汇率", fmtRate(r.rate));
    push("下单数量(个)", fmtNum(r.orderQty));
    push("下单金额(CNY)", fmtNum(r.orderCny));
    push("手续费", fmtNum(r.fee));
    push("实际成交数量", fmtNum(r.actualQty));
    push("实际成交金额(CNY)", fmtNum(r.actualCny));
    push(
      "交易哈希",
      r.txHash
        ? "<code style='word-break:break-all;font-size:12px'>" + esc(r.txHash) + "</code>"
        : "—"
    );
    push("操作设备", dash(r.device));
    push("交易 IP", dash(r.ip));
    push("地区", dash(r.region));
    push("下单时间", dash(r.orderTime));
    push("完成时间", dash(r.finishTime));
    push("订单状态", esc(r.status));
    push("错误描述", r.error ? esc(r.error) : "—");

    M.open({
      title: "充值订单详情 · " + r.id,
      wide: true,
      body:
        "<table style='width:100%;border-collapse:collapse;font-size:13px;border:1px solid #f0f0f0'>" +
        rows.join("") +
        "</table>",
      footer: [{ text: "关闭", primary: true, onClick: M.close }]
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
        '<tr><td colspan="17" style="text-align:center;padding:40px;color:rgba(0,0,0,.45)">暂无充值订单</td></tr>';
      if (tfoot) {
        tfoot.innerHTML =
          renderSummaryRow("小计", { orderQty: 0, actualQty: 0, actualCny: 0 }) +
          renderSummaryRow("合计", sumRows(list));
      }
      return;
    }

    tbody.innerHTML = pageRows
      .map(function (r, i) {
        return (
          '<tr data-id="' +
          esc(r.id) +
          '" data-clickable="1">' +
          '<td class="col-sticky-left">' +
          (startIdx + i + 1) +
          "</td>" +
          '<td class="col-sticky-left-2"><span class="js-uid-link" data-uid="' +
          esc(r.uid) +
          '">' +
          esc(r.uid) +
          "</span></td>" +
          "<td>" +
          fmtRate(r.rate) +
          "</td>" +
          "<td>" +
          fmtNum(r.orderQty) +
          "</td>" +
          "<td>" +
          fmtNum(r.orderCny) +
          "</td>" +
          "<td>" +
          fmtNum(r.fee) +
          "</td>" +
          "<td>" +
          fmtNum(r.actualQty) +
          "</td>" +
          "<td>" +
          fmtNum(r.actualCny) +
          "</td>" +
          '<td><code style="font-size:11px">' +
          esc(r.id) +
          "</code></td>" +
          '<td class="col-hash">' +
          hashCell(r.txHash) +
          "</td>" +
          "<td>" +
          dash(r.device) +
          "</td>" +
          "<td>" +
          dash(r.ip) +
          "</td>" +
          "<td>" +
          dash(r.region) +
          "</td>" +
          "<td>" +
          dash(r.orderTime) +
          "</td>" +
          "<td>" +
          dash(r.finishTime) +
          "</td>" +
          "<td>" +
          statusTag(r.status) +
          "</td>" +
          '<td class="col-error" title="' +
          esc(r.error) +
          '">' +
          (r.error ? esc(r.error) : "—") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    if (tfoot) {
      tfoot.innerHTML =
        renderSummaryRow("小计", sumRows(pageRows)) + renderSummaryRow("合计", sumRows(list));
    }

    if (window.AdminUidLink && typeof window.AdminUidLink.upgrade === "function") {
      window.AdminUidLink.upgrade(tbody.closest("table") || document);
    }
  }

  function findRow(id) {
    return ROWS.filter(function (r) {
      return r.id === id;
    })[0];
  }

  if (tbody) {
    tbody.addEventListener("click", function (e) {
      var copyBtn = e.target.closest(".js-ord-hash-copy");
      if (copyBtn) {
        e.stopPropagation();
        copyText(copyBtn.getAttribute("data-hash") || "");
        return;
      }
      if (e.target.closest(".js-uid-link")) return;
      var tr = e.target.closest("tr[data-id]");
      if (!tr) return;
      var r = findRow(tr.getAttribute("data-id"));
      if (r) openDetail(r);
    });
  }

  var qBtn = document.getElementById("ordRchQuery");
  if (qBtn) {
    qBtn.addEventListener("click", function () {
      if (pager) pager.setPage(1);
      renderTable();
    });
  }

  var resetBtn = document.getElementById("ordRchReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      applyDefaultFilters();
      if (pager) pager.setPage(1);
      renderTable();
    });
  }

  var expBtn = document.getElementById("ordRchExport");
  if (expBtn) {
    expBtn.addEventListener("click", function () {
      if (!window.AdminExport) return;
      AdminExport.confirm({
        title: "导出充值订单",
        body: "<p style='margin:0'>按当前筛选导出 USDT 链上充值订单 Excel，含汇率、数量、CNY 金额、手续费、成交与哈希等字段。任务加入队列后可在「导出任务列表」下载。</p>",
        exportType: "充值订单",
        sourcePage: "orders-recharge.html",
        getConditions: function () {
          return AdminExport.conditions([
            { label: "用户 UID", el: filterUid },
            { label: "订单号", el: filterOrderNo },
            { label: "订单状态", value: (filterStatus && filterStatus.value) || "全部" },
            {
              label: "下单时间",
              value:
                filterOrderStart && filterOrderStart.value
                  ? filterOrderStart.value + " — " + (filterOrderEnd ? filterOrderEnd.value : "")
                  : "近一周（默认）"
            },
            {
              label: "完成时间",
              value:
                filterFinishStart && filterFinishStart.value
                  ? filterFinishStart.value + " — " + (filterFinishEnd ? filterFinishEnd.value : "")
                  : "—"
            }
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

  applyDefaultFilters();
  renderTable();
})();
