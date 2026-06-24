/**
 * 运营后台 · KYC 审核记录存储（与 C 端 kyc-store 共用 localStorage 键）
 * 数据来源：① 用户端提交审核  ② 后台代认证（直接通过）
 */
(function (global) {
  var LS_KEY = "fl_admin_kyc_audit_v1";

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatDateTime(d) {
    if (!d) return "—";
    if (typeof d === "string" && d.length >= 19) return d.slice(0, 19);
    var dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return (
      dt.getFullYear() +
      "-" +
      pad(dt.getMonth() + 1) +
      "-" +
      pad(dt.getDate()) +
      " " +
      pad(dt.getHours()) +
      ":" +
      pad(dt.getMinutes()) +
      ":" +
      pad(dt.getSeconds())
    );
  }

  function nowStr() {
    return formatDateTime(new Date());
  }

  function readAll() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var list = JSON.parse(raw);
        if (Array.isArray(list) && list.length) {
          var result = normalizeList(list);
          if (result.changed) writeAll(result.list);
          return result.list;
        }
      }
    } catch (e) { /* ignore */ }
    var seed = defaultSeed().map(normalizeRecord);
    writeAll(seed);
    return seed;
  }

  function writeAll(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 200)));
  }

  function genId() {
    return "KYC-" + Date.now();
  }

  function ocrNameByCountry(country, fallback) {
    var map = {
      CN: { zh: "林小鹿", en: "Lin Xiaolu" },
      JP: { zh: "小岛日和", en: "Kojima Hiyori" },
      PH: { zh: "Alex Chen", en: "Alex Chen" },
      US: { zh: "John Smith", en: "John Smith" },
      SG: { zh: "李明辉", en: "Lee Ming Hui" }
    };
    var c = map[country] || map.CN;
    return { realName: c.zh, realNameAlt: c.en, display: fallback || c.zh };
  }

  function mockIdNumber(country) {
    var map = {
      CN: "440305199603156789",
      JP: "TR12345678",
      PH: "P1234567A",
      US: "D12345678",
      SG: "S1234567A"
    };
    return map[country] || "440305199603156789";
  }

  function isEmptyDash(v) {
    return v == null || v === "" || v === "—";
  }

  function mockDeviceForUid(uid) {
    var n = parseInt(String(uid || "").replace(/\D/g, ""), 10) || 0;
    var hex = ((n * 2654435761) >>> 0).toString(16).slice(0, 8).toUpperCase();
    var presets = [
      { deviceName: "Chrome / macOS", deviceId: "WEB-MAC-" + hex, ip: "203.0.113." + ((n % 190) + 10) },
      { deviceName: "FansLoop App / Android", deviceId: "AND-FL-" + hex, ip: "198.51.100." + ((n % 190) + 10) },
      { deviceName: "Safari / iOS", deviceId: "IOS-SAF-" + hex, ip: "192.0.2." + ((n % 190) + 10) },
      { deviceName: "WeChat / iOS", deviceId: "IOS-WX-" + hex, ip: "114.114.114." + ((n % 190) + 10) }
    ];
    return presets[n % presets.length];
  }

  function svgDataUri(svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function mockIdCardFrontSvg(name, idNo, country) {
    name = name || "张三";
    idNo = idNo || mockIdNumber(country);
    var title = country === "CN" ? "居民身份证" : "Identity Document";
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="228" viewBox="0 0 360 228">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#dbeafe"/><stop offset="100%" stop-color="#eff6ff"/></linearGradient></defs>' +
      '<rect width="360" height="228" rx="10" fill="url(#g)" stroke="#91caff" stroke-width="2"/>' +
      '<text x="18" y="30" fill="#1677ff" font-size="16" font-family="sans-serif" font-weight="700">' +
      title +
      "</text>" +
      '<rect x="250" y="42" width="88" height="110" rx="4" fill="#fff" stroke="#bfdbfe"/>' +
      '<text x="258" y="72" fill="#94a3b8" font-size="10" font-family="sans-serif">PHOTO</text>' +
      '<text x="18" y="68" fill="#334155" font-size="12" font-family="sans-serif">姓名 ' +
      name +
      "</text>" +
      '<text x="18" y="92" fill="#334155" font-size="12" font-family="sans-serif">性别 男 · 民族 汉</text>' +
      '<text x="18" y="116" fill="#334155" font-size="12" font-family="sans-serif">出生 1996 年 03 月 15 日</text>' +
      '<text x="18" y="140" fill="#334155" font-size="12" font-family="sans-serif">住址 广东省深圳市南山区</text>' +
      '<text x="18" y="196" fill="#0f172a" font-size="13" font-family="monospace" font-weight="700">' +
      idNo +
      "</text>" +
      '<text x="18" y="214" fill="#64748b" font-size="10" font-family="sans-serif">模拟证件 · 仅供原型演示</text>' +
      "</svg>";
    return svgDataUri(svg);
  }

  function mockIdCardBackSvg(country) {
    var title = country === "CN" ? "中华人民共和国" : "Republic of";
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="228" viewBox="0 0 360 228">' +
      '<rect width="360" height="228" rx="10" fill="#f0f9ff" stroke="#91caff" stroke-width="2"/>' +
      '<circle cx="180" cy="78" r="34" fill="#fde68a" stroke="#f59e0b" stroke-width="2"/>' +
      '<text x="180" y="84" text-anchor="middle" fill="#b45309" font-size="11" font-family="sans-serif">国徽</text>' +
      '<text x="180" y="138" text-anchor="middle" fill="#1677ff" font-size="15" font-family="sans-serif" font-weight="700">' +
      title +
      "</text>" +
      '<text x="180" y="162" text-anchor="middle" fill="#334155" font-size="13" font-family="sans-serif">居民身份证</text>' +
      '<text x="24" y="196" fill="#334155" font-size="12" font-family="sans-serif">签发机关 深圳市公安局南山分局</text>' +
      '<text x="24" y="216" fill="#334155" font-size="12" font-family="sans-serif">有效期限 2020.03.15 - 2040.03.15</text>' +
      "</svg>";
    return svgDataUri(svg);
  }

  function defaultIdCardFront(record) {
    return mockIdCardFrontSvg(record.realName, record.idCardNumber, record.country);
  }

  function defaultIdCardBack(record) {
    return mockIdCardBackSvg(record.country);
  }

  function needsIdCardMock(record) {
    if (record.method === "wallet") return false;
    return !!(record.idType || record.method === "document" || (record.source === "admin" && record.country));
  }

  function isMachineReviewer(reviewer) {
    return !reviewer || reviewer === "system" || reviewer === "Verify API";
  }

  function demoFaceScoreForRecord(r) {
    if (r.id === "KYC-20251202001") return 91.8;
    if (r.id === "KYC-20260618001") return 48.6;
    if (r.id === "KYC-20260621001") return 78.5;
    if (r.id === "KYC-20260622001") return null;
    if (r.status === "通过" && isMachineReviewer(r.reviewer)) return 92.4;
    if (r.status === "驳回" && isMachineReviewer(r.reviewer)) return 48.2;
    if (r.status === "待审核") return 76.3;
    return 88.0;
  }

  function resolveMachineReviewResult(r) {
    if (r.source === "admin" || r.method === "wallet") return r.machineReviewResult || null;
    if (r.machineReviewResult) return r.machineReviewResult;
    var score = r.faceMatchScore;
    if (score == null || isNaN(Number(score))) {
      if (r.status === "待审核") return "api_error";
      if (!isMachineReviewer(r.reviewer)) return "manual";
      return "api_error";
    }
    if (r.status === "待审核") {
      var ev = global.AdminKycConfigStore
        ? global.AdminKycConfigStore.evaluateFaceScore(score)
        : score >= 85 ? "pass" : score >= 60 ? "manual" : "reject";
      return ev === "manual" ? "manual" : ev;
    }
    if (!isMachineReviewer(r.reviewer)) return "manual";
    if (r.status === "通过") return "pass";
    if (r.status === "驳回") {
      return global.AdminKycConfigStore
        ? global.AdminKycConfigStore.evaluateFaceScore(score)
        : "reject";
    }
    return null;
  }

  function normalizeRecord(record) {
    var r = Object.assign({}, record);
    if (isEmptyDash(r.deviceName) || isEmptyDash(r.deviceId) || isEmptyDash(r.ip)) {
      var dev = mockDeviceForUid(r.uid);
      if (isEmptyDash(r.deviceName)) r.deviceName = dev.deviceName;
      if (isEmptyDash(r.deviceId)) r.deviceId = dev.deviceId;
      if (isEmptyDash(r.ip)) r.ip = dev.ip;
    }
    if (needsIdCardMock(r)) {
      if (isEmptyDash(r.idCardNumber) && r.country) r.idCardNumber = mockIdNumber(r.country);
      if (!r.idCardFront) r.idCardFront = defaultIdCardFront(r);
      if (!r.idCardBack) r.idCardBack = defaultIdCardBack(r);
    }
    if (r.method === "document" && r.source !== "admin") {
      if (r.faceMatchScore == null && r.machineReviewResult !== "api_error") {
        r.faceMatchScore = demoFaceScoreForRecord(r);
      }
      r.machineReviewResult = resolveMachineReviewResult(r);
      if (r.machineReviewResult === "api_error") r.faceMatchScore = null;
    }
    return r;
  }

  function normalizeList(list) {
    var changed = false;
    var next = list.map(function (item) {
      var normalized = normalizeRecord(item);
      if (JSON.stringify(normalized) !== JSON.stringify(item)) changed = true;
      return normalized;
    });
    return { list: next, changed: changed };
  }

  function defaultSeed() {
    return [
      {
        id: "KYC-20251202001",
        uid: "882910",
        realName: "小岛日和",
        realNameAlt: "Kojima Hiyori",
        status: "通过",
        deviceName: "Chrome / macOS",
        deviceId: "WEB-MAC-7F2A9C01",
        ip: "203.0.113.42",
        region: "上海市浦东新区",
        registeredAt: "2025-12-01 09:15:42",
        submittedAt: "2025-12-02 08:30:15",
        reviewedAt: "2025-12-02 09:00:11",
        source: "user",
        method: "document",
        country: "JP",
        idType: "passport",
        remark: "证件 OCR + 人脸比对通过",
        reviewer: "system",
        faceMatchScore: 91.8,
        machineReviewResult: "pass",
        idCardNumber: "TR12345678",
        idCardFront: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
        idCardBack: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
        faceSnapshot: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face"
      },
      {
        id: "KYC-20260618001",
        uid: "556677",
        realName: "林小鹿",
        realNameAlt: "Lin Xiaolu",
        status: "驳回",
        deviceName: "WeChat / iOS",
        deviceId: "IOS-WX-A1B2C3D4",
        ip: "114.114.114.114",
        region: "广东省深圳市南山区",
        registeredAt: "2026-06-10 13:22:56",
        submittedAt: "2026-06-18 10:05:33",
        reviewedAt: "2026-06-18 16:20:00",
        source: "user",
        method: "document",
        country: "CN",
        idType: "id_card",
        remark: "证件照模糊，人脸与证件照不一致",
        rejectReason: "人脸匹配分值过低，证件照与人脸不一致",
        reviewer: "system",
        faceMatchScore: 48.6,
        machineReviewResult: "reject",
        idCardNumber: "440305199603156789",
        idCardFront: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
        idCardBack: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
        faceSnapshot: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
      },
      {
        id: "KYC-20260621001",
        uid: "556677",
        realName: "林小鹿",
        realNameAlt: "Lin Xiaolu",
        status: "待审核",
        deviceName: "WeChat / iOS",
        deviceId: "IOS-WX-A1B2C3D4",
        ip: "114.114.114.114",
        region: "广东省深圳市南山区",
        registeredAt: "2026-06-10 13:22:56",
        submittedAt: "2026-06-21 17:10:22",
        reviewedAt: null,
        source: "user",
        method: "document",
        country: "CN",
        idType: "id_card",
        remark: "人脸分值处于人工审核区间，等待合规复核",
        reviewer: null,
        rejectReason: null,
        faceMatchScore: 78.5,
        machineReviewResult: "manual",
        idCardNumber: "440305199603156789",
        idCardFront: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
        idCardBack: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
        faceSnapshot: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
      },
      {
        id: "KYC-20260622001",
        uid: "102938",
        realName: "Alex Chen",
        realNameAlt: "Alex Chen",
        status: "待审核",
        deviceName: "FansLoop App / Android",
        deviceId: "AND-FL-9E8D7C6B",
        ip: "198.51.100.15",
        region: "马尼拉",
        registeredAt: "2026-03-18 22:41:03",
        submittedAt: "2026-06-22 14:30:18",
        reviewedAt: null,
        source: "user",
        method: "document",
        country: "PH",
        idType: "passport",
        remark: "机审 API 超时，未返回人脸分值",
        reviewer: null,
        rejectReason: null,
        faceMatchScore: null,
        machineReviewResult: "api_error",
        idCardNumber: "P1234567A",
        idCardFront: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
        idCardBack: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
        faceSnapshot: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
      },
      {
        id: "KYC-20260615001",
        uid: "771201",
        realName: "John Smith",
        realNameAlt: "John Smith",
        status: "通过",
        deviceName: "Safari / iOS",
        deviceId: "IOS-SAF-552201",
        ip: "192.0.2.88",
        region: "California, US",
        registeredAt: "2026-05-02 11:20:00",
        submittedAt: "2026-06-15 09:12:44",
        reviewedAt: "2026-06-15 09:13:02",
        source: "user",
        method: "wallet",
        country: "US",
        idType: null,
        walletAddress: "0x9f3a2b1c4d5e6f708192a3b4c5d6e7f8091a2b3",
        remark: "zkMe 钱包隐私证明自动通过",
        rejectReason: null,
        reviewer: "system",
        idCardNumber: null,
        idCardFront: null,
        idCardBack: null,
        faceSnapshot: null
      },
      {
        id: "KYC-20260623001",
        uid: "339011",
        realName: "李明辉",
        realNameAlt: "Lee Ming Hui",
        status: "通过",
        deviceName: "FansLoop App / iOS",
        deviceId: "IOS-FL-339011A2",
        ip: "203.0.113.88",
        region: "新加坡",
        registeredAt: "2026-04-08 16:45:30",
        submittedAt: "2026-06-23 10:00:00",
        reviewedAt: "2026-06-23 10:00:00",
        source: "admin",
        method: "document",
        country: "SG",
        idType: "passport",
        remark: "后台代认证 · 合规复核通过",
        rejectReason: null,
        reviewer: "当前运营",
        idCardNumber: "S1234567A",
        idCardFront: null,
        idCardBack: null,
        faceSnapshot: null
      }
    ];
  }

  function resolveUidFromSession() {
    if (global.FansloopAuth && global.FansloopAuth.getUserId) {
      var uid = global.FansloopAuth.getUserId();
      if (uid && global.FLUserRegistry && global.FLUserRegistry.getByUserId) {
        var acc = global.FLUserRegistry.getByUserId(uid);
        if (acc && acc.publicUid) return String(acc.publicUid);
      }
    }
    return null;
  }

  function pushFromUserSubmit(opts) {
    opts = opts || {};
    var uid = opts.uid || resolveUidFromSession() || "000000";
    var names = ocrNameByCountry(opts.country, opts.realName);
    var record = normalizeRecord({
      id: opts.applicationId || genId(),
      uid: uid,
      realName: names.realName,
      realNameAlt: names.realNameAlt,
      status: "待审核",
      deviceName: opts.deviceName || (typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 48) : "Web"),
      deviceId: opts.deviceId || "WEB-" + Date.now().toString(36).toUpperCase(),
      ip: opts.ip || mockDeviceForUid(uid).ip,
      region: opts.region || "—",
      registeredAt: opts.registeredAt || nowStr(),
      submittedAt: nowStr(),
      reviewedAt: null,
      source: "user",
      method: opts.method || "document",
      country: opts.country || null,
      idType: opts.idType || null,
      walletAddress: opts.walletAddress || null,
      remark: "",
      reviewer: null,
      rejectReason: null,
      idCardNumber: mockIdNumber(opts.country),
      idCardFront: opts.idCardFront || null,
      idCardBack: opts.idCardBack || null,
      faceSnapshot: opts.faceSnapshot || null,
      faceMatchScore: opts.faceMatchScore != null ? opts.faceMatchScore : null,
      machineReviewResult: opts.machineReviewResult || null
    });
    var list = readAll();
    list.unshift(record);
    writeAll(list);
    return record;
  }

  function pushFromAdminApprove(opts) {
    opts = opts || {};
    var names = ocrNameByCountry(opts.country, opts.realName);
    var ts = nowStr();
    var dev = mockDeviceForUid(opts.uid);
    var record = normalizeRecord({
      id: genId(),
      uid: String(opts.uid || ""),
      realName: opts.realName || names.realName,
      realNameAlt: opts.realNameAlt || names.realNameAlt,
      status: "通过",
      deviceName: opts.deviceName || dev.deviceName,
      deviceId: opts.deviceId || dev.deviceId,
      ip: opts.ip || dev.ip,
      region: opts.region || "—",
      registeredAt: opts.registeredAt || "—",
      submittedAt: ts,
      reviewedAt: ts,
      source: "admin",
      method: opts.method || "document",
      country: opts.country || null,
      idType: opts.idType || null,
      walletAddress: opts.walletAddress || null,
      remark: opts.remark || "后台代认证",
      rejectReason: null,
      reviewer: opts.reviewer || "当前运营",
      idCardNumber: opts.idCardNumber || mockIdNumber(opts.country),
      idCardFront: opts.idCardFront || null,
      idCardBack: opts.idCardBack || null,
      faceSnapshot: opts.faceSnapshot || null
    });
    var list = readAll();
    list.unshift(record);
    writeAll(list);
    return record;
  }

  function getById(id) {
    var list = readAll();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function getHistoryByUid(uid) {
    return readAll()
      .filter(function (r) {
        return r.uid === uid;
      })
      .sort(function (a, b) {
        return String(b.submittedAt).localeCompare(String(a.submittedAt));
      });
  }

  function updateRecord(id, patch) {
    var list = readAll();
    var found = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i] = Object.assign({}, list[i], patch);
        found = list[i];
        break;
      }
    }
    if (found) writeAll(list);
    return found;
  }

  function review(id, decision, remark, reviewer) {
    var status = decision === "approve" ? "通过" : "驳回";
    return updateRecord(id, {
      status: status,
      reviewedAt: nowStr(),
      remark: remark || "",
      rejectReason: decision === "reject" ? remark || "审核未通过" : null,
      reviewer: reviewer || "当前运营"
    });
  }

  function resetDemo() {
    writeAll(defaultSeed().map(normalizeRecord));
  }

  global.AdminKycAuditStore = {
    LS_KEY: LS_KEY,
    readAll: readAll,
    writeAll: writeAll,
    getById: getById,
    getHistoryByUid: getHistoryByUid,
    pushFromUserSubmit: pushFromUserSubmit,
    pushFromAdminApprove: pushFromAdminApprove,
    updateRecord: updateRecord,
    review: review,
    resetDemo: resetDemo,
    normalizeRecord: normalizeRecord,
    mockIdCardFrontSvg: mockIdCardFrontSvg,
    mockIdCardBackSvg: mockIdCardBackSvg,
    formatDateTime: formatDateTime,
    nowStr: nowStr
  };
})(typeof window !== "undefined" ? window : this);
