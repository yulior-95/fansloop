/**
 * 会员白名单 · 后台配置 ↔ 用户端联动（localStorage 原型）
 * 邮箱后缀 / 手续费 UID / 付费直播 UID / 付费内容 UID
 */
(function (global) {
  var KEY = 'fl_admin_risk_whitelist_v1';

  var DEFAULT_SUFFIXES = [
    '@gmail.com', '@outlook.com', '@hotmail.com', '@live.com', '@yahoo.com',
    '@icloud.com', '@me.com', '@proton.me', '@protonmail.com', '@zoho.com',
    '@gmx.com', '@gmx.de', '@aol.com',
    '@qq.com', '@163.com', '@126.com', '@yeah.net', '@aliyun.com',
    '@sina.com', '@sina.cn', '@sohu.com', '@139.com', '@189.cn', '@wo.cn',
    '@docomo.ne.jp', '@ezweb.ne.jp', '@au.com', '@softbank.ne.jp', '@i.softbank.jp',
    '@yahoo.co.jp', '@rakuten.co.jp',
    '@yandex.ru', '@mail.ru', '@orange.fr', '@t-online.de'
  ];

  function nowStr() {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : String(n); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function uid() {
    return 'wl_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function normalizeSuffix(raw) {
    var s = String(raw || '').trim().toLowerCase();
    if (!s) return '';
    if (s.indexOf('@') !== 0) s = '@' + s.replace(/^@+/, '');
    return s;
  }

  function seedEmails() {
    return DEFAULT_SUFFIXES.map(function (suffix, i) {
      return {
        id: 'em_seed_' + i,
        suffix: suffix,
        remark: '系统默认',
        createdAt: '2026-01-15 10:00:00',
        createdBy: 'system'
      };
    });
  }

  function defaultState() {
    return {
      emailSuffixes: seedEmails(),
      feeWhitelist: [
        {
          id: 'fee_1',
          uid: '882910',
          nickname: 'Luna 🌙',
          scopes: ['recharge', 'withdraw'],
          remark: '品牌合作账号 · 免手续费',
          createdBy: 'limin',
          createdAt: '2026-04-01 09:12:33'
        }
      ],
      liveWhitelist: [
        { id: 'live_1', uid: '882910', createdBy: 'limin', createdAt: '2026-04-02 14:20:08' }
      ],
      contentWhitelist: [
        { id: 'cnt_1', uid: '882910', createdBy: 'limin', createdAt: '2026-04-02 14:21:15' }
      ]
    };
  }

  function readRaw() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeRaw(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    try {
      global.dispatchEvent(new CustomEvent('fl-risk-whitelist-change', { detail: data }));
    } catch (e) { /* ignore */ }
  }

  function read() {
    var data = readRaw();
    if (!data) {
      data = defaultState();
      writeRaw(data);
    }
    if (!Array.isArray(data.emailSuffixes)) data.emailSuffixes = [];
    if (!Array.isArray(data.feeWhitelist)) data.feeWhitelist = [];
    if (!Array.isArray(data.liveWhitelist)) data.liveWhitelist = [];
    if (!Array.isArray(data.contentWhitelist)) data.contentWhitelist = [];
    return data;
  }

  function normalizeUid(val) {
    return String(val || '').trim().replace(/\D/g, '');
  }

  function publicUidFromSession() {
    try {
      if (global.FansloopAuth && global.FansloopAuth.read) {
        var s = global.FansloopAuth.read();
        if (s && s.loggedIn && s.user) {
          var raw = String(s.user.publicUid || s.user.userId || '');
          var digits = raw.replace(/\D/g, '');
          return digits || raw;
        }
      }
    } catch (e) { /* ignore */ }
    return '';
  }

  function emailSuffixFromAddress(email) {
    var e = String(email || '').trim().toLowerCase();
    var at = e.lastIndexOf('@');
    if (at < 0) return '';
    return normalizeSuffix(e.slice(at));
  }

  function isEmailSuffixAllowed(email) {
    var suffix = emailSuffixFromAddress(email);
    if (!suffix) return false;
    var list = read().emailSuffixes;
    return list.some(function (row) { return normalizeSuffix(row.suffix) === suffix; });
  }

  function isInLiveWhitelist(uidVal) {
    var u = normalizeUid(uidVal);
    if (!u) return false;
    return read().liveWhitelist.some(function (row) { return normalizeUid(row.uid) === u; });
  }

  function isInContentWhitelist(uidVal) {
    var u = normalizeUid(uidVal);
    if (!u) return false;
    return read().contentWhitelist.some(function (row) { return normalizeUid(row.uid) === u; });
  }

  function isCurrentUserLiveWhitelisted() {
    var u = publicUidFromSession();
    return u ? isInLiveWhitelist(u) : false;
  }

  function isCurrentUserContentWhitelisted() {
    var u = publicUidFromSession();
    return u ? isInContentWhitelist(u) : false;
  }

  function hasEmailSuffixDuplicate(suffix, excludeId) {
    var norm = normalizeSuffix(suffix);
    return read().emailSuffixes.some(function (row) {
      return normalizeSuffix(row.suffix) === norm && row.id !== excludeId;
    });
  }

  function addEmailSuffix(suffix, remark, createdBy) {
    var norm = normalizeSuffix(suffix);
    if (!norm) return { ok: false, message: '请填写邮箱后缀' };
    if (hasEmailSuffixDuplicate(norm)) return { ok: false, message: '该邮箱后缀已存在，请勿重复添加' };
    var data = read();
    var row = {
      id: uid(),
      suffix: norm,
      remark: String(remark || '').trim(),
      createdAt: nowStr(),
      createdBy: createdBy || 'admin'
    };
    data.emailSuffixes.unshift(row);
    writeRaw(data);
    return { ok: true, row: row };
  }

  function updateEmailSuffix(id, suffix, remark) {
    var norm = normalizeSuffix(suffix);
    if (!norm) return { ok: false, message: '请填写邮箱后缀' };
    if (hasEmailSuffixDuplicate(norm, id)) return { ok: false, message: '该邮箱后缀已存在' };
    var data = read();
    var row = data.emailSuffixes.find(function (r) { return r.id === id; });
    if (!row) return { ok: false, message: '记录不存在' };
    row.suffix = norm;
    if (remark != null) row.remark = String(remark).trim();
    writeRaw(data);
    return { ok: true, row: row };
  }

  function removeEmailSuffix(id) {
    var data = read();
    data.emailSuffixes = data.emailSuffixes.filter(function (r) { return r.id !== id; });
    writeRaw(data);
  }

  function addFeeEntry(payload) {
    var u = normalizeUid(payload.uid);
    if (!u) return { ok: false, message: '请填写用户 UID' };
    var scopes = payload.scopes || [];
    if (!scopes.length) return { ok: false, message: '请至少选择一个适用范围' };
    var data = read();
    if (data.feeWhitelist.some(function (r) { return normalizeUid(r.uid) === u; })) {
      return { ok: false, message: '该 UID 已在手续费白名单中' };
    }
    var row = {
      id: uid(),
      uid: u,
      nickname: String(payload.nickname || '').trim() || '—',
      scopes: scopes.slice(),
      remark: String(payload.remark || '').trim(),
      createdBy: payload.createdBy || 'admin',
      createdAt: nowStr()
    };
    data.feeWhitelist.unshift(row);
    writeRaw(data);
    return { ok: true, row: row };
  }

  function updateFeeEntry(id, payload) {
    var data = read();
    var row = data.feeWhitelist.find(function (r) { return r.id === id; });
    if (!row) return { ok: false, message: '记录不存在' };
    var scopes = payload.scopes || row.scopes;
    if (!scopes.length) return { ok: false, message: '请至少选择一个适用范围' };
    row.scopes = scopes.slice();
    if (payload.remark != null) row.remark = String(payload.remark).trim();
    if (payload.nickname != null) row.nickname = String(payload.nickname).trim();
    writeRaw(data);
    return { ok: true, row: row };
  }

  function removeFeeEntry(id) {
    var data = read();
    data.feeWhitelist = data.feeWhitelist.filter(function (r) { return r.id !== id; });
    writeRaw(data);
  }

  function addUidListEntry(listKey, uidVal, createdBy) {
    var u = normalizeUid(uidVal);
    if (!u) return { ok: false, message: '请填写用户 UID' };
    var data = read();
    var list = data[listKey];
    if (list.some(function (r) { return normalizeUid(r.uid) === u; })) {
      return { ok: false, message: '该 UID 已在白名单中' };
    }
    var row = { id: uid(), uid: u, createdBy: createdBy || 'admin', createdAt: nowStr() };
    list.unshift(row);
    writeRaw(data);
    return { ok: true, row: row };
  }

  function removeUidListEntry(listKey, id) {
    var data = read();
    data[listKey] = data[listKey].filter(function (r) { return r.id !== id; });
    writeRaw(data);
  }

  function scopeLabel(scope) {
    var map = { recharge: '充值', withdraw: '提现' };
    return map[scope] || scope;
  }

  function resetDefaults() {
    writeRaw(defaultState());
  }

  global.FLRiskWhitelistStore = {
    KEY: KEY,
    read: read,
    writeRaw: writeRaw,
    resetDefaults: resetDefaults,
    normalizeSuffix: normalizeSuffix,
    normalizeUid: normalizeUid,
    emailSuffixFromAddress: emailSuffixFromAddress,
    isEmailSuffixAllowed: isEmailSuffixAllowed,
    isInLiveWhitelist: isInLiveWhitelist,
    isInContentWhitelist: isInContentWhitelist,
    isCurrentUserLiveWhitelisted: isCurrentUserLiveWhitelisted,
    isCurrentUserContentWhitelisted: isCurrentUserContentWhitelisted,
    hasEmailSuffixDuplicate: hasEmailSuffixDuplicate,
    addEmailSuffix: addEmailSuffix,
    updateEmailSuffix: updateEmailSuffix,
    removeEmailSuffix: removeEmailSuffix,
    addFeeEntry: addFeeEntry,
    updateFeeEntry: updateFeeEntry,
    removeFeeEntry: removeFeeEntry,
    addLiveEntry: function (uidVal, createdBy) { return addUidListEntry('liveWhitelist', uidVal, createdBy); },
    removeLiveEntry: function (id) { removeUidListEntry('liveWhitelist', id); },
    addContentEntry: function (uidVal, createdBy) { return addUidListEntry('contentWhitelist', uidVal, createdBy); },
    removeContentEntry: function (id) { removeUidListEntry('contentWhitelist', id); },
    scopeLabel: scopeLabel,
    nowStr: nowStr,
    DEFAULT_SUFFIXES: DEFAULT_SUFFIXES
  };
})(typeof window !== 'undefined' ? window : this);
