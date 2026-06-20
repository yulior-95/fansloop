/**
 * 会员订阅设置 · 优惠码表格 + 新建/编辑弹层
 */
(function () {
    var store = window.CreatorPromoCodesStore;
    if (!store) return;

    var tbody = document.getElementById('promoTableBody');
    var btnNew = document.getElementById('btnNewPromo');
    var ovl = document.getElementById('ovlPromoEdit');
    if (!tbody || !ovl) return;

    var editingId = null;

    function toast(msg, ok) {
        var host = document.getElementById('promoToastHost');
        if (!host) {
            if (typeof window.toast === 'function') window.toast(msg);
            return;
        }
        var t = document.createElement('div');
        t.className = 'promo-toast' + (ok === false ? ' err' : ' ok');
        t.textContent = msg;
        host.appendChild(t);
        requestAnimationFrame(function () { t.classList.add('show'); });
        setTimeout(function () {
            t.classList.remove('show');
            setTimeout(function () { t.remove(); }, 220);
        }, 2600);
    }

    function openOvl() {
        ovl.classList.add('show');
        ovl.setAttribute('aria-hidden', 'false');
    }

    function closeOvl() {
        ovl.classList.remove('show');
        ovl.setAttribute('aria-hidden', 'true');
        editingId = null;
    }

    function renderTable() {
        var items = store.list();
        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--t-tertiary);font-size:12.5px">暂无优惠码，点击右上角新建</td></tr>';
            return;
        }
        tbody.innerHTML = items.map(function (p) {
            var status = store.computeStatus(p);
            return '<tr data-promo-id="' + p.id + '">' +
                '<td><code style="color:#C084FC">' + p.code + '</code></td>' +
                '<td>' + store.formatDiscountLabel(p) + '</td>' +
                '<td>' + p.usedCount + ' / ' + p.maxUses + '</td>' +
                '<td>' + (p.expiresAt || '—') + '</td>' +
                '<td><span class="' + store.statusTagClass(status) + '" style="font-size:10px">' + store.statusLabel(status) + '</span></td>' +
                '<td><button type="button" class="btn btn-ghost btn-sm" data-promo-edit="' + p.id + '" aria-label="编辑"><i class="fa-solid fa-pen"></i></button></td>' +
                '</tr>';
        }).join('');
    }

    function fillForm(promo) {
        var codeEl = document.getElementById('promoFormCode');
        var typeEl = document.getElementById('promoFormType');
        var valueEl = document.getElementById('promoFormValue');
        var maxEl = document.getElementById('promoFormMaxUses');
        var expEl = document.getElementById('promoFormExpires');
        var statusEl = document.getElementById('promoFormStatus');
        var titleEl = document.getElementById('promoModalTitle');
        var delBtn = document.getElementById('btnPromoDelete');
        if (titleEl) titleEl.textContent = promo ? '编辑优惠码' : '新建优惠码';
        if (codeEl) {
            codeEl.value = promo ? promo.code : '';
            codeEl.disabled = !!promo;
        }
        if (typeEl) typeEl.value = promo ? promo.discountType : 'percent';
        if (valueEl) valueEl.value = promo ? String(promo.discountType === 'percent' ? promo.value * 10 : promo.value) : '';
        if (maxEl) maxEl.value = promo ? String(promo.maxUses) : '100';
        if (expEl) expEl.value = promo ? promo.expiresAt : '';
        if (statusEl) statusEl.value = promo ? (promo.status === 'disabled' ? 'disabled' : 'active') : 'active';
        if (delBtn) delBtn.style.display = promo ? '' : 'none';
        syncValueHint();
    }

    function syncValueHint() {
        var typeEl = document.getElementById('promoFormType');
        var valueLabel = document.getElementById('promoFormValueLabel');
        var valueHint = document.getElementById('promoFormValueHint');
        if (!typeEl || !valueLabel) return;
        if (typeEl.value === 'fixed_first') {
            valueLabel.textContent = '首月价格';
            if (valueHint) valueHint.textContent = '粉丝首月订阅将按此固定价支付（USDT）';
        } else {
            valueLabel.textContent = '折扣力度';
            if (valueHint) valueHint.textContent = '填写 1–9 的数字，如 8 表示 8 折首月';
        }
    }

    function openCreate() {
        editingId = null;
        fillForm(null);
        openOvl();
    }

    function openEdit(id) {
        var promo = store.getById(id);
        if (!promo) return;
        editingId = id;
        fillForm(promo);
        openOvl();
    }

    function readForm() {
        var codeEl = document.getElementById('promoFormCode');
        var typeEl = document.getElementById('promoFormType');
        var valueEl = document.getElementById('promoFormValue');
        var maxEl = document.getElementById('promoFormMaxUses');
        var expEl = document.getElementById('promoFormExpires');
        var statusEl = document.getElementById('promoFormStatus');
        var code = store.normalizeCode(codeEl && codeEl.value);
        var discountType = typeEl ? typeEl.value : 'percent';
        var rawVal = parseFloat(valueEl && valueEl.value);
        var maxUses = parseInt(maxEl && maxEl.value, 10);
        var expiresAt = expEl && expEl.value ? expEl.value.trim() : '';
        var status = statusEl && statusEl.value === 'disabled' ? 'disabled' : 'active';

        if (!code || code.length < 3) {
            return { error: '优惠码至少 3 个字符' };
        }
        if (isNaN(maxUses) || maxUses < 1) {
            return { error: '请输入有效的使用上限' };
        }
        if (!expiresAt) {
            return { error: '请选择有效期' };
        }

        var value;
        if (discountType === 'percent') {
            if (isNaN(rawVal) || rawVal < 1 || rawVal > 9) {
                return { error: '折扣请填写 1–9 之间的整数（如 8 表示 8 折）' };
            }
            value = rawVal / 10;
        } else {
            if (isNaN(rawVal) || rawVal < 0.5) {
                return { error: '首月固定价不能低于 0.5 USDT' };
            }
            value = rawVal;
        }

        var existing = store.getByCode(store.DEMO_UID, code);
        if (existing && existing.id !== editingId) {
            return { error: '该优惠码已存在' };
        }

        return {
            id: editingId || store.nextId(),
            code: code,
            discountType: discountType,
            value: value,
            scope: 'first_month',
            maxUses: maxUses,
            usedCount: editingId ? (store.getById(editingId).usedCount || 0) : 0,
            expiresAt: expiresAt,
            status: status,
            creatorUserId: store.DEMO_UID
        };
    }

    function onSave() {
        var data = readForm();
        if (data.error) {
            toast(data.error, false);
            return;
        }
        var wasEdit = !!editingId;
        if (data.usedCount >= data.maxUses) data.status = 'exhausted';
        else if (data.status !== 'disabled' && data.expiresAt < new Date().toISOString().slice(0, 10)) {
            data.status = 'expired';
        }
        store.save(data);
        closeOvl();
        renderTable();
        toast(wasEdit ? '优惠码已更新' : '优惠码已创建');
    }

    function onDelete() {
        if (!editingId) return;
        if (!window.confirm('确定删除该优惠码？已使用的记录将无法恢复。')) return;
        store.remove(editingId);
        closeOvl();
        renderTable();
        toast('优惠码已删除');
    }

    if (btnNew) btnNew.addEventListener('click', openCreate);

    tbody.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-promo-edit]');
        if (!btn) return;
        openEdit(btn.getAttribute('data-promo-edit'));
    });

    ovl.addEventListener('click', function (e) {
        if (e.target === ovl || e.target.closest('[data-promo-close]')) closeOvl();
    });

    var btnSave = document.getElementById('btnPromoSave');
    if (btnSave) btnSave.addEventListener('click', onSave);

    var btnDel = document.getElementById('btnPromoDelete');
    if (btnDel) btnDel.addEventListener('click', onDelete);

    var typeEl = document.getElementById('promoFormType');
    if (typeEl) typeEl.addEventListener('change', syncValueHint);

    renderTable();
})();
