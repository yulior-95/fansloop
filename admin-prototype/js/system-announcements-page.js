/**
 * 公告管理 · 发送申请 / 发送审核 / 新建编辑
 */
(function () {
  var M = window.AdminModal;
  var CURRENT_USER = "张运营";
  var PUBLISHER_ACCOUNT = "FansLoop官方";

  var PUBLISH_TYPE = { system: "系统公告", force: "系统强公告" };
  var TARGET = { all: "全部用户", specified: "指定用户", online: "在线用户" };
  var MSG_TYPE = { text: "文本", image: "图片", video: "视频", richtext: "富文本" };
  var STATUS = {
    draft: { label: "草稿", tag: "default" },
    pending: { label: "待审核", tag: "orange" },
    approved: { label: "通过", tag: "green" },
    rejected: { label: "已拒绝", tag: "red" }
  };

  var drafts = [
    {
      id: "ANN-D001",
      publishType: "system",
      channels: ["APP", "WEB"],
      target: "all",
      targetUids: "",
      msgType: "text",
      contentText: "端午节积分加倍活动预告，正式规则将于 6 月 28 日公布。",
      contentMediaUrl: "",
      publisherAccount: PUBLISHER_ACCOUNT,
      createdBy: "张运营",
      createdAt: "2026-06-20 09:30:00",
      updatedAt: "2026-06-21 14:20:00",
      updatedBy: "李主管"
    },
    {
      id: "ANN-D002",
      publishType: "force",
      channels: ["APP", "PC", "WEB"],
      target: "specified",
      targetUids: "882910, 102938",
      msgType: "image",
      contentText: "",
      contentMediaUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=600",
      publisherAccount: PUBLISHER_ACCOUNT,
      createdBy: "张运营",
      createdAt: "2026-06-21 16:05:11",
      updatedAt: "2026-06-21 16:05:11",
      updatedBy: "张运营"
    }
  ];

  var audits = [
    {
      id: "ANN-A001",
      publishType: "system",
      channels: ["WEB"],
      target: "online",
      targetUids: "",
      msgType: "richtext",
      contentText: "<p><strong>钱包维护通知</strong></p><p>2026-05-12 02:00 起钱包模块升级，预计 30 分钟。</p>",
      contentMediaUrl: "",
      publisherAccount: PUBLISHER_ACCOUNT,
      createdBy: "王运营",
      createdAt: "2026-06-18 15:00:00",
      submittedAt: "2026-06-18 15:10:22",
      auditor: null,
      auditedAt: null,
      status: "pending"
    },
    {
      id: "ANN-A002",
      publishType: "system",
      channels: ["APP", "PC", "WEB"],
      target: "all",
      targetUids: "",
      msgType: "text",
      contentText: "五一活动积分加倍已上线，活动期间订阅与打赏积分按 2 倍结算。",
      contentMediaUrl: "",
      publisherAccount: PUBLISHER_ACCOUNT,
      createdBy: "李主管",
      createdAt: "2026-04-25 10:00:00",
      submittedAt: "2026-04-25 10:30:00",
      auditor: "王审核",
      auditedAt: "2026-04-25 11:00:00",
      status: "approved"
    }
  ];

  var state = { tab: "draft" };
  var pager = null;
  var lightboxEl = null;
  var editingDraftId = null;

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

  function statusTag(st) {
    var m = STATUS[st] || { label: st, tag: "default" };
    var cls =
      m.tag === "orange"
        ? "ant-tag-orange"
        : m.tag === "green"
          ? "ant-tag-green"
          : m.tag === "red"
            ? "ant-tag-red"
            : "ant-tag";
    return '<span class="ant-tag ' + cls + '">' + esc(m.label) + "</span>";
  }

  function channelsLabel(arr) {
    return (arr || []).join(" / ") || "—";
  }

  function findDraft(id) {
    for (var i = 0; i < drafts.length; i++) {
      if (drafts[i].id === id) return drafts[i];
    }
    return null;
  }

  function findAudit(id) {
    for (var i = 0; i < audits.length; i++) {
      if (audits[i].id === id) return audits[i];
    }
    return null;
  }

  function renderMessageBody(row, forModal) {
    if (row.msgType === "image" && row.contentMediaUrl) {
      var cls = forModal ? "ann-modal-media ann-modal-media--image js-ann-modal-preview" : "ann-media-thumb js-ann-preview";
      return (
        '<button type="button" class="' +
        cls +
        '" data-type="image" data-src="' +
        esc(row.contentMediaUrl) +
        '" title="点击放大查看">' +
        '<img src="' +
        esc(row.contentMediaUrl) +
        '" alt="">' +
        (forModal ? '<span class="ann-modal-media-badge"><i class="fa-solid fa-magnifying-glass-plus"></i></span>' : "") +
        "</button>"
      );
    }
    if (row.msgType === "video" && row.contentMediaUrl) {
      var vcls = forModal ? "ann-modal-media ann-modal-media--video js-ann-modal-preview" : "ann-media-thumb ann-media-thumb--video js-ann-preview";
      var poster = "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400";
      return (
        '<button type="button" class="' +
        vcls +
        '" data-type="video" data-src="' +
        esc(row.contentMediaUrl) +
        '" title="点击播放">' +
        '<img src="' +
        poster +
        '" alt="视频封面">' +
        (forModal ? '<span class="ann-modal-media-badge ann-modal-media-badge--play"><i class="fa-solid fa-play"></i></span>' : "") +
        "</button>"
      );
    }
    if (row.msgType === "richtext" && row.contentText) {
      return '<div class="ann-rich-content">' + row.contentText + "</div>";
    }
    var text = row.contentText || "—";
    return '<div class="ann-text-content">' + esc(text).replace(/\n/g, "<br>") + "</div>";
  }

  function renderContentCell(row) {
    if (row.msgType === "image" && row.contentMediaUrl) {
      return renderMessageBody(row, false);
    }
    if (row.msgType === "video" && row.contentMediaUrl) {
      return renderMessageBody(row, false);
    }
    var text = row.contentText || "—";
    var plain = text.replace(/<[^>]+>/g, "");
    return '<div class="ann-cell-content" title="' + esc(plain) + '">' + esc(plain) + "</div>";
  }

  function getActiveList() {
    return state.tab === "draft" ? drafts : audits;
  }

  function renderActiveTable() {
    if (state.tab === "draft") renderDraftTable();
    else renderAuditTable();
  }

  function renderDraftTable() {
    if (state.tab !== "draft") return;
    var tbody = document.getElementById("annDraftBody");
    var empty = document.getElementById("annDraftEmpty");
    if (!tbody) return;

    var rows = pager ? pager.getSlice(drafts) : drafts;
    if (!rows.length) {
      tbody.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    var start = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
    tbody.innerHTML = rows
      .map(function (row, idx) {
        return (
          "<tr data-id='" +
          esc(row.id) +
          "'>" +
          "<td class='col-sticky-left-1'>" +
          (start + idx + 1) +
          "</td>" +
          "<td>" +
          esc(row.publisherAccount) +
          "</td>" +
          "<td>" +
          esc(channelsLabel(row.channels)) +
          "</td>" +
          "<td>" +
          esc(TARGET[row.target] || row.target) +
          "</td>" +
          "<td>" +
          esc(row.target === "specified" ? row.targetUids : "—") +
          "</td>" +
          "<td>" +
          esc(MSG_TYPE[row.msgType] || row.msgType) +
          "</td>" +
          "<td>" +
          renderContentCell(row) +
          "</td>" +
          "<td>" +
          esc(row.createdBy) +
          "</td>" +
          "<td class='ann-cell-time'>" +
          esc(row.createdAt) +
          "</td>" +
          "<td class='ann-cell-time'>" +
          esc(row.updatedAt) +
          "</td>" +
          "<td>" +
          esc(row.updatedBy) +
          "</td>" +
          "<td>" +
          statusTag("draft") +
          "</td>" +
          "<td class='col-sticky-right'><div class='ann-ops'>" +
          '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-ann-edit">修改</button>' +
          '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-ann-submit">提交</button>' +
          '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-ann-delete" style="color:#ff4d4f">删除</button>' +
          "</div></td></tr>"
        );
      })
      .join("");
  }

  function renderAuditTable() {
    if (state.tab !== "audit") return;
    var tbody = document.getElementById("annAuditBody");
    var empty = document.getElementById("annAuditEmpty");
    if (!tbody) return;

    var rows = pager ? pager.getSlice(audits) : audits;
    if (!rows.length) {
      tbody.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    var start = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
    tbody.innerHTML = rows
      .map(function (row, idx) {
        var ops =
          row.status === "pending"
            ? '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-ann-audit">审核</button>'
            : "—";
        return (
          "<tr data-id='" +
          esc(row.id) +
          "'>" +
          "<td class='col-sticky-left-1'>" +
          (start + idx + 1) +
          "</td>" +
          "<td>" +
          esc(row.publisherAccount) +
          "</td>" +
          "<td>" +
          esc(channelsLabel(row.channels)) +
          "</td>" +
          "<td>" +
          esc(TARGET[row.target] || row.target) +
          "</td>" +
          "<td>" +
          esc(row.target === "specified" ? row.targetUids : "—") +
          "</td>" +
          "<td>" +
          esc(MSG_TYPE[row.msgType] || row.msgType) +
          "</td>" +
          "<td>" +
          renderContentCell(row) +
          "</td>" +
          "<td>" +
          esc(row.createdBy) +
          "</td>" +
          "<td class='ann-cell-time'>" +
          esc(row.createdAt) +
          "</td>" +
          "<td class='ann-cell-time'>" +
          esc(row.submittedAt || "—") +
          "</td>" +
          "<td>" +
          esc(row.auditor || "—") +
          "</td>" +
          "<td class='ann-cell-time'>" +
          esc(row.auditedAt || "—") +
          "</td>" +
          "<td>" +
          statusTag(row.status) +
          "</td>" +
          "<td class='col-sticky-right'><div class='ann-ops'>" +
          ops +
          "</div></td></tr>"
        );
      })
      .join("");
  }

  function syncTabUi() {
    document.querySelectorAll(".ann-card-tabs [data-ann-tab]").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-ann-tab") === state.tab);
    });
    var draftPanel = document.getElementById("annDraftPanel");
    var auditPanel = document.getElementById("annAuditPanel");
    if (draftPanel) draftPanel.hidden = state.tab !== "draft";
    if (auditPanel) auditPanel.hidden = state.tab !== "audit";
    if (pager) {
      pager.resetPage();
      pager.setTotal(getActiveList().length);
    }
    renderActiveTable();
  }

  function refreshLists() {
    if (pager) {
      pager.setTotal(getActiveList().length);
      pager.refresh();
    }
    renderActiveTable();
  }

  function buildFormBody(data) {
    data = data || {};
    var channels = data.channels || ["APP"];
    function ch(c) {
      return channels.indexOf(c) >= 0 ? " checked" : "";
    }
    return (
      '<div class="ann-form" id="annForm">' +
      '<div class="ann-form-row"><span class="ann-form-label">发布类型<span class="req">*</span></span>' +
      '<div class="ann-radio-group">' +
      '<label><input type="radio" name="annPublishType" value="system"' +
      (data.publishType !== "force" ? " checked" : "") +
      "> 系统公告</label>" +
      '<label><input type="radio" name="annPublishType" value="force"' +
      (data.publishType === "force" ? " checked" : "") +
      "> 系统强公告</label></div></div>" +
      '<div class="ann-form-row"><span class="ann-form-label">选择渠道<span class="req">*</span></span>' +
      '<div class="ann-check-group">' +
      '<label><input type="checkbox" name="annChannel" value="APP"' +
      ch("APP") +
      "> APP</label>" +
      '<label><input type="checkbox" name="annChannel" value="PC"' +
      ch("PC") +
      "> PC</label>" +
      '<label><input type="checkbox" name="annChannel" value="WEB"' +
      ch("WEB") +
      "> WEB</label></div></div>" +
      '<div class="ann-form-row"><span class="ann-form-label">发送对象<span class="req">*</span></span>' +
      '<div class="ann-radio-group">' +
      '<label><input type="radio" name="annTarget" value="all"' +
      (data.target === "all" || !data.target ? " checked" : "") +
      "> 全部用户</label>" +
      '<label><input type="radio" name="annTarget" value="specified"' +
      (data.target === "specified" ? " checked" : "") +
      "> 指定用户</label>" +
      '<label><input type="radio" name="annTarget" value="online"' +
      (data.target === "online" ? " checked" : "") +
      "> 在线用户</label></div>" +
      '<div class="ann-target-uids" id="annTargetUidsWrap"' +
      (data.target === "specified" ? "" : ' style="display:none"') +
      '><input class="ant-input" id="annTargetUids" placeholder="请输入用户 UID，多个用英文逗号分隔，例如：882910,102938,556677" value="' +
      esc(data.targetUids || "") +
      '"><p class="ann-hint">仅向列出的 UID 推送；请使用平台用户 UID，勿填昵称或邮箱。</p></div></div>' +
      '<div class="ann-form-row"><span class="ann-form-label">消息类型<span class="req">*</span></span>' +
      '<div class="ann-radio-group" id="annMsgTypeGroup">' +
      '<label><input type="radio" name="annMsgType" value="text"' +
      (data.msgType === "text" || !data.msgType ? " checked" : "") +
      "> 文本</label>" +
      '<label><input type="radio" name="annMsgType" value="image"' +
      (data.msgType === "image" ? " checked" : "") +
      "> 图片</label>" +
      '<label><input type="radio" name="annMsgType" value="video"' +
      (data.msgType === "video" ? " checked" : "") +
      "> 视频</label>" +
      '<label><input type="radio" name="annMsgType" value="richtext"' +
      (data.msgType === "richtext" ? " checked" : "") +
      "> 富文本</label></div></div>" +
      '<div class="ann-form-row ann-content-area" id="annTextArea"' +
      (data.msgType === "image" || data.msgType === "video" ? ' style="display:none"' : "") +
      '><span class="ann-form-label">消息内容<span class="req">*</span></span>' +
      '<textarea class="ant-input" id="annContentText" placeholder="请输入公告正文">' +
      esc(data.contentText || "") +
      "</textarea></div>" +
      '<div class="ann-form-row" id="annMediaArea"' +
      (data.msgType === "image" || data.msgType === "video" ? "" : ' style="display:none"') +
      '><span class="ann-form-label">上传文件<span class="req">*</span></span>' +
      '<div class="ann-upload-row">' +
      '<button type="button" class="ant-btn ant-btn-sm" id="annUploadBtn"><i class="fa-solid fa-upload"></i> 选择文件</button>' +
      '<input type="file" id="annUploadFile" accept="' +
      (data.msgType === "video" ? "video/*" : "image/*") +
      '" hidden>' +
      '<span id="annUploadName" style="font-size:12px;color:rgba(0,0,0,.45)">' +
      (data.contentMediaUrl ? "已选择文件" : "未选择") +
      "</span></div>" +
      '<input type="hidden" id="annContentMedia" value="' +
      esc(data.contentMediaUrl || "") +
      '">' +
      '<div class="ann-upload-preview" id="annUploadPreview">' +
      (data.msgType === "image" && data.contentMediaUrl
        ? '<img src="' + esc(data.contentMediaUrl) + '" alt="">'
        : data.msgType === "video" && data.contentMediaUrl
          ? '<video src="' + esc(data.contentMediaUrl) + '" controls style="max-width:200px"></video>'
          : "") +
      "</div></div></div>"
    );
  }

  function wireForm(bodyEl) {
    if (!bodyEl) return;
    var form = bodyEl.querySelector("#annForm") || bodyEl;
    var targetRadios = form.querySelectorAll('input[name="annTarget"]');
    var uidWrap = form.querySelector("#annTargetUidsWrap");
    targetRadios.forEach(function (r) {
      r.addEventListener("change", function () {
        if (!r.checked || !uidWrap) return;
        uidWrap.style.display = r.value === "specified" ? "" : "none";
      });
    });

    var msgRadios = form.querySelectorAll('input[name="annMsgType"]');
    var textArea = form.querySelector("#annTextArea");
    var mediaArea = form.querySelector("#annMediaArea");
    var uploadFile = form.querySelector("#annUploadFile");
    msgRadios.forEach(function (r) {
      r.addEventListener("change", function () {
        if (!r.checked) return;
        var isMedia = r.value === "image" || r.value === "video";
        if (textArea) textArea.style.display = isMedia ? "none" : "";
        if (mediaArea) mediaArea.style.display = isMedia ? "" : "none";
        if (uploadFile) uploadFile.setAttribute("accept", r.value === "video" ? "video/*" : "image/*");
      });
    });

    var uploadBtn = form.querySelector("#annUploadBtn");
    var mediaInput = form.querySelector("#annContentMedia");
    var preview = form.querySelector("#annUploadPreview");
    var nameEl = form.querySelector("#annUploadName");
    if (uploadBtn && uploadFile) {
      uploadBtn.addEventListener("click", function () {
        uploadFile.click();
      });
      uploadFile.addEventListener("change", function () {
        var file = uploadFile.files && uploadFile.files[0];
        if (!file) return;
        var url = URL.createObjectURL(file);
        if (mediaInput) mediaInput.value = url;
        if (nameEl) nameEl.textContent = file.name;
        if (preview) {
          if (file.type.indexOf("video") === 0) {
            preview.innerHTML = '<video src="' + esc(url) + '" controls></video>';
          } else {
            preview.innerHTML = '<img src="' + esc(url) + '" alt="">';
          }
        }
      });
    }
  }

  function readForm(bodyEl) {
    var form = bodyEl.querySelector("#annForm") || bodyEl;
    var publishType = "system";
    form.querySelectorAll('input[name="annPublishType"]').forEach(function (r) {
      if (r.checked) publishType = r.value;
    });
    var channels = [];
    form.querySelectorAll('input[name="annChannel"]:checked').forEach(function (c) {
      channels.push(c.value);
    });
    var target = "all";
    form.querySelectorAll('input[name="annTarget"]').forEach(function (r) {
      if (r.checked) target = r.value;
    });
    var targetUids = (form.querySelector("#annTargetUids") || {}).value || "";
    var msgType = "text";
    form.querySelectorAll('input[name="annMsgType"]').forEach(function (r) {
      if (r.checked) msgType = r.value;
    });
    var contentText = (form.querySelector("#annContentText") || {}).value || "";
    var contentMediaUrl = (form.querySelector("#annContentMedia") || {}).value || "";
    return {
      publishType: publishType,
      channels: channels,
      target: target,
      targetUids: targetUids.trim(),
      msgType: msgType,
      contentText: contentText.trim(),
      contentMediaUrl: contentMediaUrl
    };
  }

  function validateForm(data) {
    if (!data.channels.length) {
      M.toast("请至少选择一个渠道");
      return false;
    }
    if (data.target === "specified" && !data.targetUids) {
      M.toast("指定用户时请填写用户 UID");
      return false;
    }
    if (data.msgType === "text" || data.msgType === "richtext") {
      if (!data.contentText) {
        M.toast("请填写消息内容");
        return false;
      }
    } else if (!data.contentMediaUrl) {
      M.toast("请上传图片或视频");
      return false;
    }
    return true;
  }

  function saveDraftRecord(data, id) {
    var at = nowStr();
    if (id) {
      var existing = findDraft(id);
      if (existing) {
        Object.assign(existing, data, { updatedAt: at, updatedBy: CURRENT_USER });
        return existing;
      }
    }
    var row = Object.assign({}, data, {
      id: "ANN-D" + Date.now(),
      publisherAccount: PUBLISHER_ACCOUNT,
      createdBy: CURRENT_USER,
      createdAt: at,
      updatedAt: at,
      updatedBy: CURRENT_USER
    });
    drafts.unshift(row);
    return row;
  }

  function submitToAudit(data, draftId) {
    var at = nowStr();
    if (draftId) {
      var idx = -1;
      for (var i = 0; i < drafts.length; i++) {
        if (drafts[i].id === draftId) {
          idx = i;
          break;
        }
      }
      if (idx >= 0) drafts.splice(idx, 1);
    }
    audits.unshift(
      Object.assign({}, data, {
        id: "ANN-A" + Date.now(),
        publisherAccount: PUBLISHER_ACCOUNT,
        createdBy: data.createdBy || CURRENT_USER,
        createdAt: data.createdAt || at,
        submittedAt: at,
        auditor: null,
        auditedAt: null,
        status: "pending"
      })
    );
  }

  function openFormModal(opts) {
    opts = opts || {};
    editingDraftId = opts.draftId || null;
    var isEdit = !!editingDraftId;
    M.open({
      title: isEdit ? "编辑公告" : "添加公告",
      wide: true,
      width: 720,
      body: buildFormBody(opts.data || {}),
      onMount: function (bodyEl) {
        wireForm(bodyEl);
      },
      footer: [
        { text: "取消", onClick: M.close },
        {
          text: "保存",
          onClick: function () {
            var bodyEl = document.querySelector("#admin-fl-modal-root .fl-modal-body");
            var data = readForm(bodyEl);
            if (!validateForm(data)) return;
            saveDraftRecord(data, editingDraftId);
            M.close();
            M.toast(isEdit ? "保存成功" : "创建成功");
            state.tab = "draft";
            syncTabUi();
            refreshLists();
          }
        },
        {
          text: "提交",
          primary: true,
          onClick: function () {
            var bodyEl = document.querySelector("#admin-fl-modal-root .fl-modal-body");
            var data = readForm(bodyEl);
            if (!validateForm(data)) return;
            var draftId = editingDraftId;
            if (draftId) {
              var existing = findDraft(draftId);
              if (existing) {
                data.createdBy = existing.createdBy;
                data.createdAt = existing.createdAt;
              }
            } else {
              data.createdBy = CURRENT_USER;
              data.createdAt = nowStr();
            }
            M.close();
            M.confirmGoogle({
              message: "提交公告将进入发送审核队列，需输入当前登录成员的谷歌验证码。",
              onVerified: function () {
                submitToAudit(data, draftId);
                M.toast("发布成功");
                state.tab = "audit";
                syncTabUi();
                refreshLists();
              }
            });
          }
        }
      ]
    });
  }

  function renderAuditBody(row) {
    return (
      '<div class="ann-audit-detail">' +
      '<div class="ann-audit-section"><h4>公告信息</h4>' +
      '<dl class="ann-audit-kv">' +
      "<dt>发布类型</dt><dd>" +
      esc(PUBLISH_TYPE[row.publishType] || row.publishType) +
      "</dd>" +
      "<dt>发布账号</dt><dd>" +
      esc(row.publisherAccount) +
      "</dd>" +
      "<dt>渠道</dt><dd>" +
      esc(channelsLabel(row.channels)) +
      "</dd>" +
      "<dt>发送对象</dt><dd>" +
      esc(TARGET[row.target] || row.target) +
      (row.target === "specified" ? "（" + esc(row.targetUids) + "）" : "") +
      "</dd>" +
      "<dt>消息类型</dt><dd>" +
      esc(MSG_TYPE[row.msgType] || row.msgType) +
      "</dd>" +
      "<dt>创建人</dt><dd>" +
      esc(row.createdBy) +
      "</dd>" +
      "<dt>创建时间</dt><dd class='ann-cell-time'>" +
      esc(row.createdAt) +
      "</dd>" +
      "<dt>提交时间</dt><dd class='ann-cell-time'>" +
      esc(row.submittedAt || "—") +
      "</dd>" +
      "</dl></div>" +
      '<div class="ann-audit-section"><h4>消息内容</h4>' +
      renderMessageBody(row, true) +
      "</div>" +
      '<div class="ann-audit-note-wrap" id="annAuditNoteWrap">' +
      '<label class="ann-audit-note-label" for="annAuditNote">审核批注</label>' +
      '<textarea class="ant-input" id="annAuditNote" placeholder="拒绝时请填写拒绝原因"></textarea>' +
      '<p class="ann-audit-note-err" id="annAuditNoteErr" hidden>请填写拒绝原因</p>' +
      "</div></div>"
    );
  }

  function bindModalPreview(root) {
    if (!root) return;
    root.querySelectorAll(".js-ann-modal-preview").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openLightbox(btn.getAttribute("data-type"), btn.getAttribute("data-src"));
      });
    });
  }

  function getAuditNote() {
    var el = document.getElementById("annAuditNote");
    return el ? String(el.value).trim() : "";
  }

  function showAuditNoteError() {
    var wrap = document.getElementById("annAuditNoteWrap");
    var err = document.getElementById("annAuditNoteErr");
    var el = document.getElementById("annAuditNote");
    if (wrap) wrap.classList.add("is-error");
    if (err) err.hidden = false;
    if (el) el.focus();
  }

  function clearAuditNoteError() {
    var wrap = document.getElementById("annAuditNoteWrap");
    var err = document.getElementById("annAuditNoteErr");
    if (wrap) wrap.classList.remove("is-error");
    if (err) err.hidden = true;
  }

  function openAuditModal(row) {
    M.open({
      title: "公告审核 · " + row.id,
      wide: true,
      width: 720,
      body: renderAuditBody(row),
      onMount: function (bodyEl) {
        bindModalPreview(bodyEl);
        var noteEl = document.getElementById("annAuditNote");
        if (noteEl) noteEl.addEventListener("input", clearAuditNoteError);
      },
      footer: [
        { text: "取消", onClick: M.close },
        {
          text: "拒绝",
          danger: true,
          onClick: function () {
            var note = getAuditNote();
            if (!note) {
              showAuditNoteError();
              return;
            }
            clearAuditNoteError();
            row.status = "rejected";
            row.auditor = "王审核";
            row.auditedAt = nowStr();
            row.rejectReason = note;
            M.close();
            M.toast("审核已拒绝");
            refreshLists();
          }
        },
        {
          text: "通过",
          primary: true,
          onClick: function () {
            var note = getAuditNote();
            M.close();
            M.confirmGoogle({
              message: "确认通过该公告？通过后将在用户端展示。",
              onVerified: function () {
                row.status = "approved";
                row.auditor = "王审核";
                row.auditedAt = nowStr();
                if (note) row.approveNote = note;
                M.toast("审核通过");
                refreshLists();
              }
            });
          }
        }
      ]
    });
  }

  function ensureLightbox() {
    if (lightboxEl) return lightboxEl;
    lightboxEl = document.createElement("div");
    lightboxEl.id = "annMediaLightbox";
    lightboxEl.className = "ann-media-lightbox";
    lightboxEl.innerHTML =
      '<button type="button" class="ann-media-lightbox-close" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>' +
      '<div class="ann-media-lightbox-stage" id="annMediaLightboxStage"></div>';
    document.body.appendChild(lightboxEl);
    lightboxEl.querySelector(".ann-media-lightbox-close").addEventListener("click", closeLightbox);
    lightboxEl.addEventListener("click", function (e) {
      if (e.target === lightboxEl) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightboxEl.classList.contains("is-open")) closeLightbox();
    });
    return lightboxEl;
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    var stage = document.getElementById("annMediaLightboxStage");
    if (stage) {
      var v = stage.querySelector("video");
      if (v) {
        v.pause();
        v.removeAttribute("src");
      }
      stage.innerHTML = "";
    }
    lightboxEl.classList.remove("is-open");
    document.body.classList.remove("ann-media-lightbox-open");
  }

  function openLightbox(type, src) {
    var lb = ensureLightbox();
    var stage = document.getElementById("annMediaLightboxStage");
    if (!stage) return;
    stage.innerHTML = "";
    if (type === "video") {
      var video = document.createElement("video");
      video.src = src;
      video.controls = true;
      video.playsInline = true;
      stage.appendChild(video);
    } else {
      var img = document.createElement("img");
      img.src = src;
      img.alt = "预览";
      stage.appendChild(img);
    }
    lb.classList.add("is-open");
    document.body.classList.add("ann-media-lightbox-open");
  }

  function submitDraftById(id) {
    var row = findDraft(id);
    if (!row) return;
    M.confirmGoogle({
      message: "提交公告将进入发送审核队列，需输入谷歌验证码。",
      onVerified: function () {
        submitToAudit(Object.assign({}, row), id);
        M.toast("发布成功");
        state.tab = "audit";
        syncTabUi();
        refreshLists();
      }
    });
  }

  function bind() {
    var btnNew = document.getElementById("btnAnnNew");
    if (btnNew) {
      btnNew.addEventListener("click", function () {
        editingDraftId = null;
        openFormModal({});
      });
    }

    document.querySelectorAll(".ann-card-tabs [data-ann-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.tab = btn.getAttribute("data-ann-tab");
        syncTabUi();
      });
    });

    document.getElementById("annDraftPanel").addEventListener("click", function (e) {
      var tr = e.target.closest("tr[data-id]");
      if (!tr) return;
      var id = tr.getAttribute("data-id");
      if (e.target.closest(".js-ann-edit")) {
        var row = findDraft(id);
        if (row) openFormModal({ draftId: id, data: row });
      }
      if (e.target.closest(".js-ann-submit")) submitDraftById(id);
      if (e.target.closest(".js-ann-delete")) {
        M.open({
          title: "删除草稿",
          body: "<p style='margin:0'>确认删除该草稿？删除后不可恢复。</p>",
          footer: [
            { text: "取消", onClick: M.close },
            {
              text: "删除",
              danger: true,
              onClick: function () {
                drafts = drafts.filter(function (d) {
                  return d.id !== id;
                });
                M.close();
                M.toast("已删除");
                refreshLists();
              }
            }
          ]
        });
      }
      var preview = e.target.closest(".js-ann-preview");
      if (preview) {
        openLightbox(preview.getAttribute("data-type"), preview.getAttribute("data-src"));
      }
    });

    document.getElementById("annAuditPanel").addEventListener("click", function (e) {
      var tr = e.target.closest("tr[data-id]");
      if (!tr) return;
      var id = tr.getAttribute("data-id");
      if (e.target.closest(".js-ann-audit")) {
        var row = findAudit(id);
        if (row) openAuditModal(row);
      }
      var preview = e.target.closest(".js-ann-preview");
      if (preview) {
        openLightbox(preview.getAttribute("data-type"), preview.getAttribute("data-src"));
      }
    });

    var pagerMount = document.getElementById("annPager");
    if (window.AdminPager && pagerMount) {
      pager = AdminPager.create({
        mount: pagerMount,
        pageSize: 10,
        onChange: renderActiveTable
      });
      pager.setTotal(drafts.length);
    }

    syncTabUi();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
