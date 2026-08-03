/**
 * 用户资产 · 按账号隔离（余额 / KYC / 支付密码 / 安全设置）
 * 新注册用户默认为空；Luna 演示账号保留高保真数据
 */
(function (global) {
    var DEMO_UID = 'demo_uid_882910';

    function newUserAssets() {
        return {
            walletUsd: 0,
            usdtBalance: 0,
            liveUsdt: 0,
            monthlyRecharge: 0,
            monthlyWithdraw: 0,
            monthlyDelta: 0,
            kyc: {
                authStatus: 'unverified',
                status: 'none',
                zkpStatus: 'unknown'
            },
            kycAudit: [],
            payPassword: null,
            security: {
                twoFa: false,
                withdrawPwdSet: false,
                securityScore: 35
            }
        };
    }

    function lunaDemoAssets() {
        return {
            walletUsd: 5824.32,
            usdtBalance: 5816.4,
            liveUsdt: 12,
            monthlyRecharge: 1200,
            monthlyWithdraw: 640,
            monthlyDelta: 248.5,
            kyc: {
                authStatus: 'approved',
                status: 'approved',
                authSource: 'document',
                zkpStatus: 'unknown',
                walletAddress: '0x7A3F8b2C91e4F3a2C8d1E6b9F0a2D3F2C',
                lastId: 'KYC-LUNA-DEMO',
                submittedAt: '2024-03-12T08:00:00.000Z'
            },
            kycAudit: [],
            payPassword: '123456',
            security: {
                twoFa: true,
                withdrawPwdSet: true,
                securityScore: 88
            }
        };
    }

    function fanDemoAssets(usdt, live) {
        var a = newUserAssets();
        a.usdtBalance = usdt || 0;
        a.walletUsd = usdt || 0;
        a.liveUsdt = live || 0;
        a.monthlyRecharge = usdt > 0 ? 200 : 0;
        a.monthlyWithdraw = 0;
        a.monthlyDelta = 0;
        return a;
    }

    function userId() {
        if (global.GoodfansAuth && global.GoodfansAuth.getUserId) {
            return global.GoodfansAuth.getUserId();
        }
        return null;
    }

    function getAccount() {
        var uid = userId();
        if (!uid || !global.FLUserRegistry) return null;
        return global.FLUserRegistry.getByUserId(uid);
    }

    function ensureAssets(account) {
        if (!account) return null;
        if (!account.assets) {
            if (account.userId === DEMO_UID) {
                account.assets = lunaDemoAssets();
            } else if (account.isNewUser) {
                account.assets = newUserAssets();
            } else {
                account.assets = fanDemoAssets(0, 0);
            }
            global.FLUserRegistry.persistAccount(account);
        } else if (account.isNewUser) {
            var a = account.assets;
            var recharged = (a.monthlyRecharge || 0) > 0;
            if (!recharged && ((a.liveUsdt || 0) > 0 || (a.usdtBalance || 0) > 0)) {
                account.assets = Object.assign({}, a, {
                    liveUsdt: 0,
                    usdtBalance: 0,
                    walletUsd: 0
                });
                global.FLUserRegistry.persistAccount(account);
            }
        }
        return account.assets;
    }

    function assets() {
        var acc = getAccount();
        return acc ? ensureAssets(acc) : null;
    }

    function persistAssets(patch) {
        var acc = getAccount();
        if (!acc) return null;
        acc.assets = Object.assign({}, ensureAssets(acc), patch || {});
        global.FLUserRegistry.persistAccount(acc);
        try {
            global.dispatchEvent(new CustomEvent('fl-user-assets-change', { detail: acc.assets }));
        } catch (e) { /* ignore */ }
        return acc.assets;
    }

    function isNewUserAccount() {
        var acc = getAccount();
        return !!(acc && acc.isNewUser);
    }

    function getKycRaw() {
        var a = assets();
        return a ? Object.assign({}, a.kyc || newUserAssets().kyc) : { authStatus: 'unverified', status: 'none' };
    }

    function updateKyc(partial) {
        var cur = getKycRaw();
        var next = Object.assign({}, cur, partial || {});
        if (partial && partial.status && !partial.authStatus) {
            next.authStatus = partial.status === 'approved' ? 'approved' : partial.status === 'submitted' ? 'reviewing' : partial.status === 'rejected' ? 'rejected' : 'unverified';
        }
        persistAssets({ kyc: next });
        return next;
    }

    function readKycAudit() {
        var a = assets();
        return (a && a.kycAudit) ? a.kycAudit.slice() : [];
    }

    function pushKycAudit(row) {
        var list = readKycAudit();
        list.unshift(row);
        persistAssets({ kycAudit: list.slice(0, 80) });
    }

    function isKycApproved() {
        return getKycRaw().authStatus === 'approved';
    }

    function getLiveUsdt() {
        var a = assets();
        return a ? (a.liveUsdt || 0) : 0;
    }

    function setLiveUsdt(n) {
        n = Math.max(0, Math.round(Number(n) * 100) / 100);
        persistAssets({ liveUsdt: n, usdtBalance: n, walletUsd: n });
        return n;
    }

    function addLiveUsdt(delta) {
        return setLiveUsdt(getLiveUsdt() + delta);
    }

    function creditRecharge(usdt) {
        usdt = Math.max(0, Math.round(Number(usdt) * 100) / 100);
        if (!usdt) return getLiveUsdt();
        var a = assets() || newUserAssets();
        var next = getLiveUsdt() + usdt;
        persistAssets({
            liveUsdt: next,
            usdtBalance: next,
            walletUsd: next,
            monthlyRecharge: (a.monthlyRecharge || 0) + usdt
        });
        return next;
    }

    function getWalletSummary() {
        var a = assets() || newUserAssets();
        return {
            walletUsd: a.walletUsd || 0,
            usdtBalance: a.usdtBalance || 0,
            liveUsdt: a.liveUsdt || 0,
            monthlyRecharge: a.monthlyRecharge || 0,
            monthlyWithdraw: a.monthlyWithdraw || 0,
            monthlyDelta: a.monthlyDelta || 0
        };
    }

    function hasPayPassword() {
        var a = assets();
        return !!(a && a.payPassword);
    }

    function verifyPayPassword(pwd) {
        var a = assets();
        return !!(a && a.payPassword && a.payPassword === pwd);
    }

    function setPayPassword(pwd) {
        var sec = Object.assign({}, (assets() || {}).security || {}, { withdrawPwdSet: true });
        persistAssets({ payPassword: pwd, security: sec });
    }

    function clearPayPassword() {
        var sec = Object.assign({}, (assets() || {}).security || {}, { withdrawPwdSet: false });
        persistAssets({ payPassword: null, security: sec });
    }

    function getSecurity() {
        var a = assets();
        return a ? Object.assign({}, newUserAssets().security, a.security) : newUserAssets().security;
    }

    function formatUsd(n) {
        return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatUsdt(n) {
        var num = Math.round(Number(n || 0) * 100) / 100;
        return num % 1 === 0 ? String(num) : num.toFixed(2);
    }

    global.FLUserAssets = {
        DEMO_UID: DEMO_UID,
        newUserAssets: newUserAssets,
        lunaDemoAssets: lunaDemoAssets,
        ensureAssets: ensureAssets,
        getAssets: assets,
        persistAssets: persistAssets,
        isNewUserAccount: isNewUserAccount,
        getKycRaw: getKycRaw,
        updateKyc: updateKyc,
        readKycAudit: readKycAudit,
        pushKycAudit: pushKycAudit,
        isKycApproved: isKycApproved,
        getLiveUsdt: getLiveUsdt,
        setLiveUsdt: setLiveUsdt,
        addLiveUsdt: addLiveUsdt,
        creditRecharge: creditRecharge,
        getWalletSummary: getWalletSummary,
        hasPayPassword: hasPayPassword,
        verifyPayPassword: verifyPayPassword,
        setPayPassword: setPayPassword,
        clearPayPassword: clearPayPassword,
        getSecurity: getSecurity,
        formatUsd: formatUsd,
        formatUsdt: formatUsdt
    };
})(typeof window !== 'undefined' ? window : this);
