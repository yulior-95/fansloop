/**
 * FansLoop KYC 原型 · 传统证件 + zkMe 钱包隐私证明
 * authStatus: unverified | reviewing | approved | rejected
 * status (兼容): none | submitted | approved | rejected
 */
(function (global) {
    var KYC_STORE = "fansloop_kyc";
    var AUDIT_LOG = "fansloop_kyc_audit_log";
    var FACE_DONE_KEY = "fansloop_kyc_face_done";
    var AUTH_KEY = "fansloop_auth";
    var REGISTRY_KEY = "fl_user_registry_v1";
    var DEMO_USER = "Luna \uD83C\uDF19";

    function getActiveUserId() {
        if (global.FansloopAuth && global.FansloopAuth.getUserId) {
            var viaApi = global.FansloopAuth.getUserId();
            if (viaApi) return viaApi;
        }
        try {
            var auth = JSON.parse(localStorage.getItem(AUTH_KEY) || "{}");
            if (auth.loggedIn && auth.user && auth.user.userId) return auth.user.userId;
        } catch (e) { /* ignore */ }
        return null;
    }

    function readRegistryAccount(uid) {
        if (global.FLUserRegistry && global.FLUserRegistry.getByUserId) {
            return global.FLUserRegistry.getByUserId(uid);
        }
        try {
            var store = JSON.parse(localStorage.getItem(REGISTRY_KEY) || "{}");
            var emailKey = store.byUserId && store.byUserId[uid];
            if (emailKey && store.accounts && store.accounts[emailKey]) {
                return store.accounts[emailKey];
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    function persistRegistryAccount(account) {
        if (!account) return;
        if (global.FLUserRegistry && global.FLUserRegistry.persistAccount) {
            global.FLUserRegistry.persistAccount(account);
            return;
        }
        try {
            var store = JSON.parse(localStorage.getItem(REGISTRY_KEY) || "{}");
            var emailKey = account.email && store.accounts
                ? Object.keys(store.accounts).filter(function (k) {
                    return store.accounts[k] && store.accounts[k].userId === account.userId;
                })[0]
                : null;
            if (!emailKey && account.email) emailKey = String(account.email).trim().toLowerCase();
            if (emailKey) {
                if (!store.accounts) store.accounts = {};
                if (!store.byUserId) store.byUserId = {};
                store.accounts[emailKey] = account;
                store.byUserId[account.userId] = emailKey;
                localStorage.setItem(REGISTRY_KEY, JSON.stringify(store));
            }
        } catch (e) { /* ignore */ }
    }

    function defaultAccountKyc() {
        return { authStatus: "unverified", status: "none", zkpStatus: "unknown" };
    }

    function ensureAccountAssets(account) {
        if (!account) return null;
        if (global.FLUserAssets && global.FLUserAssets.ensureAssets) {
            return global.FLUserAssets.ensureAssets(account);
        }
        if (!account.assets) {
            account.assets = {
                kyc: defaultAccountKyc(),
                kycAudit: []
            };
            persistRegistryAccount(account);
        } else {
            if (!account.assets.kyc) account.assets.kyc = defaultAccountKyc();
            if (!account.assets.kycAudit) account.assets.kycAudit = [];
        }
        return account.assets;
    }

    function purgeLegacyKycStore() {
        try {
            localStorage.removeItem(KYC_STORE);
            localStorage.removeItem(AUDIT_LOG);
        } catch (e) { /* ignore */ }
    }

    function emitAssetsChange(assets) {
        try {
            global.dispatchEvent(new CustomEvent("fl-user-assets-change", { detail: assets }));
        } catch (e) { /* ignore */ }
    }

    function readRaw() {
        var uid = getActiveUserId();
        if (uid) {
            if (global.FLUserAssets && global.FLUserAssets.getKycRaw) {
                purgeLegacyKycStore();
                return global.FLUserAssets.getKycRaw() || {};
            }
            var account = readRegistryAccount(uid);
            if (account) {
                var assets = ensureAccountAssets(account);
                purgeLegacyKycStore();
                return Object.assign({}, assets.kyc || {});
            }
        }
        try {
            return JSON.parse(localStorage.getItem(KYC_STORE) || "{}");
        } catch (e) {
            return {};
        }
    }

    function authFromLegacy(status) {
        if (status === "approved") return "approved";
        if (status === "rejected") return "rejected";
        if (status === "submitted") return "reviewing";
        return "unverified";
    }

    function legacyFromAuth(auth) {
        if (auth === "approved") return "approved";
        if (auth === "rejected") return "rejected";
        if (auth === "reviewing") return "submitted";
        return "none";
    }

    function normalize(k) {
        k = k || {};
        var authStatus = k.authStatus || authFromLegacy(k.status);
        var status = k.status || legacyFromAuth(authStatus);
        return {
            authStatus: authStatus,
            status: status,
            stage: k.stage || null,
            authSource: k.authSource || null,
            zkpStatus: k.zkpStatus || "unknown",
            lastId: k.lastId || null,
            rejectReason: k.rejectReason || null,
            walletAddress: k.walletAddress || null,
            country: k.country || null,
            idType: k.idType || null,
            submittedAt: k.submittedAt || null,
            idCardFront: k.idCardFront || null,
            idCardBack: k.idCardBack || null,
            faceSnapshot: k.faceSnapshot || null
        };
    }

    function readKyc() {
        return normalize(readRaw());
    }

    function writeKyc(partial) {
        partial = partial || {};
        var uid = getActiveUserId();
        if (uid) {
            if (global.FLUserAssets && global.FLUserAssets.updateKyc) {
                global.FLUserAssets.updateKyc(partial);
                purgeLegacyKycStore();
                return;
            }
            var account = readRegistryAccount(uid);
            if (account) {
                var assets = ensureAccountAssets(account);
                var next = Object.assign({}, assets.kyc || {}, partial);
                if (partial.status && !partial.authStatus) {
                    next.authStatus = authFromLegacy(partial.status);
                }
                if (partial.authStatus && !partial.status) {
                    next.status = legacyFromAuth(partial.authStatus);
                }
                if (!next.authStatus) next.authStatus = authFromLegacy(next.status);
                next.status = legacyFromAuth(next.authStatus);
                account.assets = Object.assign({}, assets, { kyc: next });
                persistRegistryAccount(account);
                purgeLegacyKycStore();
                emitAssetsChange(account.assets);
                return;
            }
        }
        var o = readRaw();
        if (partial.status && !partial.authStatus) {
            partial.authStatus = authFromLegacy(partial.status);
        }
        if (partial.authStatus && !partial.status) {
            partial.status = legacyFromAuth(partial.authStatus);
        }
        Object.assign(o, partial);
        if (!o.authStatus) o.authStatus = authFromLegacy(o.status);
        o.status = legacyFromAuth(o.authStatus);
        localStorage.setItem(KYC_STORE, JSON.stringify(o));
    }

    function auditRow(opts) {
        var now = new Date().toLocaleString("zh-CN");
        return {
            id: opts.id,
            time: opts.time || now,
            user: opts.user || DEMO_USER,
            channel: opts.channel || "KYC",
            pipeline: opts.pipeline || "Verify",
            status: opts.status || "\u2014",
            note: opts.note || ""
        };
    }

    function pushAudit(row) {
        var entry = row.time ? row : auditRow({
            id: row.id,
            time: row.at ? new Date(row.at).toLocaleString("zh-CN") : undefined,
            user: row.user,
            channel: row.channel,
            pipeline: row.pipeline,
            status: row.status,
            note: row.note || row.reason || row.action || ""
        });
        if (global.FLUserAssets && global.FLUserAssets.pushKycAudit) {
            global.FLUserAssets.pushKycAudit(entry);
            purgeLegacyKycStore();
            return;
        }
        var uid = getActiveUserId();
        if (uid) {
            var account = readRegistryAccount(uid);
            if (account) {
                var assets = ensureAccountAssets(account);
                var list = (assets.kycAudit || []).slice();
                list.unshift(entry);
                account.assets = Object.assign({}, assets, { kycAudit: list.slice(0, 80) });
                persistRegistryAccount(account);
                purgeLegacyKycStore();
                emitAssetsChange(account.assets);
                return;
            }
        }
        var a = readAuditLog();
        a.unshift(entry);
        localStorage.setItem(AUDIT_LOG, JSON.stringify(a.slice(0, 80)));
    }

    function writeAuditLog(list) {
        localStorage.setItem(AUDIT_LOG, JSON.stringify(list.slice(0, 80)));
    }

    function isApproved() {
        return readKyc().authStatus === "approved";
    }

    function isReviewing() {
        return readKyc().authStatus === "reviewing";
    }

    function setWalletSuccess(address) {
        var id = "ZKME-" + Date.now();
        writeKyc({
            authStatus: "approved",
            authSource: "wallet",
            zkpStatus: "success",
            walletAddress: address || null,
            lastId: id,
            rejectReason: null,
            stage: null,
            submittedAt: new Date().toISOString()
        });
        pushAudit({
            id: id,
            user: "\u7cfb\u7edf",
            channel: "KYC \u00b7 zkMe",
            pipeline: "zkMe",
            status: "\u9a8c\u8bc1\u901a\u8fc7",
            note: "\u94b1\u5305\u9690\u79c1\u8bc1\u660e\u9a8c\u8bc1\u6210\u529f" + (address ? " \u00b7 " + address.slice(0, 10) + "\u2026" : "")
        });
        try {
            if (global.AdminKycAuditStore && global.AdminKycAuditStore.pushFromUserSubmit) {
                var wOpts = {
                    applicationId: id,
                    method: "wallet",
                    walletAddress: address,
                    deviceName: typeof navigator !== "undefined" ? String(navigator.userAgent).slice(0, 48) : "Web"
                };
                var wAcc = getActiveUserId() && global.FLUserRegistry && global.FLUserRegistry.getByUserId
                  ? global.FLUserRegistry.getByUserId(getActiveUserId()) : null;
                if (wAcc && wAcc.publicUid) wOpts.uid = wAcc.publicUid;
                var wRec = global.AdminKycAuditStore.pushFromUserSubmit(wOpts);
                global.AdminKycAuditStore.review(wRec.id, "approve", "zkMe 钱包隐私证明自动通过", "system");
            }
        } catch (e) { /* ignore */ }
        return id;
    }

    function setZkpFailed() {
        writeKyc({ zkpStatus: "failed" });
    }

    function submitDocument(payload) {
        var id = "KYC-" + Date.now();
        var imgs = {
            idCardFront: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
            idCardBack: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
            faceSnapshot: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
        };
        writeKyc(Object.assign({
            authStatus: "reviewing",
            authSource: "document",
            zkpStatus: readKyc().zkpStatus || "unknown",
            lastId: id,
            rejectReason: null,
            stage: "verify",
            submittedAt: new Date().toISOString()
        }, imgs, payload || {}));
        pushAudit({
            id: id,
            channel: "KYC",
            pipeline: "Verify",
            status: "\u5f85\u5ba1\u6838",
            note: "\u8bc1\u4ef6 + \u4eba\u8138\u5df2\u63d0\u4ea4\uff0c\u7b49\u5f85 Verify \u6df7\u5408\u5ba1\u6838"
        });
        try {
            var pushOpts = {
                applicationId: id,
                method: "document",
                country: (payload && payload.country) || null,
                idType: (payload && payload.idType) || null,
                idCardFront: imgs.idCardFront,
                idCardBack: imgs.idCardBack,
                faceSnapshot: imgs.faceSnapshot
            };
            if (global.AdminKycAuditStore && global.AdminKycAuditStore.pushFromUserSubmit) {
                global.AdminKycAuditStore.pushFromUserSubmit(pushOpts);
            } else if (global.FLUserRegistry) {
                var uid = getActiveUserId();
                var acc = uid && global.FLUserRegistry.getByUserId ? global.FLUserRegistry.getByUserId(uid) : null;
                if (acc && acc.publicUid) pushOpts.uid = acc.publicUid;
                var raw = localStorage.getItem("fl_admin_kyc_audit_v1");
                var list = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(list)) list = [];
                list.unshift({
                    id: id,
                    uid: pushOpts.uid || "000000",
                    realName: "—",
                    status: "待审核",
                    deviceName: typeof navigator !== "undefined" ? String(navigator.userAgent).slice(0, 48) : "Web",
                    deviceId: "WEB-" + Date.now().toString(36).toUpperCase(),
                    ip: "—",
                    region: "—",
                    registeredAt: null,
                    submittedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
                    reviewedAt: null,
                    source: "user",
                    method: "document",
                    country: pushOpts.country,
                    idType: pushOpts.idType,
                    remark: ""
                });
                localStorage.setItem("fl_admin_kyc_audit_v1", JSON.stringify(list.slice(0, 200)));
            }
        } catch (e) { /* ignore */ }
        return id;
    }

    function setDocumentApproved(note) {
        writeKyc({ authStatus: "approved", rejectReason: null, stage: null });
        pushAudit({
            id: (readKyc().lastId || "KYC") + "-V",
            user: "\u7cfb\u7edf",
            channel: "KYC",
            pipeline: "Verify",
            status: "\u5ba1\u6838\u901a\u8fc7",
            note: note || "Verify \u56de\u4f20\uff1a\u8ba4\u8bc1\u901a\u8fc7"
        });
    }

    function setDocumentRejected(reason) {
        var r = reason || "\u8ba4\u8bc1\u672a\u901a\u8fc7";
        writeKyc({ authStatus: "rejected", rejectReason: r, stage: null });
        pushAudit({
            id: (readKyc().lastId || "KYC") + "-V",
            user: "\u7cfb\u7edf",
            channel: "KYC",
            pipeline: "Verify",
            status: "\u5ba1\u6838\u672a\u901a\u8fc7",
            note: r
        });
    }

    function setFaceDone(token, snapshot, extra) {
        extra = extra || {};
        var payload = {
            token: token || null,
            at: Date.now(),
            snapshot: snapshot || null,
            passed: extra.passed !== false,
            reason: extra.reason || null
        };
        localStorage.setItem(FACE_DONE_KEY, JSON.stringify(payload));
        try {
            global.dispatchEvent(new CustomEvent("fansloop-kyc-face-done", { detail: payload }));
        } catch (e) {}
        return payload;
    }

    function readFaceDone() {
        try {
            return JSON.parse(localStorage.getItem(FACE_DONE_KEY) || "null");
        } catch (e) {
            return null;
        }
    }

    function clearFaceDone() {
        localStorage.removeItem(FACE_DONE_KEY);
    }

    function resetKyc() {
        var uid = getActiveUserId();
        if (uid) {
            if (global.FLUserAssets && global.FLUserAssets.updateKyc) {
                global.FLUserAssets.updateKyc({ authStatus: "unverified", status: "none" });
                global.FLUserAssets.persistAssets({ kycAudit: [] });
            } else {
                var account = readRegistryAccount(uid);
                if (account) {
                    var assets = ensureAccountAssets(account);
                    account.assets = Object.assign({}, assets, {
                        kyc: defaultAccountKyc(),
                        kycAudit: []
                    });
                    persistRegistryAccount(account);
                    emitAssetsChange(account.assets);
                }
            }
            purgeLegacyKycStore();
            clearFaceDone();
            return;
        }
        localStorage.removeItem(KYC_STORE);
        localStorage.removeItem(AUDIT_LOG);
        clearFaceDone();
    }

    function readAuditLog() {
        if (global.FLUserAssets && global.FLUserAssets.readKycAudit) {
            return global.FLUserAssets.readKycAudit();
        }
        var uid = getActiveUserId();
        if (uid) {
            var account = readRegistryAccount(uid);
            if (account) {
                var assets = ensureAccountAssets(account);
                return (assets.kycAudit || []).slice();
            }
        }
        try {
            return JSON.parse(localStorage.getItem(AUDIT_LOG) || "[]");
        } catch (e) {
            return [];
        }
    }

    /** 设置页 / 入口页：根据状态返回目标路径 */
    function routeForEntry() {
        var k = readKyc();
        if (k.authStatus === "approved") return "kyc-complete.html";
        if (k.authStatus === "reviewing") return "kyc-doc-pending.html";
        return "kyc-intro.html";
    }

    global.FansloopKycStore = {
        KYC_STORE: KYC_STORE,
        AUDIT_LOG: AUDIT_LOG,
        getActiveUserId: getActiveUserId,
        readKyc: readKyc,
        writeKyc: writeKyc,
        writeAuditLog: writeAuditLog,
        isApproved: isApproved,
        isReviewing: isReviewing,
        setWalletSuccess: setWalletSuccess,
        setZkpFailed: setZkpFailed,
        submitDocument: submitDocument,
        setDocumentApproved: setDocumentApproved,
        setDocumentRejected: setDocumentRejected,
        resetKyc: resetKyc,
        setFaceDone: setFaceDone,
        readFaceDone: readFaceDone,
        clearFaceDone: clearFaceDone,
        FACE_DONE_KEY: FACE_DONE_KEY,
        readAuditLog: readAuditLog,
        pushAudit: pushAudit,
        routeForEntry: routeForEntry
    };
})(window);
