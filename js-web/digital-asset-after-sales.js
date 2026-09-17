/**
 * 数字商品售后 · 7 日内退款申请（原型自动原路退回 USDT）
 */
(function (global) {
    var REASONS = [
        { code: 'cant_open', label: '无法打开 / 无法播放', hint: '文件损坏、链接失效或播放器报错' },
        { code: 'mismatch', label: '内容与描述不符', hint: '规格、清晰度或类型与商品页不一致' },
        { code: 'duplicate', label: '重复扣款', hint: '同一商品被扣款两次' },
        { code: 'other', label: '其他原因', hint: '请在下方补充说明' }
    ];

    var state = { orderId: '', onDone: null };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function fmt(n) {
        var num = Math.round(Number(n) * 100) / 100;
        return num % 1 === 0 ? String(num) : num.toFixed(2);
    }

    function toast(msg, isErr) {
        if (global.DigitalAssetPages && global.DigitalAssetPages.toast) {
            global.DigitalAssetPages.toast(msg, isErr);
            return;
        }
        if (global.DigitalH5Nav && global.DigitalH5Nav.toast) {
            global.DigitalH5Nav.toast(msg);
            return;
        }
        try { alert(msg); } catch (e) { /* ignore */ }
    }

    function ensureDom() {
        if (document.getElementById('ovlDaAfterSales')) return;
        var reasonsHtml = REASONS.map(function (r, i) {
            return (
                '<label class="da-as-reason">' +
                '<input type="radio" name="daAsReason" value="' + esc(r.code) + '"' + (i === 0 ? ' checked' : '') + '>' +
                '<span class="body"><span class="t">' + esc(r.label) + '</span>' +
                '<span class="h">' + esc(r.hint) + '</span></span></label>'
            );
        }).join('');

        var wrap = document.createElement('div');
        wrap.innerHTML =
            '<div class="inline-overlay" id="ovlDaAfterSales" aria-hidden="true">' +
            '<div class="sub-modal da-cm-panel da-as-panel" role="dialog" aria-labelledby="daAsTitle">' +
            '<div class="sub-modal-head">' +
            '<h3 id="daAsTitle"><i class="fa-solid fa-rotate-left" style="color:#F59E0B"></i> 数字商品售后</h3>' +
            '<button type="button" class="btn btn-secondary btn-sm" id="daAsClose"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="sub-modal-body da-as-body">' +
            '<p class="da-as-intro" id="daAsIntro">购买后 <strong>7 日内</strong>可申请退款；审核通过后 USDT 原路退回，数字权益收回。创作者对应收入在冷静期结束前不会结算。</p>' +
            '<div class="da-as-order" id="daAsOrder"></div>' +
            '<div class="da-as-reasons" id="daAsReasons">' + reasonsHtml + '</div>' +
            '<textarea class="da-as-note" id="daAsNote" rows="3" maxlength="240" placeholder="补充说明（选填）"></textarea>' +
            '<p class="da-as-warn"><i class="fa-solid fa-circle-info"></i> 退款成功后将无法继续访问该作品。</p>' +
            '<div class="sub-step-actions">' +
            '<button type="button" class="btn btn-secondary" id="daAsCancel">取消</button>' +
            '<button type="button" class="btn btn-primary" id="daAsSubmit"><i class="fa-solid fa-check"></i> 提交退款</button>' +
            '</div></div></div></div>';
        while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
        bindOnce();
    }

    function close() {
        var ovl = document.getElementById('ovlDaAfterSales');
        if (ovl) {
            ovl.classList.remove('show');
            ovl.setAttribute('aria-hidden', 'true');
        }
    }

    function selectedReason() {
        var checked = document.querySelector('#daAsReasons input[name="daAsReason"]:checked');
        return checked ? checked.value : 'cant_open';
    }

    function submit() {
        var Orders = global.DigitalAssetOrdersStore;
        if (!Orders || !state.orderId) return;
        var note = (document.getElementById('daAsNote') || {}).value || '';
        var code = selectedReason();
        var res = Orders.requestRefund(state.orderId, {
            reasonCode: code,
            reasonText: note.trim() ? note.trim() : Orders.refundReasonLabel(code)
        });
        if (!res.ok) {
            toast(res.error || '退款失败', true);
            return;
        }
        toast('退款成功 · ' + fmt(res.order.priceUsdt) + ' USDT 已退回余额');
        var cb = state.onDone;
        close();
        if (typeof cb === 'function') cb(res);
        try {
            global.dispatchEvent(new CustomEvent('fl-digital-after-sales-done', { detail: res }));
        } catch (e) { /* ignore */ }
    }

    function bindOnce() {
        var ovl = document.getElementById('ovlDaAfterSales');
        if (!ovl || ovl._bound) return;
        ovl._bound = true;
        document.getElementById('daAsClose').addEventListener('click', close);
        document.getElementById('daAsCancel').addEventListener('click', close);
        document.getElementById('daAsSubmit').addEventListener('click', submit);
        ovl.addEventListener('click', function (e) { if (e.target === ovl) close(); });
    }

    function fillOrder(order, eligibility) {
        var box = document.getElementById('daAsOrder');
        if (!box || !order) return;
        var days = eligibility && eligibility.daysLeft != null ? eligibility.daysLeft : '—';
        box.innerHTML =
            '<div class="t">' + esc(order.productTitle) + '</div>' +
            '<div class="m">订单 ' + esc(order.id) + ' · ' + fmt(order.priceUsdt) + ' USDT</div>' +
            '<div class="m">售后期剩余约 <strong>' + esc(String(days)) + '</strong> 天</div>';
    }

    function open(opts) {
        opts = opts || {};
        var Orders = global.DigitalAssetOrdersStore;
        if (!Orders) {
            toast('订单服务未就绪', true);
            return;
        }
        var orderId = opts.orderId;
        if (!orderId) {
            toast('缺少订单信息', true);
            return;
        }
        var check = Orders.getRefundEligibility(orderId);
        if (!check.ok) {
            toast(check.reason || '当前不可退款', true);
            return;
        }
        state.orderId = orderId;
        state.onDone = opts.onDone || null;
        ensureDom();
        fillOrder(check.order, check);
        var note = document.getElementById('daAsNote');
        if (note) note.value = '';
        var intro = document.getElementById('daAsIntro');
        if (intro && Orders.REFUND_WINDOW_DAYS) {
            intro.innerHTML = '购买后 <strong>' + Orders.REFUND_WINDOW_DAYS + ' 日内</strong>可申请退款；审核通过后 USDT 原路退回，数字权益收回。创作者对应收入在 ' +
                (Orders.SETTLEMENT_HOLD_DAYS || 7) + ' 天冷静期结束前不会结算。';
        }
        var ovl = document.getElementById('ovlDaAfterSales');
        ovl.classList.add('show');
        ovl.setAttribute('aria-hidden', 'false');
    }

    global.DigitalAssetAfterSales = { open: open, close: close, REASONS: REASONS };
})(typeof window !== 'undefined' ? window : this);
