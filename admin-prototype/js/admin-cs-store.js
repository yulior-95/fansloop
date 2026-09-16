/**
 * 运营后台 · 人工客服会话（原型 localStorage）
 * 与 C 端「转人工客服」演示数据对齐字段，便于联调说明。
 */
(function (global) {
  var KEY = "fl_admin_cs_sessions_v1";

  var SEED = [
    {
      id: "cs_1001",
      status: "queue",
      userName: "Luna",
      uid: "882104",
      channel: "订单咨询",
      orderNo: "TXN20260425190832",
      topic: "订阅续费扣款疑问",
      priority: "normal",
      waitMin: 3,
      agent: null,
      updatedAt: Date.now() - 180000,
      createdAt: Date.now() - 420000,
      tags: ["VIP", "订阅"],
      messages: [
        { from: "user", text: "你好，我的订阅续费扣了 79.9 USDT，想确认是否正常？", at: Date.now() - 400000 },
        { from: "bot", text: "已为你查询订单 TXN20260425190832，显示为 Luna 月度订阅自动续费。", at: Date.now() - 360000 },
        { from: "user", text: "我想转人工确认一下扣款明细。", at: Date.now() - 300000 },
        { from: "system", text: "用户请求转接人工客服，已进入排队。", at: Date.now() - 280000 }
      ]
    },
    {
      id: "cs_1002",
      status: "queue",
      userName: "Neo",
      uid: "771201",
      channel: "提现",
      orderNo: "WD20260425110288",
      topic: "提现长时间未到账",
      priority: "high",
      waitMin: 8,
      agent: null,
      updatedAt: Date.now() - 480000,
      createdAt: Date.now() - 900000,
      tags: ["提现", "加急"],
      messages: [
        { from: "user", text: "链上提现 2 小时了还是处理中，能帮忙看下吗？", at: Date.now() - 880000 },
        { from: "system", text: "已转人工队列（优先级：高）。", at: Date.now() - 860000 }
      ]
    },
    {
      id: "cs_1003",
      status: "active",
      userName: "Mila",
      uid: "665902",
      channel: "账户安全",
      orderNo: "—",
      topic: "无法绑定新钱包",
      priority: "normal",
      waitMin: 0,
      agent: "客服 · 小周",
      updatedAt: Date.now() - 60000,
      createdAt: Date.now() - 2400000,
      tags: ["钱包"],
      messages: [
        { from: "user", text: "解绑旧钱包后，新地址一直提示签名失败。", at: Date.now() - 2300000 },
        { from: "agent", text: "你好 Mila，我是小周。请确认 MetaMask 当前网络是否为 Ethereum Mainnet。", at: Date.now() - 2200000 },
        { from: "user", text: "是的，主网。签名弹窗点确认后页面报错。", at: Date.now() - 2000000 },
        { from: "agent", text: "收到，我这边为你重置绑定次数，请 5 分钟后重试并清除站点缓存。", at: Date.now() - 60000 }
      ]
    },
    {
      id: "cs_0998",
      status: "closed",
      userName: "Ryo",
      uid: "559011",
      channel: "积分商城",
      orderNo: "PTS20260424001",
      topic: "积分兑换未到账",
      priority: "low",
      waitMin: 0,
      agent: "客服 · 阿Ken",
      updatedAt: Date.now() - 86400000,
      createdAt: Date.now() - 90000000,
      tags: ["积分"],
      messages: [
        { from: "user", text: "昨天兑换的会员体验包还没生效。", at: Date.now() - 89000000 },
        { from: "agent", text: "已补发权益，24h 内生效，抱歉让你久等。", at: Date.now() - 86400000 },
        { from: "system", text: "会话已结束 · 用户满意度 5/5", at: Date.now() - 86300000 }
      ]
    }
  ];

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : null;
    } catch (e) {
      return null;
    }
  }

  function write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  function ensureSeed() {
    var list = read();
    if (list && list.length) return list;
    write(SEED);
    return SEED.slice();
  }

  function list() {
    return ensureSeed().slice().sort(function (a, b) {
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
  }

  function get(id) {
    return list().filter(function (s) { return s.id === id; })[0] || null;
  }

  function save(session) {
    if (!session || !session.id) return false;
    var all = list();
    var idx = -1;
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === session.id) {
        idx = i;
        break;
      }
    }
    session.updatedAt = Date.now();
    if (idx >= 0) all[idx] = session;
    else all.unshift(session);
    return write(all);
  }

  function counts() {
    var all = list();
    var c = { queue: 0, active: 0, closed: 0 };
    all.forEach(function (s) {
      if (c[s.status] != null) c[s.status] += 1;
    });
    return c;
  }

  function resetDemo() {
    write(SEED);
    return SEED.slice();
  }

  global.FLAdminCsStore = {
    KEY: KEY,
    list: list,
    get: get,
    save: save,
    counts: counts,
    resetDemo: resetDemo
  };
})(typeof window !== "undefined" ? window : this);
