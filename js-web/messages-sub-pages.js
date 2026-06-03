/**
 * 私信子页：消息请求 / 互动消息 / 新建私信
 */
(function () {
    function toast(msg) {
        var el = document.getElementById('msgSubToast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        setTimeout(function () { el.classList.remove('show'); }, 2400);
    }

    function initRequests() {
        document.querySelectorAll('[data-accept]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var row = btn.closest('.req-row');
                if (!row) return;
                var name = row.getAttribute('data-name');
                row.remove();
                toast('已接受「' + name + '」的私信，已移入会话列表');
                updateReqCount();
            });
        });
        document.querySelectorAll('[data-reject]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var row = btn.closest('.req-row');
                if (!row) return;
                row.remove();
                toast('已拒绝该私信请求');
                updateReqCount();
            });
        });
        function updateReqCount() {
            var n = document.querySelectorAll('.req-row').length;
            var badge = document.querySelector('.req-count-badge');
            if (badge) badge.textContent = n;
        }
    }

    function initInteractions() {
        document.querySelectorAll('.int-row[data-href]').forEach(function (row) {
            row.addEventListener('click', function () {
                location.href = row.getAttribute('data-href');
            });
        });
    }

    function initCompose() {
        var search = document.getElementById('composeSearch');
        if (search) {
            search.addEventListener('input', function () {
                var q = search.value.trim().toLowerCase();
                document.querySelectorAll('.compose-row').forEach(function (row) {
                    var name = (row.getAttribute('data-name') || '').toLowerCase();
                    row.style.display = !q || name.indexOf(q) >= 0 ? '' : 'none';
                });
            });
        }
        document.querySelectorAll('.compose-row').forEach(function (row) {
            row.addEventListener('click', function () {
                var name = row.getAttribute('data-name');
                location.href = 'messages.html?peer=' + encodeURIComponent(name);
            });
        });
    }

    var page = document.body.getAttribute('data-msg-sub');
    if (page === 'requests') initRequests();
    if (page === 'interactions') initInteractions();
    if (page === 'compose') initCompose();
})();
