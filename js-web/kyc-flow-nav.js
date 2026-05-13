(function (global) {
    function qp(name) {
        return new URLSearchParams(location.search).get(name) || "";
    }
    function retParam() {
        return qp("return") || "settings.html";
    }
    function hrefWithRet(path) {
        var r = retParam();
        var sep = path.indexOf("?") >= 0 ? "&" : "?";
        return path + sep + "return=" + encodeURIComponent(r);
    }
    global.KycFlowNav = { qp: qp, retParam: retParam, hrefWithRet: hrefWithRet };
})(window);
