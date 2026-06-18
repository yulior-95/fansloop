/**
 * 设置 · 编辑资料 · 主页封面上传
 */
(function () {
    var preview = document.getElementById('settingsCoverPreview');
    var input = document.getElementById('settingsCoverFileInput');
    var btnPick = document.getElementById('btnSettingsCoverPick');
    var btnReset = document.getElementById('btnSettingsCoverReset');
    var toastEl = document.getElementById('settingsAccountToast');

    if (!preview || !input || !btnPick) return;

    function toast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toast._tm);
        toast._tm = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
    }

    btnPick.addEventListener('click', function () {
        input.click();
    });

    if (btnReset) {
        btnReset.addEventListener('click', function () {
            if (!window.FLProfileCoverStore) return;
            window.FLProfileCoverStore.reset();
            toast('已恢复默认封面');
        });
    }

    input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        input.value = '';
        if (!file || !window.FLProfileCoverStore) return;
        window.FLProfileCoverStore.acceptFile(file, function (res) {
            if (!res.ok) {
                toast(res.message || '上传失败');
                return;
            }
            var hint = res.isAnimated ? '动图封面已更新' : '封面已更新';
            if (res.sessionOnly) {
                hint += '（文件较大，仅本次浏览有效）';
            }
            toast(hint);
        });
    });
})();
