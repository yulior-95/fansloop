(function () {
    var state = {
        active: "unread",
        items: []
    };

    var initItems = [
        { id: "n_live_001", type: "live", unread: true, title: "开播提醒：夜雨听弦 已开播", desc: "你关注的创作者「夜雨听弦」正在直播《周末爵士夜》，当前在线 2.1k。", time: "刚刚", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120" },
        { id: "n_sub_001", type: "subscription", unread: true, title: "订阅提醒：NeoMaster 已完成续费", desc: "你的月度订阅方案续费成功，续费金额 28 USDT，下一次扣费日 2026-06-27。", time: "3 分钟前", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120" },
        { id: "n_income_001", type: "income", unread: true, title: "收益通知：本日收益已到账", desc: "今日创作收益 186.40 USDT 已入账至钱包余额，可前往资产页查看流水明细。", time: "9 分钟前", img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=120" },
        { id: "n_system_001", type: "system", unread: false, title: "系统通知：创作者增长活动已开启", desc: "参与 5 月创作者增长计划，完成目标可额外获得平台激励。", time: "昨天 20:16", img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=120" },
        { id: "n_expiry_001", type: "expiry", unread: true, title: "到期提醒：你的订阅将于 24 小时后到期", desc: "你订阅的「山野食光·月度会员」即将到期，请及时续费避免权益中断。", time: "昨天 18:06", img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=120" },
        { id: "n_system_002", type: "system", unread: false, title: "系统通知：平台维护公告", desc: "2026-05-30 02:00-04:00 将进行系统维护，期间部分通知同步可能延迟。", time: "2 天前", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=120" }
    ];

    var labels = {
        all: "全部",
        unread: "未读",
        live: "开播提醒",
        subscription: "订阅提醒",
        income: "收益通知",
        system: "系统通知",
        expiry: "到期提醒"
    };

    function qs(name) {
        return new URLSearchParams(location.search).get(name);
    }

    function getCounts() {
        var counts = { all: state.items.length, unread: 0, live: 0, subscription: 0, income: 0, system: 0, expiry: 0 };
        state.items.forEach(function (x) {
            if (x.unread) counts.unread += 1;
            if (counts[x.type] != null) counts[x.type] += 1;
        });
        return counts;
    }

    function getVisibleItems() {
        if (state.active === "all") return state.items;
        if (state.active === "unread") return state.items.filter(function (x) { return x.unread; });
        return state.items.filter(function (x) { return x.type === state.active; });
    }

    function markRead(id) {
        state.items = state.items.map(function (x) {
            if (x.id === id) return Object.assign({}, x, { unread: false });
            return x;
        });
        render();
    }

    function markAllRead() {
        state.items = state.items.map(function (x) { return Object.assign({}, x, { unread: false }); });
        render();
    }

    function renderTabs(counts) {
        var host = document.getElementById("nfFilter");
        var order = ["all", "unread", "live", "subscription", "income", "system", "expiry"];
        host.innerHTML = order.map(function (key) {
            var active = key === state.active ? "active" : "";
            var c = counts[key] > 0 ? ' <span class="count">' + counts[key] + "</span>" : "";
            return '<button class="chip ' + active + '" data-tab="' + key + '">' + labels[key] + c + "</button>";
        }).join("");
    }

    function renderList() {
        var list = document.getElementById("nfList");
        var rows = getVisibleItems();
        if (!rows.length) {
            list.innerHTML = '<div style="padding:28px;text-align:center;color:#8f97ac">当前筛选暂无通知</div>';
            return;
        }
        list.innerHTML = rows.map(function (x) {
            var unreadCls = x.unread ? "unread" : "";
            var readBtn = x.unread ? '<button data-action="read" data-id="' + x.id + '">标记已读</button>' : "";
            return '<article class="nf-item ' + unreadCls + '">' +
                '<img src="' + x.img + '" alt="avatar">' +
                "<div>" +
                "<h3>" + x.title + "</h3>" +
                "<p>" + x.desc + "</p>" +
                '<div class="nf-meta"><span>' + labels[x.type] + "</span><span>•</span><span>" + x.time + "</span></div>" +
                '<div class="nf-op">' + readBtn + '<button class="primary" data-action="open" data-id="' + x.id + '">查看详情</button></div>' +
                "</div>" +
                "</article>";
        }).join("");
    }

    function renderSummary(counts) {
        document.getElementById("allCount").textContent = String(counts.all);
        document.getElementById("unreadCount").textContent = String(counts.unread);
        document.getElementById("liveCount").textContent = String(counts.live);
        document.getElementById("incomeCount").textContent = String(counts.income);
        document.getElementById("expiryCount").textContent = String(counts.expiry);
    }

    function render() {
        var counts = getCounts();
        renderTabs(counts);
        renderList();
        renderSummary(counts);
        document.getElementById("unreadHint").textContent = counts.unread > 0 ? ("未读 " + counts.unread) : "全部已读";
    }

    function bindEvents() {
        document.getElementById("nfFilter").addEventListener("click", function (e) {
            var btn = e.target.closest("button[data-tab]");
            if (!btn) return;
            state.active = btn.getAttribute("data-tab");
            render();
        });
        document.getElementById("nfList").addEventListener("click", function (e) {
            var btn = e.target.closest("button[data-action]");
            if (!btn) return;
            var action = btn.getAttribute("data-action");
            var id = btn.getAttribute("data-id");
            if (action === "read") markRead(id);
            if (action === "open") {
                markRead(id);
                location.href = "notification-detail.html?id=" + encodeURIComponent(id);
            }
        });
        document.getElementById("markAllRead").addEventListener("click", markAllRead);
    }

    state.items = initItems;
    state.active = qs("tab") || "unread";
    bindEvents();
    render();
})();
