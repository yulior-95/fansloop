/**
 * 直播详情 · 方案 B — 轻量交互
 */
(function () {
    function toast(msg) {
        var el = document.getElementById("ldAbToast");
        if (!el) return;
        el.textContent = msg;
        el.classList.add("show");
        clearTimeout(el._t);
        el._t = setTimeout(function () {
            el.classList.remove("show");
        }, 2400);
    }

    function qs(id) {
        return document.getElementById(id);
    }

    function scrollChatToEnd() {
        var body = qs("ldAbChatBody");
        if (body) body.scrollTop = body.scrollHeight;
    }

    function getHost() {
        return window.LiveViewHost && window.LiveViewHost.getCurrent
            ? window.LiveViewHost.getCurrent()
            : { name: "夜雨听弦", title: "深夜爵士 · 即兴钢琴", slug: "yeyu" };
    }

    /** 方案 B · 各主播直播间能力（观众端入口显隐） */
    var AB_LIVE_FEATURES = {
        shanye: { hostCohost: true, audienceMic: false },
        yeyu: { hostCohost: false, audienceMic: true },
        yinyan: { hostCohost: false, audienceMic: false }
    };

    var LIVE_FEATURE_DEV_TIP =
        "<p style='margin:0 0 8px'><strong style='color:#f3e8ff'>连麦 / 上麦入口显隐（To 研发）</strong></p>" +
        "<ul style='margin:0;padding-left:1.15em;font-size:11px;line-height:1.55'>" +
        "<li><strong>主播连麦</strong>：仅当主播已开启并完成主播连麦合流时，观众端展示双屏/三屏分屏与连麦状态</li>" +
        "<li><strong>观众上麦</strong>：仅当主播在控制台开启「观众上麦」后，展示申请上麦按钮与右下角观众席位</li>" +
        "<li><strong>均未开启</strong>：观众端<strong>不展示</strong>任何连麦相关入口（本房间当前状态）</li>" +
        "<li>下发字段示例：<code>live.room.features</code> → <code>{ hostCohost: false, audienceMic: false }</code></li>" +
        "</ul>";

    function getAbLiveFeatures(slug) {
        return AB_LIVE_FEATURES[slug] || { hostCohost: false, audienceMic: false };
    }

    function applyAbLiveFeatures(slug) {
        var f = getAbLiveFeatures(slug);
        document.body.classList.toggle("ld-ab-shanye-room", !!f.hostCohost);
        document.body.classList.toggle("ld-ab-audience-mic-room", !!f.audienceMic);
        document.body.classList.toggle(
            "ld-ab-plain-live-room",
            !f.hostCohost && !f.audienceMic
        );
        var dev = qs("ldAbLiveFeatureDevGlass");
        var tip = qs("devLiveFeatureTip");
        if (tip && !tip.innerHTML) tip.innerHTML = LIVE_FEATURE_DEV_TIP;
        if (dev) {
            if (!f.hostCohost && !f.audienceMic) {
                dev.hidden = false;
                dev.removeAttribute("hidden");
            } else {
                dev.hidden = true;
                dev.setAttribute("hidden", "");
            }
        }
    }

    var DEFAULT_RANK = [
        { rk: 1, av: "photo-1500648767791-00dcc994a43e", name: "Ken", amt: "188 USDT" },
        { rk: 2, av: "photo-1438761681033-6461ffad8d80", name: "Aria", amt: "126 USDT" },
        { rk: 3, av: "photo-1535713875002-d1d0cf377fde", name: "BlockTrader", amt: "50 USDT" }
    ];

    function renderRankAvatars(rankData) {
        var stack = qs("ldAbRankAvatars");
        if (!stack) return;
        var rows = (rankData && rankData.length ? rankData : DEFAULT_RANK).slice(0, 3);
        stack.innerHTML = rows
            .map(function (r) {
                return (
                    '<span class="av" title="' +
                    r.name +
                    '" style="background-image:url(\'https://images.unsplash.com/' +
                    r.av +
                    "?w=80')\"></span>"
                );
            })
            .join("");
    }

    function renderRankList(rankData) {
        var list = qs("ldAbRankList");
        if (!list) return;
        var rows = rankData && rankData.length ? rankData : DEFAULT_RANK;
        list.innerHTML = rows
            .map(function (r) {
                return (
                    '<li><span class="rk">' +
                    r.rk +
                    '</span><span class="av" style="background-image:url(\'https://images.unsplash.com/' +
                    r.av +
                    "?w=80')\"></span><span class=\"nm\">" +
                    r.name +
                    '</span><span class="amt">' +
                    r.amt +
                    "</span></li>"
                );
            })
            .join("");
        renderRankAvatars(rows);
    }

    function initRankPanel() {
        var toggle = qs("ldAbRankToggle");
        var panel = qs("ldAbRankPanel");
        var btnClose = qs("ldAbRankClose");
        if (!toggle || !panel || toggle._bound) return;
        toggle._bound = true;

        function setOpen(open) {
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
            panel.classList.toggle("is-open", open);
            if (open) panel.removeAttribute("hidden");
            else panel.setAttribute("hidden", "");
        }

        toggle.addEventListener("click", function (e) {
            e.stopPropagation();
            setOpen(toggle.getAttribute("aria-expanded") !== "true");
        });
        if (btnClose) {
            btnClose.addEventListener("click", function (e) {
                e.stopPropagation();
                setOpen(false);
            });
        }
        panel.addEventListener("click", function (e) {
            e.stopPropagation();
        });
        document.addEventListener("click", function () {
            if (panel.classList.contains("is-open")) setOpen(false);
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && panel.classList.contains("is-open")) setOpen(false);
        });
    }

    function applyHostUI() {
        if (!window.LiveViewHost || !window.LiveViewHost.getCurrent) return;
        var h = window.LiveViewHost.getCurrent();
        var player = qs("ldAbPlayer");
        var hostAv = qs("ldAbHostAv");
        var hostNm = qs("ldAbHostNm");
        var hostTag = qs("ldAbHostTag");
        var streamTitle = qs("ldAbStreamTitle");
        var chromeHost = qs("ldAbChromeHost");
        var chromeSub = qs("ldAbChromeSub");
        var introBody = qs("ldAbIntroBody");
        var introTags = qs("ldAbIntroTags");
        var tipsTotal = qs("ldAbTipsTotal");
        var btnCheer = qs("ldAbBtnCheer");

        if (player && h.cover) {
            var cohostOn =
                window.LiveDetailCohost &&
                window.LiveDetailCohost.isHostCohostActive &&
                window.LiveDetailCohost.isHostCohostActive();
            if (!cohostOn) {
                player.style.backgroundImage =
                    "url('https://images.unsplash.com/" + h.cover + "?w=1600')";
            }
        }
        if (hostAv && h.av) {
            hostAv.style.backgroundImage =
                "url('https://images.unsplash.com/" + h.av + "?w=200')";
        }
        if (hostNm) hostNm.textContent = h.name || "";
        if (hostTag) hostTag.textContent = (h.roleLabel || "直播中") + " · LV " + (h.level || "—");
        if (streamTitle) streamTitle.textContent = h.title || "";
        if (chromeHost) chromeHost.textContent = h.name || "";
        if (chromeSub) chromeSub.textContent = h.shortTitle || h.tag || "";
        if (introBody) introBody.textContent = h.desc || "";
        if (introTags && h.tags && h.tags.length) {
            introTags.innerHTML = h.tags
                .map(function (t) {
                    return '<span class="chip"># ' + t + "</span>";
                })
                .join("");
        }
        if (tipsTotal && h.tipsTotal) {
            tipsTotal.textContent = "总打赏 " + h.tipsTotal + " USDT";
        }
        if (btnCheer) {
            var cheerLbl = btnCheer.querySelector(".lbl");
            if (cheerLbl && h.cheers) cheerLbl.textContent = h.cheers;
        }
        if (h.tipRank && h.tipRank.length) {
            renderRankList(h.tipRank);
        } else {
            renderRankList(DEFAULT_RANK);
        }

        document.title = "正在直播 · " + (h.name || "GOODFANS");
    }

    function bootHost() {
        if (window.LiveViewHost && window.LiveViewHost.applyFromUrl) {
            window.LiveViewHost.applyFromUrl();
        }
        applyHostUI();
        var slug = getHost().slug || "";
        applyAbLiveFeatures(slug);
        if (
            window.LiveDetailCohost &&
            window.LiveDetailCohost.shouldRun &&
            window.LiveDetailCohost.shouldRun() &&
            window.LiveDetailCohost.boot
        ) {
            window.LiveDetailCohost.boot();
        } else if (window.LiveDetailCohost && window.LiveDetailCohost.resetAbAudienceView) {
            window.LiveDetailCohost.resetAbAudienceView();
        }
        if (typeof window.FL_syncAbAudienceMicPill === "function") {
            window.FL_syncAbAudienceMicPill();
        }
    }

    bootHost();
    initRankPanel();
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootHost);
    }
    window.addEventListener("load", bootHost);

    /* 返回 */
    var btnBack = qs("ldAbBack");
    if (btnBack) {
        btnBack.addEventListener("click", function () {
            var p = new URLSearchParams(location.search);
            var nav = p.get("nav");
            if (nav === "home") location.href = "home.html";
            else if (history.length > 1) history.back();
            else location.href = "home.html";
        });
    }

    /* 更多菜单 */
    var btnMore = qs("ldAbMoreBtn");
    var moreMenu = qs("ldAbMoreMenu");
    if (btnMore && moreMenu) {
        btnMore.addEventListener("click", function (e) {
            e.stopPropagation();
            moreMenu.classList.toggle("open");
        });
        document.addEventListener("click", function () {
            moreMenu.classList.remove("open");
        });
        moreMenu.querySelectorAll("button").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var act = btn.getAttribute("data-action");
                moreMenu.classList.remove("open");
                if (act === "report") openLiveAbReport();
            });
        });
    }

    function openLiveAbReport() {
        var R = window.FL_ContentReport;
        if (!R) {
            toast("举报功能暂不可用");
            return;
        }
        var params = new URLSearchParams(location.search);
        var host = params.get("host") || "live";
        R.open({
            type: "live",
            contentId: "live-ab-" + host,
            toast: toast,
            onDone: function () {
                setTimeout(function () {
                    if (history.length > 1) history.back();
                    else location.href = "home-ab-feed.html";
                }, 400);
            }
        });
    }

    var btnAbReport = document.getElementById("ldAbBtnReport");
    if (btnAbReport) {
        btnAbReport.addEventListener("click", openLiveAbReport);
    }
    var btnAbBookmark = document.getElementById("ldAbBtnBookmark");
    if (btnAbBookmark) {
        btnAbBookmark.addEventListener("click", function () {
            var on = btnAbBookmark.classList.toggle("is-saved");
            var ic = btnAbBookmark.querySelector("i");
            if (ic) ic.className = on ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark";
            toast(on ? "收藏成功" : "已取消收藏");
        });
    }

    /* 聊天 Tabs */
    var chatBody = qs("ldAbChatBody");
    document.querySelectorAll(".ld-ab-ct").forEach(function (tab) {
        tab.addEventListener("click", function () {
            var key = tab.getAttribute("data-chat-tab");
            document.querySelectorAll(".ld-ab-ct").forEach(function (t) {
                t.classList.remove("active");
            });
            tab.classList.add("active");
            if (chatBody) chatBody.setAttribute("data-tab", key);
        });
    });

    /* 关注（主播 chip 内） */
    var followed = false;
    function toggleFollow(e) {
        if (e) e.stopPropagation();
        followed = !followed;
        var btn = qs("ldAbBtnFollow");
        if (btn) {
            btn.classList.toggle("is-active", followed);
            var lbl = btn.querySelector(".lbl");
            if (lbl) lbl.textContent = followed ? "已关注" : "关注";
            var icon = btn.querySelector("i");
            if (icon) {
                icon.className = followed ? "fa-solid fa-bell" : "fa-regular fa-bell";
            }
        }
        toast(followed ? "已关注 " + getHost().name + "，开播将通知你" : "已取消关注");
    }
    var btnFollow = qs("ldAbBtnFollow");
    if (btnFollow) btnFollow.addEventListener("click", toggleFollow);

    /* 喝彩 · 上浮点赞 */
    var cheerCount = 2800;
    var btnCheer = qs("ldAbBtnCheer");
    var likeLayer = qs("ldAbLikeBurst");

    function formatCheer(n) {
        return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
    }

    function spawnLikeBurst(fromEl) {
        if (!likeLayer || !fromEl) return;
        var rect = fromEl.getBoundingClientRect();
        var icons = ["fa-heart", "fa-thumbs-up", "fa-star"];
        var colors = ["", "alt", "gold"];
        for (var i = 0; i < 8; i++) {
            var h = document.createElement("span");
            h.className = "ld-ab-like-float " + (colors[i % 3] || "");
            var dx = (Math.random() - 0.5) * 48;
            var dx2 = dx + (Math.random() - 0.5) * 24;
            h.style.setProperty("--dx", dx + "px");
            h.style.setProperty("--dx2", dx2 + "px");
            h.style.left = rect.left + rect.width / 2 - 12 + (Math.random() - 0.5) * 20 + "px";
            h.style.top = rect.top + rect.height / 2 - 12 + "px";
            h.innerHTML = '<i class="fa-solid ' + icons[i % icons.length] + '"></i>';
            likeLayer.appendChild(h);
            (function (node) {
                setTimeout(function () {
                    if (node.parentNode) node.parentNode.removeChild(node);
                }, 1100);
            })(h);
        }
    }

    if (btnCheer) {
        btnCheer.addEventListener("click", function () {
            btnCheer.classList.add("is-active");
            setTimeout(function () {
                btnCheer.classList.remove("is-active");
            }, 400);
            cheerCount += 1;
            var lbl = btnCheer.querySelector(".lbl");
            if (lbl) lbl.textContent = formatCheer(cheerCount);
            spawnLikeBurst(btnCheer);
        });
    }

    /* 送礼 */
    function buildGiftUrl() {
        var h = getHost();
        var opts = {
            ctx: "live",
            creator: h.name || "",
            avatar: h.av ? "https://images.unsplash.com/" + h.av + "?w=120" : "",
            tags: h.roleLabel || h.category || "",
            lv: h.level ? String(h.level) : ""
        };
        if (window.FL_buildGiftModalUrl) return window.FL_buildGiftModalUrl(opts);
        var p = new URLSearchParams();
        p.set("ctx", "live");
        if (opts.creator) p.set("creator", opts.creator);
        if (opts.avatar) p.set("avatar", opts.avatar);
        if (opts.tags) p.set("tags", opts.tags);
        if (opts.lv) p.set("lv", opts.lv);
        return "gift-modal.html?" + p.toString();
    }

    function appendGiftChat(user, text) {
        if (!chatBody) return;
        var row = document.createElement("div");
        row.className = "ld-ab-msg is-gift";
        row.setAttribute("data-filter", "gift");
        row.innerHTML =
            '<div class="av" style="background-image:url(\'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80\')"></div>' +
            '<div class="body"><span class="nm gift">' +
            user +
            '</span><span class="text"></span></div>';
        row.querySelector(".text").textContent = text;
        chatBody.appendChild(row);
        applyChatTranslate();
        scrollChatToEnd();
    }

    function handleGiftSent(modal) {
        if (!modal) return;
        var sel = modal.querySelector(".gift-item.selected") || modal.querySelector(".gift-item");
        var emoji = sel && sel.querySelector(".emoji") ? sel.querySelector(".emoji").textContent : "🎁";
        var name = sel && sel.querySelector(".nm") ? sel.querySelector(".nm").textContent : "礼物";
        var price = sel && sel.querySelector(".pr") ? sel.querySelector(".pr").textContent : "";
        var qtyEl = modal.querySelector(".qty-stepper input");
        var qty = qtyEl ? parseInt(qtyEl.value, 10) || 1 : 1;
        var label = emoji + " " + name + (qty > 1 ? " ×" + qty : "");
        setTimeout(function () {
            if (window.FL_closeStandaloneModal) window.FL_closeStandaloneModal();
            toast("已送出 " + name + " · " + price);
            spawnGiftFly("你", label);
            appendGiftChat("你", "送出 " + label + " · " + price);
        }, 280);
    }

    document.addEventListener("click", function (e) {
        var sendBtn = e.target.closest("#flStandaloneModalRoot .send-btn");
        if (!sendBtn) return;
        var modal = sendBtn.closest(".gift-modal");
        if (modal) {
            e.preventDefault();
            e.stopPropagation();
            handleGiftSent(modal);
        }
    });

    var btnGift = qs("ldAbBtnGift");
    if (btnGift) {
        btnGift.addEventListener("click", function () {
            var url = buildGiftUrl();
            if (window.FL_openInteractionModal) {
                window.FL_openInteractionModal(url);
                return;
            }
            toast("打开礼物面板（原型）");
        });
    }

    function spawnGiftFly(user, text) {
        var layer = qs("ldAbGiftFly");
        var player = qs("ldAbPlayer");
        if (!layer || dmHidden || (player && player.classList.contains("gift-fx-muted"))) return;
        if (player && player.classList.contains("is-pip-active")) return;
        var el = document.createElement("div");
        el.className = "fly";
        el.textContent = user + " 送出 " + text;
        if (dmAreaMode === "top") el.style.top = 8 + Math.random() * 22 + "%";
        else if (dmAreaMode === "bottom") el.style.top = 66 + Math.random() * 22 + "%";
        else el.style.top = 10 + Math.random() * 68 + "%";
        el.style.fontSize = dmFontSize + "px";
        el.style.opacity = String(dmOpacity);
        layer.appendChild(el);
        el.addEventListener("animationend", function () {
            el.remove();
        });
        while (layer.children.length > 18) layer.removeChild(layer.firstChild);
    }

    var giftFlyPool = [
        ["Ken", "🎉 荧光棒 ×10"],
        ["Aria", "💎 钻石礼物"],
        ["WhaleX", "🚀 火箭 ×1"],
        ["BlockTrader", "打赏 50 USDT"]
    ];
    var giftFlyTimer = null;

    function startGiftFlyTimer() {
        if (giftFlyTimer || dmHidden) return;
        giftFlyTimer = setInterval(function () {
            var d = giftFlyPool[Math.floor(Math.random() * giftFlyPool.length)];
            spawnGiftFly(d[0], d[1]);
        }, 3600);
    }

    function stopGiftFlyTimer() {
        if (!giftFlyTimer) return;
        clearInterval(giftFlyTimer);
        giftFlyTimer = null;
    }

    startGiftFlyTimer();
    spawnGiftFly("Ken", "🎉 荧光棒 ×10");

    /* 申请上麦 · 仅 audienceMic 开启的主播房间 */
    (function initMic() {
        var hostSlug = getHost().slug || "";
        if (!getAbLiveFeatures(hostSlug).audienceMic) return;

        var btnMic = qs("ldAbBtnMic");
        if (!btnMic) return;

        var slots = qs("ldAbAudienceSlots");
        var micBar = qs("ldAbMicBar");
        var rejectBanner = qs("ldAbMicReject");
        var leaveOvl = qs("ldAbMicLeaveOvl");
        var cohostPill = document.querySelector(".ld-ab-cohost-pill");
        var fanAv = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80";
        var state = "idle";
        var pendingTimer = null;

        function micOutcome() {
            try {
                return new URLSearchParams(location.search).get("micOutcome") || "approve";
            } catch (e) {
                return "approve";
            }
        }

        function emptySlotHtml() {
            return (
                '<div class="av-wrap"><div class="av"><i class="fa-solid fa-plus"></i></div></div>' +
                '<span class="nm">空席</span>'
            );
        }

        function syncMicPill() {
            if (window.LiveDetailCohost && window.LiveDetailCohost.isHostCohostActive()) return;
            if (!cohostPill || !slots) return;
            var h = getHost();
            var features = getAbLiveFeatures(h.slug || "");
            if (!features.audienceMic || (h && h.slug === "shanye")) {
                cohostPill.hidden = true;
                cohostPill.setAttribute("hidden", "");
                return;
            }
            var total = slots.querySelectorAll(".obs-audience-slot").length;
            var filled = slots.querySelectorAll(".obs-audience-slot:not(.empty)").length;
            cohostPill.hidden = false;
            cohostPill.removeAttribute("hidden");
            cohostPill.innerHTML =
                '<i class="fa-solid fa-microphone-lines"></i> 观众席 · ' + filled + "/" + total;
        }

        window.FL_syncAbAudienceMicPill = syncMicPill;

        function appendSystemChat(text) {
            if (!chatBody) return;
            var row = document.createElement("div");
            row.className = "ld-ab-sys";
            row.innerHTML = '<i class="fa-solid fa-circle-info" style="margin-right:4px"></i> ' + text;
            chatBody.appendChild(row);
            scrollChatToEnd();
        }

        function resetMuteBtn() {
            var btnMute = qs("ldAbMicMute");
            if (!btnMute) return;
            btnMute.classList.remove("is-muted");
            btnMute.textContent = "静音";
        }

        function hideMicBar() {
            if (!micBar) return;
            micBar.hidden = true;
            micBar.setAttribute("hidden", "");
        }

        function showMicBar() {
            if (!micBar) return;
            micBar.hidden = false;
            micBar.removeAttribute("hidden");
        }

        function showLeaveOvl() {
            if (!leaveOvl) return;
            leaveOvl.hidden = false;
            leaveOvl.removeAttribute("hidden");
        }

        function hideLeaveOvl() {
            if (!leaveOvl) return;
            leaveOvl.hidden = true;
            leaveOvl.setAttribute("hidden", "");
        }

        function renderMicBtn() {
            if (state === "idle") {
                btnMic.className = "ld-ab-quick";
                btnMic.innerHTML = '<i class="fa-solid fa-microphone"></i><span class="lbl">上麦</span>';
            } else if (state === "pending") {
                btnMic.className = "ld-ab-quick is-pending";
                btnMic.innerHTML = '<i class="fa-solid fa-hourglass-half"></i><span class="lbl">等待</span>';
            } else {
                btnMic.className = "ld-ab-quick is-on-mic";
                btnMic.innerHTML = '<i class="fa-solid fa-microphone-lines"></i><span class="lbl">连麦中</span>';
            }
        }

        function showReject() {
            toast("主播拒绝您的申请");
            if (!rejectBanner) return;
            rejectBanner.hidden = false;
            rejectBanner.removeAttribute("hidden");
            clearTimeout(rejectBanner._hideT);
            rejectBanner._hideT = setTimeout(function () {
                rejectBanner.hidden = true;
                rejectBanner.setAttribute("hidden", "");
            }, 4200);
        }

        function firstEmptySlot() {
            if (!slots) return null;
            return slots.querySelector(".obs-audience-slot.empty");
        }

        function leaveMicOn() {
            clearTimeout(pendingTimer);
            state = "idle";
            hideMicBar();
            hideLeaveOvl();
            resetMuteBtn();
            if (slots) {
                slots.querySelectorAll(".obs-audience-slot").forEach(function (slot) {
                    var nm = slot.querySelector(".nm");
                    if (nm && nm.textContent.trim() === "你") {
                        slot.className = "obs-audience-slot empty";
                        slot.innerHTML = emptySlotHtml();
                    }
                });
            }
            syncMicPill();
            renderMicBtn();
            toast("已下麦");
        }

        function enterMicOn() {
            var slot = firstEmptySlot();
            if (!slot) {
                toast("观众席位已满");
                state = "idle";
                renderMicBtn();
                return;
            }
            state = "on";
            showMicBar();
            slot.className = "obs-audience-slot is-speaking";
            slot.innerHTML =
                '<div class="av-wrap"><div class="av" style="background-image:url(\'' + fanAv + '\')"></div></div>' +
                '<span class="nm">你</span>';
            syncMicPill();
            appendSystemChat("你已成功上麦，麦克风已开启");
            renderMicBtn();
            toast("主播已同意 · 连麦中");
        }

        btnMic.addEventListener("click", function () {
            if (window.LiveDetailCohost && window.LiveDetailCohost.isHostCohostActive()) {
                toast("主播连麦进行中，暂不可申请观众上麦");
                return;
            }
            if (state === "pending" || state === "on") return;
            state = "pending";
            renderMicBtn();
            toast("已发送上麦申请，等待主播同意");
            clearTimeout(pendingTimer);
            pendingTimer = setTimeout(function () {
                if (micOutcome() === "reject") {
                    state = "idle";
                    renderMicBtn();
                    showReject();
                } else {
                    enterMicOn();
                }
            }, 2800);
        });

        var btnLeave = qs("ldAbMicLeave");
        if (btnLeave) {
            btnLeave.addEventListener("click", function (e) {
                e.stopPropagation();
                showLeaveOvl();
            });
        }

        var btnLeaveCancel = qs("ldAbMicLeaveCancel");
        if (btnLeaveCancel) {
            btnLeaveCancel.addEventListener("click", hideLeaveOvl);
        }

        if (leaveOvl) {
            leaveOvl.addEventListener("click", function (e) {
                if (e.target === leaveOvl) hideLeaveOvl();
            });
        }

        var btnLeaveConfirm = qs("ldAbMicLeaveConfirm");
        if (btnLeaveConfirm) {
            btnLeaveConfirm.addEventListener("click", leaveMicOn);
        }

        var btnMute = qs("ldAbMicMute");
        if (btnMute) {
            btnMute.addEventListener("click", function () {
                var muted = btnMute.classList.toggle("is-muted");
                btnMute.textContent = muted ? "取消静音" : "静音";
                if (slots && state === "on") {
                    slots.querySelectorAll(".obs-audience-slot").forEach(function (slot) {
                        var nm = slot.querySelector(".nm");
                        if (nm && nm.textContent.trim() === "你") {
                            slot.classList.toggle("is-speaking", !muted);
                        }
                    });
                }
                toast(muted ? "麦克风已静音" : "麦克风已开启");
            });
        }

        function forceResetMic() {
            clearTimeout(pendingTimer);
            state = "idle";
            hideMicBar();
            hideLeaveOvl();
            resetMuteBtn();
            if (slots) {
                slots.querySelectorAll(".obs-audience-slot").forEach(function (slot) {
                    var nm = slot.querySelector(".nm");
                    if (nm && nm.textContent.trim() === "你") {
                        slot.className = "obs-audience-slot empty";
                        slot.innerHTML = emptySlotHtml();
                    }
                });
            }
            syncMicPill();
            renderMicBtn();
        }

        syncMicPill();
        window.FL_resetAudienceMic = forceResetMic;
        window.addEventListener("fl-host-cohost-change", function (e) {
            if (e.detail && e.detail.active) forceResetMic();
        });
    })();

    /* 分享 */
    function openShare() {
        if (window.FL_openInteractionModal) {
            window.FL_openInteractionModal("share-modal.html");
            return;
        }
        toast("直播链接已复制（原型）");
    }
    var btnShare = qs("ldAbBtnShare");
    if (btnShare) btnShare.addEventListener("click", openShare);

    /* 主播 chip — 点击头像/信息跳转主页，关注按钮独立 */
    var hostChip = qs("ldAbHostChip");
    if (hostChip) {
        hostChip.addEventListener("click", function (e) {
            if (e.target.closest("#ldAbBtnFollow")) return;
            var h = getHost();
            if (h.slug) location.href = "creator-profile.html";
        });
    }

    /* 播放器控件 */
    var player = qs("ldAbPlayer");
    var giftFlyLayer = qs("ldAbGiftFly");
    var btnVol = qs("ldAbBtnVol");
    var btnGear = qs("ldAbBtnGear");
    var gearPop = qs("ldAbSettingsPop");
    var btnExpand = qs("ldAbBtnExpand");
    var btnPip = qs("ldAbBtnPip");
    var btnTranslate = qs("ldAbBtnTranslate");
    var pipWin = qs("ldAbPipWin");
    var dmAreaMode = "scroll";
    var dmFontSize = 14;
    var dmOpacity = 0.75;
    var dmHidden = false;

    if (btnVol && player) {
        btnVol.addEventListener("click", function () {
            var muted = player.classList.toggle("is-muted");
            btnVol.innerHTML = muted
                ? '<i class="fa-solid fa-volume-xmark"></i>'
                : '<i class="fa-solid fa-volume-high"></i>';
            toast(muted ? "已静音" : "已恢复音量");
        });
    }

    if (btnGear && gearPop) {
        var btnSettingsClose = qs("ldAbSettingsClose");
        var dmAreaGroup = qs("ldAbDmAreaGroup");
        var dmFontRange = qs("ldAbDmFontRange");
        var dmFontVal = qs("ldAbDmFontVal");
        var dmOpacityRange = qs("ldAbDmOpacityRange");
        var dmOpacityVal = qs("ldAbDmOpacityVal");
        var dmSafeArea = qs("ldAbDmSafeArea");
        var dmHide = qs("ldAbDmHide");
        var giftFxMute = qs("ldAbGiftFxMute");

        function closeSettings() {
            gearPop.classList.remove("open");
            if (btnGear) btnGear.classList.remove("is-active");
        }

        function updateRangeTrack(input) {
            if (!input) return;
            var min = Number(input.min || 0);
            var max = Number(input.max || 100);
            var value = Number(input.value || min);
            var ratio = ((value - min) / Math.max(1, max - min)) * 100;
            input.style.background =
                "linear-gradient(90deg,#FBBF24 " + ratio + "%, rgba(255,255,255,0.2) " + ratio + "%)";
        }

        btnGear.addEventListener("click", function (e) {
            e.stopPropagation();
            var opening = !gearPop.classList.contains("open");
            gearPop.classList.toggle("open", opening);
            btnGear.classList.toggle("is-active", opening);
        });
        document.addEventListener("click", closeSettings);
        gearPop.addEventListener("click", function (e) {
            e.stopPropagation();
        });
        if (btnSettingsClose) btnSettingsClose.addEventListener("click", closeSettings);

        if (dmAreaGroup) {
            dmAreaGroup.addEventListener("click", function (e) {
                var btn = e.target.closest("button[data-dm-area]");
                if (!btn) return;
                dmAreaGroup.querySelectorAll("button").forEach(function (n) {
                    n.classList.remove("is-active");
                });
                btn.classList.add("is-active");
                dmAreaMode = btn.getAttribute("data-dm-area") || "scroll";
            });
        }
        if (dmFontRange) {
            var syncFont = function () {
                dmFontSize = Number(dmFontRange.value) || 14;
                if (dmFontVal) dmFontVal.textContent = String(dmFontSize);
                if (giftFlyLayer) {
                    giftFlyLayer.querySelectorAll(".fly").forEach(function (item) {
                        item.style.fontSize = dmFontSize + "px";
                    });
                }
                updateRangeTrack(dmFontRange);
            };
            dmFontRange.addEventListener("input", syncFont);
            syncFont();
        }
        if (dmOpacityRange) {
            var syncOpacity = function () {
                dmOpacity = Math.max(0.2, Number(dmOpacityRange.value) / 100);
                if (dmOpacityVal) dmOpacityVal.textContent = dmOpacityRange.value + "%";
                if (giftFlyLayer) {
                    giftFlyLayer.querySelectorAll(".fly").forEach(function (item) {
                        item.style.opacity = String(dmOpacity);
                    });
                }
                updateRangeTrack(dmOpacityRange);
            };
            dmOpacityRange.addEventListener("input", syncOpacity);
            syncOpacity();
        }
        if (dmSafeArea && player) {
            var syncSafe = function () {
                player.classList.toggle("dm-safe-area", !!dmSafeArea.checked);
            };
            dmSafeArea.addEventListener("change", syncSafe);
            syncSafe();
        }
        if (dmHide && giftFlyLayer) {
            var syncDmHide = function () {
                dmHidden = !!dmHide.checked;
                giftFlyLayer.classList.toggle("is-hidden", dmHidden);
                if (dmHidden) {
                    giftFlyLayer.innerHTML = "";
                    stopGiftFlyTimer();
                } else if (!player || !player.classList.contains("is-pip-active")) {
                    startGiftFlyTimer();
                }
            };
            dmHide.addEventListener("change", function () {
                syncDmHide();
                toast(dmHide.checked ? "已隐藏弹幕" : "已显示弹幕");
            });
        }
        if (giftFxMute && player) {
            var syncFx = function () {
                player.classList.toggle("gift-fx-muted", !!giftFxMute.checked);
            };
            giftFxMute.addEventListener("change", syncFx);
            syncFx();
        }
    }

    if (btnExpand && player) {
        btnExpand.addEventListener("click", function () {
            if (player.classList.contains("is-fullscreen")) {
                player.classList.remove("is-fullscreen");
                if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
                toast("已退出全屏");
            } else {
                player.classList.add("is-fullscreen");
                if (player.requestFullscreen) player.requestFullscreen().catch(function () {});
                toast("已进入全屏 · 按 Esc 或再次点击可退出");
            }
        });
        document.addEventListener("fullscreenchange", function () {
            if (!document.fullscreenElement) player.classList.remove("is-fullscreen");
        });
    }

    if (window.FLLivePipPlaceholder) {
        window.FLLivePipPlaceholder.bind({
            player: player,
            pipBtn: btnPip,
            localPipWin: pipWin,
            pipClose: qs("ldAbPipClose"),
            pipRestore: qs("ldAbPipRestore"),
            toast: toast,
            getPayload: function () {
                var h = getHost();
                return {
                    role: "viewer",
                    back: "live-detail-ab.html" + location.search,
                    title: (h.name || "直播中") + " · " + (h.shortTitle || h.title || ""),
                    active: true,
                    cover: h.cover
                        ? "https://images.unsplash.com/" + h.cover + "?w=1200"
                        : player && player.style.backgroundImage
                };
            },
            onLocalOpen: function (win) {
                var h = getHost();
                var pipTitle = qs("ldAbPipTitle");
                var pipBody = win.querySelector(".pip-body");
                if (pipTitle) {
                    pipTitle.innerHTML =
                        '<i class="fa-solid fa-circle" style="color:#EF4444;font-size:8px"></i> ' +
                        (h.name || "直播中");
                }
                if (pipBody && player) pipBody.style.backgroundImage = player.style.backgroundImage;
            },
            onChange: function (active) {
                if (active) {
                    stopGiftFlyTimer();
                    var layer = qs("ldAbGiftFly");
                    if (layer) layer.innerHTML = "";
                } else if (!dmHidden) {
                    startGiftFlyTimer();
                }
            }
        });
    }

    /* 跨国界无障碍 · 弹幕翻译 + 字幕 */
    var gaStore = window.FL_accessibilityStore;
    var SUBTITLE = {
        main: "下一首来一首《Autumn Leaves》，即兴版本。",
        orig: "Next up, Autumn Leaves — improvised version."
    };

    function escHtml(s) {
        var d = document.createElement("div");
        d.textContent = s;
        return d.innerHTML;
    }

    function applyChatTranslate() {
        if (!chatBody || !gaStore) return;
        var c = gaStore.load();
        var dual = c.displayMode !== "translated-only";
        chatBody.querySelectorAll(".ld-ab-msg .text").forEach(function (textEl) {
            if (!textEl.dataset.gaOrig) textEl.dataset.gaOrig = textEl.innerHTML;
            var plain = textEl.textContent.trim();
            if (!c.liveTranslateChat) {
                textEl.innerHTML = textEl.dataset.gaOrig;
                return;
            }
            var tr = gaStore.mockTranslate(plain, c.commLang, "auto");
            if (tr.text === plain) {
                textEl.innerHTML = textEl.dataset.gaOrig;
                return;
            }
            var html = escHtml(tr.text) + ' <span class="ld-ab-ga-tag">译</span>';
            if (dual) html += '<span class="ld-ab-ga-orig">' + escHtml(plain) + "</span>";
            textEl.innerHTML = html;
        });
    }

    function applySubtitle() {
        var box = qs("ldAbLiveSubtitle");
        if (!box || !gaStore) return;
        var c = gaStore.load();
        if (!c.liveSubtitle) {
            box.hidden = true;
            return;
        }
        box.hidden = false;
        var tr = gaStore.mockTranslate(SUBTITLE.orig, c.commLang, "en");
        var main = qs("ldAbSubMain");
        var orig = qs("ldAbSubOrig");
        if (main) main.textContent = tr.text;
        if (orig) {
            orig.textContent = c.displayMode === "dual" ? SUBTITLE.orig : "";
            orig.style.display = c.displayMode === "dual" ? "block" : "none";
        }
    }

    function syncGaPanel() {
        if (!gaStore) return;
        var c = gaStore.load();
        var chatT = qs("ldAbGaChatTranslate");
        var subT = qs("ldAbGaLiveSubtitle");
        var langSel = qs("ldAbGaCommLang");
        if (chatT) chatT.checked = !!c.liveTranslateChat;
        if (subT) subT.checked = !!c.liveSubtitle;
        if (btnTranslate) btnTranslate.classList.toggle("is-on", !!c.liveTranslateChat);
        if (langSel && !langSel.options.length) {
            langSel.innerHTML = gaStore.LANGS.map(function (L) {
                return '<option value="' + L.code + '">' + L.label + "</option>";
            }).join("");
            langSel.value = c.commLang;
        }
    }

    if (gaStore) {
        var gaChatT = qs("ldAbGaChatTranslate");
        var gaSubT = qs("ldAbGaLiveSubtitle");
        var gaLang = qs("ldAbGaCommLang");
        if (gaChatT) {
            gaChatT.addEventListener("change", function () {
                gaStore.save({ liveTranslateChat: this.checked });
                applyChatTranslate();
                syncGaPanel();
                toast(this.checked ? "已开启弹幕翻译" : "已关闭弹幕翻译");
            });
        }
        if (gaSubT) {
            gaSubT.addEventListener("change", function () {
                gaStore.save({ liveSubtitle: this.checked });
                applySubtitle();
                syncGaPanel();
                toast(this.checked ? "已开启实时字幕" : "已关闭实时字幕");
            });
        }
        if (gaLang) {
            gaLang.addEventListener("change", function () {
                gaStore.save({ commLang: this.value });
                applyChatTranslate();
                applySubtitle();
                toast("观看语言：" + gaStore.langLabel(this.value));
            });
        }
        if (btnTranslate) {
            btnTranslate.addEventListener("click", function (e) {
                e.stopPropagation();
                var c = gaStore.load();
                gaStore.save({ liveTranslateChat: !c.liveTranslateChat });
                applyChatTranslate();
                syncGaPanel();
                toast(!c.liveTranslateChat ? "已开启弹幕翻译" : "已关闭弹幕翻译");
            });
        }
        syncGaPanel();
        applyChatTranslate();
        applySubtitle();
        window.addEventListener("fl-accessibility-change", function () {
            syncGaPanel();
            applyChatTranslate();
            applySubtitle();
        });
    }

    /* 聊天发送 */
    var chatInput = qs("ldAbChatInput");
    var btnSend = qs("ldAbBtnSend");

    function appendChat(text) {
        if (!chatBody) return;
        var row = document.createElement("div");
        row.className = "ld-ab-msg";
        row.innerHTML =
            '<div class="av" style="background-image:url(\'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80\')"></div>' +
            '<div class="body"><span class="nm">Luna 🌙</span><span class="text"></span></div>';
        row.querySelector(".text").textContent = text;
        chatBody.appendChild(row);
        applyChatTranslate();
        scrollChatToEnd();
    }

    function sendChat() {
        if (!chatInput) return;
        var v = chatInput.value.trim();
        if (!v) return;
        appendChat(v);
        chatInput.value = "";
    }

    if (btnSend) btnSend.addEventListener("click", sendChat);
    if (chatInput) {
        chatInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChat();
            }
        });
    }

    /* 表情 */
    var emojis = ["😀", "😂", "🔥", "❤️", "👏", "🎉", "💯", "✨", "💜", "🙏", "😎", "🎁", "🚀", "👍"];
    var emojiPop = qs("ldAbEmojiPop");
    var btnEmoji = qs("ldAbBtnEmoji");
    if (emojiPop) {
        emojiPop.innerHTML = emojis
            .map(function (e) {
                return '<button type="button">' + e + "</button>";
            })
            .join("");
    }
    if (btnEmoji && emojiPop) {
        btnEmoji.addEventListener("click", function (e) {
            e.stopPropagation();
            var open = emojiPop.classList.toggle("open");
            btnEmoji.classList.toggle("is-active", open);
        });
        emojiPop.addEventListener("click", function (e) {
            e.stopPropagation();
        });
        emojiPop.querySelectorAll("button").forEach(function (b) {
            b.addEventListener("click", function () {
                if (chatInput) {
                    chatInput.value += b.textContent;
                    chatInput.focus();
                }
                emojiPop.classList.remove("open");
                btnEmoji.classList.remove("is-active");
            });
        });
        document.addEventListener("click", function () {
            emojiPop.classList.remove("open");
            btnEmoji.classList.remove("is-active");
        });
    }

    scrollChatToEnd();

    /* 方案 A 链接保留 URL 参数 */
    var pillA = qs("ldAbVariantPill");
    if (pillA) {
        pillA.addEventListener("click", function (e) {
            var qs0 = location.search;
            if (qs0) pillA.href = "live-detail.html" + qs0;
        });
    }
})();
