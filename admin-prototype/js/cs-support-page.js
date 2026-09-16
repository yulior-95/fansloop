/**
 * 运营后台 · 人工客服工作台
 */
(function () {
  var M = window.AdminModal;
  var Store = window.FLAdminCsStore;
  if (!Store) return;

  var tab = "queue";
  var activeId = null;

  var elKpi = document.getElementById("csKpi");
  var elList = document.getElementById("csQueueList");
  var elChatHd = document.getElementById("csChatTitle");
  var elMsgs = document.getElementById("csChatMsgs");
  var elCtx = document.getElementById("csContext");
  var elInput = document.getElementById("csReplyInput");
  var elEmpty = document.getElementById("csChatEmpty");

  function esc(s) {
    return M && M.esc
      ? M.esc(String(s == null ? "" : s))
      : String(s == null ? "" : s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
  }

  function fmtTime(ts) {
    if (!ts) return "—";
    var d = new Date(ts);
    var p = function (n) { return n < 10 ? "0" + n : String(n); };
    return p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function priorityTag(p) {
    if (p === "high") return '<span class="ant-tag ant-tag-red">加急</span>';
    if (p === "low") return '<span class="ant-tag ant-tag-default">低</span>';
    return '<span class="ant-tag ant-tag-blue">普通</span>';
  }

  function statusLabel(s) {
    if (s === "queue") return "排队中";
    if (s === "active") return "进行中";
    if (s === "closed") return "已结束";
    return s;
  }

  function filtered() {
    return Store.list().filter(function (s) { return s.status === tab; });
  }

  function renderKpi() {
    var c = Store.counts();
    if (!elKpi) return;
    elKpi.innerHTML =
      '<div class="pill">排队中<strong>' + c.queue + "</strong></div>" +
      '<div class="pill">进行中<strong>' + c.active + "</strong></div>" +
      '<div class="pill">今日已结束<strong>' + c.closed + "</strong></div>";
  }

  function renderList() {
    if (!elList) return;
    var rows = filtered();
    if (!rows.length) {
      elList.innerHTML = '<div class="cs-empty">当前 Tab 暂无会话</div>';
      return;
    }
    if (!activeId || !rows.some(function (r) { return r.id === activeId; })) {
      activeId = rows[0].id;
    }
    elList.innerHTML = rows
      .map(function (s) {
        var cls = s.id === activeId ? "cs-queue-item active" : "cs-queue-item";
        var wait =
          s.status === "queue" && s.waitMin
            ? " · 等待约 " + s.waitMin + " 分钟"
            : "";
        return (
          '<button type="button" class="' +
          cls +
          '" data-id="' +
          esc(s.id) +
          '">' +
          '<div class="row1"><span>' +
          esc(s.userName) +
          "</span>" +
          priorityTag(s.priority) +
          "</div>" +
          '<div class="sub">' +
          esc(s.topic) +
          wait +
          "</div>" +
          "</button>"
        );
      })
      .join("");
  }

  function renderChat() {
    var s = activeId ? Store.get(activeId) : null;
    if (!s) {
      if (elChatHd) elChatHd.textContent = "请选择会话";
      if (elMsgs) elMsgs.innerHTML = "";
      if (elCtx) elCtx.innerHTML = "";
      if (elEmpty) elEmpty.hidden = false;
      return;
    }
    if (elEmpty) elEmpty.hidden = true;
    if (elChatHd) {
      elChatHd.innerHTML =
        esc(s.userName) +
        " · " +
        esc(s.topic) +
        ' <span class="ant-tag ant-tag-default" style="font-weight:400;margin-left:6px">' +
        statusLabel(s.status) +
        "</span>";
    }
    if (elMsgs) {
      elMsgs.innerHTML = (s.messages || [])
        .map(function (m) {
          var role = m.from === "user" ? "user" : m.from === "agent" ? "agent" : "system";
          return (
            '<div class="cs-msg ' +
            role +
            '">' +
            esc(m.text) +
            '<div class="meta">' +
            fmtTime(m.at) +
            "</div></div>"
          );
        })
        .join("");
      elMsgs.scrollTop = elMsgs.scrollHeight;
    }
    if (elCtx) {
      elCtx.innerHTML =
        "<dl>" +
        "<dt>UID</dt><dd>" +
        esc(s.uid) +
        "</dd>" +
        "<dt>渠道</dt><dd>" +
        esc(s.channel) +
        "</dd>" +
        "<dt>关联单号</dt><dd>" +
        esc(s.orderNo) +
        "</dd>" +
        "<dt>接待客服</dt><dd>" +
        esc(s.agent || "—") +
        "</dd>" +
        "<dt>标签</dt><dd>" +
        (s.tags || []).map(function (t) {
          return '<span class="ant-tag">' + esc(t) + "</span>";
        }).join(" ") +
        "</dd>" +
        "<dt>创建时间</dt><dd>" +
        fmtTime(s.createdAt) +
        "</dd>" +
        "</dl>" +
        '<button type="button" class="ant-btn ant-btn-sm" id="csGoUser"><i class="fa-solid fa-user"></i> 打开用户详情</button>';
      var go = document.getElementById("csGoUser");
      if (go) {
        go.addEventListener("click", function () {
          location.href = "users-list.html?uid=" + encodeURIComponent(s.uid);
        });
      }
    }
  }

  function renderAll() {
    renderKpi();
    renderList();
    renderChat();
    syncActions();
  }

  function syncActions() {
    var s = activeId ? Store.get(activeId) : null;
    var btnTake = document.getElementById("csBtnTake");
    var btnClose = document.getElementById("csBtnClose");
    var btnSend = document.getElementById("csBtnSend");
    if (btnTake) btnTake.disabled = !s || s.status !== "queue";
    if (btnClose) btnClose.disabled = !s || s.status === "closed";
    if (btnSend) btnSend.disabled = !s || s.status === "closed" || s.status === "queue";
  }

  function takeSession() {
    var s = activeId ? Store.get(activeId) : null;
    if (!s || s.status !== "queue") return;
    s.status = "active";
    s.agent = "客服 · 当前坐席";
    s.waitMin = 0;
    s.messages = s.messages || [];
    s.messages.push({
      from: "system",
      text: "客服已接入会话。",
      at: Date.now()
    });
    Store.save(s);
    tab = "active";
    document.querySelectorAll(".cs-tabs button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === tab);
    });
    renderAll();
    if (M) M.toast("已接入会话");
  }

  function closeSession() {
    var s = activeId ? Store.get(activeId) : null;
    if (!s || s.status === "closed") return;
    M &&
      M.confirm({
        title: "结束会话",
        content: "确认结束与「" + s.userName + "」的客服会话？",
        onOk: function () {
          s.status = "closed";
          s.messages.push({
            from: "system",
            text: "会话已结束。",
            at: Date.now()
          });
          Store.save(s);
          renderAll();
          M.toast("会话已结束");
        }
      });
  }

  function sendReply() {
    var s = activeId ? Store.get(activeId) : null;
    if (!s || s.status !== "active" || !elInput) return;
    var text = elInput.value.trim();
    if (!text) return;
    s.messages.push({ from: "agent", text: text, at: Date.now() });
    Store.save(s);
    elInput.value = "";
    renderChat();
  }

  document.querySelectorAll(".cs-tabs button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      tab = btn.getAttribute("data-tab") || "queue";
      document.querySelectorAll(".cs-tabs button").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      activeId = null;
      renderAll();
    });
  });

  if (elList) {
    elList.addEventListener("click", function (e) {
      var row = e.target.closest("[data-id]");
      if (!row) return;
      activeId = row.getAttribute("data-id");
      renderAll();
    });
  }

  document.getElementById("csBtnTake")?.addEventListener("click", takeSession);
  document.getElementById("csBtnClose")?.addEventListener("click", closeSession);
  document.getElementById("csBtnSend")?.addEventListener("click", sendReply);
  document.getElementById("csBtnReset")?.addEventListener("click", function () {
    Store.resetDemo();
    tab = "queue";
    activeId = null;
    document.querySelectorAll(".cs-tabs button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === "queue");
    });
    renderAll();
    if (M) M.toast("已恢复演示数据");
  });

  document.querySelectorAll(".cs-quick button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!elInput) return;
      elInput.value = btn.getAttribute("data-text") || "";
      elInput.focus();
    });
  });

  if (elInput) {
    elInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendReply();
      }
    });
  }

  renderAll();
})();
