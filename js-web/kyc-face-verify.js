(function () {
    var KS = window.GoodfansKycStore;
    var FN = window.KycFlowNav;
    document.getElementById("linkBack").href = FN.hrefWithRet("kyc-upload-id.html");

    var stage = document.getElementById("faceStage");
    var illus = document.getElementById("faceIllus");
    var video = document.getElementById("faceVideo");
    var canvas = document.getElementById("faceCanvas");
    var scanTip = document.getElementById("faceScanTip");
    var btnStart = document.getElementById("btnStartFace");
    var btnGen = document.getElementById("btnGen");
    var btnSimPass = document.getElementById("btnSimPass");
    var btnSimFail = document.getElementById("btnSimFail");
    var fileBanner = document.getElementById("fileProtoBanner");
    var linkRow = document.getElementById("linkRow");
    var linkBox = document.getElementById("linkBox");
    var btnLinkCopy = document.getElementById("btnLinkCopy");
    var btnNext = document.getElementById("btnNext");
    var panelLiveFail = document.getElementById("panelFaceLiveFail");
    var panelReview = document.getElementById("panelFaceReview");
    var panelAuditOk = document.getElementById("panelFaceAuditOk");
    var panelAuditFail = document.getElementById("panelFaceAuditFail");
    var statusChip = document.getElementById("faceStatusChip");
    var liveFailReason = document.getElementById("faceLiveFailReason");

    var faceToken = sessionStorage.getItem("goodfans_kyc_face_token") || "";
    var faceUrl = "";
    var stream = null;
    var faceDone = false;
    var scanTimer = null;
    var pollTimer = null;
    var isFileProto = location.protocol === "file:";

    function setChip(html, type) {
        if (!statusChip) return;
        if (!html) {
            statusChip.style.display = "none";
            statusChip.innerHTML = "";
            return;
        }
        statusChip.style.display = "inline-flex";
        statusChip.className = "kyc-face-status-chip " + (type || "");
        statusChip.innerHTML = html;
    }

    function hideAllPanels() {
        [panelLiveFail, panelReview, panelAuditOk, panelAuditFail].forEach(function (p) {
            if (p) p.style.display = "none";
        });
    }

    function resetEntryState() {
        hideAllPanels();
        faceDone = false;
        faceUrl = "";
        btnNext.disabled = true;
        setChip("");
        stage.classList.remove("is-scanning", "is-done");
        if (illus) {
            illus.style.display = "block";
            illus.src = "https://images.unsplash.com/photo-1531746790731-9c087f06e611?w=800&h=480&fit=crop";
            illus.alt = "人脸识别取景示意";
        }
        if (video) {
            video.style.display = "none";
            video.srcObject = null;
        }
        btnStart.disabled = false;
        btnStart.innerHTML = '<i class="fa-solid fa-camera"></i> 开始人脸识别';
        if (scanTip) scanTip.textContent = "请将面部置于框内";
    }

    function showLiveFail(reason) {
        hideAllPanels();
        faceDone = false;
        btnNext.disabled = true;
        if (panelLiveFail) panelLiveFail.style.display = "flex";
        if (liveFailReason) liveFailReason.textContent = reason || "识别未通过";
        setChip('<i class="fa-solid fa-circle-xmark"></i> 识别未通过', "fail");
        if (window.KycToast) window.KycToast.show(reason || "人脸识别未通过", "error");
        stage.classList.remove("is-scanning", "is-done");
        stopStream();
        btnStart.disabled = false;
        btnStart.innerHTML = '<i class="fa-solid fa-camera"></i> 重新识别';
    }

    /** 仅带 ?view=audit 时展示后台审核结果（非进入本步默认态） */
    function maybeShowPostAudit() {
        if (!KS || FN.qp("view") !== "audit") return false;
        var k = KS.readKyc();
        hideAllPanels();
        if (k.authStatus === "approved") {
            if (panelAuditOk) panelAuditOk.style.display = "flex";
            setChip('<i class="fa-solid fa-circle-check"></i> 认证审核通过', "ok");
            btnNext.disabled = true;
            return true;
        }
        if (k.authStatus === "rejected") {
            if (panelAuditFail) panelAuditFail.style.display = "flex";
            var el = document.getElementById("faceAuditFailReason");
            if (el) el.textContent = k.rejectReason || "认证未通过";
            setChip('<i class="fa-solid fa-circle-xmark"></i> 认证审核未通过', "fail");
            btnNext.disabled = true;
            return true;
        }
        if (k.authStatus === "reviewing") {
            if (panelReview) panelReview.style.display = "flex";
            setChip('<i class="fa-solid fa-hourglass-half"></i> 资料审核中', "wait");
            btnNext.disabled = true;
            return true;
        }
        return false;
    }

    function onFaceSuccess(snapshot) {
        faceDone = true;
        faceUrl = snapshot || "";
        hideAllPanels();
        stage.classList.add("is-done");
        stage.classList.remove("is-scanning");
        stopStream();
        if (video) video.style.display = "none";
        if (illus && snapshot) {
            illus.src = snapshot;
            illus.style.display = "block";
            illus.alt = "已采集人脸快照（最后一帧）";
        }
        setChip('<i class="fa-solid fa-check"></i> 活体检测通过，已保存快照', "ok");
        btnNext.disabled = false;
        btnStart.disabled = false;
        btnStart.innerHTML = '<i class="fa-solid fa-rotate-right"></i> 重新识别';
        if (KS) KS.setFaceDone(faceToken || "desktop", faceUrl, { passed: true });
    }

    function stopStream() {
        if (scanTimer) {
            clearTimeout(scanTimer);
            scanTimer = null;
        }
        if (stream) {
            stream.getTracks().forEach(function (t) { t.stop(); });
            stream = null;
        }
        if (video) video.srcObject = null;
    }

    function captureFrame() {
        if (!canvas || !video || !video.videoWidth) return null;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        return canvas.toDataURL("image/jpeg", 0.88);
    }

    function validateLastFrame() {
        var shot = captureFrame();
        if (!shot) {
            showLiveFail("未捕获到有效画面，请确认摄像头已授权");
            return;
        }
        var detect = window.KycFaceDetect && window.KycFaceDetect.detectFaceInCanvas;
        if (detect) {
            var result = detect(canvas);
            if (!result.ok) {
                showLiveFail(result.reason);
                return;
            }
        }
        onFaceSuccess(shot);
    }

    function runLivenessCheck() {
        if (FN.qp("demo") === "fail_face") {
            showLiveFail("演示：未通过活体检测（请保持面部在框内）");
            return;
        }
        if (scanTip) scanTip.textContent = "正在分析最后一帧…";
        validateLastFrame();
    }

    function waitForVideoReady() {
        return new Promise(function (resolve, reject) {
            if (video.readyState >= 2 && video.videoWidth) {
                resolve();
                return;
            }
            function onReady() {
                video.removeEventListener("loadeddata", onReady);
                resolve();
            }
            video.addEventListener("loadeddata", onReady);
            setTimeout(function () {
                if (video.videoWidth) resolve();
                else reject(new Error("no frame"));
            }, 5000);
        });
    }

    function startCameraFlow() {
        if (maybeShowPostAudit()) return;
        hideAllPanels();
        faceDone = false;
        btnNext.disabled = true;
        stage.classList.add("is-scanning");
        btnStart.disabled = true;
        btnStart.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> 识别中…';
        setChip('<i class="fa-solid fa-face-smile"></i> 正在调用摄像头…', "scan");
        if (scanTip) scanTip.textContent = "请将面部置于框内";

        if (isFileProto) {
            showLiveFail("file:// 无法调用摄像头，请使用本地服务器打开，或点击「模拟识别通过」");
            return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showLiveFail("当前浏览器不支持摄像头，请使用手机链接完成识别");
            return;
        }

        navigator.mediaDevices
            .getUserMedia({
                video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            })
            .then(function (s) {
                stream = s;
                if (illus) illus.style.display = "none";
                video.style.display = "block";
                video.setAttribute("playsinline", "");
                video.muted = true;
                video.srcObject = s;
                return video.play();
            })
            .then(function () {
                return waitForVideoReady();
            })
            .then(function () {
                setChip('<i class="fa-solid fa-face-smile"></i> 请保持面部在框内', "scan");
                scanTimer = setTimeout(runLivenessCheck, 3200);
            })
            .catch(function (err) {
                stopStream();
                stage.classList.remove("is-scanning");
                var msg = "无法访问摄像头";
                if (err && err.name === "NotAllowedError") msg = "摄像头权限被拒绝，请在浏览器设置中允许访问";
                else if (err && err.name === "NotFoundError") msg = "未检测到摄像头设备";
                showLiveFail(msg);
            });
    }

    function acceptRemoteDone(done) {
        if (!done || !done.at || faceDone) return;
        if (faceToken && done.token && done.token !== faceToken) return;
        if (done.passed === false) {
            showLiveFail(done.reason || "手机端识别未通过");
            return;
        }
        onFaceSuccess(done.snapshot || "");
        if (window.KycToast) window.KycToast.show("已同步手机端人脸识别结果", "ok");
    }

    function checkRemoteFaceDone() {
        if (!KS || faceDone) return;
        acceptRemoteDone(KS.readFaceDone());
    }

    function startPoll() {
        if (pollTimer) return;
        pollTimer = setInterval(checkRemoteFaceDone, 1200);
    }

    btnStart.addEventListener("click", startCameraFlow);

    if (btnSimPass) {
        btnSimPass.addEventListener("click", function () {
            hideAllPanels();
            stopStream();
            var demoShot =
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=480&fit=crop&crop=face";
            onFaceSuccess(demoShot);
            if (window.KycToast) window.KycToast.show("已模拟活体检测通过", "ok");
        });
    }

    if (btnSimFail) {
        btnSimFail.addEventListener("click", function () {
            showLiveFail("模拟：未检测到清晰人像，请将面部对准取景框并保持光线充足");
        });
    }

    btnGen.addEventListener("click", function () {
        faceToken = "face_" + Math.random().toString(36).slice(2, 12);
        sessionStorage.setItem("goodfans_kyc_face_token", faceToken);
        if (KS) KS.clearFaceDone();
        var url = new URL("kyc-face-mobile.html?token=" + encodeURIComponent(faceToken), location.href).href;
        linkBox.textContent = url;
        linkRow.style.display = "flex";
        startPoll();
        if (window.KycToast) window.KycToast.show("链接已生成，手机完成后将自动同步", "ok");
    });

    btnLinkCopy.addEventListener("click", function () {
        var text = linkBox.textContent || "";
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                if (window.KycToast) window.KycToast.show("链接已复制", "ok");
            });
        } else {
            prompt("复制链接", text);
        }
    });

    btnNext.addEventListener("click", function () {
        if (!faceDone) {
            if (window.KycToast) window.KycToast.show("请先完成人脸识别", "error");
            return;
        }
        var draft = {};
        try {
            draft = JSON.parse(sessionStorage.getItem("goodfans_kyc_draft") || "{}");
        } catch (e) {}
        if (KS) {
            KS.submitDocument({
                country: draft.country || null,
                idType: draft.idType || null,
                idCardFront: draft.idCardFront || null,
                idCardBack: draft.idCardBack || null,
                faceSnapshot: faceUrl || null
            });
            KS.clearFaceDone();
        }
        sessionStorage.removeItem("goodfans_kyc_face_token");
        FN.go("kyc-doc-pending.html");
    });

    var btnFaceRetry = document.getElementById("btnFaceRetry");
    if (btnFaceRetry) {
        btnFaceRetry.addEventListener("click", function () {
            if (KS) KS.writeKyc({ authStatus: "unverified", status: "none", rejectReason: null, stage: "face" });
            if (KS) KS.clearFaceDone();
            resetEntryState();
        });
    }

    window.addEventListener("storage", function (e) {
        if (KS && e.key === KS.FACE_DONE_KEY) checkRemoteFaceDone();
    });
    window.addEventListener("goodfans-kyc-face-done", checkRemoteFaceDone);

    if (isFileProto && fileBanner) fileBanner.style.display = "flex";

    if (FN.qp("view") === "audit") {
        maybeShowPostAudit();
    } else {
        resetEntryState();
        if (KS) KS.clearFaceDone();
        if (!faceToken) {
            faceToken = "face_" + Math.random().toString(36).slice(2, 10);
            sessionStorage.setItem("goodfans_kyc_face_token", faceToken);
        }
        var pending = KS && KS.readFaceDone();
        if (pending && pending.at && (!pending.token || pending.token === faceToken)) {
            acceptRemoteDone(pending);
        }
    }
})();
