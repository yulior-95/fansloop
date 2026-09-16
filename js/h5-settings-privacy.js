/**
 * H5 隐私设置 · 与 Web 原型交互对齐（分段 / 开关 / 进群确认持久化）
 */
(function () {
    var GROUP_KEY = 'fl_group_invite_need_consent';
    var toastEl = document.getElementById('priToast');

    function toast(msg) {
        if (window.DigitalH5Nav && typeof window.DigitalH5Nav.toast === 'function') {
            window.DigitalH5Nav.toast(msg);
            return;
        }
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
    }

    function bindSegments() {
        document.querySelectorAll('.seg').forEach(function (seg) {
            seg.querySelectorAll('button').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    seg.querySelectorAll('button').forEach(function (b) { b.classList.remove('on'); });
                    btn.classList.add('on');
                    var label = btn.textContent.replace(/\s+/g, ' ').trim();
                    toast('已更新：' + label);
                });
            });
        });
    }

    function bindSwitches() {
        document.querySelectorAll('.switch').forEach(function (sw) {
            if (sw.id === 'swGroupInviteConsent') return;
            function toggle() {
                sw.classList.toggle('on');
                var on = sw.classList.contains('on');
                sw.setAttribute('aria-checked', on ? 'true' : 'false');
                toast(on ? '已开启' : '已关闭');
            }
            sw.addEventListener('click', toggle);
            sw.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle();
                }
            });
        });
    }

    function bindGroupInvite() {
        var sw = document.getElementById('swGroupInviteConsent');
        if (!sw) return;
        try {
            var v = localStorage.getItem(GROUP_KEY);
            if (v === '0') {
                sw.classList.remove('on');
                sw.setAttribute('aria-checked', 'false');
            }
        } catch (e) { /* ignore */ }
        function toggle() {
            sw.classList.toggle('on');
            var on = sw.classList.contains('on');
            sw.setAttribute('aria-checked', on ? 'true' : 'false');
            try { localStorage.setItem(GROUP_KEY, on ? '1' : '0'); } catch (err) { /* ignore */ }
            toast(on ? '进群邀请需确认（已保存）' : '邀请后将直接入群（已保存）');
        }
        sw.addEventListener('click', toggle);
        sw.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
    }

    function bindActions() {
        var exportTop = document.getElementById('btnExportDataTop');
        var exportRow = document.getElementById('btnExportDataRow');
        function doExport() { toast('数据导出任务已创建，完成后将邮件通知（原型）'); }
        if (exportTop) exportTop.addEventListener('click', doExport);
        if (exportRow) exportRow.addEventListener('click', doExport);

        document.querySelectorAll('[data-pri-unblock]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var row = btn.closest('.bl-row');
                if (row) row.remove();
                toast('已解除屏蔽（原型）');
            });
        });

        var addBlock = document.getElementById('btnBlockAdd');
        if (addBlock) addBlock.addEventListener('click', function () { toast('添加屏蔽用户（原型）'); });

        document.querySelectorAll('.kw-pool .kw .x').forEach(function (x) {
            x.addEventListener('click', function (e) {
                e.stopPropagation();
                var kw = x.closest('.kw');
                if (kw) kw.remove();
                toast('已移除关键词');
            });
        });

        var addKw = document.querySelector('.kw-pool .add-kw');
        if (addKw) {
            addKw.addEventListener('click', function () {
                var word = window.prompt('输入要屏蔽的关键词', '');
                if (!word || !word.trim()) return;
                var chip = document.createElement('span');
                chip.className = 'kw';
                chip.innerHTML = word.trim() + ' <span class="x"><i class="fa-solid fa-xmark" style="font-size:9px"></i></span>';
                addKw.parentNode.insertBefore(chip, addKw);
                chip.querySelector('.x').addEventListener('click', function (ev) {
                    ev.stopPropagation();
                    chip.remove();
                    toast('已移除关键词');
                });
                toast('已添加关键词');
            });
        }

        var clearHist = document.getElementById('btnClearBrowseHistory');
        if (clearHist) clearHist.addEventListener('click', function () { toast('浏览历史已清除（原型）'); });

        var delAcct = document.getElementById('btnDeleteAccount');
        if (delAcct) delAcct.addEventListener('click', function () { toast('账户删除流程（原型演示）'); });
    }

    bindSegments();
    bindSwitches();
    bindGroupInvite();
    bindActions();
})();
