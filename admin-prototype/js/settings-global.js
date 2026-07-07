(function () {
  var CFG = window.AdminNavConfig;
  if (!CFG) return;

  var IC_CLS = ["", "amber", "green", "purple", ""];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderCards(pages, mountId) {
    var mount = document.getElementById(mountId);
    if (!mount) return;
    mount.innerHTML = pages.map(function (p, i) {
      var icCls = IC_CLS[i % IC_CLS.length];
      return (
        '<a class="sg-card" href="' + esc(p.href) + '" style="text-decoration:none;color:inherit">' +
        '<div class="sg-card-head">' +
        '<div class="sg-card-ic' + (icCls ? " " + icCls : "") + '"><i class="fa-solid ' + esc(p.icon) + '"></i></div>' +
        "<div><h3>" + esc(p.label) + "</h3></div></div>" +
        "<p>" + esc(p.desc) + "</p>" +
        '<div class="sg-card-meta">' + esc(p.api || "") + "</div>" +
        '<div class="sg-card-foot"><span class="ant-tag ant-tag-blue">全局配置</span>' +
        '<span style="font-size:13px;color:#1677ff">进入配置 <i class="fa-solid fa-arrow-right"></i></span></div>' +
        "</a>"
      );
    }).join("");
  }

  var assetPages = CFG.globalParamPages.filter(function (p) {
    return p.key === "risk-usdt-limits" || p.key === "network-fees" || p.key === "creator-income-split";
  });
  var pointsPages = CFG.globalParamPages.filter(function (p) {
    return p.key === "risk-limits" || p.key === "activities-points-tier" || p.key === "activities-points-types";
  });
  var kycPages = CFG.globalParamPages.filter(function (p) {
    return p.key === "risk-kyc-face";
  });

  renderCards(assetPages, "sgAssetMount");
  renderCards(pointsPages, "sgPointsMount");
  renderCards(kycPages, "sgKycMount");

  var NAV_FROM_KEY = "fl_admin_nav_from_v1";
  document.addEventListener("click", function (e) {
    var card = e.target.closest("a.sg-card");
    if (!card) return;
    try {
      sessionStorage.setItem(NAV_FROM_KEY, "settings-global");
    } catch (err) { /* ignore */ }
  });
})();
