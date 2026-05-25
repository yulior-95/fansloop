/**
 * 首页 FAB · 发布前校验 KYC（成为创作者）
 */
(function () {
    var PG = window.FansloopPublishGate;
    if (!PG) return;

    var modal = document.getElementById('pubGateKycModal');
    var pendingType = null;

    function returnUrl(type) {
        return 'create.html' + (type ? '?type=' + encodeURIComponent(type) : '');
    }

    function openModal(type) {
        pendingType = type || 'image';
        if (!modal) {
            PG.goKycIntro(returnUrl(type));
            return;
        }
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }

    function onFabNavigate(type) {
        PG.syncCreatorFromKyc();
        if (PG.canPublish()) {
            window.location.href = returnUrl(type);
            return;
        }
        if (PG.isKycReviewing()) {
            openModal(type);
            return;
        }
        openModal(type);
    }

    document.querySelectorAll('.create-fab-item').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var type = btn.getAttribute('data-create-type') || 'image';
            onFabNavigate(type);
        });
    });

    document.getElementById('createFabMain')?.addEventListener('click', function () {
        onFabNavigate('image');
    });

    if (modal) {
        modal.querySelector('[data-pg-cancel]')?.addEventListener('click', closeModal);
        modal.querySelector('[data-pg-confirm]')?.addEventListener('click', function () {
            var type = pendingType || 'image';
            closeModal();
            PG.goKycIntro(returnUrl(type));
        });
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });
    }
})();
