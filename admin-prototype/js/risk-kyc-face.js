(function () {
  var Store = window.AdminKycConfigStore;
  var M = window.AdminModal;
  if (!Store || !M) return;

  var inpAuto = document.getElementById("kycAutoPassScore");
  var inpManual = document.getElementById("kycManualReviewScore");
  var preview = document.getElementById("kycFaceRulePreview");
  var errEl = document.getElementById("kycFaceErr");
  var btnSave = document.getElementById("kycFaceSave");

  function refreshPreview() {
    var cfg = {
      autoPassScore: inpAuto ? inpAuto.value : Store.DEFAULT.autoPassScore,
      manualReviewScore: inpManual ? inpManual.value : Store.DEFAULT.manualReviewScore
    };
    if (preview) preview.textContent = Store.ruleSummary(cfg);
    if (errEl) errEl.textContent = Store.validate(cfg);
  }

  function load() {
    var cfg = Store.read();
    if (inpAuto) inpAuto.value = cfg.autoPassScore;
    if (inpManual) inpManual.value = cfg.manualReviewScore;
    refreshPreview();
  }

  if (inpAuto) inpAuto.addEventListener("input", refreshPreview);
  if (inpManual) inpManual.addEventListener("input", refreshPreview);

  if (btnSave) {
    btnSave.addEventListener("click", function () {
      var cfg = {
        autoPassScore: inpAuto ? inpAuto.value : Store.DEFAULT.autoPassScore,
        manualReviewScore: inpManual ? inpManual.value : Store.DEFAULT.manualReviewScore
      };
      var err = Store.validate(cfg);
      if (errEl) errEl.textContent = err;
      if (err) return;

      M.confirmGoogle({
        title: "保存 KYC 人脸匹配参数",
        message: Store.ruleSummary(cfg) + "\n\n将影响新机审分流判定，请输入谷歌验证码确认。",
        onVerified: function () {
          Store.write(cfg);
          M.notify("KYC 人脸匹配参数已保存", "success");
          refreshPreview();
        }
      });
    });
  }

  load();
})();
