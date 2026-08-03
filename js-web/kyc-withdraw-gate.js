/**
 * 依赖：kyc-store.js（需先加载）
 * 绑定 #kycNeedModal / #kycWizardModal 及提现提交按钮
 */
(function () {
    var KS = window.GoodfansKycStore;
    if (!KS) return;

    function readKyc() {
        return KS.readKyc();
    }
    function writeKyc(partial) {
        KS.writeKyc(partial);
    }
    function pushAudit(row) {
        KS.pushAudit(row);
    }

    function showToast(elId, msg) {
        var t = document.getElementById(elId || "wdGlobalToast");
        if (!t) return;
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(t._h);
        t._h = setTimeout(function () {
            t.classList.remove("show");
        }, 2400);
    }

    function openModal(el) {
        if (!el) return;
        el.classList.add("open");
        document.body.style.overflow = "hidden";
    }
    function closeModal(el) {
        if (!el) return;
        el.classList.remove("open");
        if (el.id === "bindIframeModal") {
            var frClear = document.getElementById("wdBindIframe");
            if (frClear) frClear.src = "about:blank";
        }
        var any = document.querySelector(
            "#recipientMissModal.open, #bindIframeModal.open, #kycNeedModal.open, #kycWizardModal.open"
        );
        if (!any) document.body.style.overflow = "";
    }

    function kycGate(toastId) {
        var k = readKyc();
        if (k.status === "submitted") {
            showToast(toastId, "当前正在进行 KYC 审核，请耐心等待");
            return false;
        }
        if (k.status !== "approved") {
            openModal(document.getElementById("kycNeedModal"));
            return false;
        }
        return true;
    }

    function wireKycWizard(opts) {
        opts = opts || {};
        var toastId = opts.toastId || "wdGlobalToast";
        var channel = opts.channel || "提现";
        var kycNeed = document.getElementById("kycNeedModal");
        var kycWiz = document.getElementById("kycWizardModal");

        document.getElementById("kycNeedDismiss") &&
            document.getElementById("kycNeedDismiss").addEventListener("click", function () {
                closeModal(kycNeed);
            });
        document.getElementById("btnKycGoVerify") &&
            document.getElementById("btnKycGoVerify").addEventListener("click", function () {
                closeModal(kycNeed);
                openKycWizard(1);
            });
        if (kycNeed)
            kycNeed.addEventListener("click", function (e) {
                if (e.target === kycNeed) closeModal(kycNeed);
            });
        if (kycWiz)
            kycWiz.addEventListener("click", function (e) {
                if (e.target === kycWiz) closeModal(kycWiz);
            });
        document.getElementById("kycWizClose") &&
            document.getElementById("kycWizClose").addEventListener("click", function () {
                closeModal(kycWiz);
            });

        var kycStep = 1;
        var kycFrontOk = false;
        var kycBackOk = false;

        function setKycRail(step) {
            document.querySelectorAll("#kycStepRail .ks").forEach(function (el) {
                var i = parseInt(el.getAttribute("data-i"), 10);
                el.classList.toggle("active", i === step);
                el.classList.toggle("done", i < step);
            });
            document.querySelectorAll("#kycWizardModal .kyc-panel").forEach(function (p) {
                var s = parseInt(p.getAttribute("data-step"), 10);
                p.classList.toggle("active", s === step);
            });
        }

        function openKycWizard(fromStep) {
            kycStep = fromStep || 1;
            kycFrontOk = false;
            kycBackOk = false;
            var b1 = document.getElementById("kycStep1Next");
            var b2n = document.getElementById("kycStep2Next");
            var faceBox = document.getElementById("kycFaceLinkBox");
            var faceDone = document.getElementById("kycFaceDone");
            if (b1) b1.disabled = true;
            if (b2n) b2n.disabled = true;
            if (faceBox) {
                faceBox.style.display = "none";
                faceBox.textContent = "";
            }
            if (faceDone) faceDone.disabled = true;
            setKycRail(kycStep);
            openModal(kycWiz);
        }

        function markUpload(which) {
            if (which === "front") kycFrontOk = true;
            if (which === "back") kycBackOk = true;
            var b = document.getElementById("kycStep1Next");
            if (b) b.disabled = !(kycFrontOk && kycBackOk);
        }

        document.getElementById("kycUpFront") &&
            document.getElementById("kycUpFront").addEventListener("click", function () {
                markUpload("front");
                this.style.outline = "2px solid #A855F7";
            });
        document.getElementById("kycUpBack") &&
            document.getElementById("kycUpBack").addEventListener("click", function () {
                markUpload("back");
                this.style.outline = "2px solid #A855F7";
            });

        document.getElementById("kycStep1Next") &&
            document.getElementById("kycStep1Next").addEventListener("click", function () {
                kycStep = 2;
                setKycRail(kycStep);
            });

        document.getElementById("kycSimIdOk") &&
            document.getElementById("kycSimIdOk").addEventListener("click", function () {
                var b = document.getElementById("kycStep2Next");
                if (b) b.disabled = false;
                showToast(toastId, "三方联网核查已通过（模拟）");
            });
        document.getElementById("kycStep2Next") &&
            document.getElementById("kycStep2Next").addEventListener("click", function () {
                kycStep = 3;
                setKycRail(kycStep);
            });

        document.getElementById("kycGenFaceLink") &&
            document.getElementById("kycGenFaceLink").addEventListener("click", function () {
                var token = "face_" + Math.random().toString(36).slice(2, 12);
                var base =
                    location.pathname.replace(/[^/]+$/, "") ||
                    (location.href.indexOf("/pages-web/") !== -1 ? "" : "pages-web/");
                var page = "kyc-face-mobile.html?token=" + encodeURIComponent(token);
                var url = new URL(page, location.href).href;
                var box = document.getElementById("kycFaceLinkBox");
                if (box) {
                    box.style.display = "block";
                    box.textContent = url;
                }
                localStorage.setItem("goodfans_kyc_face_demo_url", url);
                var fd = document.getElementById("kycFaceDone");
                if (fd) fd.disabled = false;
                showToast(toastId, "已生成识别链接，可在手机浏览器打开");
            });
        document.getElementById("kycFaceDone") &&
            document.getElementById("kycFaceDone").addEventListener("click", function () {
                kycStep = 4;
                setKycRail(kycStep);
            });

        document.getElementById("kycFinishSubmit") &&
            document.getElementById("kycFinishSubmit").addEventListener("click", function () {
                var id = "KYC-" + Date.now();
                writeKyc({
                    status: "submitted",
                    stage: "machine",
                    lastId: id,
                    idCardFront: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
                    idCardBack: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
                    faceSnapshot: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
                });
                pushAudit({
                    id: id,
                    time: new Date().toLocaleString("zh-CN"),
                    user: "Luna 🌙",
                    channel: channel,
                    pipeline: "机审",
                    status: "待处理",
                    note: "证件 + 人脸已完成，待机审"
                });
                closeModal(kycWiz);
                showToast(toastId, "已提交审核，请等待机审 / 人工处理");
            });

        window.GoodfansKycWithdrawGate = {
            kycGate: function () {
                return kycGate(toastId);
            },
            openKycNeed: function () {
                openModal(kycNeed);
            },
            openKycWizard: openKycWizard
        };
    }

    global.GoodfansKycWithdrawBootstrap = { wireKycWizard: wireKycWizard };
})(window);
