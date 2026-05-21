(function (global) {
    function ensure() {
        var el = document.getElementById("kycGlobalToast");
        if (el) return el;
        el = document.createElement("div");
        el.id = "kycGlobalToast";
        el.className = "kyc-global-toast";
        el.setAttribute("role", "alert");
        document.body.appendChild(el);
        return el;
    }
    global.KycToast = {
        show: function (msg, type) {
            var el = ensure();
            el.textContent = msg;
            el.className = "kyc-global-toast show" + (type === "error" ? " is-error" : type === "ok" ? " is-ok" : "");
            clearTimeout(el._t);
            el._t = setTimeout(function () {
                el.classList.remove("show");
            }, 4200);
        }
    };
})(window);
