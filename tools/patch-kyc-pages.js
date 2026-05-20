const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "pages-web");
const closeDiv = "<" + "/div>";

function fix(html) {
    return html.replace(/<motion\b/g, "<div").replace(/<\/motion>/g, closeDiv);
}

const pages = {
    "kyc-doc-pending.html": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>审核中 · KYC · FansLoop</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="../css-web/common-web.css">
<link rel="stylesheet" href="../css-web/kyc-subpages.css">
</head>
<body>
<div class="kyc-lite-shell">
    <header class="kyc-lite-top">
        <div class="brand"><span class="lg"><i class="fa-solid fa-hourglass-half"></i></span> 审核中</div>
        <a id="linkBack" href="#">查看状态</a>
    </header>
    <main class="kyc-lite-main">
        <div class="kyc-flow-max">
            <div class="kyc-step-bar">
                <div class="step done">1</div><div class="step done">2</motion><motion class="step done">3</div>
                <div class="step on">4 审核</div><div class="step">5</div>
            </div>
            <div class="kyc-state-center" style="padding-top:28px">
                <div class="kyc-state-icon wait pulse"><i class="fa-solid fa-spinner"></i></div>
                <h2>资料已提交，正在审核，请稍候</h2>
                <p>Verify 正在进行机审与人工混合审核。完成后将通过状态查询接口更新结果，你无需在平台侧进行人工操作。</p>
                <div class="kyc-meta-grid card" style="padding:14px 16px;margin-top:20px">
                    <div>申请单号 <span id="metaId">—</span></div>
                    <div>认证来源 <span>证件认证</span></div>
                    <div>当前状态 <span style="color:#FCD34D">审核中</span></div>
                </div>
                <a class="btn btn-secondary btn-block" style="margin-top:18px" id="btnStatus" href="#"><i class="fa-solid fa-signal"></i> 前往认证状态页</a>
                <p style="font-size:11px;color:var(--t-tertiary);margin-top:16px">原型演示：模拟 Verify 回调结果</p>
                <div class="kyc-actions-row" style="margin-top:10px">
                    <button type="button" class="btn btn-primary btn-sm" id="btnSimOk">模拟审核通过</button>
                    <button type="button" class="btn btn-secondary btn-sm" id="btnSimFail">模拟审核未通过</button>
                </div>
            </div>
        </div>
    </main>
    <footer class="kyc-lite-foot">结果将同步至设置页与提现门槛校验</footer>
</div>
<script src="../js-web/kyc-store.js"></script>
<script src="../js-web/kyc-flow-nav.js"></script>
<script>
(function () {
    var k = window.FansloopKycStore.readKyc();
    document.getElementById("metaId").textContent = k.lastId || "—";
    document.getElementById("btnStatus").href = window.KycFlowNav.hrefWithRet("kyc-status.html");
    document.getElementById("linkBack").href = window.KycFlowNav.hrefWithRet("kyc-status.html");
    document.getElementById("btnSimOk").addEventListener("click", function () {
        window.FansloopKycStore.setDocumentApproved();
        window.KycFlowNav.go("kyc-complete.html", { source: "document" });
    });
    document.getElementById("btnSimFail").addEventListener("click", function () {
        window.FansloopKycStore.setDocumentRejected("证件人像不清晰，请重新拍摄后提交。");
        window.KycFlowNav.go("kyc-doc-result.html", { outcome: "fail" });
    });
})();
</script>
</body>
</html>`,

    "kyc-doc-result.html": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>认证结果 · KYC · FansLoop</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="../css-web/common-web.css">
<link rel="stylesheet" href="../css-web/kyc-subpages.css">
</head>
<body>
<div class="kyc-lite-shell">
    <header class="kyc-lite-top">
        <div class="brand"><span class="lg"><i class="fa-solid fa-clipboard-check"></i></span> 认证结果</div>
        <a id="linkBack" href="#">返回</a>
    </header>
    <main class="kyc-lite-main">
        <div class="kyc-flow-max">
            <div id="panelOk" class="kyc-state-panel" style="display:none">
                <div class="kyc-state-center">
                    <div class="kyc-state-icon ok"><i class="fa-solid fa-circle-check"></i></div>
                    <h2>认证已通过</h2>
                    <button type="button" class="btn btn-primary btn-lg btn-block" id="btnOkContinue"><i class="fa-solid fa-arrow-right"></i> 继续</button>
                </div>
            </div>
            <div id="panelFail" class="kyc-state-panel" style="display:none">
                <div class="kyc-state-center">
                    <div class="kyc-state-icon fail"><i class="fa-solid fa-circle-xmark"></i></div>
                    <h2>认证未通过，请重新提交资料</h2>
                    <p id="failReason" style="font-size:13px;color:var(--t-secondary)"></p>
                    <div class="kyc-actions-row" style="justify-content:center;margin-top:12px">
                        <button type="button" class="btn btn-primary" id="btnRetry"><i class="fa-solid fa-rotate-right"></i> 重新认证</button>
                        <a class="btn btn-secondary" href="help.html"><i class="fa-solid fa-headset"></i> 联系客服</a>
                    </div>
                </div>
            </div>
        </div>
    </main>
</div>
<script src="../js-web/kyc-store.js"></script>
<script src="../js-web/kyc-flow-nav.js"></script>
<script>
(function () {
    document.getElementById("linkBack").href = window.KycFlowNav.hrefWithRet("kyc-intro.html");
    var outcome = window.KycFlowNav.qp("outcome");
    var k = window.FansloopKycStore.readKyc();
    if (outcome === "fail" || k.authStatus === "rejected") {
        document.getElementById("panelFail").style.display = "block";
        document.getElementById("failReason").textContent = k.rejectReason || "";
    } else {
        document.getElementById("panelOk").style.display = "block";
    }
    document.getElementById("btnOkContinue").addEventListener("click", function () {
        window.KycFlowNav.go("kyc-complete.html", { source: "document" });
    });
    document.getElementById("btnRetry").addEventListener("click", function () {
        window.KycFlowNav.go("kyc-upload-id.html");
    });
})();
</script>
</body>
</html>`,

    "kyc-complete.html": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>身份认证已完成 · FansLoop</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="../css-web/common-web.css">
<link rel="stylesheet" href="../css-web/kyc-subpages.css">
</head>
<body>
<div class="kyc-lite-shell">
    <header class="kyc-lite-top">
        <div class="brand"><span class="lg"><i class="fa-solid fa-circle-check"></i></span> 认证完成</div>
        <a id="linkBack" href="#">返回</a>
    </header>
    <main class="kyc-lite-main">
        <div class="kyc-flow-max">
            <div class="kyc-complete-hero">
                <div class="ic"><i class="fa-solid fa-shield-halved"></i></div>
                <h1 style="margin:0 0 10px;font-size:24px;font-weight:800">身份认证已完成</h1>
                <p style="margin:0 auto 24px;max-width:400px;font-size:14px;color:var(--t-secondary);line-height:1.65">你现在可以正常使用平台全部功能</p>
                <div class="kyc-meta-grid card" style="padding:14px 18px;max-width:360px;margin:0 auto 22px">
                    <div>认证方式 <span id="metaSource">—</span></div>
                    <motion>隐私证明 <span id="metaZkp">—</span></div>
                </div>
                <button type="button" class="btn btn-primary btn-lg" id="btnContinue"><i class="fa-solid fa-arrow-right"></i> 继续</button>
            </div>
        </div>
    </main>
    <footer class="kyc-lite-foot">提现等受控操作将自动放行</footer>
</div>
<script src="../js-web/kyc-store.js"></script>
<script src="../js-web/kyc-flow-nav.js"></script>
<script>
(function () {
    var ret = window.KycFlowNav.retParam();
    document.getElementById("linkBack").href = ret || "settings.html";
    var k = window.FansloopKycStore.readKyc();
    var src = window.KycFlowNav.qp("source") || k.authSource || "";
    document.getElementById("metaSource").textContent = src === "wallet" ? "钱包验证 (zkMe)" : src === "document" ? "证件认证" : "—";
    document.getElementById("metaZkp").textContent = k.zkpStatus === "success" ? "成功" : k.zkpStatus === "failed" ? "失败" : "未知";
    document.getElementById("btnContinue").addEventListener("click", function () {
        location.href = ret || "settings.html";
    });
})();
</script>
</body>
</html>`
};

Object.keys(pages).forEach(function (name) {
    fs.writeFileSync(path.join(dir, name), fix(pages[name]), "utf8");
    console.log("wrote", name);
});
