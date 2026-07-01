/**
 * 后台全局筛选工具栏 · 查询 / 重置
 */
(function (global) {
  var queryHandlers = {};
  var resetHandlers = {};
  var TOOLBAR_SEL =
    ".admin-toolbar, .cr-toolbar, .sr-filter-toolbar, .ord-filter-toolbar, .kyc-filter-toolbar, .wl-filter-toolbar, .exp-tasks-filter, .admin-log-filter-row, .sw-filter-toolbar, [data-admin-filter-toolbar]";

  function toast(msg) {
    if (global.AdminModal && global.AdminModal.toast) global.AdminModal.toast(msg);
  }

  function findToolbar(btn) {
    return btn.closest(TOOLBAR_SEL);
  }

  function btnText(btn) {
    return (btn.textContent || "").replace(/\s+/g, "");
  }

  function isQueryBtn(btn) {
    if (btn.dataset.adminFilterSkip) return false;
    if (!btn.classList.contains("ant-btn-primary")) return false;
    return /查询/.test(btnText(btn));
  }

  function isResetBtn(btn) {
    if (btn.dataset.adminFilterSkip) return false;
    if (btn.classList.contains("ant-btn-primary")) return false;
    var text = btnText(btn);
    var id = btn.id || "";
    if (!/重置/.test(text)) return false;
    if (/演示|支付密码|密码|Demo|demo/i.test(text + id)) return false;
    return true;
  }

  function dispatchChange(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function syncEnhanced(root) {
    if (global.AdminFormControls) {
      root.querySelectorAll('select[data-admin-control-enhanced="select"]').forEach(function (s) {
        global.AdminFormControls.refreshSelect(s);
      });
      root.querySelectorAll(".admin-input-shell").forEach(function (shell) {
        var input = shell.querySelector("input, textarea");
        var clearBtn = shell.querySelector(".admin-input-clear");
        if (clearBtn && input) clearBtn.hidden = !input.value;
      });
    }
    if (global.AdminDatePicker && global.AdminDatePicker.syncIn) {
      global.AdminDatePicker.syncIn(root);
    }
  }

  function resetFields(root) {
    if (!root) return;
    root.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (el.type === "button" || el.type === "submit" || el.type === "file" || el.type === "hidden") return;
      if (el.classList.contains("admin-dp-display") || el.classList.contains("admin-dp-display-start") || el.classList.contains("admin-dp-display-end")) return;
      if (el.tagName === "SELECT") {
        el.selectedIndex = 0;
      } else if (el.type === "checkbox" || el.type === "radio") {
        el.checked = el.defaultChecked;
      } else {
        el.value = "";
      }
      dispatchChange(el);
    });
    syncEnhanced(root);
  }

  function resetPager(root) {
    var panel = root.closest(".admin-tab-panel") || root.closest("main") || root;
    var pg1 = panel.querySelector('.admin-pager-pages button[data-pg="1"]');
    if (pg1 && !pg1.disabled) pg1.click();
  }

  function onQuery(id, fn) {
    if (id) queryHandlers[id] = fn;
  }

  function onReset(id, fn) {
    if (id) resetHandlers[id] = fn;
  }

  function handleQuery(btn, toolbar) {
    var fn = btn.id && queryHandlers[btn.id];
    if (fn) {
      fn(btn, toolbar);
      return;
    }
    resetPager(toolbar);
    toast("筛选已应用");
    toolbar.dispatchEvent(
      new CustomEvent("admin:filter-query", { bubbles: true, detail: { toolbar: toolbar, button: btn } })
    );
  }

  function handleReset(btn, toolbar) {
    var fn = btn.id && resetHandlers[btn.id];
    if (fn && fn._skipAutoReset) {
      fn(btn, toolbar);
      return;
    }
    resetFields(toolbar);
    if (fn) {
      fn(btn, toolbar);
      return;
    }
    resetPager(toolbar);
    toast("筛选已重置");
    toolbar.dispatchEvent(
      new CustomEvent("admin:filter-reset", { bubbles: true, detail: { toolbar: toolbar, button: btn } })
    );
  }

  function bindButton(btn) {
    if (btn.dataset.adminFilterBound) return;
    var toolbar = findToolbar(btn);
    if (!toolbar) return;
    btn.dataset.adminFilterBound = "1";
    if (isQueryBtn(btn)) {
      btn.addEventListener("click", function () {
        handleQuery(btn, toolbar);
      });
    } else if (isResetBtn(btn)) {
      btn.addEventListener("click", function () {
        handleReset(btn, toolbar);
      });
    }
  }

  function boot(root) {
    root = root || document;
    root.querySelectorAll(".admin-app button.ant-btn, main.admin-content button.ant-btn").forEach(function (btn) {
      if (isQueryBtn(btn) || isResetBtn(btn)) bindButton(btn);
    });
  }

  function watchModals() {
    var modalRoot = document.getElementById("admin-fl-modal-root");
    if (!modalRoot || modalRoot._adminFilterObs) return;
    modalRoot._adminFilterObs = true;
    new MutationObserver(function () {
      boot(modalRoot);
    }).observe(modalRoot, { childList: true, subtree: true });
  }

  global.AdminFilterToolbar = {
    boot: boot,
    onQuery: onQuery,
    onReset: onReset,
    resetFields: resetFields,
    syncEnhanced: syncEnhanced,
    findToolbar: findToolbar
  };

  if (typeof document !== "undefined") {
    function schedule() {
      boot(document);
      watchModals();
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", schedule);
    } else {
      schedule();
    }
    global.addEventListener("load", function () {
      boot(document);
    });
  }
})(typeof window !== "undefined" ? window : this);
