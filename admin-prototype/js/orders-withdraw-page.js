/**
 * 提现订单页 · 仅 USDT 链上
 */
(function () {
  var M = window.AdminModal;
  if (!M) return;

  var tbody = document.getElementById("ordWdrTbody");
  var tfoot = document.getElementById("ordWdrTfoot");
  var pagerMount = document.getElementById("ordWdrPager");
  var filterUid = document.getElementById("ordWdrFilterUid");
  var filterOrderNo = document.getElementById("ordWdrFilterOrderNo");
  var filterStatus = document.getElementById("ordWdrFilterStatus");
  var filterOrderStart = document.getElementById("ordWdrFilterOrderStart");
  var filterOrderEnd = document.getElementById("ordWdrFilterOrderEnd");
  var filterFinishStart = document.getElementById("ordWdrFilterFinishStart");
  var filterFinishEnd = document.getElementById("ordWdrFilterFinishEnd");
  var pager = null;
  var auditTarget = null;

  var ROWS = [
    {
      id: "WD20260513001",
      uid: "882910",
      price: 7.24,
      withdrawQty: 300.0,
      withdrawCny: 2172.0,
      fee: 1.5,
      frozenQty: 301.5,
      actualQty: null,
      actualCny: null,
      recvNet: "TRON(TRC20)",
      recvAddr: "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs",
      txHash: "",
      device: "iPhone 15 Pro",
      ip: "103.42.18.91",
      region: "中国 · 上海",
      orderTime: "2026-06-23 09:15:33",
      finishTime: "",
      status: "处理中",
      error: "",
      needsAudit: true
    },
    {
      id: "WD20260511003",
      uid: "102938",
      price: 7.23,
      withdrawQty: 300.0,
      withdrawCny: 2169.0,
      fee: 1.5,
      frozenQty: 301.5,
      actualQty: null,
      actualCny: null,
      recvNet: "TRON(TRC20)",
      recvAddr: "TQ4q9xgsQyKkCepXyGMDazh2UcqA6XrXVT",
      txHash: "",
      device: "Chrome · macOS",
      ip: "198.51.100.12",
      region: "美国 · 纽约",
      orderTime: "2026-06-22 09:00:02",
      finishTime: "",
      status: "处理中",
      error: "",
      needsAudit: false
    },
    {
      id: "WD20260510055",
      uid: "661204",
      price: 7.26,
      withdrawQty: 800.0,
      withdrawCny: 5808.0,
      fee: 2.0,
      frozenQty: 802.0,
      actualQty: 798.0,
      actualCny: 5793.48,
      recvNet: "TRON(TRC20)",
      recvAddr: "TLa2f8K3mN1pQ7rS4tU6vW8xY0zAbCdEf",
      txHash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
      device: "FansLoop App · Android",
      ip: "172.16.8.22",
      region: "中国 · 深圳",
      orderTime: "2026-06-21 16:30:00",
      finishTime: "2026-06-21 16:32:18",
      status: "成功",
      error: "",
      needsAudit: false
    },
    {
      id: "WD20260509202",
      uid: "339011",
      price: 7.22,
      withdrawQty: 120.0,
      withdrawCny: 866.4,
      fee: 1.4,
      frozenQty: 121.4,
      actualQty: 0,
      actualCny: 0,
      recvNet: "ETH(ERC20)",
      recvAddr: "0xb2132bae7ddd15459dcfaebbef5266d51eaeb74a",
      txHash: "",
      device: "MetaMask · Extension",
      ip: "47.88.102.33",
      region: "新加坡",
      orderTime: "2026-06-20 21:15:02",
      finishTime: "2026-06-20 21:16:40",
      status: "失败",
      error: "链上 Gas 不足导致合约执行失败",
      needsAudit: false
    },
    {
      id: "WD20260509188",
      uid: "771002",
      price: 7.25,
      withdrawQty: 2000.0,
      withdrawCny: 14500.0,
      fee: 0,
      frozenQty: 2000.0,
      actualQty: 0,
      actualCny: 0,
      recvNet: "TRON(TRC20)",
      recvAddr: "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs",
      txHash: "",
      device: "Safari · iOS",
      ip: "58.220.14.6",
      region: "中国 · 南京",
      orderTime: "2026-06-19 14:18:30",
      finishTime: "2026-06-19 14:19:05",
      status: "失败",
      error: "提现地址风控拦截（高风险地址库命中）",
      needsAudit: false
    }
  ];

  function esc(s) {
    return M.esc(s == null ? "" : String(s));
  }

  function fmtNum(n, digits) {
    if (n == null || n === "" || !isFinite(Number(n))) return "—";
    return Number(n).toFixed(digits == null ? 2 : digits);
  }

  function fmtPrice(n) {
    if (n == null || !isFinite(Number(n))) return "—";
    return Number(n).toFixed(4);
  }

  function fmtSum(n) {
    if (!isFinite(Number(n))) return "0.00";
    return Number(n).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function dash(v) {
    return v ? esc(v) : "—";
  }

  function shortAddr(a) {
    if (!a) return "—";
    if (a.length <= 18) return esc(a);
    return esc(a.slice(0, 8) + "…" + a.slice(-8));
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
    var withdrawQty = 0;
    var frozenQty = 0;
    var actualQty = 0;
    rows.forEach(function (r) {
      withdrawQty += numVal(r.withdrawQty);
      frozenQty += numVal(r.frozenQty);
      actualQty += numVal(r.actualQty);
    });
    return { withdrawQty: withdrawQty, frozenQty: frozenQty, actualQty: actualQty };
  }

  function renderSummaryRow(label, sums) {
    return (
      "<tr>" +
      '<td colspan="2" class="col-sticky-left ord-summary-label">' +
      esc(label) +
      "</td>" +
      "<td></td>" +
      '<td class="col-sum">' +
      fmtSum(sums.withdrawQty) +
      "</td>" +
      "<td></td>" +
      "<td></td>" +
      '<td class="col-sum">' +
      fmtSum(sums.frozenQty) +
      "</td>" +
      '<td class="col-sum">' +
      fmtSum(sums.actualQty) +
      "</td>" +
      "<td></td>" +
      '<td colspan="11"></td>' +
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

  function findRow(id) {
    return ROWS.filter(function (r) {
      return r.id === id;
    })[0];
  }

  function nowStr() {
    return new Date().toISOString().slice(0, 19).replace("T", " ");
  }

  function openAuditModal(r) {
    auditTarget = r;
    var body =
      "<div style='font-size:13px;line-height:1.65;color:rgba(0,0,0,.85)'>" +
      "<p style='margin:0 0 12px'><strong>用户 UID</strong> <code>" +
      esc(r.uid) +
      "</code> · <strong>提现数量</strong> " +
      fmtNum(r.withdrawQty) +
      " USDT · <strong>冻结数量</strong> " +
      fmtNum(r.frozenQty) +
      " USDT</p>" +
      "<div style='margin:0 0 14px;padding:10px 12px;background:#fafafa;border:1px solid #f0f0f0;border-radius:6px'>" +
      "<strong>收款网络</strong> " +
      esc(r.recvNet) +
      "<br><strong>收款地址</strong><br><code style='word-break:break-all;font-size:12px'>" +
      esc(r.recvAddr) +
      "</code></div>" +
      "<label style='display:block;font-size:12px;color:rgba(0,0,0,.55);margin-bottom:6px'>审核备注（选填）</label>" +
      "<textarea id='wdrAuditRemark' class='ant-input' rows='3' style='width:100%;resize:vertical' placeholder='风控补充说明等'></textarea>" +
      "</div>";

    M.open({
      title: "提现审核 · " + r.id,
      wide: true,
      body: body,
      footer: [
        {
          text: "拒绝",
          danger: true,
          onClick: function () {
            var rm = document.getElementById("wdrAuditRemark");
            var t = rm ? String(rm.value).trim() : "";
            M.close();
            auditTarget.status = "失败";
            auditTarget.needsAudit = false;
            auditTarget.error = t || "运营审核拒绝";
            auditTarget.actualQty = 0;
            auditTarget.actualCny = 0;
            auditTarget.finishTime = nowStr();
            auditTarget = null;
            renderTable();
            M.toast("已拒绝该提现（原型）");
          }
        },
        { text: "关闭", onClick: M.close },
        {
          text: "通过并打款",
          primary: true,
          onClick: function () {
            M.close();
            auditTarget.status = "处理中";
            auditTarget.needsAudit = false;
            auditTarget = null;
            renderTable();
            M.toast("审核通过，链上打款处理中（原型）");
          }
        }
      ],
      onMount: function () {
        var el = document.getElementById("wdrAuditRemark");
        if (el) el.focus();
      }
    });
  }

  function openDetail(r) {
    var footer = [{ text: "关闭", primary: true, onClick: M.close }];
    if (r.needsAudit) {
      footer.unshift({
        text: "审核",
        onClick: function () {
          M.close();
          openAuditModal(r);
        }
      });
    }

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
    push("汇率", fmtPrice(r.price));
    push("提现数量(个)", fmtNum(r.withdrawQty));
    push("提现金额(CNY)", fmtNum(r.withdrawCny));
    push("手续费", fmtNum(r.fee));
    push("冻结数量", fmtNum(r.frozenQty));
    push("实际成交数量(个)", fmtNum(r.actualQty));
    push("实际成交金额(CNY)", fmtNum(r.actualCny));
    push("收款网络", esc(r.recvNet));
    push(
      "收款地址",
      "<code style='word-break:break-all;font-size:12px'>" + esc(r.recvAddr) + "</code>"
    );
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
      title: "提现订单详情 · " + r.id,
      wide: true,
      body:
        "<table style='width:100%;border-collapse:collapse;font-size:13px;border:1px solid #f0f0f0'>" +
        rows.join("") +
        "</table>",
      footer: footer
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
        '<tr><td colspan="20" style="text-align:center;padding:40px;color:rgba(0,0,0,.45)">暂无提现订单</td></tr>';
      if (tfoot) {
        tfoot.innerHTML =
          renderSummaryRow("小计", { withdrawQty: 0, frozenQty: 0, actualQty: 0 }) +
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
          fmtPrice(r.price) +
          "</td>" +
          "<td>" +
          fmtNum(r.withdrawQty) +
          "</td>" +
          "<td>" +
          fmtNum(r.withdrawCny) +
          "</td>" +
          "<td>" +
          fmtNum(r.fee) +
          "</td>" +
          "<td>" +
          fmtNum(r.frozenQty) +
          "</td>" +
          "<td>" +
          fmtNum(r.actualQty) +
          "</td>" +
          "<td>" +
          fmtNum(r.actualCny) +
          "</td>" +
          "<td>" +
          esc(r.recvNet) +
          "</td>" +
          '<td class="col-address" title="' +
          esc(r.recvAddr) +
          '"><code>' +
          shortAddr(r.recvAddr) +
          "</code></td>" +
          '<td class="col-hash">' +
          hashCell(r.txHash) +
          "</td>" +
          '<td><code style="font-size:11px">' +
          esc(r.id) +
          "</code></td>" +
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

  var FT = window.AdminFilterToolbar;
  if (FT) {
    FT.onQuery("ordWdrQuery", function () {
      if (pager) pager.resetPage();
      renderTable();
    });
    FT.onReset("ordWdrReset", function () {
      applyDefaultFilters();
      if (pager) pager.resetPage();
      renderTable();
    });
  }

  var expBtn = document.getElementById("ordWdrExport");
  if (expBtn) {
    expBtn.addEventListener("click", function () {
      if (!window.AdminExport) return;
      AdminExport.confirm({
        title: "导出提现订单",
        body: "<p style='margin:0'>按当前筛选导出 USDT 链上提现订单 Excel，含汇率、提现/冻结/成交数量与金额、收款网络地址、交易哈希等字段。任务加入队列后可在「导出任务列表」下载。</p>",
        exportType: "提现订单",
        sourcePage: "orders-withdraw.html",
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
