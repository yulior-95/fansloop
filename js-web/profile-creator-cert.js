/**
 * 个人主页 · 创作者状态标签（申请入口 → KYC 认证页）
 * 原多步「创作者类型认证」弹窗已下线，逻辑见 publish-gate-shared.js
 */
(function () {
    var PG = window.FansloopPublishGate;
    var tagWrap = document.getElementById('creatorCertTagWrap');
    var roleLine = document.getElementById('profileRoleLine');
    var roleBadge = document.querySelector('.ph-row .av-xl .role-badge');
    var toast = document.getElementById('pfToast');

    if (!tagWrap) return;

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2600);
    }

    function creatorStatus() {
        if (PG) {
            PG.syncCreatorFromKyc();
            if (PG.canPublish()) return 'approved';
            if (PG.isKycReviewing()) return 'pending';
            return 'none';
        }
        try {
            return JSON.parse(localStorage.getItem('fl_creator_cert_v1') || '{}').status || 'none';
        } catch (e) {
            return 'none';
        }
    }

    function renderTag() {
        var status = creatorStatus();
        var html = '';

        if (status === 'approved') {
            html = '<span class="tag tag-purple" id="creatorCertTag"><i class="fa-solid fa-palette"></i>认证创作者</span>';
        } else if (status === 'pending') {
            html = '<span class="tag tag-creator-pending" id="creatorCertTag"><i class="fa-solid fa-hourglass-half"></i>认证创作者审核中</span>';
        } else {
            html = '<a href="kyc-intro.html?return=profile.html" class="tag tag-creator-apply" id="creatorCertTag"><i class="fa-solid fa-certificate"></i>申请成为创作者</a>';
        }

        tagWrap.innerHTML = html;

        if (roleLine) {
            if (status === 'approved') roleLine.textContent = 'Creator · 0x7A3F...3F2C';
            else if (status === 'pending') roleLine.textContent = 'KYC 审核中 · 0x7A3F...3F2C';
            else roleLine.textContent = '用户 · 0x7A3F...3F2C';
        }

        if (roleBadge) {
            roleBadge.classList.remove('role-badge--muted', 'role-badge--pending');
            var icon = roleBadge.querySelector('i');
            if (status === 'approved') {
                if (icon) icon.className = 'fa-solid fa-crown';
            } else if (status === 'pending') {
                roleBadge.classList.add('role-badge--pending');
                if (icon) icon.className = 'fa-solid fa-hourglass-half';
            } else {
                roleBadge.classList.add('role-badge--muted');
                if (icon) icon.className = 'fa-regular fa-user';
            }
        }
    }

    renderTag();

    /* —— 以下原 sheetCreatorCert 弹窗逻辑已注释，改走 KYC 流程 ——
    const sheet = document.getElementById('sheetCreatorCert');
    function openCertSheet() { ... }
    bindSheet();
    —— */
})();
