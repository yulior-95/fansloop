/**
 * 全局弹窗（对齐 Ant Design Modal 交互：遮罩、Esc、右上角关闭）
 * 用法：AdminModal.open({ title, body, wide?, width?, footer?, onMount? })
 */
(function () {
  var root, titleEl, bodyEl, footEl, modalEl;

  function build() {
    root = document.getElementById("admin-fl-modal-root");
    if (root) return;
    root = document.createElement("div");
    root.id = "admin-fl-modal-root";
    root.className = "fl-modal-root";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<div class="fl-modal-mask"></div><div class="fl-modal-wrap"><div class="fl-modal" role="dialog" aria-modal="true">' +
      '<button type="button" class="fl-modal-close" aria-label="关闭">&times;</button>' +
      '<div class="fl-modal-header"></div><div class="fl-modal-body"></div><div class="fl-modal-footer"></div>' +
      "</div></div>";
    document.body.appendChild(root);
    modalEl = root.querySelector(".fl-modal");
    titleEl = root.querySelector(".fl-modal-header");
    bodyEl = root.querySelector(".fl-modal-body");
    footEl = root.querySelector(".fl-modal-footer");
    root.querySelector(".fl-modal-mask").addEventListener("click", close);
    root.querySelector(".fl-modal-close").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
  }

  function onKey(e) {
    if (e.key !== "Escape") return;
    if (root && root.classList.contains("is-open")) close();
  }

  function close() {
    if (!root) return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("fl-modal-open");
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function open(o) {
    build();
    o = o || {};
    titleEl.textContent = o.title || "提示";
    bodyEl.innerHTML = o.body != null ? o.body : "";
    modalEl.className = "fl-modal" + (o.wide ? " fl-modal-wide" : "");
    if (o.width) modalEl.style.maxWidth = o.width + "px";
    else modalEl.style.maxWidth = "";
    footEl.innerHTML = "";
    var buttons =
      o.footer && o.footer.length
        ? o.footer
        : [{ text: "关闭", primary: true, onClick: close }];
    buttons.forEach(function (f) {
      var b = document.createElement("button");
      b.type = "button";
      var cls = "ant-btn ant-btn-sm ";
      if (f.danger) cls += "ant-btn-danger";
      else if (f.primary) cls += "ant-btn-primary";
      else cls += "ant-btn";
      b.className = cls;
      b.textContent = f.text || "按钮";
      b.addEventListener("click", function (ev) {
        if (f.onClick) f.onClick(ev);
        else close();
      });
      footEl.appendChild(b);
    });
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("fl-modal-open");
    if (o.onMount)
      setTimeout(function () {
        o.onMount(bodyEl);
      }, 0);
  }

  function toast(msg, title) {
    open({
      title: title || "提示",
      body: "<p style='margin:0'>" + esc(msg) + "</p>",
      footer: [{ text: "确定", primary: true, onClick: close }]
    });
  }

  function confirmGoogle(opts) {
    opts = opts || {};
    open({
      title: opts.title || "谷歌验证",
      body:
        "<p style='margin:0 0 12px;color:rgba(0,0,0,.65)'>" +
        esc(opts.message || "请输入谷歌验证器 6 位动态码以继续。") +
        "</p><label style='display:block;font-size:12px;color:rgba(0,0,0,.45);margin-bottom:6px'>动态码</label>" +
        "<input class='ant-input' id='fl-google-totp' maxlength='6' inputmode='numeric' autocomplete='one-time-code' placeholder='000000' style='max-width:220px'>",
      footer: [
        { text: "取消", onClick: close },
        {
          text: "确认",
          primary: true,
          onClick: function () {
            var v = document.getElementById("fl-google-totp");
            var val = v ? String(v.value).trim() : "";
            if (!/^\d{6}$/.test(val)) {
              toast("请输入 6 位数字动态码");
              return;
            }
            close();
            if (opts.onVerified) opts.onVerified(val);
            else toast("验证通过（原型）");
          }
        }
      ],
      onMount: function () {
        var i = document.getElementById("fl-google-totp");
        if (i) {
          i.focus();
          i.select();
        }
      }
    });
  }

  /** 绑定 .fl-modal-tabs 内 [data-fl-tab] 与 .fl-modal-tab-panel[data-fl-tab-panel] */
  function wireModalTabs(body) {
    if (!body) return;
    var bar = body.querySelector(".fl-modal-tabs");
    if (!bar) return;
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-fl-tab]");
      if (!btn) return;
      var id = btn.getAttribute("data-fl-tab");
      bar.querySelectorAll("button[data-fl-tab]").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      body.querySelectorAll(".fl-modal-tab-panel").forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-fl-tab-panel") === id);
      });
    });
  }

  window.AdminModal = {
    open: open,
    close: close,
    toast: toast,
    confirmGoogle: confirmGoogle,
    wireModalTabs: wireModalTabs,
    esc: esc
  };
})();
