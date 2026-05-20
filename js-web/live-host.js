/**
 * 主播端 · 礼物/弹幕动态流 + 发言管理（原型）
 */
(function () {
    var giftScroll = document.getElementById("giftFeedScroll");
    var giftInner = document.getElementById("giftFeedInner");
    var giftHint = document.getElementById("giftFeedHint");
    var chatScroll = document.getElementById("chatFeedScroll");
    var chatInner = document.getElementById("chatFeedInner");
    var chatHint = document.getElementById("chatFeedHint");
    var giftTotalEl = document.getElementById("giftTotalUsdt");
    var banned = Object.create(null);
    var muted = Object.create(null);
    var metaStore = window.LiveMetaStore;
    var giftTotal = 40;
    var idSeq = 5;
    var pendingManage = null;
    var AV_POOL = [
        "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=80",
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80"
    ];
    /** 原型：对接后台敏感词库 */
    var SENSITIVE_WORDS = ["微信", "加微", "低价票", "诈骗", "赌博", "色情", "代理"];

    if (!giftInner || !chatInner) return;

    function hitSensitive(text) {
        var t = text || "";
        for (var i = 0; i < SENSITIVE_WORDS.length; i++) {
            if (t.indexOf(SENSITIVE_WORDS[i]) >= 0) return true;
        }
        return false;
    }

    function maskLine(text) {
        var len = Math.max(8, Math.min(24, (text || "").length));
        var blocks = "";
        for (var j = 0; j < len; j++) blocks += "\u2588";
        return blocks + "\uff08\u654f\u611f\u8bcd\u5df2\u8131\u654f\uff09";
    }

    function toast(msg) {
        var el = document.getElementById("hostToast");
        if (!el) return;
        el.textContent = msg;
        el.classList.add("show");
        clearTimeout(el._t);
        el._t = setTimeout(function () { el.classList.remove("show"); }, 2400);
    }

    function isNearBottom(el) {
        return el.scrollHeight - el.scrollTop - el.clientHeight < 36;
    }

    function scrollToBottom(el, smooth) {
        el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    }

    function bindFeed(scrollEl, hintEl) {
        scrollEl.addEventListener("scroll", function () {
            if (isNearBottom(scrollEl)) hintEl.classList.remove("show");
        });
        hintEl.addEventListener("click", function () {
            scrollToBottom(scrollEl, true);
            hintEl.classList.remove("show");
        });
    }

    bindFeed(giftScroll, giftHint);
    bindFeed(chatScroll, chatHint);

    function trimFeed(inner, max) {
        while (inner.children.length > max) {
            inner.removeChild(inner.firstChild);
        }
    }

    function appendGift(user, gift, usdt) {
        if (banned[user]) return;
        giftTotal += usdt;
        if (giftTotalEl) giftTotalEl.textContent = giftTotal.toFixed(1) + " USDT";
        var el = document.createElement("div");
        el.className = "gift-toast feed-item-enter";
        el.innerHTML = '<i class="fa-solid fa-gift"></i> ' + user + " 送出 <b>" + gift + "</b> · " + usdt + " USDT";
        var atBottom = isNearBottom(giftScroll);
        giftInner.appendChild(el);
        trimFeed(giftInner, 80);
        if (atBottom) {
            requestAnimationFrame(function () { scrollToBottom(giftScroll, true); });
        } else {
            giftHint.classList.add("show");
        }
    }

    function isAdmin(user) {
        return metaStore && metaStore.isAdmin(user);
    }

    function syncLineAdminState(line) {
        if (!line || !line.dataset.user) return;
        var u = line.dataset.user;
        line.classList.toggle("is-admin", isAdmin(u));
        line.classList.toggle("is-muted", !!muted[u]);
    }

    function refreshAdminList() {
        var list = document.getElementById("hostAdminList");
        var empty = document.getElementById("hostAdminEmpty");
        if (!list) return;
        var admins = metaStore ? metaStore.getAdmins() : [];
        list.querySelectorAll("li:not(.host-admin-empty)").forEach(function (li) { li.remove(); });
        if (!admins.length) {
            if (empty) empty.style.display = "";
            return;
        }
        if (empty) empty.style.display = "none";
        admins.forEach(function (name) {
            var li = document.createElement("li");
            li.innerHTML =
                '<span><i class="fa-solid fa-user-shield"></i> ' + name + "</span>" +
                '<button type="button" class="rm" data-rm-admin="' + name + '">移除</button>';
            list.appendChild(li);
        });
        list.querySelectorAll("[data-rm-admin]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var n = btn.getAttribute("data-rm-admin");
                if (metaStore) metaStore.removeAdmin(n);
                syncAllAdminStates();
                refreshAdminList();
                toast("已取消 " + n + " 的房管身份");
            });
        });
    }

    function syncAllAdminStates() {
        chatInner.querySelectorAll(".chat-line").forEach(syncLineAdminState);
    }

    function spawnHostGiftFly(text) {
        var stage = document.getElementById("hostStage");
        if (!stage) return;
        var el = document.createElement("div");
        el.className = "host-gift-fly-banner";
        el.innerHTML = '<i class="fa-solid fa-bullhorn"></i> ' + text;
        el.style.top = 20 + Math.random() * 50 + "%";
        stage.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 12000);
    }

    function appendChat(user, text, opts) {
        opts = opts || {};
        if (user !== "系统" && banned[user]) return;
        var sensitive = !opts.system && (opts.sensitive || hitSensitive(text));
        var displayText = sensitive ? maskLine(text) : text;
        if (muted[user] && !opts.system) displayText = "（已禁言）";
        var id = "c" + ++idSeq;
        var el = document.createElement("div");
        el.className =
            "chat-line feed-item-enter" +
            (opts.system ? " is-system" : "") +
            (sensitive ? " is-sensitive" : "") +
            (opts.risk && !sensitive ? " is-risk" : "") +
            (isAdmin(user) ? " is-admin" : "") +
            (muted[user] ? " is-muted" : "");
        el.dataset.id = id;
        el.dataset.user = user;
        if (opts.av) el.dataset.av = opts.av;
        if (sensitive) el.dataset.sensitive = "1";
        var av = opts.av || AV_POOL[idSeq % AV_POOL.length];
        var ops = "";
        if (!opts.system) {
            ops =
                '<div class="chat-ops">' +
                '<button type="button" class="chat-op" title="管理" data-act="manage"><i class="fa-solid fa-user-gear"></i></button>' +
                '<button type="button" class="chat-op" title="删除发言" data-act="del"><i class="fa-regular fa-trash-can"></i></button>' +
                '<button type="button" class="chat-op danger" title="移出直播间" data-act="kick"><i class="fa-solid fa-user-slash"></i></button>' +
                "</div>";
        }
        var msgClass = sensitive ? "m m-masked" : "m";
        var msgTitle = sensitive ? ' title="原文已脱敏"' : "";
        var main =
            opts.system
                ? '<div class="chat-main"><span class="u">' + user + '</span><span class="' + msgClass + '">' + displayText + "</span></div>"
                : '<div class="chat-main" data-act="manage" title="点击管理用户">' +
                  '<span class="chat-av" style="background-image:url(\'' + av + "')\"></span>" +
                  '<span class="u">' + user + '</span><span class="' + msgClass + '"' + msgTitle + ">" + displayText + "</span></div>";
        el.innerHTML = main + ops;
        var atBottom = isNearBottom(chatScroll);
        chatInner.appendChild(el);
        trimFeed(chatInner, 120);
        if (atBottom) {
            requestAnimationFrame(function () { scrollToBottom(chatScroll, true); });
        } else {
            chatHint.classList.add("show");
        }
        return el;
    }

    function removeChatLine(line) {
        if (!line) return;
        line.classList.add("feed-item-exit");
        setTimeout(function () {
            if (line.parentNode) line.parentNode.removeChild(line);
        }, 280);
    }

    var pendingKick = null;
    var modal = document.getElementById("hostKickModal");
    var modalUser = document.getElementById("hostKickUserName");

    function openKickModal(user) {
        pendingKick = user;
        if (modalUser) modalUser.textContent = user;
        if (modal) modal.classList.add("open");
    }

    function closeKickModal() {
        pendingKick = null;
        if (modal) modal.classList.remove("open");
    }

    document.getElementById("hostKickCancel").addEventListener("click", closeKickModal);
    document.getElementById("hostKickConfirm").addEventListener("click", function () {
        if (!pendingKick) return;
        banned[pendingKick] = true;
        var removed = 0;
        chatInner.querySelectorAll(".chat-line").forEach(function (line) {
            if (line.dataset.user === pendingKick) {
                removeChatLine(line);
                removed++;
            }
        });
        toast("已将 " + pendingKick + " 移出直播间" + (removed ? "（清除 " + removed + " 条发言）" : ""));
        closeKickModal();
    });
    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === modal) closeKickModal();
        });
    }

    var manageModal = document.getElementById("hostManageModal");
    var manageName = document.getElementById("hostManageName");
    var manageAv = document.getElementById("hostManageAv");
    var btnSetAdmin = document.getElementById("hostBtnSetAdmin");
    var btnRevokeAdmin = document.getElementById("hostBtnRevokeAdmin");
    var btnMute = document.getElementById("hostBtnMute");
    var btnKickFromManage = document.getElementById("hostBtnKickFromManage");
    var btnAnnounce = document.getElementById("hostBtnAnnounce");

    function openManageModal(line) {
        if (!line || line.classList.contains("is-system")) return;
        pendingManage = line;
        var user = line.dataset.user;
        var av = line.dataset.av || AV_POOL[0];
        if (manageName) manageName.textContent = user;
        if (manageAv) manageAv.style.backgroundImage = "url('" + av + "')";
        var isAd = isAdmin(user);
        if (btnSetAdmin) btnSetAdmin.style.display = isAd ? "none" : "inline-flex";
        if (btnRevokeAdmin) btnRevokeAdmin.style.display = isAd ? "inline-flex" : "none";
        if (btnMute) btnMute.innerHTML = muted[user]
            ? '<i class="fa-solid fa-comment"></i> 解除禁言'
            : '<i class="fa-solid fa-comment-slash"></i> 禁言';
        if (btnAnnounce) btnAnnounce.style.display = isAd ? "inline-flex" : "none";
        if (manageModal) manageModal.classList.add("open");
    }

    function closeManageModal() {
        pendingManage = null;
        if (manageModal) manageModal.classList.remove("open");
    }

    document.getElementById("hostManageClose")?.addEventListener("click", closeManageModal);
    manageModal?.addEventListener("click", function (e) {
        if (e.target === manageModal) closeManageModal();
    });

    btnSetAdmin?.addEventListener("click", function () {
        if (!pendingManage || !metaStore) return;
        var user = pendingManage.dataset.user;
        metaStore.addAdmin(user);
        syncAllAdminStates();
        refreshAdminList();
        appendChat("系统", user + " 已被设为房管", { system: true });
        spawnHostGiftFly("【房管上线】" + user + " 已成为管理员，协助维护秩序");
        toast(user + " 已成为房管 · 可禁言/踢人/飘屏公告");
        closeManageModal();
    });

    btnRevokeAdmin?.addEventListener("click", function () {
        if (!pendingManage || !metaStore) return;
        var user = pendingManage.dataset.user;
        metaStore.removeAdmin(user);
        syncAllAdminStates();
        refreshAdminList();
        toast("已取消 " + user + " 的房管身份");
        closeManageModal();
    });

    btnMute?.addEventListener("click", function () {
        if (!pendingManage) return;
        var user = pendingManage.dataset.user;
        if (muted[user]) {
            delete muted[user];
            toast("已解除 " + user + " 的禁言");
        } else {
            muted[user] = true;
            toast(user + " 已被禁言（原型）");
        }
        syncLineAdminState(pendingManage);
        closeManageModal();
    });

    btnKickFromManage?.addEventListener("click", function () {
        if (!pendingManage) return;
        openKickModal(pendingManage.dataset.user);
        closeManageModal();
    });

    btnAnnounce?.addEventListener("click", function () {
        if (!pendingManage) return;
        var user = pendingManage.dataset.user;
        var msg = window.prompt("输入房管飘屏公告（将掠过直播画面）", "请文明发言，禁止广告引流～");
        if (!msg || !msg.trim()) return;
        spawnHostGiftFly("【房管 " + user + "】" + msg.trim());
        appendChat("系统", "房管 " + user + " 发布飘屏公告", { system: true });
        toast("飘屏公告已发送");
        closeManageModal();
    });

    chatInner.addEventListener("click", function (e) {
        var line = e.target.closest(".chat-line");
        if (!line || line.classList.contains("is-system")) return;
        var actBtn = e.target.closest("[data-act]");
        if (actBtn && actBtn.dataset.act === "manage") {
            e.preventDefault();
            openManageModal(line);
            return;
        }
        if (e.target.closest('.chat-main[data-act="manage"]') && !actBtn) {
            openManageModal(line);
            return;
        }
        if (!actBtn) return;
        var user = line.dataset.user;
        var act = actBtn.dataset.act;
        if (act === "del") {
            removeChatLine(line);
            toast("已删除该条发言");
        } else if (act === "kick") {
            openKickModal(user);
        }
    });

    document.getElementById("btnSimGift").addEventListener("click", function () {
        var demos = [
            ["River", "荧光棒 ×10", 8],
            ["Sora", "皇冠", 99],
            ["Alex", "星光 ×5", 12]
        ];
        var d = demos[Math.floor(Math.random() * demos.length)];
        appendGift(d[0], d[1], d[2]);
    });

    document.getElementById("btnSimChat").addEventListener("click", function () {
        var demos = [
            ["Mika", "主播今天状态太好了"],
            ["Ken", "可以唱一首慢歌吗"],
            ["spam_bot", "加微信xxxx低价票", { sensitive: true }],
            ["ad_user", "低价票代理微信", { sensitive: true }],
            ["Nova", "已打赏，求点名"]
        ];
        var d = demos[Math.floor(Math.random() * demos.length)];
        appendChat(d[0], d[1], d[2] || {});
    });

    document.getElementById("btnClearRisk").addEventListener("click", function () {
        var n = 0;
        chatInner.querySelectorAll(".chat-line.is-sensitive, .chat-line.is-risk").forEach(function (line) {
            removeChatLine(line);
            n++;
        });
        toast(n ? "已清除 " + n + " 条异常发言" : "暂无异常发言");
    });

    /* 原型：定时模拟新消息 */
    var demoUsers = ["Lena", "Chris", "Hana", "Zoe", "Leo", "Mika", "Nova"];
    var demoTexts = ["太好听了！", "刚订阅支持一下", "可以再来一首吗", "声音好治愈", "从推荐页来的"];
    var demoGifts = [
        ["玫瑰 ×1", 2], ["啤酒 ×3", 6], ["火箭", 28], ["星光 ×5", 12]
    ];
    setInterval(function () {
        if (Math.random() < 0.45) {
            var u = demoUsers[Math.floor(Math.random() * demoUsers.length)];
            appendChat(u, demoTexts[Math.floor(Math.random() * demoTexts.length)]);
        }
        if (Math.random() < 0.28) {
            var u2 = demoUsers[Math.floor(Math.random() * demoUsers.length)];
            var g = demoGifts[Math.floor(Math.random() * demoGifts.length)];
            appendGift(u2, g[0], g[1]);
        }
    }, 5500);

    /* 暂时离开 / 继续直播 */
    var hostStage = document.getElementById("hostStage");
    var btnPause = document.getElementById("btnHostPause");
    var btnResume = document.getElementById("btnResumeLive");
    var isPaused = false;

    function setHostPaused(paused) {
        isPaused = paused;
        if (!hostStage) return;
        hostStage.classList.toggle("is-paused", isPaused);
        if (btnPause) {
            btnPause.classList.toggle("pause-on", isPaused);
            btnPause.innerHTML = isPaused
                ? '<i class="fa-solid fa-play"></i>'
                : '<i class="fa-solid fa-pause"></i>';
            btnPause.title = isPaused ? "继续直播" : "暂时离开";
        }
        var pill = hostStage.querySelector(".host-live-pill");
        if (pill) {
            pill.innerHTML = isPaused
                ? '<span class="dot"></span> 暂离'
                : '<span class="dot"></span> LIVE';
        }
        if (window.HostLivePip && window.HostLivePip.isActive()) {
            window.HostLivePip.setPaused(isPaused);
        }
    }

    if (hostStage) {
        if (btnPause) {
            btnPause.addEventListener("click", function () {
                setHostPaused(!isPaused);
                toast(isPaused ? "已切换为暂时离开" : "已继续直播");
            });
        }
        if (btnResume) {
            btnResume.addEventListener("click", function () {
                if (!isPaused) return;
                setHostPaused(false);
                toast("已继续直播");
            });
        }
    }

    /* 主播发言 + 表情 */
    var emojis = ["😀", "😂", "🔥", "❤️", "👏", "🎉", "🎵", "✨", "💜", "🙏", "😎", "🤩", "💯", "🎁", "🚀"];
    var hostEmojiPop = document.getElementById("hostEmojiPop");
    var btnHostEmoji = document.getElementById("btnHostEmoji");
    var hostChatInput = document.getElementById("hostChatInput");
    var btnHostSend = document.getElementById("btnHostSend");
    if (hostEmojiPop) {
        hostEmojiPop.innerHTML = emojis.map(function (e) {
            return '<button type="button">' + e + "</button>";
        }).join("");
    }
    if (btnHostEmoji && hostEmojiPop) {
        btnHostEmoji.addEventListener("click", function (e) {
            e.stopPropagation();
            hostEmojiPop.classList.toggle("open");
        });
        document.addEventListener("click", function () { hostEmojiPop.classList.remove("open"); });
        hostEmojiPop.addEventListener("click", function (e) { e.stopPropagation(); });
        hostEmojiPop.querySelectorAll("button").forEach(function (b) {
            b.addEventListener("click", function () {
                if (hostChatInput) hostChatInput.value += b.textContent;
                hostEmojiPop.classList.remove("open");
            });
        });
    }
    function hostSay(text) {
        appendChat("Luna 🌙", text, { system: false });
        toast("主播发言已展示在弹幕管理");
    }
    if (btnHostSend && hostChatInput) {
        function sendHost() {
            var t = (hostChatInput.value || "").trim();
            if (!t) return;
            hostChatInput.value = "";
            hostSay(t);
        }
        btnHostSend.addEventListener("click", sendHost);
        hostChatInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") sendHost();
        });
    }

    /* 结束直播 */
    var endModal = document.getElementById("hostEndLiveModal");
    var btnEndLive = document.getElementById("btnHostEndLive");
    function openEndModal() {
        if (endModal) endModal.classList.add("open");
    }
    function closeEndModal() {
        if (endModal) endModal.classList.remove("open");
    }
    if (btnEndLive) btnEndLive.addEventListener("click", openEndModal);
    var endCancel = document.getElementById("hostEndLiveCancel");
    var endConfirm = document.getElementById("hostEndLiveConfirm");
    if (endCancel) endCancel.addEventListener("click", closeEndModal);
    if (endConfirm) {
        endConfirm.addEventListener("click", function () {
            closeEndModal();
            if (metaStore && metaStore.endLive) metaStore.endLive();
            if (window.HostLivePip && window.HostLivePip.deactivate) window.HostLivePip.deactivate();
            toast("直播已结束");
            setTimeout(function () {
                location.href = "create.html";
            }, 600);
        });
    }
    if (endModal) {
        endModal.addEventListener("click", function (e) {
            if (e.target === endModal) closeEndModal();
        });
    }

    if (metaStore && metaStore.applyToHostStage) metaStore.applyToHostStage();
    refreshAdminList();
    syncAllAdminStates();

    /* 初始滚到底部 */
    scrollToBottom(giftScroll, false);
    scrollToBottom(chatScroll, false);
})();
