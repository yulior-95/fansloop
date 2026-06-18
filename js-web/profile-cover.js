/**
 * 个人主页 · 更换封面（唤起系统文件选择，与设置页共用存储）
 */
(function () {
    var coverEl = document.querySelector('.cover[data-profile-cover], .cover#profileCover');
    var btn = document.querySelector('.edit-cov');
    var input = document.getElementById('profileCoverFileInput');
    var toast = document.getElementById('pfToast');

    if (!coverEl || !btn || !input) return;

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2600);
    }

    btn.addEventListener('click', function () {
        input.click();
    });

    input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        input.value = '';
        if (!file) return;
        var store = window.FLProfileCoverStore;
        if (!store) {
            showToast('封面服务未就绪');
            return;
        }
        store.acceptFile(file, function (res) {
            if (!res.ok) {
                showToast(res.message || '请选择图片文件');
                return;
            }
            var posterCover = document.querySelector('#profileSharePoster .psp-cover');
            if (posterCover && res.url) {
                posterCover.style.backgroundImage = 'url("' + res.url.replace(/"/g, '\\"') + '")';
            }
            var hint = res.isAnimated ? '动图封面已更新' : '封面已更新';
            if (res.sessionOnly) hint += '（仅本次浏览）';
            showToast(hint);
        });
    });
})();
