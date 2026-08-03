(function (global) {
    function qp(name) {
        return new URLSearchParams(location.search).get(name) || "";
    }
    function retParam() {
        return qp("return") || "settings.html";
    }
    function hrefWithRet(path, extra) {
        var r = retParam();
        var sep = path.indexOf("?") >= 0 ? "&" : "?";
        var u = path + sep + "return=" + encodeURIComponent(r);
        if (extra) {
            Object.keys(extra).forEach(function (k) {
                u += "&" + k + "=" + encodeURIComponent(extra[k]);
            });
        }
        return u;
    }
    function go(path, extra) {
        location.href = hrefWithRet(path, extra);
    }
    function queryAuthStatus() {
        var KS = global.GoodfansKycStore;
        if (!KS) return { authStatus: "unverified", authSource: null, zkpStatus: "unknown" };
        var k = KS.readKyc();
        return {
            authStatus: k.authStatus,
            authSource: k.authSource,
            zkpStatus: k.zkpStatus,
            lastId: k.lastId,
            rejectReason: k.rejectReason
        };
    }
    global.KycFlowNav = { qp: qp, retParam: retParam, hrefWithRet: hrefWithRet, go: go, queryAuthStatus: queryAuthStatus };
})(window);
