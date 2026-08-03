/**
 * 运营后台 · 导出任务队列（localStorage 原型）
 * 各页 AdminExport.confirm() 创建任务，在 export-tasks.html 查看与下载。
 */
(function (global) {
  var LS_TASKS = "fl_admin_export_tasks_v1";
  var LS_RETENTION = "fl_admin_export_retention_min_v1";
  var DEFAULT_RETENTION_MIN = 60;
  var PROCESS_MS_MIN = 2200;
  var PROCESS_MS_MAX = 5200;

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function nowStr(d) {
    var dt = d || new Date();
    return (
      dt.getFullYear() +
      "-" +
      pad(dt.getMonth() + 1) +
      "-" +
      pad(dt.getDate()) +
      " " +
      pad(dt.getHours()) +
      ":" +
      pad(dt.getMinutes()) +
      ":" +
      pad(dt.getSeconds())
    );
  }

  function getRetentionMin() {
    try {
      var v = parseInt(localStorage.getItem(LS_RETENTION), 10);
      if (isFinite(v) && v > 0) return v;
    } catch (e) { /* ignore */ }
    return DEFAULT_RETENTION_MIN;
  }

  function setRetentionMin(minutes) {
    var v = parseInt(minutes, 10);
    if (!isFinite(v) || v <= 0) return;
    try {
      localStorage.setItem(LS_RETENTION, String(v));
    } catch (e) { /* ignore */ }
  }

  function getExporter() {
    var span = document.querySelector(".admin-header-user span");
    if (span && span.textContent) return String(span.textContent).trim();
    if (global.FLAdminSession && global.FLAdminSession.roleLabel) {
      return global.FLAdminSession.roleLabel();
    }
    return "运营账号";
  }

  function loadTasks() {
    try {
      var raw = localStorage.getItem(LS_TASKS);
      if (raw) {
        var list = JSON.parse(raw);
        if (Array.isArray(list)) return list;
      }
    } catch (e) { /* ignore */ }
    return seedTasks();
  }

  function saveTasks(list) {
    try {
      localStorage.setItem(LS_TASKS, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  function fixTaskId(day, seq) {
    var s = String(seq);
    while (s.length < 3) s = "0" + s;
    return "EXP" + day + s;
  }

  function nextTaskId() {
    var d = new Date();
    var day =
      String(d.getFullYear()) +
      pad(d.getMonth() + 1) +
      pad(d.getDate());
    var list = loadTasks();
    var max = 0;
    list.forEach(function (t) {
      var m = String(t.id || "").match(/^EXP(\d{8})(\d+)$/);
      if (m && m[1] === day) max = Math.max(max, parseInt(m[2], 10) || 0);
    });
    return fixTaskId(day, max + 1);
  }

  function seedTasks() {
    var base = new Date();
    base.setMinutes(base.getMinutes() - 25);
    var t1 = new Date(base.getTime());
    var del1 = new Date(t1.getTime() + getRetentionMin() * 60000);
    var t2 = new Date(base.getTime() - 8 * 60000);
    var del2 = new Date(t2.getTime() + getRetentionMin() * 60000);
    var t3 = new Date(base.getTime() - 3 * 60000);
    var del3 = new Date(t3.getTime() + getRetentionMin() * 60000);
    var list = [
      {
        id: fixTaskId(
          String(t1.getFullYear()) + pad(t1.getMonth() + 1) + pad(t1.getDate()),
          1
        ),
        exportType: "充值订单",
        conditions: "订单状态：全部；下单时间：近一周",
        exportTime: nowStr(t1),
        deleteTime: nowStr(del1),
        exporter: "财务",
        status: "导出成功",
        fileName: "充值订单_20260623.xlsx",
        sourcePage: "orders-recharge.html",
        doneAt: nowStr(new Date(t1.getTime() + 4000))
      },
      {
        id: fixTaskId(
          String(t2.getFullYear()) + pad(t2.getMonth() + 1) + pad(t2.getDate()),
          2
        ),
        exportType: "提现订单",
        conditions: "用户 UID：882910；订单状态：处理中；下单时间：近一周",
        exportTime: nowStr(t2),
        deleteTime: nowStr(del2),
        exporter: "财务",
        status: "导出失败",
        fileName: "",
        sourcePage: "orders-withdraw.html",
        errorMsg: "服务端生成 Excel 超时",
        doneAt: nowStr(new Date(t2.getTime() + 6000))
      },
      {
        id: fixTaskId(
          String(t3.getFullYear()) + pad(t3.getMonth() + 1) + pad(t3.getDate()),
          3
        ),
        exportType: "账变记录",
        conditions: "账变类型：全部",
        exportTime: nowStr(t3),
        deleteTime: nowStr(del3),
        exporter: "超级管理员",
        status: "正在导出",
        fileName: "",
        sourcePage: "users-ledger.html"
      }
    ];
    saveTasks(list);
    return list;
  }

  function isEmptyConditionValue(val) {
    var s = String(val == null ? "" : val).trim();
    return !s || s === "—" || s === "-";
  }

  function scrubConditionsText(str) {
    if (!str || str === "—") return "—";
    var parts = String(str)
      .split("；")
      .map(function (part) {
        part = part.trim();
        if (!part) return "";
        var idx = part.indexOf("：");
        if (idx < 0) return part;
        var label = part.slice(0, idx);
        var val = part.slice(idx + 1).trim();
        if (isEmptyConditionValue(val)) return "";
        return label + "：" + val;
      })
      .filter(Boolean);
    return parts.length ? parts.join("；") : "—";
  }

  function formatConditions(items) {
    if (!items) return "—";
    if (typeof items === "string") return scrubConditionsText(items);
    if (!Array.isArray(items)) return "—";
    var parts = items
      .map(function (it) {
        if (!it) return "";
        var label = it.label != null ? String(it.label) : "";
        var val = it.value != null ? String(it.value) : "";
        if (it.el) {
          val = it.el.value != null ? String(it.el.value).trim() : "";
        }
        if (isEmptyConditionValue(val)) return "";
        return label + "：" + val;
      })
      .filter(Boolean);
    return parts.length ? parts.join("；") : "—";
  }

  function conditionsFromElements(pairs) {
    return formatConditions(pairs);
  }

  function isExpired(task) {
    if (!task || !task.deleteTime) return false;
    var dt = new Date(String(task.deleteTime).replace(/-/g, "/"));
    return !isNaN(dt.getTime()) && Date.now() > dt.getTime();
  }

  function displayStatus(task) {
    if (!task) return "—";
    if (task.status === "导出成功" && isExpired(task)) return "已过期";
    return task.status || "—";
  }

  function createTask(opts) {
    opts = opts || {};
    var exportType = opts.exportType || "数据导出";
    var conditions =
      opts.conditions != null
        ? formatConditions(opts.conditions)
        : opts.conditionsText || "—";
    var now = new Date();
    var deleteAt = new Date(now.getTime() + getRetentionMin() * 60000);
    var task = {
      id: nextTaskId(),
      exportType: exportType,
      conditions: conditions,
      exportTime: nowStr(now),
      deleteTime: nowStr(deleteAt),
      exporter: opts.exporter || getExporter(),
      status: "正在导出",
      fileName: "",
      sourcePage: opts.sourcePage || "",
      errorMsg: ""
    };
    var safeName = exportType.replace(/[\\/:*?"<>|]/g, "_");
    var stamp =
      String(now.getFullYear()) +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes());
    task.fileName = safeName + "_" + stamp + ".xlsx";

    var list = loadTasks();
    list.unshift(task);
    saveTasks(list);

    var delay =
      PROCESS_MS_MIN +
      Math.floor(Math.random() * (PROCESS_MS_MAX - PROCESS_MS_MIN));
    var shouldFail = opts.simulateFail === true;

    setTimeout(function () {
      var tasks = loadTasks();
      var idx = -1;
      tasks.forEach(function (t, i) {
        if (t.id === task.id) idx = i;
      });
      if (idx < 0) return;
      var cur = tasks[idx];
      if (cur.status !== "正在导出") return;
      if (shouldFail) {
        cur.status = "导出失败";
        cur.errorMsg = opts.failMessage || "导出服务异常，请稍后重试";
        cur.fileName = "";
      } else {
        cur.status = "导出成功";
        cur.doneAt = nowStr();
      }
      tasks[idx] = cur;
      saveTasks(tasks);
      if (global.AdminExportTasks && global.AdminExportTasks._notifyChange) {
        global.AdminExportTasks._notifyChange();
      }
    }, delay);

    return task;
  }

  function findTask(id) {
    return loadTasks().filter(function (t) {
      return t.id === id;
    })[0];
  }

  function toExcelBlob(task) {
    var rows = [
      ["导出任务单号", task.id],
      ["导出类型", task.exportType],
      ["导出条件", task.conditions],
      ["导出时间", task.exportTime],
      ["导出人", task.exporter],
      [],
      ["说明", "GOODFANS 运营后台导出文件（原型演示）"]
    ];
    var xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<?mso-application progid="Excel.Sheet"?>\n' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ' +
      'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n' +
      '<Worksheet ss:Name="导出数据"><Table>\n';
    rows.forEach(function (row) {
      xml += "<Row>";
      row.forEach(function (cell) {
        xml +=
          '<Cell><Data ss:Type="String">' +
          String(cell || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;") +
          "</Data></Cell>";
      });
      xml += "</Row>\n";
    });
    xml += "</Table></Worksheet></Workbook>";
    return new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  }

  function downloadTask(id) {
    var task = findTask(id);
    if (!task) return { ok: false, message: "任务不存在" };
    if (task.status !== "导出成功") return { ok: false, message: "任务尚未完成" };
    if (isExpired(task)) return { ok: false, message: "文件已过期删除" };
    var blob = toExcelBlob(task);
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = task.fileName || task.exportType + ".xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 800);
    return { ok: true };
  }

  function showExportSuccess(exportType) {
    var M = global.AdminModal;
    if (!M) return;
    var type = exportType || "数据导出";
    M.open({
      title: "添加成功",
      body:
        "<p style='margin:0;color:rgba(0,0,0,.85)'>已添加到导出任务列表，导出完成后可以下载</p>",
      footer: [
        { text: "关闭", onClick: M.close },
        {
          text: "查看",
          primary: true,
          onClick: function () {
            M.close();
            global.location.href =
              "export-tasks.html?type=" + encodeURIComponent(type);
          }
        }
      ]
    });
  }

  function runExportAfterVerify(opts) {
    var conditions = opts.conditions;
    if (typeof opts.getConditions === "function") {
      conditions = opts.getConditions();
    }
    var exportType = opts.exportType || "数据导出";
    createTask({
      exportType: exportType,
      conditions: conditions,
      conditionsText: opts.conditionsText,
      sourcePage: opts.sourcePage || global.location.pathname.split("/").pop(),
      simulateFail: opts.simulateFail,
      failMessage: opts.failMessage
    });
    showExportSuccess(exportType);
  }

  function confirm(opts) {
    var M = global.AdminModal;
    if (!M) return null;
    opts = opts || {};
    if (!M.confirmGoogle) {
      runExportAfterVerify(opts);
      return null;
    }
    M.confirmGoogle({
      title: "谷歌验证",
      message:
        opts.verifyMessage ||
        "导出数据需输入谷歌验证器中的 6 位验证码以继续。",
      inlineError: true,
      onVerified: function () {
        runExportAfterVerify(opts);
      }
    });
    return null;
  }

  var listeners = [];

  function onChange(fn) {
    if (typeof fn === "function") listeners.push(fn);
  }

  function _notifyChange() {
    listeners.forEach(function (fn) {
      try {
        fn();
      } catch (e) { /* ignore */ }
    });
  }

  global.AdminExportTasks = {
    load: loadTasks,
    save: saveTasks,
    create: createTask,
    find: findTask,
    download: downloadTask,
    formatConditions: formatConditions,
    scrubConditionsText: scrubConditionsText,
    displayConditions: scrubConditionsText,
    conditionsFromElements: conditionsFromElements,
    getRetentionMin: getRetentionMin,
    setRetentionMin: setRetentionMin,
    isExpired: isExpired,
    displayStatus: displayStatus,
    onChange: onChange,
    _notifyChange: _notifyChange
  };

  global.AdminExport = {
    confirm: confirm,
    conditions: conditionsFromElements,
    create: createTask
  };

  function resumePendingExports() {
    var tasks = loadTasks();
    var changed = false;
    tasks.forEach(function (t) {
      if (t.status !== "正在导出") return;
      if (t._resumeScheduled) return;
      t._resumeScheduled = true;
      changed = true;
      var delay = PROCESS_MS_MIN + Math.floor(Math.random() * (PROCESS_MS_MAX - PROCESS_MS_MIN));
      setTimeout(function () {
        var list = loadTasks();
        var idx = -1;
        list.forEach(function (row, i) {
          if (row.id === t.id) idx = i;
        });
        if (idx < 0) return;
        var cur = list[idx];
        if (cur.status !== "正在导出") return;
        cur.status = "导出成功";
        cur.doneAt = nowStr();
        if (!cur.fileName) {
          cur.fileName = String(cur.exportType || "导出").replace(/[\\/:*?"<>|]/g, "_") + ".xlsx";
        }
        list[idx] = cur;
        saveTasks(list);
        _notifyChange();
      }, delay);
    });
    if (changed) saveTasks(tasks);
  }

  resumePendingExports();
})(typeof window !== "undefined" ? window : this);
