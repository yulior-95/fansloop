/**
 * 主播控制台 · 连麦 & PK 侧栏交互（create-live-host.html）
 */
(function () {
    var I = {
        luna: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80",
        night: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80",
        echo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80",
        jazz: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1400&q=80",
        concert: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80",
        fan: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=80",
        ken: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80"
    };

    var state = {
        matching: false,
        cohost: false,
        audienceMic: false,
        pk: false,
        pkType: "gift"
    };

    var stage, dynamic, btnMatch, btnDirected, btnAud, btnPk, matchTimer, modalRoot;

    function $(id) {
        return document.getElementById(id);
    }

    function toast(msg) {
        var el = $("hostToast");
        if (!el) return;
        el.textContent = msg;
        el.classList.add("show");
        clearTimeout(el._cohostT);
        el._cohostT = setTimeout(function () {
            el.classList.remove("show");
        }, 2400);
    }

    function setDynamic(html) {
        if (!dynamic) return;
        dynamic.innerHTML = html || "";
    }

    function setCohostToolbarDisabled(disabled) {
        [btnMatch, btnDirected].forEach(function (btn) {
            if (!btn) return;
            btn.disabled = !!disabled;
            btn.classList.toggle("is-disabled", !!disabled);
        });
    }

    function updatePkBtn() {
        if (!btnPk) return;
        var canPk = state.cohost && !state.pk;
        btnPk.disabled = !canPk;
        btnPk.title = canPk ? "发起 PK" : state.pk ? "PK 进行中" : "需先完成主播连麦";
        btnPk.classList.toggle("btn-primary", canPk);
        btnPk.classList.toggle("btn-secondary", !canPk);
    }

    function updateAudienceBtn() {
        if (!btnAud) return;
        var icon = state.audienceMic ? "fa-toggle-on" : "fa-microphone-lines";
        btnAud.innerHTML =
            '<i class="fa-solid ' + icon + '"></i> ' + (state.audienceMic ? "关闭上麦" : "观众上麦");
        btnAud.classList.toggle("btn-primary", state.audienceMic);
        btnAud.classList.toggle("btn-secondary", !state.audienceMic);
    }

    function cohostExitBtnHtml(extraClass) {
        return (
            '<button type="button" class="host-cohost-exit' +
            (extraClass ? " " + extraClass : "") +
            '" title="退出连麦，恢复单人直播">' +
            '<i class="fa-solid fa-phone-slash"></i> 退出连麦</button>'
        );
    }

    function cohostStageHtml(withPk) {
        var pk =
            withPk || state.pk
                ? '<div class="obs-pk-hud">' +
                  '<div class="obs-pk-timer">02:47</div>' +
                  '<div class="obs-pk-bars">' +
                  '<div class="obs-pk-bar-wrap"><div class="obs-pk-bar-meta"><span>Luna 🌙</span><span>1,240 USDT</span></div>' +
                  '<div class="obs-pk-bar obs-pk-bar--a"><span style="width:58%"></span></div></div>' +
                  '<div class="obs-pk-vs">VS</div>' +
                  '<div class="obs-pk-bar-wrap"><div class="obs-pk-bar-meta"><span>夜雨听弦</span><span>892 USDT</span></div>' +
                  '<div class="obs-pk-bar obs-pk-bar--b"><span style="width:42%"></span></div></div>' +
                  "</div></div>"
                : "";
        return (
            '<div class="host-cohost-cell" style="background-image:url(\'' +
            I.jazz +
            "')\"><div class=\"host-cohost-label\"><span class=\"av\" style=\"background-image:url('" +
            I.luna +
            "')\"></span> Luna 🌙（我）</div></div>" +
            '<div class="host-cohost-cell" style="background-image:url(\'' +
            I.concert +
            "')\"><div class=\"host-cohost-label\"><span class=\"av\" style=\"background-image:url('" +
            I.night +
            "')\"></span> 夜雨听弦</div></div>" +
            '<div class="host-cohost-top"><span class="host-cohost-chip host-cohost-chip--link">' +
            '<i class="fa-solid fa-link"></i> 连麦中 · 2/3</span>' +
            (state.pk
                ? '<span class="host-cohost-chip host-cohost-chip--pk"><i class="fa-solid fa-bolt"></i> PK 进行中</span>'
                : '<span class="host-cohost-chip">合流延迟 ~2.1s</span>') +
            cohostExitBtnHtml("host-cohost-exit-stage") +
            "</div>" +
            pk
        );
    }

    function injectStage(html) {
        if (!stage) return;
        clearStageInject();
        stage.classList.add("host-stage--cohost-2");
        stage.style.backgroundImage = "none";
        var wrap = document.createElement("div");
        wrap.className = "host-cohost-inject";
        wrap.innerHTML = html;
        var bottom = stage.querySelector(".host-bottom");
        if (bottom) stage.insertBefore(wrap, bottom);
        else stage.appendChild(wrap);
    }

    function clearStageInject() {
        if (!stage) return;
        stage.classList.remove("host-stage--cohost-2");
        stage.style.removeProperty("background-image");
        var inj = stage.querySelector(".host-cohost-inject");
        if (inj) inj.remove();
        stage.querySelectorAll(".obs-audience-slots").forEach(function (el) {
            el.remove();
        });
    }

    function renderCohostMembers() {
        var pkHint = state.pk
            ? '<p class="host-cohost-hint" style="color:#fde68a;margin-bottom:8px"><i class="fa-solid fa-bolt"></i> PK 进行中 · ' +
              (state.pkType === "like" ? "点赞总个数" : "礼物总金额") +
              "</p>"
            : "";
        setDynamic(
            pkHint +
            '<div class="host-cohost-members">' +
            '<div class="host-cohost-member"><div class="av" style="background-image:url(\'' +
            I.luna +
            "')\"></div><div class=\"meta\"><div class=\"n\">Luna 🌙</div><div class=\"s\">房主 · OBS</div></div></div>" +
            '<div class="host-cohost-member"><div class="av" style="background-image:url(\'' +
            I.night +
            "')\"></div><div class=\"meta\"><div class=\"n\">夜雨听弦</div><div class=\"s\">RTMP 复用</div></div></div>" +
            "</div>" +
            cohostExitBtnHtml("btn btn-secondary btn-sm btn-block host-cohost-exit-side")
        );
    }

    function connectCohost(partnerName) {
        state.matching = false;
        state.cohost = true;
        clearTimeout(matchTimer);
        setCohostToolbarDisabled(true);
        injectStage(cohostStageHtml(false));
        renderCohostMembers();
        updatePkBtn();
        closeModal();
        toast("已与 " + (partnerName || "夜雨听弦") + " 建立主播连麦");
    }

    function exitCohost() {
        state.cohost = false;
        state.pk = false;
        state.matching = false;
        clearStageInject();
        setCohostToolbarDisabled(false);
        setDynamic("");
        updatePkBtn();
        toast("已退出主播连麦");
    }

    function renderAudienceQueue() {
        setDynamic(
            '<p class="host-cohost-hint"><i class="fa-solid fa-toggle-on" style="color:#6ee7b7"></i> 观众上麦已开启 · 默认 2 席</p>' +
            '<div class="host-cohost-queue-item" data-queue="fan01">' +
            '<div class="av" style="background-image:url(\'' +
            I.fan +
            "')\"></div><div class=\"meta\"><div class=\"n\">Fan_01</div><div class=\"s\">申请上麦 · 等待 8s</div></div>" +
            '<div class="host-cohost-queue-actions">' +
            '<button type="button" class="btn btn-primary btn-sm" data-action="approve">同意</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-action="reject">拒绝</button>' +
            "</div></div>" +
            '<div class="host-cohost-queue-item" data-queue="ken">' +
            '<div class="av" style="background-image:url(\'' +
            I.ken +
            "')\"></div><div class=\"meta\"><div class=\"n\">Ken</div><div class=\"s\">申请上麦</div></div>" +
            '<div class="host-cohost-queue-actions">' +
            '<button type="button" class="btn btn-primary btn-sm" data-action="approve">同意</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-action="reject">拒绝</button>' +
            "</div></div>"
        );
    }

    function mountAudienceSlots() {
        if (!stage || stage.querySelector(".obs-audience-slots")) return;
        var slots = document.createElement("div");
        slots.className = "obs-audience-slots";
        slots.innerHTML =
            '<div class="obs-audience-slot is-speaking"><div class="av-wrap"><div class="av" style="background-image:url(\'' +
            I.fan +
            "')\"></div></div><span class=\"nm\">Fan_01</span></div>" +
            '<div class="obs-audience-slot empty"><div class="av-wrap"><div class="av"><i class="fa-solid fa-plus"></i></div></div><span class="nm">空席</span></div>';
        var bottom = stage.querySelector(".host-bottom");
        if (bottom) stage.insertBefore(slots, bottom);
        else stage.appendChild(slots);
    }

    function closeModal() {
        if (modalRoot) {
            modalRoot.remove();
            modalRoot = null;
        }
    }

    function openModal(html, onReady) {
        closeModal();
        modalRoot = document.createElement("div");
        modalRoot.className = "obs-modal-backdrop";
        modalRoot.innerHTML = html;
        document.body.appendChild(modalRoot);
        modalRoot.addEventListener("click", function (e) {
            if (e.target === modalRoot || e.target.closest("[data-modal-close]")) closeModal();
        });
        if (onReady) onReady(modalRoot);
    }

    function showDirectedPicker() {
        openModal(
            '<div class="obs-modal">' +
            '<div class="obs-modal-head"><h3><i class="fa-solid fa-user-plus" style="color:#c084fc"></i> 指定连麦</h3>' +
            "<p>搜索正在直播的主播</p></div>" +
            '<div class="obs-modal-body"><div class="obs-search"><i class="fa-solid fa-magnifying-glass"></i>' +
            '<input type="search" placeholder="搜索主播昵称…" value="夜" /></div>' +
            '<div class="obs-host-pick">' +
            '<div class="obs-host-pick-item selected" data-host="夜雨听弦" role="button" tabindex="0">' +
            '<div class="av" style="background-image:url(\'' +
            I.night +
            "')\"></div><div class=\"info\"><div class=\"n\">夜雨听弦</div><div class=\"s\">爵士 · 1,204 在线</div></div>" +
            '<i class="fa-solid fa-circle" style="color:#ef4444;font-size:8px"></i></div>' +
            '<div class="obs-host-pick-item" data-host="EchoDJ" role="button" tabindex="0">' +
            '<div class="av" style="background-image:url(\'' +
            I.echo +
            "')\"></div><div class=\"info\"><div class=\"n\">EchoDJ</div><div class=\"s\">电子 · 856 在线</div></div></div>" +
            "</div></div>" +
            '<div class="obs-modal-foot">' +
            '<button type="button" class="btn btn-secondary" data-modal-close>取消</button>' +
            '<button type="button" class="btn btn-primary" id="hostDirectedSend">发送连麦邀请</button>' +
            "</div></div>",
            function (root) {
                var selected = "夜雨听弦";
                root.querySelectorAll(".obs-host-pick-item").forEach(function (item) {
                    item.addEventListener("click", function () {
                        root.querySelectorAll(".obs-host-pick-item").forEach(function (x) {
                            x.classList.remove("selected");
                        });
                        item.classList.add("selected");
                        selected = item.getAttribute("data-host") || "夜雨听弦";
                    });
                });
                var send = root.querySelector("#hostDirectedSend");
                if (send) {
                    send.addEventListener("click", function () {
                        toast("已向 " + selected + " 发送连麦邀请");
                        closeModal();
                        setDynamic(
                            '<p class="host-cohost-hint" style="color:#fde68a"><i class="fa-solid fa-hourglass-half"></i> 等待 ' +
                            selected +
                            " 接受邀请…</p>"
                        );
                        setTimeout(function () {
                            connectCohost(selected);
                        }, 1400);
                    });
                }
            }
        );
    }

    function showPkSetup() {
        openModal(
            '<div class="obs-modal">' +
            '<div class="obs-modal-head"><h3><i class="fa-solid fa-hand-fist" style="color:#fbbf24"></i> 发起 PK</h3>' +
            "<p>选择 PK 形式与时长（后台配置固定选项）</p></div>" +
            '<div class="obs-modal-body obs-pk-form">' +
            '<div class="field"><label>PK 形式</label><div class="obs-pk-types">' +
            '<button type="button" class="obs-pk-type active" data-pk-type="gift"><i class="fa-solid fa-gift"></i><br>礼物总金额</button>' +
            '<button type="button" class="obs-pk-type" data-pk-type="like"><i class="fa-regular fa-thumbs-up"></i><br>点赞总个数</button>' +
            "</div></div>" +
            '<div class="field"><label>PK 时长</label><div class="obs-pk-durations">' +
            '<span class="obs-pk-dur">1 分钟</span><span class="obs-pk-dur active">3 分钟</span>' +
            '<span class="obs-pk-dur">5 分钟</span><span class="obs-pk-dur">10 分钟</span>' +
            "</div></div></div>" +
            '<div class="obs-modal-foot">' +
            '<button type="button" class="btn btn-secondary" data-modal-close>取消</button>' +
            '<button type="button" class="btn btn-primary" id="hostPkSend">发送 PK 申请</button>' +
            "</div></div>",
            function (root) {
                root.querySelectorAll(".obs-pk-type").forEach(function (btn) {
                    btn.addEventListener("click", function () {
                        root.querySelectorAll(".obs-pk-type").forEach(function (x) {
                            x.classList.remove("active");
                        });
                        btn.classList.add("active");
                        state.pkType = btn.getAttribute("data-pk-type") || "gift";
                    });
                });
                root.querySelectorAll(".obs-pk-dur").forEach(function (span) {
                    span.addEventListener("click", function () {
                        root.querySelectorAll(".obs-pk-dur").forEach(function (x) {
                            x.classList.remove("active");
                        });
                        span.classList.add("active");
                    });
                });
                var send = root.querySelector("#hostPkSend");
                if (send) {
                    send.addEventListener("click", function () {
                        closeModal();
                        showPkPending();
                    });
                }
            }
        );
    }

    function showPkPending() {
        var label = state.pkType === "like" ? "点赞总个数" : "礼物总金额";
        openModal(
            '<div class="obs-modal">' +
            '<div class="obs-modal-head"><h3><i class="fa-solid fa-hourglass-half" style="color:#fbbf24"></i> 等待全员同意 PK</h3>' +
            "<p>" +
            label +
            " · 3 分钟 · 需所有在麦主播同意后开始</p></div>" +
            '<div class="obs-modal-body"><div class="obs-approve-list">' +
            '<div class="obs-approve-row"><div class="av" style="width:32px;height:32px;border-radius:50%;background:url(\'' +
            I.luna +
            "') center/cover\"></div> Luna 🌙（发起方）<span class=\"status ok\">已同意</span></div>" +
            '<div class="obs-approve-row"><div class="av" style="width:32px;height:32px;border-radius:50%;background:url(\'' +
            I.night +
            "') center/cover\"></div> 夜雨听弦 <span class=\"status wait\">等待中</span></div>" +
            "</div></div>" +
            '<div class="obs-modal-foot">' +
            '<button type="button" class="btn btn-secondary" data-modal-close>取消 PK</button>' +
            '<button type="button" class="btn btn-primary" id="hostPkAgree">同意 PK</button>' +
            "</div></div>",
            function (root) {
                var agree = root.querySelector("#hostPkAgree");
                if (agree) {
                    agree.addEventListener("click", function () {
                        startPk();
                    });
                }
            }
        );
    }

    function startPk() {
        state.pk = true;
        closeModal();
        injectStage(cohostStageHtml(true));
        renderCohostMembers();
        updatePkBtn();
        toast("PK 已开始");
    }

    function startRandomMatch() {
        if (state.cohost || state.matching) return;
        state.matching = true;
        setCohostToolbarDisabled(true);
        setDynamic(
            '<p class="host-cohost-hint" style="color:#fde68a"><i class="fa-solid fa-spinner fa-spin"></i> 随机匹配中 · 已等待 0s</p>'
        );
        var sec = 0;
        matchTimer = setInterval(function () {
            sec += 1;
            var hint = dynamic && dynamic.querySelector(".host-cohost-hint");
            if (hint) {
                hint.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> 随机匹配中 · 已等待 ' + sec + "s";
            }
        }, 1000);
        setTimeout(function () {
            connectCohost("夜雨听弦");
        }, 2200);
    }

    function toggleAudienceMic() {
        state.audienceMic = !state.audienceMic;
        updateAudienceBtn();
        if (state.audienceMic) {
            renderAudienceQueue();
            toast("观众上麦已开启 · 默认 2 席");
        } else {
            if (state.cohost) renderCohostMembers();
            else setDynamic("");
            stage.querySelectorAll(".obs-audience-slots").forEach(function (el) {
                el.remove();
            });
            toast("已关闭观众上麦");
        }
    }

    function onDynamicClick(e) {
        var exit = e.target.closest(".host-cohost-exit");
        if (exit) {
            exitCohost();
            return;
        }
        var approve = e.target.closest("[data-action='approve']");
        if (approve) {
            var row = approve.closest(".host-cohost-queue-item");
            if (row) row.remove();
            mountAudienceSlots();
            toast("已同意观众上麦");
            if (dynamic && !dynamic.querySelector(".host-cohost-queue-item") && state.audienceMic) {
                setDynamic(
                    '<p class="host-cohost-hint">在麦观众 · 可强制踢下麦</p>' +
                    '<div class="host-cohost-member"><div class="av" style="background-image:url(\'' +
                    I.fan +
                    "')\"></div><div class=\"meta\"><div class=\"n\">Fan_01</div><div class=\"s\">开麦中 · 声纹波动</div></div>" +
                    '<button type="button" class="btn btn-secondary btn-sm host-kick-aud" style="color:#fca5a5"><i class="fa-solid fa-user-slash"></i></button></div>'
                );
            }
            return;
        }
        var reject = e.target.closest("[data-action='reject']");
        if (reject) {
            var rowR = reject.closest(".host-cohost-queue-item");
            if (rowR) rowR.remove();
            toast("已拒绝上麦申请");
            return;
        }
        var kick = e.target.closest(".host-kick-aud");
        if (kick) {
            stage.querySelectorAll(".obs-audience-slots").forEach(function (el) {
                el.remove();
            });
            if (state.audienceMic) renderAudienceQueue();
            else if (state.cohost) renderCohostMembers();
            toast("已将观众踢下麦");
        }
    }

    function init() {
        stage = $("hostStage");
        dynamic = $("hostCohostDynamic");
        btnMatch = $("btnObsRandomMatch");
        btnDirected = $("btnObsDirected");
        btnAud = $("btnObsAudienceMic");
        btnPk = $("btnObsPk");

        if (!stage || !dynamic) return;

        if (btnMatch) btnMatch.addEventListener("click", startRandomMatch);
        if (btnDirected) btnDirected.addEventListener("click", showDirectedPicker);
        if (btnAud) btnAud.addEventListener("click", toggleAudienceMic);
        if (btnPk) btnPk.addEventListener("click", showPkSetup);
        if (dynamic) dynamic.addEventListener("click", onDynamicClick);
        if (stage) {
            stage.addEventListener("click", function (e) {
                if (e.target.closest(".host-cohost-exit")) exitCohost();
            });
        }

        updatePkBtn();
        updateAudienceBtn();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
