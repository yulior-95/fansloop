/**
 * 观众端直播间 · 按主播维度同步页面展示（Feed / 订阅 / URL ?host= 进入）
 */
(function (global) {
    var STORAGE_KEY = "fl_live_view_host_v1";
    var PENDING_KEY = "fl_live_pending_host_v1";
    var VIEWER_LIVE_PAGE = "live-detail-ab.html";

    var ALIASES = {
        nova: "novaplay",
        novaplay: "novaplay",
        yeyu: "yeyu",
        aken: "shanye",
        nightrun: "codepoet"
    };

    var NAME_TO_SLUG = {
        NovaPlay: "novaplay",
        山野食光: "shanye",
        "Lens 旅记": "lens",
        夜雨听弦: "yeyu",
        代码诗人: "codepoet",
        银盐时代: "yinyan",
        咖啡店主: "coffee",
        夜间速写: "nightsketch"
    };

    var HOSTS = {
        novaplay: {
            slug: "novaplay",
            name: "NovaPlay",
            av: "photo-1535713875002-d1d0cf377fde",
            cover: "photo-1542751371-adc38448a05e",
            title: "Apex 大师之路 · 周五开黑准点上分",
            shortTitle: "Apex 大师之路",
            tag: "Apex 大师之路",
            category: "游戏直播",
            categoryIcon: "fa-gamepad",
            level: 9,
            roleLabel: "游戏主播",
            fans: "86.4K",
            liveCount: "412",
            cheers: "4.6K",
            tipsTotal: "1,820",
            roomSlug: "novaplay-apex-8842",
            tags: ["Apex 大师之路", "开黑", "排位上分"],
            desc: "周五固定开黑车队，钻石局冲大师。欢迎弹幕点英雄、聊阵容；礼物与打赏将实时展示在画面与聊天室。"
        },
        shanye: {
            slug: "shanye",
            name: "山野食光",
            av: "photo-1487412720507-e7ab37603c6f",
            cover: "photo-1490806843957-31f4c9a91c65",
            title: "山野厨房 · 露营料理直播",
            shortTitle: "山野厨房",
            tag: "露营料理",
            category: "美食直播",
            categoryIcon: "fa-utensils",
            level: 6,
            roleLabel: "美食创作者",
            fans: "42.1K",
            liveCount: "186",
            cheers: "2.1K",
            tipsTotal: "680",
            roomSlug: "shanye-camp-kitchen",
            tags: ["露营", "料理", "户外"],
            desc: "户外露营现场烹饪，分享轻量化装备与食谱。支持 USDT 打赏与礼物互动。"
        },
        lens: {
            slug: "lens",
            name: "Lens 旅记",
            av: "photo-1438761681033-6461ffad8d80",
            cover: "photo-1506905925346-21bda4d32df4",
            title: "京都巷弄 · 胶片街拍实录",
            shortTitle: "京都街拍",
            tag: "旅行摄影",
            category: "摄影直播",
            categoryIcon: "fa-camera",
            level: 8,
            roleLabel: "摄影创作者",
            fans: "58.3K",
            liveCount: "264",
            cheers: "3.2K",
            tipsTotal: "940",
            roomSlug: "lens-kyoto-street",
            tags: ["京都", "胶片", "街拍"],
            desc: "实时分享构图、测光与机位选择；订阅者可下载 RAW 样片包。"
        },
        yeyu: {
            slug: "yeyu",
            name: "夜雨听弦",
            av: "photo-1500648767791-00dcc994a43e",
            cover: "photo-1516280440614-37939bbacd81",
            title: "深夜爵士 · 即兴钢琴",
            shortTitle: "深夜爵士",
            tag: "爵士夜",
            category: "音乐直播",
            categoryIcon: "fa-music",
            level: 7,
            roleLabel: "音乐主播",
            fans: "31.6K",
            liveCount: "198",
            cheers: "2.8K",
            tipsTotal: "520",
            roomSlug: "yeyu-jazz-piano",
            tags: ["爵士", "即兴钢琴", "深夜直播"],
            desc: "雨夜小提琴与钢琴即兴合奏，欢迎弹幕点曲。礼物将触发直播间特效。"
        },
        codepoet: {
            slug: "codepoet",
            name: "代码诗人",
            av: "photo-1502685104226-ee32379fefbe",
            cover: "photo-1465847899084-d164df4dedc6",
            title: "Web3 创作者经济 · 链上订阅 AMA",
            shortTitle: "Web3 AMA",
            tag: "Web3",
            category: "科技直播",
            categoryIcon: "fa-microchip",
            level: 9,
            roleLabel: "科技创作者",
            fans: "24.8K",
            liveCount: "142",
            cheers: "1.9K",
            tipsTotal: "430",
            roomSlug: "codepoet-web3-ama",
            tags: ["Web3", "创作者经济", "AMA"],
            desc: "聊聊链上订阅、粉丝分层与内容变现；欢迎带问题进房。"
        },
        yinyan: {
            slug: "yinyan",
            name: "银盐时代",
            av: "photo-1438761681033-6461ffad8d80",
            cover: "photo-1522383225653-ed111181a951",
            title: "暗房冲洗 · 人像胶片实录",
            shortTitle: "暗房冲洗",
            tag: "胶片人像",
            category: "摄影直播",
            categoryIcon: "fa-camera-retro",
            level: 5,
            roleLabel: "胶片摄影师",
            fans: "18.2K",
            liveCount: "96",
            cheers: "1.2K",
            tipsTotal: "310",
            roomSlug: "yinyan-darkroom",
            tags: ["胶片", "暗房", "人像"],
            desc: "展示胶片冲洗流程与成片调色思路，适合入门爱好者。"
        },
        coffee: {
            slug: "coffee",
            name: "咖啡店主",
            av: "photo-1500648767791-00dcc994a43e",
            cover: "photo-1493612276216-ee3925520721",
            title: "深夜咖啡馆 · 手冲问答",
            shortTitle: "手冲问答",
            tag: "咖啡",
            category: "生活直播",
            categoryIcon: "fa-mug-hot",
            level: 4,
            roleLabel: "生活博主",
            fans: "12.4K",
            liveCount: "78",
            cheers: "860",
            tipsTotal: "180",
            roomSlug: "coffee-late-night",
            tags: ["手冲", "咖啡豆", "开店日常"],
            desc: "开店打烊后的闲聊与手冲演示，欢迎问豆子与器具。"
        },
        nightsketch: {
            slug: "nightsketch",
            name: "夜间速写",
            av: "photo-1502685104226-ee32379fefbe",
            cover: "photo-1502602898657-3e91760cbb34",
            title: "深夜绘画直播间 · 人像速写",
            shortTitle: "人像速写",
            tag: "绘画",
            category: "艺术直播",
            categoryIcon: "fa-paintbrush",
            level: 6,
            roleLabel: "插画师",
            fans: "15.7K",
            liveCount: "112",
            cheers: "1.1K",
            tipsTotal: "260",
            roomSlug: "nightsketch-portrait",
            tags: ["速写", "人像", "绘画"],
            desc: "45 分钟人像速写全流程，分享构图与明暗关系。"
        }
    };

    var current = null;

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function resolveSlug(raw) {
        var s = String(raw || "").trim().toLowerCase();
        if (!s) return "novaplay";
        if (ALIASES[s]) return ALIASES[s];
        if (HOSTS[s]) return s;
        return "novaplay";
    }

    function slugFromCreatorName(name) {
        return NAME_TO_SLUG[name] || "novaplay";
    }

    function getHost(slug) {
        slug = resolveSlug(slug);
        return HOSTS[slug] || HOSTS.novaplay;
    }

    function liveUrl(h) {
        return "https://goodfans.io/live/" + h.roomSlug;
    }

    function setCreatorNameEl(el, name, verified) {
        if (!el) return;
        var badge =
            verified !== false
                ? ' <span class="fl-badge fl-badge--creator" title="认证创作者" aria-label="认证创作者"><i class="fa-solid fa-palette"></i></span>'
                : "";
        el.innerHTML = esc(name) + badge;
    }

    function setHostChatNames(name) {
        document.querySelectorAll(".chat-msg .nm.creator").forEach(function (el) {
            var badge = el.querySelector(".badge.creator");
            el.innerHTML = "";
            if (badge) el.appendChild(badge);
            el.appendChild(document.createTextNode(name));
        });
    }

    function stashPendingSlug(slug) {
        try {
            sessionStorage.setItem(PENDING_KEY, resolveSlug(slug));
        } catch (e) {}
    }

    function stashPendingFromCreator(name) {
        stashPendingSlug(slugFromCreatorName(name));
    }

    function resolveSlugFromFeed(article, liveTap) {
        var slug =
            (liveTap && liveTap.getAttribute("data-host-slug")) ||
            (article && article.getAttribute("data-host-slug"));
        if (slug) return resolveSlug(slug);
        var creator =
            (liveTap && liveTap.getAttribute("data-creator")) ||
            (article && article.getAttribute("data-creator"));
        if (creator) return slugFromCreatorName(creator);
        return "";
    }

    function isLiveDetailHref(href) {
        if (!href) return false;
        return href.indexOf("live-detail.html") >= 0 || href.indexOf("live-detail-ab.html") >= 0;
    }

    function buildLiveDetailUrl(slug, creatorName, navId) {
        var url =
            VIEWER_LIVE_PAGE + "?host=" +
            encodeURIComponent(resolveSlug(slug || "novaplay"));
        if (creatorName) {
            url += "&creator=" + encodeURIComponent(creatorName);
        }
        return appendNavParam(url, navId || "home");
    }

    function applyToPage(slug) {
        var h = getHost(slug);
        current = h;

        try {
            sessionStorage.setItem(STORAGE_KEY, h.slug);
        } catch (e) {}

        document.title = "正在直播 · " + h.name;

        var crumb = document.querySelector(".crumb .curr");
        if (crumb) crumb.textContent = h.name + " · " + h.shortTitle;

        var player = document.getElementById("livePlayer");
        if (player) {
            player.style.backgroundImage =
                "url('https://images.unsplash.com/" + h.cover + "?w=1600')";
        }

        var playerTitle = document.querySelector(".live-player .bottom-overlay h2");
        if (playerTitle) playerTitle.textContent = h.title;

        var subRow = document.querySelector(".live-player .bottom-overlay .sub");
        if (subRow) {
            subRow.innerHTML =
                '<span><i class="fa-solid fa-tag"></i> # ' +
                esc(h.tag) +
                "</span>" +
                '<span><i class="fa-solid ' +
                h.categoryIcon +
                '"></i> ' +
                esc(h.category) +
                "</span>" +
                '<span><i class="fa-solid fa-fire"></i> ' +
                esc(h.cheers) +
                " 喝彩</span>";
        }

        var avImg = document.querySelector(".creator-strip .av-img");
        if (avImg) {
            avImg.style.backgroundImage =
                "url('https://images.unsplash.com/" + h.av + "?w=200')";
        }

        setCreatorNameEl(document.querySelector(".creator-strip .info .nm"), h.name);

        var meta = document.querySelector(".creator-strip .info .meta");
        if (meta) {
            meta.innerHTML =
                '<span><span class="badge-mini">优质</span> ' +
                esc(h.roleLabel) +
                " · LV " +
                h.level +
                "</span>" +
                '<span><i class="fa-solid fa-user-group"></i> ' +
                esc(h.fans) +
                " 粉丝</span>" +
                '<span><i class="fa-solid fa-tower-broadcast"></i> 累计直播 ' +
                esc(h.liveCount) +
                ' 场</span>';
        }

        var cheer = document.getElementById("cheerCountLabel");
        if (cheer) cheer.textContent = "喝彩 " + h.cheers;

        var tips = document.querySelector(".action-strip .stat-mini b");
        if (tips) tips.textContent = h.tipsTotal + " USDT";

        var pipLabel = document.querySelector(".live-pip-win .pip-hd > span");
        if (pipLabel) {
            pipLabel.innerHTML =
                '<i class="fa-solid fa-circle" style="color:#EF4444;font-size:8px"></i> ' +
                esc(h.name) +
                " · 直播中";
        }

        var subHd = document.querySelector("#ldSubOverlay .ld-modal-hd h3");
        if (subHd) {
            subHd.innerHTML =
                '<i class="fa-solid fa-crown" style="color:#C084FC"></i> 订阅 ' + esc(h.name);
        }

        var spName = document.querySelector("#sharePosterCard .sp-name");
        if (spName) setCreatorNameEl(spName, h.name);

        var spTitle = document.querySelector("#sharePosterCard .sp-title");
        if (spTitle) spTitle.textContent = h.title;

        var spAv = document.querySelector("#sharePosterCard .sp-av");
        if (spAv) {
            spAv.style.backgroundImage =
                "url('https://images.unsplash.com/" + h.av + "?w=200')";
        }

        var spCover = document.querySelector("#sharePosterCard .sp-cover");
        if (spCover) {
            spCover.style.backgroundImage =
                "url('https://images.unsplash.com/" + h.cover + "?w=1200')";
        }

        var spUrl = document.querySelector("#sharePosterCard .sp-link-url");
        if (spUrl) spUrl.textContent = "goodfans.io/live/" + h.roomSlug;

        var shareInp = document.getElementById("shareLinkInput");
        if (shareInp) shareInp.value = liveUrl(h);

        var introBody = document.getElementById("ldIntroBody");
        if (introBody) {
            introBody.innerHTML =
                esc(h.desc) +
                "<br/><br/>礼物排行：<br/>🥇 WhaleX · 1,200 USDT<br/>🥈 BlockTrader · 412 USDT<br/>🥉 Aria · 188 USDT";
        }

        var introTags = document.getElementById("ldIntroTags");
        if (introTags) {
            introTags.innerHTML = h.tags
                .map(function (tag) {
                    return '<span class="chip"># ' + esc(tag) + "</span>";
                })
                .join("");
        }

        setHostChatNames(h.name);

        document.querySelectorAll(".chat-msg[data-filter='host'] .av").forEach(function (el) {
            el.style.backgroundImage =
                "url('https://images.unsplash.com/" + h.av + "?w=80')";
        });

        if (global.LiveMetaStore && global.LiveMetaStore.save) {
            global.LiveMetaStore.save({
                title: h.title,
                desc: h.desc,
                tags: h.tags.slice()
            });
        }

        return h;
    }

    function applyFromUrl() {
        var slug = "novaplay";
        try {
            var params = new URLSearchParams(global.location.search);
            var hostParam = params.get("host");
            var creatorParam = params.get("creator");

            if (creatorParam && NAME_TO_SLUG[creatorParam]) {
                slug = slugFromCreatorName(creatorParam);
            } else if (hostParam) {
                slug = resolveSlug(hostParam);
            } else {
                var pending = sessionStorage.getItem(PENDING_KEY);
                if (pending) {
                    slug = resolveSlug(pending);
                    sessionStorage.removeItem(PENDING_KEY);
                } else {
                    var saved = sessionStorage.getItem(STORAGE_KEY);
                    if (saved) slug = resolveSlug(saved);
                }
            }
        } catch (e) {}
        return applyToPage(slug);
    }

    function appendNavParam(url, navId) {
        if (!url || !navId) return url;
        if (url.indexOf("nav=") >= 0) return url;
        var sep = url.indexOf("?") >= 0 ? "&" : "?";
        return url + sep + "nav=" + encodeURIComponent(navId);
    }

    function persistNavContext(navId) {
        try {
            if (navId) sessionStorage.setItem("fl_sidebar_nav_context", navId);
        } catch (e) {}
    }

    function hrefForCreatorName(name, liveStatus, navId) {
        if (liveStatus === "ended") return VIEWER_LIVE_PAGE;
        return buildLiveDetailUrl(slugFromCreatorName(name), name, navId);
    }

    function hrefFromFeedArticle(article, liveTap, status, navId) {
        if (status === "ended") return VIEWER_LIVE_PAGE;
        navId = navId || "home";
        var creator =
            (liveTap && liveTap.getAttribute("data-creator")) ||
            (article && article.getAttribute("data-creator"));
        var slug = resolveSlugFromFeed(article, liveTap);
        if (slug) {
            return buildLiveDetailUrl(slug, creator, navId);
        }
        var href = (article && article.getAttribute("data-detail-href")) || "";
        if (isLiveDetailHref(href)) {
            return appendNavParam(href, navId);
        }
        return buildLiveDetailUrl("novaplay", creator, navId);
    }

    function navigateFromFeed(article, liveTap, status, navId) {
        if (status === "ended") return { ended: true };
        navId = navId || "home";
        var creator =
            (liveTap && liveTap.getAttribute("data-creator")) ||
            (article && article.getAttribute("data-creator"));
        var slug = resolveSlugFromFeed(article, liveTap);
        if (slug) stashPendingSlug(slug);
        else if (creator) stashPendingFromCreator(creator);
        var url = hrefFromFeedArticle(article, liveTap, status, navId);
        persistNavContext(navId);
        global.location.href = url;
        return { href: url };
    }

    global.LiveViewHost = {
        VIEWER_LIVE_PAGE: VIEWER_LIVE_PAGE,
        HOSTS: HOSTS,
        resolveSlug: resolveSlug,
        slugFromCreatorName: slugFromCreatorName,
        getHost: getHost,
        getCurrent: function () {
            return current || HOSTS.novaplay;
        },
        applyToPage: applyToPage,
        applyFromUrl: applyFromUrl,
        stashPendingFromCreator: stashPendingFromCreator,
        stashPendingSlug: stashPendingSlug,
        resolveSlugFromFeed: resolveSlugFromFeed,
        buildLiveDetailUrl: buildLiveDetailUrl,
        hrefForCreatorName: hrefForCreatorName,
        hrefFromFeedArticle: hrefFromFeedArticle,
        navigateFromFeed: navigateFromFeed
    };

    global.FL_goLiveFromFeed = function (article, liveTap, status) {
        return navigateFromFeed(article, liveTap, status);
    };
})(typeof window !== "undefined" ? window : this);
