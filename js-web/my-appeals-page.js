/**
 * 我的申诉 · 取消申诉（列表 + 详情，Web / H5 共用）
 */
(function (global) {
    var STORAGE_KEY = 'fl_appeals_cancelled_v1';
    /** 原型：仅「处理中」工单可取消 */
    var CANCELABLE_APPEALS = { AP20260505110002: true };

    function readCancelled() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function writeCancelled(ids) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        } catch (e) { /* ignore */ }
    }

    function isCancelled(appealId) {
        if (!appealId) return false;
        return readCancelled().indexOf(appealId) >= 0;
    }

    function markCancelled(appealId) {
        if (!appealId) return;
        var ids = readCancelled();
        if (ids.indexOf(appealId) >= 0) return;
        ids.push(appealId);
        writeCancelled(ids);
    }

    function toast(msg) {
        if (global.FL_nfToast) {
            global.FL_nfToast(msg, 'ok');
            return;
        }
        var el = document.createElement('div');
        el.textContent = msg;
        el.setAttribute('role', 'status');
        el.style.cssText = 'position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:99999;padding:10px 16px;border-radius:10px;background:rgba(15,23,42,0.92);color:#fff;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.25);max-width:min(90vw,360px);text-align:center';
        document.body.appendChild(el);
        setTimeout(function () { el.remove(); }, 2400);
    }

    function confirmCancel() {
        return global.confirm('确定取消该申诉？取消后工单将关闭，如需再次处理请从交易详情重新发起。');
    }

    function applyCancelledToBadge(badge) {
        if (!badge) return;
        badge.textContent = '已取消';
        badge.classList.remove('done', 'reject');
        badge.classList.add('cancelled');
    }

    function removeCancelControls(root) {
        if (!root) return;
        root.querySelectorAll('.btn-cancel-appeal, [data-appeal-cancel]').forEach(function (btn) {
            btn.remove();
        });
    }

    function appealCardRoot(item) {
        if (!item) return null;
        if (item.classList.contains('appeal-card')) return item;
        return item.querySelector('.appeal-card') || item;
    }

    function applyCancelledListItem(item) {
        if (!item) return;
        item.setAttribute('data-status', 'cancelled');
        var card = appealCardRoot(item);
        applyCancelledToBadge(card && card.querySelector('.st'));
        var tm = card && card.querySelector('.tm');
        if (tm && tm.textContent.indexOf('已取消') < 0) {
            tm.textContent = '已于 ' + formatNow() + ' 取消申诉';
        }
        removeCancelControls(item);
    }

    function formatNow() {
        var d = new Date();
        function pad(n) { return n < 10 ? '0' + n : String(n); }
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function appealIdFromItem(item) {
        return item.getAttribute('data-appeal')
            || item.querySelector('.no')?.textContent?.trim()
            || '';
    }

    function canCancel(appealId) {
        return !!appealId && CANCELABLE_APPEALS[appealId] && !isCancelled(appealId);
    }

    function cancelAppeal(appealId, contextEl) {
        if (!canCancel(appealId)) return;
        if (!confirmCancel()) return;
        markCancelled(appealId);
        document.querySelectorAll('.appeal-item[data-appeal="' + appealId + '"], .appeal-card[data-appeal="' + appealId + '"]').forEach(applyCancelledListItem);
        if (contextEl && contextEl.classList.contains('appeal-item')) applyCancelledListItem(contextEl);
        if (contextEl && contextEl.classList.contains('appeal-card')) applyCancelledListItem(contextEl);
        if (global.FL_applyAppealDetailCancelled) global.FL_applyAppealDetailCancelled(appealId);
        toast('申诉已取消');
    }

    function initList() {
        var list = document.querySelector('.appeal-list');
        if (!list) return;

        list.querySelectorAll('.appeal-item[data-appeal], .appeal-card[data-appeal]').forEach(function (item) {
            var id = appealIdFromItem(item);
            if (isCancelled(id)) applyCancelledListItem(item);
            else if (!canCancel(id)) removeCancelControls(item);
        });

        list.addEventListener('click', function (e) {
            var btn = e.target.closest('.btn-cancel-appeal');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            var item = btn.closest('.appeal-item') || btn.closest('.appeal-card');
            cancelAppeal(btn.getAttribute('data-appeal') || appealIdFromItem(item), item);
        });
    }

    function initDetail() {
        var appealNoEl = document.getElementById('appealNo');
        if (!appealNoEl) return;
        var appealId = appealNoEl.textContent.trim();
        var statusEl = document.getElementById('appealStatus');

        function applyDetailCancelled() {
            if (statusEl) {
                statusEl.textContent = '已取消';
                statusEl.style.color = 'var(--t-tertiary)';
            }
            removeCancelControls(document);
            var timeline = document.getElementById('appealTimeline') || document.querySelector('.timeline');
            if (timeline && !timeline.querySelector('[data-cancel-entry]')) {
                var ti = document.createElement('div');
                ti.className = 'ti done';
                ti.setAttribute('data-cancel-entry', '1');
                ti.innerHTML = '<div class="tm">' + formatNow() + '</div><div class="tx">你已取消申诉，工单已关闭</div>';
                timeline.appendChild(ti);
            }
        }

        global.FL_applyAppealDetailCancelled = function (id) {
            if (id === appealId) applyDetailCancelled();
        };

        if (isCancelled(appealId)) {
            applyDetailCancelled();
            return;
        }

        var cancelBtn = document.querySelector('[data-appeal-cancel]');
        if (!cancelBtn) return;
        if (!canCancel(appealId)) {
            cancelBtn.remove();
            return;
        }
        cancelBtn.addEventListener('click', function () {
            cancelAppeal(appealId, null);
            applyDetailCancelled();
        });
    }

    function boot() {
        initList();
        initDetail();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    global.FLAppealsPage = { isCancelled: isCancelled, markCancelled: markCancelled };
})(typeof window !== 'undefined' ? window : globalThis);
