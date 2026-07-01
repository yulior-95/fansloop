/**
 * 运营后台 · 系统通知 / 待办事项（铃铛）
 */
(function (global) {
  var LS_READ = "fl_admin_todos_read_v1";
  var panelEl = null;
  var boundBell = null;

  var TODOS = [
    {
      id: "kyc-pending",
      level: "high",
      levelLabel: "高",
      module: "KYC 审核",
      title: "3 条 KYC 待人工审核",
      desc: "含证件+人脸新提交，请尽快处理避免用户提现受阻",
      href: "kyc-manage.html",
      hash: "",
      time: "10:35"
    },
    {
      id: "content-review",
      level: "high",
      levelLabel: "高",
      module: "内容审核",
      title: "37 条内容待审核",
      desc: "机器置信度不足已入人工队列，含 12 条视频",
      href: "content-review.html",
      time: "09:58"
    },
    {
      id: "withdraw-pending",
      level: "high",
      levelLabel: "高",
      module: "提现订单",
      title: "5 笔提现待审核打款",
      desc: "大额提现需二次确认与谷歌验证",
      href: "orders-withdraw.html",
      time: "09:41"
    },
    {
      id: "announce-audit",
      level: "medium",
      levelLabel: "中",
      module: "系统公告",
      title: "2 条公告待发送审核",
      desc: "运营已提交，等待审核通过后推送",
      href: "system-announcements.html",
      time: "09:12"
    },
    {
      id: "risk-limit",
      level: "medium",
      levelLabel: "中",
      module: "风控告警",
      title: "用户 U8821 接近日提现限额",
      desc: "单日链上提现累计 9,800 USDT，阈值 10,000",
      href: "users-list.html",
      time: "10:22"
    },
    {
      id: "sub-abnormal",
      level: "low",
      levelLabel: "低",
      module: "订阅管理",
      title: "1 条订阅续费异常",
      desc: "链上扣款失败，需跟进用户钱包余额",
      href: "subscriptions.html",
      time: "08:50"
    }
  ];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readIds() {
    try {
      return JSON.parse(localStorage.getItem(LS_READ) || "[]");
    } catch (e) {
      return [];
    }
  }

  function markRead(id) {
    var ids = readIds();
    if (ids.indexOf(id) < 0) ids.push(id);
    try {
      localStorage.setItem(LS_READ, JSON.stringify(ids.slice(-50)));
    } catch (e) { /* ignore */ }
    updateBadge();
    renderPanel();
  }

  function pendingCount() {
    var read = readIds();
    return TODOS.filter(function (t) {
      return read.indexOf(t.id) < 0;
    }).length;
  }

  function levelTag(level, label) {
    var cls = "ant-tag";
    if (level === "high") cls += " ant-tag-red";
    else if (level === "medium") cls += " ant-tag-orange";
    else cls += " ant-tag-blue";
    return '<span class="' + cls + '">' + esc(label) + "</span>";
  }

  function renderPanel() {
    if (!panelEl) return;
    var read = readIds();
    var pending = TODOS.filter(function (t) {
      return read.indexOf(t.id) < 0;
    });
    var done = TODOS.filter(function (t) {
      return read.indexOf(t.id) >= 0;
    });

    var head =
      '<div class="admin-todo-panel-head">' +
      '<strong>待办事项</strong>' +
      '<span class="admin-todo-panel-meta">' +
      (pending.length ? pending.length + " 项待处理" : "已全部处理") +
      "</span></div>";

    function rowHtml(t, isRead) {
      return (
        '<a class="admin-todo-item' +
        (isRead ? " is-read" : "") +
        '" href="' +
        esc(t.href) +
        '" data-todo-id="' +
        esc(t.id) +
        '">' +
        '<div class="admin-todo-item-top">' +
        levelTag(t.level, t.levelLabel) +
        '<span class="admin-todo-module">' +
        esc(t.module) +
        "</span>" +
        '<span class="admin-todo-time">' +
        esc(t.time) +
        "</span></div>" +
        '<div class="admin-todo-title">' +
        esc(t.title) +
        "</div>" +
        '<div class="admin-todo-desc">' +
        esc(t.desc) +
        "</div>" +
        '<span class="admin-todo-go">去处理 <i class="fa-solid fa-arrow-right"></i></span></a>'
      );
    }

    var body = "";
    if (pending.length) {
      body += '<div class="admin-todo-section-label">待处理</div>';
      body += pending.map(function (t) {
        return rowHtml(t, false);
      }).join("");
    } else {
      body +=
        '<div class="admin-todo-empty"><i class="fa-regular fa-circle-check"></i>暂无待办，已全部处理</div>';
    }
    if (done.length) {
      body += '<div class="admin-todo-section-label is-muted">已读</div>';
      body += done
        .slice(0, 3)
        .map(function (t) {
          return rowHtml(t, true);
        })
        .join("");
    }

    panelEl.innerHTML = head + '<div class="admin-todo-panel-body">' + body + "</div>";
  }

  function positionPanel(anchor) {
    if (!panelEl || !anchor) return;
    var rect = anchor.getBoundingClientRect();
    var gap = 6;
    var pw = panelEl.offsetWidth || Math.min(380, window.innerWidth * 0.92);
    // 面板右缘与铃铛按钮右缘对齐，紧贴在 icon 正下方
    var left = rect.right - pw;
    if (left < 8) left = 8;
    if (left + pw > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - 8 - pw);
    }
    panelEl.style.top = rect.bottom + gap + "px";
    panelEl.style.left = left + "px";
    panelEl.style.right = "auto";
  }

  function closePanel() {
    if (panelEl) {
      panelEl.classList.remove("is-open");
      panelEl.setAttribute("aria-hidden", "true");
    }
    if (boundBell) boundBell.classList.remove("is-active");
  }

  function openPanel(anchor) {
    if (!panelEl) {
      panelEl = document.createElement("div");
      panelEl.id = "adminTodoPanel";
      panelEl.className = "admin-todo-panel";
      panelEl.setAttribute("role", "dialog");
      panelEl.setAttribute("aria-label", "系统待办");
      panelEl.setAttribute("aria-hidden", "true");
      document.body.appendChild(panelEl);

      panelEl.addEventListener("click", function (e) {
        var link = e.target.closest(".admin-todo-item");
        if (!link) return;
        var id = link.getAttribute("data-todo-id");
        if (id) markRead(id);
      });
    }
    renderPanel();
    panelEl.classList.add("is-open");
    panelEl.setAttribute("aria-hidden", "false");
    positionPanel(anchor);
    requestAnimationFrame(function () {
      if (panelEl && panelEl.classList.contains("is-open")) positionPanel(anchor);
    });
    if (boundBell) boundBell.classList.add("is-active");
  }

  function togglePanel(anchor) {
    if (panelEl && panelEl.classList.contains("is-open")) closePanel();
    else openPanel(anchor);
  }

  function updateBadge() {
    var bells = document.querySelectorAll("#adminBell, #dashBell");
    var n = pendingCount();
    bells.forEach(function (bell) {
      var badge = bell.querySelector(".admin-bell-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "admin-bell-badge";
        bell.appendChild(badge);
      }
      if (n > 0) {
        badge.textContent = n > 99 ? "99+" : String(n);
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    });
  }

  function bindBell() {
    var bell = document.querySelector("#adminBell") || document.querySelector("#dashBell");
    if (!bell) return;
    boundBell = bell;
    if (!bell.querySelector(".admin-bell-badge")) {
      bell.insertAdjacentHTML("beforeend", '<span class="admin-bell-badge" hidden>0</span>');
    }
    bell.classList.add("admin-bell-btn");
    bell.title = "系统通知";
    if (!bell.dataset.todoBound) {
      bell.dataset.todoBound = "1";
      bell.addEventListener("click", onBellClick);
    }
    updateBadge();
  }

  function onBellClick(e) {
    var bell = e.currentTarget;
    e.preventDefault();
    e.stopPropagation();
    boundBell = bell;
    togglePanel(bell);
  }

  function bindBellDelegation() {
    if (document.body && document.body.dataset.adminTodoDeleg) return;
    if (document.body) document.body.dataset.adminTodoDeleg = "1";
    document.addEventListener(
      "click",
      function (e) {
        var bell = e.target.closest("#adminBell, #dashBell, .admin-bell-btn");
        if (!bell || !bell.closest(".admin-app")) return;
        if (bell.dataset.todoBound) return;
        bell.dataset.todoBound = "1";
        bell.addEventListener("click", onBellClick);
        onBellClick.call(bell, e);
      },
      true
    );
  }

  function boot() {
    if (global.AdminAuth && global.AdminAuth.isLoginPage && global.AdminAuth.isLoginPage()) return;
    if (!document.querySelector(".admin-app")) return;
    bindBellDelegation();
    bindBell();
    updateBadge();
  }

  document.addEventListener("click", function (e) {
    if (!panelEl || !panelEl.classList.contains("is-open")) return;
    if (e.target.closest("#adminTodoPanel") || e.target.closest("#adminBell") || e.target.closest("#dashBell")) {
      return;
    }
    closePanel();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePanel();
  });

  window.addEventListener(
    "resize",
    function () {
      if (panelEl && panelEl.classList.contains("is-open") && boundBell) {
        positionPanel(boundBell);
      }
    },
    { passive: true }
  );

  global.AdminTodos = {
    TODOS: TODOS,
    pendingCount: pendingCount,
    openPanel: openPanel,
    closePanel: closePanel,
    updateBadge: updateBadge,
    boot: boot
  };

  if (typeof document !== "undefined") {
    function schedule() {
      boot();
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", schedule);
    } else {
      schedule();
    }
    global.addEventListener("load", boot);
  }
})(typeof window !== "undefined" ? window : this);
