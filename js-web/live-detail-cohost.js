/**
 * 观众端直播间 · 主播连麦 / PK / 观众席位演示
 * 支持 live-detail.html（方案 A）与 live-detail-ab.html（方案 B）
 * 主播连麦与观众上麦互斥，不可同时进行
 */
(function (global) {
    var COHOST_HOSTS = {
        yeyu: {
            slug: "yeyu",
            name: "夜雨听弦",
            av: "photo-1500648767791-00dcc994a43e",
            cover: "photo-1516280440614-37939bbacd81"
        },
        shanye: {
            slug: "shanye",
            name: "山野食光",
            av: "photo-1487412720507-e7ab37603c6f",
            cover: "photo-1490806843957-31f4c9a91c65"
        },
        coffee: {
            slug: "coffee",
            name: "咖啡店主",
            av: "photo-1500648767791-00dcc994a43e",
            cover: "photo-1493612276216-ee3925520721"
        },
        lens: {
            slug: "lens",
            name: "Lens 旅记",
            av: "photo-1438761681033-6461ffad8d80",
            cover: "photo-1506905925346-21bda4d32df4"
        },
        luna: {
            slug: "luna",
            name: "Luna 🌙",
            av: "photo-1494790108377-be9c29b29330",
            cover: "photo-1516280440614-37939bbacd81"
        },
        echodj: {
            slug: "echodj",
            name: "EchoDJ",
            av: "photo-1535713875002-d1d0cf377fde",
            cover: "photo-1571330735066-03aaa9429d89"
        }
    };

    var LIVE_PICKER_HOSTS = [
        { slug: "coffee", name: "咖啡店主", category: "生活直播", viewers: "642", av: "photo-1500648767791-00dcc994a43e" },
        { slug: "yeyu", name: "夜雨听弦", category: "音乐直播", viewers: "1,284", av: "photo-1500648767791-00dcc994a43e" },
        { slug: "lens", name: "Lens 旅记", category: "摄影直播", viewers: "428", av: "photo-1438761681033-6461ffad8d80" },
        { slug: "codepoet", name: "代码诗人", category: "科技直播", viewers: "312", av: "photo-1502685104226-ee32379fefbe" },
        { slug: "nightsketch", name: "夜间速写", category: "艺术直播", viewers: "518", av: "photo-1502685104226-ee32379fefbe" }
    ];

    var DIRECTED_TIP =
        "<p style='margin:0 0 8px'><strong style='color:#f3e8ff'>指定连麦（To 研发）</strong></p>" +
        "<ul style='margin:0;padding-left:1.15em;font-size:11px;line-height:1.55'>" +
        "<li>与随机匹配不同：发起方从<strong>正在直播</strong>列表搜索并选择目标主播</li>" +
        "<li>API：<code>GET /v1/live/cohost/candidates?q=</code> 返回可邀请主播；需对方在线且未满 3 路</li>" +
        "<li>邀请发出后对方收到系统通知，可同意 / 拒绝；同意后合流布局与随机匹配一致</li>" +
        "<li>连麦成功后功能（PK、退出、最多 3 路）与随机匹配完全相同</li>" +
        "</ul>";

    var COHOST_LAYOUT_TIP =
        "<p style='margin:0 0 8px'><strong style='color:#f3e8ff'>连麦分屏布局（To 研发）</strong></p>" +
        "<ul style='margin:0;padding-left:1.15em;font-size:11px;line-height:1.55'>" +
        "<li><strong>双屏 · 2 路</strong>：<code>grid-template-columns: 1fr 1fr</code>，左右等分；房主默认占左格，连麦主播占右格</li>" +
        "<li><strong>三屏 · 3 路</strong>：<code>2×2 grid</code>，左列 1 格 <code>grid-row: span 2</code>（房主），右列上下各 1 格（连麦主播）</li>" +
        "<li>观众端顶栏可切换双屏/三屏预览；实际合流由服务端 <code>live.cohost.layout</code> 下发</li>" +
        "<li>同屏最多 <strong>3</strong> 路主播；与观众上麦互斥</li>" +
        "</ul>";

    var INVITE_TIP =
        "<p style='margin:0 0 8px'><strong style='color:#f3e8ff'>连麦邀请通知（To 研发）</strong></p>" +
        "<ul style='margin:0;padding-left:1.15em;font-size:11px;line-height:1.55'>" +
        "<li>随机匹配成功或指定邀请时，向目标主播推送 <code>WS live.cohost.invite</code></li>" +
        "<li>通知中心 + 直播控制台弹窗双通道；超时未响应自动释放匹配队列</li>" +
        "<li>拒绝后发起方收到 Toast；同意则服务端合流并广播 <code>live.cohost.joined</code></li>" +
        "</ul>";

    var MATCH_ALGO_TIP =
        "<p style='margin:0 0 8px'><strong style='color:#f3e8ff'>随机匹配连麦 · 算法规则（To 研发）</strong></p>" +
        "<ol style='margin:0;padding-left:1.15em;line-height:1.55;font-size:11px'>" +
        "<li><strong>品类优先</strong>：同直播品类（音乐/游戏等）权重 +40</li>" +
        "<li><strong>热度接近</strong>：在线人数差 ≤30% 加分；过大则降权</li>" +
        "<li><strong>语言区域</strong>：<code>commLang</code> 一致优先跨国无障碍合流</li>" +
        "<li><strong>冷却去重</strong>：24h 内已连麦过的主播降权，避免重复配对</li>" +
        "<li><strong>路数上限</strong>：单场最多 <strong>3</strong> 路主播同屏；满员后仅可排队或指定邀请</li>" +
        "<li><strong>服务端</strong>：<code>POST /v1/live/cohost/match</code> 返回候选；<code>WS live.cohost.matched</code> 推送结果</li>" +
        "</ol>";

    var PK_DURATIONS = [
        { sec: 60, label: "1 分钟" },
        { sec: 180, label: "3 分钟" },
        { sec: 300, label: "5 分钟" },
        { sec: 600, label: "10 分钟" }
    ];

    var PK_DEV_TIP =
        "<p style='margin:0 0 8px'><strong style='color:#f3e8ff'>PK 规则（To 研发）</strong></p>" +
        "<ul style='margin:0;padding-left:1.15em;font-size:11px;line-height:1.55'>" +
        "<li><strong>前置条件</strong>：仅主播连麦成功后可用，与观众上麦互斥</li>" +
        "<li><strong>发起</strong>：在麦主播选择 PK 形式（礼物总金额 / 点赞总个数）+ 时长（后台配置项）</li>" +
        "<li><strong>全员同意</strong>：<code>POST /v1/live/pk/request</code> → 所有在麦主播确认后 <code>WS live.pk.started</code></li>" +
        "<li><strong>进行中</strong>：观众端展示双端血条 + 倒计时；礼物/点赞实时累加</li>" +
        "<li><strong>结束</strong>：到时结算胜负，血条定格并广播结果</li>" +
        "</ul>";

    var state = {
        mode: "",
        pk: false,
        pkPhase: "",
        pkType: "gift",
        pkDurSec: 180,
        audMic: false,
        matching: false,
        pkScoreA: 1240,
        pkScoreB: 892
    };

    function img(id, w) {
        return "https://images.unsplash.com/" + id + "?w=" + (w || 1200) + "&q=80";
    }

    function isAbPage() {
        return !!document.getElementById("ldAbPlayer");
    }

    /** 方案 B 仅山野食光启用主播连麦；其他直播间不介入 */
    function isShanyeAbRoom() {
        return isAbPage() && getRoomSlug() === "shanye";
    }

    function shouldRunCohostModule() {
        if (isAbPage()) return getRoomSlug() === "shanye";
        var slug = getRoomSlug();
        var p = readParams();
        return slug === "yeyu" || p.get("demo") === "cohost" || !!p.get("cohost");
    }

    function getPlayer() {
        return document.getElementById("ldAbPlayer") || document.getElementById("livePlayer");
    }

    function getAudienceSlots() {
        return document.getElementById("ldAbAudienceSlots") || document.getElementById("ldAudienceSlots");
    }

    function getChatList() {
        return document.getElementById("ldAbChatBody") || document.getElementById("chatBody");
    }

    function cohostGridClass(n) {
        return isAbPage() ? "ld-ab-player--cohost-" + n : "live-player--cohost-" + n;
    }

    function clearPlayerCohostClasses(player) {
        if (!player) return;
        player.classList.remove(
            "live-player--cohost-2", "live-player--cohost-3",
            "ld-ab-player--cohost-2", "ld-ab-player--cohost-3",
            "is-cohost-matching", "is-pk-active", "is-pk-pending"
        );
    }

    function getRoomSlug() {
        if (global.LiveViewHost && global.LiveViewHost.getCurrent) {
            return global.LiveViewHost.getCurrent().slug || "novaplay";
        }
        try {
            var h = new URLSearchParams(location.search).get("host");
            if (h) return h;
        } catch (e) {}
        return "novaplay";
    }

    function readParams() {
        try {
            return new URLSearchParams(location.search);
        } catch (e) {
            return new URLSearchParams();
        }
    }

    function isHostCohostMode(mode) {
        return mode === "2" || mode === "2pk" || mode === "3" || mode === "matching";
    }

    function isHostCohostActive() {
        if (isAbPage() && getRoomSlug() !== "shanye") return false;
        return isHostCohostMode(state.mode) || state.matching;
    }

    function setAudienceMicUi(enabled) {
        var slots = getAudienceSlots();
        var micGroup = document.querySelector(".ac-mic-group");
        var micBtn = document.getElementById("ldAbBtnMic");
        if (slots) {
            if (enabled) {
                slots.removeAttribute("hidden");
                slots.hidden = false;
            } else {
                slots.setAttribute("hidden", "");
                slots.hidden = true;
            }
        }
        if (micGroup) {
            if (enabled) micGroup.removeAttribute("hidden");
            else {
                micGroup.setAttribute("hidden", "");
                micGroup.hidden = true;
            }
        }
        if (micBtn) {
            micBtn.disabled = !enabled;
            micBtn.classList.toggle("is-disabled", !enabled);
            micBtn.title = enabled ? "申请上麦" : "主播连麦进行中，暂不可申请";
        }
        document.body.classList.toggle("ld-host-cohost-active", !enabled);
        document.body.classList.toggle("ld-ab-host-cohost-active", !enabled && isAbPage());
        global.dispatchEvent(
            new CustomEvent("fl-host-cohost-change", { detail: { active: !enabled } })
        );
    }

    function notifyHostCohostChange() {
        setAudienceMicUi(!isHostCohostActive());
    }

    function resolveMode() {
        var p = readParams();
        if (p.get("audMic") === "demo" && !p.get("cohost")) return "";
        var cohost = p.get("cohost");
        var slug = getRoomSlug();
        if (cohost) {
            if (isAbPage() && slug !== "shanye") return "";
            return cohost;
        }
        if (isAbPage()) {
            if (slug === "shanye") return "2";
            return "";
        }
        if (p.get("demo") === "cohost") return cohost || "2";
        return "";
    }

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function buildCell(host, isMain) {
        var cls = "live-cohost-cell" + (isMain ? " live-cohost-cell--main" : "");
        var liveTag = isAbPage()
            ? ""
            : '<span class="live-cohost-live-tag"><span class="dot"></span> LIVE</span>';
        return (
            '<div class="' + cls + '" style="background-image:url(\'' + img(host.cover, 1400) + '\')">' +
            liveTag +
            '<div class="live-cohost-label">' +
            '<span class="av" style="background-image:url(\'' + img(host.av, 80) + '\')"></span> ' +
            esc(host.name) +
            "</div></div>"
        );
    }

    function wrapCohostCells(mode, cellsHtml) {
        if (!isAbPage()) return cellsHtml;
        var n = mode === "3" ? "3" : "2";
        return (
            '<div class="ld-ab-cohost-stage ld-ab-cohost-stage--' + n + '" id="ldAbCohostStage">' +
            cellsHtml +
            "</div>"
        );
    }

    function markPlayerCohost(player, mode) {
        if (!player || mode === "matching") return;
        if (isAbPage()) {
            player.classList.add("is-host-cohost-on");
            player.classList.remove("ld-ab-player--cohost-2", "ld-ab-player--cohost-3");
        } else {
            player.classList.add(cohostGridClass(mode === "3" ? 3 : 2));
        }
    }

    function clearPlayerCohostState(player) {
        if (!player) return;
        player.classList.remove("is-host-cohost-on");
        clearPlayerCohostClasses(player);
    }

    function removeInjected(player) {
        player = player || getPlayer();
        if (!player) return;
        var stage = document.getElementById("ldAbCohostStage");
        if (stage && stage.parentNode) stage.parentNode.removeChild(stage);
        player.querySelectorAll(
            ".live-cohost-cell, .live-cohost-top, .obs-pk-hud, .host-matching-overlay, .ld-pk-pending-strip, .ld-pk-result-flash"
        ).forEach(function (el) {
            el.parentNode.removeChild(el);
        });
        clearPlayerCohostState(player);
        stopPkSimulation();
    }

    function formatPkScore(n, pkType) {
        if (pkType === "like") {
            return n >= 1000 ? (n / 1000).toFixed(1) + "K 赞" : n + " 赞";
        }
        return n >= 1000 ? (n / 1000).toFixed(1) + "K USDT" : n + " USDT";
    }

    function pkBarPct(a, b) {
        var total = a + b;
        if (total <= 0) return 50;
        return Math.round((a / total) * 100);
    }

    function renderPkPendingStrip(hosts, opts) {
        opts = opts || {};
        var typeLabel = opts.pkType === "like" ? "点赞总个数" : "礼物总金额";
        var durLabel = opts.pkDurLabel || "3 分钟";
        var initiator = hosts[0] || { name: "夜雨听弦" };
        var partner = hosts[1] || { name: "Luna 🌙" };
        return (
            '<div class="ld-pk-pending-strip" id="ldPkPendingStrip">' +
            '<div class="ld-pk-pending-strip__glow"></div>' +
            '<div class="ld-pk-pending-strip__icon"><i class="fa-solid fa-hourglass-half"></i></div>' +
            '<div class="ld-pk-pending-strip__body">' +
            "<strong>PK 申请进行中</strong>" +
            "<span>" + esc(typeLabel) + " · " + esc(durLabel) + " · 需所有在麦主播同意后开始</span>" +
            '<div class="ld-pk-approve-list">' +
            '<span class="ld-pk-approve ld-pk-approve--ok"><i class="fa-solid fa-circle-check"></i> ' + esc(initiator.name) + "（发起方）</span>" +
            '<span class="ld-pk-approve ld-pk-approve--wait"><i class="fa-solid fa-circle-notch fa-spin"></i> ' + esc(partner.name) + " 等待确认</span>" +
            "</div></div>" +
            '<span class="dev-glass-wrap dev-glass-wrap--inline dev-glass-wrap--pop-below">' +
            '<span class="dev-glass-sphere" tabindex="0" aria-describedby="devPkPendingTip">' +
            '<span class="dev-glass-sphere-shine"></span>' +
            '<span class="dev-glass-sphere-txt">To 研发</span></span>' +
            '<span class="dev-glass-pop dev-glass-pop--wide" id="devPkPendingTip" role="tooltip">' +
            PK_DEV_TIP +
            "</span></span></div>"
        );
    }

    function renderPkHud(hostA, hostB, opts) {
        opts = opts || {};
        var pkType = opts.pkType || "gift";
        var typeLabel = pkType === "like" ? "点赞总个数" : "礼物总金额";
        var typeIcon = pkType === "like" ? "fa-thumbs-up" : "fa-gift";
        var scoreA = state.pkScoreA;
        var scoreB = state.pkScoreB;
        var pctA = pkBarPct(scoreA, scoreB);
        var durLabel = opts.pkDurLabel || "3 分钟";
        var durSec = opts.pkDurSec || 180;
        var mm = String(Math.floor(durSec / 60)).padStart(2, "0");
        var ss = String(durSec % 60).padStart(2, "0");
        return (
            '<div class="obs-pk-hud obs-pk-hud--live" id="ldPkHud" data-pk-type="' + pkType + '">' +
            '<div class="obs-pk-mode-row">' +
            '<span class="obs-pk-mode-chip"><i class="fa-solid ' + typeIcon + '"></i> PK · ' + esc(typeLabel) + "</span>" +
            '<span class="obs-pk-dur-chip"><i class="fa-regular fa-clock"></i> ' + esc(durLabel) + "</span>" +
            '<span class="dev-glass-wrap dev-glass-wrap--inline dev-glass-wrap--pop-below">' +
            '<span class="dev-glass-sphere" tabindex="0" aria-describedby="devPkLiveTip">' +
            '<span class="dev-glass-sphere-shine"></span>' +
            '<span class="dev-glass-sphere-txt">To 研发</span></span>' +
            '<span class="dev-glass-pop dev-glass-pop--wide" id="devPkLiveTip" role="tooltip">' +
            PK_DEV_TIP +
            "</span></span></div>" +
            '<div class="obs-pk-timer" id="ldPkTimer" data-sec="' + durSec + '">' + mm + ":" + ss + "</div>" +
            '<div class="obs-pk-bars">' +
            '<div class="obs-pk-bar-wrap">' +
            '<div class="obs-pk-bar-meta"><span>' + esc(hostA.name) + '</span><span id="ldPkScoreA">' + formatPkScore(scoreA, pkType) + "</span></div>" +
            '<div class="obs-pk-bar obs-pk-bar--a"><span id="ldPkBarA" style="width:' + pctA + '%"></span></div></div>' +
            '<div class="obs-pk-vs">VS</div>' +
            '<div class="obs-pk-bar-wrap">' +
            '<div class="obs-pk-bar-meta"><span>' + esc(hostB.name) + '</span><span id="ldPkScoreB">' + formatPkScore(scoreB, pkType) + "</span></div>" +
            '<div class="obs-pk-bar obs-pk-bar--b"><span id="ldPkBarB" style="width:' + (100 - pctA) + '%"></span></div></div>' +
            "</div></div>"
        );
    }

    function renderMatchingOverlay() {
        return (
            '<div class="host-matching-overlay" id="ldMatchingOverlay">' +
            '<div class="host-matching-radar"><i class="fa-solid fa-satellite-dish"></i></div>' +
            "<h3>正在为你匹配连麦主播…</h3>" +
            "<p>系统将根据品类、在线热度与语言偏好为你寻找合适的主播，匹配成功后画面将自动分屏。</p>" +
            '<div class="host-matching-steps">' +
            '<span class="step done">发起匹配</span>' +
            '<span class="step active">检索候选</span>' +
            '<span class="step">等待对方确认</span>' +
            '<span class="step">合流开播</span>' +
            "</div>" +
            '<span class="dev-glass-wrap dev-glass-wrap--inline dev-glass-wrap--pop-below" style="margin-top:8px">' +
            '<span class="dev-glass-sphere" tabindex="0" aria-describedby="devMatchAlgoTip">' +
            '<span class="dev-glass-sphere-shine"></span>' +
            '<span class="dev-glass-sphere-txt">To 研发</span></span>' +
            '<span class="dev-glass-pop dev-glass-pop--wide" id="devMatchAlgoTip" role="tooltip">' +
            MATCH_ALGO_TIP +
            "</span></span>" +
            "</div>"
        );
    }

    function resolvePkPhase() {
        var p = readParams();
        var pk = p.get("pk");
        if (pk === "pending") return "pending";
        if (pk === "1" || pk === "active") return "active";
        return "";
    }

    function resolvePkOptions() {
        var p = readParams();
        var pkType = p.get("pkType") === "like" ? "like" : "gift";
        var durSec = parseInt(p.get("pkDur"), 10) || 180;
        var matched = PK_DURATIONS.filter(function (d) { return d.sec === durSec; })[0];
        if (!matched) matched = PK_DURATIONS[1];
        return {
            pkType: pkType,
            pkDurSec: matched.sec,
            pkDurLabel: matched.label
        };
    }

    function renderCohostTop(count, max, extraChip) {
        if (isAbPage()) return "";
        var chip = extraChip
            ? '<span class="host-cohost-chip host-cohost-chip--pk">' + extraChip + "</span>"
            : "";
        return (
            '<div class="live-cohost-top" id="ldCohostTop">' +
            '<span class="host-cohost-chip host-cohost-chip--link"><i class="fa-solid fa-link"></i> 连麦中 · ' +
            count + "/" + max +
            "</span>" +
            chip +
            "</div>"
        );
    }

    function updateRoomBadge(mode, hosts) {
        var meta = document.querySelector(".creator-strip .info .meta");
        if (!meta) return;
        var badge = document.getElementById("ldCohostRoomBadge");
        if (!mode || mode === "matching") {
            if (badge) badge.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement("span");
            badge.id = "ldCohostRoomBadge";
            badge.className = "ld-cohost-room-badge";
            meta.insertBefore(badge, meta.firstChild);
        }
        var partners = hosts.slice(1).map(function (h) { return h.name; }).join("、");
        badge.innerHTML =
            '<i class="fa-solid fa-link"></i> 与 ' + esc(partners) + " 连麦中";
    }

    function emptySlotHtml() {
        return (
            '<div class="av-wrap"><div class="av"><i class="fa-solid fa-plus"></i></div></div>' +
            '<span class="nm">空席</span>'
        );
    }

    function resetAllAudienceSlots() {
        var slots = getAudienceSlots();
        if (!slots) return;
        slots.querySelectorAll(".obs-audience-slot").forEach(function (slot) {
            slot.className = "obs-audience-slot empty";
            slot.innerHTML = emptySlotHtml();
        });
        delete chatFlags["aud-ken"];
    }

    function resetAudienceDemo() {
        resetAllAudienceSlots();
    }

    function applyAudienceOnlyMode() {
        var player = getPlayer();
        if (!player) return;
        removeInjected(player);
        state.mode = "";
        state.pk = false;
        state.matching = false;
        state.audMic = true;
        updateRoomBadge("", []);
        resetAllAudienceSlots();
        setAudienceMicUi(true);
        syncAbCohostPill(false);
    }

    function applyAudienceDemo() {
        applyAudienceOnlyMode();
    }

    var chatFlags = {};

    function appendChatSys(text, key) {
        if (key && chatFlags[key]) return;
        if (key) chatFlags[key] = true;
        var list = getChatList();
        if (!list) return;
        var row = document.createElement("div");
        row.className = list.id === "ldAbChatBody" ? "ld-ab-sys" : "chat-sys";
        row.innerHTML = '<i class="fa-solid fa-link" style="margin-right:4px;color:#6ee7b7"></i> ' + esc(text);
        list.appendChild(row);
        list.scrollTop = list.scrollHeight;
    }

    function getHostPresets(slug) {
        var room = COHOST_HOSTS.shanye;
        if (global.LiveViewHost && global.LiveViewHost.getCurrent) {
            var cur = global.LiveViewHost.getCurrent();
            room = {
                slug: cur.slug,
                name: cur.name,
                av: cur.av,
                cover: cur.cover
            };
        }
        var partner = COHOST_HOSTS.coffee;
        var third = COHOST_HOSTS.lens;
        if (slug === "yeyu") {
            partner = COHOST_HOSTS.luna;
            third = COHOST_HOSTS.echodj;
        }
        return {
            two: [room, partner],
            three: [room, partner, third]
        };
    }

    function applyCohostLayout(mode, opts) {
        opts = opts || {};
        var player = getPlayer();
        if (!player) return;

        removeInjected(player);
        state.mode = mode || "";
        state.pk = !!opts.pkPhase;
        state.pkPhase = opts.pkPhase || "";
        state.pkType = (opts.pkOpts && opts.pkOpts.pkType) || "gift";
        state.pkDurSec = (opts.pkOpts && opts.pkOpts.pkDurSec) || 180;
        state.matching = mode === "matching";
        state.audMic = !!opts.audMic;
        if (opts.pkPhase === "active") {
            state.pkScoreA = state.pkType === "like" ? 1280 : 1240;
            state.pkScoreB = state.pkType === "like" ? 960 : 892;
        }

        var slug = getRoomSlug();
        var presets = getHostPresets(slug);
        var hosts = [];
        var pkOpts = opts.pkOpts || resolvePkOptions();
        var cellsHtml = "";
        var overlayHtml = "";

        if (mode === "matching") {
            player.classList.add("is-cohost-matching");
            overlayHtml = renderMatchingOverlay();
            player.insertAdjacentHTML("beforeend", overlayHtml);
            updateRoomBadge("", []);
            resetAllAudienceSlots();
            notifyHostCohostChange();
            updateAbViewerCohostChrome(0, 3);
            return;
        }

        if (mode === "3") {
            hosts = presets.three;
            markPlayerCohost(player, "3");
            hosts.forEach(function (h, i) {
                cellsHtml += buildCell(h, i === 0);
            });
            overlayHtml = renderCohostTop(3, 3);
        } else if (mode === "2" || mode === "2pk") {
            hosts = presets.two;
            markPlayerCohost(player, "2");
            hosts.forEach(function (h) {
                cellsHtml += buildCell(h, false);
            });
            var topChip = "";
            if (opts.pkPhase === "pending") {
                player.classList.add("is-pk-pending");
                topChip = '<i class="fa-solid fa-hourglass-half"></i> PK 待全员同意';
                overlayHtml += renderPkPendingStrip(hosts, pkOpts);
            } else if (opts.pkPhase === "active") {
                player.classList.add("is-pk-active");
                topChip = '<i class="fa-solid fa-hand-fist"></i> PK 进行中';
                overlayHtml += renderPkHud(hosts[0], hosts[1], pkOpts);
            }
            overlayHtml += renderCohostTop(2, 3, topChip);
        } else {
            updateRoomBadge("", []);
            notifyHostCohostChange();
            return;
        }

        player.insertAdjacentHTML("afterbegin", wrapCohostCells(mode, cellsHtml));
        if (overlayHtml) {
            player.insertAdjacentHTML("beforeend", overlayHtml);
        }

        updateRoomBadge(mode, hosts);
        if (hosts.length > 1) {
            appendChatSys(hosts[1].name + " 加入了主播连麦", "join-" + hosts[1].slug);
        }
        if (mode === "3" && hosts[2]) {
            appendChatSys(hosts[2].name + " 加入了主播连麦", "join-" + hosts[2].slug);
        }
        if (opts.pkPhase === "pending") {
            appendChatSys(
                hosts[0].name + " 发起 PK（" + (pkOpts.pkType === "like" ? "点赞总个数" : "礼物总金额") +
                    " · " + pkOpts.pkDurLabel + "），等待所有主播同意",
                "pk-pending"
            );
        } else if (opts.pkPhase === "active") {
            appendChatSys("全员已同意 · PK 正式开始！为支持的主播送礼/点赞助力", "pk-start");
            startPkSimulation(pkOpts);
        }
        resetAllAudienceSlots();
        notifyHostCohostChange();
        if (mode === "3") {
            updateAbViewerCohostChrome(3, 3);
        } else if (mode === "2" || mode === "2pk") {
            updateAbViewerCohostChrome(2, 3);
        } else {
            updateAbViewerCohostChrome(0, 3);
        }
    }

    var abViewerUiWired = false;

    function mountAbCohostViewerUi() {
        if (!isAbPage() || abViewerUiWired) return;
        abViewerUiWired = true;
        var tip = document.getElementById("devCohostLayoutTip");
        if (tip) tip.innerHTML = COHOST_LAYOUT_TIP;
        var layout = document.getElementById("ldAbCohostLayout");
        if (!layout) return;
        layout.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-cohost-layout]");
            if (!btn || getRoomSlug() !== "shanye") return;
            var n = btn.getAttribute("data-cohost-layout");
            setUrlParams({ cohost: n, pk: null, audMic: null });
            boot({ cohost: n });
        });
    }

    function updateAbViewerCohostChrome(hostCount, max) {
        if (!isAbPage()) return;
        var player = getPlayer();
        var status = document.getElementById("ldAbCohostStatus");
        var layout = document.getElementById("ldAbCohostLayout");
        var dev = document.getElementById("ldAbCohostDevGlass");
        var cohostOn = !!(player && player.classList.contains("is-host-cohost-on") && hostCount > 1);
        if (status) {
            if (cohostOn) {
                status.hidden = false;
                status.removeAttribute("hidden");
                status.innerHTML =
                    '<i class="fa-solid fa-link"></i> 连麦中 · ' + hostCount + "/" + max;
            } else {
                status.hidden = true;
                status.setAttribute("hidden", "");
            }
        }
        if (layout) {
            if (cohostOn && getRoomSlug() === "shanye") {
                layout.hidden = false;
                layout.removeAttribute("hidden");
                var mode = hostCount >= 3 ? "3" : "2";
                layout.querySelectorAll("[data-cohost-layout]").forEach(function (btn) {
                    btn.classList.toggle("is-active", btn.getAttribute("data-cohost-layout") === mode);
                });
            } else {
                layout.hidden = true;
                layout.setAttribute("hidden", "");
            }
        }
        if (dev) {
            if (cohostOn && getRoomSlug() === "shanye") {
                dev.hidden = false;
                dev.removeAttribute("hidden");
            } else {
                dev.hidden = true;
                dev.setAttribute("hidden", "");
            }
        }
        syncAbCohostPill(cohostOn);
    }

    function resetAbAudienceView() {
        if (!isAbPage()) return;
        var player = getPlayer();
        if (player) removeInjected(player);
        state.mode = "";
        state.pk = false;
        state.pkPhase = "";
        state.matching = false;
        state.audMic = false;
        document.body.classList.remove("ld-ab-host-cohost-active");
        setAudienceMicUi(document.body.classList.contains("ld-ab-audience-mic-room"));
        updateAbViewerCohostChrome(0, 3);
    }

    function syncAbCohostPill(hostCohostActive) {
        var pill = document.querySelector(".ld-ab-cohost-pill");
        if (!pill) return;
        if (
            isAbPage() &&
            (getRoomSlug() === "shanye" ||
                document.body.classList.contains("ld-ab-plain-live-room"))
        ) {
            pill.hidden = true;
            pill.setAttribute("hidden", "");
            return;
        }
        if (hostCohostActive || (isAbPage() && getPlayer() && getPlayer().classList.contains("is-host-cohost-on"))) {
            pill.hidden = true;
            pill.setAttribute("hidden", "");
        } else {
            pill.hidden = false;
            pill.removeAttribute("hidden");
        }
    }

    var pkTimerId = null;
    var pkScoreTickId = null;

    function stopPkSimulation() {
        clearInterval(pkTimerId);
        clearInterval(pkScoreTickId);
        pkTimerId = null;
        pkScoreTickId = null;
    }

    function updatePkBars(pkType) {
        var pctA = pkBarPct(state.pkScoreA, state.pkScoreB);
        var barA = document.getElementById("ldPkBarA");
        var barB = document.getElementById("ldPkBarB");
        var scoreA = document.getElementById("ldPkScoreA");
        var scoreB = document.getElementById("ldPkScoreB");
        if (barA) barA.style.width = pctA + "%";
        if (barB) barB.style.width = 100 - pctA + "%";
        if (scoreA) scoreA.textContent = formatPkScore(state.pkScoreA, pkType);
        if (scoreB) scoreB.textContent = formatPkScore(state.pkScoreB, pkType);
    }

    function showPkResult(hostA, hostB, pkType) {
        var player = getPlayer();
        if (!player) return;
        var winner = state.pkScoreA >= state.pkScoreB ? hostA : hostB;
        var flash = document.createElement("div");
        flash.className = "ld-pk-result-flash";
        flash.innerHTML =
            '<div class="ld-pk-result-card">' +
            '<div class="ld-pk-result-ico"><i class="fa-solid fa-trophy"></i></div>' +
            "<h3>PK 结束</h3>" +
            "<p><strong>" + esc(winner.name) + "</strong> 获胜 · " +
            esc(formatPkScore(winner === hostA ? state.pkScoreA : state.pkScoreB, pkType)) +
            "</p></div>";
        player.appendChild(flash);
        appendChatSys("PK 结束 · " + winner.name + " 获胜！", "pk-end");
        setTimeout(function () {
            if (flash.parentNode) flash.parentNode.removeChild(flash);
        }, 4200);
    }

    function startPkSimulation(pkOpts) {
        stopPkSimulation();
        pkOpts = pkOpts || resolvePkOptions();
        var el = document.getElementById("ldPkTimer");
        if (!el) return;
        var sec = parseInt(el.getAttribute("data-sec"), 10) || pkOpts.pkDurSec || 180;
        var slug = getRoomSlug();
        var hosts = getHostPresets(slug).two;

        pkTimerId = setInterval(function () {
            sec = Math.max(0, sec - 1);
            var m = String(Math.floor(sec / 60)).padStart(2, "0");
            var s = String(sec % 60).padStart(2, "0");
            el.textContent = m + ":" + s;
            el.classList.toggle("is-urgent", sec > 0 && sec <= 30);
            if (sec <= 0) {
                stopPkSimulation();
                showPkResult(hosts[0], hosts[1], pkOpts.pkType);
            }
        }, 1000);

        pkScoreTickId = setInterval(function () {
            if (Math.random() > 0.45) state.pkScoreA += pkOpts.pkType === "like" ? Math.floor(Math.random() * 40 + 8) : Math.floor(Math.random() * 30 + 5);
            else state.pkScoreB += pkOpts.pkType === "like" ? Math.floor(Math.random() * 35 + 6) : Math.floor(Math.random() * 28 + 4);
            updatePkBars(pkOpts.pkType);
        }, 2800);
    }

    function setUrlParams(patch) {
        var p = readParams();
        Object.keys(patch).forEach(function (k) {
            if (patch[k] == null || patch[k] === "") p.delete(k);
            else p.set(k, patch[k]);
        });
        var qs = p.toString();
        var url = location.pathname.split("/").pop() + (qs ? "?" + qs : "");
        history.replaceState(null, "", url);
    }

    function closeModalBackdrop() {
        var bd = document.getElementById("ldCohostModalBd");
        if (bd) bd.parentNode.removeChild(bd);
    }

    function showDirectedPicker(onPick) {
        closeModalBackdrop();
        var room = getHostPresets(getRoomSlug()).two[0];
        var rows = LIVE_PICKER_HOSTS.filter(function (h) {
            return h.slug !== room.slug;
        }).map(function (h) {
            return (
                '<button type="button" class="ld-ab-cohost-pick-row" data-pick-slug="' + esc(h.slug) + '">' +
                '<span class="av" style="background-image:url(\'' + img(h.av, 80) + '\')"></span>' +
                '<span class="meta"><span class="n">' + esc(h.name) + '</span>' +
                '<span class="s">' + esc(h.category) + ' · ' + esc(h.viewers) + ' 在线</span></span>' +
                '<i class="fa-solid fa-chevron-right"></i></button>'
            );
        }).join("");
        var bd = document.createElement("div");
        bd.id = "ldCohostModalBd";
        bd.className = "obs-modal-backdrop";
        bd.innerHTML =
            '<div class="obs-modal ld-ab-cohost-modal">' +
            '<div class="obs-modal-head">' +
            '<h3><i class="fa-solid fa-user-plus" style="color:#c084fc"></i> 指定连麦 · 选择主播</h3>' +
            '<p>从正在直播的主播中搜索并邀请；对方同意后将自动合流分屏。</p>' +
            '<span class="dev-glass-wrap dev-glass-wrap--inline dev-glass-wrap--pop-below" style="margin-top:8px;display:inline-flex">' +
            '<span class="dev-glass-sphere" tabindex="0" aria-describedby="devDirectedTip">' +
            '<span class="dev-glass-sphere-shine"></span>' +
            '<span class="dev-glass-sphere-txt">To 研发</span></span>' +
            '<span class="dev-glass-pop dev-glass-pop--wide" id="devDirectedTip" role="tooltip">' +
            DIRECTED_TIP +
            "</span></span></div>" +
            '<div class="obs-modal-body">' +
            '<input type="search" class="ld-ab-cohost-pick-search" id="ldCohostPickSearch" placeholder="搜索正在直播的主播…" autocomplete="off" />' +
            '<div class="ld-ab-cohost-pick-list" id="ldCohostPickList">' + rows + "</div></div>" +
            '<div class="obs-modal-foot"><button type="button" class="btn btn-secondary" data-modal-close>取消</button></div></div>';
        document.body.appendChild(bd);
        bd.addEventListener("click", function (e) {
            if (e.target === bd || e.target.closest("[data-modal-close]")) closeModalBackdrop();
            var pick = e.target.closest("[data-pick-slug]");
            if (!pick) return;
            closeModalBackdrop();
            if (onPick) onPick(pick.getAttribute("data-pick-slug"));
        });
        var search = document.getElementById("ldCohostPickSearch");
        var list = document.getElementById("ldCohostPickList");
        if (search && list) {
            search.addEventListener("input", function () {
                var q = search.value.trim().toLowerCase();
                list.querySelectorAll(".ld-ab-cohost-pick-row").forEach(function (row) {
                    var text = row.textContent.toLowerCase();
                    row.hidden = q && text.indexOf(q) < 0;
                });
            });
        }
    }

    function showInviteIncomingModal(hostName, onAccept, onReject) {
        closeModalBackdrop();
        var bd = document.createElement("div");
        bd.id = "ldCohostModalBd";
        bd.className = "obs-modal-backdrop";
        bd.innerHTML =
            '<div class="obs-modal ld-ab-cohost-modal">' +
            '<div class="obs-modal-head">' +
            '<h3><i class="fa-solid fa-bell" style="color:#c084fc"></i> 连麦邀请</h3>' +
            '<p><strong>' + esc(hostName) + '</strong> 邀请你加入连麦（当前 1/3 位）</p>' +
            '<span class="dev-glass-wrap dev-glass-wrap--inline dev-glass-wrap--pop-below" style="margin-top:8px;display:inline-flex">' +
            '<span class="dev-glass-sphere" tabindex="0" aria-describedby="devInviteTip">' +
            '<span class="dev-glass-sphere-shine"></span>' +
            '<span class="dev-glass-sphere-txt">To 研发</span></span>' +
            '<span class="dev-glass-pop dev-glass-pop--wide" id="devInviteTip" role="tooltip">' +
            INVITE_TIP +
            "</span></span></div>" +
            '<div class="obs-modal-body"><div class="obs-approve-row">' +
            '<div class="av" style="width:40px;height:40px;border-radius:50%;background:url(\'' +
            img(COHOST_HOSTS.shanye.av, 80) + "') center/cover\"></div>" +
            '<div><b>' + esc(hostName) + '</b><div style="font-size:11px;color:var(--t-tertiary)">美食直播 · 428 在线</div></div></div></div>' +
            '<div class="obs-modal-foot">' +
            '<button type="button" class="btn btn-secondary" data-invite-reject>拒绝</button>' +
            '<button type="button" class="btn btn-primary" data-invite-accept>同意连麦</button></div></div>';
        document.body.appendChild(bd);
        bd.addEventListener("click", function (e) {
            if (e.target.closest("[data-invite-reject]")) {
                closeModalBackdrop();
                if (onReject) onReject();
            } else if (e.target.closest("[data-invite-accept]")) {
                closeModalBackdrop();
                if (onAccept) onAccept();
            }
        });
    }

    function mountDemoBar() {
        /* 方案 B 为观众视角，不展示连麦演示控制条 */
        if (isAbPage()) return;

        var slug = getRoomSlug();
        var p = readParams();
        if (p.get("demo") !== "cohost") return;

        var col = document.querySelector(".ld-ab-video-col") || document.querySelector(".live-grid > div");
        if (!col || document.getElementById("ldCohostDemoBar")) return;

        var bar = document.createElement("div");
        bar.id = "ldCohostDemoBar";
        bar.className = "ld-cohost-demo-bar";
        bar.innerHTML =
            '<div class="ld-cohost-demo-bar__label"><i class="fa-solid fa-flask"></i> 连麦演示 · 观众视角</div>' +
            '<div class="ld-cohost-demo-bar__btns">' +
            '<button type="button" class="btn btn-secondary btn-sm" data-cohost-demo="2">双主播</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-cohost-demo="3">三主播</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-cohost-demo="matching">随机匹配</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-cohost-demo="directed">指定连麦</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-cohost-demo="invite-in">收到邀请</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-cohost-demo="pk-pending">PK 待同意</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-cohost-demo="pk">PK 进行中</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-cohost-demo="pk-like">PK·点赞</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-cohost-demo="exit">退出连麦</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-cohost-demo="aud">观众上麦</button>' +
            "</div>" +
            '<span class="dev-glass-wrap dev-glass-wrap--inline dev-glass-wrap--pop-left">' +
            '<span class="dev-glass-sphere" tabindex="0" aria-describedby="devCohostDemoTip">' +
            '<span class="dev-glass-sphere-shine"></span>' +
            '<span class="dev-glass-sphere-txt">To 研发</span></span>' +
            '<span class="dev-glass-pop dev-glass-pop--wide" id="devCohostDemoTip" role="tooltip">' +
            "<p style='margin:0 0 8px'><strong style='color:#f3e8ff'>观众端连麦演示说明</strong></p>" +
            "<ul style='margin:0;padding-left:1.15em;font-size:11px;line-height:1.55'>" +
            "<li><strong>双主播</strong>：左右分屏 · 最多 3 路同屏</li>" +
            "<li><strong>三主播</strong>：左 1 右 2 上下布局</li>" +
            "<li><strong>PK 待同意</strong>：发起后需所有在麦主播同意才开始</li>" +
            "<li><strong>PK 进行中</strong>：礼物总金额血条 + 倒计时（可切换点赞模式）</li>" +
            "<li><strong>匹配中</strong>：随机匹配中间态 + 算法批注</li>" +
            "<li><strong>观众上麦</strong>：与主播连麦<strong>互斥</strong>；需退出主播连麦后单独演示</li>" +
            "<li><strong>互斥规则</strong>：主播连麦期间不可邀请观众上麦，观众席位与申请按钮隐藏</li>" +
            "<li>主播端控制台见 <code>obs-cohost-pk/</code> 平铺页</li>" +
            "</ul></span></span>";
        col.appendChild(bar);

        bar.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-cohost-demo]");
            if (!btn) return;
            var key = btn.getAttribute("data-cohost-demo");
            if (key === "2") {
                setUrlParams({ cohost: "2", pk: null, audMic: null });
                boot({ cohost: "2" });
            } else if (key === "3") {
                setUrlParams({ cohost: "3", pk: null, audMic: null });
                boot({ cohost: "3" });
            } else if (key === "pk-pending") {
                setUrlParams({ cohost: "2", pk: "pending", pkType: "gift", pkDur: "180", audMic: null });
                boot({ cohost: "2", pkPhase: "pending" });
            } else if (key === "pk") {
                setUrlParams({ cohost: "2", pk: "1", pkType: "gift", pkDur: "180", audMic: null });
                boot({ cohost: "2", pkPhase: "active" });
            } else if (key === "pk-like") {
                setUrlParams({ cohost: "2", pk: "1", pkType: "like", pkDur: "60", audMic: null });
                boot({ cohost: "2", pkPhase: "active", pkOpts: { pkType: "like", pkDurSec: 60, pkDurLabel: "1 分钟" } });
            } else if (key === "matching") {
                setUrlParams({ cohost: "matching", pk: null, audMic: null });
                boot({ cohost: "matching" });
            } else if (key === "directed") {
                showDirectedPicker(function () {
                    appendChatSys("已向目标主播发送连麦邀请，等待对方同意…", "directed-sent");
                    setTimeout(function () {
                        appendChatSys("咖啡店主 已同意连麦邀请", "directed-ok");
                        setUrlParams({ cohost: "2", pk: null, audMic: null });
                        boot({ cohost: "2" });
                    }, 1600);
                });
            } else if (key === "invite-in") {
                var inviter = getHostPresets(slug).two[0].name;
                showInviteIncomingModal(inviter, function () {
                    appendChatSys("你已同意与 " + inviter + " 连麦", "invite-accept");
                    setUrlParams({ cohost: "2", pk: null });
                    boot({ cohost: "2" });
                }, function () {
                    appendChatSys("你已拒绝 " + inviter + " 的连麦邀请", "invite-reject");
                });
            } else if (key === "exit") {
                setUrlParams({ cohost: null, pk: null });
                boot({ cohost: "" });
                appendChatSys("主播已退出连麦，可再次被邀请", "cohost-exit");
            } else if (key === "aud") {
                setUrlParams({ cohost: null, pk: null, audMic: "demo" });
                boot({ cohost: "", audMic: true });
            }
            bar.querySelectorAll("[data-cohost-demo]").forEach(function (b) {
                b.classList.toggle("is-active", b === btn);
            });
        });
    }

    function restoreAbPlayerBg() {
        if (!isAbPage()) return;
        var player = getPlayer();
        if (!player || !global.LiveViewHost || !global.LiveViewHost.getCurrent) return;
        var h = global.LiveViewHost.getCurrent();
        if (h && h.cover) {
            player.style.backgroundImage =
                "url('https://images.unsplash.com/" + h.cover + "?w=1600')";
        }
    }

    function boot(override) {
        override = override || {};
        if (isAbPage() && getRoomSlug() !== "shanye") return;

        var p = readParams();
        var audMicOnly =
            override.audMic === true ||
            (p.get("audMic") === "demo" && !p.get("cohost") && override.cohost !== "2" && override.cohost !== "3" && override.cohost !== "matching");

        if (audMicOnly) {
            applyAudienceOnlyMode();
            var barAud = document.getElementById("ldCohostDemoBar");
            if (barAud) {
                barAud.querySelectorAll("[data-cohost-demo]").forEach(function (b) {
                    b.classList.toggle("is-active", b.getAttribute("data-cohost-demo") === "aud");
                });
            }
            return;
        }

        var mode = override.cohost != null && override.cohost !== "" ? override.cohost : resolveMode();
        var pkPhase = override.pkPhase || resolvePkPhase();
        var pkOpts = override.pkOpts || resolvePkOptions();

        if (!mode) {
            var player = getPlayer();
            if (player) removeInjected(player);
            state.mode = "";
            state.pk = false;
            state.pkPhase = "";
            state.matching = false;
            state.audMic = false;
            setAudienceMicUi(true);
            syncAbCohostPill(false);
            updateAbViewerCohostChrome(0, 3);
            restoreAbPlayerBg();
            return;
        }

        if (mode === "matching") {
            applyCohostLayout("matching");
        } else if (mode === "3") {
            applyCohostLayout("3");
        } else {
            applyCohostLayout(pkPhase ? "2pk" : "2", { pkPhase: pkPhase, pkOpts: pkOpts });
        }

        var bar = document.getElementById("ldCohostDemoBar");
        if (bar) {
            var active = "2";
            if (mode === "matching") active = "matching";
            else if (mode === "3") active = "3";
            else if (pkPhase === "pending") active = "pk-pending";
            else if (pkPhase === "active") active = pkOpts.pkType === "like" ? "pk-like" : "pk";
            bar.querySelectorAll("[data-cohost-demo]").forEach(function (b) {
                b.classList.toggle("is-active", b.getAttribute("data-cohost-demo") === active);
            });
        }
    }

    function init() {
        mountAbCohostViewerUi();
        if (!shouldRunCohostModule()) return;
        mountDemoBar();
        boot();
    }

    global.LiveDetailCohost = {
        boot: boot,
        applyLayout: applyCohostLayout,
        isHostCohostActive: isHostCohostActive,
        isShanyeAbRoom: isShanyeAbRoom,
        shouldRun: shouldRunCohostModule,
        resetAbAudienceView: resetAbAudienceView,
        isPkActive: function () { return state.pkPhase === "active"; },
        getState: function () { return Object.assign({}, state); }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
    global.addEventListener("load", function () {
        setTimeout(init, 0);
    });
})(typeof window !== "undefined" ? window : this);
