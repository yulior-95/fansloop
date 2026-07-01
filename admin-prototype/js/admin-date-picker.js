/**
 * 后台全局日期 / 日期时间选择器（Ant Design 视觉 + 快捷范围）
 * 自动增强 input[type=date]、input[type=datetime-local]
 */
(function (global) {
  var CSS_ID = "admin-date-picker-css";
  var PLACEHOLDER_DATE = "请选择日期";
  var PLACEHOLDER_DATETIME = "请选择日期时间";
  var RANGE_PRESETS = [
    { key: "today", label: "今天" },
    { key: "yesterday", label: "昨天" },
    { key: "last7", label: "最近 7 天" },
    { key: "last30", label: "最近 30 天" },
    { key: "thisMonth", label: "本月" },
    { key: "lastMonth", label: "上月" }
  ];
  var SINGLE_PRESETS = [
    { key: "today", label: "今天" },
    { key: "yesterday", label: "昨天" }
  ];

  var openDropdown = null;

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function toDateOnly(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function toDateTimeLocal(d) {
    return toDateOnly(d) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function parseInputValue(val, withTime) {
    if (!val) return null;
    var d = withTime ? new Date(val) : new Date(val + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }

  function displayValue(val, withTime) {
    if (!val) return "";
    if (!withTime) return val;
    return val.replace("T", " ").slice(0, 16);
  }

  function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }

  function addDays(d, n) {
    var x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  function addMonths(d, n) {
    return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
  }

  function today() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function presetRange(key) {
    var t = today();
    switch (key) {
      case "today":
        return [t, t];
      case "yesterday":
        var y = addDays(t, -1);
        return [y, y];
      case "last7":
        return [addDays(t, -6), t];
      case "last30":
        return [addDays(t, -29), t];
      case "thisMonth":
        return [startOfMonth(t), endOfMonth(t)];
      case "lastMonth":
        var lm = addMonths(t, -1);
        return [startOfMonth(lm), endOfMonth(lm)];
      default:
        return [t, t];
    }
  }

  function presetSingle(key) {
    return presetRange(key)[0];
  }

  function formatForInput(d, withTime) {
    if (withTime) {
      var n = new Date();
      d.setHours(n.getHours(), n.getMinutes(), 0, 0);
      return toDateTimeLocal(d);
    }
    return toDateOnly(d);
  }

  function setNativeValue(input, value) {
    input.value = value || "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var link = document.createElement("link");
    link.id = CSS_ID;
    link.rel = "stylesheet";
    link.href = "css/admin-date-picker.css";
    document.head.appendChild(link);
  }

  function closeDropdown() {
    if (openDropdown) {
      openDropdown.classList.remove("is-open");
      openDropdown = null;
    }
    document.querySelectorAll(".admin-dp-panel").forEach(function (p) {
      p.remove();
    });
  }

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".admin-dp") && !e.target.closest(".admin-dp-panel")) {
      closeDropdown();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDropdown();
  });

  function buildCalendar(monthDate, withTime, selectedStart, selectedEnd, onPick) {
    var y = monthDate.getFullYear();
    var m = monthDate.getMonth();
    var first = new Date(y, m, 1);
    var startWeek = first.getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var html =
      '<div class="admin-dp-cal-head">' +
      '<button type="button" class="admin-dp-cal-nav" data-nav="-1"><i class="fa-solid fa-chevron-left"></i></button>' +
      "<span>" +
      y +
      "年" +
      pad(m + 1) +
      "月</span>" +
      '<button type="button" class="admin-dp-cal-nav" data-nav="1"><i class="fa-solid fa-chevron-right"></i></button>' +
      "</div>" +
      '<div class="admin-dp-cal-week">' +
      ["日", "一", "二", "三", "四", "五", "六"].map(function (w) {
        return "<span>" + w + "</span>";
      }).join("") +
      "</div>" +
      '<div class="admin-dp-cal-days">';

    for (var i = 0; i < startWeek; i++) html += '<span class="admin-dp-day is-empty"></span>';
    for (var day = 1; day <= daysInMonth; day++) {
      var cur = new Date(y, m, day);
      var iso = toDateOnly(cur);
      var cls = "admin-dp-day";
      if (selectedStart && iso === selectedStart) cls += " is-selected";
      if (selectedEnd && iso === selectedEnd) cls += " is-selected";
      if (selectedStart && selectedEnd && iso >= selectedStart && iso <= selectedEnd) cls += " in-range";
      html += '<button type="button" class="' + cls + '" data-day="' + iso + '">' + day + "</button>";
    }
    html += "</div>";
    if (withTime) {
      html +=
        '<div class="admin-dp-time"><label>时间</label>' +
        '<input type="time" class="ant-input admin-dp-time-input" value="' +
        (selectedStart && selectedStart.indexOf("T") > 0 ? selectedStart.split("T")[1] : "00:00") +
        '"></div>';
    }
    var wrap = document.createElement("div");
    wrap.className = "admin-dp-calendar";
    wrap.innerHTML = html;
    wrap.addEventListener("click", function (e) {
      var nav = e.target.closest("[data-nav]");
      if (nav) {
        e.stopPropagation();
        var delta = parseInt(nav.getAttribute("data-nav"), 10);
        var next = new Date(y, m + delta, 1);
        var parent = wrap.parentNode;
        var newCal = buildCalendar(next, withTime, selectedStart, selectedEnd, onPick);
        parent.replaceChild(newCal, wrap);
        return;
      }
      var btn = e.target.closest("[data-day]");
      if (!btn) return;
      e.stopPropagation();
      onPick(btn.getAttribute("data-day"), wrap.querySelector(".admin-dp-time-input"));
    });
    return wrap;
  }

  function openPanel(anchor, options) {
    closeDropdown();
    var panel = document.createElement("div");
    panel.className = "admin-dp-panel ant-picker-dropdown";
    panel.innerHTML = '<div class="admin-dp-panel-inner"></div>';
    var inner = panel.querySelector(".admin-dp-panel-inner");
    var presets = options.isRange ? RANGE_PRESETS : SINGLE_PRESETS;
    var presetCol = document.createElement("ul");
    presetCol.className = "admin-dp-presets";
    presets.forEach(function (p) {
      var li = document.createElement("li");
      li.textContent = p.label;
      li.setAttribute("data-preset", p.key);
      presetCol.appendChild(li);
    });
    inner.appendChild(presetCol);

    var calHost = document.createElement("div");
    calHost.className = "admin-dp-cal-host";
    inner.appendChild(calHost);

    function renderCal() {
      calHost.innerHTML = "";
      calHost.appendChild(
        buildCalendar(
          options.viewMonth || today(),
          options.withTime,
          options.getStart && options.getStart(),
          options.getEnd && options.getEnd(),
          function (day, timeInput) {
            options.onPickDay(day, timeInput ? timeInput.value : null);
            renderCal();
          }
        )
      );
    }
    renderCal();

    presetCol.addEventListener("click", function (e) {
      var li = e.target.closest("[data-preset]");
      if (!li) return;
      e.stopPropagation();
      options.onPreset(li.getAttribute("data-preset"));
      renderCal();
    });

    document.body.appendChild(panel);
    var rect = anchor.getBoundingClientRect();
    panel.style.top = rect.bottom + window.scrollY + 4 + "px";
    panel.style.left = Math.min(rect.left + window.scrollX, window.innerWidth - panel.offsetWidth - 8) + "px";
    anchor.classList.add("is-open");
    openDropdown = anchor;

    return panel;
  }

  function enhanceSingle(native) {
    var withTime = native.type === "datetime-local";
    var ph = withTime ? PLACEHOLDER_DATETIME : PLACEHOLDER_DATE;
    native.classList.add("admin-dp-native");
    native.setAttribute("data-admin-date-enhanced", "1");

    var wrap = document.createElement("div");
    wrap.className = "admin-dp ant-picker" + (withTime ? " admin-dp--datetime" : "");
    wrap.innerHTML =
      '<div class="ant-picker-input">' +
      '<input type="text" class="admin-dp-display ant-input" readonly placeholder="' +
      ph +
      '" autocomplete="off">' +
      "</div>" +
      '<span class="ant-picker-suffix"><i class="fa-regular fa-calendar"></i></span>' +
      '<button type="button" class="admin-dp-clear" title="清除" hidden><i class="fa-solid fa-circle-xmark"></i></button>';

    var display = wrap.querySelector(".admin-dp-display");
    var clearBtn = wrap.querySelector(".admin-dp-clear");

    function syncFromNative() {
      var v = native.value;
      display.value = displayValue(v, withTime);
      clearBtn.hidden = !v;
      if (!v) display.setAttribute("placeholder", ph);
    }

    function applyDate(d) {
      var val = formatForInput(d, withTime);
      setNativeValue(native, val);
      syncFromNative();
      closeDropdown();
    }

    syncFromNative();
    native.parentNode.insertBefore(wrap, native);

    function togglePanel() {
      if (wrap.classList.contains("is-open")) {
        closeDropdown();
        return;
      }
      openPanel(wrap, {
        isRange: false,
        withTime: withTime,
        viewMonth: parseInputValue(native.value, withTime) || today(),
        getStart: function () {
          return native.value ? native.value.split("T")[0] : null;
        },
        getEnd: null,
        onPreset: function (key) {
          applyDate(presetSingle(key));
        },
        onPickDay: function (day, time) {
          var val = withTime ? day + "T" + (time || "00:00") : day;
          setNativeValue(native, val);
          syncFromNative();
          closeDropdown();
        }
      });
    }

    wrap.addEventListener("click", function (e) {
      if (e.target.closest(".admin-dp-clear")) {
        e.stopPropagation();
        setNativeValue(native, "");
        syncFromNative();
        closeDropdown();
        return;
      }
      togglePanel();
    });
  }

  function enhanceRange(startNative, endNative) {
    var withTime = startNative.type === "datetime-local";
    var ph = withTime ? PLACEHOLDER_DATETIME : PLACEHOLDER_DATE;
    startNative.classList.add("admin-dp-native");
    endNative.classList.add("admin-dp-native");
    startNative.setAttribute("data-admin-date-enhanced", "1");
    endNative.setAttribute("data-admin-date-enhanced", "1");

    var wrap = document.createElement("div");
    wrap.className = "admin-dp ant-picker ant-picker-range" + (withTime ? " admin-dp--datetime" : "");
    wrap.innerHTML =
      '<div class="ant-picker-input ant-picker-input-active">' +
      '<input type="text" class="admin-dp-display-start ant-input" readonly placeholder="' +
      ph +
      '" autocomplete="off">' +
      "</div>" +
      '<span class="ant-picker-range-separator"><i class="fa-solid fa-arrow-right"></i></span>' +
      '<div class="ant-picker-input">' +
      '<input type="text" class="admin-dp-display-end ant-input" readonly placeholder="' +
      ph +
      '" autocomplete="off">' +
      "</div>" +
      '<span class="ant-picker-suffix"><i class="fa-regular fa-calendar"></i></span>' +
      '<button type="button" class="admin-dp-clear" title="清除" hidden><i class="fa-solid fa-circle-xmark"></i></button>';

    var displayStart = wrap.querySelector(".admin-dp-display-start");
    var displayEnd = wrap.querySelector(".admin-dp-display-end");
    var clearBtn = wrap.querySelector(".admin-dp-clear");
    var pickingEnd = false;

    function syncFromNative() {
      displayStart.value = displayValue(startNative.value, withTime);
      displayEnd.value = displayValue(endNative.value, withTime);
      clearBtn.hidden = !startNative.value && !endNative.value;
    }

    function applyRange(d1, d2) {
      var a = formatForInput(d1, withTime);
      var b = formatForInput(d2, withTime);
      if (a > b) {
        var t = a;
        a = b;
        b = t;
      }
      setNativeValue(startNative, a);
      setNativeValue(endNative, b);
      syncFromNative();
      closeDropdown();
    }

    syncFromNative();
    startNative.parentNode.insertBefore(wrap, startNative);
    var sep = startNative.nextElementSibling;
    if (isRangeSeparator(sep)) sep.classList.add("admin-dp-sep-hidden");

    function togglePanel(focusEnd) {
      pickingEnd = !!focusEnd;
      if (wrap.classList.contains("is-open")) {
        closeDropdown();
        return;
      }
      openPanel(wrap, {
        isRange: true,
        withTime: withTime,
        viewMonth: parseInputValue(startNative.value, withTime) || today(),
        getStart: function () {
          return startNative.value ? startNative.value.split("T")[0] : null;
        },
        getEnd: function () {
          return endNative.value ? endNative.value.split("T")[0] : null;
        },
        onPreset: function (key) {
          var r = presetRange(key);
          applyRange(r[0], r[1]);
        },
        onPickDay: function (day, time) {
          var val = withTime ? day + "T" + (time || "00:00") : day;
          if (!pickingEnd && !startNative.value) {
            setNativeValue(startNative, val);
            pickingEnd = true;
            syncFromNative();
            return;
          }
          if (!pickingEnd) {
            setNativeValue(startNative, val);
            pickingEnd = true;
            syncFromNative();
            return;
          }
          setNativeValue(endNative, val);
          if (startNative.value && endNative.value && startNative.value > endNative.value) {
            var t = startNative.value;
            setNativeValue(startNative, endNative.value);
            setNativeValue(endNative, t);
          }
          syncFromNative();
          closeDropdown();
        }
      });
    }

    wrap.addEventListener("click", function (e) {
      if (e.target.closest(".admin-dp-clear")) {
        e.stopPropagation();
        setNativeValue(startNative, "");
        setNativeValue(endNative, "");
        syncFromNative();
        closeDropdown();
        return;
      }
      if (e.target.closest(".admin-dp-display-end")) togglePanel(true);
      else togglePanel(false);
    });
  }

  function isDateInput(el) {
    return el && (el.type === "date" || el.type === "datetime-local") && !el.dataset.adminDateEnhanced;
  }

  function isRangeSeparator(el) {
    if (!el) return false;
    var t = (el.textContent || "").trim();
    return t === "—" || t === "-" || t === "~" || t === "至";
  }

  function findRangePartner(input, list, used) {
    var next = input.nextElementSibling;
    if (isRangeSeparator(next)) {
      var end = next.nextElementSibling;
      if (isDateInput(end) && end.type === input.type && !used.has(end)) return end;
    }
    if (input.id && /Start$/i.test(input.id)) {
      var endId = input.id.replace(/Start$/i, "End");
      var byId = document.getElementById(endId);
      if (isDateInput(byId) && !used.has(byId)) return byId;
    }
    return null;
  }

  function boot(root) {
    ensureCss();
    root = root || document;
    var scope = root.querySelector ? root : document;
    var inputs = Array.prototype.slice.call(
      scope.querySelectorAll('.admin-app input[type="date"], .admin-app input[type="datetime-local"]')
    );
    inputs = inputs.filter(function (el) {
      return !el.dataset.adminDateEnhanced && el.dataset.adminDate !== "skip" && !el.closest("[data-admin-date=skip]");
    });

    var used = new Set();
    inputs.forEach(function (input) {
      if (used.has(input)) return;
      var partner = findRangePartner(input, inputs, used);
      if (partner) {
        enhanceRange(input, partner);
        used.add(input);
        used.add(partner);
      } else {
        enhanceSingle(input);
        used.add(input);
      }
    });
  }

  function syncIn(root) {
    (root || document).querySelectorAll(".admin-dp").forEach(function (wrap) {
      var withTime = wrap.classList.contains("admin-dp--datetime");
      var ph = withTime ? PLACEHOLDER_DATETIME : PLACEHOLDER_DATE;
      var display = wrap.querySelector(".admin-dp-display");
      var displayStart = wrap.querySelector(".admin-dp-display-start");
      var displayEnd = wrap.querySelector(".admin-dp-display-end");
      var clearBtn = wrap.querySelector(".admin-dp-clear");
      var natives = wrap.querySelectorAll('input[type="date"], input[type="datetime-local"]');
      if (displayStart && displayEnd && natives.length >= 2) {
        displayStart.value = displayValue(natives[0].value, withTime);
        displayEnd.value = displayValue(natives[1].value, withTime);
        if (!natives[0].value) displayStart.setAttribute("placeholder", ph);
        if (!natives[1].value) displayEnd.setAttribute("placeholder", ph);
        if (clearBtn) clearBtn.hidden = !natives[0].value && !natives[1].value;
      } else if (display && natives[0]) {
        display.value = displayValue(natives[0].value, withTime);
        if (!natives[0].value) display.setAttribute("placeholder", ph);
        if (clearBtn) clearBtn.hidden = !natives[0].value;
      }
    });
  }

  global.AdminDatePicker = {
    boot: boot,
    enhanceSingle: enhanceSingle,
    enhanceRange: enhanceRange,
    syncIn: syncIn
  };

  if (typeof document !== "undefined") {
    function schedule() {
      boot(document);
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", schedule);
    } else {
      schedule();
    }
  }
})(typeof window !== "undefined" ? window : this);
