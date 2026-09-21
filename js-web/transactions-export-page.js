/**
 * 账变 / 收入报表导出弹窗交互（独立页 + 父页内联）
 */
(function (global) {
    'use strict';

    function resolveModal(root) {
        if (!root) return null;
        if (root.classList && root.classList.contains('modal')) return root;
        return root.querySelector('.modal');
    }

    function initExportModal(config) {
        config = config || {};
        var host = config.host || document;
        var modal = resolveModal(host);
        if (!modal) return;

        var fromPage = config.from;
        if (!fromPage) {
            try {
                fromPage = new URLSearchParams(global.location.search).get('from') || 'transactions';
            } catch (_) {
                fromPage = 'transactions';
            }
        }
        var inline = !!config.inline;

        function qsa(sel) {
            return modal.querySelectorAll(sel);
        }
        function qs(sel) {
            return modal.querySelector(sel);
        }

        function closeModal() {
            if (inline && typeof global.FL_closeStandaloneModal === 'function') {
                global.FL_closeStandaloneModal();
                return;
            }
            if (global.parent && global.parent !== global) {
                try {
                    global.parent.postMessage({ type: 'goodfans-close-modal' }, '*');
                    return;
                } catch (_) { /* fall through */ }
            }
            global.location.href = fromPage === 'creator-income' ? 'creator-income.html' : 'transactions.html';
        }

        function updateSummary() {
            var fmtEl = qs('.fmt-card.active .nm');
            var rangeMeta = qs('.range-card.active .meta');
            var checked = qsa('.cb-row.checked').length;
            var rows = qsa('.summary-card .row');
            if (!rows.length) return;
            if (rows[0] && fmtEl) rows[0].querySelector('.v').textContent = fmtEl.textContent.trim() + ' (UTF-8 BOM)';
            if (rows[1] && rangeMeta) {
                rows[1].querySelector('.v').textContent = (rangeMeta.textContent.split('·')[0] || '').trim();
            }
            if (rows[3] && checked) rows[3].querySelector('.v').textContent = checked + ' / 12';
        }

        qsa('.fmt-card').forEach(function (card) {
            card.addEventListener('click', function () {
                qsa('.fmt-card').forEach(function (c) { c.classList.remove('active'); });
                card.classList.add('active');
                updateSummary();
            });
        });

        qsa('.range-card').forEach(function (card) {
            card.addEventListener('click', function () {
                qsa('.range-card').forEach(function (c) {
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

        qsa('.cb-row').forEach(function (row) {
            row.addEventListener('click', function () {
                row.classList.toggle('checked');
                var cb = row.querySelector('.cb');
                if (cb) cb.innerHTML = row.classList.contains('checked') ? '<i class="fa-solid fa-check"></i>' : '';
                updateSummary();
            });
        });

        var selectAll = qs('.modal-body a[href="#"]');
        if (selectAll) {
            selectAll.addEventListener('click', function (e) {
                e.preventDefault();
                var allChecked = qsa('.cb-row:not(.checked)').length === 0;
                qsa('.cb-row').forEach(function (row) {
                    row.classList.toggle('checked', !allChecked);
                    var cb = row.querySelector('.cb');
                    if (cb) cb.innerHTML = row.classList.contains('checked') ? '<i class="fa-solid fa-check"></i>' : '';
                });
                selectAll.textContent = allChecked ? '全选 (12)' : '取消全选';
                updateSummary();
            });
        }

        qsa('.modal-foot .btn').forEach(function (btn) {
            btn.removeAttribute('onclick');
            if (btn.textContent.indexOf('取消') >= 0 || btn.classList.contains('close')) {
                btn.addEventListener('click', function (e) { e.preventDefault(); closeModal(); });
            }
        });

        var closeHead = qs('.modal-head .close');
        if (closeHead) {
            closeHead.removeAttribute('onclick');
            closeHead.addEventListener('click', function (e) { e.preventDefault(); closeModal(); });
        }

        var exportBtn = qs('.modal-foot .btn-primary');
        if (exportBtn) {
            exportBtn.removeAttribute('onclick');
            exportBtn.addEventListener('click', function (e) {
                e.preventDefault();
                var fmt = (qs('.fmt-card.active .nm') || {}).textContent || 'CSV';
                var blob = new Blob(['订单号,类型,金额\nTX001,订阅收入,10.00\n'], { type: 'text/csv;charset=utf-8' });
                var a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'goodfans-export-' + Date.now() + '.' + fmt.toLowerCase();
                a.click();
                URL.revokeObjectURL(a.href);
                setTimeout(closeModal, 400);
            });
        }

        updateSummary();

        if (fromPage === 'creator-income') {
            var title = qs('.modal-head h2');
            if (title) {
                title.innerHTML =
                    '<span class="ic"><i class="fa-solid fa-file-export"></i></span>导出收入报表' +
                    '<span class="sub">创作者收入明细 · CSV / Excel / PDF</span>';
            }
        }
    }

    global.FLTransactionsExport = { init: initExportModal };

    function bootStandalone() {
        var mask = document.querySelector('body.tx-export-standalone .modal-mask');
        if (!mask) return;
        initExportModal({ host: mask, inline: false });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootStandalone);
    } else {
        bootStandalone();
    }
})(typeof window !== 'undefined' ? window : globalThis);
