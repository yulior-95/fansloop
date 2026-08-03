/**
 * 内容审核 · Tab / 筛选 / 详情 / 审核弹窗
 */
(function () {
  var M = window.AdminModal;

  var STATUS_MAP = {
    machine_review: { label: "机审中", tag: "blue" },
    manual_review: { label: "人工审核", tag: "orange" },
    approved: { label: "已通过", tag: "green" },
    rejected: { label: "已拒绝", tag: "red" }
  };

  var TAG_CLASS = {
    blue: "ant-tag-blue",
    orange: "ant-tag-orange",
    green: "ant-tag-green",
    red: "ant-tag-red"
  };

  var ROWS = [
    {
      id: "CR-8821",
      title: "城市夜景组图 #night",
      contentPreview: "东京塔夜景 9 张 · 含定位标签 #night #tokyo",
      type: "图文",
      status: "manual_review",
      submittedAt: "2026-06-22 10:02:18",
      userId: "882910",
      userNickname: "Luna 🌙",
      auditUpdatedAt: "—",
      lastAuditor: "—",
      submission: {
        text: "今晚的东京塔夜景，长曝光 30s，欢迎订阅者下载 RAW 包。私信领取福利仅限粉丝。",
        images: [
          "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600",
          "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600"
        ],
        tags: ["#night", "#tokyo", "#longexposure"],
        visibility: "订阅者可见",
        location: "日本 · 东京"
      },
      user: {
        uid: "882910",
        nickname: "Luna 🌙",
        email: "luna@goodfans.io",
        role: "Creator",
        kyc: "已认证",
        registeredAt: "2024-03-12 09:15:00"
      },
      machine: {
        at: "2026-06-22 10:02:21",
        result: "fail",
        confidence: 0.42,
        failReasons: ["疑似软广导流", "画面含二维码", "文案命中敏感词「私信领取福利」"]
      },
      timeline: [
        { who: "系统机审", at: "2026-06-22 10:02:21", action: "机审完成 · 需人工", note: "置信度 0.42，低于阈值 0.65" },
        { who: "—", at: "—", action: "等待人工审核", note: "已入人工队列" }
      ]
    },
    {
      id: "CR-1029",
      title: "旅行 Vlog 粗剪",
      contentPreview: "京都 3 日 vlog 粗剪版，时长 12:04",
      type: "视频",
      status: "manual_review",
      submittedAt: "2026-06-21 18:44:02",
      userId: "102938",
      userNickname: "Lens 旅记",
      auditUpdatedAt: "—",
      lastAuditor: "—",
      submission: {
        text: "京都慢旅行 vlog 粗剪，正式版下周发布。",
        videoCover: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        videoDuration: "12:04",
        tags: ["#vlog", "#kyoto"],
        visibility: "公开"
      },
      user: {
        uid: "102938",
        nickname: "Lens 旅记",
        email: "lens@example.com",
        role: "Creator",
        kyc: "已认证",
        registeredAt: "2023-11-08 14:22:33"
      },
      machine: {
        at: "2026-06-21 18:44:08",
        result: "fail",
        confidence: 0.51,
        failReasons: ["视频时长过长待抽检", "音频含背景音乐版权风险"]
      },
      timeline: [
        { who: "系统机审", at: "2026-06-21 18:44:08", action: "机审完成 · 需人工", note: "需人工复核版权与画面" }
      ]
    },
    {
      id: "CR-0901",
      title: "周末咖啡笔记",
      contentPreview: "纯文字动态 · 分享手冲参数",
      type: "纯文字",
      status: "machine_review",
      submittedAt: "2026-06-22 11:30:00",
      userId: "556677",
      userNickname: "咖啡豆日记",
      auditUpdatedAt: "—",
      lastAuditor: "—",
      submission: {
        text: "今日手冲：埃塞俄比亚耶加，水温 92℃，粉水比 1:15，酸甜明亮。",
        tags: ["#coffee"],
        visibility: "公开"
      },
      user: {
        uid: "556677",
        nickname: "咖啡豆日记",
        email: "bean@example.com",
        role: "Creator",
        kyc: "未认证",
        registeredAt: "2025-01-20 08:00:00"
      },
      machine: {
        at: "—",
        result: "pending",
        confidence: null,
        failReasons: []
      },
      timeline: [
        { who: "系统", at: "2026-06-22 11:30:01", action: "已提交机审", note: "排队中，预计 30 秒内完成" }
      ]
    },
    {
      id: "CR-0755",
      title: "健身打卡 Day 30",
      contentPreview: "图文 · 训练计划与饮食",
      type: "图文",
      status: "approved",
      submittedAt: "2026-06-20 07:15:44",
      userId: "334455",
      userNickname: "Iron 铁哥",
      auditUpdatedAt: "2026-06-20 09:02:11",
      lastAuditor: "李敏",
      submission: {
        text: "第 30 天打卡，今日胸背超级组。",
        images: ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600"],
        tags: ["#fitness"],
        visibility: "公开"
      },
      user: {
        uid: "334455",
        nickname: "Iron 铁哥",
        email: "iron@example.com",
        role: "Creator",
        kyc: "已认证",
        registeredAt: "2024-08-01 12:00:00"
      },
      machine: {
        at: "2026-06-20 07:15:47",
        result: "pass",
        confidence: 0.91,
        failReasons: []
      },
      timeline: [
        { who: "系统机审", at: "2026-06-20 07:15:47", action: "机审通过", note: "置信度 0.91" },
        { who: "李敏", at: "2026-06-20 09:02:11", action: "人工通过", note: "内容合规，正常健身分享" }
      ]
    },
    {
      id: "CR-0612",
      title: "外链推广合集",
      contentPreview: "视频 · 含站外链接引导",
      type: "视频",
      status: "rejected",
      submittedAt: "2026-06-19 16:20:33",
      userId: "778899",
      userNickname: "流量小哥",
      auditUpdatedAt: "2026-06-19 17:05:18",
      lastAuditor: "王一",
      submission: {
        text: "点击简介链接领取资料包。",
        videoCover: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        videoDuration: "3:20",
        tags: ["#promo"],
        visibility: "公开"
      },
      user: {
        uid: "778899",
        nickname: "流量小哥",
        email: "traffic@example.com",
        role: "Creator",
        kyc: "未认证",
        registeredAt: "2025-05-10 10:30:00"
      },
      machine: {
        at: "2026-06-19 16:20:36",
        result: "fail",
        confidence: 0.28,
        failReasons: ["站外导流", "疑似垃圾营销", "标题夸大"]
      },
      timeline: [
        { who: "系统机审", at: "2026-06-19 16:20:36", action: "机审拒绝", note: "置信度 0.28" },
        { who: "王一", at: "2026-06-19 17:05:18", action: "人工确认拒绝", note: "违反社区准则：禁止站外导流与垃圾营销" }
      ]
    },
    {
      id: "CR-0588",
      title: "春日野餐写真",
      contentPreview: "图文 · 6 张胶片风",
      type: "图文",
      status: "approved",
      submittedAt: "2026-06-18 14:08:55",
      userId: "882910",
      userNickname: "Luna 🌙",
      auditUpdatedAt: "2026-06-18 14:09:30",
      lastAuditor: "系统机审",
      submission: {
        text: "周末野餐随拍，胶片模拟。",
        images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600"],
        tags: ["#picnic", "#film"],
        visibility: "公开"
      },
      user: {
        uid: "882910",
        nickname: "Luna 🌙",
        email: "luna@goodfans.io",
        role: "Creator",
        kyc: "已认证",
        registeredAt: "2024-03-12 09:15:00"
      },
      machine: {
        at: "2026-06-18 14:09:02",
        result: "pass",
        confidence: 0.88,
        failReasons: []
      },
      timeline: [
        { who: "系统机审", at: "2026-06-18 14:09:02", action: "机审通过并自动上架", note: "置信度 0.88，无需人工" }
      ]
    }
  ];

  var state = {
    tab: "manual",
    status: "",
    type: "",
    submitStart: "",
    submitEnd: "",
    auditStart: "",
    auditEnd: ""
  };

  function esc(s) {
    return M && M.esc ? M.esc(s) : String(s == null ? "" : s);
  }

  function nowStr() {
    var d = new Date();
    function pad(n) {
      return n < 10 ? "0" + n : String(n);
    }
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      " " +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes()) +
      ":" +
      pad(d.getSeconds())
    );
  }

  function applyReviewResult(row, action, note) {
    var at = nowStr();
    row.status = action === "approve" ? "approved" : "rejected";
    row.auditUpdatedAt = at;
    row.lastAuditor = "审核员";
    if (!row.timeline) row.timeline = [];
    row.timeline.push({
      who: "审核员",
      at: at,
      action: action === "approve" ? "人工审核通过" : "人工审核拒绝",
      note: note || ""
    });
  }

  function getReviewNote() {
    var el = document.getElementById("crReviewNote");
    return el ? String(el.value).trim() : "";
  }

  function statusTag(status) {
    var m = STATUS_MAP[status] || { label: status, tag: "default" };
    var cls = TAG_CLASS[m.tag] || "ant-tag";
    return '<span class="ant-tag ' + cls + '">' + esc(m.label) + "</span>";
  }

  function canReview(row) {
    return row.status === "manual_review" || row.status === "machine_review";
  }

  function inDateRange(isoStr, start, end) {
    if (!isoStr || isoStr === "—") return !start && !end;
    var d = isoStr.slice(0, 10);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  }

  function filterRows() {
    return ROWS.filter(function (row) {
      if (state.tab === "manual" && row.status !== "manual_review") return false;
      if (state.status && row.status !== state.status) return false;
      if (state.type && row.type !== state.type) return false;
      if (!inDateRange(row.submittedAt, state.submitStart, state.submitEnd)) return false;
      if (state.auditStart || state.auditEnd) {
        if (!inDateRange(row.auditUpdatedAt, state.auditStart, state.auditEnd)) return false;
      }
      return true;
    });
  }

  function manualCount() {
    return ROWS.filter(function (r) { return r.status === "manual_review"; }).length;
  }

  function renderSubmissionBody(row) {
    var s = row.submission || {};
    var html = '<div class="cr-detail-section"><h4>用户提交内容</h4>';
    html += '<dl class="cr-detail-kv">';
    html += "<dt>标题</dt><dd>" + esc(row.title) + "</dd>";
    html += "<dt>正文</dt><dd>" + esc(s.text || "—") + "</dd>";
    html += "<dt>类型</dt><dd>" + esc(row.type) + "</dd>";
    if (s.visibility) html += "<dt>可见范围</dt><dd>" + esc(s.visibility) + "</dd>";
    if (s.location) html += "<dt>定位</dt><dd>" + esc(s.location) + "</dd>";
    if (s.tags && s.tags.length) html += "<dt>标签</dt><dd>" + esc(s.tags.join(" ")) + "</dd>";
    if (s.videoDuration) html += "<dt>视频时长</dt><dd>" + esc(s.videoDuration) + "</dd>";
    html += "</dl>";
    html += '<div class="cr-detail-media">';
    if (s.images && s.images.length) {
      s.images.forEach(function (url, i) {
        html +=
          '<button type="button" class="cr-media-item cr-media-item--image" data-media-type="image" data-media-src="' + esc(url) + '" data-media-title="' + esc(row.title) + ' 图片 ' + (i + 1) + '" title="点击放大查看">' +
          '<img src="' + esc(url) + '" alt="">' +
          '<span class="cr-media-badge"><i class="fa-solid fa-magnifying-glass-plus"></i></span>' +
          "</button>";
      });
    }
    if (s.videoCover || s.videoUrl) {
      var vUrl = s.videoUrl || "";
      var poster = s.videoCover || "";
      html +=
        '<button type="button" class="cr-media-item cr-media-item--video" data-media-type="video" data-media-src="' + esc(vUrl) + '" data-media-poster="' + esc(poster) + '" data-media-title="' + esc(row.title) + ' 视频" title="点击播放视频">' +
        '<img src="' + esc(poster) + '" alt="视频封面">' +
        '<span class="cr-media-badge cr-media-badge--play"><i class="fa-solid fa-play"></i></span>' +
        (s.videoDuration ? '<span class="cr-media-duration">' + esc(s.videoDuration) + "</span>" : "") +
        "</button>";
    }
    html += "</div></div>";
    return html;
  }

  var lightboxEl = null;

  function ensureLightbox() {
    if (lightboxEl) return lightboxEl;
    lightboxEl = document.createElement("div");
    lightboxEl.id = "crMediaLightbox";
    lightboxEl.className = "cr-media-lightbox";
    lightboxEl.setAttribute("aria-hidden", "true");
    lightboxEl.innerHTML =
      '<button type="button" class="cr-media-lightbox-close" aria-label="关闭预览"><i class="fa-solid fa-xmark"></i></button>' +
      '<div class="cr-media-lightbox-stage" id="crMediaLightboxStage"></div>' +
      '<div class="cr-media-lightbox-cap" id="crMediaLightboxCap"></div>';
    document.body.appendChild(lightboxEl);

    lightboxEl.querySelector(".cr-media-lightbox-close").addEventListener("click", closeMediaPreview);
    lightboxEl.addEventListener("click", function (e) {
      if (e.target === lightboxEl) closeMediaPreview();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightboxEl.classList.contains("is-open")) closeMediaPreview();
    });
    return lightboxEl;
  }

  function closeMediaPreview() {
    if (!lightboxEl) return;
    var stage = document.getElementById("crMediaLightboxStage");
    if (stage) {
      var video = stage.querySelector("video");
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      stage.innerHTML = "";
    }
    lightboxEl.classList.remove("is-open");
    lightboxEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cr-media-lightbox-open");
  }

  function openMediaPreview(opts) {
    opts = opts || {};
    var lb = ensureLightbox();
    var stage = document.getElementById("crMediaLightboxStage");
    var cap = document.getElementById("crMediaLightboxCap");
    if (!stage) return;

    stage.innerHTML = "";
    if (opts.type === "video" && opts.src) {
      var video = document.createElement("video");
      video.src = opts.src;
      video.controls = true;
      video.playsInline = true;
      video.setAttribute("controlsList", "nodownload");
      if (opts.poster) video.poster = opts.poster;
      video.setAttribute("aria-label", opts.title || "视频预览");
      stage.appendChild(video);
      setTimeout(function () {
        try { video.play(); } catch (e) { /* ignore autoplay block */ }
      }, 80);
    } else if (opts.src) {
      var img = document.createElement("img");
      img.src = opts.src;
      img.alt = opts.title || "图片预览";
      stage.appendChild(img);
    }

    if (cap) cap.textContent = opts.title || "";
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.classList.add("cr-media-lightbox-open");
  }

  function bindMediaPreview(root) {
    if (!root) return;
    root.querySelectorAll(".cr-media-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var type = btn.getAttribute("data-media-type");
        var src = btn.getAttribute("data-media-src");
        var title = btn.getAttribute("data-media-title") || "";
        if (type === "video") {
          if (!src) {
            M.toast("暂无视频源（原型）");
            return;
          }
          openMediaPreview({
            type: "video",
            src: src,
            poster: btn.getAttribute("data-media-poster") || "",
            title: title
          });
          return;
        }
        openMediaPreview({ type: "image", src: src, title: title });
      });
    });
  }

  function renderUserBlock(row) {
    var u = row.user || {};
    return (
      '<div class="cr-detail-section"><h4>提交用户信息</h4>' +
      '<dl class="cr-detail-kv">' +
      "<dt>用户 UID</dt><dd>" + esc(u.uid) + "</dd>" +
      "<dt>昵称</dt><dd>" + esc(u.nickname) + "</dd>" +
      "<dt>邮箱</dt><dd>" + esc(u.email) + "</dd>" +
      "<dt>角色</dt><dd>" + esc(u.role) + "</dd>" +
      "<dt>KYC</dt><dd>" + esc(u.kyc) + "</dd>" +
      "<dt>注册时间</dt><dd class='cr-cell-time'>" + esc(u.registeredAt) + "</dd>" +
      "</dl></div>"
    );
  }

  function renderTimeline(row) {
    var items = row.timeline || [];
    var html = '<div class="cr-detail-section"><h4>审核进度</h4><ul class="cr-timeline">';
    items.forEach(function (t) {
      html +=
        "<li><div class='cr-tl-who'>" + esc(t.who) + " · " + esc(t.action) + "</div>" +
        "<div class='cr-tl-time'>" + esc(t.at) + "</div>" +
        (t.note ? "<div class='cr-tl-note'>" + esc(t.note) + "</div>" : "") +
        "</li>";
    });
    html += "</ul></div>";
    return html;
  }

  function renderMachineBlock(row, forReview) {
    var m = row.machine || {};
    var boxCls = "cr-machine-box";
    if (m.result === "pass") boxCls += " is-pass";
    else if (m.result === "pending") boxCls += " is-pending";

    var resultLabel =
      m.result === "pass" ? "通过" : m.result === "fail" ? "未通过 / 需人工" : "机审进行中";

    var html =
      '<div class="' + boxCls + '">' +
      "<strong><i class='fa-solid fa-robot'></i> 机审结果</strong>：" + esc(resultLabel) +
      (m.at && m.at !== "—" ? " · <span class='cr-cell-time'>" + esc(m.at) + "</span>" : "") +
      (m.confidence != null ? " · 置信度 " + m.confidence : "");

    if (m.failReasons && m.failReasons.length) {
      html += "<ul>";
      m.failReasons.forEach(function (r) {
        html += "<li>" + esc(r) + "</li>";
      });
      html += "</ul>";
    } else if (forReview && m.result === "pending") {
      html += "<p style='margin:8px 0 0'>机审尚未完成，请稍后刷新或等待队列处理。</p>";
    }
    html += "</div>";
    return html;
  }

  function openDetail(row) {
    M.open({
      title: "内容详情 · " + row.id,
      wide: true,
      width: 960,
      body:
        "<div class='cr-detail-grid'>" +
        "<div>" +
        renderSubmissionBody(row) +
        renderMachineBlock(row, false) +
        "</div>" +
        "<div>" +
        renderUserBlock(row) +
        "<dl class='cr-detail-kv' style='margin-bottom:16px'>" +
        "<dt>审核单号</dt><dd>" + esc(row.id) + "</dd>" +
        "<dt>当前进度</dt><dd>" + statusTag(row.status) + "</dd>" +
        "<dt>提交时间</dt><dd class='cr-cell-time'>" + esc(row.submittedAt) + "</dd>" +
        "<dt>审核更新</dt><dd class='cr-cell-time'>" + esc(row.auditUpdatedAt) + "</dd>" +
        "<dt>最后审核人</dt><dd>" + esc(row.lastAuditor) + "</dd>" +
        "</dl>" +
        renderTimeline(row) +
        "</div></div>",
      footer: [{
        text: "关闭",
        primary: true,
        onClick: function () {
          closeMediaPreview();
          M.close();
        }
      }],
      onMount: function (bodyEl) {
        bindMediaPreview(bodyEl);
      }
    });
  }

  function openReview(row) {
    var body =
      '<div class="cr-detail-grid cr-detail-grid--single">' +
      renderMachineBlock(row, true) +
      renderSubmissionBody(row) +
      '<p class="cr-review-meta">提交用户：' + esc(row.userNickname) + "（UID " + esc(row.userId) + "）· " + esc(row.submittedAt) + "</p>" +
      '<div class="cr-detail-section cr-review-note-wrap">' +
      '<label class="cr-review-label" for="crReviewNote">审核批注</label>' +
      '<textarea class="ant-input cr-review-note" id="crReviewNote" placeholder="填写通过/拒绝理由，将写入审核日志"></textarea>' +
      "</div></div>";

    function closeReview() {
      closeMediaPreview();
      M.close();
    }

    M.open({
      title: "内容审核 · " + row.id,
      wide: true,
      width: 960,
      body: body,
      onMount: function (bodyEl) {
        bindMediaPreview(bodyEl);
      },
      footer: [
        { text: "取消", onClick: closeReview },
        {
          text: "拒绝",
          danger: true,
          onClick: function () {
            var note = getReviewNote();
            if (!note) {
              M.toast("请填写审核批注后再拒绝");
              return;
            }
            applyReviewResult(row, "reject", note);
            closeReview();
            M.toast("审核已拒绝");
            renderTable();
          }
        },
        {
          text: "通过",
          primary: true,
          onClick: function () {
            applyReviewResult(row, "approve", getReviewNote());
            closeReview();
            M.toast("审核通过");
            renderTable();
          }
        }
      ]
    });
  }

  function renderTable() {
    var rows = filterRows();
    var tbody = document.getElementById("crTableBody");
    var empty = document.getElementById("crTableEmpty");
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    tbody.innerHTML = rows
      .map(function (row, idx) {
        var ops =
          '<div class="cr-ops">' +
          '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-cr-detail" data-id="' + esc(row.id) + '">详情</button>';
        if (canReview(row)) {
          ops +=
            '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-cr-review" data-id="' + esc(row.id) + '">审核</button>';
        }
        ops += "</div>";

        return (
          "<tr data-id='" + esc(row.id) + "'>" +
          "<td class='col-sticky-left-1'>" + (idx + 1) + "</td>" +
          "<td><div class='cr-cell-title' title='" + esc(row.title) + "'>" + esc(row.title) + "</div></td>" +
          "<td><div class='cr-cell-content' title='" + esc(row.contentPreview) + "'>" + esc(row.contentPreview) + "</div></td>" +
          "<td>" + esc(row.type) + "</td>" +
          "<td>" + statusTag(row.status) + "</td>" +
          "<td class='cr-cell-time'>" + esc(row.submittedAt) + "</td>" +
          "<td>" + esc(row.userId) + "</td>" +
          "<td>" + esc(row.userNickname) + "</td>" +
          "<td class='cr-cell-time'>" + esc(row.auditUpdatedAt) + "</td>" +
          "<td>" + esc(row.lastAuditor) + "</td>" +
          "<td class='col-sticky-right'>" + ops + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function syncTabUi() {
    document.querySelectorAll(".cr-card-tabs [data-cr-tab]").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-cr-tab") === state.tab);
    });
    var badge = document.getElementById("crManualBadge");
    if (badge) badge.textContent = String(manualCount());
  }

  function readFilters() {
    state.status = (document.getElementById("crFilterStatus") || {}).value || "";
    state.type = (document.getElementById("crFilterType") || {}).value || "";
    state.submitStart = (document.getElementById("crSubmitStart") || {}).value || "";
    state.submitEnd = (document.getElementById("crSubmitEnd") || {}).value || "";
    state.auditStart = (document.getElementById("crAuditStart") || {}).value || "";
    state.auditEnd = (document.getElementById("crAuditEnd") || {}).value || "";
  }

  function findRow(id) {
    for (var i = 0; i < ROWS.length; i++) {
      if (ROWS[i].id === id) return ROWS[i];
    }
    return null;
  }

  function bind() {
    document.querySelectorAll(".cr-card-tabs [data-cr-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.tab = btn.getAttribute("data-cr-tab");
        syncTabUi();
        renderTable();
      });
    });

    var FT = window.AdminFilterToolbar;
    if (FT) {
      FT.onQuery("btnCrFilter", function () {
        readFilters();
        renderTable();
        M.toast("筛选已应用");
      });
      FT.onReset("btnCrReset", function () {
        readFilters();
        renderTable();
        M.toast("筛选已重置");
      });
    }

    document.getElementById("crTableBody").addEventListener("click", function (e) {
      var detailBtn = e.target.closest(".js-cr-detail");
      var reviewBtn = e.target.closest(".js-cr-review");
      var id = detailBtn
        ? detailBtn.getAttribute("data-id")
        : reviewBtn
          ? reviewBtn.getAttribute("data-id")
          : null;
      if (!id) return;
      var row = findRow(id);
      if (!row) return;
      if (detailBtn) openDetail(row);
      if (reviewBtn) openReview(row);
    });
  }

  function init() {
    syncTabUi();
    renderTable();
    bind();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
