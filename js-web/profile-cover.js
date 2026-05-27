/**
 * 个人主页 · 更换封面（唤起系统文件选择）
 */
(function () {
    var coverEl = document.querySelector('.cover');
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
        if (!file) return;
        if (!file.type || file.type.indexOf('image/') !== 0) {
            showToast('请选择图片文件');
            input.value = '';
            return;
        }
        var url = URL.createObjectURL(file);
        coverEl.style.backgroundImage = 'url("' + url + '")';
        var posterCover = document.querySelector('#profileSharePoster .psp-cover');
        if (posterCover) posterCover.style.backgroundImage = 'url("' + url + '")';
        showToast('封面已更新（原型预览）');
        input.value = '';
    });
})();
