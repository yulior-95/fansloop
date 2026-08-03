/**
 * 数字资产 · 详情弹窗 + 购买确认 / 余额不足 / 支付密码（对齐订阅·PPV 流程）
 */
(function (global) {
    var pwdBuffer = '';
    var state = {
        productId: '',
        title: '',
        price: 0,
        creatorName: '',
        onDone: null,
        ownerView: false,
        preview: false,
        /** 进入确认支付时锁定，下架后仍可完成这笔支付 */
        checkoutLocked: false,
        asVisitor: false
    };
    var STEPS = ['daCmStepDetail', 'daCmStepConfirm', 'daCmStepRecharge', 'daCmStepPwdMissing', 'daCmStepPayPwd', 'daCmStepOk'];

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
            return global.DigitalAssetPages.toast(msg, isErr);
        }
        if (typeof global.toast === 'function') return global.toast(msg);
        alert(msg);
    }
    function currentUserId() {
        if (global.GoodfansAuth && global.GoodfansAuth.getUserId) {
            var uid = global.GoodfansAuth.getUserId();
            if (uid) return uid;
        }
        return (global.DigitalAssetsStore && global.DigitalAssetsStore.DEMO_CREATOR) || 'demo_uid_882910';
    }
    function isOwnProduct(p) {
        return !!(p && p.creatorId && p.creatorId === currentUserId());
    }
    function wallet() { return global.LiveWalletStore || null; }
    function payPwdStore() { return global.FLPayPasswordStore || null; }
    function hasPayPassword() {
        var s = payPwdStore();
        return s ? s.hasPassword() : false;
    }
    function getBalance() {
        var w = wallet();
        if (w) return w.getBalance();
        if (global.FLUserAssets && global.FLUserAssets.getLiveUsdt) return global.FLUserAssets.getLiveUsdt();
        return 0;
    }
    function formatBal(n) {
        var w = wallet();
        return w && w.format ? w.format(n) : fmt(n);
    }
    function canAfford(price) {
        var w = wallet();
        if (w && w.canAfford) return w.canAfford(price);
        return getBalance() >= price;
    }
    function returnPath() {
        return (location.pathname.split('/').pop() || 'home.html') + location.search;
    }
    function goRecharge(needAmt) {
        try {
            localStorage.setItem('fl_recharge_return', returnPath());
            if (needAmt > 0) localStorage.setItem('fl_recharge_suggest', String(Math.ceil(needAmt)));
        } catch (e) { /* ignore */ }
        var q = 'return=' + encodeURIComponent(returnPath());
        if (needAmt > 0) q += '&need=' + encodeURIComponent(String(Math.ceil(needAmt)));
        location.href = 'recharge.html?' + q;
    }
    function goSetPayPassword() {
        try { localStorage.setItem('fl_pay_pwd_return', returnPath()); } catch (e) { /* ignore */ }
        var store = payPwdStore();
        var url = store && store.getSettingsUrl
            ? store.getSettingsUrl(returnPath())
            : ('settings-pay-password.html?return=' + encodeURIComponent(returnPath()));
        location.href = url;
    }

    function showStep(id) {
        STEPS.forEach(function (sid) {
            var el = document.getElementById(sid);
            if (el) el.classList.toggle('active', sid === id);
        });
    }

    function ensureOverlay() {
        if (document.getElementById('ovlDaCommerce')) return;
        var wrap = document.createElement('div');
        wrap.innerHTML =
            '<div class="inline-overlay" id="ovlDaCommerce" aria-hidden="true">' +
            '<div class="iol-panel da-cm-panel">' +
            '<div class="iol-head">' +
            '<h3 id="daCmHeadTitle"><i class="fa-solid fa-gem" style="color:#C084FC"></i> 数字商品</h3>' +
            '<button type="button" class="iol-close" id="daCmClose" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +

            '<div class="sub-modal-step active" id="daCmStepDetail">' +
            '<div class="da-cm-detail" id="daCmDetailBody"></div>' +
            '</div>' +

            '<div class="sub-modal-step" id="daCmStepConfirm">' +
            '<div class="sub-creator" style="margin-bottom:12px">' +
            '<div><div style="font-size:13px;font-weight:700" id="daCmConfirmTitle">—</div>' +
            '<div style="font-size:11px;color:var(--t-tertiary)" id="daCmConfirmSub">—</div></div></div>' +
            '<div class="sub-balance-bar" id="daCmBalanceBar"><span><i class="fa-solid fa-wallet"></i> 钱包可用余额</span><b id="daCmBalanceVal">— USDT</b></div>' +
            '<div class="sub-pay-summary" style="margin:12px 0">' +
            '<div class="row"><span>商品</span><span class="v" id="daCmSumTitle">—</span></div>' +
            '<div class="row"><span>支付金额</span><span class="v" id="daCmSumPrice">— USDT</span></div>' +
            '<div class="row"><span>扣款后余额</span><span class="v" id="daCmSumAfter">— USDT</span></div></div>' +
            '<p style="font-size:11px;color:var(--t-tertiary);margin:0 0 12px;line-height:1.45">购买成功后立即获得数字权益，无物流与地址。</p>' +
            '<div class="sub-step-actions">' +
            '<button type="button" class="btn btn-secondary" id="daCmConfirmBack">返回</button>' +
            '<button type="button" class="btn btn-primary" id="daCmConfirmPay"><i class="fa-solid fa-bolt"></i> 确认支付</button>' +
            '</div></div>' +

            '<div class="sub-modal-step" id="daCmStepRecharge">' +
            '<div class="sub-pwd-missing">' +
            '<div class="ic-wrap" style="color:#FBBF24"><i class="fa-solid fa-wallet"></i></div>' +
            '<h4>余额不足</h4>' +
            '<p id="daCmRechargeText">可用余额不足，请先充值后再完成购买。</p>' +
            '</div>' +
            '<div class="sub-step-actions">' +
            '<button type="button" class="btn btn-secondary" id="daCmRechargeBack">返回</button>' +
            '<button type="button" class="btn btn-primary" id="daCmGoRecharge"><i class="fa-solid fa-bolt"></i> 去充值</button>' +
            '</div></div>' +

            '<div class="sub-modal-step" id="daCmStepPwdMissing">' +
            '<div class="sub-pwd-missing">' +
            '<div class="ic-wrap"><i class="fa-solid fa-lock-open"></i></div>' +
            '<h4>尚未设置支付密码</h4>' +
            '<p>购买数字商品需先设置 6 位支付密码（与登录密码不同）。设置完成后请返回继续支付。</p>' +
            '</div>' +
            '<div class="sub-step-actions">' +
            '<button type="button" class="btn btn-secondary" id="daCmPwdMissingBack">返回</button>' +
            '<button type="button" class="btn btn-primary" id="daCmGoSetPwd"><i class="fa-solid fa-shield-halved"></i> 前往设置</button>' +
            '</div></div>' +

            '<div class="sub-modal-step" id="daCmStepPayPwd">' +
            '<div class="sub-pay-summary">' +
            '<div class="row"><span>购买商品</span><span class="v" id="daCmPayTitle">—</span></div>' +
            '<div class="row"><span>支付金额</span><span class="v" id="daCmPayAmount">— USDT</span></div>' +
            '<div class="row"><span>扣款后余额</span><span class="v" id="daCmPayAfter">— USDT</span></div></div>' +
            '<div class="sub-pwd-stage"><div class="ic-wrap"><i class="fa-solid fa-lock"></i></div>' +
            '<h4 style="font-size:15px;font-weight:800;margin-bottom:4px">请输入支付密码</h4>' +
            '<p style="font-size:11px;color:var(--t-tertiary)">6 位资金密码 · 与登录密码不同</p></div>' +
            '<div class="sub-pwd-input" id="daCmPwdDots"><span class="dot"></span><span class="dot"></span><span class="dot"></span>' +
            '<span class="dot"></span><span class="dot"></span><span class="dot"></span></div>' +
            '<div class="sub-pwd-pad" id="daCmPwdPad">' +
            '<button type="button" data-digit="1">1</button><button type="button" data-digit="2">2</button><button type="button" data-digit="3">3</button>' +
            '<button type="button" data-digit="4">4</button><button type="button" data-digit="5">5</button><button type="button" data-digit="6">6</button>' +
            '<button type="button" data-digit="7">7</button><button type="button" data-digit="8">8</button><button type="button" data-digit="9">9</button>' +
            '<button type="button" data-action="clear"><i class="fa-solid fa-delete-left"></i></button>' +
            '<button type="button" data-digit="0">0</button>' +
            '<button type="button" data-action="submit"><i class="fa-solid fa-check"></i></button></div>' +
            '<div class="sub-step-actions"><button type="button" class="btn btn-secondary" id="daCmPwdBack">上一步</button></div></div>' +

            '<div class="sub-modal-step" id="daCmStepOk">' +
            '<div class="sub-result"><i class="fa-solid fa-circle-check"></i><h4>购买成功</h4>' +
            '<p id="daCmOkText">数字权益已发放到你的账户。</p></div>' +
            '<button type="button" class="btn btn-primary btn-block mt-16" id="daCmOkDone">完成</button></div>' +

            '</div></div>';
        while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
        bindOnce();
    }

    function renderPwdDots(isError) {
        var wrap = document.getElementById('daCmPwdDots');
        if (!wrap) return;
        wrap.querySelectorAll('.dot').forEach(function (dot, i) {
            dot.classList.remove('filled', 'err');
            if (isError) dot.classList.add('err');
            else if (i < pwdBuffer.length) dot.classList.add('filled');
            dot.textContent = i < pwdBuffer.length ? '●' : '';
        });
    }
    function resetPwd() {
        pwdBuffer = '';
        renderPwdDots(false);
    }

    function bindOwnerManageActions(p) {
        var Store = global.DigitalAssetsStore;
        var body = document.getElementById('daCmDetailBody');
        if (!body) return;
        var editBtn = body.querySelector('[data-da-act="edit"]');
        var delistBtn = body.querySelector('[data-da-act="delist"]');
        var relistBtn = body.querySelector('[data-da-act="relist"]');
        var removeBtn = body.querySelector('[data-da-act="remove"]');
        var closeBtn = body.querySelector('[data-da-act="close"]');
        if (editBtn) {
            editBtn.addEventListener('click', function () {
                openEditForm(p);
            });
        }
        if (delistBtn) {
            delistBtn.addEventListener('click', function () {
                confirmAction({
                    title: '确认下架',
                    message: '确定下架「' + p.title + '」吗？下架后新访客将无法购买；已进入支付确认的用户仍可完成当前订单。',
                    okText: '确认下架',
                    danger: true,
                    onConfirm: function () {
                        Store.delist(p.id);
                        toast('已下架');
                        var cb = state.onDone;
                        close();
                        if (typeof cb === 'function') cb();
                    }
                });
            });
        }
        if (relistBtn) {
            relistBtn.addEventListener('click', function () {
                var updated = Store.relist(p.id);
                if (!updated) return toast('上架失败', true);
                toast(updated.status === 'sold_out' ? '已恢复展示（售罄）' : '已重新上架');
                var cb = state.onDone;
                close();
                if (typeof cb === 'function') cb();
            });
        }
        if (removeBtn) {
            removeBtn.addEventListener('click', function () {
                confirmAction({
                    title: '移除橱窗',
                    message: '确定将「' + p.title + '」从橱窗移除吗？移除后不再出现在橱窗列表中。',
                    okText: '确认移除',
                    danger: true,
                    onConfirm: function () {
                        var res = Store.removeFromShowcase(p.id);
                        if (!res.ok) return toast(res.error || '移除失败', true);
                        toast('已从橱窗移除');
                        var cb = state.onDone;
                        close();
                        if (typeof cb === 'function') cb();
                    }
                });
            });
        }
        if (closeBtn) closeBtn.addEventListener('click', close);
    }

    function openEditForm(p) {
        var body = document.getElementById('daCmDetailBody');
        var head = document.getElementById('daCmHeadTitle');
        if (!body) return;
        if (head) head.innerHTML = '<i class="fa-solid fa-pen" style="color:#C084FC"></i> 编辑商品';
        body.innerHTML =
            '<div class="da-cm-edit">' +
            '<label class="da-cm-field"><span>标题</span><input type="text" id="daEditTitle" value="' + esc(p.title) + '"></label>' +
            '<label class="da-cm-field"><span>简介</span><textarea id="daEditDesc" rows="3">' + esc(p.description || '') + '</textarea></label>' +
            '<label class="da-cm-field"><span>价格（USDT）</span><input type="number" id="daEditPrice" min="0" step="0.01" value="' + Number(p.priceUsdt) + '"></label>' +
            '<label class="da-cm-field"><span>封面 URL</span><input type="text" id="daEditCover" value="' + esc(p.coverUrl || '') + '"></label>' +
            '<p class="note">修改后立即生效；不影响已完成订单。进行中的支付仍按用户确认时的金额完成。</p>' +
            '<div class="sub-step-actions" style="margin-top:12px">' +
            '<button type="button" class="btn btn-secondary" id="daEditCancel">取消</button>' +
            '<button type="button" class="btn btn-primary" id="daEditSave">保存</button>' +
            '</div></div>';
        document.getElementById('daEditCancel').addEventListener('click', function () {
            if (head) head.innerHTML = '<i class="fa-solid fa-sliders" style="color:#C084FC"></i> 管理商品';
            fillDetail(global.DigitalAssetsStore.getById(p.id), { ownerView: true });
        });
        document.getElementById('daEditSave').addEventListener('click', function () {
            var title = (document.getElementById('daEditTitle').value || '').trim();
            var desc = (document.getElementById('daEditDesc').value || '').trim();
            var price = Number(document.getElementById('daEditPrice').value);
            var cover = (document.getElementById('daEditCover').value || '').trim();
            if (!title) return toast('请填写标题', true);
            if (!(price >= 0)) return toast('请填写有效价格', true);
            var updated = global.DigitalAssetsStore.updateProduct(p.id, {
                title: title,
                description: desc,
                priceUsdt: price,
                coverUrl: cover || p.coverUrl
            });
            if (!updated) return toast('保存失败', true);
            toast('商品已更新');
            var cb = state.onDone;
            if (head) head.innerHTML = '<i class="fa-solid fa-sliders" style="color:#C084FC"></i> 管理商品';
            fillDetail(updated, { ownerView: true });
            if (typeof cb === 'function') cb();
        });
    }

    function fillDetail(p, opts) {
        opts = opts || {};
        var Store = global.DigitalAssetsStore;
        var Orders = global.DigitalAssetOrdersStore;
        var owned = Orders && Orders.hasEntitlement(p.id, opts.asVisitor && Orders.DEMO_BUYER ? Orders.DEMO_BUYER : undefined);
        var left = Store.remaining(p);
        var own = isOwnProduct(p);
        var manage = !!(opts.ownerView || (own && opts.forceManage));
        var preview = !!opts.preview;
        state.ownerView = manage;
        state.preview = preview;

        var canBuy = !manage && !preview && p.status === 'listed' && !owned &&
            (p.supplyMode === 'unlimited' || (left !== null && left > 0)) &&
            (!own || !!opts.asVisitor);

        var feeNote = '';
        if (global.MallCommerceConfigStore) {
            var cfg = global.MallCommerceConfigStore.load();
            feeNote = '平台服务费 ' + cfg.digitalPlatformFeePercent + '% · ';
        }
        var supply = p.supplyMode === 'limited'
            ? ('限量 ' + p.supplyTotal + ' · 已售 ' + (p.soldCount || 0) + ' · 剩余 ' + left)
            : ('无限发行 · 已售 ' + (p.soldCount || 0));

        var body = document.getElementById('daCmDetailBody');
        if (!body) return;

        var actionHtml = '';
        if (manage) {
            var manageBtns = '';
            manageBtns += '<button type="button" class="btn btn-primary btn-block" data-da-act="edit">编辑商品</button>';
            if (p.status === 'listed' || p.status === 'sold_out') {
                manageBtns += '<button type="button" class="btn btn-block" data-da-act="delist" style="margin-top:8px">下架</button>';
            } else if (p.status === 'delisted') {
                manageBtns += '<button type="button" class="btn btn-block" data-da-act="relist" style="margin-top:8px">重新上架</button>';
                manageBtns += '<button type="button" class="btn btn-block" data-da-act="remove" style="margin-top:8px">移除橱窗</button>';
            }
            manageBtns += '<button type="button" class="btn btn-secondary btn-block" data-da-act="close" style="margin-top:8px">关闭</button>';
            actionHtml =
                '<p class="note">本人管理：可编辑 / 下架 / 上架。下架后新访客不可购买；已进入支付流程的订单仍可完成。</p>' +
                '<div class="da-cm-actions">' + manageBtns + '</div>';
        } else if ((own && !opts.asVisitor) || preview) {
            actionHtml =
                '<p class="note">' + (preview ? '当前为访客预览，不可真实购买。' : '这是你发布的商品，请在「我的橱窗」中管理。') + '</p>' +
                '<a class="btn btn-primary btn-block" href="creator-showcase.html?owner=1&name=' +
                encodeURIComponent(p.creatorName || '') + '">去我的橱窗管理</a>';
        } else if (canBuy) {
            actionHtml =
                '<p class="note">' + feeNote + '购买成功即时获得数字权益 · 无需物流与地址</p>' +
                '<button type="button" class="btn btn-primary btn-block" id="daCmBuyBtn"><i class="fa-solid fa-bolt"></i> 立即购买</button>';
        } else {
            actionHtml =
                '<p class="note">' + feeNote + '购买成功即时获得数字权益 · 无需物流与地址</p>' +
                '<button type="button" class="btn btn-block" disabled>' +
                (owned ? '已获得权益' : (p.status === 'sold_out' ? '已售罄' : '暂不可购')) +
                '</button>';
        }

        body.innerHTML =
            '<div class="da-cm-cover"><img src="' + esc(p.coverUrl) + '" alt=""></div>' +
            '<div class="da-cm-meta">' +
            '<div class="type-row">' +
            '<span class="da-chip">' + esc(Store.typeLabel(p.assetType)) + '</span>' +
            '<span class="da-chip">' + esc(Store.statusLabel(p.status)) + '</span>' +
            (manage ? '<span class="da-chip">本人商品</span>' : '') +
            (owned && !manage ? '<span class="da-chip">已拥有</span>' : '') +
            '</div>' +
            '<h2>' + esc(p.title) + '</h2>' +
            '<p class="desc">' + esc(p.description || '') + '</p>' +
            '<div class="creator">' + esc(p.creatorName || '') + '</div>' +
            '<div class="price"><b>' + Number(p.priceUsdt).toFixed(2) + '</b> <span>USDT</span></div>' +
            '<div class="supply">' + esc(supply) + '</div>' +
            actionHtml +
            '</div>';

        if (manage) {
            bindOwnerManageActions(p);
        } else {
            var buy = document.getElementById('daCmBuyBtn');
            if (buy) {
                buy.addEventListener('click', function () {
                    openConfirm(p);
                });
            }
        }
    }

    function openConfirm(p) {
        if (!p) return;
        if (state.ownerView || state.preview) {
            toast(state.preview ? '预览模式不可购买' : '管理视图不可购买', true);
            return;
        }
        if (isOwnProduct(p) && !state.asVisitor) {
            toast('不能购买自己的商品', true);
            return;
        }
        state.productId = p.id;
        state.title = p.title;
        state.price = Number(p.priceUsdt) || 0;
        state.creatorName = p.creatorName || '';
        state.checkoutLocked = true;
        var bal = getBalance();
        var head = document.getElementById('daCmHeadTitle');
        if (head) head.innerHTML = '<i class="fa-solid fa-receipt" style="color:#FBBF24"></i> 确认订单';
        document.getElementById('daCmConfirmTitle').textContent = p.title;
        document.getElementById('daCmConfirmSub').textContent = (p.creatorName || '') + ' · 数字资产';
        document.getElementById('daCmBalanceVal').textContent = formatBal(bal) + ' USDT';
        document.getElementById('daCmBalanceBar').classList.toggle('is-low', bal < state.price);
        document.getElementById('daCmSumTitle').textContent = p.title;
        document.getElementById('daCmSumPrice').textContent = fmt(state.price) + ' USDT';
        document.getElementById('daCmSumAfter').textContent = formatBal(bal - state.price) + ' USDT';
        showStep('daCmStepConfirm');
    }

    function proceedAfterConfirm() {
        var price = state.price;
        if (!canAfford(price)) {
            var need = Math.max(0, price - getBalance());
            document.getElementById('daCmRechargeText').textContent =
                '可用余额不足，还需充值约 ' + fmt(need) + ' USDT 后再完成购买。';
            var head = document.getElementById('daCmHeadTitle');
            if (head) head.innerHTML = '<i class="fa-solid fa-wallet" style="color:#FBBF24"></i> 余额不足';
            showStep('daCmStepRecharge');
            return;
        }
        if (!hasPayPassword()) {
            var h2 = document.getElementById('daCmHeadTitle');
            if (h2) h2.innerHTML = '<i class="fa-solid fa-lock" style="color:#C084FC"></i> 设置支付密码';
            showStep('daCmStepPwdMissing');
            return;
        }
        openPayPwd();
    }

    function openPayPwd() {
        var bal = getBalance();
        var head = document.getElementById('daCmHeadTitle');
        if (head) head.innerHTML = '<i class="fa-solid fa-lock" style="color:#C084FC"></i> 支付密码';
        document.getElementById('daCmPayTitle').textContent = state.title;
        document.getElementById('daCmPayAmount').textContent = fmt(state.price) + ' USDT';
        document.getElementById('daCmPayAfter').textContent = formatBal(bal - state.price) + ' USDT';
        resetPwd();
        showStep('daCmStepPayPwd');
    }

    function submitPay() {
        if (pwdBuffer.length !== 6) {
            toast('请输入 6 位支付密码', true);
            return;
        }
        var store = payPwdStore();
        if (store && store.verify && !store.verify(pwdBuffer)) {
            renderPwdDots(true);
            toast('支付密码错误，请重试', true);
            setTimeout(resetPwd, 500);
            return;
        }
        if (!canAfford(state.price)) {
            proceedAfterConfirm();
            return;
        }
        var Orders = global.DigitalAssetOrdersStore;
        var res = Orders.purchase(state.productId, {
            checkoutLocked: !!state.checkoutLocked,
            asVisitor: !!state.asVisitor
        });
        if (!res.ok) {
            if ((res.error || '').indexOf('余额') >= 0) {
                proceedAfterConfirm();
                return;
            }
            toast(res.error || '购买失败', true);
            resetPwd();
            return;
        }
        var head = document.getElementById('daCmHeadTitle');
        if (head) head.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#34D399"></i> 购买成功';
        document.getElementById('daCmOkText').textContent =
            '已获得「' + state.title + '」数字权益，扣款 ' + fmt(state.price) + ' USDT。';
        showStep('daCmStepOk');
    }

    function close() {
        var ovl = document.getElementById('ovlDaCommerce');
        if (ovl) {
            ovl.classList.remove('show');
            ovl.setAttribute('aria-hidden', 'true');
        }
        resetPwd();
        showStep('daCmStepDetail');
    }

    function bindOnce() {
        var ovl = document.getElementById('ovlDaCommerce');
        if (!ovl || ovl._bound) return;
        ovl._bound = true;
        document.getElementById('daCmClose').addEventListener('click', close);
        ovl.addEventListener('click', function (e) { if (e.target === ovl) close(); });
        document.getElementById('daCmConfirmBack').addEventListener('click', function () {
            var Store = global.DigitalAssetsStore;
            var p = Store.getById(state.productId);
            var head = document.getElementById('daCmHeadTitle');
            if (head) head.innerHTML = '<i class="fa-solid fa-gem" style="color:#C084FC"></i> 数字商品';
            if (p) {
                fillDetail(p, {
                    ownerView: state.ownerView,
                    preview: state.preview
                });
            }
            showStep('daCmStepDetail');
        });
        document.getElementById('daCmConfirmPay').addEventListener('click', proceedAfterConfirm);
        document.getElementById('daCmRechargeBack').addEventListener('click', function () {
            openConfirm(global.DigitalAssetsStore.getById(state.productId));
        });
        document.getElementById('daCmGoRecharge').addEventListener('click', function () {
            goRecharge(Math.max(0, state.price - getBalance()));
        });
        document.getElementById('daCmPwdMissingBack').addEventListener('click', function () {
            openConfirm(global.DigitalAssetsStore.getById(state.productId));
        });
        document.getElementById('daCmGoSetPwd').addEventListener('click', goSetPayPassword);
        document.getElementById('daCmPwdBack').addEventListener('click', function () {
            openConfirm(global.DigitalAssetsStore.getById(state.productId));
        });
        document.getElementById('daCmOkDone').addEventListener('click', function () {
            var cb = state.onDone;
            close();
            if (typeof cb === 'function') cb();
        });
        document.getElementById('daCmPwdPad').addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (!btn) return;
            var digit = btn.getAttribute('data-digit');
            var action = btn.getAttribute('data-action');
            if (digit != null) {
                if (pwdBuffer.length >= 6) return;
                pwdBuffer += digit;
                renderPwdDots(false);
                if (pwdBuffer.length === 6) setTimeout(submitPay, 120);
            } else if (action === 'clear') {
                pwdBuffer = pwdBuffer.slice(0, -1);
                renderPwdDots(false);
            } else if (action === 'submit') {
                submitPay();
            }
        });
    }

    function openDetail(productId, opts) {
        opts = opts || {};
        ensureOverlay();
        var Store = global.DigitalAssetsStore;
        var p = Store && Store.getById(productId);
        if (!p) {
            toast('商品不存在', true);
            return;
        }
        state.productId = p.id;
        state.title = p.title;
        state.price = Number(p.priceUsdt) || 0;
        state.creatorName = p.creatorName || '';
        state.onDone = opts.onDone || null;
        state.ownerView = !!opts.ownerView;
        state.preview = !!opts.preview;
        state.asVisitor = !!opts.asVisitor;
        state.checkoutLocked = false;
        var head = document.getElementById('daCmHeadTitle');
        if (head) {
            head.innerHTML = state.ownerView
                ? '<i class="fa-solid fa-sliders" style="color:#C084FC"></i> 管理商品'
                : '<i class="fa-solid fa-gem" style="color:#C084FC"></i> 数字商品';
        }
        fillDetail(p, opts);
        showStep('daCmStepDetail');
        var ovl = document.getElementById('ovlDaCommerce');
        ovl.classList.add('show');
        ovl.setAttribute('aria-hidden', 'false');
    }

    function openPurchase(productId, opts) {
        opts = opts || {};
        ensureOverlay();
        var Store = global.DigitalAssetsStore;
        var p = Store && Store.getById(productId);
        if (!p) {
            toast('商品不存在', true);
            return;
        }
        state.onDone = opts.onDone || null;
        state.ownerView = !!opts.ownerView;
        state.preview = !!opts.preview;
        state.asVisitor = !!opts.asVisitor;
        if (state.ownerView) {
            openDetail(productId, opts);
            return;
        }
        if (state.preview) {
            toast('预览模式不可购买', true);
            openDetail(productId, opts);
            return;
        }
        if (isOwnProduct(p) && !state.asVisitor) {
            openDetail(productId, { ownerView: true, onDone: opts.onDone });
            toast('不能购买自己的商品', true);
            return;
        }
        openConfirm(p);
        var ovl = document.getElementById('ovlDaCommerce');
        ovl.classList.add('show');
        ovl.setAttribute('aria-hidden', 'false');
    }

    function confirmAction(opts) {
        opts = opts || {};
        var id = 'ovlDaConfirmSimple';
        var existing = document.getElementById(id);
        if (existing) existing.remove();
        var wrap = document.createElement('div');
        wrap.id = id;
        wrap.className = 'inline-overlay show';
        wrap.setAttribute('aria-hidden', 'false');
        wrap.style.zIndex = '9600';
        wrap.innerHTML =
            '<div class="iol-panel" style="max-width:400px" data-da-confirm-panel="1">' +
            '<div class="iol-head"><h3>' + esc(opts.title || '确认') + '</h3>' +
            '<button type="button" class="iol-close" data-da-confirm="cancel" aria-label="关闭"><i class="fa-solid fa-xmark"></i></button></div>' +
            '<p style="font-size:13px;color:var(--t-secondary);line-height:1.55;margin:0 0 18px">' + esc(opts.message || '') + '</p>' +
            '<div class="sub-step-actions">' +
            '<button type="button" class="btn btn-secondary" data-da-confirm="cancel">取消</button>' +
            '<button type="button" class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" data-da-confirm="ok">' +
            esc(opts.okText || '确认') + '</button></div></div>';
        document.body.appendChild(wrap);
        function done(ok) {
            wrap.remove();
            if (ok && typeof opts.onConfirm === 'function') opts.onConfirm();
        }
        wrap.addEventListener('click', function (e) {
            var act = e.target.closest('[data-da-confirm]');
            if (e.target === wrap) {
                done(false);
                return;
            }
            if (!act) return;
            e.preventDefault();
            e.stopPropagation();
            done(act.getAttribute('data-da-confirm') === 'ok');
        });
    }

    global.DigitalAssetCommerceModal = {
        openDetail: openDetail,
        openPurchase: openPurchase,
        confirm: confirmAction,
        close: close,
        isOwnProduct: isOwnProduct,
        currentUserId: currentUserId
    };
})(typeof window !== 'undefined' ? window : this);
