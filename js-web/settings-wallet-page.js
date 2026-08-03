/**
 * 设置 · 钱包与支付 · 连接/切换/QR/编辑/解绑 + 默认充提偏好下拉
 */
(function () {
    var STORAGE_WALLETS = 'fl_settings_wallets_v1';
    var STORAGE_PREFS = 'fl_settings_wallet_prefs_v1';

    var DEFAULT_WALLETS = [
        {
            id: 'w1',
            nickname: '主钱包 · MetaMask',
            provider: 'MetaMask',
            chain: 'Ethereum',
            chainKey: 'eth',
            address: '0x7Bf2a8c91F3d4E5b6C7890D1e2F3a4B5c6D9',
            addressShort: '0x7Bf2…c3D9',
            tokens: [{ sym: 'USDT', val: '2,485.32' }, { sym: 'ETH', val: '0.42' }],
            isPrimary: true,
            gradient: 'linear-gradient(135deg, #1a1a2e, #2D1B4E)',
            badgeClass: 'eth'
        },
        {
            id: 'w2',
            nickname: '备用钱包 · WalletConnect',
            provider: 'WalletConnect',
            chain: 'Polygon',
            chainKey: 'polygon',
            address: '0xA9c1b2D3e4F5678901234567890AbCdEf7e2',
            addressShort: '0xA9c1…F7e2',
            tokens: [{ sym: 'USDT', val: '126.40' }, { sym: 'MATIC', val: '82.5' }],
            isPrimary: false,
            gradient: 'linear-gradient(135deg, #0F1F3D, #1F3B7A)',
            badgeClass: 'polygon'
        }
    ];

    var PREF_OPTIONS = {
        rechargeNetwork: [
            { id: 'eth', label: 'Ethereum (ERC-20)', desc: 'USDT · 高 Gas · 约 2–5 分钟', icon: 'net', iconContent: '<i class="fa-brands fa-ethereum"></i>' },
            { id: 'polygon', label: 'Polygon (Matic)', desc: 'USDT · 推荐 · 低 Gas · 约 30 秒', icon: 'net', iconContent: '<i class="fa-solid fa-circle-nodes"></i>', recommended: true },
            { id: 'bsc', label: 'BNB Chain (BEP-20)', desc: 'USDT · 低 Gas · 约 1 分钟', icon: 'net', iconContent: 'B' },
            { id: 'arb', label: 'Arbitrum One', desc: 'USDT · L2 · 低 Gas', icon: 'net', iconContent: 'A' }
        ]
    };

    var DEFAULT_PREFS = {
        rechargeNetwork: 'polygon'
    };

    var wallets = [];
    var prefs = {};
    var connectState = { provider: '', step: 'pick' };

    /** Web 端走扫码连接的钱包（Coinbase / OKX / WalletConnect） */
    var QR_CONNECT_PROVIDERS = {
        walletconnect: {
            label: 'WalletConnect',
            hint: '使用 MetaMask / OKX / Trust 等 App 扫描上方二维码，或在移动端点击下方 Deep Link 直接唤起钱包。',
            qrData: 'GOODFANS_WC_Settings_V2',
            deeplink: '使用 Deep Link 打开钱包'
        },
        coinbase: {
            label: 'Coinbase Wallet',
            hint: '打开 Coinbase Wallet App，点击右上角「扫码」，对准上方二维码完成连接。PC 端无插件时均通过 App 扫码绑定。',
            qrData: 'GOODFANS_CoinbaseWallet_Connect',
            deeplink: '使用 Coinbase Wallet Deep Link'
        },
        okx: {
            label: 'OKX Wallet',
            hint: '打开 OKX Wallet App → 钱包 → 扫一扫，扫描上方二维码。亦支持 WalletConnect 协议连接。',
            qrData: 'GOODFANS_OKXWallet_Connect',
            deeplink: '使用 OKX Deep Link 打开'
        }
    };

    var EXTENSION_PROVIDERS = {
        metamask: { label: 'MetaMask', waiting: '请在浏览器 MetaMask 插件弹窗中点击「连接」。' },
        rainbow: { label: 'Rainbow', waiting: '请在 Rainbow 浏览器插件中批准连接请求。' }
    };
    var primaryPickId = '';
    var unbindTargetId = '';
    var editTargetId = '';
    var qrTargetId = '';

    function $(id) { return document.getElementById(id); }

    function toast(msg, type) {
        var el = $('walPageToast');
        if (!el) return;
        el.textContent = msg;
        el.className = 'wal-toast show' + (type === 'err' ? ' err' : ' ok');
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { el.classList.remove('show'); }, 2600);
    }

    function loadJson(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function saveJson(key, data) {
        try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* ignore */ }
    }

    function loadWallets() {
        var stored = loadJson(STORAGE_WALLETS, null);
        wallets = Array.isArray(stored) && stored.length ? stored : DEFAULT_WALLETS.slice();
    }

    function persistWallets() {
        saveJson(STORAGE_WALLETS, wallets);
    }

    function loadPrefs() {
        prefs = Object.assign({}, DEFAULT_PREFS, loadJson(STORAGE_PREFS, {}));
    }

    function persistPrefs() {
        saveJson(STORAGE_PREFS, prefs);
    }

    function escHtml(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    }

    function chainBadgeHtml(w) {
        if (w.chainKey === 'eth') {
            return '<span class="chain-badge eth"><i class="fa-brands fa-ethereum"></i> Ethereum</span>';
        }
        if (w.chainKey === 'polygon') {
            return '<span class="chain-badge" style="background:rgba(31,184,232,0.25);color:#7DD3FC;border:1px solid rgba(31,184,232,0.4)"><i class="fa-solid fa-circle-nodes"></i> Polygon</span>';
        }
        return '<span class="chain-badge"><i class="fa-solid fa-link"></i> ' + escHtml(w.chain) + '</span>';
    }

    function renderWalletCards() {
        var grid = $('walCardsGrid');
        var countEl = $('walConnectedCount');
        if (!grid) return;

        if (countEl) countEl.textContent = String(wallets.length);

        grid.innerHTML = wallets.map(function (w) {
            var primaryTag = w.isPrimary ? ' <span class="tag tag-success wal-primary-tag" style="margin-left:6px;font-size:10px">默认</span>' : '';
            var actions = w.isPrimary
                ? '<button type="button" class="wal-btn-qr" data-wallet-id="' + w.id + '" title="收款 QR"><i class="fa-solid fa-qrcode"></i></button>'
                + '<button type="button" class="wal-btn-edit" data-wallet-id="' + w.id + '" title="编辑备注"><i class="fa-solid fa-pen"></i></button>'
                : '<button type="button" class="wal-btn-qr" data-wallet-id="' + w.id + '" title="收款 QR"><i class="fa-solid fa-qrcode"></i></button>'
                + '<button type="button" class="wal-btn-unbind" data-wallet-id="' + w.id + '" title="解绑"><i class="fa-solid fa-link-slash"></i></button>';
            var balHtml = w.tokens.map(function (t) {
                return '<div class="b"><span class="v">' + escHtml(t.val) + '</span> ' + escHtml(t.sym) + '</div>';
            }).join('');
            return (
                '<div class="w-card" data-wallet-id="' + w.id + '" style="background:' + escHtml(w.gradient) + '">' +
                '<div class="w-actions">' + actions + '</div>' +
                '<div class="w-top">' + chainBadgeHtml(w) + '</div>' +
                '<div class="w-name">' + escHtml(w.nickname) + primaryTag + '</div>' +
                '<div class="w-addr">' + escHtml(w.addressShort) +
                ' <span class="ic-cp wal-btn-copy" data-address="' + escHtml(w.address) + '" title="复制地址"><i class="fa-regular fa-copy"></i></span></div>' +
                '<div class="w-bal">' + balHtml + '</div></div>'
            );
        }).join('');
    }

    function openOverlay(id) {
        var o = $(id);
        if (o) {
            o.classList.add('show');
            o.setAttribute('aria-hidden', 'false');
        }
    }

    function closeOverlay(id) {
        var o = $(id);
        if (o) {
            o.classList.remove('show');
            o.setAttribute('aria-hidden', 'true');
        }
    }

    function setConnectStep(step) {
        connectState.step = step;
        document.querySelectorAll('#ovlWalletConnect .wal-step').forEach(function (el) {
            el.classList.toggle('active', el.getAttribute('data-step') === step);
        });
        var foot = $('walConnectFoot');
        var btnBack = $('btnWalConnectBack');
        var btnNext = $('btnWalConnectNext');
        if (!foot || !btnNext) return;

        btnBack.style.display = step === 'pick' || step === 'success' || step === 'conflict' ? 'none' : '';
        foot.style.display = step === 'waiting' ? 'none' : '';

        if (step === 'pick') {
            btnNext.textContent = '取消';
            btnNext.className = 'btn btn-secondary';
            var subPick = $('walConnectSub');
            if (subPick) subPick.textContent = '选择钱包提供商 · 签名验证后绑定至当前账号';
        } else if (step === 'wc-qr') {
            btnNext.textContent = '模拟扫码成功';
            btnNext.className = 'btn btn-primary';
        } else if (step === 'sign') {
            btnNext.innerHTML = '<i class="fa-solid fa-signature"></i> 确认签名';
            btnNext.className = 'btn btn-primary';
        } else if (step === 'success') {
            btnNext.innerHTML = '<i class="fa-solid fa-check"></i> 完成';
            btnNext.className = 'btn btn-primary';
        } else if (step === 'conflict') {
            btnNext.textContent = '更换钱包';
            btnNext.className = 'btn btn-primary';
        }
    }

    function openConnect() {
        connectState = { provider: '', step: 'pick' };
        openOverlay('ovlWalletConnect');
        setConnectStep('pick');
    }

    function closeConnect() {
        closeOverlay('ovlWalletConnect');
        connectState = { provider: '', step: 'pick' };
        var sub = $('walConnectSub');
        if (sub) sub.textContent = '选择钱包提供商 · 签名验证后绑定至当前账号';
    }

    function updateConnectQrUi() {
        var meta = QR_CONNECT_PROVIDERS[connectState.provider] || QR_CONNECT_PROVIDERS.walletconnect;
        var img = $('walConnectQrImg');
        var hint = $('walConnectQrHint');
        var badge = $('walConnectQrBadge');
        var sub = $('walConnectSub');
        var deeplink = $('walConnectDeeplink');
        if (img) {
            img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=152x152&data=' + encodeURIComponent(meta.qrData);
            img.alt = meta.label + ' 连接二维码';
        }
        if (hint) hint.textContent = meta.hint;
        if (badge) badge.textContent = meta.label;
        if (sub) sub.textContent = '请使用 ' + meta.label + ' 扫码连接 · 完成后将请求签名验证';
        if (deeplink) {
            var span = deeplink.querySelector('span');
            if (span) span.innerHTML = '<i class="fa-solid fa-bolt" style="color:#fbbf24"></i> ' + meta.deeplink;
        }
    }

    function updateConnectWaitingUi() {
        var meta = EXTENSION_PROVIDERS[connectState.provider];
        var waitSub = document.querySelector('#ovlWalletConnect [data-step="waiting"] .s');
        var sub = $('walConnectSub');
        if (meta && waitSub) waitSub.textContent = meta.waiting;
        if (meta && sub) sub.textContent = '等待 ' + meta.label + ' 授权 · 请在浏览器插件中确认';
    }

    function pickProvider(id) {
        connectState.provider = id;
        if (QR_CONNECT_PROVIDERS[id]) {
            updateConnectQrUi();
            setConnectStep('wc-qr');
            return;
        }
        updateConnectWaitingUi();
        setConnectStep('waiting');
        setTimeout(function () {
            if (connectState.step === 'waiting') setConnectStep('sign');
        }, 1800);
    }

    function randomAddress() {
        var hex = '0123456789abcdef';
        var s = '0x';
        for (var i = 0; i < 40; i++) s += hex[Math.floor(Math.random() * 16)];
        return s;
    }

    function shortAddr(a) {
        if (!a || a.length < 12) return a;
        return a.slice(0, 6) + '…' + a.slice(-4);
    }

    function finishConnect(success) {
        if (!success) {
            setConnectStep('conflict');
            return;
        }
        var addr = randomAddress();
        var providerNames = { metamask: 'MetaMask', rainbow: 'Rainbow', walletconnect: 'WalletConnect', okx: 'OKX Wallet', coinbase: 'Coinbase Wallet' };
        var name = providerNames[connectState.provider] || 'Web3 钱包';
        wallets.push({
            id: 'w' + Date.now(),
            nickname: '新钱包 · ' + name,
            provider: name,
            chain: 'Ethereum',
            chainKey: 'eth',
            address: addr,
            addressShort: shortAddr(addr),
            tokens: [{ sym: 'USDT', val: '0.00' }, { sym: 'ETH', val: '0.00' }],
            isPrimary: false,
            gradient: 'linear-gradient(135deg, #1B2838, #2A3F5F)',
            badgeClass: 'eth'
        });
        persistWallets();
        renderWalletCards();
        setConnectStep('success');
        var succEl = $('walConnectSuccessDesc');
        if (succEl) succEl.textContent = name + ' 已绑定 · ' + shortAddr(addr);
    }

    function openPrimary() {
        if (wallets.length < 2) {
            toast('至少需要 2 个钱包才能切换主钱包', 'err');
            return;
        }
        var current = wallets.filter(function (w) { return w.isPrimary; })[0];
        primaryPickId = current ? current.id : wallets[0].id;
        renderPrimaryList();
        openOverlay('ovlWalletPrimary');
    }

    function renderPrimaryList() {
        var list = $('walPrimaryList');
        if (!list) return;
        list.innerHTML = wallets.map(function (w) {
            var sel = w.id === primaryPickId ? ' selected' : '';
            var ic = w.chainKey === 'polygon'
                ? '<div class="chain" style="background:rgba(31,184,232,0.2);color:#7DD3FC"><i class="fa-solid fa-circle-nodes"></i></div>'
                : '<div class="chain" style="background:rgba(98,126,234,0.2);color:#a8b8ff"><i class="fa-brands fa-ethereum"></i></div>';
            return (
                '<div class="wal-primary-item' + sel + '" data-id="' + w.id + '" role="button" tabindex="0">' +
                ic +
                '<div class="info"><div class="n">' + escHtml(w.nickname) + (w.isPrimary ? ' <span class="tag tag-success" style="font-size:10px">当前主钱包</span>' : '') + '</div>' +
                '<div class="a">' + escHtml(w.addressShort) + '</div></div>' +
                '<i class="fa-solid fa-circle-check tick"></i></div>'
            );
        }).join('');

        var cur = wallets.filter(function (w) { return w.isPrimary; })[0];
        var pick = wallets.filter(function (w) { return w.id === primaryPickId; })[0];
        var cmp = $('walPrimaryCompare');
        if (cmp && cur && pick && cur.id !== pick.id) {
            cmp.style.display = 'block';
            cmp.innerHTML = '主钱包将切换为 <strong>' + escHtml(pick.nickname) + '</strong>（' + escHtml(pick.addressShort) + '）。默认充值/提现地址将同步更新。';
        } else if (cmp) {
            cmp.style.display = 'none';
        }
    }

    function confirmPrimary() {
        var cur = wallets.filter(function (w) { return w.isPrimary; })[0];
        if (cur && cur.id === primaryPickId) {
            closeOverlay('ovlWalletPrimary');
            toast('已是当前主钱包');
            return;
        }
        wallets.forEach(function (w) { w.isPrimary = w.id === primaryPickId; });
        persistWallets();
        renderWalletCards();
        closeOverlay('ovlWalletPrimary');
        toast('主钱包已切换');
    }

    function openQr(walletId) {
        var w = wallets.filter(function (x) { return x.id === walletId; })[0];
        if (!w) return;
        qrTargetId = walletId;
        var img = $('walQrImage');
        var addrEl = $('walQrAddr');
        var netEl = $('walQrNetwork');
        if (img) img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=152x152&data=' + encodeURIComponent(w.address);
        if (addrEl) addrEl.textContent = w.address;
        if (netEl) netEl.innerHTML = chainBadgeHtml(w);
        openOverlay('ovlWalletQr');
    }

    function openEdit(walletId) {
        var w = wallets.filter(function (x) { return x.id === walletId; })[0];
        if (!w) return;
        editTargetId = walletId;
        var inp = $('walEditNickname');
        if (inp) inp.value = w.nickname;
        openOverlay('ovlWalletEdit');
    }

    function saveEdit() {
        var w = wallets.filter(function (x) { return x.id === editTargetId; })[0];
        var inp = $('walEditNickname');
        if (!w || !inp) return;
        var val = inp.value.trim();
        if (!val) {
            toast('请输入钱包备注名', 'err');
            return;
        }
        if (val.length > 32) {
            toast('备注名最多 32 个字符', 'err');
            return;
        }
        w.nickname = val;
        persistWallets();
        renderWalletCards();
        closeOverlay('ovlWalletEdit');
        toast('钱包备注已更新');
    }

    function openUnbind(walletId) {
        var w = wallets.filter(function (x) { return x.id === walletId; })[0];
        if (!w) return;
        if (w.isPrimary) {
            toast('主钱包不可解绑，请先切换主钱包', 'err');
            return;
        }
        unbindTargetId = walletId;
        var nameEl = $('walUnbindName');
        var chk = $('walUnbindAgree');
        var code = $('walUnbindCode');
        if (nameEl) nameEl.textContent = w.nickname + ' · ' + w.addressShort;
        if (chk) chk.checked = false;
        if (code) code.value = '';
        $('btnWalUnbindConfirm')?.setAttribute('disabled', 'disabled');
        openOverlay('ovlWalletUnbind');
    }

    function confirmUnbind() {
        var code = $('walUnbindCode');
        if (!code || code.value.trim().length < 6) {
            toast('请输入 6 位 2FA 验证码', 'err');
            return;
        }
        wallets = wallets.filter(function (w) { return w.id !== unbindTargetId; });
        persistWallets();
        renderWalletCards();
        closeOverlay('ovlWalletUnbind');
        toast('钱包已解绑');
    }

    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { toast('地址已复制'); });
            return;
        }
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            toast('地址已复制');
        } catch (e) {
            toast('复制失败', 'err');
        }
        ta.remove();
    }

    /* ----- 自定义下拉 ----- */
    function renderPrefDropdown(key) {
        var wrap = document.querySelector('.set-pref-dd[data-pref="' + key + '"]');
        if (!wrap) return;
        var options = PREF_OPTIONS[key];
        var selected = prefs[key];
        var opt = options.filter(function (o) { return o.id === selected; })[0] || options[0];
        var trigger = wrap.querySelector('.set-pref-dd-trigger');
        var panel = wrap.querySelector('.set-pref-dd-panel');
        if (!trigger || !panel) return;

        trigger.innerHTML =
            '<span class="opt-ic ' + opt.icon + '">' + opt.iconContent + '</span>' +
            '<span class="mid"><span class="n">' + escHtml(opt.label) + '</span>' +
            (opt.desc ? '<span class="d">' + escHtml(opt.desc) + '</span>' : '') + '</span>' +
            '<i class="fa-solid fa-chevron-down chev"></i>';

        panel.innerHTML = options.map(function (o) {
            var sel = o.id === selected ? ' selected' : '';
            var rec = o.recommended ? '<span class="badge-rec">推荐</span>' : '';
            return (
                '<button type="button" class="set-pref-dd-item' + sel + '" data-id="' + o.id + '">' +
                '<span class="opt-ic ' + o.icon + '">' + o.iconContent + '</span>' +
                '<span class="mid"><span class="n">' + escHtml(o.label) + rec + '</span>' +
                (o.desc ? '<span class="d">' + escHtml(o.desc) + '</span>' : '') + '</span>' +
                '<i class="fa-solid fa-check tick"></i></button>'
            );
        }).join('');
    }

    function closeAllPrefDd() {
        document.querySelectorAll('.set-pref-dd.open').forEach(function (el) { el.classList.remove('open'); });
        document.querySelector('.set-card-prefs')?.classList.remove('is-dd-open');
    }

    function syncPrefDdOpenState() {
        var card = document.querySelector('.set-card-prefs');
        if (!card) return;
        var anyOpen = document.querySelector('.set-pref-dd.open');
        card.classList.toggle('is-dd-open', !!anyOpen);
    }

    function initPrefDropdowns() {
        ['rechargeNetwork'].forEach(renderPrefDropdown);

        document.querySelectorAll('.set-pref-dd').forEach(function (wrap) {
            var key = wrap.getAttribute('data-pref');
            wrap.addEventListener('click', function (e) {
                var item = e.target.closest('.set-pref-dd-item');
                if (item) {
                    e.stopPropagation();
                    prefs[key] = item.getAttribute('data-id');
                    persistPrefs();
                    renderPrefDropdown(key);
                    closeAllPrefDd();
                    toast('默认偏好已保存');
                    return;
                }
                var trigger = e.target.closest('.set-pref-dd-trigger');
                if (trigger) {
                    e.stopPropagation();
                    var open = wrap.classList.contains('open');
                    closeAllPrefDd();
                    if (!open) wrap.classList.add('open');
                    syncPrefDdOpenState();
                }
            });
        });

        document.addEventListener('click', function () { closeAllPrefDd(); });
    }

    function bindEvents() {
        $('btnWalConnect')?.addEventListener('click', openConnect);
        $('btnWalPrimary')?.addEventListener('click', openPrimary);

        document.querySelectorAll('[data-wal-close]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                closeOverlay(btn.getAttribute('data-wal-close'));
            });
        });

        document.querySelectorAll('.wal-provider-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                pickProvider(btn.getAttribute('data-provider'));
            });
        });

        $('btnWalConnectBack')?.addEventListener('click', function () {
            if (connectState.step === 'wc-qr' || connectState.step === 'sign') setConnectStep('pick');
        });

        $('btnWalConnectNext')?.addEventListener('click', function () {
            if (connectState.step === 'pick') closeConnect();
            else if (connectState.step === 'wc-qr') setConnectStep('sign');
            else if (connectState.step === 'sign') finishConnect(true);
            else if (connectState.step === 'success') closeConnect();
            else if (connectState.step === 'conflict') setConnectStep('pick');
        });

        $('walConnectDeeplink')?.addEventListener('click', function () {
            var meta = QR_CONNECT_PROVIDERS[connectState.provider];
            toast('已尝试 ' + (meta ? meta.deeplink : 'Deep Link') + '（原型）');
            setTimeout(function () { setConnectStep('sign'); }, 800);
        });

        $('btnWalPrimaryConfirm')?.addEventListener('click', confirmPrimary);
        $('walPrimaryList')?.addEventListener('click', function (e) {
            var item = e.target.closest('.wal-primary-item');
            if (!item) return;
            primaryPickId = item.getAttribute('data-id');
            renderPrimaryList();
        });

        $('btnWalQrCopy')?.addEventListener('click', function () {
            var w = wallets.filter(function (x) { return x.id === qrTargetId; })[0];
            if (w) copyText(w.address);
        });

        $('btnWalEditSave')?.addEventListener('click', saveEdit);
        $('walUnbindAgree')?.addEventListener('change', function () {
            var btn = $('btnWalUnbindConfirm');
            if (btn) {
                if (this.checked) btn.removeAttribute('disabled');
                else btn.setAttribute('disabled', 'disabled');
            }
        });
        $('btnWalUnbindConfirm')?.addEventListener('click', confirmUnbind);
        $('btnWalSendUnbindCode')?.addEventListener('click', function () {
            toast('验证码已发送至认证器 APP（原型）');
        });

        $('walCardsGrid')?.addEventListener('click', function (e) {
            var qr = e.target.closest('.wal-btn-qr');
            if (qr) { e.stopPropagation(); openQr(qr.getAttribute('data-wallet-id')); return; }
            var edit = e.target.closest('.wal-btn-edit');
            if (edit) { e.stopPropagation(); openEdit(edit.getAttribute('data-wallet-id')); return; }
            var unbind = e.target.closest('.wal-btn-unbind');
            if (unbind) { e.stopPropagation(); openUnbind(unbind.getAttribute('data-wallet-id')); return; }
            var cp = e.target.closest('.wal-btn-copy');
            if (cp) { e.stopPropagation(); copyText(cp.getAttribute('data-address')); }
        });

        document.querySelectorAll('.inline-overlay').forEach(function (ovl) {
            ovl.addEventListener('click', function (e) {
                if (e.target === ovl) ovl.classList.remove('show');
            });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            document.querySelectorAll('.inline-overlay.show').forEach(function (o) {
                o.classList.remove('show');
            });
        });
    }

    function applyUrlModal() {
        var params = new URLSearchParams(location.search);
        var m = params.get('modal');
        if (m === 'connect') openConnect();
        else if (m === 'primary') openPrimary();
        else if (m === 'qr' && wallets[0]) openQr(wallets[0].id);
        else if (m === 'edit' && wallets[0]) openEdit(wallets[0].id);
        else if (m === 'unbind' && wallets[1]) openUnbind(wallets[1].id);
        else if (m === 'prefs') {
            var dd = document.querySelector('.set-pref-dd[data-pref="rechargeNetwork"]');
            if (dd) {
                dd.classList.add('open');
                syncPrefDdOpenState();
            }
        }
    }

    loadWallets();
    loadPrefs();
    renderWalletCards();
    initPrefDropdowns();
    bindEvents();
    applyUrlModal();
})();
