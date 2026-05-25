/**
 * 发布门槛 · KYC 通过即视为可发布创作者（与 fl_creator_cert_v1 同步）
 */
(function (global) {
    var KYC_STORE = 'fansloop_kyc';
    var CREATOR_STORE = 'fl_creator_cert_v1';

    function readKyc() {
        if (global.FansloopKycStore) {
            return global.FansloopKycStore.readKyc();
        }
        try {
            return JSON.parse(localStorage.getItem(KYC_STORE) || '{}');
        } catch (e) {
            return {};
        }
    }

    function writeKyc(partial) {
        if (global.FansloopKycStore) {
            global.FansloopKycStore.writeKyc(partial);
            return;
        }
        try {
            var o = JSON.parse(localStorage.getItem(KYC_STORE) || '{}');
            Object.assign(o, partial);
            localStorage.setItem(KYC_STORE, JSON.stringify(o));
        } catch (e) { /* ignore */ }
    }

    function readCreator() {
        try {
            return JSON.parse(localStorage.getItem(CREATOR_STORE) || '{"status":"none"}');
        } catch (e) {
            return { status: 'none' };
        }
    }

    function writeCreator(state) {
        try {
            localStorage.setItem(CREATOR_STORE, JSON.stringify(state));
        } catch (e) { /* ignore */ }
    }

    function applyUrlOverrides() {
        var params = new URLSearchParams(global.location.search);
        if (params.get('kyc') === 'approved') {
            writeKyc({ status: 'approved', authStatus: 'approved' });
        }
        if (params.get('creator') === 'approved') {
            writeCreator({ status: 'approved', type: 'photo' });
        }
        if (params.get('reset') === '1') {
            if (params.get('creator') === 'none' || !params.get('creator')) {
                writeCreator({ status: 'none', type: '' });
            }
            if (!params.get('kyc') && global.FansloopKycStore && global.FansloopKycStore.resetKyc) {
                global.FansloopKycStore.resetKyc();
            } else if (!params.get('kyc')) {
                try {
                    localStorage.removeItem(KYC_STORE);
                } catch (e) { /* ignore */ }
            }
        }
    }

    function isKycApproved() {
        applyUrlOverrides();
        var k = readKyc();
        return k.status === 'approved' || k.authStatus === 'approved';
    }

    function isKycReviewing() {
        var k = readKyc();
        return k.status === 'submitted' || k.authStatus === 'reviewing';
    }

    function syncCreatorFromKyc() {
        if (isKycApproved()) {
            writeCreator({ status: 'approved', type: readCreator().type || 'photo' });
        }
    }

    function isCreator() {
        applyUrlOverrides();
        syncCreatorFromKyc();
        var params = new URLSearchParams(global.location.search);
        var fromUrl = params.get('creator');
        if (fromUrl === 'approved') return true;
        if (fromUrl === 'none') return false;
        return readCreator().status === 'approved';
    }

    function canPublish() {
        return isCreator() && isKycApproved();
    }

    function goKycIntro(returnPath) {
        var ret = returnPath || global.location.pathname.split('/').pop() + global.location.search;
        global.location.href = 'kyc-intro.html?return=' + encodeURIComponent(ret);
    }

    global.FansloopPublishGate = {
        isKycApproved: isKycApproved,
        isKycReviewing: isKycReviewing,
        isCreator: isCreator,
        canPublish: canPublish,
        syncCreatorFromKyc: syncCreatorFromKyc,
        goKycIntro: goKycIntro,
        writeKyc: writeKyc,
        writeCreator: writeCreator
    };

    applyUrlOverrides();
    syncCreatorFromKyc();
})(window);
