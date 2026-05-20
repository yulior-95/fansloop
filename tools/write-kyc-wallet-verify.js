const fs = require("fs");
const path = require("path");
const out = path.join(__dirname, "..", "pages-web", "kyc-wallet-verify.html");
const lines = [
  "<!DOCTYPE html>",
  '<html lang="zh-CN">',
  "<head>",
  '<meta charset="UTF-8">',
  "<title>\u94b1\u5305\u9a8c\u8bc1 \u00b7 zkMe \u00b7 FansLoop</title>",
  '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">',
  '<link rel="stylesheet" href="../css-web/common-web.css">',
  '<link rel="stylesheet" href="../css-web/kyc-subpages.css">',
  "</head>",
  "<body>",
  '<motion class="kyc-lite-shell">',
];
// Use only div - build file without motion typo
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>\u94b1\u5305\u9a8c\u8bc1 \u00b7 zkMe \u00b7 FansLoop</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="../css-web/common-web.css">
<link rel="stylesheet" href="../css-web/kyc-subpages.css">
</head>
<body>
<div class="kyc-lite-shell">
    <header class="kyc-lite-top">
        <div class="brand"><span class="lg"><i class="fa-brands fa-ethereum"></i></span> zkMe \u94b1\u5305\u9a8c\u8bc1</div>
        <a id="linkBack" href="#">\u8fd4\u56de</a>
    </header>
    <main class="kyc-lite-main">
        <div class="kyc-flow-max">
            <motion id="stateConnect" class="kyc-state-panel active">
                <div class="kyc-state-center">
                    <div class="kyc-state-icon wallet"><i class="fa-solid fa-plug"></i></div>
                    <h2>\u8bf7\u8fde\u63a5\u4f60\u7684\u94b1\u5305</h2>
                    <p>\u5c06\u8c03\u7528 MetaMask \u7b49 Web3 \u94b1\u5305\u8fde\u63a5\u80fd\u529b\uff0c\u7528\u4e8e\u8bfb\u53d6\u5730\u5740\u5e76\u914d\u5408 zkMe \u751f\u6210\u9690\u79c1\u8bc1\u660e\u3002</p>
                    <button type="button" class="btn btn-primary btn-lg" id="btnConnect"><i class="fa-solid fa-wallet"></i> \u8fde\u63a5 MetaMask</button>
                </div>
            </div>
            <div id="stateProve" class="kyc-state-panel">
                <div class="kyc-state-center">
                    <div class="kyc-state-icon wait pulse"><i class="fa-solid fa-fingerprint"></i></div>
                    <h2>\u6b63\u5728\u751f\u6210\u8eab\u4efd\u8bc1\u660e\uff0c\u8bf7\u7a0d\u5019</h2>
                    <p>zkMe \u6b63\u5728\u672c\u5730\u751f\u6210\u96f6\u77e5\u8bc6\u8bc1\u660e\uff0c\u4e0d\u4f1a\u4e0a\u4f20\u4f60\u7684\u539f\u59cb\u8bc1\u4ef6\u5f71\u50cf\u3002</p>
                    <div class="kyc-wallet-chip" id="chipProve" style="display:none"><i class="fa-solid fa-circle-notch fa-spin"></i> <span></span></motion>
                </div>
            </div>
            <div id="stateVerify" class="kyc-state-panel">
                <div class="kyc-state-center">
                    <div class="kyc-state-icon wait pulse"><i class="fa-solid fa-shield-halved"></i></div>
                    <h2>\u6b63\u5728\u9a8c\u8bc1\u4f60\u7684\u8eab\u4efd\u4fe1\u606f</h2>
                    <p>Verify \u670d\u52a1\u6b63\u5728\u8fdb\u884c\u6df7\u5408\u5ba1\u6838\uff08\u673a\u5ba1 + \u4eba\u5de5\uff09\uff0c\u8bf7\u7a0d\u5019\u2026</p>
                </div>
            </div>
            <div id="stateOk" class="kyc-state-panel">
                <div class="kyc-state-center">
                    <div class="kyc-state-icon ok"><i class="fa-solid fa-circle-check"></i></div>
                    <h2>\u8eab\u4efd\u9a8c\u8bc1\u6210\u529f</h2>
                    <p>zkMe \u5df2\u786e\u8ba4\u4f60\u7684\u6709\u6548\u8eab\u4efd\u51ed\u8bc1\uff0c\u5b9e\u540d\u8ba4\u8bc1\u5df2\u5b8c\u6210\u3002</p>
                    <button type="button" class="btn btn-primary btn-lg btn-block" id="btnContinueOk"><i class="fa-solid fa-arrow-right"></i> \u7ee7\u7eed</button>
                </div>
            </div>
            <div id="stateFail" class="kyc-state-panel">
                <div class="kyc-state-center">
                    <div class="kyc-state-icon fail"><i class="fa-solid fa-circle-xmark"></i></div>
                    <h2>\u672a\u68c0\u6d4b\u5230\u6709\u6548\u7684\u8eab\u4efd\u51ed\u8bc1</h2>
                    <p>\u5f53\u524d\u94b1\u5305\u5730\u5740\u672a\u7ed1\u5b9a zkMe \u8eab\u4efd\u51ed\u8bc1\uff0c\u6216\u8bc1\u660e\u5df2\u5931\u6548\u3002\u4f60\u53ef\u91cd\u8bd5\u6216\u6539\u7528\u8bc1\u4ef6\u8ba4\u8bc1\u3002</p>
                    <div class="kyc-actions-row" style="justify-content:center;margin-top:8px">
                        <button type="button" class="btn btn-secondary" id="btnRetry"><i class="fa-solid fa-rotate-right"></i> \u91cd\u65b0\u9a8c\u8bc1</button>
                        <button type="button" class="btn btn-primary" id="btnGoDoc"><i class="fa-solid fa-id-card"></i> \u4f7f\u7528\u8bc1\u4ef6\u8ba4\u8bc1</button>
                    </div>
                </div>
            </div>
            <div class="kyc-verify-note" style="margin-top:24px">
                <strong>\u539f\u578b\u6f14\u793a\uff1a</strong>\u8fde\u63a5\u540e\u81ea\u52a8\u6a21\u62df\u5168\u6d41\u7a0b\u3002\u52a0 <code>?demo=fail</code> \u53ef\u9884\u89c8\u5931\u8d25\u6001\u3002\u540e\u53f0\u53ef\u5728\u300cKYC \u7ba1\u7406\u300d\u67e5\u770b\u6d41\u6c34\u3002
            </div>
        </div>
    </main>
    <footer class="kyc-lite-foot">Powered by zkMe \u00b7 Verify \u6df7\u5408\u5ba1\u6838</footer>
</div>
<script src="../js-web/kyc-store.js"></script>
<script src="../js-web/kyc-flow-nav.js"></script>
<script>
(function () {
    document.getElementById("linkBack").href = window.KycFlowNav.hrefWithRet("kyc-intro.html");
    var panels = ["stateConnect", "stateProve", "stateVerify", "stateOk", "stateFail"];
    var wallet = "";
    function show(id) {
        panels.forEach(function (p) {
            document.getElementById(p).classList.toggle("active", p === id);
        });
    }
    document.getElementById("btnConnect").addEventListener("click", function () {
        wallet = "0x" + Array.from({ length: 40 }, function () {
            return Math.floor(Math.random() * 16).toString(16);
        }).join("");
        show("stateProve");
        var chip = document.getElementById("chipProve");
        chip.style.display = "inline-flex";
        chip.querySelector("span").textContent = wallet.slice(0, 6) + "\u2026" + wallet.slice(-4);
        setTimeout(function () {
            show("stateVerify");
            setTimeout(function () {
                if (window.KycFlowNav.qp("demo") === "fail") {
                    window.FansloopKycStore.setZkpFailed();
                    show("stateFail");
                } else {
                    window.FansloopKycStore.setWalletSuccess(wallet);
                    show("stateOk");
                }
            }, 1800);
        }, 1600);
    });
    document.getElementById("btnContinueOk").addEventListener("click", function () {
        window.KycFlowNav.go("kyc-complete.html", { source: "wallet" });
    });
    document.getElementById("btnRetry").addEventListener("click", function () { show("stateConnect"); });
    document.getElementById("btnGoDoc").addEventListener("click", function () {
        window.KycFlowNav.go("kyc-upload-id.html");
    });
})();
</script>
</body>
</html>`;
var closeTag = "<" + "/div>";
fs.writeFileSync(out, html.replace(/<motion\b/g, "<div").replace(/<\/motion>/g, closeTag), "utf8");
console.log("wrote", out);
