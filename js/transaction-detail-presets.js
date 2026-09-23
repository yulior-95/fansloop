(function (win) {
    'use strict';

    function buildMap(order) {
        order = order || 'TXN00000000';
        return {
            tip: {
                iconBg: 'linear-gradient(135deg,#EC4899,#BE185D)',
                icon: 'fa-gift',
                heroTitle: '打赏收入 · 已到账',
                heroType: 'TIP INCOME · 打赏收入',
                amountClass: 'inc',
                amount: '+$15.00',
                sub: '15.00 USDT · 礼物打赏入账',
                statusText: '已结算',
                statusTag: 'tag-success',
                cp: {
                    name: 'Sophie 🌸',
                    meta: '@sophie · 粉丝',
                    action: '发消息',
                    go: 'messages.html',
                    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces',
                    stats: ['累计打赏', '8', '次']
                },
                info: [
                    ['交易类型', '打赏收入'],
                    ['订单号', order, true],
                    ['交易时间', '2026-04-25 18:51:08'],
                    ['来源场景', '帖子《今日穿搭分享》'],
                    ['结算状态', '结算中 / 已到账']
                ],
                calc: [
                    ['礼物支付金额', '$5.00'],
                    ['平台分成', '-$0.00'],
                    ['链上 Gas', '-$0.00（平台承担）'],
                    ['实际到账', '+ $5.00', true]
                ],
                timeline: [
                    ['粉丝打赏成功', '09:28:01', true],
                    ['平台确认收款', '09:28:03', true],
                    ['收入到账可提现', '09:28:05', true]
                ],
                chain: [
                    ['结算币种', 'USDT (TRC20)'],
                    ['分账批次', 'B-20260425-1851-A02', true],
                    ['入账账户', 'Creator Primary Wallet']
                ],
                related: {
                    title: '关联帖子 · 《今日穿搭分享》',
                    meta: '图文动态 · 收到礼物打赏'
                },
                note: '该笔打赏收入到账后可提现。如有争议可在 72 小时内发起申诉。',
                primary: ['返回账变记录', 'transactions.html', 'fa-list-ul']
            },
            sub: {
                iconBg: 'linear-gradient(135deg, #10B981, #6EE7B7)',
                icon: 'fa-arrow-down',
                heroTitle: '订阅收入 · 已到账',
                heroType: 'SUBSCRIPTION INCOME · 订阅收入',
                amountClass: 'inc',
                amount: '+$10.00',
                sub: '≈ 10.00 USDT · 来自 Alex Chen 的 Pro 月度订阅',
                statusText: '已结算',
                statusTag: 'tag-success',
                cp: {
                    name: 'Alex Chen',
                    meta: '@alex_chen · 注册 8 个月',
                    action: '查看主页',
                    go: 'creator-profile.html',
                    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80',
                    stats: ['累计订阅', '12', '月']
                },
                info: [
                    ['交易类型', '订阅收入 · Pro 月度'],
                    ['订单号', order, true],
                    ['订阅周期', '2026-04-25 ~ 2026-05-25 · 30 天'],
                    ['订阅费', '$11.76 USDT'],
                    ['平台分成 (15%)', '- $1.76 USDT'],
                    ['链上 Gas', '- $0.00 USDT（平台承担）'],
                    ['实际到账', '+ $10.00 USDT', true]
                ],
                calc: [],
                timeline: [
                    ['订阅自动扣款', '08:12:09', true],
                    ['平台确认订单', '08:12:11', true],
                    ['收入到账', '08:12:12', true]
                ],
                chain: [
                    ['网络', 'USDT-TRC20 (Tron)'],
                    ['区块高度', '#62,418,532'],
                    ['交易哈希', '0x8a72f9b3e8c1d6f5...4e29a8b1c3f29e', true],
                    ['链上确认', '28 / 12 (已最终确认)'],
                    ['From', 'TG3X…aSJozs (Alex Chen)'],
                    ['To', 'TZ9P…kQmL2j (GOODFANS 收款)']
                ],
                related: {
                    title: 'Pro 月度订阅 · 包含 12 项专属权益',
                    meta: '订阅有效期：2026-04-25 ~ 2026-05-25'
                },
                note: '系统自动生成的订阅订单，会在每月 25 日自动续订。',
                primary: ['返回账变记录', 'transactions.html', 'fa-list-ul']
            },
            recharge: {
                iconBg: 'linear-gradient(135deg,#10B981,#059669)',
                icon: 'fa-credit-card',
                heroTitle: '法币充值 · 已到账',
                heroType: 'RECHARGE · 充值入账',
                amountClass: 'inc',
                amount: '+100.00',
                sub: '¥710 → 100 USDT · 招商 ****6618',
                statusText: '已到账',
                statusTag: 'tag-success',
                cp: { hide: true },
                info: [
                    ['交易类型', '法币充值'],
                    ['订单号', order, true],
                    ['交易时间', '2026-04-24 10:18:46'],
                    ['支付方式', '银行卡 · 招商 ****6618'],
                    ['结算状态', '已到账']
                ],
                calc: [
                    ['支付金额', '¥710.00'],
                    ['兑换汇率', '1 USDT ≈ ¥7.10'],
                    ['通道手续费', '¥0.00'],
                    ['最终到账', '+ 100.00 USDT', true]
                ],
                timeline: [
                    ['用户转账发起', '18:41:22', true],
                    ['链上确认达到阈值', '18:41:56', true],
                    ['充值到账', '18:42:00', true]
                ],
                chain: [
                    ['通道单号', 'RC-20260424-1018', true],
                    ['入账账户', 'Primary Wallet']
                ],
                related: null,
                note: '充值到账后可立即用于订阅、打赏或提现。',
                primary: ['继续充值', 'recharge-fiat.html', 'fa-arrow-down']
            },
            withdraw: {
                iconBg: 'linear-gradient(135deg,#EF4444,#B91C1C)',
                icon: 'fa-arrow-up',
                heroTitle: '提现到银行卡 · 已到账',
                heroType: 'WITHDRAW · 提现支出',
                amountClass: 'out',
                amount: '-$50.00',
                sub: '兑换 ¥3,532.25 已到账 · 招商 ****6618',
                statusText: '已到账',
                statusTag: 'tag-success',
                cp: { hide: true },
                info: [
                    ['交易类型', '法币提现'],
                    ['订单号', order, true],
                    ['交易时间', '2026-04-25 14:22:18'],
                    ['到账银行卡', '招商 ****6618'],
                    ['结算状态', '已到账']
                ],
                calc: [
                    ['提现金额', '- $50.00'],
                    ['提现费用', '- $1.00'],
                    ['平台手续费', '- $0.00'],
                    ['实际到账', '¥3,532.25', true]
                ],
                timeline: [
                    ['提交提现申请', '23:58:16', true],
                    ['KYC/风控校验通过', '23:58:22', true],
                    ['链上广播成功', '23:58:35', true],
                    ['到账完成', '23:59:08', true]
                ],
                chain: [
                    ['打款批次', 'WD-20260425-1422', true],
                    ['备注', '法币提现 · 内部结算流水']
                ],
                related: null,
                note: '提现已完成到账。若银行卡信息有误请联系客服。',
                primary: ['再提一笔', 'withdraw-fiat.html', 'fa-arrow-up-from-bracket']
            },
            live: {
                iconBg: 'linear-gradient(135deg,#3B82F6,#1E40AF)',
                icon: 'fa-video',
                heroTitle: '直播收入 · 已到账',
                heroType: 'LIVE GIFT · 直播礼物',
                amountClass: 'inc',
                amount: '+$30.00',
                sub: '火箭礼物 ×3 · Marcus 🚀',
                statusText: '已结算',
                statusTag: 'tag-success',
                cp: {
                    name: 'Marcus 🚀',
                    meta: '@marcus · 直播间观众',
                    action: '发消息',
                    go: 'messages.html',
                    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
                    stats: ['本场礼物', '3', '次']
                },
                info: [
                    ['交易类型', '直播礼物收入'],
                    ['订单号', order, true],
                    ['交易时间', '2026-04-25 12:08:45'],
                    ['直播场次', 'GOODFANS 夜场 Live #0425'],
                    ['结算状态', '已结算']
                ],
                calc: [
                    ['礼物总额', '$30.00'],
                    ['平台分成', '- $0.00'],
                    ['创作者实收', '+ $30.00', true]
                ],
                timeline: [
                    ['观众购票成功', '02:14:42', true],
                    ['平台确认订单', '02:14:45', true],
                    ['收入到账', '02:14:46', true]
                ],
                chain: [
                    ['结算币种', 'USDT'],
                    ['礼物批次', 'LIVE-20260425-1208', true]
                ],
                related: {
                    title: '直播场次 · GOODFANS 夜场 Live #0425',
                    meta: '火箭礼物 ×3 · 已计入创作者收入'
                },
                note: '直播礼物收入已计入可提现余额。',
                primary: ['返回账变记录', 'transactions.html', 'fa-list-ul']
            },
            chain: {
                iconBg: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
                icon: 'fa-link',
                heroTitle: '链上转账 · 已确认',
                heroType: 'ON-CHAIN TRANSFER · 链上转账',
                amountClass: 'out',
                amount: '-199.00',
                sub: 'USDT-TRC20 · TG3X…aSJozs',
                statusText: '已确认',
                statusTag: 'tag-success',
                cp: { hide: true },
                info: [
                    ['交易类型', '链上转账'],
                    ['订单号', order, true],
                    ['交易时间', '2026-04-24 16:32:08'],
                    ['目标地址', 'TG3X…aSJozs', true],
                    ['TXID', '0x8a7…f29e', true]
                ],
                calc: [
                    ['转账金额', '- 199.00 USDT'],
                    ['链上手续费', '- 0.30 USDT'],
                    ['实际转出', '- 199.30 USDT', true]
                ],
                timeline: [
                    ['提交转账', '16:32:08', true],
                    ['链上广播', '16:32:15', true],
                    ['确认完成', '16:32:41', true]
                ],
                chain: [
                    ['网络', 'USDT-TRC20'],
                    ['交易哈希', '0x8a72f9b3e8c1d6f5...4e29a8b1c3f29e', true],
                    ['确认数', '31 / 12（最终确认）']
                ],
                related: null,
                note: '链上转账已确认完成，交易不可逆。',
                primary: ['返回账变记录', 'transactions.html', 'fa-list-ul']
            },
            digital: {
                iconBg: 'linear-gradient(135deg,#A855F7,#7C3AED)',
                icon: 'fa-gem',
                heroTitle: '数字资产销售 · 已结算',
                heroType: 'DIGITAL ASSET SALE · 数字资产销售',
                amountClass: 'inc',
                amount: '+$36.00',
                sub: '数字商品成交 · 创作者实得',
                statusText: '已结算',
                statusTag: 'tag-success',
                cp: {
                    name: 'mia_film',
                    meta: '@mia_film · 购买者',
                    action: '查看主页',
                    go: 'creator-profile.html',
                    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=160',
                    stats: ['累计购买', '2', '件']
                },
                info: [
                    ['交易类型', '数字资产销售'],
                    ['订单号', order, true],
                    ['交易时间', '2026-04-20 06:12:40'],
                    ['商品名称', '数字商品'],
                    ['状态', '已结算']
                ],
                calc: [
                    ['商品售价', '$40.00'],
                    ['平台抽成', '- $4.00'],
                    ['创作者实收', '+ $36.00', true]
                ],
                timeline: [
                    ['买家付款', '06:12:10', true],
                    ['订单确认', '06:12:33', true],
                    ['销售收入到账', '06:12:40', true]
                ],
                chain: [
                    ['结算币种', 'USDT (TRC20)'],
                    ['订单流水', 'DIG-' + order, true]
                ],
                related: {
                    title: '橱窗数字商品成交',
                    meta: '可在橱窗管理查看对应订单'
                },
                note: '数字资产销售已结算，可在橱窗管理查看对应订单。',
                primary: ['查看橱窗', 'creator-showcase-manage.html', 'fa-store']
            },
            affiliate: {
                iconBg: 'linear-gradient(135deg,#F59E0B,#D97706)',
                icon: 'fa-bag-shopping',
                heroTitle: '联盟佣金 · 已到账',
                heroType: 'AFFILIATE COMMISSION · 联盟佣金',
                amountClass: 'inc',
                amount: '+$12.80',
                sub: '联盟订单回传 · 创作者分成实得',
                statusText: '已结算',
                statusTag: 'tag-success',
                cp: { hide: true },
                info: [
                    ['交易类型', '联盟佣金回传'],
                    ['订单号', order, true],
                    ['交易时间', '2026-04-20 05:30:15'],
                    ['商品名称', '实体选品'],
                    ['状态', '已到账']
                ],
                calc: [
                    ['订单成交额', '$128.00'],
                    ['佣金比例', '10%'],
                    ['创作者佣金实收', '+ $12.80', true]
                ],
                timeline: [
                    ['买家完成签收', '05:29:00', true],
                    ['佣金回传结算', '05:30:12', true],
                    ['佣金到账', '05:30:15', true]
                ],
                chain: [
                    ['结算币种', 'USDT'],
                    ['佣金批次号', 'AF-' + order, true]
                ],
                related: null,
                note: '联盟佣金按订单签收后自动回传结算。',
                primary: ['查看联盟选品', 'affiliate-catalog.html', 'fa-bag-shopping']
            },
            subpay: {
                alias: 'sub',
                timeline: [
                    ['发起订阅支付', '14:32:01', true],
                    ['链上确认', '14:32:18', true],
                    ['权益已开通', '14:32:20', true]
                ]
            },
            tipout: {
                alias: 'tip',
                timeline: [
                    ['发起打赏', '15:42:00', true],
                    ['创作者已收款', '15:42:03', true]
                ]
            },
            settle: { alias: 'sub' },
            fee: {
                alias: 'tip',
                timeline: [
                    ['结算任务触发', '17:00:01', true],
                    ['扣费执行', '17:00:06', true],
                    ['账变入账', '17:00:08', true]
                ]
            },
            fiat: {
                alias: 'recharge',
                timeline: [
                    ['发起支付', '10:27:40', true],
                    ['通道确认', '10:27:55', true],
                    ['余额到账', '10:28:00', true]
                ]
            },
            unlock: {
                alias: 'digital',
                timeline: [
                    ['发起购买', '22:18:00', true],
                    ['支付确认', '22:18:04', true],
                    ['内容已解锁', '22:18:05', true]
                ]
            }
        };
    }

    function resolveTimelineType(type) {
        var map = buildMap('');
        var seen = {};
        while (type && map[type] && !seen[type]) {
            seen[type] = true;
            var cfg = map[type];
            if (cfg.timeline && cfg.timeline.length) return cfg.timeline.slice();
            type = cfg.alias;
        }
        return (map.sub && map.sub.timeline ? map.sub.timeline.slice() : []);
    }

    function getTimeline(type) {
        return resolveTimelineType(type || 'tip');
    }

    function resolveParams(params) {
        params = params || new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
        var from = params.get('from') || '';
        var id = params.get('id');
        if (id) {
            var type = 'tip';
            if (/^tx_digital/i.test(id)) type = 'digital';
            else if (/^tx_aff/i.test(id)) type = 'affiliate';
            else if (/^tx_sub/i.test(id)) type = 'sub';
            return { type: type, order: id, from: from };
        }
        return {
            type: params.get('type') || 'sub',
            order: params.get('order') || 'TXN20260425190832',
            from: from
        };
    }

    function getConfig(type, order) {
        var map = buildMap(order);
        var cfg = map[type] || map.sub;
        if (cfg.alias) {
            var own = map[type] || {};
            var base = map[cfg.alias] || map.sub;
            cfg = Object.assign({}, base, own);
            delete cfg.alias;
        }
        var ownTimeline = map[type] && map[type].timeline;
        if (ownTimeline && ownTimeline.length) cfg.timeline = ownTimeline.slice();
        return cfg;
    }

    win.TransactionDetailPresets = {
        buildMap: buildMap,
        resolveParams: resolveParams,
        getConfig: getConfig,
        getTimeline: getTimeline
    };
})(typeof window !== 'undefined' ? window : globalThis);
