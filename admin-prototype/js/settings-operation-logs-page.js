/**
 * 操作日志页交互
 */
(function () {
  var M = window.AdminModal;
  var R = window.AdminRbac;
  if (!M || !R) return;

  var tbody = document.getElementById("logsTableBody");
  var pagerMount = document.getElementById("logsPager");
  var pager = null;
  var filterModule = document.getElementById("logFilterModule");
  var filterResult = document.getElementById("logFilterResult");

  function resultTag(result) {
    return result === "success"
      ? '<span class="ant-tag ant-tag-green">成功</span>'
      : '<span class="ant-tag ant-tag-red">失败</span>';
  }

  function getFilteredLogs() {
    var mod = filterModule ? filterModule.value : "";
    var res = filterResult ? filterResult.value : "";
    return R.OPERATION_LOGS.filter(function (log) {
      if (mod && log.module !== mod) return false;
      if (res && log.result !== res) return false;
      return true;
    });
  }

  function renderTable() {
    if (!tbody) return;
    var logs = getFilteredLogs();
    if (!logs.length) {
      if (pager) pager.setTotal(0);
      tbody.innerHTML =
        '<tr><td colspan="10" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无匹配记录</td></tr>';
      return;
    }
    if (pager) pager.setTotal(logs.length);
    var pageLogs = pager ? pager.getSlice(logs) : logs;
    var startIdx = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
    tbody.innerHTML = pageLogs
      .map(function (log, i) {
        return (
          "<tr data-log-index=\"" + (startIdx + i) + "\">" +
          "<td class=\"admin-col-index\">" + (startIdx + i + 1) + "</td>" +
          "<td>" + R.esc(log.time) + "</td>" +
          "<td><code>" + R.esc(log.operator) + "</code></td>" +
          "<td>" + R.esc(log.module) + "</td>" +
          "<td>" + R.esc(log.submodule) + "</td>" +
          "<td>" + R.esc(log.action) + "</td>" +
          "<td>" + R.esc(log.target) + "</td>" +
          "<td><code style='font-size:12px'>" + R.esc(log.ip) + "</code></td>" +
          "<td>" + resultTag(log.result) + "</td>" +
          '<td><button type="button" class="ant-btn ant-btn-link ant-btn-sm js-log-detail">详情</button></td>' +
          "</tr>"
        );
      })
      .join("");
  }

  document.getElementById("btnLogExport").addEventListener("click", function () {
    if (!window.AdminExport) return;
    AdminExport.confirm({
      title: "导出操作日志",
      body:
        "<p style='margin:0 0 12px'>按当前筛选条件导出审计 Excel（含 request_id、一级/二级模块、功能操作）。</p>" +
        "<label style='display:block;font-size:12px;color:rgba(0,0,0,.45);margin-bottom:6px'>导出范围</label>" +
        "<select class='ant-input' id='logExportScope' style='width:100%;max-width:320px'><option>当前筛选结果</option><option>全部日志（近 90 天）</option></select>",
      exportType: "操作日志",
      sourcePage: "settings-operation-logs.html",
      getConditions: function () {
        var scope = document.getElementById("logExportScope");
        return AdminExport.conditions([
          { label: "导出范围", value: scope ? scope.value : "当前筛选结果" },
          { label: "一级模块", value: (filterModule && filterModule.value) || "全部" },
          { label: "结果", value: (filterResult && filterResult.value) || "全部" }
        ]);
      }
    });
  });

  var FT = window.AdminFilterToolbar;
  if (FT) {
    FT.onQuery("btnLogQuery", function () {
      if (pager) pager.resetPage();
      renderTable();
      M.toast("已查询 " + getFilteredLogs().length + " 条");
    });
    FT.onReset("btnLogReset", function () {
      if (pager) pager.resetPage();
      renderTable();
    });
  }

  if (filterModule) filterModule.addEventListener("change", function () {
    if (pager) pager.resetPage();
    renderTable();
  });
  if (filterResult) filterResult.addEventListener("change", function () {
    if (pager) pager.resetPage();
    renderTable();
  });

  if (pagerMount && window.AdminPager) {
    pager = window.AdminPager.create({
      mount: pagerMount,
      pageSize: 10,
      onChange: function () {
        renderTable();
      }
    });
  }

  if (tbody) {
    tbody.addEventListener("click", function (e) {
      if (!e.target.classList.contains("js-log-detail")) return;
      var tr = e.target.closest("tr");
      var idx = parseInt(tr.getAttribute("data-log-index"), 10);
      var log = getFilteredLogs()[idx];
      if (!log) return;
      M.open({
        title: "操作日志详情",
        wide: true,
        body: R.renderLogDetail(log),
        footer: [{ text: "关闭", primary: true, onClick: M.close }]
      });
    });
  }

  renderTable();
})();
