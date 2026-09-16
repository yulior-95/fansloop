(function () {
    var topSave = document.getElementById('btnSubSaveTop');
    if (!topSave) return;
    topSave.addEventListener('click', function () {
        var webSave = document.querySelector('.page-head .btn-primary');
        if (webSave) webSave.click();
    });
})();
