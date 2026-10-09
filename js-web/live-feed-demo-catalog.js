/**
 * 直播 Tab · 跨端 / 连麦演示数据（Web + H5 共用）
 * FL_LIVE_FEED_DEMO.items · getScene(id) · toQuery(item) · toH5Feed(item)
 */
(function (global) {
    var U = "https://images.unsplash.com/";
    var COV = {
        jazz: U + "photo-1516280440614-37939bbacd81?w=900&q=80",
        game: U + "photo-1542751371-adc38448a05e?w=900&q=80",
        camp: U + "photo-1490806843957-31f4c9a91c65?w=900&q=80",
        street: U + "photo-1506905925346-21bda4d32df4?w=900&q=80",
        night: U + "photo-1465847899084-d164df4dedc6?w=900&q=80",
        cafe: U + "photo-1493612276216-ee3925520721?w=900&q=80",
        /** 推流实景 · Web 横屏游戏直播 / H5 竖屏现场 */
        webStream: U + "photo-1542751371-adc38448a05e?w=1600&q=85",
        h5Stream: U + "photo-1516280440614-37939bbacd81?w=1600&q=85"
    };
    var AV = {
        web: U + "photo-1500648767791-00dcc994a43e?w=200&q=80",
        h5: U + "photo-1573496359142-b8d87734a5a2?w=200&q=80",
        a: U + "photo-1535713875002-d1d0cf377fde?w=200&q=80",
        b: U + "photo-1438761681033-6461ffad8d80?w=200&q=80",
        c: U + "photo-1487412720507-e7ab37603c6f?w=200&q=80"
    };

    function hostsTwo(a, b) {
        return [
            { name: a.name, platform: a.p, avatar: a.av, cover: a.img },
            { name: b.name, platform: b.p, avatar: b.av, cover: b.img }
        ];
    }
    function hostsThree(a, b, c) {
        return [
            { name: a.name, platform: a.p, avatar: a.av, cover: a.img },
            { name: b.name, platform: b.p, avatar: b.av, cover: b.img },
            { name: c.name, platform: c.p, avatar: c.av, cover: c.img }
        ];
    }

    var W = { name: "Web 主播", p: "Web", av: AV.a, img: COV.webStream };
    var H = { name: "H5 主播", p: "H5", av: AV.h5, img: COV.h5Stream };
    var WNova = { name: "NovaPlay", p: "Web", av: AV.a, img: COV.webStream };
    var HYeyu = { name: "夜雨听弦", p: "H5", av: AV.h5, img: COV.h5Stream };
    var W2 = { name: "Web 嘉宾", p: "Web", av: AV.a, img: COV.street };
    var H2 = { name: "H5 嘉宾 A", p: "H5", av: AV.b, img: COV.cafe };
    var H3 = { name: "H5 嘉宾 B", p: "H5", av: AV.c, img: COV.jazz };

    function item(o) {
        o.tags = o.tags || ["#演示", "#跨端连麦", "#无观众连麦"];
        o.audienceMic = !!o.audienceMic;
        return o;
    }

    var ITEMS = [
        item({ id: "solo_web", sceneLabel: "Web 单人直播 · 无连麦坐席", viewer: "Web", cover: COV.game, hostSlug: "novaplay", hostName: "NovaPlay", query: { host: "novaplay", scene: "solo_web" }, cohostMode: null, audienceMic: false, tags: ["#演示", "#无观众连麦", "#无主播连麦"] }),
        item({
            id: "novaplay_h5_web_cohost",
            sceneLabel: "Web 连麦 H5 · NovaPlay × 夜雨听弦",
            viewer: "Web",
            cover: COV.webStream,
            hostSlug: "novaplay",
            hostName: "NovaPlay",
            query: {
                host: "novaplay",
                cohost: "2",
                scene: "novaplay_h5_web_cohost",
                pk: "active",
                pkType: "gift",
                pkDur: "167"
            },
            cohostMode: "2",
            sceneHosts: hostsTwo(WNova, HYeyu),
            cohostPk: true,
            pkDemo: {
                type: "gift",
                durLabel: "3 分钟",
                durSec: 167,
                timer: "00:00",
                scoreA: 0,
                scoreB: 0,
                labelA: "直播",
                labelB: "嘉宾"
            },
            tags: ["#演示", "#跨端连麦", "#Web×H5", "#连麦PK"]
        }),
        item({ id: "solo_h5", sceneLabel: "H5 单人直播 · 含观众连麦坐席", viewer: "H5", cover: COV.night, hostSlug: "yeyu", hostName: "夜雨听弦", query: { host: "yeyu", scene: "solo_h5", audMic: "demo" }, cohostMode: null, audienceMic: true, tags: ["#演示", "#观众连麦", "#无主播连麦"] }),

        item({ id: "h5_view_web", sceneLabel: "H5 观看 Web 的画面", viewer: "H5", cover: COV.game, hostSlug: "novaplay", hostName: "NovaPlay", query: { host: "novaplay", scene: "h5_view_web" }, cohostMode: null, cohosts: [{ name: "NovaPlay · Web", avatar: AV.web, cover: COV.game }] }),
        item({ id: "h5_cohost_web", sceneLabel: "H5 连麦 Web 的画面", viewer: "H5", cover: COV.jazz, hostSlug: "shanye", hostName: "山野食光", query: { host: "shanye", cohost: "2", scene: "h5_cohost_web" }, cohostMode: "2", sceneHosts: hostsTwo(H, W) }),
        item({ id: "h5_cohost_2h5", sceneLabel: "H5 连麦两个 H5 的画面", viewer: "H5", cover: COV.cafe, hostSlug: "shanye", hostName: "山野食光", query: { host: "shanye", cohost: "3", scene: "h5_cohost_2h5" }, cohostMode: "3", sceneHosts: hostsThree(H, H2, H3) }),
        item({ id: "h5_cohost_2web", sceneLabel: "H5 连麦两个 Web 的画面（原型双屏）", viewer: "H5", cover: COV.street, hostSlug: "shanye", hostName: "山野食光", query: { host: "shanye", cohost: "2", scene: "h5_cohost_2web" }, cohostMode: "2", sceneHosts: hostsTwo(W, W2) }),
        item({ id: "h5_cohost_h5_web", sceneLabel: "H5 连麦 H5 和 Web 的画面", viewer: "H5", cover: COV.night, hostSlug: "shanye", hostName: "山野食光", query: { host: "shanye", cohost: "2", scene: "h5_cohost_h5_web" }, cohostMode: "2", sceneHosts: hostsTwo(H, W) }),
        item({ id: "h5_view_web_cohost_web", sceneLabel: "H5 观看 Web 连麦 Web", viewer: "H5", cover: COV.street, hostSlug: "shanye", hostName: "山野食光", query: { host: "shanye", cohost: "2", scene: "h5_view_web_cohost_web" }, cohostMode: "2", sceneHosts: hostsTwo(W, W2) }),
        item({ id: "h5_view_web_cohost_h5", sceneLabel: "H5 观看 Web 连麦 H5", viewer: "H5", cover: COV.game, hostSlug: "shanye", hostName: "山野食光", query: { host: "shanye", cohost: "2", scene: "h5_view_web_cohost_h5" }, cohostMode: "2", sceneHosts: hostsTwo(W, H) }),
        item({ id: "h5_view_h5_cohost_h5", sceneLabel: "H5 观看 H5 连麦 H5", viewer: "H5", cover: COV.cafe, hostSlug: "shanye", hostName: "山野食光", query: { host: "shanye", cohost: "2", scene: "h5_view_h5_cohost_h5" }, cohostMode: "2", sceneHosts: hostsTwo(H, H2) }),

        item({ id: "web_view_h5", sceneLabel: "Web 观看 H5 的画面", viewer: "Web", cover: COV.night, hostSlug: "yeyu", hostName: "夜雨听弦", query: { host: "yeyu", scene: "web_view_h5" }, cohostMode: null, cohosts: [{ name: "夜雨听弦 · H5", avatar: AV.h5, cover: COV.night }] }),
        item({ id: "web_cohost_h5", sceneLabel: "Web 连麦 H5 的画面", viewer: "Web", cover: COV.jazz, hostSlug: "shanye", hostName: "山野食光", query: { host: "shanye", cohost: "2", scene: "web_cohost_h5" }, cohostMode: "2", sceneHosts: hostsTwo(W, H) }),
        item({ id: "web_cohost_2h5", sceneLabel: "Web 连麦两个 H5（三格演示）", viewer: "Web", cover: COV.cafe, hostSlug: "shanye", hostName: "山野食光", query: { host: "shanye", cohost: "3", scene: "web_cohost_2h5" }, cohostMode: "3", sceneHosts: hostsThree(W, H, H2) }),
        item({ id: "web_cohost_h5_web", sceneLabel: "Web 连麦 H5 和 Web", viewer: "Web", cover: COV.street, hostSlug: "shanye", hostName: "山野食光", query: { host: "shanye", cohost: "2", scene: "web_cohost_h5_web" }, cohostMode: "2", sceneHosts: hostsTwo(W, H) }),
        item({ id: "web_view_h5_cohost_h5", sceneLabel: "Web 观看 H5 连麦 H5", viewer: "Web", cover: COV.night, hostSlug: "shanye", hostName: "山野食光", query: { host: "shanye", cohost: "2", scene: "web_view_h5_cohost_h5" }, cohostMode: "2", sceneHosts: hostsTwo(H, H2) }),
        item({ id: "web_view_h5_cohost_web", sceneLabel: "Web 观看 H5 连麦 Web", viewer: "Web", cover: COV.game, hostSlug: "shanye", hostName: "山野食光", query: { host: "shanye", cohost: "2", scene: "web_view_h5_cohost_web" }, cohostMode: "2", sceneHosts: hostsTwo(H, W) }),

        item({ id: "aud_mic_web", sceneLabel: "含观众连麦 · Web 直播间", viewer: "Web", cover: COV.camp, hostSlug: "yeyu", hostName: "夜雨听弦", query: { host: "yeyu", audMic: "demo", scene: "aud_mic_web" }, cohostMode: null, audienceMic: true, tags: ["#演示", "#观众连麦"] }),
        item({ id: "aud_mic_h5", sceneLabel: "含观众连麦 · H5 直播间", viewer: "H5", cover: COV.jazz, hostSlug: "yeyu", hostName: "夜雨听弦", query: { host: "yeyu", audMic: "demo", scene: "aud_mic_h5" }, cohostMode: null, audienceMic: true, tags: ["#演示", "#观众连麦"] })
    ];

    function toQuery(item) {
        var q = item.query || {};
        var parts = [];
        Object.keys(q).forEach(function (k) {
            if (q[k] == null || q[k] === "") return;
            parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(q[k])));
        });
        parts.push("nav=home");
        return parts.join("&");
    }

    function webDetailHref(item) {
        return "live-detail-ab.html?" + toQuery(item);
    }

    function h5DetailHref(item) {
        return "live-detail.html?" + toQuery(item);
    }

    function toH5Feed(item) {
        var cohosts = item.sceneHosts
            ? item.sceneHosts.map(function (h) {
                  return { name: h.name + " · " + h.platform, avatar: h.avatar, cover: h.cover };
              })
            : item.cohosts || (item.cohostMode
                ? [{ name: item.hostName, avatar: AV.web, cover: item.cover }]
                : [{ name: item.hostName, avatar: item.viewer === "H5" ? AV.h5 : AV.web, cover: item.cover }]);
        return {
            id: item.id,
            cover: item.cover,
            creator: "@" + item.hostSlug,
            title: item.sceneLabel,
            tags: item.tags,
            music: "直播间 · 演示",
            like: "1.2K",
            comment: "320",
            save: "88",
            avatar: item.viewer === "H5" ? AV.h5 : AV.web,
            liveBadge: item.audienceMic ? "直播中 · 观众连麦" : "直播中 · 演示",
            liveOnline: "856",
            liveScene: item.sceneLabel,
            liveHref: "inline",
            liveQuery: toQuery(item),
            cohostMode: item.cohostMode,
            audienceMic: !!item.audienceMic,
            cohosts: cohosts,
            cohostPk: !!item.cohostPk,
            pkDemo: item.pkDemo || null,
            danmu: ["演示场景：" + item.sceneLabel, "无真实推流 · 原型", "点击进入全屏直播间"],
            comments: [{ name: "Dev", avatar: AV.a, text: "跨端连麦演示卡片" }],
            locked: false
        };
    }

    function getScene(sceneId) {
        for (var i = 0; i < ITEMS.length; i++) {
            if (ITEMS[i].query && ITEMS[i].query.scene === sceneId) return ITEMS[i];
        }
        return null;
    }

    function pkBarPct(a, b) {
        var sum = (Number(a) || 0) + (Number(b) || 0);
        if (sum <= 0) return 50;
        return Math.round(((Number(a) || 0) / sum) * 100);
    }

    /** 观众端 PK 底栏（对齐 H5 截图：直播 | 计时 | 嘉宾 + 双血条） */
    function renderViewerPkDockHtml(opts) {
        opts = opts || {};
        var scoreA = opts.scoreA != null ? opts.scoreA : 0;
        var scoreB = opts.scoreB != null ? opts.scoreB : 0;
        var timer = opts.timer != null ? opts.timer : "00:00";
        var labelA = opts.labelA || "直播";
        var labelB = opts.labelB || "嘉宾";
        var pkType = opts.pkType === "like" ? "like" : "gift";
        var unit = pkType === "like" ? "" : " USDT";
        var pctA = pkBarPct(scoreA, scoreB);
        function fmt(n) {
            n = Number(n) || 0;
            if (pkType === "like") return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
            return n + unit;
        }
        var idAttr = opts.id ? ' id="' + opts.id + '"' : "";
        return (
            '<div class="obs-pk-hud obs-pk-hud--dock obs-pk-hud--viewer-dock"' +
            idAttr +
            ">" +
            '<div class="obs-pk-dock">' +
            '<div class="obs-pk-dock-col obs-pk-dock-col--a">' +
            '<div class="obs-pk-dock-head">' +
            '<span class="obs-pk-dock-name obs-pk-dock-role">' +
            labelA +
            "</span>" +
            '<span class="obs-pk-dock-score">' +
            fmt(scoreA) +
            "</span></div>" +
            '<div class="obs-pk-bar obs-pk-bar--a"><span style="width:' +
            pctA +
            '%"></span></div></div>' +
            '<div class="obs-pk-dock-mid"><span class="obs-pk-timer obs-pk-timer--gold">' +
            timer +
            "</span></div>" +
            '<div class="obs-pk-dock-col obs-pk-dock-col--b">' +
            '<div class="obs-pk-dock-head obs-pk-dock-head--reverse">' +
            '<span class="obs-pk-dock-score">' +
            fmt(scoreB) +
            "</span>" +
            '<span class="obs-pk-dock-name obs-pk-dock-role">' +
            labelB +
            "</span></div>" +
            '<div class="obs-pk-bar obs-pk-bar--b"><span style="width:' +
            (100 - pctA) +
            '%"></span></div></div></div></div>'
        );
    }

    function renderViewerPkAssistHtml(opts) {
        opts = opts || {};
        var giftId = opts.giftBtnId ? ' id="' + opts.giftBtnId + '"' : "";
        return (
            '<div class="live-pk-assist">' +
            '<p class="live-pk-assist-hint">为喜欢的主播送礼助力 PK</p>' +
            '<div class="live-pk-assist-actions">' +
            '<span class="live-pk-assist-tag">直播</span>' +
            '<button type="button" class="live-pk-assist-btn live-pk-assist-btn--gift"' +
            giftId +
            '><i class="fa-solid fa-gift"></i> 礼物</button>' +
            '<button type="button" class="live-pk-assist-btn live-pk-assist-btn--ghost">关注</button>' +
            "</div></div>"
        );
    }

    global.FL_LIVE_FEED_DEMO = {
        items: ITEMS,
        toQuery: toQuery,
        webDetailHref: webDetailHref,
        h5DetailHref: h5DetailHref,
        toH5Feed: toH5Feed,
        getScene: getScene,
        renderViewerPkDockHtml: renderViewerPkDockHtml,
        renderViewerPkAssistHtml: renderViewerPkAssistHtml
    };
})(typeof window !== "undefined" ? window : this);
