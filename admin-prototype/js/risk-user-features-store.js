/**
 * 用户功能控制开关 · Mock Store
 * API: GET/PUT /api/v1/admin/users/:uid/feature-switches
 */
(function (global) {
  var LS_KEY = "fl_user_feature_switches_v1";

  var FEATURE_CATALOG = [
    { key: "feature.asset.recharge", name: "链上充值", desc: "禁止该用户发起链上充值" },
    { key: "feature.asset.recharge.fiat", name: "法币充值", desc: "禁止该用户走 MoonPay 等法币通道" },
    { key: "feature.asset.withdraw", name: "USDT 提现", desc: "禁止该用户新建提现单" },
    { key: "feature.subscription.purchase", name: "付费订阅", desc: "禁止该用户新订阅/续订扣款" },
    { key: "feature.tip.gift", name: "打赏送礼", desc: "禁止该用户打赏与送礼" },
    { key: "feature.invite.referral", name: "邀请拉新", desc: "禁止该用户邀请绑定与奖励入账" },
    { key: "feature.content.ppv", name: "付费内容解锁", desc: "禁止该用户按篇购买付费内容" },
    { key: "feature.live.paid", name: "付费直播", desc: "禁止该用户购买/观看付费直播" },
    { key: "feature.content.publish", name: "内容发布", desc: "禁止该用户新发布或编辑提交" },
    { key: "feature.live.broadcast", name: "直播开播", desc: "禁止该用户新建直播或推流" },
    { key: "feature.im.messaging", name: "即时通讯", desc: "禁止该用户发消息/建群" },
    { key: "feature.points.earn", name: "积分获取", desc: "禁止该用户通过任务/签到等获取积分" },
    { key: "feature.points.mall", name: "积分商城", desc: "禁止该用户进入积分商城与兑换" }
  ];

  var USER_DIRECTORY = [
    { uid: "882910", nickname: "小岛日和", email: "island.day@example.com" },
    { uid: "102938", nickname: "Alex Chen", email: "" },
    { uid: "556677", nickname: "林小鹿", email: "xiaolu.lin@qq.com" },
    { uid: "771201", nickname: "John Smith", email: "john.smith@example.com" },
    { uid: "339011", nickname: "李明辉", email: "minghui.lee@example.com" },
    { uid: "445201", nickname: "王磊", email: "wanglei@example.com" }
  ];

  var DEFAULT_OVERRIDES = {
    "102938": {
      "feature.asset.withdraw": { enabled: false, updatedAt: "2026-06-22 08:05:51", updatedBy: "limin" },
      "feature.points.mall": { enabled: false, updatedAt: "2026-06-22 08:06:12", updatedBy: "limin" }
    },
    "556677": {
      "feature.asset.recharge": { enabled: false, updatedAt: "2026-06-12 09:30:00", updatedBy: "chenchen" }
    }
  };

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

  function loadRaw() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(DEFAULT_OVERRIDES));
  }

  function saveRaw(data) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  function getUser(uid) {
    return USER_DIRECTORY.find(function (u) {
      return String(u.uid) === String(uid);
    }) || null;
  }

  function getFeature(key) {
    return FEATURE_CATALOG.find(function (f) {
      return f.key === key;
    }) || null;
  }

  function isFeatureAllowed(uid, featureKey) {
    var row = loadRaw()[String(uid)];
    if (!row || !row[featureKey]) return true;
    return row[featureKey].enabled !== false;
  }

  function getUserOverrides(uid) {
    return loadRaw()[String(uid)] || {};
  }

  function countBlocked(uid) {
    var overrides = getUserOverrides(uid);
    return Object.keys(overrides).filter(function (k) {
      return overrides[k] && overrides[k].enabled === false;
    }).length;
  }

  function setFeature(uid, featureKey, enabled, operator) {
    var data = loadRaw();
    var id = String(uid);
    if (!data[id]) data[id] = {};
    if (enabled) {
      delete data[id][featureKey];
      if (!Object.keys(data[id]).length) delete data[id];
    } else {
      data[id][featureKey] = {
        enabled: false,
        updatedAt: nowStr(),
        updatedBy: operator || "admin"
      };
    }
    saveRaw(data);
    return { ok: true };
  }

  function searchUsers(query) {
    var q = String(query || "")
      .trim()
      .toLowerCase();
    if (!q) {
      var data = loadRaw();
      return USER_DIRECTORY.filter(function (u) {
        return countBlocked(u.uid) > 0;
      }).map(function (u) {
        return Object.assign({}, u, { blockedCount: countBlocked(u.uid) });
      });
    }
    return USER_DIRECTORY.filter(function (u) {
      return (
        String(u.uid).toLowerCase().indexOf(q) >= 0 ||
        String(u.nickname || "")
          .toLowerCase()
          .indexOf(q) >= 0 ||
        String(u.email || "")
          .toLowerCase()
          .indexOf(q) >= 0
      );
    }).map(function (u) {
      return Object.assign({}, u, { blockedCount: countBlocked(u.uid) });
    });
  }

  function listAllUsersWithMeta() {
    return USER_DIRECTORY.map(function (u) {
      return Object.assign({}, u, { blockedCount: countBlocked(u.uid) });
    });
  }

  global.FLUserFeatureSwitchStore = {
    KEY: LS_KEY,
    FEATURE_CATALOG: FEATURE_CATALOG,
    getUser: getUser,
    getFeature: getFeature,
    isFeatureAllowed: isFeatureAllowed,
    getUserOverrides: getUserOverrides,
    countBlocked: countBlocked,
    setFeature: setFeature,
    searchUsers: searchUsers,
    listAllUsersWithMeta: listAllUsersWithMeta,
    reset: function () {
      localStorage.removeItem(LS_KEY);
    }
  };
})(typeof window !== "undefined" ? window : this);
