/**
 * 导出任务列表页
 */
(function () {
  var M = window.AdminModal;
  var Store = window.AdminExportTasks;
  if (!M || !Store) return;

  var tbody = document.getElementById("expTasksTbody");
  var pagerMount = document.getElementById("expTasksPager");
  var filterType = document.getElementById("expFilterType");
  var pager = null;
  var pollTimer = null;

  function esc(s) {
    return M.esc(s == null ? "" : String(s));
  }

  function getFiltered() {
    var typeQ = filterType ? String(filterType.value || "").trim().toLowerCase() : "";

    return Store.load().filter(function (t) {
      if (typeQ && String(t.exportType || "").toLowerCase().indexOf(typeQ) < 0) return false;
      return true;
    });
  }

  function statusTag(task) {
    var display = Store.displayStatus(task);
    if (display === "导出成功") {
      return '<span class="ant-tag ant-tag-green">导出成功</span>';
    }
    if (display === "导出失败") {
      return (
        '<span class="ant-tag ant-tag-red" title="' +
        esc(task.errorMsg || "") +
        '">导出失败</span>'
      );
    }
    if (display === "已过期") {
      return '<span class="ant-tag">已过期</span>';
    }
    if (display === "正在导出") {
      return (
        '<span class="exp-status-spin"><i class="fa-solid fa-spinner fa-spin"></i>' +
        '<span class="ant-tag ant-tag-blue">正在导出</span></span>'
      );
    }
    return '<span class="ant-tag">' + esc(display) + "</span>";
  }

  function actionCell(task) {
    var display = Store.displayStatus(task);
    if (display === "导出成功") {
      return (
        '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-exp-download" data-id="' +
        esc(task.id) +
        '"><i class="fa-solid fa-download"></i> 下载</button>'
      );
    }
    return "—";
  }

  function renderTable() {
    if (!tbody) return;
    var list = getFiltered();
    if (pager) pager.setTotal(list.length);
    var pageRows = pager ? pager.getSlice(list) : list;
    var startIdx = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;

    if (!pageRows.length) {
      tbody.innerHTML =
        '<tr><td colspan="9" style="text-align:center;padding:40px;color:rgba(0,0,0,.45)">暂无导出任务</td></tr>';
      return;
    }

    tbody.innerHTML = pageRows
      .map(function (t, i) {
        var expired = Store.displayStatus(t) === "已过期";
        var cond = Store.displayConditions
          ? Store.displayConditions(t.conditions)
          : t.conditions;
        return (
          '<tr data-id="' +
          esc(t.id) +
          (expired ? '" class="is-expired"' : '"') +
          ">" +
          '<td class="col-sticky-left col-index">' +
          (startIdx + i + 1) +
          "</td>" +
          '<td class="col-task-id">' +
          esc(t.id) +
          "</td>" +
          '<td class="col-export-type">' +
          esc(t.exportType) +
          "</td>" +
          '<td class="exp-cond-cell" title="' +
          esc(cond) +
          '">' +
          esc(cond) +
          "</td>" +
          "<td>" +
          esc(t.exportTime) +
          "</td>" +
          "<td>" +
          esc(t.deleteTime) +
          "</td>" +
          "<td>" +
          esc(t.exporter) +
          "</td>" +
          "<td>" +
          statusTag(t) +
          "</td>" +
          "<td>" +
          actionCell(t) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function resetFilters() {
    if (filterType) filterType.value = "";
  }

  function applyUrlFilters() {
    try {
      var params = new URLSearchParams(window.location.search);
      var type = params.get("type");
      if (type && filterType) filterType.value = type;
    } catch (e) { /* ignore */ }
  }

  function hasProcessing() {
    return Store.load().some(function (t) {
      return t.status === "正在导出";
    });
  }

  function schedulePoll() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function () {
      renderTable();
      if (!hasProcessing()) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }, 2000);
  }

  if (tbody) {
    tbody.addEventListener("click", function (e) {
      var btn = e.target.closest(".js-exp-download");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var res = Store.download(id);
      if (res.ok) {
        if (M.notify) M.notify("已开始下载 Excel 文件", "success");
        else M.toast("已开始下载 Excel 文件");
      } else {
        if (M.notify) M.notify(res.message || "下载失败", "error");
        else M.toast(res.message || "下载失败");
      }
    });
  }

  var qBtn = document.getElementById("expQuery");
  if (qBtn) {
    qBtn.addEventListener("click", function () {
      if (pager) pager.setPage(1);
      renderTable();
    });
  }

  var resetBtn = document.getElementById("expReset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      resetFilters();
      if (pager) pager.setPage(1);
      renderTable();
    });
  }

  if (window.AdminPager && pagerMount) {
    pager = window.AdminPager.create({
      mount: pagerMount,
      pageSize: 10,
      onChange: renderTable
    });
  }

  Store.onChange(function () {
    renderTable();
    if (hasProcessing()) schedulePoll();
  });

  applyUrlFilters();
  renderTable();
  if (hasProcessing()) schedulePoll();
})();
