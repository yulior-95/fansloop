/**
 * 运营后台 · KYC 机审全局参数（人脸匹配分值阈值）
 */
(function (global) {
  var LS_KEY = "fl_admin_kyc_config_v1";

  var DEFAULT = {
    autoPassScore: 85,
    manualReviewScore: 60
  };

  function read() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var cfg = JSON.parse(raw);
        return {
          autoPassScore: Number(cfg.autoPassScore),
          manualReviewScore: Number(cfg.manualReviewScore)
        };
      }
    } catch (e) { /* ignore */ }
    return Object.assign({}, DEFAULT);
  }

  function write(cfg) {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        autoPassScore: Number(cfg.autoPassScore),
        manualReviewScore: Number(cfg.manualReviewScore)
      })
    );
  }

  function validate(cfg) {
    cfg = cfg || read();
    var autoPass = Number(cfg.autoPassScore);
    var manual = Number(cfg.manualReviewScore);
    if (isNaN(autoPass) || autoPass < 0 || autoPass > 100) {
      return "直接通过分数须在 0–100 之间";
    }
    if (isNaN(manual) || manual < 0 || manual > 100) {
      return "人工审核分数须在 0–100 之间";
    }
    if (autoPass <= manual) {
      return "直接通过分数须大于人工审核分数（高分为自动通过，中间区间转人工）";
    }
    return "";
  }

  /**
   * @returns {'pass'|'manual'|'reject'|'api_error'}
   */
  function evaluateFaceScore(score) {
    if (score == null || score === "" || isNaN(Number(score))) return "api_error";
    var s = Number(score);
    var cfg = read();
    if (s >= cfg.autoPassScore) return "pass";
    if (s >= cfg.manualReviewScore) return "manual";
    return "reject";
  }

  function formatScore(score) {
    if (score == null || isNaN(Number(score))) return "—";
    return Number(score).toFixed(1);
  }

  function ruleSummary(cfg) {
    cfg = cfg || read();
    return (
      "分值 ≥ " +
      cfg.autoPassScore +
      " 机审直接通过；" +
      cfg.manualReviewScore +
      " ≤ 分值 < " +
      cfg.autoPassScore +
      " 转人工审核；分值 < " +
      cfg.manualReviewScore +
      " 机审自动驳回"
    );
  }

  global.AdminKycConfigStore = {
    LS_KEY: LS_KEY,
    DEFAULT: DEFAULT,
    read: read,
    write: write,
    validate: validate,
    evaluateFaceScore: evaluateFaceScore,
    formatScore: formatScore,
    ruleSummary: ruleSummary
  };
})(typeof window !== "undefined" ? window : this);
