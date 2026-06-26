/**
 * 敏感词风控 · 命中记录 / 操作日志 / 阶梯参数（localStorage 原型）
 */
(function (global) {
  var KEY = 'fl_admin_sensitive_risk_v1';
  var SEED_VERSION = 8;

  var ACTION_LABELS = {
    auto_ignore: '自动忽略',
    mute_hours: '禁言小时',
    mute_permanent: '禁言永久',
    manual_disable: '手动禁言'
  };

  var SCENE_LABELS = {
    im: '即时聊天',
    live: '直播互动',
    content: '内容发布',
    profile: '资料类'
  };

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatTime(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function nowStr() {
    return formatTime(new Date());
  }

  function timeOffset(ms) {
    return formatTime(new Date(Date.now() + ms));
  }

  function parseTime(str) {
    if (!str) return new Date();
    var parts = String(str).trim().split(/[\sT]/);
    var d = parts[0].split('-');
    var t = (parts[1] || '00:00:00').split(':');
    return new Date(
      parseInt(d[0], 10),
      parseInt(d[1], 10) - 1,
      parseInt(d[2], 10),
      parseInt(t[0], 10) || 0,
      parseInt(t[1], 10) || 0,
      parseInt(t[2], 10) || 0
    );
  }

  function addHours(timeStr, hours) {
    var d = parseTime(timeStr);
    d.setTime(d.getTime() + (hours || 0) * 3600000);
    return formatTime(d);
  }

  function rid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function defaultRiskConfig() {
    return {
      statWindowDays: 7,
      countScope: 'effective',
      scenes: ['im', 'live'],
      configVersion: 1,
      updatedAt: nowStr()
    };
  }

  function normalizeRiskConfig(cfg) {
    cfg = cfg || defaultRiskConfig();
    var days = parseInt(cfg.statWindowDays, 10);
    cfg.statWindowDays = isNaN(days) ? 7 : days;
    if (cfg.countScope !== 'all') cfg.countScope = 'effective';
    if (!Array.isArray(cfg.scenes) || !cfg.scenes.length) cfg.scenes = ['im', 'live'];
    if (!cfg.configVersion) cfg.configVersion = 1;
    if (!cfg.updatedAt) cfg.updatedAt = nowStr();
    return cfg;
  }

  function configFingerprint(cfg) {
    cfg = normalizeRiskConfig(cfg);
    var scenes = cfg.scenes.slice().sort().join(',');
    return cfg.statWindowDays + '|' + cfg.countScope + '|' + scenes;
  }

  function rulesFingerprint(rules) {
    return JSON.stringify((rules || []).map(function (r) {
      return {
        threshold: r.threshold,
        action: r.action,
        hours: r.hours || 0,
        enabled: r.enabled !== false
      };
    }));
  }

  function describeConfigBrief(cfg) {
    cfg = normalizeRiskConfig(cfg);
    var windowText = cfg.statWindowDays ? ('近 ' + cfg.statWindowDays + ' 天') : '终身';
    var scopeText = cfg.countScope === 'all' ? '全部命中' : '仅有效命中';
    var sceneText = cfg.scenes.map(function (s) { return SCENE_LABELS[s] || s; }).join('、');
    return windowText + ' · ' + sceneText + ' 分场景计数 · ' + scopeText;
  }

  function freezeEvalSnapshot(row, config) {
    config = normalizeRiskConfig(config);
    row.evalConfigVersion = config.configVersion || 1;
    row.evalScene = row.scene || 'live';
    row.evalSnapshot = {
      statWindowDays: config.statWindowDays,
      countScope: config.countScope,
      scenes: config.scenes.slice(),
      perSceneCount: true
    };
    row.tierEventFrozen = true;
  }

  function windowPrefix(config) {
    config = normalizeRiskConfig(config);
    if (!config.statWindowDays) return '累计';
    return config.statWindowDays + '天内';
  }

  function formatTierEvent(rule, config, scene) {
    if (!rule) return '—';
    var label = ACTION_LABELS[rule.action] || rule.action;
    var sceneLabel = SCENE_LABELS[scene] || scene || '—';
    var text = windowPrefix(config) + '·' + sceneLabel + '≥' + rule.threshold + '次 · ' + label;
    if (rule.action === 'mute_hours') text += '（' + (rule.hours || 1) + 'h）';
    return text;
  }

  function pendingTierEvent(config, scene) {
    var sceneLabel = SCENE_LABELS[scene] || scene || '—';
    return windowPrefix(config) + '·' + sceneLabel + '≥1次 · 待人工复核';
  }

  function configSummary(config) {
    config = normalizeRiskConfig(config);
    var windowText = config.statWindowDays ? ('近 ' + config.statWindowDays + ' 天') : '终身';
    var scopeText = config.countScope === 'all' ? '全部命中' : '仅有效命中（不含已忽略）';
    var sceneText = config.scenes.map(function (s) {
      return SCENE_LABELS[s] || s;
    }).join('、') || '全部场景';
    return '当前策略：在「' + windowText + '」窗口内，即时聊天与直播互动分开计数（不合并）；对「' + sceneText + '」分别统计' + scopeText + '并匹配阶梯。修改后的策略不会影响已产生的数据，仅对后续新产生的命中生效。';
  }

  function defaultState() {
    var riskConfig = defaultRiskConfig();
    var tierRules = [
      { id: 'TR_1', threshold: 5, action: 'auto_ignore', hours: 0, enabled: true },
      { id: 'TR_2', threshold: 8, action: 'mute_hours', hours: 1, enabled: true },
      { id: 'TR_3', threshold: 12, action: 'manual_disable', hours: 0, enabled: true },
      { id: 'TR_4', threshold: 20, action: 'mute_hours', hours: 24, enabled: true },
      { id: 'TR_5', threshold: 30, action: 'mute_permanent', hours: 0, enabled: false }
    ];

    var state = {
      seedVersion: SEED_VERSION,
      riskConfig: riskConfig,
      hits: [
        { id: 'HR_00919', time: timeOffset(-86400000 * 2), uid: '102938', scene: 'live', clientIp: '183.14.22.88', status: 'ignored', tierEvent: pendingTierEvent(riskConfig, 'live'), lastOperator: 'limin', lastOperatedAt: timeOffset(-86400000 * 2 + 3600000) },
        { id: 'HR_00920', time: timeOffset(-86400000), uid: '102938', scene: 'im', clientIp: '183.14.22.88', status: 'ignored', tierEvent: pendingTierEvent(riskConfig, 'im'), lastOperator: 'limin', lastOperatedAt: timeOffset(-86400000 + 1800000) },
        {
          id: 'HR_00921',
          time: timeOffset(-1800000),
          uid: '102938',
          scene: 'live',
          clientIp: '183.14.22.88',
          status: 'muted',
          muteType: 'auto_hours',
          muteHours: 1,
          muteUntilAt: timeOffset(1800000),
          tierRuleId: 'TR_2',
          tierEvent: formatTierEvent(tierRules[1], riskConfig, 'live'),
          lastOperator: 'system',
          lastOperatedAt: timeOffset(-1800000)
        },
        {
          id: 'HR_00923',
          time: timeOffset(-7200000),
          uid: '556677',
          scene: 'live',
          clientIp: '114.25.66.108',
          status: 'muted',
          muteType: 'auto_permanent',
          muteHours: 0,
          muteUntilAt: null,
          tierRuleId: 'TR_5',
          tierEvent: formatTierEvent(tierRules[4], riskConfig, 'live'),
          lastOperator: 'system',
          lastOperatedAt: timeOffset(-7200000)
        },
        {
          id: 'HR_00924',
          time: timeOffset(-10800000),
          uid: '882910',
          scene: 'im',
          clientIp: '10.18.32.7',
          status: 'muted',
          muteType: 'manual',
          muteHours: 24,
          muteUntilAt: null,
          tierRuleId: 'TR_3',
          tierEvent: formatTierEvent(tierRules[2], riskConfig, 'im'),
          lastOperator: 'limin',
          lastOperatedAt: timeOffset(-3600000)
        },
        {
          id: 'HR_00922',
          time: timeOffset(-2400000),
          uid: '771201',
          scene: 'im',
          clientIp: '10.0.0.15',
          status: 'pending',
          tierRuleId: 'TR_3',
          tierEvent: formatTierEvent(tierRules[2], riskConfig, 'im'),
          lastOperator: 'system',
          lastOperatedAt: timeOffset(-2400000)
        },
        {
          id: 'HR_00925',
          time: timeOffset(-900000),
          uid: '993344',
          scene: 'live',
          clientIp: '172.16.88.201',
          status: 'pending',
          tierRuleId: null,
          tierEvent: pendingTierEvent(riskConfig, 'live'),
          lastOperator: 'system',
          lastOperatedAt: timeOffset(-900000)
        },
        {
          id: 'HR_00926',
          time: timeOffset(-600000),
          uid: '334455',
          scene: 'live',
          clientIp: '58.220.15.44',
          status: 'pending',
          tierRuleId: 'TR_3',
          tierEvent: formatTierEvent(tierRules[2], riskConfig, 'live'),
          lastOperator: 'system',
          lastOperatedAt: timeOffset(-600000)
        },
        {
          id: 'HR_00927',
          time: timeOffset(-14400000),
          uid: '667788',
          scene: 'im',
          clientIp: '203.156.78.90',
          status: 'muted',
          muteType: 'auto_hours',
          muteHours: 24,
          muteUntilAt: timeOffset(10 * 3600000),
          tierRuleId: 'TR_4',
          tierEvent: formatTierEvent(tierRules[3], riskConfig, 'im'),
          lastOperator: 'system',
          lastOperatedAt: timeOffset(-14400000)
        },
        {
          id: 'HR_00928',
          time: timeOffset(-420000),
          uid: '228801',
          scene: 'im',
          clientIp: '192.168.1.42',
          status: 'pending',
          tierRuleId: null,
          tierEvent: pendingTierEvent(riskConfig, 'im'),
          lastOperator: 'system',
          lastOperatedAt: timeOffset(-420000)
        },
        {
          id: 'HR_00929',
          time: timeOffset(-300000),
          uid: '445566',
          scene: 'live',
          clientIp: '121.33.44.55',
          status: 'pending',
          tierRuleId: 'TR_3',
          tierEvent: formatTierEvent(tierRules[2], riskConfig, 'live'),
          lastOperator: 'system',
          lastOperatedAt: timeOffset(-300000)
        },
        {
          id: 'HR_00930',
          time: timeOffset(-5400000),
          uid: '112233',
          scene: 'live',
          clientIp: '47.96.128.33',
          status: 'muted',
          muteType: 'auto_hours',
          muteHours: 3,
          muteUntilAt: timeOffset(3600000),
          tierRuleId: 'TR_4',
          tierEvent: formatTierEvent(tierRules[3], riskConfig, 'live'),
          lastOperator: 'system',
          lastOperatedAt: timeOffset(-5400000)
        }
      ],
      logs: [],
      tierRules: tierRules
    };
    state.logs = defaultLogs(state);
    return state;
  }

  function defaultLogs(state) {
    return [
      buildLogRow(state, { id: 'LG_001', time: timeOffset(-1800000), action: '自动禁言', hitId: 'HR_00921', operator: 'system' }),
      buildLogRow(state, { id: 'LG_002', time: timeOffset(-3600000), action: '手动禁言', hitId: 'HR_00924', operator: 'limin', remark: '重复命中 · 禁言24h' }),
      buildLogRow(state, { id: 'LG_003', time: timeOffset(-2400000), action: '待手动禁言', hitId: 'HR_00922', operator: 'system' }),
      buildLogRow(state, { id: 'LG_004', time: timeOffset(-86400000 + 3600000), action: '忽略', hitId: 'HR_00920', operator: 'limin', remark: '误判' }),
      buildLogRow(state, { id: 'LG_005', time: timeOffset(-14400000), action: '自动禁言', hitId: 'HR_00927', operator: 'system' }),
      buildLogRow(state, { id: 'LG_006', time: timeOffset(-5400000), action: '自动禁言', hitId: 'HR_00930', operator: 'system' })
    ];
  }

  function buildLogRow(data, entry) {
    var ts = entry.time || nowStr();
    var hit = entry.hitId && entry.hitId !== '—'
      ? (data.hits || []).find(function (h) { return h.id === entry.hitId; })
      : null;
    var scene = entry.scene || (hit && hit.scene) || '—';
    var uid = entry.uid || (hit && hit.uid) || '—';
    var hitCount = entry.hitCount;
    if (hitCount == null && uid !== '—' && scene !== '—') {
      hitCount = countUserSceneHits(uid, scene, data);
    }
    return {
      id: entry.id || rid('LG'),
      time: ts,
      operatedAt: entry.operatedAt || ts,
      triggerTime: entry.triggerTime || (hit && hit.time) || '—',
      operator: entry.operator || 'system',
      action: entry.action || '—',
      hitId: entry.hitId || '—',
      uid: uid,
      scene: scene,
      tierEvent: entry.tierEvent || (hit && hit.tierEvent) || '—',
      clientIp: entry.clientIp || (hit && hit.clientIp) || '—',
      hitCount: hitCount != null ? hitCount : '—',
      remark: entry.remark || ''
    };
  }

  function migrateLog(log, data) {
    if (log.triggerTime && log.operatedAt && log.scene && log.tierEvent !== undefined) {
      return log;
    }
    return buildLogRow(data, log);
  }

  function isHitInWindow(hit, windowDays) {
    if (!windowDays) return true;
    var t = parseTime(hit.time).getTime();
    return Date.now() - t <= windowDays * 86400000;
  }

  function hitCountsForTier(hit, config, scene) {
    config = normalizeRiskConfig(config);
    if (config.countScope !== 'all' && hit.status === 'ignored') return false;
    if (config.scenes.length && config.scenes.indexOf(hit.scene) < 0) return false;
    if (scene && hit.scene !== scene) return false;
    if (!isHitInWindow(hit, config.statWindowDays)) return false;
    return true;
  }

  function migrateHit(row, data) {
    if (!row.clientIp || row.clientIp === '—') {
      row.clientIp = '192.168.0.' + (Math.abs(String(row.uid || '0').charCodeAt(0)) % 200 + 10);
    }
    if (!row.tierEvent || row.tierEvent === '—') {
      if (row.tierRuleId && data.tierRules) {
        var rule = data.tierRules.find(function (r) { return r.id === row.tierRuleId; });
        var snapCfg = row.evalSnapshot ? normalizeRiskConfig(row.evalSnapshot) : data.riskConfig;
        row.tierEvent = formatTierEvent(rule, snapCfg, row.evalScene || row.scene);
      } else {
        row.tierEvent = pendingTierEvent(data.riskConfig, row.scene);
      }
    }
    if (!row.lastOperator || row.lastOperator === '—') row.lastOperator = 'system';
    if (!row.lastOperatedAt || row.lastOperatedAt === '—') row.lastOperatedAt = row.time || nowStr();
    if (row.status === 'muted' && !row.muteType) {
      if (row.muteUntil === '永久' || row.muteHours === 0) row.muteType = 'auto_permanent';
      else if (row.muteUntilAt) row.muteType = 'auto_hours';
      else row.muteType = 'manual';
    }
    if (row.muteType === 'auto_hours') {
      if (!row.muteUntilAt) row.muteUntilAt = addHours(row.time || nowStr(), row.muteHours || 2);
      else if (parseTime(row.muteUntilAt).getTime() <= Date.now()) row.muteUntilAt = addHours(nowStr(), row.muteHours || 2);
    }
    if (!row.evalConfigVersion) {
      freezeEvalSnapshot(row, data.riskConfig);
    }
    return row;
  }

  function reconcilePendingDisplay(data, operator) {
    var config = normalizeRiskConfig(data.riskConfig);
    var n = 0;
    data.hits.forEach(function (row) {
      if (row.status !== 'pending') return;
      var rule = evaluateTier(row.uid, data, row.scene);
      if (rule) applyTierMeta(row, rule, config);
      else {
        row.tierRuleId = null;
        row.tierEvent = windowPrefix(config) + '·' + (SCENE_LABELS[row.scene] || row.scene) + '· 未达阶梯（按新策略重算展示）';
      }
      row.evalDisplaySyncedAt = nowStr();
      row.evalDisplayNote = '已按策略 v' + config.configVersion + ' 同步展示';
      n++;
    });
    if (n > 0) {
      pushLog(data, {
        operator: operator || 'admin',
        action: '策略变更',
        hitId: '—',
        uid: '—',
        remark: '同步 ' + n + ' 条待处理记录的触发事件展示（不改处置状态）'
      });
    }
    return n;
  }

  function previewRiskSave(data, payload) {
    var oldCfg = normalizeRiskConfig(data.riskConfig);
    var newCfg = normalizeRiskConfig(payload.config || oldCfg);
    var oldRules = data.tierRules || [];
    var newRules = payload.rules || oldRules;
    return {
      configChanged: configFingerprint(oldCfg) !== configFingerprint(newCfg),
      rulesChanged: rulesFingerprint(oldRules) !== rulesFingerprint(newRules),
      oldBrief: describeConfigBrief(oldCfg),
      newBrief: describeConfigBrief(newCfg),
      oldVersion: oldCfg.configVersion || 1,
      pendingCount: data.hits.filter(function (h) { return h.status === 'pending'; }).length,
      mutedCount: data.hits.filter(function (h) { return h.status === 'muted'; }).length
    };
  }

  function applySeedIfNeeded(data) {
    if (!data.seedVersion || data.seedVersion < SEED_VERSION) {
      var fresh = defaultState();
      data.hits = fresh.hits;
      data.logs = fresh.logs;
      data.tierRules = fresh.tierRules;
      data.riskConfig = fresh.riskConfig;
      data.seedVersion = SEED_VERSION;
      write(data);
    }
  }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var data;
      if (!raw) {
        data = defaultState();
        localStorage.setItem(KEY, JSON.stringify(data));
      } else {
        data = JSON.parse(raw);
      }
      if (!Array.isArray(data.hits)) data.hits = [];
      if (!Array.isArray(data.logs)) data.logs = [];
      if (!Array.isArray(data.tierRules)) data.tierRules = [];
      if (!data.riskConfig) data.riskConfig = defaultRiskConfig();
      data.riskConfig = normalizeRiskConfig(data.riskConfig);
      applySeedIfNeeded(data);
      data = JSON.parse(localStorage.getItem(KEY));
      data.riskConfig = normalizeRiskConfig(data.riskConfig);
      data.hits = data.hits.map(function (h) { return migrateHit(h, data); });
      data.logs = data.logs.map(function (l) { return migrateLog(l, data); });
      return data;
    } catch (e) {
      return defaultState();
    }
  }

  function write(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    try {
      global.dispatchEvent(new CustomEvent('fl-sensitive-risk-change', { detail: data }));
    } catch (err) { /* ignore */ }
  }

  function pushLog(data, entry) {
    data.logs.unshift(buildLogRow(data, entry));
  }

  function addLog(entry) {
    var data = read();
    pushLog(data, entry);
    write(data);
  }

  function countUserTotalHits(uid, data) {
    data = data || read();
    return data.hits.filter(function (h) {
      return String(h.uid) === String(uid);
    }).length;
  }

  function countUserSceneHits(uid, scene, data) {
    data = data || read();
    return data.hits.filter(function (h) {
      return String(h.uid) === String(uid) && h.scene === scene;
    }).length;
  }

  function countUserEffectiveHits(uid, data, config, scene) {
    data = data || read();
    config = normalizeRiskConfig(config || data.riskConfig);
    return data.hits.filter(function (h) {
      return String(h.uid) === String(uid) && hitCountsForTier(h, config, scene);
    }).length;
  }

  function countUserHits(uid, data, scene) {
    return countUserEffectiveHits(uid, data, null, scene);
  }

  function evaluateTier(uid, data, scene) {
    data = data || read();
    var config = normalizeRiskConfig(data.riskConfig);
    if (!scene || config.scenes.indexOf(scene) < 0) return null;
    var total = countUserEffectiveHits(uid, data, config, scene);
    var rules = data.tierRules
      .filter(function (r) { return r.enabled; })
      .sort(function (a, b) { return b.threshold - a.threshold; });
    for (var i = 0; i < rules.length; i++) {
      if (total >= rules[i].threshold) return rules[i];
    }
    return null;
  }

  function applyTierMeta(row, rule, config) {
    var scene = row.scene || row.evalScene || 'live';
    if (!rule) {
      row.tierRuleId = null;
      row.tierEvent = pendingTierEvent(config, scene);
      return;
    }
    row.tierRuleId = rule.id;
    row.tierEvent = formatTierEvent(rule, config, scene);
  }

  function applyTierOutcome(data, row, rule, uid) {
    var config = normalizeRiskConfig(data.riskConfig);
    applyTierMeta(row, rule, config);
    freezeEvalSnapshot(row, config);
    row.lastOperator = 'system';
    row.lastOperatedAt = row.time;
    if (!rule) return;
    if (rule.action === 'auto_ignore') {
      row.status = 'ignored';
      pushLog(data, { action: '自动忽略', hitId: row.id, uid: uid, remark: row.tierEvent });
    } else if (rule.action === 'manual_disable') {
      row.status = 'pending';
      pushLog(data, { action: '待手动禁言', hitId: row.id, uid: uid, remark: row.tierEvent });
    } else if (rule.action === 'mute_permanent') {
      row.status = 'muted';
      row.muteType = 'auto_permanent';
      row.muteHours = 0;
      row.muteUntilAt = null;
      pushLog(data, { action: '自动禁言', hitId: row.id, uid: uid, remark: row.tierEvent });
    } else if (rule.action === 'mute_hours') {
      row.status = 'muted';
      row.muteType = 'auto_hours';
      row.muteHours = rule.hours || 1;
      row.muteUntilAt = addHours(row.time, row.muteHours);
      pushLog(data, { action: '自动禁言', hitId: row.id, uid: uid, remark: row.tierEvent });
    }
  }

  function recordHit(payload) {
    var data = read();
    var uid = payload.uid || '882910';
    var ts = nowStr();
    var config = normalizeRiskConfig(data.riskConfig);
    var row = {
      id: rid('HR'),
      time: ts,
      uid: uid,
      scene: payload.scene || 'live',
      clientIp: payload.clientIp || '192.168.1.100',
      status: 'pending',
      tierRuleId: null,
      tierEvent: pendingTierEvent(config, payload.scene || 'live'),
      lastOperator: 'system',
      lastOperatedAt: ts
    };
    data.hits.unshift(row);
    var rule = evaluateTier(uid, data, row.scene);
    applyTierOutcome(data, row, rule, uid);
    if (!rule) freezeEvalSnapshot(row, config);
    write(data);
    return row;
  }

  function muteHit(hitId, operator, hours, remark) {
    var data = read();
    var row = data.hits.find(function (h) { return h.id === hitId; });
    if (!row) return { ok: false };
    var ts = nowStr();
    row.status = 'muted';
    row.muteType = 'manual';
    row.muteHours = hours || 24;
    row.muteUntilAt = null;
    row.lastOperator = operator || 'admin';
    row.lastOperatedAt = ts;
    write(data);
    addLog({ operator: operator, action: '手动禁言', hitId: hitId, uid: row.uid, scene: row.scene, tierEvent: row.tierEvent, clientIp: row.clientIp, triggerTime: row.time, remark: remark || ('禁言 ' + row.muteHours + 'h') });
    return { ok: true, row: row };
  }

  function ignoreHit(hitId, operator, remark) {
    var data = read();
    var row = data.hits.find(function (h) { return h.id === hitId; });
    if (!row) return { ok: false };
    row.lastOperator = operator || 'admin';
    row.lastOperatedAt = nowStr();
    row.status = 'ignored';
    write(data);
    addLog({ operator: operator, action: '忽略', hitId: hitId, uid: row.uid, scene: row.scene, tierEvent: row.tierEvent, clientIp: row.clientIp, triggerTime: row.time, remark: remark || '' });
    return { ok: true };
  }

  function unmuteHit(hitId, operator, remark) {
    var data = read();
    var row = data.hits.find(function (h) { return h.id === hitId; });
    if (!row) return { ok: false };
    row.lastOperator = operator || 'admin';
    row.lastOperatedAt = nowStr();
    row.status = 'ignored';
    row.muteUntilAt = null;
    write(data);
    addLog({ operator: operator, action: '解禁', hitId: hitId, uid: row.uid, scene: row.scene, tierEvent: row.tierEvent, clientIp: row.clientIp, triggerTime: row.time, remark: remark || '' });
    return { ok: true };
  }

  function saveRiskParams(payload, options) {
    options = options || {};
    var data = read();
    var oldCfg = normalizeRiskConfig(data.riskConfig);
    var newCfg = normalizeRiskConfig(payload && payload.config ? payload.config : oldCfg);
    var configChanged = configFingerprint(oldCfg) !== configFingerprint(newCfg);
    var rulesChanged = payload && payload.rules
      ? rulesFingerprint(data.tierRules) !== rulesFingerprint(payload.rules)
      : false;

    if (configChanged) {
      newCfg.configVersion = (oldCfg.configVersion || 1) + 1;
      newCfg.updatedAt = nowStr();
      data.riskConfig = newCfg;
      pushLog(data, {
        operator: options.operator || 'admin',
        action: '策略变更',
        hitId: '—',
        uid: '—',
        remark: 'v' + oldCfg.configVersion + ' → v' + newCfg.configVersion +
          ' · ' + describeConfigBrief(oldCfg) + ' → ' + describeConfigBrief(newCfg) +
          ' · 对新命中生效'
      });
    } else if (payload && payload.config) {
      newCfg.configVersion = oldCfg.configVersion;
      newCfg.updatedAt = oldCfg.updatedAt;
      data.riskConfig = newCfg;
    }

    if (payload && payload.rules) data.tierRules = payload.rules;

    if (options.reconcilePendingDisplay && configChanged) {
      reconcilePendingDisplay(data, options.operator);
    }

    if (rulesChanged && !configChanged) {
      pushLog(data, {
        operator: options.operator || 'admin',
        action: '策略变更',
        hitId: '—',
        uid: '—',
        remark: '阶梯规则调整 · 对新命中生效；进行中禁言/待处理维持原处置'
      });
    }

    write(data);
    return {
      ok: true,
      configChanged: configChanged,
      rulesChanged: rulesChanged,
      configVersion: data.riskConfig.configVersion
    };
  }

  function saveTierRules(rules) {
    saveRiskParams({ rules: rules });
  }

  function muteCountdown(row) {
    if (row.status !== 'muted') return '—';
    if (row.muteType !== 'auto_hours') return '--';
    if (!row.muteUntilAt) return '--';
    var end = parseTime(row.muteUntilAt);
    var diff = end.getTime() - Date.now();
    if (diff <= 0) return '00:00:00';
    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    return pad(h) + ':' + pad(m) + ':' + pad(s);
  }

  global.FLSensitiveRiskStore = {
    KEY: KEY,
    SEED_VERSION: SEED_VERSION,
    ACTION_LABELS: ACTION_LABELS,
    SCENE_LABELS: SCENE_LABELS,
    defaultRiskConfig: defaultRiskConfig,
    normalizeRiskConfig: normalizeRiskConfig,
    configSummary: configSummary,
    describeConfigBrief: describeConfigBrief,
    previewRiskSave: previewRiskSave,
    formatTierEvent: formatTierEvent,
    read: read,
    write: write,
    recordHit: recordHit,
    muteHit: muteHit,
    ignoreHit: ignoreHit,
    unmuteHit: unmuteHit,
    addLog: addLog,
    saveRiskParams: saveRiskParams,
    saveTierRules: saveTierRules,
    countUserHits: countUserHits,
    countUserSceneHits: countUserSceneHits,
    countUserEffectiveHits: countUserEffectiveHits,
    countUserTotalHits: countUserTotalHits,
    evaluateTier: evaluateTier,
    muteCountdown: muteCountdown,
    nowStr: nowStr
  };
})(typeof window !== 'undefined' ? window : this);
