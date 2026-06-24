/**
 * KYC 审核记录页
 */
(function () {
  var M = window.AdminModal;
  var Store = window.AdminKycAuditStore;
  var KycCfg = window.AdminKycConfigStore;
  if (!M || !Store) return;

  var tbody = document.getElementById("kycTbody");
  var pagerMount = document.getElementById("kycPager");
  var filterUid = document.getElementById("kycFilterUid");
  var filterName = document.getElementById("kycFilterName");
  var filterStatus = document.getElementById("kycFilterStatus");
  var filterSubmitStart = document.getElementById("kycFilterSubmitStart");
  var filterSubmitEnd = document.getElementById("kycFilterSubmitEnd");
  var filterReviewStart = document.getElementById("kycFilterReviewStart");
  var filterReviewEnd = document.getElementById("kycFilterReviewEnd");
  var allRows = [];
  var pager = null;

  function esc(s) {
    return M.esc(s == null ? "" : String(s));
  }

  function filterVal(el) {
    return el ? String(el.value || "").trim() : "";
  }

  function parseFilterTime(val) {
    if (!val) return null;
    var dt = new Date(val);
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  function recordTimeMs(str) {
    if (!str || str === "—") return null;
    var dt = new Date(String(str).replace(/-/g, "/"));
    return isNaN(dt.getTime()) ? null : dt.getTime();
  }

  function inTimeRange(recordVal, startVal, endVal) {
    if (!startVal && !endVal) return true;
    var ms = recordTimeMs(recordVal);
    if (ms == null) return false;
    var start = parseFilterTime(startVal);
    var end = parseFilterTime(endVal);
    if (start != null && ms < start) return false;
    if (end != null && ms > end) return false;
    return true;
  }

  function toDatetimeLocalValue(d) {
    var pad = function (n) {
      return n < 10 ? "0" + n : String(n);
    };
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  function defaultSubmitTimeRange() {
    var end = new Date();
    var start = new Date();
    start.setMonth(start.getMonth() - 1);
    return {
      start: toDatetimeLocalValue(start),
      end: toDatetimeLocalValue(end)
    };
  }

  function applyDefaultSubmitRange() {
    var range = defaultSubmitTimeRange();
    if (filterSubmitStart) filterSubmitStart.value = range.start;
    if (filterSubmitEnd) filterSubmitEnd.value = range.end;
  }

  function clearReviewTimeRange() {
    if (filterReviewStart) filterReviewStart.value = "";
    if (filterReviewEnd) filterReviewEnd.value = "";
  }

  function resetFilters() {
    if (filterUid) filterUid.value = "";
    if (filterName) filterName.value = "";
    if (filterStatus) filterStatus.value = "";
    applyDefaultSubmitRange();
    clearReviewTimeRange();
    if (pager) pager.resetPage();
    renderTable();
  }

  function statusTag(st) {
    if (st === "通过") return '<span class="ant-tag ant-tag-green">通过</span>';
    if (st === "驳回") return '<span class="ant-tag ant-tag-red">驳回</span>';
    if (st === "待审核") return '<span class="ant-tag ant-tag-orange">待审核</span>';
    return '<span class="ant-tag">' + esc(st) + "</span>";
  }

  function realNameCell(r) {
    return esc(r.realName || "—");
  }

  function dashTime(v) {
    return v ? esc(v) : "—";
  }

  function getFiltered() {
    var uid = filterVal(filterUid);
    var name = filterVal(filterName).toLowerCase();
    var st = filterStatus ? filterStatus.value : "";
    var submitStart = filterVal(filterSubmitStart);
    var submitEnd = filterVal(filterSubmitEnd);
    var reviewStart = filterVal(filterReviewStart);
    var reviewEnd = filterVal(filterReviewEnd);

    return allRows.filter(function (r) {
      if (st && r.status !== st) return false;
      if (uid && String(r.uid).indexOf(uid) < 0) return false;
      if (name) {
        var hit =
          String(r.realName || "").toLowerCase().indexOf(name) >= 0 ||
          String(r.realNameAlt || "").toLowerCase().indexOf(name) >= 0;
        if (!hit) return false;
      }
      if (!inTimeRange(r.submittedAt, submitStart, submitEnd)) return false;
      if (!inTimeRange(r.reviewedAt, reviewStart, reviewEnd)) return false;
      return true;
    });
  }

  function renderTable() {
    if (!tbody) return;
    var filtered = getFiltered();
    if (pager) pager.setTotal(filtered.length);
    var pageRows = pager ? pager.getSlice(filtered) : filtered;
    var startIdx = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;

    if (!pageRows.length) {
      tbody.innerHTML =
        '<tr><td colspan="12" style="text-align:center;padding:40px;color:rgba(0,0,0,.45)">暂无审核记录</td></tr>';
      return;
    }

    tbody.innerHTML = pageRows
      .map(function (r, i) {
        return (
          "<tr>" +
          '<td class="col-sticky-left-1">' +
          (startIdx + i + 1) +
          "</td>" +
          '<td class="col-sticky-left-2"><span class="js-uid-link" data-uid="' +
          esc(r.uid) +
          '">' +
          esc(r.uid) +
          "</span></td>" +
          "<td>" +
          realNameCell(r) +
          "</td>" +
          "<td>" +
          statusTag(r.status) +
          "</td>" +
          "<td>" +
          esc(r.deviceName) +
          "</td>" +
          "<td><code style='font-size:11px'>" +
          esc(r.deviceId) +
          "</code></td>" +
          "<td><code style='font-size:12px'>" +
          esc(r.ip) +
          "</code></td>" +
          "<td>" +
          esc(r.region) +
          "</td>" +
          "<td>" +
          dashTime(r.registeredAt) +
          "</td>" +
          "<td>" +
          dashTime(r.submittedAt) +
          "</td>" +
          "<td>" +
          dashTime(r.reviewedAt) +
          "</td>" +
          '<td class="col-sticky-right"><button type="button" class="ant-btn ant-btn-link ant-btn-sm js-kyc-view" data-id="' +
          esc(r.id) +
          '">查看</button></td>' +
          "</tr>"
        );
      })
      .join("");
  }

  function idCardThumb(url, label) {
    if (!url) {
      return '<span style="color:rgba(0,0,0,.35);font-size:12px">—</span>';
    }
    return (
      '<button type="button" class="kyc-id-thumb js-kyc-id-preview" data-src="' +
      esc(url) +
      '" data-label="' +
      esc(label) +
      '" title="点击放大 · ' +
      esc(label) +
      '">' +
      '<img src="' +
      esc(url) +
      '" alt="' +
      esc(label) +
      '">' +
      '<span class="kyc-id-thumb-zoom" aria-hidden="true"><i class="fa-solid fa-magnifying-glass-plus"></i></span>' +
      "</button>"
    );
  }

  function ensureIdCardPreviewOverlay() {
    var overlay = document.getElementById("kyc-id-preview-overlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "kyc-id-preview-overlay";
    overlay.className = "kyc-id-preview-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<div class="kyc-id-preview-backdrop"></div>' +
      '<div class="kyc-id-preview-panel" role="dialog" aria-modal="true">' +
      '<button type="button" class="kyc-id-preview-close" aria-label="关闭">&times;</button>' +
      '<div class="kyc-id-preview-title"></div>' +
      '<div class="kyc-id-preview-body"><img class="kyc-id-preview-img" alt=""></div>' +
      "</div>";
    document.body.appendChild(overlay);
    overlay.querySelector(".kyc-id-preview-backdrop").addEventListener("click", closeIdCardPreview);
    overlay.querySelector(".kyc-id-preview-close").addEventListener("click", closeIdCardPreview);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) closeIdCardPreview();
    });
    return overlay;
  }

  function openIdCardPreview(src, label) {
    var overlay = ensureIdCardPreviewOverlay();
    overlay.querySelector(".kyc-id-preview-title").textContent = label || "证件预览";
    overlay.querySelector(".kyc-id-preview-img").src = src;
    overlay.querySelector(".kyc-id-preview-img").alt = label || "证件预览";
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeIdCardPreview() {
    var overlay = document.getElementById("kyc-id-preview-overlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
  }

  function mountIdCardPreview(bodyEl) {
    if (!bodyEl || bodyEl._kycPreviewBound) return;
    bodyEl._kycPreviewBound = true;
    bodyEl.addEventListener("click", function (e) {
      var thumb = e.target.closest(".js-kyc-id-preview");
      if (!thumb) return;
      e.preventDefault();
      e.stopPropagation();
      openIdCardPreview(thumb.getAttribute("data-src"), thumb.getAttribute("data-label"));
    });
  }

  function rejectReasonCell(row) {
    if (row.status === "驳回") {
      return esc(row.rejectReason || row.remark || "—");
    }
    return "—";
  }

  function isMachineActor(actor) {
    return !actor || actor === "system" || actor === "Verify API";
  }

  function getThresholds() {
    return KycCfg ? KycCfg.read() : { autoPassScore: 85, manualReviewScore: 60 };
  }

  function fmtScore(score) {
    if (KycCfg) return KycCfg.formatScore(score);
    if (score == null || isNaN(Number(score))) return "—";
    return Number(score).toFixed(1);
  }

  function isMachineReview(record) {
    if (record.source === "admin") return false;
    if (record.machineReviewResult === "manual" || record.machineReviewResult === "api_error") return false;
    if (record.status === "待审核") return false;
    if (record.machineReviewResult === "pass" || record.machineReviewResult === "reject") return true;
    return isMachineActor(record.reviewer);
  }

  function buildMachineReviewStep(record, outcome) {
    var cfg = getThresholds();
    var score = record.faceMatchScore;
    var scoreText = score != null ? "人脸匹配分值 " + fmtScore(score) : "人脸匹配分值未返回";
    var thresholdHint =
      "阈值：直接通过 ≥ " + cfg.autoPassScore + "，人工区间 " + cfg.manualReviewScore + "–" + cfg.autoPassScore;

    if (outcome === "pass") {
      return {
        title: "API 机审",
        status: "通过",
        time: record.reviewedAt || offsetTime(record.submittedAt, 3),
        actor: "Verify API",
        score: score,
        desc:
          scoreText +
          " ≥ 直接通过线(" +
          cfg.autoPassScore +
          ")；" +
          (record.remark || "证件 OCR、真伪与人脸比对通过") +
          "。" +
          thresholdHint
      };
    }
    if (outcome === "reject") {
      return {
        title: "API 机审",
        status: "驳回",
        time: record.reviewedAt || offsetTime(record.submittedAt, 3),
        actor: "Verify API",
        score: score,
        desc:
          scoreText +
          " < 人工审核线(" +
          cfg.manualReviewScore +
          ")；" +
          (record.rejectReason || record.remark || "自动驳回，原因已回传用户端") +
          "。" +
          thresholdHint
      };
    }
    if (outcome === "manual") {
      return {
        title: "API 机审",
        status: "转人工",
        time: offsetTime(record.submittedAt, 2),
        actor: "Verify API",
        score: score,
        desc:
          scoreText +
          "，处于人工审核区间 [" +
          cfg.manualReviewScore +
          ", " +
          cfg.autoPassScore +
          ") ，已转入人工队列。" +
          thresholdHint
      };
    }
    return {
      title: "API 机审",
      status: "异常",
      time: offsetTime(record.submittedAt, 2),
      actor: "Verify API",
      score: null,
      desc: "机审 API 超时或异常，" + scoreText + "。" + thresholdHint
    };
  }

  function progressStepClass(stepStatus) {
    if (stepStatus === "完成" || stepStatus === "通过" || stepStatus === "转人工") return "is-done";
    if (stepStatus === "进行中" || stepStatus === "待处理") return "is-active";
    if (stepStatus === "异常") return "is-warn";
    if (stepStatus === "驳回") return "is-reject";
    return "";
  }

  function progressTag(stepStatus) {
    if (stepStatus === "完成" || stepStatus === "通过") {
      return '<span class="ant-tag ant-tag-green">' + esc(stepStatus) + "</span>";
    }
    if (stepStatus === "转人工") {
      return '<span class="ant-tag ant-tag-green">转人工</span>';
    }
    if (stepStatus === "进行中" || stepStatus === "待处理") {
      return '<span class="ant-tag ant-tag-orange">' + esc(stepStatus) + "</span>";
    }
    if (stepStatus === "异常") return '<span class="ant-tag ant-tag-orange">API 异常</span>';
    if (stepStatus === "驳回") return '<span class="ant-tag ant-tag-red">驳回</span>';
    return '<span class="ant-tag">' + esc(stepStatus) + "</span>";
  }

  function offsetTime(baseTime, seconds) {
    if (!baseTime) return "—";
    var dt = new Date(String(baseTime).replace(/-/g, "/"));
    if (isNaN(dt.getTime())) return baseTime;
    dt.setSeconds(dt.getSeconds() + seconds);
    return Store.formatDateTime(dt);
  }

  function buildProgressSteps(record) {
    var steps = [];

    if (record.source === "admin") {
      steps.push({
        title: "运营后台代认证",
        status: "完成",
        time: record.submittedAt,
        actor: record.reviewer || "当前运营",
        desc: record.remark || "后台直接录入并通过，不经过用户端与机审 API"
      });
      return steps;
    }

    steps.push({
      title: "用户提交 KYC 申请",
      status: "完成",
      time: record.submittedAt,
      actor: "用户",
      desc:
        record.method === "wallet"
          ? "发起钱包 zkMe 隐私证明认证"
          : "证件资料与人脸快照已上传"
    });

    steps.push({
      title: "后台生成审核记录",
      status: "完成",
      time: offsetTime(record.submittedAt, 1),
      actor: "system",
      desc: "单号 " + record.id + " 已写入审核队列"
    });

    if (record.method === "wallet") {
      if (record.status === "待审核") {
        steps.push({
          title: "zkMe 验证 API",
          status: "异常",
          time: offsetTime(record.submittedAt, 2),
          actor: "Verify API",
          desc: "链上验证 API 超时或异常，未返回结果"
        });
        steps.push({
          title: "运营人工介入",
          status: "待处理",
          time: null,
          actor: "—",
          desc: "合规人员可随时审核通过或驳回"
        });
        return steps;
      }
      steps.push({
        title: "zkMe 验证 API",
        status: "通过",
        time: record.reviewedAt || offsetTime(record.submittedAt, 3),
        actor: "Verify API",
        desc: record.remark || "链上隐私证明校验通过"
      });
      return steps;
    }

    if (record.status === "待审核") {
      var pendingOutcome = record.machineReviewResult || "api_error";
      steps.push(buildMachineReviewStep(record, pendingOutcome));
      steps.push({
        title: pendingOutcome === "manual" ? "运营人工复核" : "运营人工介入",
        status: "待处理",
        time: null,
        actor: "—",
        desc:
          pendingOutcome === "manual"
            ? "人脸分值处于人工审核区间，等待合规人员复核通过或驳回"
            : "机审 API 异常时，合规人员可随时审核通过或驳回"
      });
      return steps;
    }

    if (record.status === "驳回") {
      if (isMachineReview(record)) {
        steps.push(buildMachineReviewStep(record, "reject"));
        return steps;
      }
      var rejectOutcome = record.machineReviewResult === "api_error" ? "api_error" : "manual";
      steps.push(buildMachineReviewStep(record, rejectOutcome));
      steps.push({
        title: "运营人工审核",
        status: "驳回",
        time: record.reviewedAt,
        actor: record.reviewer || "当前运营",
        score: record.faceMatchScore,
        desc: record.rejectReason || record.remark || "人工驳回"
      });
      return steps;
    }

    if (isMachineReview(record)) {
      steps.push(buildMachineReviewStep(record, "pass"));
      return steps;
    }

    steps.push(buildMachineReviewStep(record, record.machineReviewResult === "api_error" ? "api_error" : "manual"));
    steps.push({
      title: "运营人工审核",
      status: "通过",
      time: record.reviewedAt,
      actor: record.reviewer || "当前运营",
      score: record.faceMatchScore,
      desc: record.remark || "人工审核通过"
    });
    return steps;
  }

  function renderAuditProgress(record) {
    var steps = buildProgressSteps(record);
    var items = steps
      .map(function (step, idx) {
        var cls = progressStepClass(step.status);
        if (idx === steps.length - 1 && (step.status === "进行中" || step.status === "待处理")) {
          cls = "is-active";
        }
        return (
          '<div class="kyc-progress-step ' +
          cls +
          '">' +
          '<div class="kyc-progress-rail"><span class="kyc-progress-dot"></span></div>' +
          '<div class="kyc-progress-content">' +
          '<div class="kyc-progress-head">' +
          "<strong>" +
          esc(step.title) +
          "</strong> " +
          progressTag(step.status) +
          "</div>" +
          '<div class="kyc-progress-meta">' +
          esc(step.time || "—") +
          " · 审核人：" +
          esc(step.actor) +
          (step.score != null && !isNaN(Number(step.score))
            ? " · 人脸分值：<strong>" + esc(fmtScore(step.score)) + "</strong>"
            : "") +
          "</div>" +
          '<div class="kyc-progress-desc">' +
          esc(step.desc) +
          "</div>" +
          "</div></div>"
        );
      })
      .join("");
    return (
      '<div class="kyc-audit-progress">' +
      '<h4 class="kyc-audit-progress-title">审核进度</h4>' +
      '<div class="kyc-progress-steps">' +
      items +
      "</div></div>"
    );
  }

  function renderAuditRecordsTable(history, activeId) {
    var rejected = history.filter(function (h) {
      return h.status === "驳回";
    });
    if (!rejected.length) {
      return (
        '<div class="kyc-audit-records-section">' +
        '<h4 class="kyc-audit-records-title">驳回记录</h4>' +
        '<p style="margin:0;color:rgba(0,0,0,.45);font-size:13px">该用户暂无驳回记录</p></div>'
      );
    }
    var rows = rejected
      .map(function (h) {
        var active = h.id === activeId ? ' class="kyc-audit-row-active"' : "";
        return (
          "<tr" +
          active +
          ">" +
          '<td><span class="js-uid-link" data-uid="' +
          esc(h.uid) +
          '">' +
          esc(h.uid) +
          "</span></td>" +
          "<td><code style='font-size:12px'>" +
          esc(h.idCardNumber || "—") +
          "</code></td>" +
          "<td>" +
          idCardThumb(h.idCardFront, "头像面") +
          "</td>" +
          "<td>" +
          idCardThumb(h.idCardBack, "国徽面") +
          "</td>" +
          "<td>" +
          dashTime(h.submittedAt) +
          "</td>" +
          "<td>" +
          dashTime(h.reviewedAt) +
          "</td>" +
          "<td>" +
          esc(h.reviewer || "—") +
          "</td>" +
          "<td>" +
          rejectReasonCell(h) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    return (
      '<div class="kyc-audit-records-section">' +
      '<h4 class="kyc-audit-records-title">驳回记录</h4>' +
      '<div class="kyc-audit-records-scroll">' +
      '<div class="ant-table ant-table-bordered ant-table-small kyc-audit-records-table">' +
      "<table>" +
      "<thead><tr>" +
      "<th>用户 UID</th>" +
      "<th>身份证号</th>" +
      "<th>身份证头像面</th>" +
      "<th>身份证国徽面</th>" +
      "<th>提交时间</th>" +
      "<th>审核时间</th>" +
      "<th>审核人</th>" +
      "<th>拒绝原因</th>" +
      "</tr></thead>" +
      "<tbody>" +
      rows +
      "</tbody></table></div></div></div>"
    );
  }

  function openDetailModal(recordId) {
    var record = Store.getById(recordId);
    if (!record) {
      M.toast("记录不存在");
      return;
    }
    var history = Store.getHistoryByUid(record.uid);
    var canReview = record.status === "待审核";

    var reviewBlock = canReview
      ? '<div class="kyc-review-form">' +
        '<h4 style="margin:0 0 8px;font-size:14px">运营人工介入</h4>' +
        '<p style="margin:0 0 12px;font-size:12px;color:rgba(0,0,0,.45);line-height:1.6">' +
        (record.machineReviewResult === "manual"
          ? "人脸分值 " +
            esc(fmtScore(record.faceMatchScore)) +
            " 处于人工审核区间，请合规人员复核。"
          : "机审 API 异常未返回分值时，合规人员可在此直接通过或驳回。") +
        "</p>" +
        '<div class="kyc-review-radios">' +
        '<label><input type="radio" name="kycReviewDecision" value="approve" checked> 审核通过</label>' +
        '<label><input type="radio" name="kycReviewDecision" value="reject"> 审核驳回</label>' +
        "</div>" +
        '<label style="display:block;margin:12px 0 6px;font-size:13px;color:rgba(0,0,0,.65)">拒绝原因 / 备注（选填，驳回时建议填写）</label>' +
        '<textarea class="ant-input" id="kycReviewRemark" rows="3" placeholder="驳回时请填写拒绝原因" style="width:100%;resize:vertical"></textarea>' +
        "</div>"
      : "";

    var body =
      '<p style="margin:0 0 16px"><span class="ant-tag">UID ' +
      esc(record.uid) +
      "</span> <strong>" +
      esc(record.realName) +
      "</strong> " +
      statusTag(record.status) +
      "</p>" +
      renderAuditRecordsTable(history, record.id) +
      renderAuditProgress(record) +
      reviewBlock;

    var footer = [{ text: "关闭", onClick: M.close }];
    if (canReview) {
      footer.unshift({
        text: "提交审核",
        primary: true,
        onClick: function () {
          var bodyEl = document.querySelector("#admin-fl-modal-root .fl-modal-body");
          var decisionEl = bodyEl ? bodyEl.querySelector('input[name="kycReviewDecision"]:checked') : null;
          var remarkEl = document.getElementById("kycReviewRemark");
          var decision = decisionEl ? decisionEl.value : "approve";
          var remark = remarkEl ? String(remarkEl.value || "").trim() : "";

          M.confirmGoogle({
            title: decision === "approve" ? "确认审核通过" : "确认审核驳回",
            message:
              "UID " +
              record.uid +
              " · " +
              record.realName +
              (decision === "reject" && !remark ? "\n（建议填写驳回备注）" : ""),
            onVerified: function () {
              Store.review(record.id, decision, remark, "当前运营");
              if (window.AdminUsersList && window.AdminUsersList.getUserByUid) {
                var u = window.AdminUsersList.getUserByUid(record.uid);
                if (u) {
                  u.kycStatus = decision === "approve" ? "已认证" : "尚未认证";
                  u.updatedAt = Store.nowStr();
                }
              }
              M.close();
              M.notify(decision === "approve" ? "已审核通过" : "已驳回", decision === "approve" ? "success" : "error");
              reload();
            }
          });
        }
      });
    }

    M.open({
      title: "KYC 审核详情 · UID " + record.uid,
      wide: true,
      body: body,
      footer: footer,
      onMount: function (bodyEl) {
        mountIdCardPreview(bodyEl);
      }
    });
  }

  function reload() {
    allRows = Store.readAll().slice().sort(function (a, b) {
      return String(b.submittedAt).localeCompare(String(a.submittedAt));
    });
    renderTable();
  }

  if (pagerMount && window.AdminPager) {
    pager = window.AdminPager.create({
      mount: pagerMount,
      pageSize: 10,
      onChange: function () {
        renderTable();
      }
    });
  }

  var btnQuery = document.getElementById("kycSearch");
  if (btnQuery) {
    btnQuery.addEventListener("click", function () {
      if (pager) pager.resetPage();
      renderTable();
      M.toast("已查询 " + getFiltered().length + " 条");
    });
  }

  var btnResetFilters = document.getElementById("kycFilterReset");
  if (btnResetFilters) {
    btnResetFilters.addEventListener("click", function () {
      resetFilters();
      M.notify("已恢复默认筛选条件", "success");
    });
  }

  var btnReset = document.getElementById("kycResetDemo");
  if (btnReset) {
    btnReset.addEventListener("click", function () {
      M.confirmGoogle({
        title: "重置演示数据",
        message: "将恢复 KYC 审核记录种子数据，是否继续？",
        onVerified: function () {
          Store.resetDemo();
          reload();
          M.notify("已重置演示数据", "success");
        }
      });
    });
  }

  if (filterStatus) {
    filterStatus.addEventListener("change", function () {
      if (pager) pager.resetPage();
      renderTable();
    });
  }

  [filterUid, filterName, filterSubmitStart, filterSubmitEnd, filterReviewStart, filterReviewEnd].forEach(function (el) {
    if (!el) return;
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        if (pager) pager.resetPage();
        renderTable();
        M.toast("已查询 " + getFiltered().length + " 条");
      }
    });
  });

  document.querySelector("main.admin-content").addEventListener("click", function (e) {
    var viewBtn = e.target.closest(".js-kyc-view");
    if (viewBtn) {
      openDetailModal(viewBtn.getAttribute("data-id"));
    }
  });

  applyDefaultSubmitRange();
  clearReviewTimeRange();
  reload();
})();
