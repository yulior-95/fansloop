/**
 * 直播详情页 · 观众端交互原型
 */
(function () {
    function toast(msg) {
        var el = document.getElementById("ldToast");
        if (!el) return;
        el.textContent = msg;
        el.classList.add("show");
        clearTimeout(el._t);
        el._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
    }

    function openOverlay(id) {
        var o = document.getElementById(id);
        if (o) o.classList.add("open");
    }
    function closeOverlay(id) {
        var o = document.getElementById(id);
        if (o) o.classList.remove("open");
    }

    document.querySelectorAll("[data-ld-close]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var id = btn.getAttribute("data-ld-close");
            if (id) closeOverlay(id);
        });
    });
    document.querySelectorAll(".ld-overlay").forEach(function (ov) {
        ov.addEventListener("click", function (e) {
            if (e.target === ov) ov.classList.remove("open");
        });
    });

    function getHostName() {
        return window.LiveViewHost && window.LiveViewHost.getCurrent
            ? window.LiveViewHost.getCurrent().name
            : "NovaPlay";
    }

    function getLiveLink() {
        if (window.LiveViewHost && window.LiveViewHost.getCurrent) {
            var h = window.LiveViewHost.getCurrent();
            return "https://fansloop.io/live/" + h.roomSlug;
        }
        return "https://fansloop.io/live/novaplay-apex-8842";
    }

    if (window.LiveViewHost && window.LiveViewHost.applyFromUrl) {
        window.LiveViewHost.applyFromUrl();
    } else if (window.LiveMetaStore && window.LiveMetaStore.applyToIntroPanel) {
        window.LiveMetaStore.applyToIntroPanel();
    }

    function reapplyLiveHost() {
        if (window.LiveViewHost && window.LiveViewHost.applyFromUrl) {
            window.LiveViewHost.applyFromUrl();
        }
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", reapplyLiveHost);
    }
    window.addEventListener("load", reapplyLiveHost);

    /* 关注 */
    var btnFollow = document.getElementById("btnFollow");
    if (btnFollow) {
        btnFollow.addEventListener("click", function () {
            var on = btnFollow.classList.toggle("is-followed");
            if (on) {
                btnFollow.innerHTML = '<i class="fa-solid fa-bell"></i> 已关注';
                toast("已关注 " + getHostName() + "，开播将通知你");
            } else {
                btnFollow.innerHTML = '<i class="fa-regular fa-bell"></i> 关注';
                toast("已取消关注");
            }
        });
    }

    var wallet = window.LiveWalletStore;
    var SUB_PRICE = wallet ? wallet.SUB_PRICE : 28;
    var LIVE_LINK = getLiveLink();

    function refreshSubBalanceUI() {
        if (!wallet) return;
        var bal = wallet.getBalance();
        var el = document.getElementById("subBalanceVal");
        var bar = document.getElementById("subBalanceBar");
        if (el) el.textContent = wallet.format(bal) + " USDT";
        if (bar) bar.classList.toggle("is-low", bal < SUB_PRICE);
    }

    function completeSubscribe() {
        subDone = true;
        closeOverlay("ldSubOverlay");
        if (btnSub) {
            btnSub.classList.add("is-subscribed");
            btnSub.innerHTML = '<i class="fa-solid fa-check"></i> 已订阅';
        }
        toast("订阅成功 · 月费 " + SUB_PRICE + " USDT 已扣款（原型）");
        appendChat("系统", "你已成功订阅房主，欢迎加入粉丝团！", { filter: "sub", system: true });
    }

    /* 订阅弹窗 */
    var btnSub = document.getElementById("btnSubscribe");
    var subDone = false;
    if (btnSub) {
        btnSub.addEventListener("click", function () {
            if (subDone) {
                toast("你已是订阅会员");
                return;
            }
            refreshSubBalanceUI();
            openOverlay("ldSubOverlay");
        });
    }
    var btnSubConfirm = document.getElementById("btnSubConfirm");
    if (btnSubConfirm) {
        btnSubConfirm.addEventListener("click", function () {
            if (!wallet) {
                completeSubscribe();
                return;
            }
            var bal = wallet.getBalance();
            if (bal < SUB_PRICE) {
                closeOverlay("ldSubOverlay");
                openRechargeFlow(SUB_PRICE - bal);
                return;
            }
            if (!wallet.deduct(SUB_PRICE)) {
                toast("余额不足，请先充值");
                openRechargeFlow(SUB_PRICE - wallet.getBalance());
                return;
            }
            completeSubscribe();
        });
    }

    /* 充值流程（余额不足 → 充值成功 → 回到订阅） */
    var pendingRechargeAmt = 100;
    var rechargeAfterSub = true;

    function openRechargeFlow(needGap) {
        if (!wallet) return;
        rechargeAfterSub = true;
        var bal = wallet.getBalance();
        var gap = Math.max(needGap || 0, SUB_PRICE - bal);
        var suggest = gap <= 50 ? 50 : gap <= 100 ? 100 : 200;
        pendingRechargeAmt = suggest;
        var balEl = document.getElementById("rechargeBalNow");
        var needEl = document.getElementById("rechargeNeedAmt");
        if (balEl) balEl.textContent = wallet.format(bal) + " USDT";
        if (needEl) needEl.textContent = wallet.format(Math.max(0, gap));
        document.querySelectorAll(".recharge-amt").forEach(function (b) {
            b.classList.toggle("selected", parseInt(b.getAttribute("data-amt"), 10) === suggest);
        });
        showRechargeStep("pay");
        openOverlay("ldRechargeOverlay");
    }

    function showRechargeStep(step) {
        var pay = document.getElementById("rechargeStepPay");
        var ok = document.getElementById("rechargeStepOk");
        var ftPay = document.getElementById("rechargeFtPay");
        var ftOk = document.getElementById("rechargeFtOk");
        if (pay) pay.style.display = step === "pay" ? "block" : "none";
        if (ok) ok.style.display = step === "ok" ? "block" : "none";
        if (ftPay) ftPay.style.display = step === "pay" ? "flex" : "none";
        if (ftOk) ftOk.style.display = step === "ok" ? "flex" : "none";
    }

    document.querySelectorAll(".recharge-amt").forEach(function (btn) {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".recharge-amt").forEach(function (b) { b.classList.remove("selected"); });
            btn.classList.add("selected");
            pendingRechargeAmt = parseInt(btn.getAttribute("data-amt"), 10) || 100;
        });
    });

    var btnRechargeConfirm = document.getElementById("btnRechargeConfirm");
    if (btnRechargeConfirm && wallet) {
        btnRechargeConfirm.addEventListener("click", function () {
            var newBal = wallet.add(pendingRechargeAmt);
            document.getElementById("rechargeOkAmt").textContent = wallet.format(pendingRechargeAmt);
            document.getElementById("rechargeOkBal").textContent = wallet.format(newBal);
            showRechargeStep("ok");
            toast("充值成功 +" + pendingRechargeAmt + " USDT");
        });
    }

    var btnRechargeThenSub = document.getElementById("btnRechargeThenSub");
    if (btnRechargeThenSub) {
        btnRechargeThenSub.addEventListener("click", function () {
            closeOverlay("ldRechargeOverlay");
            showRechargeStep("pay");
            if (!wallet) return;
            if (wallet.getBalance() < SUB_PRICE) {
                toast("余额仍不足，请继续充值");
                openRechargeFlow(SUB_PRICE - wallet.getBalance());
                return;
            }
            if (!wallet.deduct(SUB_PRICE)) {
                toast("扣款失败，请重试");
                return;
            }
            completeSubscribe();
        });
    }

    /* 收藏 */
    var btnBm = document.getElementById("btnBookmark");
    if (btnBm) {
        btnBm.addEventListener("click", function () {
            var on = btnBm.classList.toggle("is-on");
            btnBm.innerHTML = on
                ? '<i class="fa-solid fa-bookmark"></i> 已收藏'
                : '<i class="fa-regular fa-bookmark"></i> 收藏';
            toast(on ? "已加入收藏" : "已取消收藏");
        });
    }

    /* 分享 */
    var btnShare = document.getElementById("btnShare");
    if (btnShare) {
        btnShare.addEventListener("click", function () {
            var qr = document.getElementById("sharePosterQr");
            if (qr) {
                qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=" + encodeURIComponent(LIVE_LINK);
            }
            openOverlay("ldShareOverlay");
        });
    }
    var btnSavePoster = document.getElementById("btnSavePoster");
    if (btnSavePoster) {
        btnSavePoster.addEventListener("click", function () { toast("海报已保存到本地（原型）"); });
    }
    document.querySelectorAll(".share-tabs button").forEach(function (tab) {
        tab.addEventListener("click", function () {
            document.querySelectorAll(".share-tabs button").forEach(function (t) { t.classList.remove("active"); });
            tab.classList.add("active");
            var pane = tab.getAttribute("data-share-tab");
            document.querySelectorAll("[data-share-pane]").forEach(function (p) {
                p.style.display = p.getAttribute("data-share-pane") === pane ? "block" : "none";
            });
        });
    });
    var btnCopyLink = document.getElementById("btnCopyShareLink");
    if (btnCopyLink) {
        btnCopyLink.addEventListener("click", function () {
            var inp = document.getElementById("shareLinkInput");
            if (inp) {
                inp.select();
                try { navigator.clipboard.writeText(inp.value); } catch (e) {}
            }
            toast("链接已复制");
        });
    }

    /* 打赏 */
    var ldTipBoostCfg = null;

    function syncLdTipBonusPanel() {
        var ldBonus = document.getElementById("ldTipBonusPanel");
        if (!ldBonus) return;
        var p = new URLSearchParams(location.search);
        var forceDemo = p.get("bonus") === "1" || p.get("bonus") === "active";
        var forceNone = p.get("bonus") === "0" || p.get("bonus") === "none";
        var store = window.MallVouchersStore;
        var voucher = !forceNone && store && store.getActiveTipBoost ? store.getActiveTipBoost() : null;
        ldTipBoostCfg = voucher && store.voucherToTipCfg ? store.voucherToTipCfg(voucher) : null;

        if (!ldTipBoostCfg && forceDemo && window.FLTipBonus) {
            var demo = window.FLTipBonus.resolveTipBoostState("?bonus=active");
            ldTipBoostCfg = demo.cfg;
        }

        if (!ldTipBoostCfg) {
            ldBonus.style.display = "none";
            return;
        }

        ldBonus.style.display = "";
        if (voucher) ldBonus.setAttribute("data-voucher-id", voucher.id);
        else ldBonus.removeAttribute("data-voucher-id");

        var usesLabel = ldBonus.querySelector(".left");
        if (usesLabel) {
            usesLabel.innerHTML = '<i class="fa-solid fa-heart"></i> 打赏加成卡 · 剩余 ' + ldTipBoostCfg.usesRemaining + '/' + ldTipBoostCfg.usesTotal + ' 次';
        }
        refreshLdBonus();
    }

    function refreshLdBonus() {
        var ldToggle = document.getElementById("ldTipBonusToggle");
        var sel = document.querySelector(".gift-pick.selected");
        var price = sel ? parseFloat(sel.getAttribute("data-price") || "0") : 200;
        var on = ldToggle ? ldToggle.checked : true;
        var cfg = ldTipBoostCfg || {};
        var subsidy = on && window.FLTipBonus ? window.FLTipBonus.calcSubsidy(price, cfg) : 0;
        var pay = document.getElementById("ldTipPay");
        var sub = document.getElementById("ldTipSubsidy");
        var cre = document.getElementById("ldTipCreator");
        if (pay) pay.textContent = price;
        if (sub) sub.textContent = subsidy > 0 ? "+" + subsidy : "—";
        if (cre) cre.textContent = price + subsidy;
    }

    var btnTip = document.getElementById("btnTip");
    if (btnTip) {
        btnTip.addEventListener("click", function () {
            syncLdTipBonusPanel();
            openOverlay("ldGiftOverlay");
        });
    }
    var chatGiftBtn = document.getElementById("chatGiftBtn");
    if (chatGiftBtn) {
        chatGiftBtn.addEventListener("click", function () {
            syncLdTipBonusPanel();
            openOverlay("ldGiftOverlay");
        });
    }
    var selectedGift = null;
    document.querySelectorAll(".gift-pick").forEach(function (g) {
        g.addEventListener("click", function () {
            document.querySelectorAll(".gift-pick").forEach(function (x) { x.classList.remove("selected"); });
            g.classList.add("selected");
            selectedGift = {
                name: g.getAttribute("data-name"),
                price: parseInt(g.getAttribute("data-price"), 10) || 0,
                emoji: g.querySelector(".em").textContent
            };
            refreshLdBonus();
        });
    });
    var ldTipToggle = document.getElementById("ldTipBonusToggle");
    if (ldTipToggle) ldTipToggle.addEventListener("change", refreshLdBonus);
    var btnGiftSend = document.getElementById("btnGiftSend");
    if (btnGiftSend) {
        btnGiftSend.addEventListener("click", function () {
            if (!selectedGift) {
                toast("请选择礼物");
                return;
            }
            closeOverlay("ldGiftOverlay");
            var ldBonus = document.getElementById("ldTipBonusPanel");
            var vid = ldBonus && ldBonus.getAttribute("data-voucher-id");
            var ldToggle = document.getElementById("ldTipBonusToggle");
            if (vid && ldToggle && ldToggle.checked && window.MallVouchersStore) {
                window.MallVouchersStore.consumeTipBoostUse(vid);
            }
            toast("已送出 " + selectedGift.name + " · " + selectedGift.price + " USDT");
            spawnGiftFly("你", "送出 " + selectedGift.emoji + " " + selectedGift.name);
            appendChat("你", "送出 " + selectedGift.emoji + " " + selectedGift.name + " · " + selectedGift.price + " USDT", { filter: "gift", gift: true });
        });
    }

    /* 举报 */
    var btnReport = document.getElementById("btnReport");
    if (btnReport) {
        btnReport.addEventListener("click", function () {
            var R = window.FL_ContentReport;
            if (!R) {
                toast("举报功能暂不可用");
                return;
            }
            var params = new URLSearchParams(location.search);
            var host = params.get("host") || "live";
            R.open({
                type: "live",
                contentId: "live-" + host,
                toast: toast,
                onDone: function () {
                    setTimeout(function () {
                        if (history.length > 1) history.back();
                        else location.href = "home-ab-feed.html";
                    }, 400);
                }
            });
        });
    }

    /* 播放器控件 */
    var player = document.getElementById("livePlayer");
    var danmakuLayer = document.getElementById("danmakuLayer");
    var btnVol = document.getElementById("btnPlayerVol");
    var btnGear = document.getElementById("btnPlayerGear");
    var gearPop = document.getElementById("ldSettingsPop");
    var btnExpand = document.getElementById("btnPlayerExpand");
    var btnPip = document.getElementById("btnPlayerPip");
    var pipWin = document.getElementById("livePipWin");
    var dmAreaMode = "scroll";

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
        var btnDanmakuSettingsClose = document.getElementById("btnDanmakuSettingsClose");
        var dmAreaGroup = document.getElementById("dmAreaGroup");
        var dmFontSizeRange = document.getElementById("dmFontSizeRange");
        var dmFontSizeVal = document.getElementById("dmFontSizeVal");
        var dmOpacityRange = document.getElementById("dmOpacityRange");
        var dmOpacityVal = document.getElementById("dmOpacityVal");
        var dmSafeAreaToggle = document.getElementById("dmSafeAreaToggle");
        var giftFxToggle = document.getElementById("giftFxToggle");

        function closeDanmakuSettings() {
            gearPop.classList.remove("open");
            btnGear.classList.remove("is-active");
        }

        function updateRangeTrack(input) {
            if (!input) return;
            var min = Number(input.min || 0);
            var max = Number(input.max || 100);
            var value = Number(input.value || min);
            var ratio = ((value - min) / Math.max(1, max - min)) * 100;
            input.style.background = "linear-gradient(90deg,#FBBF24 " + ratio + "%, rgba(255,255,255,0.2) " + ratio + "%)";
        }

        btnGear.addEventListener("click", function (e) {
            e.stopPropagation();
            var opening = !gearPop.classList.contains("open");
            gearPop.classList.toggle("open", opening);
            btnGear.classList.toggle("is-active", opening);
        });
        document.addEventListener("click", function () { closeDanmakuSettings(); });
        gearPop.addEventListener("click", function (e) { e.stopPropagation(); });
        if (btnDanmakuSettingsClose) {
            btnDanmakuSettingsClose.addEventListener("click", function () { closeDanmakuSettings(); });
        }
        if (dmAreaGroup) {
            dmAreaGroup.addEventListener("click", function (e) {
                var btn = e.target.closest("button[data-dm-area]");
                if (!btn) return;
                dmAreaGroup.querySelectorAll("button[data-dm-area]").forEach(function (n) {
                    n.classList.remove("is-active");
                });
                btn.classList.add("is-active");
                dmAreaMode = btn.getAttribute("data-dm-area") || "scroll";
            });
        }
        if (dmFontSizeRange) {
            var syncDmFont = function () {
                if (dmFontSizeVal) dmFontSizeVal.textContent = dmFontSizeRange.value;
                if (danmakuLayer) {
                    danmakuLayer.style.setProperty("--dm-font-size", dmFontSizeRange.value + "px");
                    danmakuLayer.querySelectorAll(".danmaku-item").forEach(function (item) {
                        item.style.fontSize = dmFontSizeRange.value + "px";
                    });
                }
                updateRangeTrack(dmFontSizeRange);
            };
            dmFontSizeRange.addEventListener("input", syncDmFont);
            syncDmFont();
        }
        if (dmOpacityRange) {
            var syncDmOpacity = function () {
                if (dmOpacityVal) dmOpacityVal.textContent = dmOpacityRange.value + "%";
                if (danmakuLayer) danmakuLayer.style.setProperty("--dm-opacity", String(Math.max(0.2, Number(dmOpacityRange.value) / 100)));
                updateRangeTrack(dmOpacityRange);
            };
            dmOpacityRange.addEventListener("input", syncDmOpacity);
            syncDmOpacity();
        }
        if (dmSafeAreaToggle && player) {
            var syncSafeArea = function () {
                player.classList.toggle("dm-safe-area", !!dmSafeAreaToggle.checked);
            };
            dmSafeAreaToggle.addEventListener("change", syncSafeArea);
            syncSafeArea();
        }
        if (giftFxToggle && player) {
            var syncGiftFx = function () {
                player.classList.toggle("gift-fx-muted", !!giftFxToggle.checked);
            };
            giftFxToggle.addEventListener("change", syncGiftFx);
            syncGiftFx();
        }
        var params = new URLSearchParams(window.location.search);
        if (params.get("autoDanmakuSettings") === "1") {
            gearPop.classList.add("open");
            btnGear.classList.add("is-active");
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
    if (btnPip && pipWin && window.FLLivePipPlaceholder) {
        window.FLLivePipPlaceholder.bind({
            player: player,
            pipBtn: btnPip,
            localPipWin: pipWin,
            pipClose: document.getElementById("btnPipClose"),
            pipRestore: document.getElementById("btnPipRestore"),
            toast: toast,
            getPayload: function () {
                var role = (new URLSearchParams(window.location.search).get("liveRole") || "viewer").toLowerCase();
                var titleEl = document.querySelector(".bottom-overlay h2");
                var qs0 = location.search || "";
                return {
                    role: role === "host" ? "host" : "viewer",
                    back: role === "host" ? "create-live-host.html" : "live-detail.html" + qs0,
                    title: titleEl ? titleEl.textContent.trim() : getHostName() + " · 直播中",
                    active: true
                };
            },
            onLocalOpen: function (win) {
                var pipBody = win.querySelector(".pip-body");
                if (pipBody && player && player.style.backgroundImage) {
                    pipBody.style.backgroundImage = player.style.backgroundImage;
                }
            },
            onChange: function (active) {
                if (active) {
                    if (giftFlyTimer) {
                        clearInterval(giftFlyTimer);
                        giftFlyTimer = null;
                    }
                    if (danmakuLayer) {
                        danmakuLayer.classList.add("is-hidden");
                        danmakuLayer.innerHTML = "";
                    }
                } else if (!giftFlyTimer && !endedApplied) {
                    giftFlyTimer = setInterval(function () {
                        var d = giftFlyPool[Math.floor(Math.random() * giftFlyPool.length)];
                        spawnGiftFly(d[0], d[1]);
                    }, 3200);
                    if (danmakuLayer) danmakuLayer.classList.remove("is-hidden");
                }
            }
        });
    } else if (btnPip && pipWin) {
        btnPip.addEventListener("click", function () {
            var role = (new URLSearchParams(window.location.search).get("liveRole") || "viewer").toLowerCase();
            var titleEl = document.querySelector(".bottom-overlay h2");
            var payload = {
                role: role === "host" ? "host" : "viewer",
                back: role === "host" ? "create-live-host.html" : "live-detail.html",
                title: titleEl ? titleEl.textContent.trim() : "直播中",
                active: true
            };
            if (typeof window.FL_openGlobalLivePip === "function") {
                window.FL_openGlobalLivePip(payload);
                toast("已开启悬浮窗，切换站内页面将持续显示");
                return;
            }
            try { localStorage.setItem("fl_live_pip_state", JSON.stringify(payload)); } catch (e) {}
            pipWin.classList.add("open");
            toast("已开启悬浮窗");
        });
    }
    if (!window.FLLivePipPlaceholder) {
        var btnPipClose = document.getElementById("btnPipClose");
        var btnPipRestore = document.getElementById("btnPipRestore");
        if (btnPipClose && pipWin) {
            btnPipClose.addEventListener("click", function () {
                pipWin.classList.remove("open");
                toast("已关闭悬浮窗");
            });
        }
        if (btnPipRestore && pipWin) {
            btnPipRestore.addEventListener("click", function () {
                pipWin.classList.remove("open");
                player.scrollIntoView({ behavior: "smooth", block: "center" });
                toast("已回到直播页");
            });
        }
    }
    /* 喝彩 · 抖音式上浮点赞 */
    var btnCheer = document.getElementById("btnCheer");
    var likeLayer = document.getElementById("likeBurstLayer");
    var cheerCount = 4600;
    var cheerLabel = document.getElementById("cheerCountLabel");

    function spawnLikeBurst(fromEl) {
        if (!likeLayer || !fromEl) return;
        var rect = fromEl.getBoundingClientRect();
        var icons = ["fa-heart", "fa-thumbs-up", "fa-star"];
        var colors = ["", "alt", "gold"];
        for (var i = 0; i < 8; i++) {
            var h = document.createElement("span");
            h.className = "like-float-heart " + (colors[i % 3] || "");
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
            btnCheer.classList.add("is-tapped");
            setTimeout(function () { btnCheer.classList.remove("is-tapped"); }, 120);
            cheerCount += 1;
            if (cheerLabel) {
                cheerLabel.textContent = cheerCount >= 1000 ? "喝彩 " + (cheerCount / 1000).toFixed(1) + "K" : "喝彩 " + cheerCount;
            }
            spawnLikeBurst(btnCheer);
        });
    }

    /* 礼物打赏飘屏（左→右，仅送礼/打赏） */
    var giftFlyPool = [
        ["WhaleX", "送出 🚀 火箭 ×1"],
        ["BlockTrader", "打赏 50 USDT"],
        ["Aria", "送出 💎 钻石礼物"],
        ["Ken", "送出 🎉 荧光棒 ×10"],
        ["Mika", "送出 👑 皇冠"]
    ];
    function spawnGiftFly(user, text) {
        if (!danmakuLayer || danmakuLayer.classList.contains("is-hidden")) return;
        var el = document.createElement("div");
        el.className = "danmaku-item gift";
        el.innerHTML = '<i class="fa-solid fa-gift"></i><b>' + user + "</b> " + text;
        if (dmAreaMode === "top") el.style.top = 8 + Math.random() * 22 + "%";
        else if (dmAreaMode === "bottom") el.style.top = 66 + Math.random() * 22 + "%";
        else el.style.top = 10 + Math.random() * 68 + "%";
        el.style.animationDuration = 9 + Math.random() * 6 + "s";
        danmakuLayer.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 18000);
        while (danmakuLayer.children.length > 20) {
            danmakuLayer.removeChild(danmakuLayer.firstChild);
        }
    }
    var giftFlyTimer = setInterval(function () {
        var d = giftFlyPool[Math.floor(Math.random() * giftFlyPool.length)];
        spawnGiftFly(d[0], d[1]);
    }, 3200);
    spawnGiftFly("WhaleX", "送出 🎁 钻石礼物");

    var livePlayer = document.getElementById("livePlayer");
    var liveEndedOverlay = document.getElementById("liveEndedOverlay");
    var liveStatusPill = document.getElementById("liveStatusPill");
    var endedApplied = false;

    function applyViewerEndedState() {
        if (endedApplied) return;
        endedApplied = true;
        if (livePlayer) livePlayer.classList.add("is-ended");
        if (liveEndedOverlay) liveEndedOverlay.setAttribute("aria-hidden", "false");
        if (liveStatusPill) {
            liveStatusPill.innerHTML = '<span class="dot ended"></span> 已结束';
            liveStatusPill.classList.add("is-ended");
        }
        if (giftFlyTimer) clearInterval(giftFlyTimer);
        giftFlyTimer = null;
        if (danmakuLayer) danmakuLayer.classList.add("is-hidden");
        var floatGifts = livePlayer && livePlayer.querySelector(".float-gifts");
        if (floatGifts) floatGifts.style.display = "none";
        var ci = document.getElementById("chatInput");
        var cs = document.getElementById("btnChatSend");
        if (ci) {
            ci.disabled = true;
            ci.placeholder = "直播已结束，无法发言";
        }
        if (cs) cs.disabled = true;
        ["btnTip", "btnCheer", "btnSubscribe"].forEach(function (id) {
            var b = document.getElementById(id);
            if (b) {
                b.classList.add("is-disabled");
                b.style.pointerEvents = "none";
                b.style.opacity = "0.45";
            }
        });
        toast("直播已结束");
    }

    function shouldShowEndedFromUrl() {
        try {
            var p = new URLSearchParams(location.search);
            return p.get("ended") === "1" || p.get("status") === "ended";
        } catch (e) {
            return false;
        }
    }

    function ensureViewerLiveState() {
        if (livePlayer) livePlayer.classList.remove("is-ended");
        if (liveEndedOverlay) liveEndedOverlay.setAttribute("aria-hidden", "true");
        if (liveStatusPill) {
            liveStatusPill.innerHTML = '<span class="dot"></span> LIVE';
            liveStatusPill.classList.remove("is-ended");
        }
        if (danmakuLayer) danmakuLayer.classList.remove("is-hidden");
        var floatGifts = livePlayer && livePlayer.querySelector(".float-gifts");
        if (floatGifts) floatGifts.style.display = "";
        var ci = document.getElementById("chatInput");
        var cs = document.getElementById("btnChatSend");
        if (ci) {
            ci.disabled = false;
            ci.placeholder = "说点什么…";
        }
        if (cs) cs.disabled = false;
        ["btnTip", "btnCheer", "btnSubscribe"].forEach(function (id) {
            var b = document.getElementById(id);
            if (b) {
                b.classList.remove("is-disabled");
                b.style.pointerEvents = "";
                b.style.opacity = "";
            }
        });
        endedApplied = false;
    }

    function checkLiveEnded() {
        var store = window.LiveMetaStore;
        if (shouldShowEndedFromUrl()) {
            if (store && store.endLive) store.endLive();
            applyViewerEndedState();
            return;
        }
        /* 观众默认进入直播间为「直播中」，清除主播端遗留的 ended 状态 */
        if (store && store.markLiveActive) store.markLiveActive();
        else if (store && store.save) store.save({ status: "live", endedAt: null });
        ensureViewerLiveState();
    }

    checkLiveEnded();
    reapplyLiveHost();
    window.addEventListener("storage", function (e) {
        if (e.key !== "fansloop_live_session") return;
        if (shouldShowEndedFromUrl()) return;
        var store = window.LiveMetaStore;
        if (store && store.isLiveEnded && store.isLiveEnded()) {
            applyViewerEndedState();
        } else {
            ensureViewerLiveState();
        }
    });

    /* 主 Tabs */
    document.querySelectorAll(".live-tabs .tt").forEach(function (tab) {
        tab.addEventListener("click", function () {
            var key = tab.getAttribute("data-tab");
            document.querySelectorAll(".live-tabs .tt").forEach(function (t) { t.classList.remove("active"); });
            tab.classList.add("active");
            document.querySelectorAll(".live-tab-panel").forEach(function (p) {
                p.classList.toggle("active", p.getAttribute("data-tab-panel") === key);
            });
        });
    });

    /* 聊天 Tabs */
    var chatBody = document.getElementById("chatBody");
    document.querySelectorAll(".chat-tabs .ct").forEach(function (tab) {
        tab.addEventListener("click", function () {
            var key = tab.getAttribute("data-chat-tab");
            document.querySelectorAll(".chat-tabs .ct").forEach(function (t) { t.classList.remove("active"); });
            tab.classList.add("active");
            if (chatBody) chatBody.setAttribute("data-tab", key);
        });
    });

    /* 表情 */
    var btnEmoji = document.getElementById("btnChatEmoji");
    var emojiPop = document.getElementById("chatEmojiPop");
    if (btnEmoji && emojiPop) {
        btnEmoji.addEventListener("click", function (e) {
            e.stopPropagation();
            emojiPop.classList.toggle("open");
        });
        document.addEventListener("click", function () { emojiPop.classList.remove("open"); });
        emojiPop.addEventListener("click", function (e) { e.stopPropagation(); });
        emojiPop.querySelectorAll("button").forEach(function (b) {
            b.addEventListener("click", function () {
                var inp = document.getElementById("chatInput");
                if (inp) inp.value += b.textContent;
                emojiPop.classList.remove("open");
            });
        });
    }

    /* 发送聊天 */
    var sensStore = function () { return window.FLChatSensitiveWordsStore; };
    function appendChat(user, text, opts) {
        opts = opts || {};
        if (!chatBody) return;
        var displayText = text;
        var sensitive = false;
        if (!opts.system && !opts.gift && sensStore()) {
            var processed = sensStore().processOutgoing(text, 'live', {
                uid: '882910',
                room: (window.LiveMetaStore && LiveMetaStore.get && LiveMetaStore.get().id) || 'live_room',
                summary: text.slice(0, 80)
            });
            displayText = processed.display;
            sensitive = processed.sensitive;
        }
        var wrap = document.createElement("div");
        wrap.className = "chat-msg" + (opts.gift ? " gift-msg" : "") + (opts.filter === "sub" ? " sub-msg" : "") + (sensitive ? " is-sensitive" : "");
        if (opts.filter) wrap.setAttribute("data-filter", opts.filter);
        else if (window.LiveViewHost && user === window.LiveViewHost.getCurrent().name) wrap.setAttribute("data-filter", "host");
        if (opts.gift) wrap.setAttribute("data-filter", "gift");
        if (sensitive) wrap.setAttribute("data-sensitive", "1");
        var av = opts.self
            ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80"
            : "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=80";
        var textClass = sensitive ? "text m-masked" : "text";
        var textTitle = sensitive ? ' title="原文已脱敏"' : "";
        wrap.innerHTML =
            '<div class="av" style="background-image:url(\'' + av + '\')"></div>' +
            '<div class="body"><span class="nm">' + user + '</span><span class="' + textClass + '"' + textTitle + '>' + displayText + "</span></div>";
        chatBody.appendChild(wrap);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    var btnSend = document.getElementById("btnChatSend");
    var chatInput = document.getElementById("chatInput");
    if (btnSend && chatInput) {
        function sendChat() {
            var t = (chatInput.value || "").trim();
            if (!t) return;
            chatInput.value = "";
            appendChat("你", t, { self: true });
        }
        btnSend.addEventListener("click", sendChat);
        chatInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") sendChat();
        });
    }

    /* 申请上麦 · 本页为允许上麦演示直播间（其他页面不改动） */
    (function initApplyMic() {
        var btn = document.getElementById("btnApplyMic");
        if (!btn) return;

        var slots = document.getElementById("ldAudienceSlots");
        var micBar = document.getElementById("ldMicBar");
        var rejectBanner = document.getElementById("ldMicRejectBanner");
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

        function resetSlot0() {
            if (!slots) return;
            var slot0 = slots.querySelector('[data-slot="0"]');
            if (!slot0) return;
            slot0.className = "obs-audience-slot empty";
            slot0.innerHTML = emptySlotHtml();
        }

        function resetMuteBtn() {
            var btnMute = document.getElementById("btnMicMute");
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

        function leaveMicOn() {
            clearTimeout(pendingTimer);
            state = "idle";
            hideMicBar();
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
            renderBtn();
            toast("已下麦");
        }

        function renderBtn() {
            if (state === "idle") {
                btn.className = "ac";
                btn.innerHTML = '<i class="fa-solid fa-microphone"></i> 申请上麦';
            } else if (state === "pending") {
                btn.className = "ac mic-pending";
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> 等待主播同意…';
            } else if (state === "on") {
                btn.className = "ac mic-on";
                btn.innerHTML = '<i class="fa-solid fa-microphone-lines"></i> 连麦中';
            }
        }

        function showReject() {
            toast("主播拒绝您的申请");
            if (!rejectBanner) return;
            rejectBanner.hidden = false;
            requestAnimationFrame(function () {
                rejectBanner.classList.add("show");
            });
            clearTimeout(rejectBanner._hideT);
            rejectBanner._hideT = setTimeout(function () {
                rejectBanner.classList.remove("show");
                setTimeout(function () {
                    rejectBanner.hidden = true;
                }, 280);
            }, 4200);
        }

        function firstEmptySlot() {
            if (!slots) return null;
            return slots.querySelector(".obs-audience-slot.empty");
        }

        function enterMicOn() {
            var slot = firstEmptySlot();
            if (!slot) {
                toast("观众席位已满");
                state = "idle";
                renderBtn();
                return;
            }
            state = "on";
            showMicBar();
            slot.className = "obs-audience-slot is-speaking";
            slot.innerHTML =
                '<div class="av-wrap"><div class="av" style="background-image:url(\'' + fanAv + '\')"></div></div>' +
                '<span class="nm">你</span>';
            appendChat("系统", "你已成功上麦，麦克风已开启", { system: true, filter: "all" });
            renderBtn();
            toast("主播已同意 · 连麦中");
        }

        btn.addEventListener("click", function () {
            if (window.LiveDetailCohost && window.LiveDetailCohost.isHostCohostActive()) {
                toast("主播连麦进行中，暂不可申请观众上麦");
                return;
            }
            if (state === "pending" || state === "on") return;
            state = "pending";
            renderBtn();
            clearTimeout(pendingTimer);
            pendingTimer = setTimeout(function () {
                if (micOutcome() === "reject") {
                    state = "idle";
                    renderBtn();
                    showReject();
                } else {
                    enterMicOn();
                }
            }, 2800);
        });

        var btnLeave = document.getElementById("btnMicLeave");
        if (btnLeave) {
            btnLeave.addEventListener("click", function (e) {
                e.stopPropagation();
                openOverlay("ldMicLeaveOverlay");
            });
        }

        var btnLeaveConfirm = document.getElementById("btnMicLeaveConfirm");
        if (btnLeaveConfirm) {
            btnLeaveConfirm.addEventListener("click", function () {
                closeOverlay("ldMicLeaveOverlay");
                leaveMicOn();
            });
        }

        var btnMute = document.getElementById("btnMicMute");
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
            renderBtn();
        }

        window.FL_resetAudienceMic = forceResetMic;
        window.addEventListener("fl-host-cohost-change", function (e) {
            if (e.detail && e.detail.active) forceResetMic();
        });
    })();

    /* OBS 等待条（保留） */
    try {
        var p = new URLSearchParams(location.search);
        if (p.get("source") === "obs" && p.get("wait") === "1") {
            var w = document.getElementById("waitStreamStrip");
            if (w) w.classList.add("show");
        }
        if (p.get("source") === "cam") {
            var c = document.getElementById("camHintStrip");
            if (c) c.classList.add("show");
        }
        if (p.get("gift") === "open" || p.get("gift") === "1") {
            syncLdTipBonusPanel();
            openOverlay("ldGiftOverlay");
        }
    } catch (e) {}
})();
