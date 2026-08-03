# -*- coding: utf-8 -*-
import pathlib
p = pathlib.Path(__file__).resolve().parent.parent / "pages-web" / "kyc-upload-id.html"
html = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>证件认证 · KYC · GOODFANS</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="../css-web/common-web.css">
<link rel="stylesheet" href="../css-web/kyc-subpages.css">
</head>
<body>
<div class="kyc-lite-shell">
    <header class="kyc-lite-top">
        <div class="brand"><span class="lg"><i class="fa-solid fa-id-card"></i></span> 证件认证</div>
        <a id="linkBack" href="#">返回</a>
    </header>
    <main class="kyc-lite-main">
        <motion class="kyc-flow-max">
            <div class="kyc-step-bar">
                <div class="step on" id="bar1">1 地区</div>
                <div class="step" id="bar2">2 证件</div>
                <div class="step" id="bar3">3 人脸</div>
                <div class="step" id="bar4">4 审核</div>
                <div class="step" id="bar5">5 结果</div>
            </div>
            <section id="stepCountry" class="kyc-state-panel active">
                <h1 style="font-size:20px;font-weight:800;margin:0 0 8px">选择国家或地区</h1>
                <p style="font-size:13px;color:var(--t-secondary);margin:0 0 20px">请选择证件签发国家/地区。</p>
                <div class="kyc-field">
                    <label for="selCountry">国家或地区</label>
                    <select id="selCountry">
                        <option value="">请选择</option>
                        <option value="CN">中国（大陆）</option>
                        <option value="HK">中国香港</option>
                        <option value="TW">中国台湾</option>
                        <option value="US">美国</option>
                        <option value="SG">新加坡</option>
                        <option value="JP">日本</option>
                    </select>
                </div>
                <button type="button" class="btn btn-primary btn-block btn-lg" id="btnToUpload" disabled><i class="fa-solid fa-arrow-right"></i> 下一步：上传证件</button>
            </section>
            <section id="stepUpload" class="kyc-state-panel">
                <h1 style="font-size:20px;font-weight:800;margin:0 0 8px">上传证件</h1>
                <p style="font-size:13px;color:var(--t-secondary);margin:0 0 16px;line-height:1.55">请确保证件边框完整、文字清晰。点击示意区域模拟本机选择。</p>
                <div class="kyc-field">
                    <label for="selIdType">证件类型</label>
                    <select id="selIdType">
                        <option value="id_card">居民身份证</option>
                        <option value="passport">护照</option>
                        <option value="driver">驾驶证</option>
                    </select>
                </div>
                <div class="kyc-upload-lg">
                    <div class="tile" id="tileFront" role="button" tabindex="0">
                        <img src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=85" alt="证件正面" />
                        <div class="lbl"><i class="fa-regular fa-id-card"></i> 上传证件正面</div>
                    </div>
                    <div class="tile" id="tileBack" role="button" tabindex="0">
                        <img src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=85" alt="证件反面" />
                        <div class="lbl"><i class="fa-solid fa-landmark"></i> 上传证件反面</div>
                    </div>
                </div>
                <button type="button" class="btn btn-primary btn-block btn-lg" id="btnToFace" disabled><i class="fa-solid fa-arrow-right"></i> 下一步：人脸识别</button>
            </section>
        </div>
    </main>
    <footer class="kyc-lite-foot">示意图源：Unsplash</footer>
</div>
<script src="../js-web/kyc-flow-nav.js"></script>
<script>
(function () {
    document.getElementById("linkBack").href = window.KycFlowNav.hrefWithRet("kyc-intro.html");
    var country = "", f = false, b = false;
    function setBar(n) {
        for (var i = 1; i <= 5; i++) {
            var el = document.getElementById("bar" + i);
            el.classList.remove("on", "done");
            if (i < n) el.classList.add("done");
            if (i === n) el.classList.add("on");
        }
    }
    function showStep(id, barN) {
        document.getElementById("stepCountry").classList.toggle("active", id === "stepCountry");
        document.getElementById("stepUpload").classList.toggle("active", id === "stepUpload");
        setBar(barN);
    }
    document.getElementById("selCountry").addEventListener("change", function () {
        country = this.value;
        document.getElementById("btnToUpload").disabled = !country;
    });
    document.getElementById("btnToUpload").addEventListener("click", function () { showStep("stepUpload", 2); });
    function syncUpload() { document.getElementById("btnToFace").disabled = !(f && b); }
    document.getElementById("tileFront").addEventListener("click", function () { f = true; this.classList.add("ok"); syncUpload(); });
    document.getElementById("tileBack").addEventListener("click", function () { b = true; this.classList.add("ok"); syncUpload(); });
    document.getElementById("btnToFace").addEventListener("click", function () {
        sessionStorage.setItem("goodfans_kyc_draft", JSON.stringify({ country: country, idType: document.getElementById("selIdType").value }));
        window.KycFlowNav.go("kyc-face-verify.html");
    });
})();
</script>
</body>
</html>
'''
html = html.replace('<motion', '<div').replace('</motion>', '</div>')
p.write_text(html, encoding='utf-8')
print('ok', p)
