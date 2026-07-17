(function () {
    var ACCOUNTS = [
        { id: 'usdt', sym: 'USDT', name: 'USDT 账户', bal: 5816.4, mark: '₮', cls: 'usdt' },
        { id: 'usdc', sym: 'USDC', name: 'USDC 账户', bal: 1280.5, mark: '₵', cls: 'usdc' }
    ];

    var state = {
        from: ACCOUNTS[0],
        to: ACCOUNTS[1]
    };

    var fromTrig = document.getElementById('tfFromTrigger');
    var toTrig = document.getElementById('tfToTrigger');
    var fromPanel = document.getElementById('tfFromPanel');
    var toPanel = document.getElementById('tfToPanel');
    var fromDd = document.getElementById('tfDdFrom');
    var toDd = document.getElementById('tfDdTo');
    var amtInput = document.getElementById('tfAmtInput');
    var fillMax = document.getElementById('tfFillMax');
    var unitEl = document.getElementById('tfUnit');
    var availEl = document.getElementById('tfAvail');
    var kvFrom = document.getElementById('kvTfFrom');
    var kvTo = document.getElementById('kvTfTo');
    var kvAmt = document.getElementById('kvTfAmt');
    var kvRecv = document.getElementById('kvTfRecv');
    var btnSwap = document.getElementById('tfBtnSwap');
    var btnSubmit = document.getElementById('tfBtnSubmit');
    var toastEl = document.getElementById('tfToast');
    var successMask = document.getElementById('tfSuccessMask');

    function fmt(n) {
        var x = Number(n);
        if (!isFinite(x)) x = 0;
        return x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function parseAmt() {
        if (!amtInput) return 0;
        var v = parseFloat(String(amtInput.value || '').replace(/,/g, '').trim());
        return isNaN(v) ? 0 : v;
    }

    function showToast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        setTimeout(function () {
            toastEl.classList.remove('show');
        }, 2200);
    }

    function closePanels() {
        if (fromDd) fromDd.classList.remove('open');
        if (toDd) toDd.classList.remove('open');
        if (fromTrig) fromTrig.setAttribute('aria-expanded', 'false');
        if (toTrig) toTrig.setAttribute('aria-expanded', 'false');
    }

    function renderList(listEl, current, excludeId, onPick) {
        if (!listEl) return;
        listEl.innerHTML = '';
        ACCOUNTS.forEach(function (a) {
            if (excludeId && a.id === excludeId) return;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'fl-dd-item' + (current && current.id === a.id ? ' selected' : '');
            btn.innerHTML =
                '<span class="coin-ic ' +
                a.cls +
                '">' +
                a.mark +
                '</span><span class="mid"><span class="n">' +
                a.sym +
                '</span><span class="d">' +
                a.name +
                ' · 可用 ' +
                fmt(a.bal) +
                '</span></span><i class="fa-solid fa-check tick"></i>';
            btn.addEventListener('click', function () {
                onPick(a);
                closePanels();
                syncUI();
            });
            listEl.appendChild(btn);
        });
    }

    function syncTrigger(trig, acc) {
        if (!trig || !acc) return;
        var ic = trig.querySelector('.coin-ic');
        var n = trig.querySelector('.mid .n');
        var d = trig.querySelector('.mid .d');
        if (ic) {
            ic.className = 'coin-ic ' + acc.cls;
            ic.textContent = acc.mark;
        }
        if (n) n.textContent = acc.sym;
        if (d) d.textContent = acc.name + ' · 可用 ' + fmt(acc.bal);
        trig.classList.remove('is-empty');
        var mid = trig.querySelector('.mid');
        var ph = trig.querySelector('.ph');
        if (mid) mid.style.display = 'flex';
        if (ph) ph.style.display = 'none';
    }

    function syncUI() {
        syncTrigger(fromTrig, state.from);
        syncTrigger(toTrig, state.to);
        if (unitEl) unitEl.textContent = state.from.sym;
        if (availEl) availEl.textContent = '可用 ' + fmt(state.from.bal) + ' ' + state.from.sym;
        if (fillMax) fillMax.textContent = '全部 ' + fmt(state.from.bal) + ' ' + state.from.sym;

        var a = parseAmt();
        if (a > state.from.bal) {
            a = state.from.bal;
            if (amtInput) amtInput.value = fmt(a);
        }
        if (kvFrom) kvFrom.textContent = state.from.sym + ' 账户';
        if (kvTo) kvTo.textContent = state.to.sym + ' 账户';
        if (kvAmt) kvAmt.textContent = fmt(a) + ' ' + state.from.sym;
        if (kvRecv) kvRecv.textContent = fmt(a) + ' ' + state.to.sym;

        renderList(fromPanel && fromPanel.querySelector('.fl-dd-list'), state.from, state.to.id, function (acc) {
            state.from = acc;
            if (state.to.id === acc.id) {
                state.to = ACCOUNTS.find(function (x) {
                    return x.id !== acc.id;
                });
            }
        });
        renderList(toPanel && toPanel.querySelector('.fl-dd-list'), state.to, state.from.id, function (acc) {
            state.to = acc;
            if (state.from.id === acc.id) {
                state.from = ACCOUNTS.find(function (x) {
                    return x.id !== acc.id;
                });
            }
        });
    }

    function wireDd(wrap, trig) {
        if (!wrap || !trig) return;
        trig.addEventListener('click', function (e) {
            e.stopPropagation();
            var wasOpen = wrap.classList.contains('open');
            closePanels();
            if (!wasOpen) {
                wrap.classList.add('open');
                trig.setAttribute('aria-expanded', 'true');
                syncUI();
            }
        });
    }

    wireDd(fromDd, fromTrig);
    wireDd(toDd, toTrig);

    document.addEventListener('click', function (e) {
        if (fromDd && fromDd.contains(e.target)) return;
        if (toDd && toDd.contains(e.target)) return;
        closePanels();
    });

    if (btnSwap) {
        btnSwap.addEventListener('click', function () {
            var tmp = state.from;
            state.from = state.to;
            state.to = tmp;
            var a = parseAmt();
            if (a > state.from.bal && amtInput) amtInput.value = fmt(state.from.bal);
            syncUI();
            btnSwap.classList.add('spin');
            setTimeout(function () {
                btnSwap.classList.remove('spin');
            }, 320);
        });
    }

    if (amtInput) {
        amtInput.addEventListener('input', function () {
            var a = parseAmt();
            if (a > state.from.bal) amtInput.value = fmt(state.from.bal);
            syncUI();
        });
        amtInput.addEventListener('blur', function () {
            var a = parseAmt();
            if (a < 0 || isNaN(a)) a = 0;
            if (a > state.from.bal) a = state.from.bal;
            amtInput.value = fmt(a);
            syncUI();
        });
    }

    if (fillMax) {
        fillMax.addEventListener('click', function (e) {
            e.preventDefault();
            if (amtInput) amtInput.value = fmt(state.from.bal);
            syncUI();
        });
    }

    if (btnSubmit) {
        btnSubmit.addEventListener('click', function () {
            var a = parseAmt();
            if (!a || a <= 0) {
                showToast('请输入划转金额');
                return;
            }
            if (a > state.from.bal) {
                showToast('超出可用余额');
                return;
            }
            if (state.from.id === state.to.id) {
                showToast('转出与转入账户不能相同');
                return;
            }
            var fromSym = state.from.sym;
            var toSym = state.to.sym;
            state.from.bal = Math.round((state.from.bal - a) * 100) / 100;
            state.to.bal = Math.round((state.to.bal + a) * 100) / 100;
            if (amtInput) amtInput.value = '0.00';
            syncUI();
            if (successMask) {
                var line = document.getElementById('tfSuccessLine');
                if (line) {
                    line.textContent =
                        '已从 ' + fromSym + ' 账户划出 ' + fmt(a) + '，到账 ' + fmt(a) + ' ' + toSym;
                }
                successMask.classList.add('show');
            } else {
                showToast('划转成功（原型）');
            }
        });
    }

    var btnOk = document.getElementById('tfSuccessOk');
    if (btnOk && successMask) {
        btnOk.addEventListener('click', function () {
            successMask.classList.remove('show');
        });
    }
    var btnBack = document.getElementById('tfSuccessBack');
    if (btnBack) {
        btnBack.addEventListener('click', function () {
            location.href = 'wallet.html';
        });
    }

    if (amtInput) amtInput.value = '100.00';
    syncUI();
})();
