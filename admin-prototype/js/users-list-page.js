/**
 * 用户列表页：筛选、表格渲染、详情弹窗
 */
(function () {
  var M = window.AdminModal;
  if (!M) return;

  var tbody = document.getElementById("usersTableBody");
  var pagerMount = document.getElementById("usersPager");
  var pager = null;

  var MOCK_USERS = [
    {
      uid: "882910",
      nickname: "小岛日和",
      username: "xiaodao_rihe",
      email: "island.day@example.com",
      inviteCode: "FL2025A",
      kycStatus: "已认证",
      updatedAt: "2026-06-20 14:32:18",
      registeredAt: "2025-12-01 09:15:42",
      regLocation: "上海市浦东新区",
      regIp: "203.0.113.42",
      accountStatus: "正常",
      walletStatus: "启用",
      regChannel: "Web",
      regDevice: "Chrome / macOS",
      payPasswordSet: true,
      ledger: [
        { category: "recharge", time: "2026-06-18 08:01:22", type: "链上充值", currency: "USDT", change: "+200.00", balance: "1,420.50", orderId: "CH772910" },
        { category: "withdraw", time: "2026-06-16 11:30:00", type: "链上提现", currency: "USDT", change: "-100.00", balance: "1,220.50", orderId: "WD882901" },
        { category: "points", time: "2026-06-15 16:44:09", type: "积分消耗", currency: "POINT", change: "-500", balance: "12,300", orderId: "RD88211" },
        { category: "points", time: "2026-06-10 11:20:33", type: "积分奖励", currency: "POINT", change: "+200", balance: "12,800", orderId: "RW88102" },
        { category: "recharge", time: "2026-06-05 09:12:08", type: "法币充值", currency: "USDT", change: "+500.00", balance: "1,320.50", orderId: "CH771205" }
      ],
      loginLogs: [
        { time: "2026-06-20 14:30:05", ip: "203.0.113.42", location: "上海市", device: "Chrome / macOS", result: "成功" },
        { time: "2026-06-19 21:08:17", ip: "198.51.100.8", location: "上海市", device: "Safari / iOS", result: "成功" },
        { time: "2026-06-18 03:12:44", ip: "203.0.113.99", location: "未知", device: "Chrome / Windows", result: "失败" }
      ],
      opLogs: [
        { time: "2026-06-15 10:22:01", operator: "limin@fansloop.io", action: "修改登录邮箱", detail: "island.day@example.com", result: "成功" },
        { time: "2025-12-02 09:00:11", operator: "system", action: "KYC 机审通过", detail: "证件+人脸", result: "成功" }
      ]
    },
    {
      uid: "102938",
      nickname: "Alex Chen",
      username: "alex_chen",
      email: "",
      inviteCode: "",
      kycStatus: "尚未认证",
      updatedAt: "2026-06-22 08:05:51",
      registeredAt: "2026-03-18 22:41:03",
      regLocation: "马尼拉",
      regIp: "198.51.100.15",
      accountStatus: "正常",
      walletStatus: "禁用",
      regChannel: "App",
      regDevice: "FansLoop App / Android",
      payPasswordSet: false,
      ledger: [
        { category: "recharge", time: "2026-03-20 12:00:00", type: "注册赠金", currency: "USDT", change: "+10.00", balance: "10.00", orderId: "CH102938" }
      ],
      loginLogs: [
        { time: "2026-06-22 08:05:51", ip: "198.51.100.15", location: "马尼拉", device: "FansLoop App / Android", result: "成功" },
        { time: "2026-06-21 19:33:02", ip: "198.51.100.15", location: "马尼拉", device: "FansLoop App / Android", result: "成功" }
      ],
      opLogs: [
        { time: "2026-03-19 14:10:00", operator: "wangyi@fansloop.io", action: "禁用钱包", detail: "风控复核", result: "成功" }
      ]
    },
    {
      uid: "556677",
      nickname: "林小鹿",
      username: "lin_xiaolu",
      email: "xiaolu.lin@qq.com",
      inviteCode: "VIP88",
      kycStatus: "尚未认证",
      updatedAt: "2026-06-21 17:18:09",
      registeredAt: "2026-06-10 13:22:56",
      regLocation: "广东省深圳市南山区",
      regIp: "114.114.114.114",
      accountStatus: "禁用",
      walletStatus: "启用",
      regChannel: "H5",
      regDevice: "WeChat / iOS",
      payPasswordSet: true,
      ledger: [
        { category: "withdraw", time: "2026-06-12 15:20:11", type: "法币提现", currency: "USDT", change: "-50.00", balance: "150.00", orderId: "WD556601" },
        { category: "points", time: "2026-06-11 10:05:44", type: "积分消耗", currency: "POINT", change: "-300", balance: "2,100", orderId: "RD556602" }
      ],
      loginLogs: [
        { time: "2026-06-10 13:25:00", ip: "114.114.114.114", location: "深圳市", device: "WeChat / iOS", result: "成功" }
      ],
      opLogs: [
        { time: "2026-06-12 09:30:00", operator: "chenchen@fansloop.io", action: "禁用账号", detail: "违规内容", result: "成功" }
      ]
    },
    {
      uid: "771201",
      nickname: "John Smith",
      username: "john_smith",
      email: "john.smith@example.com",
      inviteCode: "",
      kycStatus: "已认证",
      updatedAt: "2026-06-15 09:13:02",
      registeredAt: "2026-05-02 11:20:00",
      regLocation: "California, US",
      regIp: "192.0.2.88",
      accountStatus: "正常",
      walletStatus: "启用",
      regChannel: "App",
      regDevice: "Safari / iOS",
      payPasswordSet: true,
      ledger: [
        { category: "recharge", time: "2026-06-15 09:12:44", type: "链上充值", currency: "USDT", change: "+500.00", balance: "500.00", orderId: "CH771201" }
      ],
      loginLogs: [
        { time: "2026-06-15 09:10:00", ip: "192.0.2.88", location: "California", device: "Safari / iOS", result: "成功" }
      ],
      opLogs: [
        { time: "2026-06-15 09:13:02", operator: "system", action: "KYC 钱包认证", detail: "zkMe 自动通过", result: "成功" }
      ]
    },
    {
      uid: "339011",
      nickname: "李明辉",
      username: "li_minghui",
      email: "minghui.lee@example.com",
      inviteCode: "SG2026",
      kycStatus: "已认证",
      updatedAt: "2026-06-23 10:00:00",
      registeredAt: "2026-04-08 16:45:30",
      regLocation: "新加坡",
      regIp: "—",
      accountStatus: "正常",
      walletStatus: "启用",
      regChannel: "Web",
      regDevice: "Chrome / Windows",
      payPasswordSet: true,
      ledger: [],
      loginLogs: [
        { time: "2026-04-08 16:45:30", ip: "203.0.113.10", location: "新加坡", device: "Chrome / Windows", result: "成功" }
      ],
      opLogs: [
        { time: "2026-06-23 10:00:00", operator: "当前运营", action: "KYC 认证", detail: "后台代认证", result: "成功" }
      ]
    }
  ];

  function dash(v) {
    return v == null || String(v).trim() === "" ? "—" : v;
  }

  function kycTag(status) {
    if (status === "已认证") return '<span class="ant-tag ant-tag-green">已认证</span>';
    return '<span class="ant-tag">尚未认证</span>';
  }

  function accountTag(status) {
    if (status === "禁用") return '<span class="ant-tag ant-tag-red">禁用</span>';
    return '<span class="ant-tag ant-tag-green">正常</span>';
  }

  function walletTag(status) {
    if (status === "禁用") return '<span class="ant-tag ant-tag-red">禁用</span>';
    return '<span class="ant-tag ant-tag-green">启用</span>';
  }

  var KYC_COUNTRIES = [
    { code: "CN", label: "中国（大陆）" },
    { code: "HK", label: "中国香港" },
    { code: "MO", label: "中国澳门" },
    { code: "TW", label: "中国台湾" },
    { code: "US", label: "美国" },
    { code: "CA", label: "加拿大" },
    { code: "GB", label: "英国" },
    { code: "DE", label: "德国" },
    { code: "FR", label: "法国" },
    { code: "JP", label: "日本" },
    { code: "KR", label: "韩国" },
    { code: "SG", label: "新加坡" },
    { code: "MY", label: "马来西亚" },
    { code: "TH", label: "泰国" },
    { code: "PH", label: "菲律宾" },
    { code: "AU", label: "澳大利亚" }
  ];

  var KYC_ID_TYPES = [
    { code: "id_card", label: "居民身份证" },
    { code: "passport", label: "护照" },
    { code: "driver", label: "驾驶证" },
    { code: "residence", label: "居留许可" }
  ];

  function countryOptionsHtml() {
    return (
      '<option value="">请选择国家或地区</option>' +
      KYC_COUNTRIES.map(function (c) {
        return '<option value="' + M.esc(c.code) + '">' + M.esc(c.label) + "</option>";
      }).join("")
    );
  }

  function idTypeOptionsHtml() {
    return KYC_ID_TYPES.map(function (t) {
      return (
        '<option value="' +
        M.esc(t.code) +
        '"' +
        (t.code === "id_card" ? " selected" : "") +
        ">" +
        M.esc(t.label) +
        "</option>"
      );
    }).join("");
  }

  function uploadTileHtml(id, label, icon) {
    return (
      '<div class="admin-kyc-upload-tile" data-upload="' +
      id +
      '" tabindex="0" role="button">' +
      '<div class="admin-kyc-upload-preview" id="preview-' +
      id +
      '"><i class="fa-solid ' +
      icon +
      '"></i><span>点击上传</span></div>' +
      '<div class="admin-kyc-upload-lbl">' +
      M.esc(label) +
      "</div>" +
      '<input type="file" accept="image/*" id="file-' +
      id +
      '" hidden>' +
      "</div>"
    );
  }

  function renderAdminKycForm(user) {
    return (
      "<p style='margin:0 0 12px;color:rgba(0,0,0,.55)'>代用户完成实名认证，字段与 C 端「设置 → 身份认证」一致。请按实际认证方式填写全部必填项。</p>" +
      "<table class='fl-info-table' style='margin-bottom:16px'>" +
      infoRow("用户昵称", M.esc(user.nickname)) +
      infoRow("用户名", M.esc(user.username)) +
      infoRow("当前状态", kycTag(user.kycStatus)) +
      "</table>" +
      '<p class="admin-kyc-err" id="adminKycErr" role="alert"></p>' +
      '<div class="admin-kyc-method">' +
      '<label><input type="radio" name="adminKycMethod" value="wallet" checked> 钱包快速验证（zkMe）</label>' +
      '<label><input type="radio" name="adminKycMethod" value="document"> 证件认证（证件 + 人脸）</label>' +
      "</div>" +
      '<div class="admin-kyc-section" id="adminKycPanelWallet">' +
      "<h4><i class='fa-brands fa-ethereum'></i> 钱包快速验证</h4>" +
      "<p style='margin:0 0 12px;font-size:12px;color:rgba(0,0,0,.45)'>等同用户端连接 MetaMask 后通过 zkMe 提交零知识身份证明。</p>" +
      '<div class="admin-kyc-field"><label for="adminKycWallet">钱包地址 <span style="color:#ff4d4f">*</span></label>' +
      '<input class="ant-input" id="adminKycWallet" placeholder="0x…" autocomplete="off"></div>' +
      "</div>" +
      '<div class="admin-kyc-section" id="adminKycPanelDocument" style="display:none">' +
      "<h4><i class='fa-solid fa-id-card'></i> 证件认证</h4>" +
      "<p style='margin:0 0 12px;font-size:12px;color:rgba(0,0,0,.45)'>等同用户端：选择地区 → 上传证件正反面 → 人脸识别快照。</p>" +
      '<div class="admin-kyc-field"><label for="adminKycCountry">国家或地区 <span style="color:#ff4d4f">*</span></label>' +
      '<select class="ant-input" id="adminKycCountry">' +
      countryOptionsHtml() +
      "</select></div>" +
      '<div class="admin-kyc-field"><label for="adminKycIdType">证件类型 <span style="color:#ff4d4f">*</span></label>' +
      '<select class="ant-input" id="adminKycIdType">' +
      idTypeOptionsHtml() +
      "</select></div>" +
      '<div class="admin-kyc-field"><label>证件与人脸影像 <span style="color:#ff4d4f">*</span></label>' +
      '<div class="admin-kyc-upload-grid">' +
      uploadTileHtml("front", "证件正面", "fa-regular fa-id-card") +
      uploadTileHtml("back", "证件反面", "fa-solid fa-landmark") +
      uploadTileHtml("face", "人脸识别快照", "fa-solid fa-face-smile") +
      "</div></div>" +
      "</div>" +
      '<div class="admin-kyc-field" style="margin-top:12px"><label for="adminKycNote">认证备注（选填）</label>' +
      '<textarea class="ant-input" id="adminKycNote" rows="2" placeholder="如：线下核验通过、用户无法自行上传等" style="width:100%;resize:vertical"></textarea></div>'
    );
  }

  function wireAdminKycUpload(body, key) {
    var tile = body.querySelector('[data-upload="' + key + '"]');
    var input = body.querySelector("#file-" + key);
    var preview = body.querySelector("#preview-" + key);
    if (!tile || !input || !preview) return;
    tile.addEventListener("click", function () {
      input.click();
    });
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      var url =
        file && file.type.indexOf("image") === 0
          ? URL.createObjectURL(file)
          : "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=85";
      if (key === "face") {
        url =
          file && file.type.indexOf("image") === 0
            ? URL.createObjectURL(file)
            : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face";
      }
      if (key === "back" && (!file || file.type.indexOf("image") !== 0)) {
        url = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=85";
      }
      tile.classList.add("is-done");
      tile.setAttribute("data-url", url);
      preview.innerHTML = '<img src="' + url + '" alt="">';
    });
  }

  function readAdminKycForm(body) {
    var method =
      (body.querySelector('input[name="adminKycMethod"]:checked') || {}).value || "wallet";
    var data = {
      method: method,
      note: (body.querySelector("#adminKycNote") || {}).value || ""
    };
    if (method === "wallet") {
      data.walletAddress = ((body.querySelector("#adminKycWallet") || {}).value || "").trim();
    } else {
      data.country = (body.querySelector("#adminKycCountry") || {}).value || "";
      data.idType = (body.querySelector("#adminKycIdType") || {}).value || "";
      data.idCardFront = (body.querySelector('[data-upload="front"]') || {}).getAttribute("data-url") || "";
      data.idCardBack = (body.querySelector('[data-upload="back"]') || {}).getAttribute("data-url") || "";
      data.faceSnapshot = (body.querySelector('[data-upload="face"]') || {}).getAttribute("data-url") || "";
    }
    return data;
  }

  function validateAdminKycForm(data) {
    if (data.method === "wallet") {
      if (!data.walletAddress) return "请填写钱包地址";
      if (!/^0x[a-fA-F0-9]{6,}$/.test(data.walletAddress)) {
        return "钱包地址格式不正确，应以 0x 开头的十六进制地址";
      }
      return "";
    }
    if (!data.country) return "请选择国家或地区";
    if (!data.idType) return "请选择证件类型";
    if (!data.idCardFront) return "请上传证件正面";
    if (!data.idCardBack) return "请上传证件反面";
    if (!data.faceSnapshot) return "请上传人脸识别快照";
    return "";
  }

  function idTypeLabel(code) {
    for (var i = 0; i < KYC_ID_TYPES.length; i++) {
      if (KYC_ID_TYPES[i].code === code) return KYC_ID_TYPES[i].label;
    }
    return code;
  }

  function countryLabel(code) {
    for (var i = 0; i < KYC_COUNTRIES.length; i++) {
      if (KYC_COUNTRIES[i].code === code) return KYC_COUNTRIES[i].label;
    }
    return code;
  }

  function openKycApproveModal(user) {
    var uid = user.uid;
    M.open({
      title: "KYC 认证 · UID " + uid,
      wide: true,
      body: renderAdminKycForm(user),
      footer: [
        { text: "取消", onClick: M.close },
        {
          text: "确认认证",
          primary: true,
          onClick: function () {
            var body = document.querySelector("#admin-fl-modal-root .fl-modal-body");
            var errEl = body ? body.querySelector("#adminKycErr") : null;
            var data = body ? readAdminKycForm(body) : {};
            var err = validateAdminKycForm(data);
            if (errEl) errEl.textContent = err;
            if (err) return;

            var detail =
              data.method === "wallet"
                ? "zkMe · " + data.walletAddress.slice(0, 10) + "…"
                : countryLabel(data.country) + " · " + idTypeLabel(data.idType);

            M.confirmGoogle({
              title: "确认 KYC 认证",
              message: "确认为 UID " + uid + " 完成 KYC 认证？此操作将同步至用户端认证状态。",
              onVerified: function () {
                user.kycStatus = "已认证";
                user.updatedAt = "2026-06-23 10:00:00";
                user.kycMeta = data;
                if (window.AdminKycAuditStore && window.AdminKycAuditStore.pushFromAdminApprove) {
                  window.AdminKycAuditStore.pushFromAdminApprove({
                    uid: uid,
                    method: data.method,
                    country: data.country,
                    idType: data.idType,
                    walletAddress: data.walletAddress,
                    registeredAt: user.registeredAt,
                    region: user.regLocation,
                    idCardFront: data.idCardFront,
                    idCardBack: data.idCardBack,
                    faceSnapshot: data.faceSnapshot,
                    remark: data.note ? "后台代认证（" + data.note + "）" : "后台代认证",
                    reviewer: "当前运营"
                  });
                }
                user.opLogs.unshift({
                  time: "2026-06-23 10:00:00",
                  operator: "当前运营",
                  action: "KYC 认证",
                  detail: detail + (data.note ? "（" + data.note + "）" : ""),
                  result: "成功"
                });
                renderTable();
                M.notify("KYC 认证已完成", "success");
                openUserDetail(uid);
              }
            });
          }
        }
      ],
      onMount: function (body) {
        body.querySelectorAll('input[name="adminKycMethod"]').forEach(function (radio) {
          radio.addEventListener("change", function () {
            var isWallet = radio.value === "wallet" && radio.checked;
            var panelWallet = body.querySelector("#adminKycPanelWallet");
            var panelDoc = body.querySelector("#adminKycPanelDocument");
            if (panelWallet) panelWallet.style.display = isWallet ? "" : "none";
            if (panelDoc) panelDoc.style.display = isWallet ? "none" : "";
          });
        });
        wireAdminKycUpload(body, "front");
        wireAdminKycUpload(body, "back");
        wireAdminKycUpload(body, "face");
      }
    });
  }

  function buildUserFromKyc(uid) {
    var Store = window.AdminKycAuditStore;
    if (!Store || !Store.getHistoryByUid) return null;
    var history = Store.getHistoryByUid(uid);
    if (!history.length) return null;
    var latest = history[0];
    var kycStatus = "尚未认证";
    if (latest.status === "通过") kycStatus = "已认证";
    else if (latest.status === "待审核") kycStatus = "尚未认证";
    return {
      uid: uid,
      nickname: latest.realName || "—",
      username: "user_" + uid,
      email: "",
      inviteCode: "",
      kycStatus: kycStatus,
      updatedAt: latest.submittedAt || "—",
      registeredAt: latest.registeredAt || "—",
      regLocation: latest.region || "—",
      regIp: latest.ip || "—",
      accountStatus: "正常",
      walletStatus: "启用",
      regChannel: latest.source === "admin" ? "后台" : "App",
      regDevice: latest.deviceName || "—",
      payPasswordSet: false,
      ledger: [],
      loginLogs: [],
      opLogs: []
    };
  }

  function getUserByUid(uid) {
    for (var i = 0; i < MOCK_USERS.length; i++) {
      if (MOCK_USERS[i].uid === uid) return MOCK_USERS[i];
    }
    return buildUserFromKyc(uid);
  }

  function getFilteredUsers() {
    var kw = (document.getElementById("filterKeyword") || {}).value || "";
    var email = (document.getElementById("filterEmail") || {}).value || "";
    var wallet = (document.getElementById("filterWallet") || {}).value || "";
    var acct = (document.getElementById("filterAccountStatus") || {}).value || "";
    var kyc = (document.getElementById("filterKycStatus") || {}).value || "";
    kw = kw.trim().toLowerCase();
    email = email.trim().toLowerCase();
    wallet = wallet.trim().toLowerCase();

    return MOCK_USERS.filter(function (u) {
      if (kw) {
        var hit =
          u.uid.indexOf(kw) >= 0 ||
          u.nickname.toLowerCase().indexOf(kw) >= 0 ||
          u.username.toLowerCase().indexOf(kw) >= 0;
        if (!hit) return false;
      }
      if (email && (!u.email || u.email.toLowerCase().indexOf(email) < 0)) return false;
      if (wallet) return false;
      if (acct && u.accountStatus !== acct) return false;
      if (kyc && u.kycStatus !== kyc) return false;
      return true;
    });
  }

  function renderTable() {
    if (!tbody) return;
    var users = getFilteredUsers();
    if (!users.length) {
      if (pager) pager.setTotal(0);
      tbody.innerHTML =
        '<tr><td colspan="13" style="text-align:center;padding:32px;color:rgba(0,0,0,.45)">暂无匹配用户</td></tr>';
      return;
    }
    if (pager) pager.setTotal(users.length);
    var pageUsers = pager ? pager.getSlice(users) : users;
    var startIdx = pager ? (pager.getPage() - 1) * pager.getPageSize() : 0;
    tbody.innerHTML = pageUsers
      .map(function (u) {
        return (
          '<tr data-uid="' +
          M.esc(u.uid) +
          '">' +
          '<td class="col-sticky-left-1"><span class="js-uid-link" data-uid="' +
          M.esc(u.uid) +
          '">' +
          M.esc(u.uid) +
          "</span></td>" +
          '<td class="col-sticky-left-2">' +
          M.esc(u.nickname) +
          "</td>" +
          "<td>" +
          M.esc(u.username) +
          "</td>" +
          '<td class="col-wrap">' +
          M.esc(dash(u.email)) +
          "</td>" +
          "<td>" +
          kycTag(u.kycStatus) +
          "</td>" +
          "<td>" +
          M.esc(dash(u.inviteCode)) +
          "</td>" +
          "<td>" +
          M.esc(u.updatedAt) +
          "</td>" +
          "<td>" +
          M.esc(u.registeredAt) +
          "</td>" +
          '<td class="col-wrap">' +
          M.esc(u.regLocation) +
          "</td>" +
          "<td><code style=\"font-size:12px\">" +
          M.esc(u.regIp) +
          "</code></td>" +
          "<td>" +
          accountTag(u.accountStatus) +
          "</td>" +
          "<td>" +
          walletTag(u.walletStatus) +
          "</td>" +
          '<td class="col-sticky-right">' +
          '<button type="button" class="ant-btn ant-btn-link ant-btn-sm js-user-detail" data-uid="' +
          M.esc(u.uid) +
          '">详情</button>' +
          (u.accountStatus === "正常"
            ? ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm js-user-ban" data-uid="' +
              M.esc(u.uid) +
              '">禁用</button>'
            : ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm js-user-enable" data-uid="' +
              M.esc(u.uid) +
              '">启用</button>') +
          (u.walletStatus === "禁用"
            ? ' <button type="button" class="ant-btn ant-btn-link ant-btn-sm js-wallet-enable" data-uid="' +
              M.esc(u.uid) +
              '">启用钱包</button>'
            : "") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function infoRow(label, html) {
    return (
      "<tr><th>" +
      M.esc(label) +
      "</th><td>" +
      html +
      "</td></tr>"
    );
  }

  function miniTable(headers, rows) {
    if (!rows.length) {
      return '<p style="margin:0;color:rgba(0,0,0,.45)">暂无记录</p>';
    }
    var head =
      "<thead><tr>" +
      headers
        .map(function (h) {
          return "<th>" + M.esc(h) + "</th>";
        })
        .join("") +
      "</tr></thead>";
    var body =
      "<tbody>" +
      rows
        .map(function (row) {
          return "<tr>" + row.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>";
        })
        .join("") +
      "</tbody>";
    return (
      '<div class="ant-table ant-table-small ant-table-bordered"><table style="width:100%">' +
      head +
      body +
      "</table></div>"
    );
  }

  var LEDGER_CAT_TABS = [
    { key: "all", label: "全部" },
    { key: "points", label: "积分" },
    { key: "recharge", label: "充值" },
    { key: "withdraw", label: "提现" }
  ];

  function ledgerTypeTag(type, category) {
    var cls = "ant-tag";
    if (category === "recharge") cls += " ant-tag-green";
    else if (category === "withdraw") cls += " ant-tag-orange";
    else if (category === "points") cls += " ant-tag-blue";
    return '<span class="' + cls + '">' + M.esc(type) + "</span>";
  }

  function filterLedgerRows(rows, category) {
    if (!category || category === "all") return rows || [];
    return (rows || []).filter(function (r) {
      return r.category === category;
    });
  }

  function renderLedgerTable(rows) {
    if (!rows.length) {
      return '<p style="margin:0;padding:24px 0;text-align:center;color:rgba(0,0,0,.45)">暂无账变记录</p>';
    }
    var body = rows
      .map(function (r) {
        var color =
          String(r.change).indexOf("+") === 0
            ? "color:#52c41a"
            : String(r.change).indexOf("-") === 0
              ? "color:#ff4d4f"
              : "";
        return (
          "<tr>" +
          "<td>" +
          M.esc(r.time) +
          "</td>" +
          "<td>" +
          ledgerTypeTag(r.type, r.category) +
          "</td>" +
          "<td>" +
          M.esc(r.currency || "—") +
          "</td>" +
          '<td style="' +
          color +
          '">' +
          M.esc(r.change) +
          "</td>" +
          "<td>" +
          M.esc(r.balance) +
          "</td>" +
          "<td><code style='font-size:12px'>" +
          M.esc(r.orderId || "—") +
          "</code></td>" +
          "</tr>"
        );
      })
      .join("");
    return (
      '<div class="ant-table ant-table-bordered ant-table-small fl-ledger-table">' +
      '<table style="width:100%">' +
      "<thead class='ant-table-thead'><tr>" +
      "<th>时间</th><th>类型</th><th>币种</th><th>变动</th><th>余额快照</th><th>关联单号</th>" +
      "</tr></thead>" +
      "<tbody class='ant-table-tbody'>" +
      body +
      "</tbody></table></div>"
    );
  }

  function renderLedgerPanel(user) {
    var tabBtns = LEDGER_CAT_TABS.map(function (tab, i) {
      return (
        '<button type="button" class="' +
        (i === 0 ? "is-active " : "") +
        '" data-ledger-cat="' +
        M.esc(tab.key) +
        '">' +
        M.esc(tab.label) +
        "</button>"
      );
    }).join("");
    return (
      '<div class="fl-modal-tab-panel" data-fl-tab-panel="t2">' +
      '<div class="fl-ledger-tabs">' +
      tabBtns +
      "</div>" +
      '<div class="fl-ledger-table-wrap" id="userLedgerTableWrap">' +
      renderLedgerTable(user.ledger || []) +
      "</div></div>"
    );
  }

  function wireLedgerSubTabs(body, user) {
    var bar = body.querySelector(".fl-ledger-tabs");
    var wrap = body.querySelector("#userLedgerTableWrap");
    if (!bar || !wrap) return;
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-ledger-cat]");
      if (!btn) return;
      var cat = btn.getAttribute("data-ledger-cat");
      bar.querySelectorAll("button[data-ledger-cat]").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      wrap.innerHTML = renderLedgerTable(filterLedgerRows(user.ledger, cat));
    });
  }

  function bodyUserDetail(user) {
    var uid = user.uid;
    var kycBtn =
      user.kycStatus === "已认证"
        ? '<button type="button" class="ant-btn ant-btn-default ant-btn-sm" disabled><i class="fa-solid fa-circle-check"></i> 已 KYC 认证</button>'
        : '<button type="button" class="ant-btn ant-btn-primary ant-btn-sm js-kyc-approve"><i class="fa-solid fa-id-card"></i> KYC 认证</button>';

    var actions =
      '<div class="fl-modal-actions">' +
      "<button type='button' class='ant-btn ant-btn-default ant-btn-sm js-acct-ban'><i class='fa-solid fa-ban'></i> 禁用账号</button>" +
      "<button type='button' class='ant-btn ant-btn-default ant-btn-sm js-wallet-ban'><i class='fa-solid fa-wallet'></i> 禁用钱包</button>" +
      kycBtn +
      "<button type='button' class='ant-btn ant-btn-default ant-btn-sm js-force-logout'><i class='fa-solid fa-right-from-bracket'></i> 强制下线</button>" +
      "<button type='button' class='ant-btn ant-btn-default ant-btn-sm js-pay-pwd-reset'><i class='fa-solid fa-key'></i> 重置支付密码</button>" +
      "</div>";

    var tabs =
      '<div class="fl-modal-tabs">' +
      '<button type="button" class="is-active" data-fl-tab="t1">基本信息</button>' +
      '<button type="button" data-fl-tab="t2">账变记录</button>' +
      '<button type="button" data-fl-tab="t3">登录日志</button>' +
      '<button type="button" data-fl-tab="t4">操作记录</button>' +
      "</div>";

    var basic =
      '<div class="fl-modal-tab-panel is-active" data-fl-tab-panel="t1">' +
      "<p style='margin:0 0 12px'><span class='ant-tag'>UID " +
      M.esc(uid) +
      "</span> <strong>" +
      M.esc(user.nickname) +
      "</strong> " +
      accountTag(user.accountStatus) +
      " " +
      kycTag(user.kycStatus) +
      "</p>" +
      "<table class='fl-info-table'>" +
      infoRow("用户昵称", M.esc(user.nickname)) +
      infoRow("用户名", M.esc(user.username)) +
      infoRow(
        "邮箱地址",
        user.email
          ? M.esc(user.email) +
            " <button type='button' class='ant-btn ant-btn-link ant-btn-sm js-email-edit' style='padding:0'>修改</button>"
          : "— <button type='button' class='ant-btn ant-btn-link ant-btn-sm js-email-edit' style='padding:0'>绑定</button>"
      ) +
      infoRow("邀请码", M.esc(dash(user.inviteCode))) +
      infoRow(
        "支付密码",
        (user.payPasswordSet ? "已设置" : "未设置") +
          " <button type='button' class='ant-btn ant-btn-link ant-btn-sm js-pay-pwd-reset-inline' style='padding:0'>重置</button>"
      ) +
      infoRow("钱包状态", user.walletStatus === "启用" ? '<span class="ant-tag ant-tag-green">启用</span>' : '<span class="ant-tag ant-tag-red">禁用</span>') +
      infoRow("注册时间", M.esc(user.registeredAt)) +
      infoRow("注册地", M.esc(user.regLocation)) +
      infoRow("注册 IP", "<code>" + M.esc(user.regIp) + "</code>") +
      infoRow("注册渠道", '<span class="ant-tag ant-tag-blue">' + M.esc(user.regChannel) + "</span>") +
      infoRow("注册设备", M.esc(user.regDevice)) +
      infoRow("更新时间", M.esc(user.updatedAt)) +
      "</table>" +
      "</div>";

    var ledger = renderLedgerPanel(user);

    var loginRows = user.loginLogs.map(function (r) {
      var res =
        r.result === "成功"
          ? '<span class="ant-tag ant-tag-green">成功</span>'
          : '<span class="ant-tag ant-tag-red">失败</span>';
      return [M.esc(r.time), "<code style='font-size:12px'>" + M.esc(r.ip) + "</code>", M.esc(r.location), M.esc(r.device), res];
    });

    var login =
      '<div class="fl-modal-tab-panel" data-fl-tab-panel="t3">' +
      miniTable(["时间", "IP", "归属地", "设备", "结果"], loginRows) +
      "</div>";

    var opRows = user.opLogs.map(function (r) {
      var res =
        r.result === "成功"
          ? '<span class="ant-tag ant-tag-green">成功</span>'
          : '<span class="ant-tag ant-tag-red">失败</span>';
      return [M.esc(r.time), "<code style='font-size:12px'>" + M.esc(r.operator) + "</code>", M.esc(r.action), M.esc(r.detail), res];
    });

    var ops =
      '<div class="fl-modal-tab-panel" data-fl-tab-panel="t4">' +
      miniTable(["时间", "操作人", "操作", "详情", "结果"], opRows) +
      "</div>";

    return actions + tabs + basic + ledger + login + ops;
  }

  function openPayPwdResetModal(user, onDone) {
    var uid = user.uid;
    M.open({
      title: "重置支付密码 · UID " + uid,
      body:
        "<p style='margin:0 0 12px;color:rgba(0,0,0,.55)'>由后台为用户设置新的 6 位数字支付密码。</p>" +
        "<label style='display:block;font-size:13px;margin-bottom:6px'>新支付密码</label>" +
        "<input class='ant-input' id='fl-pay-pwd-new' type='password' maxlength='6' inputmode='numeric' autocomplete='new-password' placeholder='6 位数字' style='width:100%;max-width:280px'>" +
        "<label style='display:block;font-size:13px;margin:12px 0 6px'>再次确认支付密码</label>" +
        "<input class='ant-input' id='fl-pay-pwd-confirm' type='password' maxlength='6' inputmode='numeric' autocomplete='new-password' placeholder='再次输入' style='width:100%;max-width:280px'>" +
        "<p class='pay-pwd-err' id='fl-pay-pwd-err' role='alert'></p>",
      footer: [
        { text: "取消", onClick: M.close },
        {
          text: "确认",
          primary: true,
          onClick: function () {
            var pwdEl = document.getElementById("fl-pay-pwd-new");
            var confirmEl = document.getElementById("fl-pay-pwd-confirm");
            var errEl = document.getElementById("fl-pay-pwd-err");
            var pwd = pwdEl ? String(pwdEl.value).trim() : "";
            var confirmPwd = confirmEl ? String(confirmEl.value).trim() : "";
            var err = "";
            if (!pwd || !confirmPwd) {
              err = "请填写新支付密码与确认密码";
            } else if (!/^\d{6}$/.test(pwd)) {
              err = "支付密码须为 6 位数字";
            } else if (pwd !== confirmPwd) {
              err = "两次输入的支付密码不一致，请重新核对";
            }
            if (errEl) errEl.textContent = err;
            if (err) return;

            M.confirmGoogle({
              title: "确认重置支付密码",
              message: "确认为 UID " + uid + " 重置支付密码？验证通过后将立即生效。",
              onVerified: function () {
                user.payPasswordSet = true;
                user.updatedAt = "2026-06-23 10:00:00";
                user.opLogs.unshift({
                  time: "2026-06-23 10:00:00",
                  operator: "当前运营",
                  action: "重置支付密码",
                  detail: "后台设置新密码",
                  result: "成功"
                });
                renderTable();
                if (onDone) onDone();
                else M.toast("支付密码已重置成功（原型）");
              }
            });
          }
        }
      ],
      onMount: function () {
        var first = document.getElementById("fl-pay-pwd-new");
        if (first) first.focus();
      }
    });
  }

  function openUserDetail(uid) {
    var user = getUserByUid(uid);
    if (!user) {
      M.notify("未找到用户 UID：" + uid, "error");
      return;
    }

    M.open({
      title: "用户详情 · UID " + uid,
      wide: true,
      body: bodyUserDetail(user),
      footer: [{ text: "关闭", primary: true, onClick: M.close }],
      onMount: function (body) {
        M.wireModalTabs(body);
        wireLedgerSubTabs(body, user);
        wireDetailActions(body, user);
      }
    });
  }

  function wireDetailActions(body, user) {
    var uid = user.uid;

    body.addEventListener("click", function (ev) {
      var t = ev.target.closest("button");
      if (!t) return;

      if (t.classList.contains("js-email-edit")) {
        M.open({
          title: "修改登录邮箱 · UID " + uid,
          body:
            "<p style='margin:0 0 12px;color:rgba(0,0,0,.55)'>将向新邮箱发送验证链接，原邮箱将收到提醒。</p>" +
            "<label style='display:block;margin-bottom:6px;font-size:13px'>新邮箱</label>" +
            "<input class='ant-input' type='email' placeholder='name@company.com' style='width:100%;max-width:360px'>",
          footer: [
            { text: "取消", onClick: M.close },
            {
              text: "提交",
              primary: true,
              onClick: function () {
                M.close();
                M.toast("修改邮箱申请已提交（原型）");
              }
            }
          ]
        });
        return;
      }

      if (t.classList.contains("js-pay-pwd-reset") || t.classList.contains("js-pay-pwd-reset-inline")) {
        openPayPwdResetModal(user, function () {
          openUserDetail(uid);
        });
        return;
      }

      if (t.classList.contains("js-acct-ban")) {
        M.confirmGoogle({
          message: "确认禁用该用户账号？禁用后用户将无法登录。",
          onVerified: function () {
            user.accountStatus = "禁用";
            user.opLogs.unshift({
              time: "2026-06-23 10:00:00",
              operator: "当前运营",
              action: "禁用账号",
              detail: "后台操作",
              result: "成功"
            });
            M.close();
            renderTable();
            M.toast("账号已禁用（原型）");
          }
        });
        return;
      }

      if (t.classList.contains("js-wallet-ban")) {
        M.confirmGoogle({
          message: "确认禁用该用户钱包？禁用后不可提现与链上操作。",
          onVerified: function () {
            user.walletStatus = "禁用";
            user.opLogs.unshift({
              time: "2026-06-23 10:00:00",
              operator: "当前运营",
              action: "禁用钱包",
              detail: "后台操作",
              result: "成功"
            });
            M.toast("钱包已禁用（原型）");
          }
        });
        return;
      }

      if (t.classList.contains("js-kyc-approve")) {
        openKycApproveModal(user);
        return;
      }

      if (t.classList.contains("js-force-logout")) {
        M.confirmGoogle({
          title: "强制下线",
          message: "将立即终止 UID " + uid + " 的所有活跃会话，用户需重新登录。",
          onVerified: function () {
            user.opLogs.unshift({
              time: "2026-06-23 10:00:00",
              operator: "当前运营",
              action: "强制下线",
              detail: "清除全部 Session",
              result: "成功"
            });
            M.notify("已强制下线", "success");
            openUserDetail(uid);
          }
        });
      }
    });
  }

  window.AdminUsersList = {
    openUserDetail: openUserDetail,
    getUserByUid: getUserByUid
  };

  var btnQuery = document.getElementById("btnQueryUsers");
  if (btnQuery) {
    btnQuery.addEventListener("click", function () {
      if (pager) pager.resetPage();
      renderTable();
      M.toast("已查询 " + getFilteredUsers().length + " 条（原型）");
    });
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

  if (tbody) {
    document.querySelector("main.admin-content").addEventListener("click", function (e) {
    var detailBtn = e.target.closest(".js-user-detail");
    if (detailBtn) {
      openUserDetail(detailBtn.getAttribute("data-uid"));
      return;
    }

    if (e.target.classList.contains("js-user-ban")) {
      var banUid = e.target.getAttribute("data-uid");
      M.confirmGoogle({
        title: "禁用用户账号",
        message: "将禁止 UID " + banUid + " 登录与关键操作，是否继续？",
        onVerified: function () {
          var u = getUserByUid(banUid);
          if (u) {
            u.accountStatus = "禁用";
            renderTable();
          }
          M.toast("账号已禁用（原型）");
        }
      });
      return;
    }

    if (e.target.classList.contains("js-user-enable")) {
      var enUid = e.target.getAttribute("data-uid");
      M.open({
        title: "启用账号",
        body: "<p style='margin:0'>确认恢复 UID " + M.esc(enUid) + " 的登录与操作权限？</p>",
        footer: [
          { text: "取消", onClick: M.close },
          {
            text: "确认启用",
            primary: true,
            onClick: function () {
              var u = getUserByUid(enUid);
              if (u) {
                u.accountStatus = "正常";
                renderTable();
              }
              M.close();
              M.toast("账号已启用（原型）");
            }
          }
        ]
      });
      return;
    }

    if (e.target.classList.contains("js-wallet-enable")) {
      var wUid = e.target.getAttribute("data-uid");
      M.open({
        title: "启用钱包",
        body: "<p style='margin:0'>确认恢复 UID " + M.esc(wUid) + " 链上钱包的提现与展示能力？</p>",
        footer: [
          { text: "取消", onClick: M.close },
          {
            text: "确认启用",
            primary: true,
            onClick: function () {
              var u = getUserByUid(wUid);
              if (u) {
                u.walletStatus = "启用";
                renderTable();
              }
              M.close();
              M.toast("钱包已启用（原型）");
            }
          }
        ]
      });
    }
    });
    renderTable();
  }
})();
