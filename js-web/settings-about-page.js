/**
 * 关于 FansLoop · 检查更新 / 复制版本 / 更新日志 / 外链
 */
(function () {
    var VERSION = '2.4.1';
    var BUILD = '20260622';
    var CHANGELOG_KEY = 'fl_about_changelog_read';

    var toastEl = document.getElementById('aboutToast');
    var verText = document.getElementById('aboutVerText');
    var buildText = document.getElementById('aboutBuildText');
    var updateBtn = document.getElementById('aboutCheckUpdate');
    var copyBtn = document.getElementById('aboutCopyVer');

    function toast(msg, type) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.className = 'ab-toast show' + (type === 'err' ? ' err' : ' ok');
        clearTimeout(toast._tm);
        toast._tm = setTimeout(function () {
            toastEl.classList.remove('show');
        }, 2600);
    }

    if (verText) verText.textContent = 'v' + VERSION;
    if (buildText) buildText.textContent = 'Build ' + BUILD;

    function copyVersion() {
        var text = 'FansLoop v' + VERSION + ' (Build ' + BUILD + ')';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                toast('版本信息已复制', 'ok');
            }).catch(function () {
                toast('复制失败，请手动复制', 'err');
            });
        } else {
            toast(text, 'ok');
        }
    }

    function checkUpdate() {
        if (!updateBtn) return;
        var orig = updateBtn.innerHTML;
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 检查中…';
        setTimeout(function () {
            updateBtn.disabled = false;
            updateBtn.innerHTML = orig;
            toast('当前已是最新版本 v' + VERSION, 'ok');
        }, 1400);
    }

    function toggleChangelog(item) {
        var wasOpen = item.classList.contains('open');
        document.querySelectorAll('.about-ch-item').forEach(function (el) {
            el.classList.remove('open');
        });
        if (!wasOpen) item.classList.add('open');
    }

    function markChangelogRead() {
        try { localStorage.setItem(CHANGELOG_KEY, BUILD); } catch (e) { /* ignore */ }
        var badge = document.getElementById('aboutChangelogBadge');
        if (badge) badge.hidden = true;
    }

    function bindChangelog() {
        document.querySelectorAll('.about-ch-item').forEach(function (item) {
            var head = item.querySelector('.about-ch-head');
            if (!head) return;
            head.addEventListener('click', function () {
                toggleChangelog(item);
                markChangelogRead();
            });
            head.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleChangelog(item);
                    markChangelogRead();
                }
            });
        });
    }

    function bindLinkRows() {
        document.querySelectorAll('[data-about-action]').forEach(function (el) {
            function go() {
                var action = el.getAttribute('data-about-action');
                if (action === 'terms') {
                    location.href = 'settings-terms.html';
                    return;
                }
                if (action === 'privacy') {
                    location.href = 'settings-terms.html#privacy';
                    return;
                }
                if (action === 'support') {
                    location.href = 'transaction-contact.html';
                    return;
                }
                if (action === 'feedback') {
                    toast('感谢反馈！客服将在 24 小时内回复（原型演示）', 'ok');
                }
            }
            el.addEventListener('click', go);
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    go();
                }
            });
        });
    }

    function bindSocial() {
        document.querySelectorAll('[data-about-social]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var name = btn.getAttribute('data-about-social') || '社区';
                toast('即将打开 ' + name + '（原型外链演示）', 'ok');
            });
        });
    }

    try {
        var read = localStorage.getItem(CHANGELOG_KEY);
        if (read === BUILD) {
            var badge = document.getElementById('aboutChangelogBadge');
            if (badge) badge.hidden = true;
        }
    } catch (e) { /* ignore */ }

    if (copyBtn) copyBtn.addEventListener('click', copyVersion);
    if (updateBtn) updateBtn.addEventListener('click', checkUpdate);
    bindChangelog();
    bindLinkRows();
    bindSocial();
})();
