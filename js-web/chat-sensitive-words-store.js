/**
 * 敏感词库 · 多场景适用范围（localStorage 原型）
 */
(function (global) {
  var KEY = 'fl_admin_chat_sensitive_words_v1';

  var SCOPES = {
    im: { id: 'im', label: '即时聊天' },
    live: { id: 'live', label: '直播互动' },
    content: { id: 'content', label: '内容发布' },
    profile: { id: 'profile', label: '资料类' }
  };

  var DEFAULT_SCOPES = ['im', 'live'];

  var DEFAULT_WORDS = ['微信', '加微', '低价票', '诈骗', '赌博', '色情', '代理'];

  function nowStr() {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : String(n); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function rid() {
    return 'sw_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function normalizeForMatch(text) {
    return String(text || '').replace(/[\s\u00a0\r\n\t\u3000]+/g, '').toLowerCase();
  }

  function normalizeWord(raw) {
    return String(raw || '').trim();
  }

  function normalizeScopes(scopes) {
    if (!Array.isArray(scopes) || !scopes.length) return DEFAULT_SCOPES.slice();
    return scopes.filter(function (s) { return SCOPES[s]; });
  }

  function migrateWord(row) {
    if (!row.scopes || !row.scopes.length) row.scopes = DEFAULT_SCOPES.slice();
    return row;
  }

  function defaultState() {
    var base = '2026-05-09 10:00:00';
    return {
      words: DEFAULT_WORDS.map(function (w, i) {
        return {
          id: 'sw_seed_' + i,
          word: w,
          enabled: true,
          scopes: DEFAULT_SCOPES.slice(),
          createdAt: base,
          updatedAt: base,
          updatedBy: 'system'
        };
      })
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
      global.dispatchEvent(new CustomEvent('fl-chat-sensitive-words-change', { detail: data }));
    } catch (e) { /* ignore */ }
  }

  function read() {
    var data = readRaw();
    if (!data) {
      data = defaultState();
      writeRaw(data);
    }
    if (!Array.isArray(data.words)) data.words = [];
    data.words = data.words.map(migrateWord);
    return data;
  }

  function hasDuplicate(word, excludeId) {
    var norm = normalizeForMatch(word);
    if (!norm) return false;
    return read().words.some(function (row) {
      return row.id !== excludeId && normalizeForMatch(row.word) === norm;
    });
  }

  function wordAppliesTo(row, scene) {
    if (!row || row.enabled === false) return false;
    if (!scene) return true;
    var scopes = row.scopes || DEFAULT_SCOPES;
    return scopes.indexOf(scene) >= 0;
  }

  function testMessage(text, scene) {
    var norm = normalizeForMatch(text);
    if (!norm) return { hit: false };
    var list = read().words;
    for (var i = 0; i < list.length; i++) {
      if (!wordAppliesTo(list[i], scene)) continue;
      var wNorm = normalizeForMatch(list[i].word);
      if (wNorm && norm.indexOf(wNorm) >= 0) {
        return { hit: true, word: list[i].word, wordId: list[i].id, scene: scene };
      }
    }
    return { hit: false };
  }

  function maskMessage(text) {
    var len = Math.max(8, Math.min(24, String(text || '').length));
    var blocks = '';
    for (var j = 0; j < len; j++) blocks += '\u2588';
    return blocks + '\uff08\u654f\u611f\u8bcd\u5df2\u8131\u654f\uff09';
  }

  function recordHitIfNeeded(result, meta) {
    if (!result.hit) return;
    var Risk = global.FLSensitiveRiskStore;
    if (Risk && Risk.recordHit) {
      Risk.recordHit({
        uid: meta && meta.uid,
        scene: result.scene || (meta && meta.scene),
        room: meta && meta.room,
        matchedWord: result.word,
        summary: meta && meta.summary
      });
    }
  }

  function processOutgoing(text, scene, meta) {
    var raw = String(text || '');
    var result = testMessage(raw, scene);
    if (!result.hit) {
      return { original: raw, display: raw, sensitive: false };
    }
    recordHitIfNeeded(result, Object.assign({}, meta || {}, { scene: scene, summary: raw.slice(0, 80) }));
    if (scene === 'content' || scene === 'profile') {
      return {
        original: raw,
        display: raw,
        sensitive: true,
        blocked: true,
        matched: result.word,
        message: scene === 'profile'
          ? '内容包含敏感词，无法保存'
          : '内容包含敏感词，请修改后重新发布'
      };
    }
    return {
      original: raw,
      display: maskMessage(raw),
      sensitive: true,
      blocked: false,
      matched: result.word
    };
  }

  function scopeLabels(scopes) {
    return normalizeScopes(scopes).map(function (s) {
      return SCOPES[s] ? SCOPES[s].label : s;
    });
  }

  function addWord(word, operator, scopes) {
    var w = normalizeWord(word);
    if (!w) return { ok: false, message: '请填写敏感词' };
    if (hasDuplicate(w)) return { ok: false, message: '该敏感词已存在，请勿重复添加' };
    var sc = normalizeScopes(scopes);
    if (!sc.length) return { ok: false, message: '请至少选择一个适用范围' };
    var data = read();
    var ts = nowStr();
    var row = {
      id: rid(),
      word: w,
      enabled: true,
      scopes: sc,
      createdAt: ts,
      updatedAt: ts,
      updatedBy: operator || 'admin'
    };
    data.words.unshift(row);
    writeRaw(data);
    return { ok: true, row: row };
  }

  function updateWord(id, payload, operator) {
    var data = read();
    var row = data.words.find(function (r) { return r.id === id; });
    if (!row) return { ok: false, message: '记录不存在' };
    if (payload.word != null) {
      var w = normalizeWord(payload.word);
      if (!w) return { ok: false, message: '请填写敏感词' };
      if (hasDuplicate(w, id)) return { ok: false, message: '该敏感词已存在' };
      row.word = w;
    }
    if (payload.enabled != null) row.enabled = !!payload.enabled;
    if (payload.scopes != null) {
      var sc = normalizeScopes(payload.scopes);
      if (!sc.length) return { ok: false, message: '请至少选择一个适用范围' };
      row.scopes = sc;
    }
    row.updatedAt = nowStr();
    row.updatedBy = operator || 'admin';
    writeRaw(data);
    return { ok: true, row: row };
  }

  function removeWord(id) {
    var data = read();
    data.words = data.words.filter(function (r) { return r.id !== id; });
    writeRaw(data);
  }

  function getEnabledWords(scene) {
    return read().words
      .filter(function (w) { return wordAppliesTo(w, scene); })
      .map(function (w) { return w.word; });
  }

  var api = {
    KEY: KEY,
    SCOPES: SCOPES,
    DEFAULT_SCOPES: DEFAULT_SCOPES,
    read: read,
    writeRaw: writeRaw,
    normalizeForMatch: normalizeForMatch,
    normalizeWord: normalizeWord,
    normalizeScopes: normalizeScopes,
    scopeLabels: scopeLabels,
    hasDuplicate: hasDuplicate,
    testMessage: testMessage,
    maskMessage: maskMessage,
    processOutgoing: processOutgoing,
    addWord: addWord,
    updateWord: updateWord,
    removeWord: removeWord,
    getEnabledWords: getEnabledWords,
    nowStr: nowStr,
    DEFAULT_WORDS: DEFAULT_WORDS
  };

  global.FLChatSensitiveWordsStore = api;
  global.FLSensitiveWordsStore = api;
})(typeof window !== 'undefined' ? window : this);
