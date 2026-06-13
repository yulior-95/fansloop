/**
 * 账变 / 收入报表导出弹窗交互
 */
(function () {
    var params = new URLSearchParams(location.search);
    var fromPage = params.get('from') || 'transactions';

    function closeModal() {
        if (window.parent && window.parent !== window) {
            try { window.parent.postMessage({ type: 'fansloop-close-modal' }, '*'); return; } catch (_) {}
        }
        location.href = fromPage === 'creator-income' ? 'creator-income.html' : 'transactions.html';
    }

    function updateSummary() {
        var fmtEl = document.querySelector('.fmt-card.active .nm');
        var rangeEl = document.querySelector('.range-card.active .nm');
        var rangeMeta = document.querySelector('.range-card.active .meta');
        var checked = document.querySelectorAll('.cb-row.checked').length;
        var rows = document.querySelectorAll('.summary-card .row');
        if (!rows.length) return;
        if (rows[0] && fmtEl) rows[0].querySelector('.v').textContent = fmtEl.textContent.trim() + ' (UTF-8 BOM)';
        if (rows[1] && rangeMeta) rows[1].querySelector('.v').textContent = (rangeMeta.textContent.split('·')[0] || '').trim();
        if (rows[3] && checked) rows[3].querySelector('.v').textContent = checked + ' / 12';
    }

    function bindFormat() {
        document.querySelectorAll('.fmt-card').forEach(function (card) {
            card.addEventListener('click', function () {
                document.querySelectorAll('.fmt-card').forEach(function (c) { c.classList.remove('active'); });
                card.classList.add('active');
                updateSummary();
            });
        });
    }

    function bindRange() {
        document.querySelectorAll('.range-card').forEach(function (card) {
            card.addEventListener('click', function () {
                document.querySelectorAll('.range-card').forEach(function (c) {
                    c.classList.remove('active');
                    var ch = c.querySelector('.check');
                    if (ch) ch.innerHTML = '';
                });
                card.classList.add('active');
                var check = card.querySelector('.check');
                if (check) check.innerHTML = '<i class="fa-solid fa-check"></i>';
                updateSummary();
            });
        });
    }

    function bindCheckboxes() {
        document.querySelectorAll('.cb-row').forEach(function (row) {
            row.addEventListener('click', function () {
                row.classList.toggle('checked');
                var cb = row.querySelector('.cb');
                if (cb) cb.innerHTML = row.classList.contains('checked') ? '<i class="fa-solid fa-check"></i>' : '';
                updateSummary();
            });
        });
        var selectAll = document.querySelector('.modal-body a[href="#"]');
        if (selectAll) {
            selectAll.addEventListener('click', function (e) {
                e.preventDefault();
                var allChecked = document.querySelectorAll('.cb-row:not(.checked)').length === 0;
                document.querySelectorAll('.cb-row').forEach(function (row) {
                    row.classList.toggle('checked', !allChecked);
                    var cb = row.querySelector('.cb');
                    if (cb) cb.innerHTML = row.classList.contains('checked') ? '<i class="fa-solid fa-check"></i>' : '';
                });
                selectAll.textContent = allChecked ? '全选 (12)' : '取消全选';
                updateSummary();
            });
        }
    }

    function bindActions() {
        document.querySelectorAll('.modal-foot .btn').forEach(function (btn) {
            btn.removeAttribute('onclick');
            if (btn.textContent.indexOf('取消') >= 0 || btn.classList.contains('close')) {
                btn.addEventListener('click', function (e) { e.preventDefault(); closeModal(); });
            }
        });
        var closeHead = document.querySelector('.modal-head .close');
        if (closeHead) {
            closeHead.removeAttribute('onclick');
            closeHead.addEventListener('click', function (e) { e.preventDefault(); closeModal(); });
        }
        var exportBtn = document.querySelector('.modal-foot .btn-primary');
        if (exportBtn) {
            exportBtn.removeAttribute('onclick');
            exportBtn.addEventListener('click', function (e) {
                e.preventDefault();
                var fmt = (document.querySelector('.fmt-card.active .nm') || {}).textContent || 'CSV';
                var blob = new Blob(['订单号,类型,金额\nTX001,订阅收入,10.00\n'], { type: 'text/csv;charset=utf-8' });
                var a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'fansloop-export-' + Date.now() + '.' + fmt.toLowerCase();
                a.click();
                URL.revokeObjectURL(a.href);
                setTimeout(closeModal, 400);
            });
        }
    }

    function init() {
        bindFormat();
        bindRange();
        bindCheckboxes();
        bindActions();
        updateSummary();
        if (fromPage === 'creator-income') {
            var title = document.querySelector('.modal-head h2');
            if (title) title.innerHTML = '<span class="ic"><i class="fa-solid fa-file-export"></i></span>导出收入报表<span class="sub">创作者收入明细 · CSV / Excel / PDF</span>';
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
