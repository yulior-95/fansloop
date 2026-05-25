/**
 * 创建内容页 · 须先成为创作者（KYC）方可发布
 */
(function () {
    var PG = window.FansloopPublishGate;
    if (!PG) return;

    var banner = document.getElementById('createCreatorBanner');
    var typeGrid = document.getElementById('createTypeGrid');
    var modal = document.getElementById('pubGateKycModal');
    var toast = document.getElementById('crToast');
    var pendingType = null;

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2600);
    }

    function returnUrlWithType(type) {
        var base = 'create.html';
        return type ? base + '?type=' + encodeURIComponent(type) : base;
    }

    function openKycModal(type) {
        pendingType = type || null;
        if (!modal) {
            PG.goKycIntro(returnUrlWithType(type));
            return;
        }
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeKycModal() {
        if (!modal) return;
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        pendingType = null;
    }

    function renderBanner() {
        if (!banner) return;
        if (PG.canPublish()) {
            banner.classList.add('is-hidden');
            if (typeGrid) typeGrid.classList.remove('is-publish-locked');
            return;
        }

        banner.classList.remove('is-hidden');
        if (typeGrid) typeGrid.classList.add('is-publish-locked');

        var reviewing = PG.isKycReviewing();
        banner.innerHTML =
            '<div class="ban-ic"><i class="fa-solid fa-' + (reviewing ? 'hourglass-half' : 'lock') + '"></i></div>' +
            '<div class="ban-body">' +
            '<h4>' + (reviewing ? '身份认证审核中' : '须成为创作者方可发布') + '</h4>' +
            '<p>' +
            (reviewing
                ? '<strong>仅官方认证创作者可发布内容。</strong>你的 KYC 正在审核，通过后将自动获得创作者身份并开放图文、视频、直播发布。'
                : '<strong>仅官方认证创作者可发布内容。</strong>请先完成 <strong>身份认证（KYC）</strong> 成为创作者；认证通过后方可使用下方图文、视频、直播等发布能力。') +
            '</p>' +
            '<div class="create-gate-demo">' +
            '<span>原型：</span>' +
            '<button type="button" id="createDemoKycPass">模拟 KYC+创作者通过</button>' +
            '</div></div>' +
            '<div class="ban-actions">' +
            (reviewing
                ? ''
                : '<button type="button" class="btn btn-sm" id="certBannerApply"><i class="fa-solid fa-id-card"></i> 立即申请</button>') +
            '</div>';

        document.getElementById('certBannerApply')?.addEventListener('click', function () {
            PG.goKycIntro(returnUrlWithType(pendingType));
        });
        document.getElementById('createDemoKycPass')?.addEventListener('click', function () {
            PG.writeKyc({ status: 'approved', authStatus: 'approved' });
            PG.syncCreatorFromKyc();
            renderBanner();
            showToast('原型：已通过 KYC，已成为创作者，可发布内容');
            if (pendingType && window.__crOpenCreateEditor) {
                window.__crOpenCreateEditor(pendingType);
            }
        });
    }

    function bindModal() {
        if (!modal) return;
        modal.querySelector('[data-pg-cancel]')?.addEventListener('click', closeKycModal);
        modal.querySelector('[data-pg-confirm]')?.addEventListener('click', function () {
            var ret = returnUrlWithType(pendingType);
            closeKycModal();
            PG.goKycIntro(ret);
        });
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeKycModal();
        });
    }

    renderBanner();
    bindModal();

    window.FansloopCreatePublishGate = {
        ensurePublish: function (type) {
            PG.syncCreatorFromKyc();
            if (PG.canPublish()) return true;
            if (PG.isKycReviewing()) {
                showToast('KYC 审核中，通过后即可成为创作者并发布');
                renderBanner();
                return false;
            }
            pendingType = type;
            openKycModal(type);
            return false;
        },
        refresh: renderBanner
    };

    var params = new URLSearchParams(window.location.search);
    if (params.get('kyc') === 'approved' || params.get('creator') === 'approved') {
        renderBanner();
    }
})();
