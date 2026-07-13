/**
 * 后台全局表单控件：Select / Input（Ant Design 4 视觉与交互）
 */
(function (global) {
  var CSS_ID = "admin-form-controls-css";
  var openSelect = null;

  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var link = document.createElement("link");
    link.id = CSS_ID;
    link.rel = "stylesheet";
    link.href = "css/admin-form-controls.css?v=2";
    document.head.appendChild(link);
  }

  function shouldSkip(el) {
    if (!el || el.dataset.adminControl === "skip" || el.dataset.adminControlEnhanced) return true;
    if (el.closest("[data-admin-control=skip]")) return true;
    if (el.closest(".admin-dp, .admin-ant-select, .admin-input-shell")) return true;
    return false;
  }

  function isSearchLike(input) {
    var ph = (input.getAttribute("placeholder") || "").toLowerCase();
    return /搜索|查询|search|uid|邮箱|账号|前缀|关键词|昵称|姓名/.test(ph);
  }

  function dispatchChange(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function positionDropdown(panel, wrap) {
    var rect = wrap.getBoundingClientRect();
    var gap = 4;
    panel.style.setProperty("position", "fixed", "important");
    panel.style.setProperty("top", rect.bottom + gap + "px", "important");
    panel.style.setProperty("left", rect.left + "px", "important");
    panel.style.setProperty("min-width", Math.max(rect.width, 120) + "px", "important");
    panel.style.setProperty("z-index", "10200", "important");
    panel.style.setProperty("display", "block", "important");
    var panelH = panel.offsetHeight || 0;
    if (panelH && rect.bottom + gap + panelH > window.innerHeight - 8) {
      var top = rect.top - panelH - gap;
      panel.style.setProperty("top", Math.max(8, top) + "px", "important");
    }
  }

  function unbindDropdownReposition() {
    if (!openSelect || !openSelect._onReposition) return;
    document.querySelectorAll(".admin-content").forEach(function (el) {
      el.removeEventListener("scroll", openSelect._onReposition);
    });
    window.removeEventListener("resize", openSelect._onReposition);
    openSelect._onReposition = null;
  }

  function bindDropdownReposition() {
    if (!openSelect) return;
    unbindDropdownReposition();
    openSelect._onReposition = function () {
      if (openSelect && openSelect.panel && openSelect.wrap) {
        positionDropdown(openSelect.panel, openSelect.wrap);
      }
    };
    document.querySelectorAll(".admin-content").forEach(function (el) {
      el.addEventListener("scroll", openSelect._onReposition, { passive: true });
    });
    window.addEventListener("resize", openSelect._onReposition, { passive: true });
  }

  function closeSelectDropdown() {
    if (openSelect) {
      unbindDropdownReposition();
      openSelect.wrap.classList.remove("ant-select-open");
      openSelect = null;
    }
    document.querySelectorAll(".admin-ant-select-dropdown").forEach(function (d) {
      d.remove();
    });
  }

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".admin-ant-select") && !e.target.closest(".admin-ant-select-dropdown")) {
      closeSelectDropdown();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSelectDropdown();
  });

  function syncSelectUi(wrap, native) {
    var item = wrap.querySelector(".ant-select-selection-item");
    var ph = wrap.querySelector(".ant-select-selection-placeholder");
    var opt = native.options[native.selectedIndex];
    var label = opt ? opt.textContent : "";
    var empty = !native.value;
    if (empty) {
      if (item) item.textContent = "";
      if (item) item.style.display = "none";
      if (ph) {
        ph.textContent = wrap._placeholder || "请选择";
        ph.style.display = "";
      }
    } else {
      if (item) {
        item.textContent = label;
        item.style.display = "";
      }
      if (ph) ph.style.display = "none";
    }
    wrap.querySelectorAll(".admin-ant-select-option").forEach(function (node) {
      node.classList.toggle("is-selected", node.dataset.value === native.value);
    });
  }

  function bindSelectLabelGuard(wrap) {
    var labelEl = wrap.closest("label");
    if (!labelEl || labelEl.dataset.adminSelectLabelGuard) return;
    labelEl.dataset.adminSelectLabelGuard = "1";
    labelEl.addEventListener(
      "click",
      function (e) {
        if (e.target.closest(".admin-ant-select") === wrap) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );
  }

  function toggleSelectDropdown(wrap, native) {
    if (wrap.classList.contains("ant-select-open")) closeSelectDropdown();
    else buildSelectDropdown(wrap, native);
  }

  function buildSelectDropdown(wrap, native) {
    closeSelectDropdown();
    var panel = document.createElement("div");
    panel.className = "admin-ant-select-dropdown";
    panel.setAttribute("role", "listbox");
    var inner = document.createElement("div");
    inner.className = "admin-ant-select-dropdown-inner";
    Array.prototype.forEach.call(native.options, function (opt) {
      if (opt.disabled && !opt.value) return;
      var row = document.createElement("div");
      row.className = "admin-ant-select-option";
      row.setAttribute("role", "option");
      row.dataset.value = opt.value;
      row.textContent = opt.textContent;
      if (opt.value === native.value) row.classList.add("is-selected");
      row.addEventListener("mousedown", function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
      row.addEventListener("click", function (e) {
        e.stopPropagation();
        native.value = opt.value;
        dispatchChange(native);
        syncSelectUi(wrap, native);
        closeSelectDropdown();
      });
      inner.appendChild(row);
    });
    panel.appendChild(inner);
    document.body.appendChild(panel);
    positionDropdown(panel, wrap);
    wrap.classList.add("ant-select-open");
    openSelect = { wrap: wrap, panel: panel, native: native };
    bindDropdownReposition();
    requestAnimationFrame(function () {
      if (openSelect && openSelect.panel === panel) positionDropdown(panel, wrap);
    });
  }

  function enhanceSelect(native) {
    if (shouldSkip(native)) return;
    if (native.multiple) return;
    native.classList.add("admin-control-native");
    native.dataset.adminControlEnhanced = "select";

    var first = native.options[0];
    var placeholder = first && first.value === "" ? first.textContent : "请选择";

    var wrap = document.createElement("div");
    wrap.className = "admin-ant-select ant-select ant-select-single ant-select-show-arrow";
    if (native.style.width) wrap.style.width = native.style.width;
    wrap._placeholder = placeholder;
    wrap.innerHTML =
      '<div class="ant-select-selector">' +
      '<span class="ant-select-selection-item" style="display:none"></span>' +
      '<span class="ant-select-selection-placeholder">' +
      placeholder +
      "</span>" +
      "</div>" +
      '<span class="ant-select-arrow" unselectable="on" aria-hidden="true">' +
      '<span class="ant-select-suffix"><i class="fa-solid fa-chevron-down"></i></span></span>';

    native.parentNode.insertBefore(wrap, native);
    wrap.appendChild(native);
    native._adminSelectWrap = wrap;

    syncSelectUi(wrap, native);
    bindSelectLabelGuard(wrap);

    wrap.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      toggleSelectDropdown(wrap, native);
    });

    wrap.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
    });

    native.addEventListener("change", function () {
      syncSelectUi(wrap, native);
    });
  }

  function refreshSelect(native) {
    if (!native || !native._adminSelectWrap) return;
    syncSelectUi(native._adminSelectWrap, native);
  }

  function enhanceInput(native) {
    if (shouldSkip(native)) return;
    var type = (native.getAttribute("type") || "text").toLowerCase();
    if (
      type === "hidden" ||
      type === "date" ||
      type === "datetime-local" ||
      type === "time" ||
      type === "file" ||
      type === "checkbox" ||
      type === "radio" ||
      type === "button" ||
      type === "submit" ||
      type === "reset" ||
      type === "range" ||
      type === "color"
    ) {
      return;
    }
    if (
      native.classList.contains("admin-dp-display") ||
      native.classList.contains("admin-dp-display-start") ||
      native.classList.contains("admin-dp-display-end")
    ) {
      return;
    }
    if (native.closest(".ant-input-affix-wrapper") && !native.closest(".admin-input-shell")) return;
    if (native.closest(".admin-input-shell")) return;

    native.dataset.adminControlEnhanced = "input";
    native.classList.add("ant-input");

    var shell = document.createElement("span");
    shell.className = "ant-input-affix-wrapper admin-input-shell";
    if (native.style.width) shell.style.width = native.style.width;

    var search = isSearchLike(native);
    native.parentNode.insertBefore(shell, native);

    if (search) {
      var prefix = document.createElement("span");
      prefix.className = "ant-input-prefix";
      prefix.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
      shell.appendChild(prefix);
    }

    shell.appendChild(native);

    var clearBtn = document.createElement("span");
    clearBtn.className = "ant-input-suffix admin-input-clear";
    clearBtn.setAttribute("role", "button");
    clearBtn.setAttribute("tabindex", "-1");
    clearBtn.setAttribute("aria-label", "清除");
    clearBtn.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
    clearBtn.hidden = true;
    shell.appendChild(clearBtn);

    function syncClear() {
      clearBtn.hidden = !native.value;
    }

    syncClear();
    native.addEventListener("input", syncClear);
    native.addEventListener("change", syncClear);

    clearBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      native.value = "";
      dispatchChange(native);
      syncClear();
      native.focus();
    });

    shell.addEventListener("click", function (e) {
      if (e.target.closest(".admin-input-clear")) return;
      native.focus();
    });
  }

  function enhanceTextarea(native) {
    if (shouldSkip(native)) return;
    if (native.dataset.adminControlEnhanced) return;
    native.dataset.adminControlEnhanced = "textarea";
    native.classList.add("ant-input");
    var shell = document.createElement("div");
    shell.className = "admin-textarea-shell";
    native.parentNode.insertBefore(shell, native);
    shell.appendChild(native);
  }

  function boot(root) {
    ensureCss();
    var areas = [];
    if (!root || root === document) {
      document.querySelectorAll(".admin-app, #admin-fl-modal-root").forEach(function (a) {
        areas.push(a);
      });
      if (!areas.length) areas.push(document);
    } else {
      areas.push(root);
    }

    areas.forEach(function (area) {
      area.querySelectorAll("select:not([data-admin-control-enhanced])").forEach(function (el) {
        enhanceSelect(el);
      });
      area.querySelectorAll("input:not([data-admin-control-enhanced])").forEach(function (el) {
        enhanceInput(el);
      });
      area.querySelectorAll("textarea:not([data-admin-control-enhanced])").forEach(function (el) {
        enhanceTextarea(el);
      });
      area.querySelectorAll(".ant-input-affix-wrapper:not(.admin-input-shell)").forEach(function (shell) {
        var input = shell.querySelector("input.ant-input:not([data-admin-control-enhanced])");
        if (!input || shouldSkip(input)) return;
        shell.classList.add("admin-input-shell");
        input.dataset.adminControlEnhanced = "input";
        if (!shell.querySelector(".admin-input-clear")) {
          var clearBtn = document.createElement("span");
          clearBtn.className = "ant-input-suffix admin-input-clear";
          clearBtn.setAttribute("role", "button");
          clearBtn.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
          clearBtn.hidden = !input.value;
          clearBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            input.value = "";
            dispatchChange(input);
            clearBtn.hidden = true;
            input.focus();
          });
          input.addEventListener("input", function () {
            clearBtn.hidden = !input.value;
          });
          shell.appendChild(clearBtn);
        }
        if (isSearchLike(input) && !shell.querySelector(".ant-input-prefix")) {
          var prefix = document.createElement("span");
          prefix.className = "ant-input-prefix";
          prefix.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
          shell.insertBefore(prefix, shell.firstChild);
        }
      });
    });
  }

  function watchModals() {
    var modalRoot = document.getElementById("admin-fl-modal-root");
    if (!modalRoot || modalRoot._adminFcObs) return;
    modalRoot._adminFcObs = true;
    new MutationObserver(function () {
      boot(modalRoot);
    }).observe(modalRoot, { childList: true, subtree: true });
  }

  global.AdminFormControls = {
    boot: boot,
    enhanceSelect: enhanceSelect,
    enhanceInput: enhanceInput,
    refreshSelect: refreshSelect,
    closeSelectDropdown: closeSelectDropdown
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
  }
})(typeof window !== "undefined" ? window : this);
