/**
 * FansLoop KYC 原型：与 pages-web / admin-prototype 共用 localStorage
 */
(function (global) {
    var KYC_STORE = "fansloop_kyc";
    var AUDIT_LOG = "fansloop_kyc_audit_log";

    function readKyc() {
        try {
            return JSON.parse(localStorage.getItem(KYC_STORE) || "{}");
        } catch (e) {
            return {};
        }
    }

    function writeKyc(partial) {
        var o = readKyc();
        Object.assign(o, partial);
        localStorage.setItem(KYC_STORE, JSON.stringify(o));
    }

    function readAuditLog() {
        try {
            return JSON.parse(localStorage.getItem(AUDIT_LOG) || "[]");
        } catch (e) {
            return [];
        }
    }

    function writeAuditLog(arr) {
        localStorage.setItem(AUDIT_LOG, JSON.stringify(arr));
    }

    function pushAudit(row) {
        var a = readAuditLog();
        a.unshift(row);
        writeAuditLog(a.slice(0, 80));
    }

    global.FansloopKycStore = {
        KYC_STORE: KYC_STORE,
        AUDIT_LOG: AUDIT_LOG,
        readKyc: readKyc,
        writeKyc: writeKyc,
        readAuditLog: readAuditLog,
        writeAuditLog: writeAuditLog,
        pushAudit: pushAudit
    };
})(window);
