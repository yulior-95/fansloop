(function () {
    var KS = window.FansloopKycStore;
    var k = KS.readKyc();
    document.getElementById("metaId").textContent = k.lastId || "—";
    document.getElementById("linkBack").href = window.KycFlowNav.hrefWithRet("settings.html");

    var panelReview = document.getElementById("panelReview");
    var panelOk = document.getElementById("panelOk");
    var panelFail = document.getElementById("panelFail");

    function showPanel(name) {
        panelReview.style.display = name === "review" ? "block" : "none";
        panelOk.style.display = name === "ok" ? "block" : "none";
        panelFail.style.display = name === "fail" ? "block" : "none";
    }

    function syncFromStore() {
        k = KS.readKyc();
        if (k.authStatus === "approved") {
            showPanel("ok");
            return;
        }
        if (k.authStatus === "rejected") {
            showPanel("fail");
            var r = document.getElementById("failReasonPending");
            if (r) r.textContent = k.rejectReason || "认证未通过，请重新提交。";
            if (window.KycToast) window.KycToast.show(k.rejectReason || "审核未通过", "error");
            return;
        }
        showPanel("review");
    }

    syncFromStore();

    document.getElementById("btnSimOk").addEventListener("click", function () {
        KS.setDocumentApproved();
        syncFromStore();
        setTimeout(function () {
            window.KycFlowNav.go("kyc-complete.html", { source: "document" });
        }, 1200);
    });
    document.getElementById("btnSimFail").addEventListener("click", function () {
        KS.setDocumentRejected("证件人像不清晰，请重新拍摄后提交。");
        syncFromStore();
    });
    document.getElementById("btnRetryPending").addEventListener("click", function () {
        KS.writeKyc({ authStatus: "unverified", status: "none", rejectReason: null, stage: "face" });
        KS.clearFaceDone();
        sessionStorage.removeItem("fansloop_kyc_face_token");
        window.KycFlowNav.go("kyc-face-verify.html");
    });
    document.getElementById("btnOkContinue").addEventListener("click", function () {
        window.KycFlowNav.go("kyc-complete.html", { source: "document" });
    });

    window.addEventListener("storage", function (e) {
        if (e.key === KS.KYC_STORE) syncFromStore();
    });
})();
