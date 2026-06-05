/**
 * 个人主页 · 主内容区切换「作品主页 / 邀请数据」
 * 侧栏保持「我的主页」选中，不单独增加菜单项
 */
(function () {
    var home = document.getElementById('profileViewHome');
    var invite = document.getElementById('profileViewInvite');
    if (!home || !invite) return;

    var btnInvite = document.getElementById('btnProfileInviteData');
    var btnBack = document.getElementById('btnProfileInviteBack');

    function showInvite(tab) {
        home.classList.add('is-hidden');
        invite.classList.add('is-active');
        invite.setAttribute('aria-hidden', 'false');
        if (btnInvite) btnInvite.classList.add('is-active');
        document.title = '邀请数据 · 个人主页 · FansLoop';
        if (tab && window.FL_profileInviteSwitchTab) {
            window.FL_profileInviteSwitchTab(tab);
        }
        try {
            history.replaceState(null, '', 'profile.html?view=invite' + (tab ? '&tab=' + tab : ''));
        } catch (e) {}
    }

    function showHome() {
        home.classList.remove('is-hidden');
        invite.classList.remove('is-active');
        invite.setAttribute('aria-hidden', 'true');
        if (btnInvite) btnInvite.classList.remove('is-active');
        document.title = '个人主页 · FansLoop';
        try {
            history.replaceState(null, '', 'profile.html');
        } catch (e) {}
    }

    if (btnInvite) {
        btnInvite.addEventListener('click', function () {
            if (invite.classList.contains('is-active')) showHome();
            else showInvite('');
        });
    }
    if (btnBack) btnBack.addEventListener('click', showHome);

    var params = new URLSearchParams(location.search);
    if (params.get('view') === 'invite') {
        showInvite(params.get('tab') || '');
    }

    var btnShare = document.getElementById('btnInviteShareFromView');
    if (btnShare) {
        btnShare.addEventListener('click', function () {
            var open = document.getElementById('btnShareProfile');
            if (open) open.click();
        });
    }
    var btnCopy = document.getElementById('btnInviteCopyFromView');
    if (btnCopy) {
        btnCopy.addEventListener('click', function () {
            var copyBtn = document.getElementById('btnCopyInviteCode');
            if (copyBtn) copyBtn.click();
        });
    }

    window.FL_profileInviteView = { showInvite: showInvite, showHome: showHome };
})();
